#!/bin/sh
# Daling 설치·업데이트 (macOS·Linux). 터미널에 붙여 넣기:
#
#   curl -fsSL https://gudaling.dev/install.sh | sh
#
# 왜 이 스크립트를 쓰나
#   맥 판은 공증이 없다(유료 Apple 개발자 계정이 필요, 서명은 사설 인증서나 ad-hoc). 브라우저로 받은 DMG 에는 격리 표시
#   (com.apple.quarantine)가 붙고, Gatekeeper 는 그 표시가 있는 앱을 공증으로 확인하려다 막는다.
#   curl 은 격리 표시를 붙이지 않는다. 그 대신 받은 파일이 GitHub 릴리스의 원본과 같은지 여기서 SHA-256 으로 확인한다.
#   리눅스는 서명 검사가 없지만, 실행 권한·앱 목록 등록·업데이트를 한 번에 해 준다.
#
# 하는 일: GitHub 릴리스에서 이 컴퓨터용 파일과 그 .sha256 을 받아 맞춰 보고 → 설치하고 → 켠다.
#   macOS: daling-<버전>-mac-arm64.dmg(M칩)·mac-x86_64.dmg(인텔) → /Applications/Daling.app (쓸 수 없으면 ~/Applications)
#   Linux: daling-<버전>-linux-x86_64.tar.gz  → 그 안의 install.sh (~/.local/opt/daling, 앱 목록, ~/.local/bin/daling)
#   설정·메일·받은 자료(맥 ~/Library/Application Support/Daling 또는 예전 ~/.lms-autosaver, 리눅스 ~/.lms-autosaver)는 건드리지 않는다. 다시 실행하면 최신 판으로 바꾼다.
#
# 맥 앱 안 업데이트도 이 파일을 쓴다 (앱에 묶여 있다, updater._start_mac_install). 그때 받는 환경 변수:
#   DALING_DMG=<앱이 받아 SHA-256 을 확인한 DMG>  DALING_DEST=<지금 앱이 있는 폴더>  DALING_UPDATE=1(앱이 꺼지기를 먼저 기다림)
#   DALING_HANDOFF=<옛 판이 새 판에 넘기려고 적은 키체인 값 파일(0600)> — 바꿔 끼우지 못하고 끝나면 지운다
#   DALING_NO_OPEN=1 이면 설치한 뒤 켜지 않는다 (CI 점검용)
#
# 주의: 파이프로 받는 동안 반쯤 받은 스크립트가 돌지 않게, 모든 일을 main 안에 두고 맨 끝에서 부른다.
set -eu

REPO="tutleblue/dgist-lms-autosaver"
UA="Daling-Installer"

case "${LC_ALL:-${LC_MESSAGES:-${LANG:-}}}" in
  ko*) KO=1 ;;
  *) KO=0 ;;
esac

# say "한국어" "English"
say() { if [ "$KO" = 1 ]; then printf '%s\n' "$1"; else printf '%s\n' "$2"; fi; }
die() {
  if [ "$KO" = 1 ]; then printf 'Daling 설치를 멈췄어요: %s\n' "$1" >&2; else printf 'Daling install stopped: %s\n' "$2" >&2; fi
  exit 1
}

fetch() { curl -fsSL --retry 3 --connect-timeout 20 -A "$UA" "$@"; }

# 이 컴퓨터용 파일의 내려받기 주소. $1 = 파일 이름 정규식(grep), $2 = 이름 틀({v} 자리에 버전)
# 1) API 목록에서 이 파일이 붙은 가장 새 릴리스 (맥·리눅스 파일은 Windows 보다 늦게 붙을 수 있다)
# 2) API 한도(같은 IP 에서 시간당 60번)에 걸리면 /releases/latest 의 태그로 이름을 맞춰 본다
find_url() {
  url="$(fetch -H "Accept: application/vnd.github+json" "https://api.github.com/repos/$REPO/releases?per_page=20" 2>/dev/null \
    | grep -o "\"browser_download_url\": *\"https://github.com/[^\"]*/$1\"" \
    | head -n 1 | sed 's/.*"\(https:[^"]*\)"$/\1/')" || url=""
  if [ -z "$url" ]; then
    tag="$(curl -fsSIL -o /dev/null -w '%{url_effective}' -A "$UA" "https://github.com/$REPO/releases/latest" 2>/dev/null | sed 's#.*/tag/##')" || tag=""
    ver="${tag#v}"
    case "$ver" in
      ''|*[!0-9.]*) url="" ;;
      *)
        url="https://github.com/$REPO/releases/download/$tag/$(printf '%s' "$2" | sed "s/{v}/$ver/")"
        curl -fsSIL -o /dev/null -A "$UA" "$url" 2>/dev/null || url=""
        ;;
    esac
  fi
  # $3·$4 = 못 찾았을 때 알릴 말(한국어·영어). 없으면 '잠시 뒤 다시'
  [ -n "$url" ] || die "${3:-GitHub 에서 설치 파일을 찾지 못했어요. 잠시 뒤 다시 해 주세요.}" \
                       "${4:-could not find the download on GitHub. Please try again later.}"
  printf '%s\n' "$url"
}

sha256_of() {
  if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1" | awk '{print $1}'
  else shasum -a 256 "$1" | awk '{print $1}'; fi
}

# $1 = 주소, $2 = 저장할 파일. 받은 뒤 $1.sha256 과 맞춰 본다. 맞지 않으면 설치하지 않는다.
download_verified() {
  say "내려받는 중: ${1##*/}" "Downloading ${1##*/}"
  curl -fL --retry 3 --connect-timeout 20 -A "$UA" --progress-bar -o "$2" "$1"
  want="$(fetch "$1.sha256" 2>/dev/null | awk '{print $1}' | tr 'A-F' 'a-f')" || want=""
  case "$want" in
    *[!0-9a-f]*|'') die "확인값(.sha256)을 받지 못해 설치하지 않았어요." "could not get the checksum (.sha256), so nothing was installed." ;;
  esac
  [ "${#want}" -eq 64 ] || die "확인값(.sha256)이 이상해서 설치하지 않았어요." "the checksum (.sha256) looks wrong, so nothing was installed."
  got="$(sha256_of "$2")"
  [ "$got" = "$want" ] || die "받은 파일이 원본과 달라요(SHA-256 불일치). 다시 해 주세요." "the download does not match the original (SHA-256 mismatch). Please try again."
  say "확인했어요 (SHA-256 일치)" "Verified (SHA-256 matches)"
}

daling_running() { pgrep -f "Daling.app/Contents/MacOS/Daling" >/dev/null 2>&1; }

# 본체(창)만. 작업 프로세스(--autosaver-job)는 본체가 꺼진 뒤에도 하던 일을 마저 한다.
# 둘을 같이 보면, 이미 꺼진 본체에 '종료' 를 보내 도로 켜지게 하거나(osascript) 작업을 중간에 끊었다.
daling_app_running() {
  pgrep -lf "Daling.app/Contents/MacOS/Daling" 2>/dev/null | grep -v -e '--autosaver-job' | grep -q .
}

# $1 초 동안 본체가 꺼지기를 기다린다
wait_app_quit() {
  i=0
  while daling_app_running && [ "$i" -lt "$1" ]; do sleep 1; i=$((i + 1)); done
}

# $1 초 동안 Daling(본체·작업 프로세스)이 다 꺼지기를 기다린다
wait_quit() {
  i=0
  while daling_running && [ "$i" -lt "$1" ]; do sleep 1; i=$((i + 1)); done
}

# 이 맥의 칩: arm64(M칩) 또는 x86_64(인텔). 로제타로 도는 터미널(uname -m 이 x86_64)이어도 M칩이면 arm64 를 고른다.
# hw.optional.arm64 는 인텔 맥에는 아예 없다 → 0 (updater._mac_arch 와 같은 규칙)
mac_arch() {
  if [ "$(sysctl -n hw.optional.arm64 2>/dev/null || echo 0)" = 1 ]; then echo arm64; else echo x86_64; fi
}

# 앱 안 업데이트: 옛 판(updater._mac_hand_off_secrets)이 키체인 값을 새 판에 넘기려고 적은 0600 파일.
# 바꿔 끼우지 못하고 끝나면 지운다 — 옛 판은 키체인을 그대로 읽고, 평문 파일이 다음 실행까지 남지 않게.
drop_handoff() {
  if [ "${swapped:-0}" != 1 ] && [ -n "${DALING_HANDOFF:-}" ]; then
    case "$DALING_HANDOFF" in */keychain-handoff.json) rm -f "$DALING_HANDOFF" ;; esac
  fi
  return 0
}

install_mac() {
  # 앱은 macOS 12 이상에서만 열린다 (Info.plist 의 LSMinimumSystemVersion). 그 아래면 깔기 전에 알린다.
  # 판을 못 읽으면(sw_vers 없음) 막지 않고 넘어간다
  os_ver="$(sw_vers -productVersion 2>/dev/null || true)"
  major="${os_ver%%.*}"
  case "$major" in
    ''|*[!0-9]*) ;;
    *) [ "$major" -ge 12 ] || die "macOS 12 이상에서만 돼요 (이 Mac 은 $os_ver)." "macOS 12 or later is required (this Mac has $os_ver)." ;;
  esac
  arch="$(mac_arch)"
  tmp="$(mktemp -d "${TMPDIR:-/tmp}/daling.XXXXXX")"
  mnt="$tmp/mnt"
  swapped=0
  trap 'hdiutil detach "$mnt" -quiet >/dev/null 2>&1 || true; rm -rf "$tmp"; drop_handoff' EXIT
  trap 'exit 130' INT TERM
  if [ -n "${DALING_DMG:-}" ]; then
    # 앱 안 업데이트(updater.py _start_mac_install): 앱이 이미 받아 SHA-256 을 확인한 DMG 를 쓴다
    [ -f "$DALING_DMG" ] || die "받아 둔 DMG 가 없어요: $DALING_DMG" "the downloaded DMG is missing: $DALING_DMG"
    dmg="$DALING_DMG"
    say "$(date '+%Y-%m-%d %H:%M:%S') 앱 안 업데이트: ${dmg##*/}" "$(date '+%Y-%m-%d %H:%M:%S') in-app update: ${dmg##*/}"
  else
    # 인텔 판(mac-x86_64)은 2026-10-21 부터 만든다. 그 전 릴리스만 있으면 인텔용 파일이 없다
    if [ "$arch" = x86_64 ]; then
      url="$(find_url 'daling-[0-9.]*-mac-x86_64\.dmg' 'daling-{v}-mac-x86_64.dmg' \
        "아직 인텔 Mac 용 파일이 올라오지 않았어요. 다음 버전부터 받을 수 있어요." \
        "the Intel Mac build has not been published yet. It will be in the next release.")"
    else
      url="$(find_url 'daling-[0-9.]*-mac-arm64\.dmg' 'daling-{v}-mac-arm64.dmg')"
    fi
    dmg="$tmp/${url##*/}"
    download_verified "$url" "$dmg"
  fi

  mkdir "$mnt"
  hdiutil attach -nobrowse -readonly -noautoopen -mountpoint "$mnt" "$dmg" >/dev/null </dev/null
  [ -d "$mnt/Daling.app" ] || die "DMG 안에 Daling.app 이 없어요." "Daling.app is missing from the DMG."

  # 놓을 곳: 앱 안 업데이트면 지금 앱이 있는 폴더 → 원래 깔려 있던 자리 → /Applications(관리자 계정은 암호 없이
  # 쓸 수 있다) → ~/Applications
  if [ -n "${DALING_DEST:-}" ] && [ -d "$DALING_DEST" ] && [ -w "$DALING_DEST" ]; then dest="$DALING_DEST"
  elif [ -d "$HOME/Applications/Daling.app" ] && [ ! -d /Applications/Daling.app ]; then dest="$HOME/Applications"
  elif [ -w /Applications ]; then dest=/Applications
  elif [ -d /Applications/Daling.app ]; then
    # 관리자가 아닌 계정: ~/Applications 에 깔면 Daling 이 둘이 되고 독·런치패드는 옛 판을 계속 연다
    die "/Applications 에 쓸 권한이 없어요. 관리자 계정에서 설치하거나 DMG 를 열어 직접 옮겨 주세요." \
        "no permission to write to /Applications. Install from an admin account, or open the DMG and drag Daling in."
  else dest="$HOME/Applications"; mkdir -p "$dest"; fi

  # 켜져 있으면 닫는다 (켜 둔 채 바꾸면 서명이 어긋나 다음 실행이 막힌다)
  if daling_running; then
    say "켜져 있는 Daling 을 닫는 중…" "Closing the running Daling…"
    # 앱 안 업데이트면 앱이 스스로 꺼지는 중이다. 꺼진 앱에 '종료' 를 보내면 도로 켜질 수 있어 먼저 기다린다
    [ "${DALING_UPDATE:-}" = 1 ] && wait_app_quit 15
    if daling_app_running; then
      osascript -e 'tell application id "app.daling.desktop" to quit' >/dev/null 2>&1 </dev/null || true
      wait_app_quit 20
    fi
    # 남은 작업 프로세스(동기화·Drive 올리기)는 끝나기를 더 기다린다. 그래도 남으면 그때 닫는다
    wait_quit 180
    pkill -f "Daling.app/Contents/MacOS/Daling" >/dev/null 2>&1 || true
    sleep 1
  fi

  # 새 판을 같은 폴더에 다 복사한 뒤 이름만 바꿔 끼운다 (어느 단계에서 실패해도 쓸 수 있는 판이 남게).
  # ditto 는 심볼릭 링크(Frameworks↔Resources)·확장 속성·서명을 그대로 옮긴다.
  rm -rf "$dest/.Daling.app.new" "$dest/.Daling.app.old"
  ditto "$mnt/Daling.app" "$dest/.Daling.app.new"
  hdiutil detach "$mnt" -quiet >/dev/null 2>&1 || true
  # 복사가 온전한지 (사설 인증서·ad-hoc 서명도 파일마다 해시를 담고 있다)
  codesign --verify --deep --strict "$dest/.Daling.app.new" >/dev/null 2>&1 \
    || die "새 판의 서명 확인에 실패했어요. 다시 해 주세요." "the new copy failed its signature check. Please try again."
  if [ -e "$dest/Daling.app" ]; then
    mv "$dest/Daling.app" "$dest/.Daling.app.old" \
      || die "예전 $dest/Daling.app 을 옮기지 못했어요. 휴지통으로 옮긴 뒤 다시 해 주세요." \
             "could not move the old $dest/Daling.app aside. Move it to the Trash and try again."
  fi
  mv "$dest/.Daling.app.new" "$dest/Daling.app"
  swapped=1
  rm -rf "$dest/.Daling.app.old" 2>/dev/null || true
  [ -n "${DALING_DMG:-}" ] && rm -f "$DALING_DMG"

  say "설치했어요: $dest/Daling.app" "Installed: $dest/Daling.app"
  [ "${DALING_NO_OPEN:-}" = 1 ] || open "$dest/Daling.app" </dev/null || true
}

install_linux() {
  [ "$(uname -m)" = x86_64 ] || die "x86_64(64비트 인텔·AMD) 리눅스만 지원해요." "only x86_64 Linux is supported."
  url="$(find_url 'daling-[0-9.]*-linux-x86_64\.tar\.gz' 'daling-{v}-linux-x86_64.tar.gz')"
  # 풀면 1GB 가까이 된다. /tmp 가 메모리(tmpfs)인 배포판(페도라 등)이 있어 사용자 캐시 폴더에서 푼다
  cache="${XDG_CACHE_HOME:-$HOME/.cache}"
  mkdir -p "$cache"
  tmp="$(mktemp -d "$cache/daling-install.XXXXXX")"
  trap 'rm -rf "$tmp"' EXIT
  trap 'exit 130' INT TERM
  tgz="$tmp/${url##*/}"
  download_verified "$url" "$tgz"
  tar -C "$tmp" -xzf "$tgz"
  inst="$(find "$tmp" -mindepth 2 -maxdepth 2 -name install.sh -type f | head -n 1)"
  [ -n "$inst" ] || die "압축 안에 install.sh 가 없어요." "install.sh is missing from the archive."
  # 켜져 있으면 install.sh 가 멈춘다 (켜 둔 채 바꾸면 돌던 작업 프로세스가 꼬인다)
  sh "$inst" </dev/null
  if [ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ] && [ -x "$HOME/.local/opt/daling/daling" ]; then
    nohup "$HOME/.local/opt/daling/daling" >/dev/null 2>&1 </dev/null &
  fi
}

main() {
  command -v curl >/dev/null 2>&1 || die "curl 이 필요해요." "curl is required."
  case "$(uname -s)" in
    Darwin) install_mac ;;
    Linux) install_linux ;;
    *) die "macOS·Linux 용이에요. Windows 는 PowerShell 에서: irm https://gudaling.dev/install.ps1 | iex" \
           "this is for macOS and Linux. On Windows, run in PowerShell: irm https://gudaling.dev/install.ps1 | iex" ;;
  esac
}

main "$@"
