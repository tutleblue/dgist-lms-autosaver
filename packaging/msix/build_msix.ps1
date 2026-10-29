# Daling Microsoft Store 판(MSIX) 만들기 (+ 선택: 이 PC 에 시험 설치·점검)
#
#   # 이 PC 시험판: dist\Daling 을 MSIX 로 묶고 사설 인증서로 서명
#   powershell -ExecutionPolicy Bypass -File packaging\msix\build_msix.ps1
#   # PyInstaller 부터 다시 (dist\Daling 이 없거나 코드를 고쳤을 때)
#   powershell -ExecutionPolicy Bypass -File packaging\msix\build_msix.ps1 -Build
#   # 묶고 이 PC 에 설치한 뒤 패키지 안에서 --autosaver-smoke
#   powershell -ExecutionPolicy Bypass -File packaging\msix\build_msix.ps1 -Install -Smoke
#   # Store 제출판: 서명하지 않고(Store 가 서명) Partner Center 의 이름·게시자로 묶는다
#   powershell -ExecutionPolicy Bypass -File packaging\msix\build_msix.ps1 -Store -IdentityName "<Package/Identity/Name>" `
#     -Publisher "<Package/Identity/Publisher>" -PublisherDisplayName "<Package/Properties/PublisherDisplayName>"
#   # 시험판 지우기
#   powershell -ExecutionPolicy Bypass -File packaging\msix\build_msix.ps1 -Uninstall
#
# 순서: [1/6] EXE(dist\Daling) → [2/6] 묶음 폴더(build\msix\layout) → [3/6] 로고 배율표(resources.pri)
#       → [4/6] MakeAppx → [5/6] 서명 → [6/6] 설치·점검
# 준비물: MakeAppx·MakePri·SignTool. Windows SDK 가 깔려 있으면 그것을, 없으면 Microsoft 의 NuGet 패키지
#        Microsoft.Windows.SDK.BuildTools 를 build\msix-tools 에 한 번 받아 쓴다(22MB, Microsoft 서명 확인 뒤).
# 시험 설치 전에 한 번 (사용자가 직접, 관리자 PowerShell): 사설 인증서를 '이 컴퓨터'의 신뢰할 수 있는 사람에 넣는다.
#   Import-Certificate -FilePath packaging\daling-codesign.cer -CertStoreLocation Cert:\LocalMachine\TrustedPeople
#   MSIX 설치는 시스템 서비스(AppXSvc)가 검사해서 '현재 사용자' 저장소의 신뢰로는 안 된다 (0x800B0109).
# 주의: 이 파일은 UTF-8 BOM 으로 저장한다 (PowerShell 5.1 한글).
param(
  [switch]$Build,
  [switch]$Store,
  [string]$IdentityName = "jykim5215.Daling",
  [string]$Publisher = "CN=붕어빵 (jykim5215), O=jykim5215",
  [string]$PublisherDisplayName = "Daling",
  [switch]$Install,
  [switch]$Smoke,
  [switch]$Uninstall
)

$ErrorActionPreference = "Stop"
$msixDir = $PSScriptRoot
$packaging = Split-Path $msixDir -Parent
$proj = Split-Path $packaging -Parent
$dist = Join-Path $proj "dist\Daling"
$work = Join-Path $proj "build\msix"
$layout = Join-Path $work "layout"
$outDir = Join-Path $packaging "out"
# 인증서 이름(CN=붕어빵 …)은 만들 때 정해져 바꿀 수 없다. Store 제출판은 -Publisher 로 Store 값을 넘긴다
$certSubject = "CN=붕어빵 (jykim5215), O=jykim5215"
$buildToolsVersion = "10.0.26100.4654"

function Get-DalingPackage {
  Get-AppxPackage | Where-Object { $_.Name -eq $IdentityName }
}

if ($Uninstall) {
  $pkg = Get-DalingPackage
  if (-not $pkg) { "설치된 시험판이 없습니다 ($IdentityName)"; return }
  # 데이터(C:\lms-autosaver)는 패키지 밖이라 그대로 남는다. 패키지 전용 AppData(LMS 브라우저 등)만 같이 지워진다.
  Remove-AppxPackage -Package $pkg.PackageFullName
  "지움: $($pkg.PackageFullName)"
  return
}

# ---------- 도구 찾기 ----------
function Find-SdkTools {
  $names = @("makeappx.exe", "makepri.exe", "signtool.exe")
  # 1) Windows SDK (가장 새 판)
  $kits = "${env:ProgramFiles(x86)}\Windows Kits\10\bin"
  if (Test-Path $kits) {
    $dir = Get-ChildItem $kits -Directory | Where-Object { $_.Name -match '^10\.' } | Sort-Object { [version]$_.Name } -Descending |
      ForEach-Object { Join-Path $_.FullName "x64" } |
      Where-Object { $d = $_; @($names | Where-Object { Test-Path (Join-Path $d $_) }).Count -eq $names.Count } |
      Select-Object -First 1
    if ($dir) { return $dir }
  }
  # 2) 전에 받아 둔 NuGet 패키지
  $toolRoot = Join-Path $proj "build\msix-tools\$buildToolsVersion"
  $dir = Join-Path $toolRoot "bin\10.0.26100.0\x64"
  if (-not (Test-Path (Join-Path $dir "makeappx.exe"))) {
    # 3) Microsoft.Windows.SDK.BuildTools 를 nuget.org 에서 받는다 (SDK 전체 설치는 관리자 권한이 든다)
    # 함수 안의 그냥 문자열은 돌려주는 값에 섞이므로 Write-Host 로 찍는다
    Write-Host "  Windows SDK 가 없어 Microsoft.Windows.SDK.BuildTools $buildToolsVersion 을 받습니다 (22MB, 한 번만)"
    New-Item -ItemType Directory -Force $toolRoot | Out-Null
    $zip = Join-Path $toolRoot "buildtools.zip"
    $url = "https://api.nuget.org/v3-flatcontainer/microsoft.windows.sdk.buildtools/$buildToolsVersion/microsoft.windows.sdk.buildtools.$buildToolsVersion.nupkg"
    $old = $ProgressPreference; $ProgressPreference = "SilentlyContinue"
    try { Invoke-WebRequest -UseBasicParsing $url -OutFile $zip } finally { $ProgressPreference = $old }
    Expand-Archive $zip -DestinationPath $toolRoot -Force
    Remove-Item $zip -Force
  }
  # 받은 것이든 깔린 것이든 Microsoft 가 서명한 실행 파일인지 본다
  foreach ($n in $names) {
    $sig = Get-AuthenticodeSignature (Join-Path $dir $n)
    if ($sig.Status -ne "Valid" -or $sig.SignerCertificate.Subject -notmatch 'O=Microsoft Corporation') {
      throw "$n 서명이 Microsoft 것이 아닙니다 ($($sig.Status)): $dir"
    }
  }
  return $dir
}

Set-Location $proj
$version = (Get-Content (Join-Path $proj "VERSION") -Raw).Trim()
# MSIX 판은 네 자리. Store 는 마지막 자리를 자기가 쓰므로 0 이어야 한다
$parts = @($version.Split(".") | ForEach-Object { [int]$_ }) + @(0, 0, 0, 0)
$msixVersion = "{0}.{1}.{2}.0" -f $parts[0], $parts[1], $parts[2]
"버전: $version → MSIX $msixVersion"
if ($Store) { "Store 제출판: $IdentityName / $Publisher / $PublisherDisplayName (서명 안 함)" }

"[1/6] EXE"
if ($Build -or -not (Test-Path (Join-Path $dist "Daling.exe"))) {
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $packaging "build_installer.ps1") -Stage exe
  if ($LASTEXITCODE -ne 0) { throw "EXE 만들기 실패" }
} else {
  "  dist\Daling 을 그대로 씁니다 ($((Get-Item (Join-Path $dist 'Daling.exe')).LastWriteTime)). 코드를 고쳤으면 -Build"
}

"[2/6] 묶음 폴더"
$tools = Find-SdkTools
"  도구: $tools"
robocopy $dist $layout /MIR /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy 실패 ($LASTEXITCODE)" }
robocopy (Join-Path $msixDir "Assets") (Join-Path $layout "Assets") /MIR /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy 실패 ($LASTEXITCODE)" }
# XML 에 들어가는 값이라 & < > " 를 바꿔 넣는다
function Escape-Xml([string]$s) { [Security.SecurityElement]::Escape($s) }
$manifest = [IO.File]::ReadAllText((Join-Path $msixDir "AppxManifest.xml"), [Text.Encoding]::UTF8)
$manifest = $manifest.Replace("{{IDENTITY_NAME}}", (Escape-Xml $IdentityName)).Replace("{{PUBLISHER}}", (Escape-Xml $Publisher)).
  Replace("{{PUBLISHER_DISPLAY_NAME}}", (Escape-Xml $PublisherDisplayName)).Replace("{{VERSION}}", $msixVersion)
$utf8 = New-Object Text.UTF8Encoding $false
[IO.File]::WriteAllText((Join-Path $layout "AppxManifest.xml"), $manifest, $utf8)

"[3/6] 로고 배율표 (resources.pri)"
# Assets\Square44x44Logo.png 같은 이름은 실제 파일이 아니라 배율(scale-200)·크기(targetsize-32, altform-unplated) 판을
# 고르는 이름이다. resources.pri 가 없으면 Windows 가 그 판들을 못 찾아 작업 표시줄·시작 메뉴 아이콘이 빈다.
# _internal 의 수천 개 파일까지 색인하지 않게 매니페스트와 Assets 만 있는 폴더에서 만든다.
$priRoot = Join-Path $work "pri"
if (Test-Path $priRoot) { Remove-Item $priRoot -Recurse -Force }
New-Item -ItemType Directory -Force $priRoot | Out-Null
Copy-Item (Join-Path $layout "AppxManifest.xml") $priRoot
Copy-Item (Join-Path $layout "Assets") (Join-Path $priRoot "Assets") -Recurse
$priConfig = Join-Path $work "priconfig.xml"
& (Join-Path $tools "makepri.exe") createconfig /cf $priConfig /dq ko-KR /pv 10.0.0 /o | Out-Null
if ($LASTEXITCODE -ne 0) { throw "makepri createconfig 실패" }
& (Join-Path $tools "makepri.exe") new /pr $priRoot /cf $priConfig /mn (Join-Path $priRoot "AppxManifest.xml") /of (Join-Path $layout "resources.pri") /o | Out-Null
if ($LASTEXITCODE -ne 0) { throw "makepri new 실패" }

"[4/6] MakeAppx"
New-Item -ItemType Directory -Force $outDir | Out-Null
$suffix = ""
if ($Store) { $suffix = "-store" }
$msix = Join-Path $outDir "daling-$version-win-x64$suffix.msix"
$log = Join-Path $work "makeappx.log"
& (Join-Path $tools "makeappx.exe") pack /d $layout /p $msix /o > $log 2>&1
if ($LASTEXITCODE -ne 0) { Get-Content $log -Tail 30; throw "MakeAppx 실패 (전체 기록: $log)" }
"  $msix ($([math]::Round((Get-Item $msix).Length / 1MB, 1)) MB)"

"[5/6] 서명"
if ($Store) {
  "  Store 제출판은 서명하지 않습니다 (Partner Center 가 Microsoft 인증서로 다시 서명)"
} else {
  $cert = Get-ChildItem Cert:\CurrentUser\My -CodeSigningCert |
    Where-Object { $_.Subject -eq $certSubject -and $_.NotAfter -gt (Get-Date) -and $_.HasPrivateKey } |
    Sort-Object NotAfter -Descending | Select-Object -First 1
  if (-not $cert) { throw "사설 서명 인증서가 없습니다. 먼저 packaging\sign_tools.ps1 -New" }
  if ($Publisher -ne $certSubject) { throw "시험판 게시자($Publisher)가 인증서 주체($certSubject)와 다르면 설치가 거절됩니다" }
  # 타임스탬프 서버가 잠깐 안 될 때가 있어 몇 번 다시 하고, 끝내 안 되면 타임스탬프 없이 (시험판이라 괜찮다)
  $signed = $false
  for ($i = 1; $i -le 3 -and -not $signed; $i++) {
    & (Join-Path $tools "signtool.exe") sign /q /fd SHA256 /sha1 $cert.Thumbprint /tr "http://timestamp.digicert.com" /td SHA256 $msix
    $signed = ($LASTEXITCODE -eq 0)
    if (-not $signed) { Start-Sleep -Seconds 2 }
  }
  if (-not $signed) {
    & (Join-Path $tools "signtool.exe") sign /q /fd SHA256 /sha1 $cert.Thumbprint $msix
    if ($LASTEXITCODE -ne 0) { throw "MSIX 서명 실패" }
  }
  "  서명: $($cert.Thumbprint)"
}
$hash = (Get-FileHash $msix -Algorithm SHA256).Hash.ToLower()
[IO.File]::WriteAllText("$msix.sha256", "$hash  $(Split-Path $msix -Leaf)`n", $utf8)

if (-not $Install) { "완료 (설치는 -Install, 패키지 안 점검은 -Install -Smoke)"; return }

"[6/6] 이 PC 에 시험 설치"
if ($Store) { throw "Store 제출판(서명 없음)은 설치할 수 없습니다. -Store 없이 만든 시험판을 설치하세요" }
$trusted = @(Get-ChildItem Cert:\LocalMachine\TrustedPeople, Cert:\LocalMachine\Root -ErrorAction SilentlyContinue |
  Where-Object { $_.Thumbprint -eq $cert.Thumbprint })
if ($trusted.Count -eq 0) {
  "이 컴퓨터가 아직 사설 인증서를 믿지 않아 설치가 거절됩니다 (0x800B0109). 관리자 PowerShell 에서 한 번:"
  "  Import-Certificate -FilePath `"$(Join-Path $packaging 'daling-codesign.cer')`" -CertStoreLocation Cert:\LocalMachine\TrustedPeople"
  throw "인증서 신뢰 필요 (보안 설정이라 사용자가 직접)"
}
# 켜 둔 Daling 이 이 패키지면 닫고 바꾼다. 같은 데이터 폴더를 쓰는 Inno 설치판(Programs\Daling)은 따로 둔다
Add-AppxPackage -Path $msix -ForceApplicationShutdown -ForceUpdateFromAnyVersion
$pkg = Get-DalingPackage
"  설치: $($pkg.PackageFullName)"
"  위치: $($pkg.InstallLocation)"

if ($Smoke) {
  # 패키지 안에서 돌려야 가상화·읽기 전용 설치 폴더까지 함께 본다. 실행 별칭(daling.exe)은 패키지 신원을 붙여 켠다.
  $alias = Join-Path $env:LOCALAPPDATA "Microsoft\WindowsApps\daling.exe"
  if (-not (Test-Path $alias)) { throw "실행 별칭이 없습니다: $alias" }
  $out = Join-Path $work "smoke.txt"
  $p = Start-Process -FilePath $alias -ArgumentList "--autosaver-smoke" -RedirectStandardOutput $out -RedirectStandardError "$out.err" -Wait -PassThru -WindowStyle Hidden
  Get-Content $out -Encoding UTF8
  if ((Test-Path "$out.err") -and (Get-Item "$out.err").Length) { Get-Content "$out.err" -Encoding UTF8 }
  if ($p.ExitCode -ne 0) { throw "패키지 안 점검 실패 (종료 코드 $($p.ExitCode))" }
}
"완료"
