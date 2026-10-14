# Daling 설치·업데이트 (Windows). PowerShell 에 붙여 넣기:
#
#   irm https://gudaling.dev/install.ps1 | iex
#
# 왜 이 스크립트를 쓰나
#   설치 파일에 공인 코드 서명이 아직 없어(SignPath Foundation 무료 서명 신청 중, CODE_SIGNING.md) 브라우저로 받으면
#   'Windows의 PC 보호'(SmartScreen) 창과 크롬의 파일 검사 경고가 뜬다. 이 경고는 브라우저가 받은 파일에 붙이는
#   '인터넷에서 받음' 표시(MOTW, Zone.Identifier)를 보고 뜬다. PowerShell 로 받은 파일에는 이 표시가 붙지 않는다.
#   그 대신 받은 파일이 GitHub 릴리스의 원본과 같은지 여기서 SHA-256(GitHub 이 자산마다 계산해 주는 digest)으로 확인한다.
#   Microsoft Defender 검사는 그대로 받는다. 스마트 앱 컨트롤이 켜진 PC 는 서명 없는 앱을 그래도 막는다(아래 안내).
#
# 하는 일: GitHub 릴리스에서 bungeoppang-<버전>-win-x64-setup.exe 를 받아 확인 → 설치 창을 띄운다(개인정보 안내·바로가기 고르기).
#   켜져 있는 Daling 은 설치 프로그램이 닫고 바꾼다. 설정·메일·받은 자료(C:\lms-autosaver)는 그대로다.
#
# 주의: 이 파일은 BOM 없는 UTF-8 이다 (CLAUDE.md 규칙 20 의 예외).
#   'irm | iex' 는 BOM 을 글자로 읽어 첫 줄이 깨진다(Windows PowerShell 5.1 에서 확인). 한글은 사이트가
#   'Content-Type: text/plain; charset=utf-8'(docs/_headers)로 내보내야 바르게 읽힌다.
#   파이프로 받는 동안 반쯤 받은 스크립트가 돌지 않게, 모든 일을 한 블록 안에 두고 맨 끝에서 부른다.
& {
  $ErrorActionPreference = 'Stop'
  # 5.1 의 진행 막대는 내려받기를 몇 배 느리게 만든다
  $ProgressPreference = 'SilentlyContinue'
  # 오래된 Windows 10 의 5.1 은 TLS 1.2 를 기본으로 켜지 않은 경우가 있다 (GitHub 은 1.2 이상만 받는다)
  [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

  # 표시 언어를 영어로 둔 한국 사용자도 많다(지역 형식만 한국어). 둘 중 하나라도 한국어면 한국어로
  $ko = ((Get-UICulture).Name -like 'ko*') -or ((Get-Culture).Name -like 'ko*')
  # 사이트가 charset 을 빼먹으면 5.1 은 이 파일을 Latin-1 로 읽어 한글이 깨진다(설치는 된다). 그때는 영어로
  if ('가'.Length -ne 1) { $ko = $false }
  function Say([string]$k, [string]$e, [string]$color = 'Gray') { Write-Host $(if ($ko) { $k } else { $e }) -ForegroundColor $color }

  $repo = 'tutleblue/dgist-lms-autosaver'
  $pattern = '^bungeoppang-[\d.]+-win-x64-setup\.exe$'
  $headers = @{ 'User-Agent' = 'Daling-Installer'; 'Accept' = 'application/vnd.github+json' }

  try {
    if (-not [Environment]::Is64BitOperatingSystem) {
      throw $(if ($ko) { '64비트 Windows 10·11 에서만 설치할 수 있어요.' } else { 'Daling needs 64-bit Windows 10 or 11.' })
    }

    Say '최신 버전을 확인하는 중…' 'Checking the latest version…'
    $name = $null; $url = $null; $want = ''; $tag = $null; $size = 0
    try {
      $releases = Invoke-RestMethod "https://api.github.com/repos/$repo/releases?per_page=10" -Headers $headers -UseBasicParsing
      foreach ($r in @($releases)) {
        if ($r.draft -or $r.prerelease) { continue }
        $a = @($r.assets) | Where-Object { $_.name -match $pattern } | Select-Object -First 1
        if ($a) {
          $tag = $r.tag_name; $name = $a.name; $url = $a.browser_download_url; $size = [long]$a.size
          $want = ([string]$a.digest -replace '^sha256:', '').ToLower()
          break
        }
      }
    } catch {
      # API 한도(로그인 없이 같은 IP 에서 시간당 60번)에 걸렸거나 잠깐 안 될 때. 학교처럼 여럿이 한 주소를 쓰면
      # 금방 찬다(2026-10-15 이 PC 에서도 걸렸다). 아래 길로 간다.
    }
    if (-not $url) {
      # /releases/latest 는 API 가 아니라 한도가 없다. 태그로 파일 이름을 맞추고, 확인값은 함께 올린 .sha256 에서 읽는다
      $req = [Net.HttpWebRequest]::Create("https://github.com/$repo/releases/latest")
      $req.Method = 'HEAD'; $req.UserAgent = 'Daling-Installer'
      $resp = $req.GetResponse(); $final = $resp.ResponseUri.AbsoluteUri; $resp.Close()
      if ($final -match '/tag/(v[\d.]+)$') {
        $tag = $Matches[1]
        $name = "bungeoppang-$($tag.TrimStart('v'))-win-x64-setup.exe"
        $url = "https://github.com/$repo/releases/download/$tag/$name"
        try {
          $wc = New-Object Net.WebClient
          $wc.Headers['User-Agent'] = 'Daling-Installer'
          $want = (($wc.DownloadString("$url.sha256").Trim() -split '\s+')[0]).ToLower()
        } catch { $want = '' }
      }
    }
    if (-not $url) { throw $(if ($ko) { 'GitHub 릴리스에서 설치 파일을 찾지 못했어요.' } else { 'Could not find the installer on GitHub Releases.' }) }
    if ($want -notmatch '^[0-9a-f]{64}$') {
      # 확인할 값이 없으면 받은 파일이 진짜인지 알 수 없다. 설치하지 않는다 (updater.py 와 같은 규칙)
      throw $(if ($ko) { '설치 파일의 확인값(SHA-256)을 받지 못해 설치하지 않았어요. 잠시 뒤 다시 해 주세요.' } else { 'Could not get the SHA-256 checksum, so nothing was installed. Please try again later.' })
    }

    $dir = Join-Path $env:TEMP 'daling-install'
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    $file = Join-Path $dir $name
    $mb = if ($size) { " ($([math]::Round($size / 1MB)) MB)" } else { '' }
    Say "내려받는 중: $name$mb" "Downloading $name$mb"
    Invoke-WebRequest $url -OutFile $file -UseBasicParsing -Headers @{ 'User-Agent' = 'Daling-Installer' }
    $got = (Get-FileHash $file -Algorithm SHA256).Hash.ToLower()
    if ($got -ne $want) {
      Remove-Item $file -Force -ErrorAction SilentlyContinue
      throw $(if ($ko) { '받은 파일이 원본과 달라요(SHA-256 불일치). 다시 해 주세요.' } else { 'The download does not match the original (SHA-256 mismatch). Please try again.' })
    }
    Say "확인했어요 (SHA-256 일치, $tag)" "Verified (SHA-256 matches, $tag)"

    # 스마트 앱 컨트롤(Windows 11)은 받은 경로와 상관없이 서명 없는 앱을 막는다. 미리 알려 둔다.
    $sac = $null
    try { $sac = (Get-MpComputerStatus -ErrorAction Stop).SmartAppControlState } catch { }
    if ("$sac" -eq 'On') {
      Say '스마트 앱 컨트롤이 켜져 있어 설치가 막힐 수 있어요. 공인 서명판이 나올 때까지는 Windows 보안 → 앱 및 브라우저 컨트롤에서 확인해 주세요.' `
          'Smart App Control is on and may block the installer until the signed build is out (Windows Security > App & browser control).' 'Yellow'
    }

    Say '설치 창을 여는 중… (끝나면 Daling 이 켜져요)' 'Opening the installer… (Daling starts when it finishes)'
    $p = Start-Process -FilePath $file -PassThru -Wait
    Remove-Item $file -Force -ErrorAction SilentlyContinue
    # Inno Setup 종료 코드: 0 완료, 2·5 사용자가 취소
    if ($p.ExitCode -eq 0) {
      Say '설치를 마쳤어요.' 'Daling is installed.' 'Green'
    } elseif ($p.ExitCode -in 2, 5) {
      Say '설치를 취소했어요.' 'Installation was cancelled.' 'Yellow'
    } else {
      throw $(if ($ko) { "설치 프로그램이 오류로 끝났어요 (코드 $($p.ExitCode))." } else { "The installer failed (exit code $($p.ExitCode))." })
    }
  } catch {
    $msg = $_.Exception.Message
    Say "Daling 설치를 멈췄어요: $msg" "Daling install stopped: $msg" 'Red'
    Say '직접 받기: https://gudaling.dev/#download' 'Manual download: https://gudaling.dev/#download'
  }
}
