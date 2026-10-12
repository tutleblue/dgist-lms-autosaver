#!/bin/sh
# Daling 을 이 사용자 계정에만 설치한다 (관리자 권한 필요 없음). AppImage 를 못 쓰는 곳을 위한 tar.gz 판.
#
#   sh install.sh               설치·업데이트 (같은 자리에 덮어씀)
#   sh install.sh --uninstall   프로그램만 지움 (설정·메일·받은 자료가 있는 ~/.lms-autosaver 는 그대로)
#
# 놓는 곳
#   ~/.local/opt/daling/                          프로그램 (이 압축의 daling 폴더 그대로)
#   ~/.local/bin/daling                           실행 링크 (터미널에서 daling)
#   ~/.local/share/applications/daling.desktop    앱 목록 항목 (Exec 는 위 프로그램의 절대 경로)
#   ~/.local/share/icons/hicolor/<크기>/apps/daling.png
set -eu

HERE="$(cd "$(dirname "$0")" && pwd)"
DATA="${XDG_DATA_HOME:-$HOME/.local/share}"
OPT="$HOME/.local/opt/daling"
BIN="$HOME/.local/bin"
APPS="$DATA/applications"
ICONS="$DATA/icons/hicolor"

refresh() {
  # 없어도 된다. 있으면 앱 목록·아이콘이 바로 바뀐다
  if command -v update-desktop-database >/dev/null 2>&1; then update-desktop-database -q "$APPS" 2>/dev/null || true; fi
  if command -v gtk-update-icon-cache >/dev/null 2>&1; then gtk-update-icon-cache -q -t "$ICONS" 2>/dev/null || true; fi
}

running() {
  command -v pgrep >/dev/null 2>&1 && pgrep -f "$OPT/daling" >/dev/null 2>&1
}

if [ "${1:-}" = "--uninstall" ]; then
  if running; then echo "Daling 이 켜져 있습니다. 끈 뒤 다시 실행해 주세요." >&2; exit 1; fi
  rm -rf "$OPT"
  if [ -L "$BIN/daling" ]; then rm -f "$BIN/daling"; fi
  rm -f "$APPS/daling.desktop"
  for s in 128 256 512; do rm -f "$ICONS/${s}x${s}/apps/daling.png"; done
  refresh
  echo "Daling 을 지웠습니다. 설정·메일·받은 자료(~/.lms-autosaver)는 그대로 두었습니다."
  exit 0
fi

if [ ! -f "$HERE/daling/daling" ]; then
  echo "이 폴더에 daling/daling 이 없습니다. 압축을 푼 폴더에서 실행해 주세요." >&2
  exit 1
fi
# 켜 둔 채 파일을 바꾸면 돌던 앱의 작업 프로세스가 꼬인다
if running; then echo "Daling 이 켜져 있습니다. 끈 뒤 다시 실행해 주세요." >&2; exit 1; fi

mkdir -p "$(dirname "$OPT")" "$BIN" "$APPS"
# 새 판을 옆에 다 복사한 뒤 바꿔 끼운다 (중간에 실패해도 예전 판이 남게). -a: 심볼릭 링크·실행 권한 그대로
rm -rf "$OPT.new"
cp -a "$HERE/daling" "$OPT.new"
chmod 755 "$OPT.new/daling"
# Playwright 의 node 는 데이터 파일로 묶여 실행 권한이 빠질 수 있다 (LMS 로그인용 브라우저를 받고 띄우는 데 쓴다)
find "$OPT.new" -path "*/playwright/driver/node" -type f -exec chmod 755 {} +
rm -rf "$OPT"
mv "$OPT.new" "$OPT"
ln -sfn "$OPT/daling" "$BIN/daling"

for s in 128 256 512; do
  if [ -f "$HERE/daling-$s.png" ]; then
    mkdir -p "$ICONS/${s}x${s}/apps"
    cp "$HERE/daling-$s.png" "$ICONS/${s}x${s}/apps/daling.png"
  fi
done

# 앱 목록 항목: Exec 만 절대 경로로 바꾼다 (~/.local/bin 이 데스크톱 세션의 PATH 에 없는 배포판이 있다).
# 경로에 빈칸이 있어도 되게 따옴표로 감싸고, 그 안에서 특별한 글자(\ " ` $)는 데스크톱 항목 규칙대로 막는다.
EXEC="$(printf '%s' "$OPT/daling" | sed 's/[\\"`$]/\\\\&/g')"
{
  grep -v '^Exec=' "$HERE/daling.desktop"
  printf 'Exec="%s"\n' "$EXEC"
} > "$APPS/daling.desktop.tmp"
chmod 644 "$APPS/daling.desktop.tmp"
mv "$APPS/daling.desktop.tmp" "$APPS/daling.desktop"
refresh

echo "Daling 을 설치했습니다: $OPT"
echo "앱 목록에서 Daling 을 찾거나 터미널에서 daling 으로 켜세요."
case ":$PATH:" in
  *":$BIN:"*) ;;
  *) echo "(~/.local/bin 이 PATH 에 없어서 터미널에서는 $BIN/daling 으로 켜야 합니다)" ;;
esac
