"""DGIST LMS AutoSaver 데스크톱 앱.

웹 브라우저/터미널 없이 더블클릭으로 실행되는 네이티브 창 버전입니다.

동작 방식:
- 127.0.0.1:8765에 대시보드 서버를 백그라운드 스레드로 띄운 뒤
  네이티브 창(WebView2)으로 감쌉니다.
- 이미 앱이 떠 있어 포트가 사용 중이면 새 서버를 띄우지 않고
  이미 떠 있는 창을 앞으로 가져옵니다. 그 창을 못 찾을 때만 기존 서버에 창을 하나 더 엽니다.
- 창을 닫으면 이 프로세스가 띄운 서버도 함께 종료됩니다.

실행:
    pythonw app.py   (또는 바탕화면의 "DGIST LMS AutoSaver" 바로가기)
"""
from __future__ import annotations

import os
import socket
import sys
import threading
import time

_APP_T0 = time.time()  # 켤 때 걸린 시간을 단계별로 재려고 (web_ui.BOOT, boot_times.json)

import urllib.request
from datetime import datetime
from pathlib import Path

# 데스크톱 모드에서는 web_ui가 기본 브라우저를 열지 않도록 고정
os.environ.setdefault("AUTOSAVER_OPEN_BROWSER", "0")

# 설치본 점검: `<실행 파일> --autosaver-smoke` (창 없이 서버를 띄워 몇 군데 두드려 보고 끝난다, smoke_test.py)
SMOKE_FLAG = "--autosaver-smoke"
if len(sys.argv) >= 2 and sys.argv[1] == SMOKE_FLAG:
    # 사용자 데이터 대신 빈 임시 폴더를 쓴다. web_ui·runtime_config 가 불러오는 순간 경로를 정하므로
    # 그보다 먼저 바꿔 둔다.
    import smoke_test

    smoke_test.prepare_env()

if sys.platform == "darwin" and not os.environ.get("SSL_CERT_FILE"):
    # 맥으로 묶은 파이썬은 빌드한 컴퓨터의 OpenSSL 인증서 경로를 가리켜서, 받은 사람 맥에서는
    # 학교 메일(IMAP)·GitHub 업데이트 확인 같은 표준 라이브러리 SSL 연결이 '인증서 확인 실패' 가 난다.
    # (Windows 는 시스템 인증서 저장소를 읽어서 이 문제가 없다) requests 가 쓰는 certifi 묶음을 같이 쓴다.
    # 작업 프로세스도 이 환경 변수를 물려받는다.
    try:
        import certifi

        os.environ["SSL_CERT_FILE"] = certifi.where()
    except Exception:
        pass

if sys.platform.startswith("linux"):
    # 리눅스 판: Qt 설정을 바꾸기 전 환경을 먼저 기억해 둔다 (시스템 프로그램에는 그것을 준다, linux_support 머리말)
    import linux_support

    if getattr(sys, "frozen", False) and not os.environ.get("SSL_CERT_FILE"):
        # 묶은 파이썬의 OpenSSL 은 빌드한 Ubuntu 22.04 의 자리(/usr/lib/ssl)에서 인증서를 찾는다. 페도라 등에는 그 자리가
        # 없어 학교 메일(IMAP)·업데이트 확인이 '인증서 확인 실패' 가 난다 (맥과 같은 문제). 시스템 CA 묶음을, 없으면 certifi 를.
        # 작업 프로세스도 이 환경 변수를 물려받는다.
        _ca = linux_support.pick_ca_file()
        if _ca:
            os.environ["SSL_CERT_FILE"] = _ca

from http.server import ThreadingHTTPServer

import web_ui

HOST = "127.0.0.1"
PORT = int(os.environ.get("AUTOSAVER_UI_PORT", "8765"))
# 보이는 앱 이름(2026-10-11 붕어빵 → Daling). 실행 파일은 그대로 붕어빵.exe
WINDOW_TITLE = "Daling"
# 작업표시줄이 pythonw.exe나 옛 캐시가 아니라 이 앱을 별도 앱으로 인식하게 하는 식별자.
# 바로가기(install.ps1)에도 같은 값을 넣어야 아이콘이 완전히 일치한다.
APP_USER_MODEL_ID = "DGIST.Bungeoppang.App"
# EXE 로 묶이면 화면 파일이 exe 옆 _internal 로 들어간다. 그때는 __file__ 이
# 아니라 sys._MEIPASS 를 봐야 아이콘을 찾는다.
_APP_ROOT = Path(getattr(sys, "_MEIPASS", "") or Path(__file__).resolve().parent)
APP_ICON = _APP_ROOT / "web" / "app.png"


APP_ICO = _APP_ROOT / "web" / "app.ico"


def set_app_user_model_id() -> None:
    """창을 만들기 '전에' 호출해야 작업표시줄 아이콘이 창 아이콘을 따라온다.

    이걸 지정하지 않으면 Windows가 여러 pythonw 창을 하나로 묶고,
    실행에 쓰인 바로가기의 (옛) 캐시 아이콘을 그대로 보여 준다.
    """
    if os.name != "nt":
        return
    import runtime_config

    if runtime_config.is_msix():
        # Store 판(MSIX)은 패키지가 앱 ID(<패키지 패밀리>!Daling)를 정해 준다. 여기서 우리 ID 를 붙이면 작업 표시줄이
        # 창을 시작 메뉴의 Daling 과 다른 앱으로 묶는다.
        return
    try:
        import ctypes

        ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(APP_USER_MODEL_ID)
    except Exception:
        pass


def apply_window_icon(timeout: float = 15.0) -> bool:
    """pywebview 창에 앱 아이콘을 입힌다 (Windows 전용).

    pywebview의 create_window에는 아이콘 인자가 없어서, 창이 만들어진 뒤
    Win32 WM_SETICON으로 직접 설정한다. 이걸 하지 않으면 창과 작업표시줄에
    pythonw.exe의 기본 파이썬 아이콘이 그대로 노출된다.
    """
    if os.name != "nt" or not APP_ICO.exists():
        return False
    try:
        import ctypes

        import window_chrome

        user32 = ctypes.windll.user32
        IMAGE_ICON, LR_LOADFROMFILE = 1, 0x0010
        WM_SETICON, ICON_SMALL, ICON_BIG = 0x0080, 0, 1

        deadline = time.time() + timeout
        hwnd = 0
        while time.time() < deadline:
            # 제목만으로 찾으면 탐색기의 'Daling' 대리 창이 잡힐 수 있다 (window_chrome.find_app_window)
            hwnd = window_chrome.find_app_window(WINDOW_TITLE, os.getpid())
            if hwnd:
                break
            time.sleep(0.3)
        if not hwnd:
            return False

        path = str(APP_ICO)
        big = user32.LoadImageW(None, path, IMAGE_ICON, 32, 32, LR_LOADFROMFILE)
        small = user32.LoadImageW(None, path, IMAGE_ICON, 16, 16, LR_LOADFROMFILE)
        if big:
            user32.SendMessageW(hwnd, WM_SETICON, ICON_BIG, big)
        if small:
            user32.SendMessageW(hwnd, WM_SETICON, ICON_SMALL, small)
        return bool(big or small)
    except Exception:
        return False


def _osascript(lines: list[str], args: list[str], timeout: float) -> None:
    """맥에서 AppleScript 한 토막을 돌린다.

    글을 스크립트 안에 끼워 넣지 않고 `on run argv` 의 인자로 넘긴다. 과목·과제 이름에 따옴표나
    역슬래시가 들어 있어도 스크립트가 깨지거나 다른 명령이 끼어들 수 없다.
    """
    import subprocess

    command = ["/usr/bin/osascript", "-e", "on run argv"]
    for line in lines:
        command += ["-e", line]
    command += ["-e", "end run", *args]
    subprocess.run(command, capture_output=True, timeout=timeout)


def notify(title: str, message: str) -> None:
    """Windows 토스트 알림 (winotify 미설치/실패 시 조용히 무시). 맥은 알림 센터."""
    if sys.platform == "darwin":
        # ad-hoc 서명 앱은 알림 권한(UNUserNotificationCenter)을 제대로 받을 수 없어 osascript 로 띄운다.
        # 알림 센터에는 '스크립트 편집기' 이름으로 보이므로 제목 줄에 앱 이름을 넣고 원래 제목은 부제로.
        try:
            _osascript(
                ["display notification (item 3 of argv) with title (item 1 of argv) subtitle (item 2 of argv)"],
                [WINDOW_TITLE, title, message[:200]],
                timeout=15,
            )
        except Exception:
            pass
        return
    if sys.platform.startswith("linux"):
        # notify-send(libnotify)가 있으면 그것으로, 없으면 조용히 넘어간다. 글은 셸 없이 인자로 넘긴다.
        try:
            linux_support.notify(title, message[:200], icon=str(APP_ICON))
        except Exception:
            pass
        return
    try:
        from winotify import Notification
        import runtime_config

        toast = Notification(
            # Store 판(MSIX)에서는 알림을 띄우는 PowerShell 도 패키지 신원을 물려받는다. 'Daling' 으로도 뜨지만(2026-10-15 실측)
            # 패키지 앱 ID 로 띄워야 알림이 시작 메뉴의 Store 판 Daling 과 같은 앱으로 묶인다
            app_id=runtime_config.msix_app_user_model_id() or WINDOW_TITLE,
            title=title,
            msg=message[:200],
            icon=str(APP_ICON) if APP_ICON.exists() else "",
        )
        toast.show()
    except Exception:
        pass


# ===== 마감 알림 · 새 자료 알림 =====
# 예전 알림은 예약 동기화마다 '새 자료가 없습니다' 를, 켤 때마다 48시간 마감 요약을 띄워
# 쓸모 없이 자주 떴다. 이제 꼭 필요할 때만: 마감은 하루·3시간·1시간 전에 한 번씩,
# 자료는 새로 들어오거나 고쳐 다시 올라왔을 때만. 무엇을 알렸는지는 alerts.json 에 적어 두 번 알리지 않는다.
DEADLINE_ALERT_HOURS = ((1, "1시간"), (3, "3시간"), (24, "하루"))  # 가까운 것부터


def _alerts_path(workspace):
    return workspace.root / "alerts.json"


def _load_alerts(workspace) -> dict:
    data = web_ui.read_json(_alerts_path(workspace), {})
    return data if isinstance(data, dict) else {}


def _save_alerts(workspace, data: dict) -> None:
    import json

    web_ui.atomic_write_text(_alerts_path(workspace), json.dumps(data, ensure_ascii=False))


def _alert_on(config: dict, key: str) -> bool:
    return config.get(key, True) is not False


def check_deadline_alerts(workspace, config: dict) -> None:
    """안 낸 과제가 하루·3시간·1시간 안으로 들어오면 알린다. 늦게 켜졌으면 지금 해당하는 가장 가까운 것 하나만."""
    if not _alert_on(config, "NOTIFY_DEADLINES"):
        return
    now = datetime.now().astimezone()
    data = _load_alerts(workspace)
    sent = data.setdefault("sent", {})
    hits = []
    for item in web_ui.get_deadlines(workspace).get("items", []):
        if item.get("myStatus") in ("Graded", "NeedsGrading"):
            continue
        try:
            due = datetime.fromisoformat(str(item.get("due") or "").replace("Z", "+00:00")).astimezone()
        except ValueError:
            continue
        left = (due - now).total_seconds()
        if left <= 0 or left > 24 * 3600:
            continue
        # 마감이 바뀌면 다시 알리도록 마감 시각까지 열쇠에 넣는다
        base = f"{item.get('courseId')}:{item.get('columnId') or item.get('name')}:{due.isoformat()}"
        for hours, label in DEADLINE_ALERT_HOURS:
            if left <= hours * 3600:
                key = f"{base}:{hours}"
                if key not in sent:
                    sent[key] = now.isoformat(timespec="seconds")
                    hits.append((due, label, item))
                break
    # 지난 지 사흘 넘은 기록은 치운다
    for key in list(sent):
        try:
            due_part = key.rsplit(":", 1)[0].split(":", 2)[2]
            if (now - datetime.fromisoformat(due_part)).days > 3:
                del sent[key]
        except (IndexError, ValueError):
            continue
    if not hits:
        return
    _save_alerts(workspace, data)
    hits.sort(key=lambda h: h[0])

    def line(due, item):
        course = item.get("courseLabel") or web_ui.extract_course_label(item.get("course", ""))
        when = "오늘" if due.date() == now.date() else "내일" if (due.date() - now.date()).days == 1 else due.strftime("%m/%d")
        return f"{course} · {item.get('name', '과제')} ({when} {due.strftime('%H:%M')})"

    if len(hits) == 1:
        due, label, item = hits[0]
        notify(f"과제 마감 {label} 전", line(due, item))
    else:
        text = "\n".join(line(d, i) for d, _, i in hits[:4])
        if len(hits) > 4:
            text += f"\n… 외 {len(hits) - 4}건"
        notify(f"과제 마감 {len(hits)}건 임박", text)


def _current_files(workspace) -> dict:
    """받아 둔 자료: 이름 → (크기). 크기가 바뀌면 교수가 고쳐 다시 올린 것."""
    meta = web_ui.read_json(workspace.file_metadata_log, None)
    if not isinstance(meta, dict):
        return {}
    base = web_ui.get_download_path(workspace)
    out = {}
    for name, info in meta.items():
        try:
            size = (base / web_ui.stored_relpath(name, info)).stat().st_size
        except OSError:
            continue
        out[name] = size
    return out


def check_new_file_alerts(workspace, config: dict) -> None:
    """동기화가 끝난 뒤 새로 들어온 자료·새 판을 알린다. 처음에는 지금 있는 것을 기억만 한다."""
    with web_ui.task_lock:
        if web_ui.task_states.get(workspace.user_id, {}).get("running"):
            return  # 받는 중에는 반쯤 들어온 목록으로 알리지 않는다
    current = _current_files(workspace)
    if not current:
        return
    data = _load_alerts(workspace)
    known = data.get("files")
    if not isinstance(known, dict):
        data["files"] = current
        _save_alerts(workspace, data)
        return
    new = [n for n in current if n not in known]
    changed = [n for n in current if n in known and known[n] and known[n] != current[n]]
    if current == known:
        return
    data["files"] = current
    _save_alerts(workspace, data)
    if not (new or changed) or not _alert_on(config, "NOTIFY_NEW_FILES"):
        return
    meta = web_ui.read_json(workspace.file_metadata_log, {}) or {}

    def line(name, tag=""):
        info = meta.get(name) if isinstance(meta.get(name), dict) else {}
        course = web_ui.extract_course_label(info.get("course", ""))
        return f"{course} · {info.get('original_name', name)}{tag}"

    lines = [line(n) for n in new] + [line(n, " (새 판)") for n in changed]
    title = " · ".join(
        part for part in (f"새 강의자료 {len(new)}개" if new else "", f"새 판 {len(changed)}개" if changed else "") if part
    )
    text = "\n".join(lines[:4]) + (f"\n… 외 {len(lines) - 4}개" if len(lines) > 4 else "")
    notify(title, text)


def check_announcement_alerts(workspace, config: dict) -> None:
    """과목 공지가 새로 올라오면 알린다 ('새 자료 알림' 스위치를 함께 쓴다). 처음에는 기억만."""
    data_ann = web_ui.get_course_announcements(workspace)
    items = [(c["label"], i) for c in data_ann.get("courses", []) for i in c.get("items", []) if i.get("id")]
    if not items:
        return
    data = _load_alerts(workspace)
    seen = data.get("ann")
    ids = [i["id"] for _, i in items]
    if not isinstance(seen, list):
        data["ann"] = ids
        _save_alerts(workspace, data)
        return
    fresh = [(label, i) for label, i in items if i["id"] not in set(seen)]
    if not fresh:
        return
    data["ann"] = list(dict.fromkeys(seen + ids))[-2000:]
    _save_alerts(workspace, data)
    if not _alert_on(config, "NOTIFY_NEW_FILES"):
        return
    lines = [f"{label} · {i.get('title', '공지')}" for label, i in fresh[:4]]
    if len(fresh) > 4:
        lines.append(f"… 외 {len(fresh) - 4}건")
    notify(f"새 공지 {len(fresh)}건", "\n".join(lines))


def upcoming_deadline_summary(workspace, hours: int = 48) -> str:
    """N시간 내 미제출 마감 요약 문자열 (없으면 빈 문자열)."""
    deadlines = web_ui.get_deadlines(workspace)
    now = datetime.now().astimezone()
    soon = []
    for item in deadlines.get("items", []):
        if item.get("myStatus") in ("Graded", "NeedsGrading"):
            continue
        due_raw = item.get("due")
        if not due_raw:
            continue
        try:
            due = datetime.fromisoformat(str(due_raw).replace("Z", "+00:00")).astimezone()
        except ValueError:
            continue
        delta = (due - now).total_seconds()
        if 0 <= delta <= hours * 3600:
            soon.append((due, item))
    if not soon:
        return ""
    soon.sort(key=lambda pair: pair[0])
    lines = [
        f"· {item.get('name', '과제')} ({due.strftime('%m/%d %H:%M')})"
        for due, item in soon[:4]
    ]
    if len(soon) > 4:
        lines.append(f"… 외 {len(soon) - 4}건")
    return "\n".join(lines)


def downloaded_count(workspace) -> int:
    data = web_ui.read_json(workspace.downloaded_files_log, [])
    return len(data) if isinstance(data, list) else 0


def run_scheduled_sync(workspace) -> None:
    """예약 동기화 실행 후 결과를 토스트로 알림."""
    before = downloaded_count(workspace)
    # '하루 한 번 꼼꼼히' 는 이름 그대로 전체를 훑어야 한다. 예전에는 기본값(fast)으로 불려
    # 변경 시각이 옛날인 채로 나중에 공개된 자료를 영영 못 봤다.
    ok, _message = web_ui.start_task(workspace, "sync", sync_mode="full", auto=True)
    if not ok:
        return
    # 작업 종료 대기 (최대 30분)
    for _ in range(360):
        time.sleep(5)
        with web_ui.task_lock:
            task = web_ui.task_states.get(workspace.user_id, {})
            if not task.get("running"):
                break
    # 새 자료·마감 알림은 scheduler_loop 의 check_new_file_alerts / check_deadline_alerts 가 한다
    # (예전에는 여기서 매일 '새 자료가 없습니다' 까지 알려 귀찮았다)


def scheduler_loop() -> None:
    """앱이 켜져 있는 동안 매일 예약 시간(SCHEDULE_TIME)에 자동 동기화."""
    workspace = web_ui.workspace_for_user("local")

    def last_sync_day() -> str | None:
        """마지막으로 자료 동기화가 실제로 끝난 날(로컬 날짜).

        예전에는 '앱을 켤 때 이미 예약 시간이 지났으면 오늘은 건너뜀' 이었다.
        그러면 08:00 이후에 앱을 켜는 날은 동기화가 영영 안 돈다 — 실제로
        LMS 에 새로 올라온 학술 글쓰기 자료가 하루 넘게 안 들어왔다.
        메모리 대신 last_sync.json 을 보면 '오늘 아직 안 했다' 를 정확히 안다.
        """
        try:
            # 빠른 동기화(3시간마다)도 last_sync.json 을 고치므로, 그걸 보면 '오늘은 이미 했다' 로
            # 보여 전체 검사가 한 번도 돌지 않았다. 전체 검사만 적는 파일을 본다.
            data = web_ui.read_json(workspace.root / "last_full_sync.json", {})
            raw = str((data or {}).get("lastFullSync", ""))
            if not raw:
                return None
            when = datetime.fromisoformat(raw.replace("Z", "+00:00"))
            return when.astimezone().strftime("%Y-%m-%d")
        except Exception:
            return None

    last_run_day = last_sync_day()
    # 켜자마자 LMS 를 두드리지 않도록 2분만 숨을 고른다
    started_at = time.monotonic()
    while True:
        try:
            config = web_ui.read_config(workspace)
            schedule_time = str(config.get("SCHEDULE_TIME", "08:00")).strip() or "08:00"
            now = datetime.now()
            today = now.strftime("%Y-%m-%d")
            due_today = now.strftime("%H:%M") >= schedule_time and last_run_day != today
            if due_today and time.monotonic() - started_at > 120:
                with web_ui.task_lock:
                    running = web_ui.task_states.get(workspace.user_id, {}).get("running", False)
                if not running:
                    last_run_day = today
                    run_scheduled_sync(workspace)

            # 알림: 마감이 가까워졌는지, 새 자료가 들어왔는지 (둘 다 파일만 읽어 가볍다)
            try:
                check_deadline_alerts(workspace, config)
                check_new_file_alerts(workspace, config)
                check_announcement_alerts(workspace, config)
            except Exception:
                pass

            # 종류별 자동 실행. 자동이 기본이고, 새로고침 버튼은 '지금 당장' 용.
            # 기준은 메모리가 아니라 health.json 의 마지막 성공 시각이라,
            # 앱을 껐다 켜도 방금 한 걸 또 하지 않고, 오래 안 했으면 곧 한다.
            # LMS 작업(마감·자료)은 한 번에 하나만 돌린다 (LMS 로그인이 겹치지 않게).
            # 메일은 IMAP 만 써서 따로 돈다 (web_ui.task_key).
            if time.monotonic() - started_at > 45:
                minutes = web_ui.auto_minutes(config)
                with web_ui.task_lock:
                    running = web_ui.task_states.get(workspace.user_id, {}).get("running", False)
                    mail_running = web_ui.task_states.get(web_ui.task_key(workspace.user_id, "emails"), {}).get("running", False)
                if not mail_running and next_due_job(workspace, minutes, ("emails",)):
                    web_ui.start_task(workspace, "emails", auto=True)
                if not running:
                    kind = next_due_job(workspace, minutes, ("deadlines", "sync"))
                    if kind:
                        web_ui.start_task(workspace, kind, auto=True)
        except Exception:
            pass
        time.sleep(30)


def next_due_job(workspace, minutes: dict[str, int], kinds=("emails", "deadlines", "sync")) -> str | None:
    """지금 돌 차례인 자동 작업 하나. 없으면 None.

    급한 순서: 메일(짧은 주기) → 마감 → 자료.
    막 실패한 작업을 30초마다 다시 두드리지 않도록, 실패 뒤에는 주기의
    절반(최소 5분)은 쉰다.
    """
    health = web_ui.read_json(workspace.root / "health.json", {}) or {}
    success = health.get("lastSuccess") or {}
    failure = health.get("lastFailure") or {}
    now = datetime.now()

    def age_minutes(stamp) -> float:
        try:
            when = datetime.fromisoformat(str(stamp).replace("Z", "+00:00"))
            if when.tzinfo is not None:
                when = when.astimezone().replace(tzinfo=None)
            return (now - when).total_seconds() / 60
        except (TypeError, ValueError):
            return float("inf")

    streaks = health.get("failStreak") or {}
    auth = health.get("authFailed") or {}
    try:
        st = workspace.config_path.stat()
        config_stamp = [st.st_mtime_ns, st.st_size]
    except OSError:
        config_stamp = None

    for kind in kinds:
        every = int(minutes.get(kind, 0) or 0)
        if every <= 0:
            continue
        if age_minutes(success.get(kind)) < every:
            continue
        # 서버가 로그인을 거절했으면 설정(비밀번호)이 바뀔 때까지 자동으로는 다시 하지 않는다.
        # 틀린 비밀번호로 5분마다 두드리면 학교 계정이 잠길 수 있다. 수동 새로고침은 그대로 된다.
        # 다만 학교 서버가 가끔 멀쩡한 비밀번호도 거절한다(9/26 성공 → 9/27 거절). 영영 멈추지 않고 2시간 뒤 한 번 더 본다.
        locked = auth.get(kind)
        if locked and locked.get("configStamp") == config_stamp and age_minutes(locked.get("at")) < 120:
            continue
        # 그 밖의 실패는 연속으로 실패할수록 간격을 두 배로 (최대 6시간)
        streak = int(streaks.get(kind, 0) or 0)
        wait = min(max(5, every) * (2 ** max(0, streak - 1)), 360) if streak else 0
        if failure.get("kind") == kind:
            wait = max(wait, max(5, every / 2))
        if wait and age_minutes((failure.get("at") if failure.get("kind") == kind else None) or success.get(kind)) < wait:
            continue
        return kind
    return None


def port_in_use(host: str, port: int) -> bool:
    """그 포트를 누가 잡고 있나. 붙어 보지 않고 직접 잡아 본다(잡히면 빈 포트, 곧바로 놓는다).

    예전엔 connect 로 확인했는데, Windows 는 닫힌 localhost 포트에 붙을 때 바로 거절하지 않고
    제한 시간(0.4s)까지 기다린다(실측 400ms, WSAEWOULDBLOCK). 켤 때마다 후보 21개를 다 두드려
    서버가 뜨기까지 9초가 걸렸다(2026-10-15 boot_times.json). 잡아 보기는 1ms 도 안 걸린다.
    """
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        exclusive = getattr(socket, "SO_EXCLUSIVEADDRUSE", None)
        if exclusive is not None:
            sock.setsockopt(socket.SOL_SOCKET, exclusive, 1)
        try:
            sock.bind((host, port))
        except OSError:
            return True
        return False


def existing_dashboard(host: str, port: int) -> bool:
    """포트를 점유한 프로세스가 이 앱(붕어빵)의 대시보드인지 확인.

    200 만 보면 안 된다. 다른 웹 서버도 /healthz 에 200 을 줄 수 있다.
    우리 서버만 돌려주는 모양(ok·mode)까지 본다.
    """
    try:
        with urllib.request.urlopen(f"http://{host}:{port}/healthz", timeout=1.5) as resp:
            if resp.status != 200:
                return False
            body = resp.read(2048).decode("utf-8", "replace")
            return '"ok"' in body and '"mode"' in body
    except Exception:
        return False


# 8765 가 막혀 있으면 이 범위에서 빈 곳을 찾는다.
# (실제로 다른 개발 도구가 8765 에 웹 서버를 띄워 붕어빵이 "포트 사용 중" 으로 멈췄다)
PORT_CANDIDATES = [PORT] + [p for p in range(8766, 8786) if p != PORT]


class ExclusiveHTTPServer(ThreadingHTTPServer):
    """다른 프로그램과 같은 포트를 겹쳐 잡지 않는 서버.

    파이썬 기본 HTTP 서버는 SO_REUSEADDR 를 켜는데, Windows 에서는 이것이
    '이미 누가 쓰는 포트도 같이 잡기' 를 허락한다. 그러면 두 서버가 한 포트를
    나눠 가져 요청이 엉뚱한 쪽으로 간다. 혼자만 잡도록 막는다.
    """

    allow_reuse_address = False

    def server_bind(self) -> None:
        # 맥·리눅스에는 SO_EXCLUSIVEADDRUSE 가 없다(None). 거기서는 SO_REUSEADDR 를 끈 것만으로
        # 남이 듣고 있는 포트를 겹쳐 잡지 못한다 (bind 가 EADDRINUSE → start_server 가 다음 포트로).
        exclusive = getattr(socket, "SO_EXCLUSIVEADDRUSE", None)
        if exclusive is not None:
            self.socket.setsockopt(socket.SOL_SOCKET, exclusive, 1)
        if sys.platform == "darwin":
            # 기본 HTTPServer.server_bind 는 socket.getfqdn(주소) 로 역방향 이름 조회를 한다.
            # 맥에서는 이 조회가 mDNS 로 나갈 수 있어 '로컬 네트워크의 기기 찾기 허용?' 창의 후보다
            # (2026-10-12 CI 첫 실행에서 그 창이 떴다). server_name 은 CGI 용 이름표라 주소 그대로 둔다.
            import socketserver

            socketserver.TCPServer.server_bind(self)
            host, port = self.server_address[:2]
            self.server_name = str(host)
            self.server_port = port
            return
        super().server_bind()


def _process_started_at() -> float:
    """이 프로세스가 만들어진 시각(epoch 초). 켤 때 걸린 시간을 실행 파일이 뜬 순간부터 재려고.

    Windows 는 GetProcessTimes 로 실제 생성 시각을, 그 밖에는 이 모듈을 처음 불러온 시각을 쓴다.
    """
    if os.name == "nt":
        try:
            import ctypes
            from ctypes import wintypes

            created, exited, kernel, user = (wintypes.FILETIME() for _ in range(4))
            handle = ctypes.windll.kernel32.GetCurrentProcess()
            if ctypes.windll.kernel32.GetProcessTimes(
                handle, ctypes.byref(created), ctypes.byref(exited), ctypes.byref(kernel), ctypes.byref(user)
            ):
                ticks = (created.dwHighDateTime << 32) | created.dwLowDateTime  # 1601-01-01 부터 100ns
                return ticks / 10_000_000 - 11_644_473_600
        except Exception:
            pass
    return _MODULE_T0


_MODULE_T0 = time.time()


def _prewarm_first_screen() -> None:
    """창(WebView2)이 뜨는 1~2초 동안 첫 화면이 부를 무거운 것을 미리 불러 둔다.

    2026-10-15 실측(새로 켠 서버): 첫 화면 API 가 처음 불릴 때만 무거웠다 —
    /api/status 445ms(시간표 모듈 0.21s·구글 토큰 확인 0.19s 를 처음 불러옴), /api/course-staff 130ms,
    /api/emails 80ms. 창이 뜨기를 기다리는 동안 같은 일을 먼저 해 두면 첫 화면이 그만큼 빨리 찬다.
    요청 처리와 같은 함수를 부를 뿐이라(동시 요청도 원래 이렇게 겹친다) 결과는 같다.
    """
    try:
        workspace = web_ui.workspace_for_user("local")
        for warm in (web_ui.get_status, web_ui.get_emails, web_ui.get_course_staff, web_ui.safe_public_config):
            try:
                warm(workspace)
            except Exception:
                pass
    except Exception:
        pass


def start_server() -> ThreadingHTTPServer | None:
    """서버를 띄우고 반환. 이미 붕어빵 대시보드가 떠 있으면 None.

    쓰기로 한 포트는 전역 PORT 와 환경 변수에 적어 둔다
    (창 주소와 작업 프로세스가 같은 포트를 보게).
    """
    global PORT

    # 1) 이미 켜진 붕어빵이 있으면 서버를 또 띄우지 않고 그 창만 연다
    for port in PORT_CANDIDATES:
        if port_in_use(HOST, port) and existing_dashboard(HOST, port):
            PORT = port
            os.environ["AUTOSAVER_UI_PORT"] = str(port)
            return None

    # 2) 빈 포트에 띄운다
    web_ui.ensure_data_files(web_ui.workspace_for_user("local"))
    for port in PORT_CANDIDATES:
        if port_in_use(HOST, port):
            continue
        try:
            server = ExclusiveHTTPServer((HOST, port), web_ui.DashboardHandler)
        except OSError:
            continue
        PORT = port
        os.environ["AUTOSAVER_UI_PORT"] = str(port)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        return server

    raise RuntimeError(
        f"Daling이 쓸 포트를 찾지 못했습니다 ({PORT_CANDIDATES[0]}~{PORT_CANDIDATES[-1]} 모두 사용 중). "
        "다른 프로그램을 몇 개 닫고 다시 켜 주세요."
    )


def _bind_worker_output() -> None:
    """창 없는 EXE(console=False)는 sys.stdout 이 None 이다.

    그대로 두면 작업 로그를 찍는 print() 가 터지면서, 화면에는 이유 없이
    실패한 것처럼 보인다. 부모가 파이프를 물려 줬으면 그 손잡이를 다시 잡는다.
    """
    import io

    for name, fd in (("stdout", 1), ("stderr", 2)):
        current = getattr(sys, name, None)
        if current is not None:
            # 파이프가 붙어 있어도 인코딩은 시스템 기본(한국어 Windows 는 cp949)이라
            # 로그에 └ ─ 같은 글자가 하나 섞이면 UnicodeEncodeError 로 작업이 죽는다.
            # (playwright 가 안내문을 상자로 그려서 실제로 이렇게 터졌다)
            try:
                current.reconfigure(encoding="utf-8", errors="replace")
            except Exception:
                pass
            continue
        try:
            stream = io.TextIOWrapper(
                open(fd, "wb", buffering=0), encoding="utf-8", errors="replace", write_through=True
            )
        except Exception:
            # 파이프도 없으면 조용히 버린다 (print 가 죽는 것만은 막는다)
            stream = io.TextIOWrapper(io.BytesIO(), encoding="utf-8", write_through=True)
        setattr(sys, name, stream)


def run_worker(job: str) -> int:
    """새로고침·동기화 같은 하위 작업을 창 없이 실행한다.

    EXE 로 묶이면 sys.executable 이 '붕어빵.exe' 라서 `-c "..."` 방식이 통하지 않는다.
    그대로 두면 새로고침할 때마다 앱이 통째로 한 번 더 켜지고(창이 계속 늘어남),
    정작 크롤링은 시작도 못 한다. 그래서 EXE 는 이 함수로 들어온다.

    여기서는 서버도 창도 만들지 않는다. 로그는 표준출력으로 나가고,
    부르는 쪽(web_ui.run_process)이 그대로 읽어 화면에 보여 준다.
    """
    import asyncio

    _bind_worker_output()
    if sys.platform.startswith("linux"):
        # 작업이 띄우는 것(Playwright 의 node·크로미움, 구글 로그인 때 브라우저)은 모두 시스템 프로그램이다.
        # 묶음 라이브러리 경로를 물려주지 않는다 (linux_support.use_system_env_for_children).
        try:
            linux_support.use_system_env_for_children()
        except Exception:
            pass

    try:
        if job == "sync":
            import main as sync_main

            asyncio.run(sync_main.run_job())
        elif job == "deadlines":
            import lms_crawler

            asyncio.run(lms_crawler.crawl_deadlines_only())
        elif job == "emails":
            import email_reader

            email_reader.refresh_emails()
        elif job == "verify":
            import verify

            asyncio.run(verify.verify())
        elif job == "google-oauth":
            from drive_uploader import authorize_drive

            authorize_drive(force=True)
        elif job == "smoke":
            # 설치본 점검(smoke_test.py)이 '작업 프로세스가 창 없이 뜨고, 출력이 파이프로 오고,
            # 데이터 경로를 물려받는지' 만 본다. 화면(start_task)에서는 부를 수 없는 이름이다.
            import runtime_config

            # package: Store 판(MSIX)이면 작업 프로세스도 같은 패키지 안에서 도는지 (AppData 가상화를 같이 봐야 한다)
            print(f"smoke-worker ok data={runtime_config.AUTOSAVER_DATA_ROOT} package={runtime_config.msix_package_full_name() or '-'}")
        else:
            print(f"알 수 없는 작업입니다: {job}")
            return 1
    except Exception as exc:
        # 하위 프로세스가 조용히 죽으면 화면에 아무 설명도 안 뜬다
        import traceback

        traceback.print_exc()
        print(f"작업이 실패했습니다: {exc}")
        return 1
    return 0


def initial_window_size() -> tuple[int, int, int | None, int | None]:
    """첫 창 크기와 자리: 1320×880 을 바라되 작업 영역(작업표시줄 뺀 화면)을 넘지 않게, 가운데에.

    2026-10-09 실측: 화면이 1389×868(배율 적용 후)인 노트북에서 880px 창이 작업표시줄 뒤로 내려가,
    캘린더 일정 편집 칸의 '저장' 버튼이 화면 밖에 있어 '일정 추가가 안 된다'고 보였다.
    pywebview 의 width/height 는 배율 전 값이라 작업 영역도 같은 단위(96dpi 기준)로 바꿔 잰다.
    크기만 줄였더니 윈도우가 정한 자리(y=172)에 떠서 아래가 여전히 984 > 852 로 넘쳤다(실측) → 자리도 가운데로.
    """
    want_w, want_h = 1320, 880
    if sys.platform == "darwin":
        # 맥: 메뉴 막대·Dock 을 뺀 화면(visibleFrame)에 맞춘다. 단위가 포인트(Retina 배율 적용 후)라
        # pywebview 의 width/height 와 같다. 자리는 비워 두면 pywebview(cocoa)가 가운데에 놓는다.
        # 13인치 맥북(1440×900 안팎)에서는 880px 창이 Dock 뒤로 내려간다 — 위 Windows 실측과 같은 문제.
        try:
            import AppKit

            frame = AppKit.NSScreen.mainScreen().visibleFrame()
            area_w, area_h = float(frame.size.width), float(frame.size.height)
            if area_w >= 400 and area_h >= 400:
                return int(min(want_w, area_w - 40)), int(min(want_h, area_h - 40)), None, None
        except Exception:
            pass
        return want_w, want_h, None, None
    if sys.platform.startswith("linux"):
        # 리눅스(Qt): 1366×768 노트북이 흔하다 — 위 Windows 실측과 같은 문제. Qt 에 화면을 물어 작업 영역에 맞춘다
        # (여기서 QApplication 이 생기고 webview.start 가 같은 것을 다시 쓴다. Qt 를 못 띄우면 예외 → 기본 크기).
        # 단위는 Qt 논리 픽셀이라 pywebview 의 width/height 와 같다. 자리는 비워 두면 pywebview(qt)가 가운데에 놓는다
        # (Wayland 에서는 자리를 컴포지터가 정한다). Wayland 는 패널을 빼지 않은 크기를 주므로 위아래 여유를 더 둔다.
        try:
            import webview

            area = webview.screens[0].frame.availableGeometry()
            area_w, area_h = float(area.width()), float(area.height())
            if area_w >= 400 and area_h >= 400:
                return int(min(want_w, area_w - 40)), int(min(want_h, area_h - 80)), None, None
        except Exception:
            pass
        return want_w, want_h, None, None
    if os.name != "nt":
        return want_w, want_h, None, None
    try:
        import ctypes
        from ctypes import wintypes

        rect = wintypes.RECT()
        ctypes.windll.user32.SystemParametersInfoW(0x0030, 0, ctypes.byref(rect), 0)  # SPI_GETWORKAREA
        try:
            dpi = ctypes.windll.user32.GetDpiForSystem() or 96
        except Exception:
            dpi = 96
        scale = dpi / 96
        area_w = (rect.right - rect.left) / scale
        area_h = (rect.bottom - rect.top) / scale
        if area_w < 400 or area_h < 400:
            return want_w, want_h, None, None
        width = int(min(want_w, area_w - 40))
        height = int(min(want_h, area_h - 40))
        x = int(rect.left / scale + (area_w - width) / 2)
        y = int(rect.top / scale + (area_h - height) / 2)
        return width, height, x, y
    except Exception:
        return want_w, want_h, None, None


def run_in_browser(server, url: str, reason: str) -> None:
    """리눅스: 창(Qt)을 띄울 수 없으면 기본 브라우저로 같은 화면을 연다.

    화면 서버·예약 작업(메일·마감·자료)은 그대로 돌고, Ctrl+C·SIGTERM 을 받으면 끝난다(서버는 부른 쪽이 닫는다).
    죽지 않고 이렇게 하는 까닭: ssh 로 붙은 서버, Qt 라이브러리가 빠진 최소 설치에서도 쓸 수는 있게.
    """
    import signal
    import webbrowser

    print(f"{WINDOW_TITLE}: 창을 띄우지 못해 기본 브라우저로 엽니다 ({reason}).", file=sys.stderr, flush=True)
    print(f"{WINDOW_TITLE}: 주소 {url} · 끝내려면 Ctrl+C", file=sys.stderr, flush=True)
    try:
        webbrowser.open(url)
    except Exception:
        pass
    notify(WINDOW_TITLE, "창을 띄우지 못해 기본 브라우저로 열었어요")
    if server is None:
        return  # 이미 켜진 Daling 이 서버를 맡고 있다. 브라우저만 열고 끝낸다
    stop = threading.Event()

    def _stop(_signum, _frame) -> None:
        stop.set()

    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            signal.signal(sig, _stop)
        except (ValueError, OSError):
            pass
    while not stop.wait(1.0):
        pass


def run_linux_window(webview, server, url: str) -> None:
    """리눅스: pywebview 의 Qt(QtWebEngine) 창. 못 띄우면 run_in_browser 로. 끝나면 서버를 닫는다.

    WebKitGTK 가 아니라 Qt 인 까닭: PyQt6·PyQt6-WebEngine 휠은 필요한 것을 스스로 싣고 있어 PyInstaller·AppImage 로
    묶을 수 있다. WebKitGTK 는 도우미 프로세스 경로가 빌드 때 박혀 있어 묶으면 깨진다.
    """
    try:
        problem = linux_support.display_problem()
        if not problem:
            width, height, x, y = initial_window_size()
            webview.create_window(WINDOW_TITLE, url, width=width, height=height, x=x, y=y, min_size=(360, 560))
            try:
                webview.start(gui="qt", icon=str(APP_ICON) if APP_ICON.exists() else None)
            except Exception as exc:
                # PyQt6·QtWebEngine 을 불러오지 못함(시스템 라이브러리 빠짐 등). 화면 없이 죽는 대신 브라우저로
                problem = f"{type(exc).__name__}: {exc}"
        if problem:
            run_in_browser(server, url, problem)
    finally:
        if server is not None:
            server.shutdown()
            server.server_close()


def main() -> None:
    _marks = {"appStart": _APP_T0, "webUiImported": _MODULE_T0, "main": time.time()}
    set_app_user_model_id()  # 창을 만들기 전에 (작업표시줄 아이콘 반영의 핵심)
    if sys.platform.startswith("linux"):
        # Qt 를 부르기 전에: Qt(PyQt6) 고르기·필요할 때만 크로미움 샌드박스 끄기(linux_support.prepare_qt 설명),
        # 그리고 webbrowser 가 원래 환경의 xdg-open 을 쓰게 (구글 로그인·업데이트 받기·바깥 링크)
        _sandbox_off = linux_support.prepare_qt()
        if _sandbox_off:
            print(f"{WINDOW_TITLE}: 웹 화면 샌드박스를 끕니다 ({_sandbox_off}).", file=sys.stderr, flush=True)
        linux_support.register_system_browser()
    import webview

    _marks["webviewImported"] = time.time()
    try:
        server = start_server()
    except RuntimeError as exc:
        if os.name == "nt":
            import ctypes

            ctypes.windll.user32.MessageBoxW(0, str(exc), WINDOW_TITLE, 0x10)
        else:
            print(f"{WINDOW_TITLE}: {exc}", file=sys.stderr)
            if sys.platform.startswith("linux"):
                # 메뉴에서 켠 앱은 stderr 를 아무도 안 본다. 알림으로라도 까닭을 보여 준다
                notify(WINDOW_TITLE, str(exc))
            if sys.platform == "darwin":
                # Finder 에서 켠 앱은 stderr 를 아무도 안 본다. 창이 안 뜬 까닭을 알림 상자로 보여 준다.
                try:
                    _osascript(
                        ["display alert (item 1 of argv) message (item 2 of argv) as critical"],
                        [WINDOW_TITLE, str(exc)],
                        timeout=600,
                    )
                except Exception:
                    pass
        return

    try:
        webview.settings["ALLOW_DOWNLOADS"] = True
    except Exception:
        pass

    # 이 프로세스가 서버 주인일 때만 스케줄러/알림 가동 (창만 띄운 경우 제외)
    if server is not None:
        # 켤 때 걸린 시간 기록용 (web_ui /api/boot-done → boot_times.json)
        web_ui.BOOT.update(start=_process_started_at(), server=time.time(), **_marks)
        threading.Thread(target=_prewarm_first_screen, daemon=True).start()
        threading.Thread(target=scheduler_loop, daemon=True).start()

        # 켤 때마다 띄우던 '48시간 마감 요약' 은 없앴다. 마감 알림(하루·3시간·1시간 전)이 대신한다.

    url = f"http://{HOST}:{PORT}"
    if sys.platform.startswith("linux"):
        run_linux_window(webview, server, url)
        return
    # 회색 기본 제목 줄을 없애고 앱 상단 바를 제목 줄로 쓴다 (window_chrome 설명 참고). 윈도우 전용:
    # window_chrome 은 맨 위에서 ctypes.wintypes 를 불러오는데, 맥 파이썬에서는 그 import 가 실패할 수 있어
    # 맥 판이 켜지자마자 죽을 수 있다. 맥에서는 아예 불러오지 않는다.
    window_chrome = None
    if os.name == "nt":
        import window_chrome

    # 이미 켜져 있으면 창을 하나 더 열지 않고 그 창을 앞으로 가져온다
    if server is None and window_chrome and window_chrome.focus_existing(WINDOW_TITLE):
        return
    width, height, x, y = initial_window_size()

    if window_chrome:
        window_chrome.enable_webview_drag_regions()
        window_chrome.install_async(WINDOW_TITLE)
    webview.create_window(
        WINDOW_TITLE,
        url,
        width=width,
        height=height,
        x=x,
        y=y,
        # 휴대폰 비율로 줄여도 쓸 수 있게 화면을 다시 짰다(좁으면 아래 탭 막대). 예전 900×640 은 정사각형·세로 창을 막았다.
        min_size=(360, 560),
    )
    # 창이 뜬 뒤 아이콘을 입힌다 (pywebview는 Windows에서 아이콘 인자를 지원하지 않음)
    threading.Thread(target=apply_window_icon, daemon=True).start()
    try:
        webview.start()
    finally:
        if server is not None:
            server.shutdown()
            server.server_close()


if __name__ == "__main__":
    # 작업 인자로 불렸으면 창을 만들지 않고 그 작업만 하고 끝낸다.
    # (web_ui.start_task 가 EXE 일 때 이 형태로 부른다)
    from runtime_config import WORKER_FLAG

    if len(sys.argv) >= 3 and sys.argv[1] == WORKER_FLAG:
        sys.exit(run_worker(sys.argv[2]))
    if len(sys.argv) >= 2 and sys.argv[1] == SMOKE_FLAG:
        import smoke_test

        sys.exit(smoke_test.run(sys.modules[__name__]))
    main()
