"""LMS 로그인에 쓸 크로미움을 처음 한 번 내려받는다.

왜 앱에 같이 넣지 않았나
    크로미움은 426MB(헤드리스 전용도 270MB)라 설치 파일에 넣으면 배포본이
    400MB를 넘는다. 대신 브라우저를 돌리는 부분(playwright 패키지)만 넣고,
    LMS를 처음 쓸 때 실제 브라우저를 받는다. 한 번 받으면 계속 쓴다.

받는 위치
    %LOCALAPPDATA%\\ms-playwright — 앱을 지웠다 다시 깔아도 남는다.
    (맥은 ~/Library/Caches/ms-playwright, 리눅스는 ~/.cache/ms-playwright)
    이미 개발용으로 playwright 를 쓴 적 있으면 그것을 그대로 쓴다.
"""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path


def _default_root() -> Path:
    if os.name == "nt":
        return Path(os.environ.get("LOCALAPPDATA", Path.home())) / "ms-playwright"
    if sys.platform == "darwin":
        # Playwright 가 맥에서 원래 쓰는 곳. 개발용으로 받아 둔 브라우저가 있으면 그대로 쓴다.
        return Path.home() / "Library" / "Caches" / "ms-playwright"
    # 리눅스: Playwright 와 같은 규칙 (XDG_CACHE_HOME, 없으면 ~/.cache). AppImage 안은 읽기 전용이라 늘 사용자 폴더다.
    cache = os.environ.get("XDG_CACHE_HOME", "").strip()
    return (Path(cache) if cache else Path.home() / ".cache") / "ms-playwright"


def browsers_root() -> Path:
    custom = os.environ.get("PLAYWRIGHT_BROWSERS_PATH", "").strip()
    return Path(custom) if custom else _default_root()


# EXE 로 묶으면 playwright 드라이버가 앱 폴더 안(_internal\playwright\driver\
# package\.local-browsers)에서 브라우저를 찾는다. 거기엔 아무것도 없고, 설치
# 폴더는 보통 쓰기도 막혀 있다. 그래서 찾는 위치를 사용자 폴더로 고정한다.
# (launch 전에 정해져 있어야 해서 이 모듈을 불러오는 시점에 박아 둔다)
os.environ.setdefault("PLAYWRIGHT_BROWSERS_PATH", str(_default_root()))


# 맥의 크로미움은 .exe 도 'chrome' 도 아니다. 판마다 이름이 달라 아는 것을 모두 본다.
#   헤드리스 셸: chrome-headless-shell-mac-arm64/chrome-headless-shell (예전 판은 chrome-mac/headless_shell)
#   일반 크로미움: chrome-mac*/Chromium.app/…/MacOS/Chromium, 새 판은 'Google Chrome for Testing'
_MAC_BROWSER_FILES = ("chrome-headless-shell", "headless_shell", "Chromium", "Google Chrome for Testing")
# 리눅스도 .exe 가 없다. 헤드리스 셸은 chrome-headless-shell-linux64/chrome-headless-shell (예전 판은
# chrome-linux/headless_shell), 일반 크로미움은 chrome-linux64/chrome·chrome-linux/chrome.
# 예전 검사(rglob("chrome"))는 헤드리스 셸 이름을 몰라서, 받고 나서도 '설치가 끝나지 않았습니다' 로 보였을 것이다.
_LINUX_BROWSER_FILES = ("chrome-headless-shell", "headless_shell", "chrome")


# ===== Windows: 이미 깔려 있는 Microsoft Edge 를 먼저 쓴다 (2026-10-15) =====
# Playwright 가 받는 chrome-headless-shell.exe·dll 은 서명이 없다(실측 NotSigned). 스마트 앱 컨트롤이 켜진 PC 에서는
# Store 판도 LMS 동기화가 막힐 수 있다. Edge 는 Microsoft 서명이고 Windows 10/11 에 늘 있어 270MB 첫 다운로드도 없다.
# 실측(2026-10-15, Edge 155): SSO 로그인 52초·과목 21개·콘텐츠 17/21(나머지는 지난 학기 403) — headless shell 과 같다.
# 찾는 자리는 Playwright 의 channel="msedge" 와 같은 순서 (LOCALAPPDATA → PROGRAMFILES → PROGRAMFILES(X86)).
EDGE_CHANNEL = "msedge"


def system_edge() -> Path | None:
    """Windows 에 깔린 Edge 실행 파일. 없거나 다른 운영체제면 None. AUTOSAVER_LMS_BROWSER=shell 이면 Edge 를 건너뛴다(시험용)."""
    if os.name != "nt" or os.environ.get("AUTOSAVER_LMS_BROWSER", "").strip().lower() == "shell":
        return None
    for var in ("LOCALAPPDATA", "PROGRAMFILES", "PROGRAMFILES(X86)"):
        base = os.environ.get(var, "").strip()
        if base:
            exe = Path(base) / "Microsoft" / "Edge" / "Application" / "msedge.exe"
            if exe.is_file():
                return exe
    return None


def browser_ready() -> bool:
    """LMS 로그인에 쓸 브라우저가 있는지 (Windows Edge 또는 받아 둔 헤드리스 셸)."""
    return system_edge() is not None or shell_ready()


def browser_label() -> str:
    """점검 화면용: 어떤 브라우저를 쓸지."""
    if system_edge() is not None:
        return "Edge"
    return "headless shell" if shell_ready() else "없음"


def shell_ready() -> bool:
    """크로미움(또는 헤드리스 셸)이 이미 받아져 있는지."""
    root = browsers_root()
    if not root.exists():
        return False
    # Windows 는 Edge 가 실패했을 때만 셸로 띄우고, Playwright 1.49+ 의 headless 실행은 chromium_headless_shell 만 쓴다.
    # 개발용 chromium-* 도 '있다' 로 보면, 셸을 휴지통에 보낸 뒤(설정 › 앱 크기) 다시 받지 않고 실행이 깨진다.
    prefixes = ("chromium_headless_shell-",) if os.name == "nt" else ("chromium-", "chromium_headless_shell-")
    for child in root.iterdir():
        name = child.name.lower()
        if name.startswith(prefixes):
            if sys.platform == "darwin":
                if any(p.is_file() for n in _MAC_BROWSER_FILES for p in child.rglob(n)):
                    return True
                continue
            if sys.platform.startswith("linux"):
                if any(p.is_file() for n in _LINUX_BROWSER_FILES for p in child.rglob(n)):
                    return True
                continue
            # 폴더만 남고 알맹이가 없는 경우가 있어 실행 파일까지 본다
            if any(child.rglob("*.exe")) or any(child.rglob("chrome")):
                return True
    return False


def shell_dirs() -> list[Path]:
    """앱이 받는 헤드리스 셸 폴더(chromium_headless_shell-*). 같은 폴더의 개발용 chromium-* 는 앱 몫이 아니라 빼 둔다."""
    root = browsers_root()
    if not root.is_dir():
        return []
    return sorted(d for d in root.iterdir() if d.is_dir() and d.name.lower().startswith("chromium_headless_shell-"))


# Edge 를 못 띄워 셸로 되돌아간 적이 있으면 남기는 표시. 회사·학교 정책으로 headless Edge 가 늘 막힌 PC 에서
# 셸을 '안 씀'으로 보여 휴지통으로 보내게 하면, 다음 동기화가 270MB 를 다시 받는다. Edge 가 다시 뜨면 지운다.
def _edge_failed_marker() -> Path:
    return browsers_root() / "daling-edge-failed.txt"


def edge_failed() -> bool:
    """가장 최근 Edge 실행이 실패해 셸로 되돌아갔는지."""
    return _edge_failed_marker().is_file()


def _remember_edge_result(ok: bool, reason: str = "") -> None:
    marker = _edge_failed_marker()
    try:
        if ok:
            marker.unlink(missing_ok=True)
        else:
            from datetime import datetime

            marker.parent.mkdir(parents=True, exist_ok=True)
            marker.write_text(f"{datetime.now().isoformat(timespec='seconds')} {reason}\n", encoding="utf-8")
    except OSError:
        pass


def shell_unused() -> bool:
    """받아 둔 헤드리스 셸을 지금은 안 쓰는지 (Windows 에 Edge 가 있고, 최근 Edge 실행이 실패하지 않았으면)."""
    return system_edge() is not None and not edge_failed()


def recycle(path: Path) -> bool:
    """폴더를 Windows 휴지통으로 보낸다. 옮겼으면 True. 지우지는 않는다(휴지통에서 되살릴 수 있다).

    쓰는 중이면(Edge 가 실패해 셸로 동기화하는 중 등) 일부 파일만 옮겨질 수 있어, 이름을 잠깐 바꿔 보아 잠겼는지 먼저 본다.
    휴지통에 안 들어가는 크기면 Windows 가 그냥 지우려 하므로 FOF_WANTNUKEWARNING 으로 사용자에게 먼저 묻게 한다.
    """
    if os.name != "nt" or not path.is_dir():
        return False
    import ctypes
    from ctypes import wintypes

    probe = path.with_name(path.name + ".daling-check")
    try:
        path.rename(probe)
    except OSError:
        return False
    try:
        probe.rename(path)
    except OSError:
        path = probe  # 되돌리지 못했으면 바뀐 이름 그대로 보낸다

    class SHFILEOPSTRUCTW(ctypes.Structure):
        _fields_ = [
            ("hwnd", wintypes.HWND), ("wFunc", wintypes.UINT), ("pFrom", wintypes.LPCWSTR),
            ("pTo", wintypes.LPCWSTR), ("fFlags", ctypes.c_ushort), ("fAnyOperationsAborted", wintypes.BOOL),
            ("hNameMappings", ctypes.c_void_p), ("lpszProgressTitle", wintypes.LPCWSTR),
        ]

    fo_delete = 3
    # FOF_SILENT | FOF_NOCONFIRMATION | FOF_ALLOWUNDO(휴지통) | FOF_NOERRORUI | FOF_WANTNUKEWARNING
    flags = 0x0004 | 0x0010 | 0x0040 | 0x0400 | 0x4000
    # pFrom 은 \0 두 개로 끝나야 한다 (ctypes 가 하나를 더 붙인다)
    op = SHFILEOPSTRUCTW(wFunc=fo_delete, pFrom=str(path.resolve()) + "\0", fFlags=flags)
    result = ctypes.windll.shell32.SHFileOperationW(ctypes.byref(op))
    return result == 0 and not op.fAnyOperationsAborted and not path.exists()


def _driver_command() -> list[str]:
    """`playwright install` 을 부를 명령.

    EXE 로 묶이면 `python -m playwright` 가 통하지 않는다(파이썬이 없다).
    playwright 가 함께 넣어 둔 node 드라이버를 직접 부른다.
    """
    if not getattr(sys, "frozen", False):
        return [sys.executable, "-m", "playwright"]

    import playwright

    driver = Path(playwright.__file__).parent / "driver"
    node = driver / ("node.exe" if os.name == "nt" else "node")
    cli = driver / "package" / "cli.js"
    if sys.platform == "darwin" and node.exists() and not os.access(node, os.X_OK):
        # Daling.app 에서는 node 가 데이터 파일로 묶여(Contents/Resources) 실행 권한이 빠질 수 있다.
        # mac.yml 이 묶을 때 chmod 하지만, 그래도 빠졌으면 여기서 한 번 더 붙여 본다.
        try:
            node.chmod(0o755)
        except OSError:
            pass
    if sys.platform.startswith("linux") and node.exists() and not os.access(node, os.X_OK):
        # 리눅스도 node 가 데이터 파일로 묶여 실행 권한이 빠진다. linux.yml 이 묶기 전에 chmod 한다.
        # AppImage 안은 읽기 전용이라 여기서는 고칠 수 없다 — 쓸 수 있을 때(tar.gz 로 깐 폴더)만 해 본다.
        if os.access(node, os.W_OK):
            try:
                node.chmod(0o755)
            except OSError:
                pass
    if node.exists() and cli.exists():
        return [str(node), str(cli)]
    raise RuntimeError("브라우저 설치 도구를 찾지 못했습니다.")


def ensure_browser() -> bool:
    """쓸 브라우저를 확보한다. Windows 에 Edge 가 있으면 아무것도 받지 않는다."""
    if system_edge() is not None:
        return True
    return ensure_shell()


def ensure_shell() -> bool:
    """헤드리스 셸이 없으면 받는다. 받는 동안 진행 상황을 그대로 화면에 흘려보낸다."""
    if shell_ready():
        return True

    print("LMS 로그인에 쓸 브라우저가 없어 처음 한 번 내려받습니다.")
    print("270MB 정도이고, 다음부터는 바로 시작합니다.")
    sys.stdout.flush()

    try:
        command = _driver_command() + ["install", "chromium", "--only-shell"]
    except RuntimeError as exc:
        print(f"{exc}")
        return False

    try:
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0) if os.name == "nt" else 0,
        )
    except Exception as exc:
        print(f"브라우저를 받지 못했습니다: {exc}")
        return False

    for line in process.stdout or []:
        line = line.rstrip()
        # 진행률 막대는 줄마다 쏟아져서 로그를 덮는다. 요점만 남긴다.
        if line and "%" not in line:
            print(line)
            sys.stdout.flush()
    process.wait()

    if process.returncode != 0 or not shell_ready():
        print("브라우저 설치가 끝나지 않았습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.")
        return False

    print("브라우저 준비 완료.")
    return True


async def launch_lms_browser(playwright, headless: bool = True, env: dict[str, str] | None = None,
                             download: bool = True):
    """LMS 로그인용 브라우저를 띄운다. Windows 는 Edge 먼저, 실패하면 헤드리스 셸. 못 구하면 None.

    download=False 면 셸이 없을 때 받지 않고 None (화면 요청 안에서 270MB 를 받지 않게 — 시간표 링크 가져오기).
    env 는 리눅스 묶음 앱의 화면 서버가 부를 때 넘긴다(launch_env). 어떤 브라우저를 썼는지 로그에 한 줄 남긴다.
    """
    import asyncio

    if system_edge() is not None:
        try:
            browser = await playwright.chromium.launch(channel=EDGE_CHANNEL, headless=headless, env=env)
            _remember_edge_result(True)
            print(f"LMS 접속 브라우저: Microsoft Edge {browser.version}")
            return browser
        except Exception as exc:
            # 회사·학교 정책으로 headless 가 막혔거나 Edge 가 업데이트 중일 수 있다. 예전 길로 되돌아간다
            first = (str(exc).strip().splitlines() or [type(exc).__name__])[0][:160]
            _remember_edge_result(False, first)
            print(f"Edge 를 띄우지 못해 내려받은 브라우저로 바꿉니다: {first}")
            sys.stdout.flush()
    # Edge 가 없는 PC 는 부르는 쪽(lms_crawler)이 ensure_browser 로 이미 받아 두었다. 여기서 받는 것은 Edge 가 실패했을 때뿐
    if not shell_ready() and not (download and await asyncio.to_thread(ensure_shell)):
        return None
    try:
        browser = await playwright.chromium.launch(headless=headless, env=env)
    except Exception as exc:
        # 리눅스에서 시스템 라이브러리가 빠져 못 띄웠으면 설치 명령을 알려 준다 (다른 운영체제는 아무것도 안 함)
        explain_launch_failure(exc)
        raise
    print(f"LMS 접속 브라우저: Chromium headless shell {browser.version}")
    return browser


# ===== 리눅스: 크로미움에 필요한 시스템 라이브러리가 없을 때 =====
# 크로미움은 libnss3·libgbm 같은 시스템 라이브러리를 쓴다. 데스크톱 배포판에는 보통 있지만 최소 설치에는 없다.
# Playwright 의 오류는 'sudo playwright install-deps' 를 권하는데, 앱에는 그 명령이 없다. 배포판에 맞는 설치 명령을 한 줄로 보여 준다.
# 패키지 목록은 Playwright(1.62) nativeDeps 의 크로미움 목록 중 데스크톱에서 빠지기 쉬운 것.
_APT_PACKAGES = ("libnss3", "libnspr4", "libatk1.0-0", "libatk-bridge2.0-0", "libcups2", "libxkbcommon0",
                 "libxcomposite1", "libxdamage1", "libxrandr2", "libgbm1", "libpango-1.0-0", "libcairo2", "libasound2")
# Ubuntu 24.04·Debian 13 부터는 64비트 시간 전환으로 몇 이름 뒤에 t64 가 붙었다 (libasound2 는 이름만 남아 설치가 안 된다)
_APT_T64 = {"libatk1.0-0": "libatk1.0-0t64", "libatk-bridge2.0-0": "libatk-bridge2.0-0t64",
            "libcups2": "libcups2t64", "libasound2": "libasound2t64"}
_DNF_PACKAGES = ("nss", "nspr", "atk", "at-spi2-atk", "cups-libs", "libxkbcommon", "libXcomposite", "libXdamage",
                 "libXrandr", "mesa-libgbm", "pango", "cairo", "alsa-lib")
_PACMAN_PACKAGES = ("nss", "at-spi2-core", "libcups", "libxkbcommon", "libxcomposite", "libxdamage",
                    "libxrandr", "mesa", "pango", "cairo", "alsa-lib")
_MISSING_LIB_SIGNS = ("missing dependencies", "error while loading shared libraries", "cannot open shared object file")


def _os_release() -> dict[str, str]:
    info: dict[str, str] = {}
    for path in ("/etc/os-release", "/usr/lib/os-release"):
        try:
            text = Path(path).read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        for line in text.splitlines():
            if "=" in line and not line.lstrip().startswith("#"):
                key, _, value = line.partition("=")
                info[key.strip()] = value.strip().strip('"').strip("'")
        break
    return info


def launch_env() -> dict[str, str] | None:
    """chromium.launch(env=...) 에 넘길 환경. 리눅스 묶음 앱이면 시스템 환경(linux_support.system_env), 아니면 None(그대로)."""
    if not (sys.platform.startswith("linux") and getattr(sys, "frozen", False)):
        return None
    try:
        import linux_support

        return linux_support.system_env()
    except Exception:
        return None


def linux_deps_command() -> str:
    """이 배포판에서 크로미움 라이브러리를 까는 명령 (모르는 배포판이면 빈 문자열)."""
    info = _os_release()
    ids = {info.get("ID", "").lower(), *info.get("ID_LIKE", "").lower().split()}
    if ids & {"ubuntu", "debian"}:
        # 우분투 계열(민트·팝 등)은 UBUNTU_CODENAME 이 있다. 22.04(jammy) 이전 이름만 t64 전이다
        ubuntu = info.get("UBUNTU_CODENAME") or (info.get("VERSION_CODENAME") if "ubuntu" in ids else "")
        if ubuntu:
            t64 = ubuntu.lower() not in ("bionic", "focal", "jammy")
        else:
            t64 = info.get("VERSION_CODENAME", "").lower() not in ("buster", "bullseye", "bookworm")
        names = [_APT_T64.get(p, p) if t64 else p for p in _APT_PACKAGES]
        return "sudo apt install " + " ".join(names)
    if ids & {"fedora", "rhel", "centos"}:
        return "sudo dnf install " + " ".join(_DNF_PACKAGES)
    if ids & {"arch", "manjaro", "endeavouros"}:
        return "sudo pacman -S --needed " + " ".join(_PACMAN_PACKAGES)
    return ""


def explain_launch_failure(exc: BaseException) -> None:
    """크로미움을 못 띄운 까닭이 시스템 라이브러리 부족이면 설치 명령을 한 줄 알려 준다 (리눅스만, 아니면 아무것도 안 함).

    부르는 쪽(lms_crawler)은 이것을 찍은 뒤 원래 예외를 그대로 다시 던진다.
    """
    if not sys.platform.startswith("linux"):
        return
    text = str(exc).lower()
    if not any(sign in text for sign in _MISSING_LIB_SIGNS):
        return
    command = linux_deps_command()
    if command:
        print(f"[안내] LMS 접속용 브라우저에 필요한 시스템 라이브러리가 없습니다. 터미널에서 설치해 주세요: {command}")
    else:
        print("[안내] LMS 접속용 브라우저에 필요한 시스템 라이브러리가 없습니다. 오류 내용에 나온 라이브러리를 배포판 패키지로 설치해 주세요.")
    sys.stdout.flush()


if __name__ == "__main__":
    print(f"브라우저: {browser_label()}")
    raise SystemExit(0 if ensure_browser() else 1)
