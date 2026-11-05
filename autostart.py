"""컴퓨터에 로그인할 때 Daling 을 함께 켜기 — 맥·리눅스.

Windows 는 설치 파일의 '시작 시 자동 실행'(시작프로그램 바로가기, daling.iss startupicon)·Store 판의
startupTask 가 맡아 여기서 다루지 않는다. 맥·리눅스는 그런 길이 없어 '자동으로 가져오기' 가 앱을 직접 켤 때만 돌았다
(2026-10-21 맥·리눅스 점검 5번). 설정 › 자동으로 가져오기의 스위치가 아래 파일 하나를 만들거나 지운다.

  맥     ~/Library/LaunchAgents/app.daling.desktop.autostart.plist  (RunAtLoad, Daling.app 안의 실행 파일)
  리눅스 ~/.config/autostart/daling.desktop                          (XDG 자동 시작, AppImage 면 그 파일)

앱 묶음(.app) 안이 아니라 운영체제가 정한 사용자 자리에 쓴다 — 묶음 안에 쓰면 맥 서명이 깨진다(CLAUDE.md 30).
"""
from __future__ import annotations

import os
import plistlib
import sys
from pathlib import Path

LABEL = "app.daling.desktop.autostart"
BUNDLE_ID = "app.daling.desktop"


def _is_linux() -> bool:
    return sys.platform.startswith("linux")


def _mac_bundle() -> Path | None:
    for parent in Path(sys.executable).resolve().parents:
        if parent.suffix == ".app":
            return parent
    return None


def _target() -> Path | None:
    """자동으로 켤 것. 맥은 Daling.app, 리눅스는 AppImage 파일 또는 묶은 실행 파일. 소스로 돌리면 없음."""
    if not getattr(sys, "frozen", False):
        return None
    if sys.platform == "darwin":
        return _mac_bundle()
    if _is_linux():
        appimage = os.environ.get("APPIMAGE", "")
        # AppImage 안의 실행 파일은 마운트가 풀리면 사라진다 — .AppImage 파일을 켜야 한다
        return Path(appimage) if appimage else Path(sys.executable).resolve()
    return None


def entry_path() -> Path | None:
    """만들 파일 자리. 지원하지 않는 운영체제면 None."""
    if sys.platform == "darwin":
        return Path.home() / "Library" / "LaunchAgents" / f"{LABEL}.plist"
    if _is_linux():
        base = Path(os.environ.get("XDG_CONFIG_HOME") or Path.home() / ".config")
        return base / "autostart" / "daling.desktop"
    return None


def supported() -> bool:
    return entry_path() is not None and _target() is not None


def enabled() -> bool:
    path = entry_path()
    return bool(path and path.is_file())


def _blocked_reason(target: Path) -> str:
    """켤 수 없는 자리에서 돌고 있으면 그 까닭."""
    text = str(target)
    if sys.platform == "darwin" and (text.startswith("/Volumes/") or "/AppTranslocation/" in text):
        # DMG 를 연 채로, 또는 옮기지 않고 켠 앱은 다음 로그인 때 그 자리가 없다
        return "Daling 을 응용 프로그램 폴더로 옮겨 켠 뒤 다시 켜 주세요."
    if _is_linux() and "/.mount_" in text:
        return "AppImage 파일 자리를 찾지 못했어요."
    return ""


def _desktop_quote(path: str) -> str:
    # 데스크톱 항목 규칙: 따옴표 안에서 " ` $ 는 \\" 처럼(값을 읽을 때 \\ 가 \ 로 먼저 풀린다), 역슬래시 하나는 \\\\
    return '"' + "".join("\\" * 4 if ch == "\\" else "\\\\" + ch if ch in '"`$' else ch for ch in path) + '"'


def _entry_bytes(target: Path) -> bytes:
    if sys.platform == "darwin":
        executable = target / "Contents" / "MacOS" / "Daling"
        plist = {
            "Label": LABEL,
            "ProgramArguments": [str(executable)],
            "RunAtLoad": True,
            "LimitLoadToSessionType": "Aqua",
            # macOS 13+ '로그인 항목' 목록에 'Daling' 이름·아이콘으로 보이게
            "AssociatedBundleIdentifiers": [BUNDLE_ID],
        }
        return plistlib.dumps(plist)
    lines = [
        "[Desktop Entry]",
        "Type=Application",
        "Name=Daling",
        "Comment=LMS materials, assignment deadlines and school mail in one place",
        "Comment[ko]=LMS 강의자료·과제 마감·학교 메일을 한곳에서",
        f"Exec={_desktop_quote(str(target))}",
        "Icon=daling",
        "Terminal=false",
        "X-GNOME-Autostart-enabled=true",
    ]
    return ("\n".join(lines) + "\n").encode("utf-8")


def set_enabled(on: bool) -> dict:
    """켜면 파일을 만들고(이미 있으면 지금 자리로 고쳐 쓴다), 끄면 지운다. {ok, enabled, message}"""
    path = entry_path()
    target = _target()
    if not path or not target:
        return {"ok": False, "enabled": False, "message": "이 컴퓨터에서는 쓸 수 없어요."}
    if not on:
        # 우리가 만든 설정 파일 하나라 휴지통 대신 바로 지운다
        path.unlink(missing_ok=True)
        return {"ok": True, "enabled": False, "message": "컴퓨터를 켤 때 Daling 을 켜지 않아요."}
    reason = _blocked_reason(target)
    if reason:
        return {"ok": False, "enabled": enabled(), "message": reason}
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_bytes(_entry_bytes(target))
    tmp.chmod(0o644)
    os.replace(tmp, path)
    return {"ok": True, "enabled": True, "message": "컴퓨터를 켤 때 Daling 도 함께 켜요."}


def refresh() -> None:
    """켜 둔 사람만: 앱 자리가 바뀌었으면(AppImage 를 옮김 등) 파일을 지금 자리로 고친다. 앱을 켤 때 부른다."""
    try:
        path, target = entry_path(), _target()
        if not (path and target and path.is_file()) or _blocked_reason(target):
            return
        want = _entry_bytes(target)
        if path.read_bytes() != want:
            set_enabled(True)
    except Exception:
        pass
