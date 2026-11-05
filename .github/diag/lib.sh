# 맥 진단(mac-diagnose.yml) 단계들이 함께 쓰는 함수. 각 단계에서 `. .github/diag/lib.sh` 로 불러온다.
# 진짜 학교 서버에는 아무것도 보내지 않는다: 메일 서버는 127.0.0.1(닫힌 포트), LMS 는 fake_lms.py.

APP=/Applications/Daling.app
DATA="$HOME/Library/Application Support/Daling"
API="python3 $GITHUB_WORKSPACE/.github/diag/app_api.py"
LOGS="$GITHUB_WORKSPACE/logs"
mkdir -p "$LOGS"

verdict() {  # $1 장면, $2 항목, $3 결과 → 요약 표의 한 줄
  printf '| %s | %s | %s |\n' "$1" "$2" "$3" >> "$LOGS/verdicts.md"
  echo "판정 [$1] $2: $3"
}

install_release() {  # $1 태그 — 릴리스의 이 칩 DMG 를 받아 확인값을 맞추고 /Applications 에 깐다 (사용자가 하는 그대로)
  local tag=$1 v=${1#v} f mnt
  f="daling-$v-mac-$ARCH.dmg"
  curl -fsSL --retry 3 -o "$RUNNER_TEMP/$f" "https://github.com/$REPO/releases/download/$tag/$f"
  curl -fsSL --retry 3 -o "$RUNNER_TEMP/$f.sha256" "https://github.com/$REPO/releases/download/$tag/$f.sha256"
  (cd "$RUNNER_TEMP" && shasum -a 256 -c "$f.sha256")
  mnt="$(mktemp -d)"
  hdiutil attach -nobrowse -readonly -mountpoint "$mnt" "$RUNNER_TEMP/$f" > /dev/null
  rm -rf "$APP"
  ditto "$mnt/Daling.app" "$APP"
  hdiutil detach "$mnt" > /dev/null || hdiutil detach -force "$mnt" > /dev/null
  codesign --verify --deep --strict "$APP"
  echo "깐 판: $(defaults read "$APP/Contents/Info.plist" CFBundleShortVersionString) · $(lipo -archs "$APP/Contents/MacOS/Daling")"
}

install_dmg() {  # $1 DMG 경로 — 이 브랜치를 묶은 앱(mac.yml 아티팩트)을 /Applications 에 깐다
  local mnt
  mnt="$(mktemp -d)"
  hdiutil attach -nobrowse -readonly -mountpoint "$mnt" "$1" > /dev/null
  rm -rf "$APP"
  ditto "$mnt/Daling.app" "$APP"
  hdiutil detach "$mnt" > /dev/null || hdiutil detach -force "$mnt" > /dev/null
  codesign --verify --deep --strict "$APP"
  echo "깐 판(브랜치): $(defaults read "$APP/Contents/Info.plist" CFBundleShortVersionString) · $(lipo -archs "$APP/Contents/MacOS/Daling")"
}

mail_probe() {  # $1 장면, $2 시간 제한 — 판정 없이 MAIL_RESULT 에 hang|old-message|keychain-message|refused|other
  local scene=$1 limit=${2:-30} start
  guard_fake_targets > /dev/null
  start="$($API post /api/refresh-emails '{}' "$limit")"
  echo "$start" | cut -c1-400 | tee "$LOGS/$scene-mail-start.txt"
  MAIL_TEXT="$(echo "$start" | cut -c1-300)"
  case "$start" in
    "HTTP 0 "*) MAIL_RESULT=hang; return 0 ;;
    *"계정을 먼저 입력"*) MAIL_RESULT=old-message; return 0 ;;
    *"키체인"*) MAIL_RESULT=keychain-message; return 0 ;;
  esac
  $API wait mail 120 "$LOGS/$scene-mail.json" > /dev/null
  if grep -E -q 'Connection refused|Errno 61|연결을 거부|refused' "$LOGS/$scene-mail.json"; then MAIL_RESULT=refused
  elif grep -q '키체인' "$LOGS/$scene-mail.json"; then MAIL_RESULT=keychain-message
  elif grep -q '계정을 먼저 입력' "$LOGS/$scene-mail.json"; then MAIL_RESULT=old-message
  else MAIL_RESULT=other; fi
}

start_app() {  # Finder 에서 켜듯 open 으로. $1 = 장면 이름(멈추면 화면을 찍는다)
  open "$APP"
  if ! $API port 60 > /dev/null; then
    screencapture -x "$LOGS/$1-start-stuck.png" 2>/dev/null || true
    echo "::warning::[$1] 60초 안에 화면 서버가 뜨지 않음 (화면: $1-start-stuck.png)"
    return 1
  fi
  echo "화면 서버 포트 $($API port)"
}

stop_app() {
  pkill -TERM -f "$APP/Contents/MacOS/Daling" || true
  for _ in $(seq 1 20); do pgrep -f "$APP/Contents/MacOS/Daling" > /dev/null || return 0; sleep 1; done
  pkill -KILL -f "$APP/Contents/MacOS/Daling" || true
}

FAKE_LMS=http://127.0.0.1:8899

preseed_config() {  # 앱을 처음 켜기 전에 가짜 서버 주소를 넣어 둔다 — 자동 실행이 진짜 서버로 가지 않게
  mkdir -p "$DATA"
  printf '{"LMS_URL": "%s", "LOGIN_URL": "%s/login", "SCHOOL_IMAP_HOST": "127.0.0.1"}\n' "$FAKE_LMS" "$FAKE_LMS" > "$DATA/config.json"
}

save_settings() {  # 가짜 계정과 가짜 서버 주소를 한 번에. 메일 서버 127.0.0.1 은 993 이 닫혀 있어 '연결 거부' 가 나야 한다
  $API post /api/config "{\"lmsId\":\"diag-user\",\"lmsPassword\":\"diag-lms-pass-1\",\"schoolEmail\":\"diag@example.com\",\"schoolEmailPassword\":\"diag-mail-pass-2\",\"schoolImapHost\":\"127.0.0.1\",\"lmsUrl\":\"$FAKE_LMS\",\"loginUrl\":\"$FAKE_LMS/login\"}" \
    | cut -c1-160
}

guard_fake_targets() {  # 진짜 학교 서버로 갈 수 있으면 멈춘다
  python3 - "$DATA/config.json" "$FAKE_LMS" <<'PY'
import json, sys
cfg = json.load(open(sys.argv[1], encoding="utf-8"))
fake = sys.argv[2]
bad = [k for k, ok in (("SCHOOL_IMAP_HOST", cfg.get("SCHOOL_IMAP_HOST") == "127.0.0.1"),
                       ("LMS_URL", cfg.get("LMS_URL") == fake),
                       ("LOGIN_URL", str(cfg.get("LOGIN_URL", "")).startswith(fake))) if not ok]
if bad:
    sys.exit(f"::error::진짜 서버로 갈 수 있어 멈춤: {bad}")
print("가짜 서버 주소 확인:", cfg["SCHOOL_IMAP_HOST"], cfg["LMS_URL"])
PY
}

mail_check() {  # $1 장면, $2 요청 시간 제한(초)
  local scene=$1 limit=${2:-30} start
  guard_fake_targets
  start="$($API post /api/refresh-emails '{}' "$limit")"
  echo "$start" | cut -c1-300 | tee "$LOGS/$scene-mail-start.txt"
  case "$start" in
    "HTTP 0 "*)
      screencapture -x "$LOGS/$scene-mail-stuck.png" 2>/dev/null || true
      verdict "$scene" "메일 새로고침 요청" "❌ ${limit}초 넘게 응답 없음 (키체인 창을 기다리는 듯, 화면: $scene-mail-stuck.png)"
      return 0 ;;
    *"계정을 먼저 입력"*)
      verdict "$scene" "메일 새로고침 요청" "❌ '계정을 먼저 입력' — 화면 프로세스가 키체인에서 비밀번호를 못 읽음"
      return 0 ;;
  esac
  $API wait mail 120 "$LOGS/$scene-mail.json"
  if grep -E -q 'Connection refused|Errno 61|연결을 거부|refused' "$LOGS/$scene-mail.json"; then
    verdict "$scene" "메일 (서버 127.0.0.1)" "✅ 비밀번호를 읽고 서버에 붙으러 감 → 닫힌 포트라 연결 거부 (정상)"
  elif grep -q '계정을 먼저 입력' "$LOGS/$scene-mail.json"; then
    verdict "$scene" "메일 (서버 127.0.0.1)" "❌ 작업 중 '계정을 먼저 입력' — 키체인에서 비밀번호를 못 읽음"
  else
    verdict "$scene" "메일 (서버 127.0.0.1)" "❓ 예상 밖 — $scene-mail.json 확인"
  fi
}

lms_check() {  # $1 장면 — fake_lms 로 빠른 동기화. 브라우저 받기·띄우기·작업 프로세스의 키체인 읽기까지
  local scene=$1 rec="$LOGS/fake-lms.json" before
  guard_fake_targets
  # 앞 장면의 로그인 기록과 섞이지 않게 이번에 들어온 것만 본다
  before="$(python3 -c "import json,sys; print(len(json.load(open(sys.argv[1]))['posts']))" "$rec" 2>/dev/null || echo 0)"
  $API post /api/run '{"confirm":true,"mode":"fast"}' | cut -c1-200
  $API wait main 1080 "$LOGS/$scene-sync.json"
  if grep -q 'LMS 접속 브라우저' "$LOGS/$scene-sync.json"; then
    verdict "$scene" "LMS 브라우저" "✅ $(grep -o 'LMS 접속 브라우저: [^"]*' "$LOGS/$scene-sync.json" | head -1)"
  elif grep -q '브라우저' "$LOGS/$scene-sync.json"; then
    verdict "$scene" "LMS 브라우저" "❌ 받기·띄우기 실패 — $(grep -o '[^"]*브라우저[^"]*' "$LOGS/$scene-sync.json" | tail -1 | cut -c1-120)"
  else
    verdict "$scene" "LMS 브라우저" "❓ 브라우저 단계까지 못 감 — $scene-sync.json 확인"
  fi
  if python3 -c "import json,sys; p=json.load(open(sys.argv[1]))['posts'][int(sys.argv[2]):]; sys.exit(0 if any(x['accepted'] for x in p) else 1)" "$rec" "$before" 2>/dev/null; then
    verdict "$scene" "LMS 로그인 (가짜 LMS)" "✅ 작업 프로세스가 키체인의 비밀번호를 그대로 입력함"
  else
    verdict "$scene" "LMS 로그인 (가짜 LMS)" "❌ $(python3 -c "import json,sys; p=json.load(open(sys.argv[1]))['posts'][int(sys.argv[2]):]; print('입력 없음' if not p else '받은 것: ' + json.dumps(p[-1], ensure_ascii=False))" "$rec" "$before" 2>/dev/null || echo '기록 없음') · 작업 기록 끝: $(python3 -c "import json,sys; print((json.load(open(sys.argv[1])).get('logs') or [''])[-1])" "$LOGS/$scene-sync.json" 2>/dev/null | cut -c1-140)"
  fi
}
