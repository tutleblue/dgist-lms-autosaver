"""리눅스(x86_64) 판에서만 쓰는 것들.

왜 따로 두나
    app.py·web_ui.py·updater.py 의 Windows·맥 갈래를 건드리지 않고 리눅스만 고치려고. 여기 함수는 부르는 쪽이
    sys.platform.startswith("linux") 일 때만 부른다.

묶은 실행 파일(PyInstaller)에서 시스템 프로그램을 띄울 때
    PyInstaller 부트로더는 리눅스에서 LD_LIBRARY_PATH 앞에 묶음 폴더(_internal)를 붙이고 원래 값은
    LD_LIBRARY_PATH_ORIG 에 둔다 (PyInstaller 문서 'LD_LIBRARY_PATH / LIBPATH considerations').
    xdg-open 이 띄운 브라우저나 notify-send 가 이것을 물려받으면 우리가 묶은 (빌드한 Ubuntu 22.04 의) 라이브러리를
    먼저 집어 '심볼을 찾을 수 없음' 으로 죽을 수 있다. 시스템 프로그램에는 system_env() 로 원래 환경을 넘긴다.
    PyQt6 런타임 훅이 넣는 QT_PLUGIN_PATH, 우리가 넣는 QTWEBENGINE_DISABLE_SANDBOX 같은 Qt 설정도 같이 되돌린다
    (KDE 의 Qt 브라우저가 샌드박스 없이 뜨거나 우리 Qt 플러그인을 읽으면 안 된다).
"""
from __future__ import annotations

import os
import shutil
import socket
import subprocess
import sys
import webbrowser
from pathlib import Path

APP_NAME = "Daling"
DESKTOP_ID = "daling"  # packaging/linux/daling.desktop — Wayland app_id·X11 WM_CLASS 도 실행 파일 이름(daling)과 같다

# 우리가 바꾸는 Qt·pywebview 환경 변수. 바꾸기 전 값을 기억해 두었다가 시스템 프로그램에는 원래 값을 준다.
_OUR_VARS = (
    "QT_API",
    "PYWEBVIEW_GUI",
    "QT_QPA_PLATFORM",
    "QTWEBENGINE_DISABLE_SANDBOX",
    "QTWEBENGINE_CHROMIUM_FLAGS",
    "QT_STYLE_OVERRIDE",  # pywebview(qt)가 빈 값으로 덮는다
)
# 작업 프로세스는 화면 서버가 이미 바꾼 환경을 물려받는다. 그래서 바꾸기 전 값을 환경에도 적어 둔다
# (_DALING_ORIG_<이름>, 원래 없었으면 _UNSET). 이 모듈을 불러온 순간의 값보다 이것을 먼저 믿는다.
_MARK = "_DALING_ORIG_"
_UNSET = "\x01unset\x01"


def _snapshot() -> dict[str, str | None]:
    out: dict[str, str | None] = {}
    for name in _OUR_VARS:
        marked = os.environ.get(_MARK + name)
        if marked is not None:
            out[name] = None if marked == _UNSET else marked
        else:
            out[name] = os.environ.get(name)
    return out


_ORIGINAL = _snapshot()


def _set_default(name: str, value: str) -> None:
    """os.environ.setdefault 와 같되, 바꾸기 전(없었음)을 적어 둔다."""
    if name in os.environ:
        return
    os.environ.setdefault(_MARK + name, _UNSET)
    os.environ[name] = value


def _frozen() -> bool:
    return bool(getattr(sys, "frozen", False))


def _bundle_dir() -> str:
    base = getattr(sys, "_MEIPASS", "") or ""
    return os.path.realpath(base) if base else ""


def _inside_bundle(path: str) -> bool:
    base = _bundle_dir()
    if not base or not path:
        return False
    real = os.path.realpath(path)
    return real == base or real.startswith(base + os.sep)


def system_env() -> dict[str, str]:
    """시스템 프로그램(xdg-open·notify-send·브라우저)에 넘길 환경: 묶음 라이브러리·Qt 설정을 뺀 원래 환경."""
    env = {k: v for k, v in os.environ.items() if not k.startswith(_MARK)}
    for name, value in _ORIGINAL.items():
        if value is None:
            env.pop(name, None)
        else:
            env[name] = value
    if not _frozen():
        return env
    # 부트로더가 붙인 묶음 경로를 뺀다. 작업 프로세스(우리 실행 파일을 다시 띄운 것)에서는 _ORIG 에도 묶음 경로가
    # 들어 있을 수 있어, 원래 값으로 되돌린 뒤 묶음 안을 가리키는 항목을 한 번 더 걸러 낸다.
    if "LD_LIBRARY_PATH_ORIG" in env:
        value = env.pop("LD_LIBRARY_PATH_ORIG")
    else:
        value = ""  # 원래 비어 있었다
    kept = [p for p in value.split(os.pathsep) if p and not _inside_bundle(p)]
    if kept:
        env["LD_LIBRARY_PATH"] = os.pathsep.join(kept)
    else:
        env.pop("LD_LIBRARY_PATH", None)
    # PyQt6 런타임 훅(QT_PLUGIN_PATH·QML2_IMPORT_PATH)과 app.py 가 고른 certifi(SSL_CERT_FILE)는 묶음 안을 가리킨다.
    # 우리 앱이 끝나면(AppImage 는 마운트가 풀리면) 사라질 경로다.
    for name in ("QT_PLUGIN_PATH", "QML2_IMPORT_PATH", "SSL_CERT_FILE", "SSL_CERT_DIR"):
        if _inside_bundle(env.get(name, "")):
            env.pop(name, None)
    return env


def use_system_env_for_children() -> None:
    """작업 프로세스(--autosaver-job): 이 프로세스가 띄우는 것은 모두 시스템 프로그램이다
    (Playwright 의 node·크로미움, 구글 로그인 때 xdg-open). 환경을 통째로 시스템 쪽으로 돌려 둔다.

    이 프로세스 자신은 영향이 없다 — 동적 링커는 LD_LIBRARY_PATH 를 프로세스가 시작할 때 한 번만 읽는다.
    SSL_CERT_FILE 은 이 프로세스의 파이썬(학교 메일 IMAP)이 쓰므로 남긴다.
    """
    keep_cert = os.environ.get("SSL_CERT_FILE")
    clean = system_env()
    for name in list(os.environ):
        if name not in clean:
            del os.environ[name]
    os.environ.update(clean)
    if keep_cert:
        os.environ["SSL_CERT_FILE"] = keep_cert


def _spawn(command: list[str]) -> bool:
    try:
        subprocess.Popen(
            command,
            env=system_env(),
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            close_fds=True,
            start_new_session=True,  # 앱을 꺼도 띄운 브라우저·파일 관리자는 남게
        )
        return True
    except OSError:
        return False


def open_external(target: str) -> bool:
    """주소나 폴더를 데스크톱 기본 프로그램으로 연다 (xdg-open, 없으면 gio open). 셸을 거치지 않는다."""
    for command in (["xdg-open", target], ["gio", "open", target]):
        exe = shutil.which(command[0])
        if exe and _spawn([exe, *command[1:]]):
            return True
    return False


class _SystemBrowser(webbrowser.BaseBrowser):
    """webbrowser.open 이 xdg-open 을 원래 환경으로 부르게 한다 (구글 로그인 창·업데이트 받기·바깥 링크)."""

    def open(self, url, new=0, autoraise=True):  # noqa: A003 - webbrowser 규약
        sys.audit("webbrowser.open", url)
        return open_external(url)


def register_system_browser() -> None:
    """묶은 앱에서만: 파이썬 기본 webbrowser 는 바뀐 환경을 그대로 물려준다 (머리말)."""
    if not _frozen():
        return
    try:
        webbrowser.register("daling-xdg-open", None, _SystemBrowser("xdg-open"), preferred=True)
    except Exception:
        pass


def notify(title: str, message: str, icon: str = "") -> bool:
    """notify-send(libnotify)가 있으면 데스크톱 알림. 없으면 조용히 False.

    과목·과제 이름에 따옴표나 '-' 가 있어도 되게 셸 없이 인자로 넘기고, '--' 뒤에 둔다.
    """
    exe = shutil.which("notify-send")
    if not exe:
        return False
    command = [exe, f"--app-name={APP_NAME}", f"--hint=string:desktop-entry:{DESKTOP_ID}"]
    if icon and os.path.isfile(icon):
        command.append(f"--icon={icon}")
    command += ["--", title, message]
    try:
        subprocess.run(
            command,
            env=system_env(),
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=15,
        )
        return True
    except Exception:
        return False


def _x11_ok(display: str) -> bool:
    host, _, rest = display.rpartition(":")
    number = rest.split(".", 1)[0]
    if host not in ("", "unix") or not number.isdigit():
        return True  # 원격 X(ssh -X 등): 붙어 보는 것은 Qt 에 맡긴다
    path = f"/tmp/.X11-unix/X{number}"
    if os.path.exists(path):
        return True
    # 파일 없이 추상 소켓(@/tmp/.X11-unix/Xn)만 여는 X 서버도 있다
    try:
        with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as sock:
            sock.settimeout(1.0)
            sock.connect("\0" + path)
        return True
    except OSError:
        return False


def display_problem() -> str:
    """창을 띄울 화면이 없으면 그 까닭, 있으면 빈 문자열.

    Qt 는 화면에 붙지 못하면 예외가 아니라 qFatal 로 프로세스를 통째로 끝낸다(abort). 그러면 화면 서버·예약 작업까지
    같이 죽으므로 Qt 를 부르기 전에 여기서 본다. 한쪽(Wayland·X11)만 쓸 수 있으면 Qt 가 그쪽을 고르게 정해 준다.
    """
    wayland = os.environ.get("WAYLAND_DISPLAY", "").strip()
    wayland_ok = False
    if wayland:
        sock = wayland if wayland.startswith("/") else os.path.join(os.environ.get("XDG_RUNTIME_DIR", ""), wayland)
        wayland_ok = os.path.exists(sock)
    display = os.environ.get("DISPLAY", "").strip()
    x11_ok = bool(display) and _x11_ok(display)
    if wayland_ok and not x11_ok:
        _set_default("QT_QPA_PLATFORM", "wayland")
    elif x11_ok and not wayland_ok:
        _set_default("QT_QPA_PLATFORM", "xcb")
    if wayland_ok or x11_ok:
        return ""
    if not wayland and not display:
        return "화면(DISPLAY·WAYLAND_DISPLAY)이 없습니다"
    return f"화면에 붙을 수 없습니다 (DISPLAY={display or '-'}, WAYLAND_DISPLAY={wayland or '-'})"


def _read_proc(path: str) -> str:
    try:
        return Path(path).read_text(encoding="ascii", errors="replace").strip()
    except OSError:
        return ""


def webengine_sandbox_problem() -> str:
    """QtWebEngine(크로미움) 샌드박스를 쓸 수 없는 까닭. 쓸 수 있으면 빈 문자열.

    크로미움 샌드박스는 권한 없는 사용자 네임스페이스가 있어야 한다. QtWebEngine 은 setuid 샌드박스(chrome-sandbox)를
    따로 싣지 않아서, 네임스페이스가 막히면 'No usable sandbox!' 로 창이 아예 뜨지 않는다.
      - Ubuntu 23.10+/24.04: AppArmor 가 프로필 없는 앱의 네임스페이스를 막는다 (apparmor_restrict_unprivileged_userns=1)
      - 옛 데비안 커널: unprivileged_userns_clone=0, 그 밖에 max_user_namespaces=0
      - root 로 켬: 크로미움이 샌드박스를 거부한다
    """
    if _read_proc("/proc/sys/kernel/apparmor_restrict_unprivileged_userns") == "1":
        return "AppArmor 가 사용자 네임스페이스를 막음 (Ubuntu 23.10 이후)"
    if _read_proc("/proc/sys/kernel/unprivileged_userns_clone") == "0":
        return "커널이 권한 없는 사용자 네임스페이스를 막음"
    if _read_proc("/proc/sys/user/max_user_namespaces") == "0":
        return "사용자 네임스페이스 수가 0"
    try:
        if os.geteuid() == 0:
            return "root 로 실행"
    except AttributeError:
        pass
    return ""


def prepare_qt() -> str:
    """Qt 를 부르기 전에: pywebview 가 Qt(PyQt6)를 고르게 하고, 필요할 때만 크로미움 샌드박스를 끈다.

    돌려주는 값: 샌드박스를 끈 까닭 (껐으면).
    샌드박스를 끄면 웹 화면 프로세스가 커널 격리 없이 돈다. 그래도 되는 까닭: 이 창은 우리 화면 서버
    (http://127.0.0.1:<포트>)만 띄우고, 바깥 링크는 시스템 브라우저로 넘긴다(pywebview OPEN_EXTERNAL_LINKS_IN_BROWSER).
    남이 보낸 글(메일 HTML)은 스크립트를 막은 sandbox iframe(index.html 의 sandbox="allow-same-origin") 안에서만 그린다.
    샌드박스를 쓸 수 있는 시스템에서는 끄지 않는다.
    """
    _set_default("QT_API", "pyqt6")  # qtpy 가 PyQt6 를 고르게 (묶음에는 PyQt6 만 있다)
    _set_default("PYWEBVIEW_GUI", "qt")  # webview.screens 처럼 gui 를 못 넘기는 곳에서도 Qt 를 먼저
    reason = webengine_sandbox_problem()
    if reason:
        _set_default("QTWEBENGINE_DISABLE_SANDBOX", "1")
    return reason


def xdg_user_dir(kind: str) -> Path | None:
    """~/.config/user-dirs.dirs 의 XDG_<kind>_DIR (예: 한국어 우분투의 문서 폴더는 ~/문서). 없으면 None."""
    config = Path(os.environ.get("XDG_CONFIG_HOME") or Path.home() / ".config") / "user-dirs.dirs"
    try:
        lines = config.read_text(encoding="utf-8").splitlines()
    except OSError:
        return None
    key = f"XDG_{kind.upper()}_DIR="
    home = str(Path.home())
    for line in lines:
        line = line.strip()
        if not line.startswith(key):
            continue
        value = line[len(key):].strip().strip('"')
        value = value.replace("$HOME", home)
        if not value.startswith("/") or os.path.realpath(value) == os.path.realpath(home):
            return None  # 꺼 둔 항목은 홈 폴더를 가리킨다
        return Path(value)
    return None


# 배포판마다 CA 묶음 자리가 다르다 (Go 의 crypto/x509 가 찾는 순서와 같은 목록)
_CA_FILES = (
    "/etc/ssl/certs/ca-certificates.crt",  # Debian·Ubuntu·Arch·Gentoo
    "/etc/pki/tls/certs/ca-bundle.crt",  # Fedora·RHEL
    "/etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem",  # Fedora·RHEL (새 자리)
    "/etc/ssl/ca-bundle.pem",  # openSUSE
    "/etc/ssl/cert.pem",  # Alpine 등
)


def pick_ca_file() -> str:
    """시스템 CA 묶음 (학교·회사가 깐 인증서도 따르게), 없으면 certifi."""
    for path in _CA_FILES:
        if os.path.isfile(path):
            return path
    try:
        import certifi

        return certifi.where()
    except Exception:
        return ""


def appimage_path() -> str:
    """AppImage 로 켰으면 그 .AppImage 파일 경로. 다시 켤 때 안쪽 실행 파일이 아니라 이것을 불러야 한다
    (원래 프로세스가 끝나면 AppImage 마운트가 풀려 안쪽 파일이 사라진다)."""
    path = os.environ.get("APPIMAGE", "")
    return path if path and os.path.isfile(path) else ""
