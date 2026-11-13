"""앱을 꺼 둬도 하루 한 번 동기화 — 운영체제 예약 작업.

앱 안의 자동 가져오기(app.scheduler_loop)는 Daling 이 켜져 있을 때만 돈다. 창을 닫으면 앱이 끝나므로
며칠 앱을 안 켜면 그동안 자료·마감·메일이 하나도 안 들어왔다(2026-11-09 사용자: 백그라운드에서 하루에 한 번은 동기화).
운영체제 예약 기능에 `Daling --autosaver-background`(app.run_background)를 하루 한 번, 설정의 '매일 전체 확인' 시각에 걸어 둔다.

  Windows  작업 스케줄러 'Daling Daily Sync' (내 계정·로그인해 있을 때만, 꺼져 있어 놓친 시각은 켜지는 대로 — StartWhenAvailable)
  맥       ~/Library/LaunchAgents/app.daling.desktop.background.plist (StartCalendarInterval, 잠자던 맥은 깨어난 뒤)
  리눅스   ~/.config/systemd/user/daling-background.{service,timer} (Persistent=true. systemctl 이 없으면 지원 안 함)

앱이 켜져 있으면 예약 작업은 바로 끝난다(앱이 같은 일을 한다). 예약 작업이 도는 동안 켠 앱은 LMS·메일 작업을 시작하지 않는다(busy).
Store 판(MSIX)은 설치 폴더가 판마다 바뀌고 예약 작업이 패키지 밖에서 실행 파일을 켜게 돼 지원하지 않는다.
앱 묶음(.app) 안이 아니라 운영체제가 정한 사용자 자리에 쓴다(CLAUDE.md 30).
"""
from __future__ import annotations

import contextlib
import json
import os
import plistlib
import shutil
import subprocess
import sys
import tempfile
import threading
import time
from pathlib import Path
from xml.sax.saxutils import escape

FLAG = "--autosaver-background"
TASK_NAME = "Daling Daily Sync"
LABEL = "app.daling.desktop.background"
BUNDLE_ID = "app.daling.desktop"
UNIT = "daling-background"
LOCK_NAME = "background_sync.lock"
STATE_NAME = "background_sync.json"
# 예약 작업이 살아 있는 동안 1분마다 잠금 파일을 고친다. 5분 넘게 안 고쳐졌으면 죽은 것으로 본다(강제 종료·전원 끊김)
LOCK_FRESH_SECONDS = 300

# 예약 작업 프로세스 자신은 잠금을 쥐고도 작업을 시작해야 한다 (web_ui.start_task 가 busy 를 본다)
RUNNING_HERE = False


def _is_linux() -> bool:
    return sys.platform.startswith("linux")


def _no_window() -> dict:
    if os.name == "nt":
        return {"creationflags": getattr(subprocess, "CREATE_NO_WINDOW", 0x08000000)}
    return {}


def _run(command: list[str], timeout: float = 20) -> subprocess.CompletedProcess:
    # schtasks 는 콘솔 코드 페이지(한국어 Windows 는 cp949)로 쓴다. utf-8 로 읽으면 오류 문구가 깨져 화면에 그대로 나갔다
    encoding = "oem" if os.name == "nt" else "utf-8"
    return subprocess.run(command, capture_output=True, text=True, encoding=encoding, errors="replace",
                          timeout=timeout, **_no_window())


def _schtasks() -> str:
    root = os.environ.get("SystemRoot") or os.environ.get("WINDIR") or ""
    path = Path(root) / "System32" / "schtasks.exe" if root else None
    return str(path) if path and path.is_file() else (shutil.which("schtasks") or "")


def _systemctl() -> str:
    # 메뉴에서 켠 앱은 PATH 가 짧을 수 있어 자리를 직접 본다 (CLAUDE.md 32)
    for path in ("/usr/bin/systemctl", "/bin/systemctl"):
        if Path(path).is_file():
            return path
    return shutil.which("systemctl") or ""


def _executable() -> Path | None:
    """예약 작업이 켤 실행 파일. 소스로 돌리면 없음(개발 중에는 예약하지 않는다)."""
    if not getattr(sys, "frozen", False):
        return None
    if sys.platform == "darwin":
        import autostart

        bundle = autostart._mac_bundle()
        return bundle / "Contents" / "MacOS" / "Daling" if bundle else None
    if _is_linux():
        appimage = os.environ.get("APPIMAGE", "")
        # AppImage 안의 실행 파일은 마운트가 풀리면 사라진다 — .AppImage 파일을 켜야 한다
        return Path(appimage) if appimage else Path(sys.executable).resolve()
    return Path(sys.executable).resolve()


def _blocked_reason(exe: Path) -> str:
    text = str(exe)
    if sys.platform == "darwin" and (text.startswith("/Volumes/") or "/AppTranslocation/" in text):
        return "Daling 을 응용 프로그램 폴더로 옮겨 켠 뒤 다시 켜 주세요."
    if _is_linux() and "/.mount_" in text:
        return "AppImage 파일 자리를 찾지 못했어요."
    return ""


def supported() -> bool:
    if _executable() is None:
        return False
    if os.name == "nt":
        try:
            import runtime_config

            if runtime_config.is_msix():
                return False
        except Exception:
            pass
        return bool(_schtasks())
    if sys.platform == "darwin":
        return True
    if _is_linux():
        return bool(_systemctl())
    return False


def parse_time(text: str) -> tuple[int, int]:
    try:
        hour, minute = (int(part) for part in str(text or "").strip().split(":", 1))
        if 0 <= hour < 24 and 0 <= minute < 60:
            return hour, minute
    except ValueError:
        pass
    return 8, 0


def wanted(config: dict) -> bool:
    """설정 'BACKGROUND_SYNC'. 없으면 켜짐(사용자가 바란 기본)."""
    return config.get("BACKGROUND_SYNC", True) is not False


# ===== 운영체제별 항목 =====

def _mac_plist_path() -> Path:
    return Path.home() / "Library" / "LaunchAgents" / f"{LABEL}.plist"


def _linux_unit_dir() -> Path:
    base = Path(os.environ.get("XDG_CONFIG_HOME") or Path.home() / ".config")
    return base / "systemd" / "user"


def windows_task_xml(exe: Path, hour: int, minute: int) -> str:
    # 시각만 쓰면 '그 컴퓨터의 현지 시각' 이다. 시작 날짜는 지난날이면 된다(매일 반복)
    return f"""<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>Daling: 앱을 꺼 둬도 하루 한 번 LMS 자료·과제 마감·학교 메일을 가져옵니다. Daling 설정에서 끌 수 있습니다.</Description>
  </RegistrationInfo>
  <Triggers>
    <CalendarTrigger>
      <StartBoundary>2026-01-01T{hour:02d}:{minute:02d}:00</StartBoundary>
      <Enabled>true</Enabled>
      <ScheduleByDay><DaysInterval>1</DaysInterval></ScheduleByDay>
    </CalendarTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>LeastPrivilege</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <IdleSettings><StopOnIdleEnd>false</StopOnIdleEnd><RestartOnIdle>false</RestartOnIdle></IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT2H</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>"{escape(str(exe))}"</Command>
      <Arguments>{FLAG}</Arguments>
      <WorkingDirectory>{escape(str(exe.parent))}</WorkingDirectory>
    </Exec>
  </Actions>
</Task>
"""


def mac_plist_bytes(exe: Path, hour: int, minute: int) -> bytes:
    return plistlib.dumps({
        "Label": LABEL,
        "ProgramArguments": [str(exe), FLAG],
        "StartCalendarInterval": {"Hour": hour, "Minute": minute},
        "LimitLoadToSessionType": "Aqua",
        "ProcessType": "Background",
        # macOS 13+ '로그인 항목 › 백그라운드에서 허용' 에 'Daling' 이름으로 보이게
        "AssociatedBundleIdentifiers": [BUNDLE_ID],
    })


def _systemd_quote(path: str) -> str:
    # systemd 는 % 를 지정자로 읽는다(%% 로). 따옴표 안의 \ 와 " 는 역슬래시로
    return '"' + path.replace("\\", "\\\\").replace('"', '\\"').replace("%", "%%") + '"'


def linux_units(exe: Path, hour: int, minute: int) -> dict[str, str]:
    return {
        f"{UNIT}.service": "\n".join([
            "[Unit]",
            "Description=Daling daily sync",
            "",
            "[Service]",
            "Type=oneshot",
            f"ExecStart={_systemd_quote(str(exe))} {FLAG}",
            "",
        ]),
        f"{UNIT}.timer": "\n".join([
            "[Unit]",
            "Description=Daling daily sync",
            "",
            "[Timer]",
            f"OnCalendar=*-*-* {hour:02d}:{minute:02d}:00",
            # 꺼져 있어 놓친 날은 켜자마자 한 번
            "Persistent=true",
            "",
            "[Install]",
            "WantedBy=timers.target",
            "",
        ]),
    }


def registered() -> bool:
    try:
        if os.name == "nt":
            schtasks = _schtasks()
            return bool(schtasks) and _run([schtasks, "/Query", "/TN", TASK_NAME]).returncode == 0
        if sys.platform == "darwin":
            return _mac_plist_path().is_file()
        if _is_linux():
            return (_linux_unit_dir() / f"{UNIT}.timer").is_file()
    except Exception:
        pass
    return False


def _register(exe: Path, hour: int, minute: int) -> None:
    if os.name == "nt":
        # schtasks /XML 은 UTF-16 파일을 받는다. 같은 이름이 있으면 /F 로 바꿔 쓴다
        fd, tmp = tempfile.mkstemp(suffix=".xml")
        os.close(fd)
        try:
            Path(tmp).write_text(windows_task_xml(exe, hour, minute), encoding="utf-16")
            done = _run([_schtasks(), "/Create", "/TN", TASK_NAME, "/XML", tmp, "/F"])
        finally:
            Path(tmp).unlink(missing_ok=True)
        if done.returncode != 0:
            raise RuntimeError((done.stderr or done.stdout or "").strip() or f"schtasks {done.returncode}")
        return
    if sys.platform == "darwin":
        path = _mac_plist_path()
        path.parent.mkdir(parents=True, exist_ok=True)
        tmp = path.with_name(path.name + ".tmp")
        tmp.write_bytes(mac_plist_bytes(exe, hour, minute))
        tmp.chmod(0o644)
        os.replace(tmp, path)
        # 파일만 두면 다음 로그인부터 적용된다. 지금 바로 걸리게 내렸다 다시 올린다
        domain = f"gui/{os.getuid()}"
        _run(["/bin/launchctl", "bootout", f"{domain}/{LABEL}"])
        done = _run(["/bin/launchctl", "bootstrap", domain, str(path)])
        if done.returncode != 0:
            raise RuntimeError((done.stderr or done.stdout or "").strip() or f"launchctl {done.returncode}")
        return
    if _is_linux():
        folder = _linux_unit_dir()
        folder.mkdir(parents=True, exist_ok=True)
        for name, text in linux_units(exe, hour, minute).items():
            (folder / name).write_text(text, encoding="utf-8")
        systemctl = _systemctl()
        _run([systemctl, "--user", "daemon-reload"])
        done = _run([systemctl, "--user", "enable", "--now", f"{UNIT}.timer"])
        if done.returncode != 0:
            raise RuntimeError((done.stderr or done.stdout or "").strip() or f"systemctl {done.returncode}")


def _unregister() -> None:
    if os.name == "nt":
        if registered():
            _run([_schtasks(), "/Delete", "/TN", TASK_NAME, "/F"])
        return
    if sys.platform == "darwin":
        _run(["/bin/launchctl", "bootout", f"gui/{os.getuid()}/{LABEL}"])
        # 우리가 만든 설정 파일 하나라 휴지통 대신 바로 지운다 (autostart.set_enabled 와 같음)
        _mac_plist_path().unlink(missing_ok=True)
        return
    if _is_linux():
        systemctl = _systemctl()
        if systemctl:
            _run([systemctl, "--user", "disable", "--now", f"{UNIT}.timer"])
        for name in (f"{UNIT}.timer", f"{UNIT}.service"):
            (_linux_unit_dir() / name).unlink(missing_ok=True)
        if systemctl:
            _run([systemctl, "--user", "daemon-reload"])


# ===== 켜고 끄기 =====

def _state_path(root: Path) -> Path:
    return Path(root) / STATE_NAME


def read_state(root: Path) -> dict:
    try:
        data = json.loads(_state_path(root).read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except (OSError, ValueError):
        return {}


def _write_state(root: Path, **fields) -> None:
    data = read_state(root)
    data.update(fields)
    try:
        path = _state_path(root)
        tmp = path.with_name(path.name + ".tmp")
        tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        os.replace(tmp, path)
    except OSError:
        pass


def apply(root: Path, on: bool, time_text: str) -> dict:
    """예약을 걸거나 푼다. {ok, enabled, message}"""
    if not supported():
        return {"ok": False, "enabled": False, "message": "이 컴퓨터에서는 쓸 수 없어요."}
    exe = _executable()
    hour, minute = parse_time(time_text)
    try:
        if not on:
            _unregister()
            _write_state(root, registered=None)
            return {"ok": True, "enabled": False, "message": "앱을 켤 때만 가져와요."}
        reason = _blocked_reason(exe)
        if reason:
            return {"ok": False, "enabled": registered(), "message": reason}
        _register(exe, hour, minute)
        _write_state(root, registered={"exe": str(exe), "time": f"{hour:02d}:{minute:02d}"})
        return {"ok": True, "enabled": True, "message": f"앱을 꺼 둬도 매일 {hour:02d}:{minute:02d}에 가져와요."}
    except Exception as exc:
        return {"ok": False, "enabled": registered(), "message": f"예약을 바꾸지 못했어요: {exc}"}


def refresh(root: Path, config: dict) -> None:
    """앱을 켤 때·설정을 저장할 때: 설정대로 예약을 맞춘다. 실행 파일 자리·시각이 그대로면 아무것도 안 한다."""
    try:
        if not supported():
            return
        exe = _executable()
        hour, minute = parse_time(str(config.get("SCHEDULE_TIME", "08:00")))
        want = {"exe": str(exe), "time": f"{hour:02d}:{minute:02d}"}
        if not wanted(config):
            if read_state(root).get("registered") or registered():
                apply(root, False, want["time"])
            return
        if _blocked_reason(exe):
            return
        if read_state(root).get("registered") == want and registered():
            return
        apply(root, True, want["time"])
    except Exception:
        pass


def status(root: Path, config: dict) -> dict:
    on = supported()
    hour, minute = parse_time(str(config.get("SCHEDULE_TIME", "08:00")))
    return {
        "ok": True,
        "supported": on,
        "enabled": on and wanted(config) and registered(),
        "time": f"{hour:02d}:{minute:02d}",
        "last": read_state(root).get("last"),
    }


# ===== 예약 작업과 앱이 겹치지 않게 =====

def _lock_path(root: Path) -> Path:
    return Path(root) / LOCK_NAME


def busy(root: Path) -> bool:
    """다른 프로세스(예약 작업)가 지금 가져오는 중인지."""
    if RUNNING_HERE:
        return False
    try:
        return time.time() - _lock_path(root).stat().st_mtime < LOCK_FRESH_SECONDS
    except OSError:
        return False


@contextlib.contextmanager
def hold(root: Path):
    """잠금을 쥔다. 이미 누가(살아 있는) 쥐고 있으면 False 를 내준다."""
    global RUNNING_HERE
    path = _lock_path(root)
    if busy(root):
        yield False
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(str(os.getpid()), encoding="utf-8")
    RUNNING_HERE = True
    stop = threading.Event()

    def beat():
        while not stop.wait(60):
            try:
                os.utime(path)
            except OSError:
                pass

    threading.Thread(target=beat, daemon=True).start()
    try:
        yield True
    finally:
        stop.set()
        RUNNING_HERE = False
        path.unlink(missing_ok=True)


def record_run(root: Path, result: dict) -> None:
    _write_state(root, last=result)
