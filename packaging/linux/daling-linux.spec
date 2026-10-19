# -*- mode: python ; coding: utf-8 -*-
"""Daling 을 리눅스(x86_64) 폴더 묶음(onedir)으로 묶는다.

Windows 판(bungeoppang.spec)·맥 판(packaging/mac/daling-mac.spec)과 같은 화면·데이터를 넣고, Windows 전용
(pythonnet·winotify·WinRT)과 맥 전용(pyobjc)은 뺀다. 리눅스 판은 GitHub Actions(.github/workflows/linux.yml)의
ubuntu-22.04 에서만 만든다 — 묶은 파이썬·라이브러리가 빌드한 곳의 glibc(2.35)를 요구하므로 가장 오래된 대상에서 묶는다.

    python -m PyInstaller packaging/linux/daling-linux.spec --noconfirm     (저장소 맨 위에서)
    → dist/daling/daling (+ dist/daling/_internal)   → linux.yml 이 AppImage·tar.gz 로 싼다

리눅스에서 다른 점
  - 실행 파일 이름은 daling. 작업 프로세스도 이 파일에 --autosaver-job 을 붙여 띄운다.
  - 창은 pywebview 의 Qt(PyQt6 + QtWebEngine). WebKitGTK 는 도우미 프로세스 경로가 빌드 때 박혀 있어 묶을 수 없다.
  - 비밀 설정은 Secret Service(linux_secrets.py, secretstorage·jeepney), 알림은 notify-send (app.notify).
  - 시스템 라이브러리 일부는 일부러 뺀다 (아래 _SYSTEM_LIBS).
"""

import re
from pathlib import Path

PROJECT = Path(SPECPATH).resolve().parent.parent
VERSION = (PROJECT / "VERSION").read_text(encoding="utf-8").strip()

# 화면 파일·사진·버전은 Windows·맥 판과 똑같이 넣는다
datas = [
    (str(PROJECT / "web"), "web"),
    (str(PROJECT / "uni_photos.json"), "."),
    (str(PROJECT / "VERSION"), "."),
    (str(PROJECT / "config.example.py"), "."),
]

# 학사일정·개설강좌 씨앗 데이터 (없어도 돈다. 넣어 두면 처음 켰을 때 화면이 바로 찬다)
_seed = PROJECT / "data"
if _seed.exists():
    datas.append((str(_seed), "data"))
else:
    print("[Daling linux] data/ 가 없어 씨앗 데이터 없이 묶습니다.")

# 공공데이터포털 기본 키와 데스크톱 OAuth 클라이언트: 공개 저장소에는 없고(.gitignore)
# CI 가 secrets 에서 만든 파일이 있을 때만 넣는다 (bungeoppang.spec·daling-mac.spec 과 같은 규칙)
_pdkey = PROJECT / "public_data_key.txt"
if _pdkey.exists():
    datas.append((str(_pdkey), "."))
else:
    print("[Daling linux] public_data_key.txt 가 없어 공공데이터 기본 키 없이 묶습니다.")

_client = PROJECT / "google_client.json"
if _client.exists():
    datas.append((str(_client), "."))
else:
    print("[Daling linux] google_client.json 이 없어 로그인 준비물 없이 묶습니다.")

hiddenimports = [
    # LMS 로그인(SSO)은 실제 브라우저를 몰아야 해서 playwright 가 꼭 필요하다 (브라우저는 첫 사용 때 받음)
    "playwright",
    "playwright.async_api",
    "playwright._impl._driver",
    "browser_setup",
    # 삼성 노트는 리눅스에 없다. 그래도 화면 서버가 불러 '없음' 으로 답하므로 모듈은 넣는다 (WinRT 는 안 넣음)
    "samsung_notes",
    "course_meta",
    # 메일 쓰기 흐름·AI 도우미 (web_ui 함수 안에서 늦게 불러온다)
    "mail_flow",
    "ai_cli",
    # 구글 라이브러리는 늦게 불러오는 곳이 있어 PyInstaller 가 놓친다
    "googleapiclient.discovery",
    "googleapiclient.http",
    "google.oauth2.credentials",
    "google_auth_oauthlib.flow",
    "google.auth.transport.requests",
    "schedule",
    "certifi",
    "smoke_test",
    # 리눅스 전용
    "linux_support",
    "secret_store",
    "linux_secrets",
    "secretstorage",
    "jeepney",
    "jeepney.io.blocking",
    # pywebview 의 Qt 창은 webview.start(gui="qt") 때 늦게 불러오고, qtpy 는 바인딩을 이름으로 고른다
    "webview.platforms.qt",
    "qtpy",
    "qtpy.QtCore",
    "qtpy.QtGui",
    "qtpy.QtWidgets",
    "qtpy.QtNetwork",
    "qtpy.QtWebChannel",
    "qtpy.QtWebEngineCore",
    "qtpy.QtWebEngineWidgets",
    "PyQt6.sip",
    "PyQt6.QtCore",
    "PyQt6.QtGui",
    "PyQt6.QtWidgets",
    "PyQt6.QtNetwork",
    "PyQt6.QtPrintSupport",
    "PyQt6.QtWebChannel",
    "PyQt6.QtWebEngineCore",
    "PyQt6.QtWebEngineWidgets",
]

excludes = [
    # 안 쓰는 무거운 것 (Windows·맥 판과 같음)
    "tkinter", "matplotlib", "numpy", "pandas", "PIL", "pytest",
    # Windows 전용
    "pythonnet", "clr", "clr_loader", "winotify", "winrt", "win32ctypes", "pywintypes",
    "webview.platforms.edgechromium", "webview.platforms.winforms",
    "webview.platforms.mshtml", "webview.platforms.win32",
    # 맥 전용
    "mac_keychain", "AppKit", "Foundation", "WebKit", "objc", "PyObjCTools", "UniformTypeIdentifiers",
    "webview.platforms.cocoa",
    # pywebview 의 다른 창 (Qt 만 쓴다). qtpy 가 이름으로 찾는 다른 Qt 바인딩도 뺀다 — 둘 이상 묶이면 PyInstaller 가 멈춘다
    "webview.platforms.gtk", "webview.platforms.cef", "webview.platforms.android", "gi",
    "PyQt5", "PySide2", "PySide6",
]

a = Analysis(
    [str(PROJECT / "app.py")],
    pathex=[str(PROJECT)],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    runtime_hooks=[],
    excludes=excludes,
    noarchive=False,
)


# build_installer.ps1 [2/5] 의 '불필요한 파일 정리' 와 같은 일 (daling-mac.spec 과 같은 목록)
_KEEP_DISCOVERY = re.compile(r"/(calendar\.v3|drive\.v3|drive\.v2|oauth2\.v2)\.json$")


def _keep(dest: str) -> bool:
    d = dest.replace("\\", "/")
    if "/discovery_cache/documents/" in d and not _KEEP_DISCOVERY.search(d):
        return False  # 구글 API 설명 파일은 수백 개인데 쓰는 것은 넷뿐
    if d.startswith(("playwright/driver/package/lib/vite/", "playwright/driver/package/types/")):
        return False  # 트레이스 뷰어·타입 선언 (~5MB)
    if d.endswith("pywebview-android.jar"):
        return False
    return True


_before = len(a.datas)
a.datas = [entry for entry in a.datas if _keep(entry[0])]
print(f"[Daling linux] 데이터 파일 {_before} → {len(a.datas)}개")


# 묶지 않는 시스템 라이브러리 — 받는 사람 컴퓨터의 것을 쓴다.
#   PyInstaller 는 빌드한 Ubuntu 22.04 의 라이브러리를 _internal 에 넣고 LD_LIBRARY_PATH 앞에 둔다. 그런데 앱 안으로
#   시스템 플러그인이 들어오면(그래픽 드라이버 Mesa, GIO 모듈, 글꼴 설정) 그것들은 받는 사람 배포판의 더 새 라이브러리를
#   바라는데 우리의 옛 판이 먼저 잡혀 '버전을 찾을 수 없음' 으로 죽거나 그림이 깨진다. 아래는 모든 데스크톱 배포판에 있고
#   이전 판과 호환되는 것들이라(대상: Ubuntu 22.04+·Debian 12+·Fedora 36+, 빌드는 그중 가장 오래된 22.04) 시스템 것을
#   쓰게 둔다 (AppImage 의 excludelist 와 같은 생각). 라이브러리가 아예 없는 최소 설치에서는 Qt 를 못 불러오고,
#   app.run_in_browser 가 창 대신 브라우저로 연다.
_SYSTEM_LIBS = re.compile(
    r"^lib("
    r"stdc\+\+|gcc_s"  # C++ 런타임: 새 Mesa(LLVM) 드라이버가 더 새 판을 바란다
    r"|glib-2\.0|gobject-2\.0|gio-2\.0|gmodule-2\.0|gthread-2\.0|mount|blkid|selinux|pcre2-8"  # GLib 과 그 짝 (GIO 모듈)
    r"|fontconfig|freetype|harfbuzz|expat|png16|brotlidec|brotlicommon|uuid|z"  # 글꼴: 새 /etc/fonts 설정을 옛 판이 못 읽는다
    r"|X11|X11-xcb|xcb-(randr|sync|xfixes|shm|present|glx|dri2|dri3)|xshmfence|gbm|drm|asound"  # 그래픽·소리 드라이버 짝
    r"|dbus-1|systemd|cap|gcrypt|gpg-error|lzma|zstd|lz4"  # D-Bus 와 그 짝
    r"|nss3|nssutil3|smime3|ssl3|nspr4|plc4|plds4|softokn3|freebl3"  # NSS (크로미움 인증서): 모듈을 시스템에서 찾는다
    r"|gtk-3|gdk-3|gdk_pixbuf-2\.0|pango-1\.0|pangocairo-1\.0|pangoft2-1\.0|cairo|cairo-gobject|atk-1\.0|atk-bridge-2\.0"
    r"|atspi|epoxy|fribidi|thai|datrie|pixman-1"  # GTK: 아래 libqgtk3 를 빼면 쓰는 곳이 없다
    r"|cups|gnutls|avahi-common|avahi-client|gssapi_krb5|krb5|k5crypto|krb5support|keyutils|com_err|p11-kit|tasn1"
    r"|nettle|hogweed|gmp|idn2|unistring"  # CUPS 인쇄 플러그인과 그 짝 (앱은 인쇄하지 않는다)
    r")\.so(\.|$)"
)
# Qt 플러그인 중 GTK·CUPS 를 끌고 오는 것. GNOME 에서는 Qt 가 GTK 테마 플러그인을 고르는데, 그러면 옛 GTK 가
# 시스템 GTK 모듈을 불러 죽을 수 있다. 빼면 Qt 는 자체 테마(gnome)·xdg-desktop-portal 로 간다.
_SKIP_PLUGINS = ("/platformthemes/libqgtk3.so", "/printsupport/libcupsprintersupport.so")


def _keep_binary(dest: str) -> bool:
    d = "/" + dest.replace("\\", "/")
    if d.endswith(_SKIP_PLUGINS):
        return False
    return not _SYSTEM_LIBS.match(d.rsplit("/", 1)[-1])


_before = len(a.binaries)
_dropped = sorted({entry[0].replace("\\", "/").rsplit("/", 1)[-1] for entry in a.binaries if not _keep_binary(entry[0])})
a.binaries = [entry for entry in a.binaries if _keep_binary(entry[0])]
print(f"[Daling linux] 바이너리 {_before} → {len(a.binaries)}개 (시스템 것을 쓰게 뺀 것: {', '.join(_dropped) or '없음'})")

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="daling",
    debug=False,
    bootloader_ignore_signals=False,  # 끄기(SIGTERM)를 파이썬 쪽 프로세스에 그대로 넘긴다
    strip=False,
    upx=False,
    # 리눅스에는 콘솔 창 구분이 없다. 터미널에서 켜면 로그가 그 터미널로 나온다 (점검·작업 출력)
    console=True,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=False,
    name="daling",
)
