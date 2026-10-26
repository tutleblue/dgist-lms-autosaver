# -*- mode: python ; coding: utf-8 -*-
"""Daling 을 macOS 앱(Daling.app)으로 묶는다. M칩(arm64)·인텔(x86_64) 따로 (DALING_MAC_ARCH, 없으면 이 맥의 칩).

Windows 판(bungeoppang.spec)과 같은 화면·데이터를 넣고, Windows 전용(pythonnet·winotify·WinRT)은 뺀다.
맥 판은 GitHub Actions(.github/workflows/mac.yml)의 macos-latest 에서만 만든다.

    python -m PyInstaller packaging/mac/daling-mac.spec --noconfirm     (저장소 맨 위에서)
    → dist/Daling.app

맥에서 다른 점
  - 실행 파일 이름은 Daling (Contents/MacOS/Daling). 작업 프로세스도 이 파일에 --autosaver-job 을 붙여 띄운다.
  - 창은 pywebview 의 Cocoa(WKWebView). pyobjc 가 필요하다 (requirements-mac.txt).
  - 비밀 설정은 키체인(mac_keychain.py), 알림은 osascript (app.notify).
  - 서명: PyInstaller 가 파일마다 ad-hoc 서명을 붙이고, mac.yml 이 묶은 뒤 앱 전체를 사설 인증서(비밀이 없으면
    ad-hoc)로 다시 서명한다 (packaging/mac/make_sign_cert.sh). 공증(notarization)은 유료 Apple Developer 계정이
    있어야 해서 하지 않는다.
"""

import os
import platform
import re
from pathlib import Path

PROJECT = Path(SPECPATH).resolve().parent.parent
MAC = PROJECT / "packaging" / "mac"
VERSION = (PROJECT / "VERSION").read_text(encoding="utf-8").strip()
# 묶을 칩: arm64(M칩) 또는 x86_64(인텔). 없으면 이 맥의 칩
TARGET_ARCH = os.environ.get("DALING_MAC_ARCH") or platform.machine()
if TARGET_ARCH not in ("arm64", "x86_64"):
    raise SystemExit(f"[Daling mac] 모르는 칩: {TARGET_ARCH} (DALING_MAC_ARCH=arm64 또는 x86_64)")
print(f"[Daling mac] {TARGET_ARCH} 로 묶습니다")

# 화면 파일·사진·버전은 Windows 판과 똑같이 넣는다
datas = [
    (str(PROJECT / "web"), "web"),
    (str(PROJECT / "uni_info.json"), "."),  # FGLP 대학 홈페이지·기본 정보·사진 목록 (tools/fetch_uni_info.py)
    (str(PROJECT / "VERSION"), "."),
    (str(PROJECT / "config.example.py"), "."),
    # 앱 안 업데이트가 받은 DMG 로 바꿔 끼울 때 쓴다 (updater._start_mac_install). 사이트의 한 줄 설치와 같은 파일
    (str(PROJECT / "docs" / "install.sh"), "."),
]

# 학사일정·개설강좌 씨앗 데이터 (없어도 돈다. 넣어 두면 처음 켰을 때 화면이 바로 찬다)
_seed = PROJECT / "data"
if _seed.exists():
    datas.append((str(_seed), "data"))
else:
    print("[Daling mac] data/ 가 없어 씨앗 데이터 없이 묶습니다.")

# 공공데이터포털 기본 키와 데스크톱 OAuth 클라이언트: 공개 저장소에는 없고(.gitignore)
# CI 가 secrets 에서 만든 파일이 있을 때만 넣는다 (bungeoppang.spec 과 같은 규칙)
_pdkey = PROJECT / "public_data_key.txt"
if _pdkey.exists():
    datas.append((str(_pdkey), "."))
else:
    print("[Daling mac] public_data_key.txt 가 없어 공공데이터 기본 키 없이 묶습니다.")

_client = PROJECT / "google_client.json"
if _client.exists():
    datas.append((str(_client), "."))
else:
    print("[Daling mac] google_client.json 이 없어 로그인 준비물 없이 묶습니다.")

hiddenimports = [
    # LMS 로그인(SSO)은 실제 브라우저를 몰아야 해서 playwright 가 꼭 필요하다 (브라우저는 첫 사용 때 받음)
    "playwright",
    "playwright.async_api",
    "playwright._impl._driver",
    "browser_setup",
    # 삼성 노트는 맥에 없다. 그래도 화면 서버가 불러 '없음' 으로 답하므로 모듈은 넣는다 (WinRT 는 안 넣음)
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
    # 맥 전용
    "mac_keychain",
    "mac_keychain_lab",  # CI '키체인 실험' 전용 (smoke 에서만 부름)
    "mac_window",  # 제목 줄 = 상단 바 (app.py 가 창을 만들 때 늦게 불러온다)
    "smoke_test",
    "webview.platforms.cocoa",
    "AppKit",
    "Foundation",
    "WebKit",
    "objc",
    "PyObjCTools.AppHelper",
    "UniformTypeIdentifiers",  # pywebview 파일 고르기 창이 늦게 불러온다
]

excludes = [
    # 안 쓰는 무거운 것 (Windows 판과 같음)
    "tkinter", "matplotlib", "numpy", "pandas", "PIL", "pytest",
    # Windows 전용
    "pythonnet", "clr", "clr_loader", "winotify", "winrt", "win32ctypes", "pywintypes",
    "webview.platforms.edgechromium", "webview.platforms.winforms",
    "webview.platforms.mshtml", "webview.platforms.win32",
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


# build_installer.ps1 [2/5] 의 '불필요한 파일 정리' 를 여기서 한다. 맥은 묶은 뒤 .app 안에서 지우면
# Contents/Frameworks 쪽 심볼릭 링크가 끊긴 채 남아 서명이 꼬이므로, 묶기 전에 목록에서 뺀다.
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
print(f"[Daling mac] 데이터 파일 {_before} → {len(a.datas)}개")

pyz = PYZ(a.pure)

_icon = MAC / "Daling.icns"
if not _icon.exists():
    print("[Daling mac] packaging/mac/Daling.icns 가 없어 기본 아이콘으로 묶습니다 (python scripts/make_icons.py --mac).")
_icon_arg = str(_icon) if _icon.exists() else None

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="Daling",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    # 창이 뜨는 앱. 터미널에서 바로 부르면 print 는 그 터미널로 나온다 (점검·작업 출력)
    console=False,
    # Finder 에서 파일을 끌어다 놓는 기능은 없다. 켜 두면 첫 실행 때 Apple Event 를 기다리느라 느려진다
    argv_emulation=False,
    # mac.yml 이 M칩 러너에서 arm64, 인텔 러너에서 x86_64 로 한 번씩 묶는다. 다른 칩용으로는 못 묶는다
    # (묶은 파이썬·휠이 러너의 칩 것이라서). universal2 는 휠이 없어 하지 않는다 (CLAUDE.md 36)
    target_arch=TARGET_ARCH,
    codesign_identity=None,
    entitlements_file=None,
    icon=_icon_arg,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=False,
    name="Daling",
)

app = BUNDLE(
    coll,
    name="Daling.app",
    icon=_icon_arg,
    bundle_identifier="app.daling.desktop",
    version=VERSION,
    info_plist={
        "CFBundleName": "Daling",
        "CFBundleDisplayName": "Daling",
        "CFBundleShortVersionString": VERSION,
        "CFBundleVersion": VERSION,
        "LSMinimumSystemVersion": "12.0",
        "NSHighResolutionCapable": True,
        "LSApplicationCategoryType": "public.app-category.education",
        "NSHumanReadableCopyright": "© 2026 Daling · Apache License 2.0",
        # 다크 모드를 막지 않는다 (화면이 스스로 테마를 고른다)
        "NSRequiresAquaSystemAppearance": False,
        # 창은 http://127.0.0.1:<포트> 의 화면 서버를 띄운다. 메일 본문 그림처럼 http 로 오는 것도 있어
        # Windows(WebView2)와 같게 웹 화면 안의 http 를 막지 않는다.
        "NSAppTransportSecurity": {
            "NSAllowsLocalNetworking": True,
            "NSAllowsArbitraryLoadsInWebContent": True,
        },
        # '내 컴퓨터에 저장' 은 문서\붕어빵 파일 정리 에 둔다. macOS 가 처음 한 번 묻는 창에 보이는 말
        "NSDocumentsFolderUsageDescription": "받은 강의자료를 문서 폴더의 '붕어빵 파일 정리'에 저장합니다.",
        "NSDownloadsFolderUsageDescription": "고른 파일을 다운로드 폴더에서 읽거나 저장합니다.",
        "NSDesktopFolderUsageDescription": "고른 파일을 데스크톱에서 읽거나 저장합니다.",
        # 저장 폴더는 사용자가 고른다 (USB·외장 디스크·NAS, 클라우드 앱 폴더 ~/Library/CloudStorage 도 됨).
        # 그런 곳에 처음 쓸 때 macOS 가 묻는 창에 보이는 말. 마이크·카메라·화면 기록은 쓰지 않아 넣지 않는다.
        "NSRemovableVolumesUsageDescription": "강의자료를 고른 외장 디스크·USB 폴더에 저장합니다.",
        "NSNetworkVolumesUsageDescription": "강의자료를 고른 네트워크 드라이브 폴더에 저장합니다.",
        "NSFileProviderDomainUsageDescription": "강의자료를 고른 클라우드 폴더(iCloud Drive·OneDrive·Dropbox 등)에 저장합니다.",
    },
)
