# Daling 설치 파일 만들기 (+ 선택: 이 PC에 바로 설치)
#
#   powershell -ExecutionPolicy Bypass -File packaging\build_installer.ps1
#   powershell -ExecutionPolicy Bypass -File packaging\build_installer.ps1 -Install
#
# 순서: PyInstaller(onedir) → 불필요한 파일 정리 → payload 복사 → Inno Setup → (설치·실행)
# 준비물: 프로젝트 .venv (Python 3.14), Inno Setup 6, packaging\MicrosoftEdgeWebview2Setup.exe
# 주의: 이 파일은 UTF-8 BOM 으로 저장해야 한다. BOM 이 없으면 Windows PowerShell 5.1 이
#       한글을 깨뜨려 구문 오류가 난다.
#
# GitHub Actions(.github/workflows/release.yml)는 SignPath 서명을 사이에 끼우려고 두 번에 나눠 부른다:
#   -Stage exe        → [1/5]~[2/5] 만 (dist\Daling 을 만든다. 여기서 EXE 를 서명)
#   -Stage installer  → [3/5]~[4/5] 만 (서명된 dist\Daling 으로 설치 파일을 만든다)
param([switch]$Install, [ValidateSet("all", "exe", "installer")][string]$Stage = "all")

$ErrorActionPreference = "Stop"
$packaging = $PSScriptRoot
$proj = Split-Path $packaging -Parent
$payload = Join-Path $packaging "payload"
# 이 PC 는 저장소 .venv, CI 는 setup-python 이 깐 python
$py = if (Test-Path (Join-Path $proj ".venv\Scripts\python.exe")) { Join-Path $proj ".venv\Scripts\python.exe" } else { "python" }
$signTool = Join-Path $packaging "sign_tools.ps1"
# 인증서 이름(CN=붕어빵 …)은 만들 때 정해져 바꿀 수 없다. 새 인증서로 바꾸면 이 PC 의 신뢰·Store 시험판 게시자도 새로 맞춰야 한다
$canSign = [bool](Get-ChildItem Cert:\CurrentUser\My -CodeSigningCert | Where-Object { $_.Subject -eq "CN=붕어빵 (jykim5215), O=jykim5215" -and $_.NotAfter -gt (Get-Date) -and $_.HasPrivateKey })

Set-Location $proj
if ($Stage -ne "installer") {
"[1/5] PyInstaller"
& $py -m PyInstaller daling.spec --noconfirm | Select-Object -Last 3
if ($LASTEXITCODE -ne 0) { throw "PyInstaller 실패" }

"[2/5] 불필요한 파일 정리"
$internal = Join-Path $proj "dist\Daling\_internal"
# 구글 API 설명 파일은 수백 개인데 쓰는 것은 넷뿐이다
Get-ChildItem -Path $internal -Recurse -Directory -Filter "discovery_cache" -ErrorAction SilentlyContinue | ForEach-Object {
  $docs = Join-Path $_.FullName "documents"
  if (Test-Path $docs) {
    Get-ChildItem $docs -File | Where-Object { $_.Name -notmatch '^(calendar\.v3|drive\.v3|drive\.v2|oauth2\.v2)\.json$' } | Remove-Item -Force
  }
}
Get-ChildItem -Path $internal -Recurse -File -Filter "pywebview-android.jar" -ErrorAction SilentlyContinue | Remove-Item -Force
# Playwright 드라이버 중 앱이 안 쓰는 트레이스 뷰어·타입 선언 (~5MB)
foreach ($rel in @("playwright\driver\package\lib\vite", "playwright\driver\package\types")) {
  $p = Join-Path $internal $rel
  if (Test-Path $p) { Remove-Item $p -Recurse -Force }
}
# 주의: pythonnet 의 runtimes\win-arm64 등은 지우면 안 된다 (pywebview 가 깨진다)

# 사설 코드 서명 (이 PC 에 인증서가 있을 때만. 만들기: sign_tools.ps1 -New).
# CI 에는 인증서가 없으므로 건너뛰고, 대신 SignPath 가 공인 인증서로 서명한다.
if ($canSign) {
  & powershell -NoProfile -ExecutionPolicy Bypass -File $signTool -Sign (Join-Path $proj "dist\Daling\Daling.exe")
  if ($LASTEXITCODE -ne 0) { throw "EXE 서명 실패" }
} else { "사설 서명 인증서 없음 — 서명 없이 만듭니다" }
}
if ($Stage -eq "exe") { "완료 (dist\Daling)"; return }

"[3/5] payload 복사"
robocopy (Join-Path $proj "dist\Daling") $payload /MIR /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy 실패 ($LASTEXITCODE)" }

"[4/5] Inno Setup"
$iscc = @(
  "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
  "C:\Program Files\Inno Setup 6\ISCC.exe",
  "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $iscc) { throw "ISCC.exe 를 찾지 못했습니다 (Inno Setup 6 설치 필요)" }
Set-Location $packaging
$version = (Get-Content (Join-Path $proj "VERSION") -Raw).Trim()
"버전: $version"
if ($canSign) {
  # Inno 가 $f 를 서명할 파일 경로(따옴표 포함)로, $q 를 따옴표로 바꿔 부른다
  & $iscc "/DAppVersion=$version" "/DSign" "/Sbpsign=powershell.exe -NoProfile -ExecutionPolicy Bypass -File `$q$signTool`$q -Sign `$f" "daling.iss" /Q
} else {
  & $iscc "/DAppVersion=$version" "daling.iss" /Q
}
if ($LASTEXITCODE -ne 0) { throw "ISCC 실패" }
$setup = Get-Item (Join-Path $packaging "out\daling-$version-win-x64-setup.exe")
"설치 파일: $($setup.FullName) ($([math]::Round($setup.Length / 1MB, 1)) MB)"
# 확인값 파일 (sha256sum 형식). 릴리스에 설치 파일과 함께 올린다: 한 줄 설치(docs/install.ps1)가 GitHub API 한도에
# 걸리면 API 의 digest 대신 이것으로 받은 파일을 확인한다. CI 는 SignPath 서명 뒤에 다시 만든다 (release.yml).
$hash = (Get-FileHash $setup.FullName -Algorithm SHA256).Hash.ToLower()
[IO.File]::WriteAllText("$($setup.FullName).sha256", "$hash  $($setup.Name)`n", (New-Object Text.UTF8Encoding $false))
"확인값: $($setup.Name).sha256"
# 예전 이름(bungeoppang-…)의 같은 파일. 1.12.52 이하의 앱 안 업데이트(updater.ASSET_PATTERN)와 예전 한 줄 설치는
# 이 이름만 찾는다. 릴리스에 함께 올려야 이미 설치한 사람이 새 이름 판으로 넘어온다
$legacy = Join-Path $setup.DirectoryName "bungeoppang-$version-win-x64-setup.exe"
Copy-Item $setup.FullName $legacy -Force
[IO.File]::WriteAllText("$legacy.sha256", "$hash  $(Split-Path $legacy -Leaf)`n", (New-Object Text.UTF8Encoding $false))
"예전 이름 사본: $(Split-Path $legacy -Leaf) (+ .sha256)"

if (-not $Install) { "완료 (설치는 -Install 로)"; return }

"[5/5] 이 PC 에 설치"
# 이 PC 의 설치판만 닫는다. 이름으로만 고르면 같은 exe 이름의 Store 판(MSIX)까지 작업 도중에 꺼졌다.
# 1.12.52 이하의 예전 설치 폴더(Programs\붕어빵)도 함께 본다. 설치 파일이 그 폴더를 지운다
$installDirs = @((Join-Path $env:LOCALAPPDATA "Programs\Daling\"), (Join-Path $env:LOCALAPPDATA "Programs\붕어빵\"))
Get-Process -Name "Daling", "붕어빵" -ErrorAction SilentlyContinue |
  Where-Object { $path = $_.Path; $path -and ($installDirs | Where-Object { $path.StartsWith($_, [StringComparison]::OrdinalIgnoreCase) }) } |
  Stop-Process -Force
Start-Sleep -Seconds 2
$p = Start-Process -FilePath $setup.FullName -ArgumentList "/VERYSILENT /SUPPRESSMSGBOXES /NORESTART /TASKS=desktopicon" -Wait -PassThru
"설치 종료코드: $($p.ExitCode)"
Start-Process -FilePath "$env:LOCALAPPDATA\Programs\Daling\Daling.exe"
"완료"
