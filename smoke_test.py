"""설치본이 제대로 묶였는지 창 없이 확인한다.

    <실행 파일> --autosaver-smoke        (맥: Daling.app/Contents/MacOS/Daling --autosaver-smoke)
    python app.py --autosaver-smoke       (소스)
    (리눅스: dist/daling/daling --autosaver-smoke, AppImage 는 APPIMAGE_EXTRACT_AND_RUN=1 ./daling-….AppImage --autosaver-smoke)

왜 있나
    맥·리눅스 빌드는 GitHub Actions(.github/workflows/mac.yml·linux.yml)에서만 만든다. 빠진 화면 파일·모듈·드라이버는
    받은 사람이 켜 봐야 알게 되는데, 그때는 창이 하얗게 뜨거나 아무것도 안 뜬다. 그래서 묶은 직후
    같은 실행 파일로 서버를 띄워 몇 군데를 두드려 보고, 하나라도 틀리면 0 이 아닌 값으로 끝낸다.

하는 일 (네트워크·LMS·메일·키체인 실제 항목은 건드리지 않는다)
    - 데이터 폴더를 빈 임시 폴더로 바꾼다 (prepare_env, app.py 가 web_ui 를 불러오기 전에 부른다)
    - 화면 서버를 빈 포트(0)에 띄워 /healthz, /, /app.js, 가벼운 /api 몇 개를 GET
    - 작업 프로세스(`--autosaver-job smoke`)가 창 없이 뜨고 출력·데이터 경로가 이어지는지
    - Playwright 드라이버(node)가 실행되는지, 맥이면 AppKit·WebKit·인증서 묶음
    - 리눅스면 PyQt6·QtWebEngine(창은 만들지 않음)·QtWebEngineProcess·인증서 묶음, 키링 대신 쓰는 0600 파일 길
    - AUTOSAVER_SMOKE_KEYCHAIN=1 이면 점검용 계정으로 키체인(리눅스는 Secret Service) 쓰기·읽기·지우기
      (CI 는 맥은 임시 키체인, 리눅스는 dbus-run-session 안의 gnome-keyring 에서)
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import threading
import time
from pathlib import Path


def prepare_env() -> Path:
    """사용자 데이터(C:\\lms-autosaver, ~/.lms-autosaver)를 건드리지 않게 빈 임시 폴더를 쓴다."""
    import tempfile

    root = Path(tempfile.mkdtemp(prefix="daling-smoke-"))
    os.environ["AUTOSAVER_ROOT"] = str(root)
    os.environ["AUTOSAVER_DATA_ROOT"] = str(root)
    os.environ["AUTOSAVER_CONFIG_PATH"] = str(root / "config.json")
    os.environ["AUTOSAVER_GOOGLE_CLIENT_SECRETS"] = str(root / "credentials.json")
    os.environ["AUTOSAVER_DISABLE_LEGACY_CONFIG"] = "1"
    os.environ["AUTOSAVER_OPEN_BROWSER"] = "0"
    os.environ["AUTOSAVER_SMOKE_ROOT"] = str(root)
    os.environ.pop("AUTOSAVER_MULTI_USER", None)
    os.environ.pop("AUTOSAVER_PUBLIC_BASE_URL", None)
    return root


def _get(base: str, path: str, timeout: float = 20.0) -> tuple[int, bytes, str]:
    import urllib.request

    req = urllib.request.Request(base + path, headers={"Accept-Encoding": "identity"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.status, resp.read(), resp.headers.get("Content-Type", "")


def _json(base: str, path: str) -> dict:
    status, body, ctype = _get(base, path)
    if status != 200:
        raise RuntimeError(f"HTTP {status}")
    if "json" not in ctype:
        raise RuntimeError(f"JSON 이 아님: {ctype}")
    data = json.loads(body.decode("utf-8"))
    if not isinstance(data, (dict, list)):
        raise RuntimeError("JSON 모양이 이상합니다")
    return data


def run(app) -> int:
    """app: 이미 불러온 app.py 모듈 (__main__). 0 이면 통과."""
    app._bind_worker_output()  # 창 없는 EXE 에서도 print 가 터지지 않게
    results: list[tuple[bool, str, str, float]] = []

    def check(name: str, fn) -> None:
        started = time.monotonic()
        try:
            detail = fn()
            results.append((True, name, str(detail or ""), time.monotonic() - started))
        except Exception as exc:  # noqa: BLE001 - 무엇이 틀렸는지 다 보여야 한다
            results.append((False, name, f"{type(exc).__name__}: {exc}", time.monotonic() - started))
        ok, _name, detail, took = results[-1]
        print(f"[{'OK' if ok else 'FAIL'}] {name} ({took * 1000:.0f}ms) {detail}", flush=True)

    import web_ui

    frozen = bool(getattr(sys, "frozen", False))
    print(f"Daling smoke: python {sys.version.split()[0]} {sys.platform} frozen={frozen}", flush=True)
    print(f"  executable={sys.executable}", flush=True)
    print(f"  bundle={web_ui.PROJECT_ROOT}", flush=True)
    print(f"  data={web_ui.AUTOSAVER_ROOT}", flush=True)

    def data_root_isolated():
        want = os.environ.get("AUTOSAVER_SMOKE_ROOT", "")
        if not want or Path(web_ui.AUTOSAVER_ROOT) != Path(want):
            raise RuntimeError(f"임시 폴더가 아니라 {web_ui.AUTOSAVER_ROOT} 를 씁니다")
        import runtime_config

        if Path(runtime_config.AUTOSAVER_DATA_ROOT) != Path(want):
            raise RuntimeError(f"작업용 경로가 {runtime_config.AUTOSAVER_DATA_ROOT} 입니다")
        return want

    check("데이터 폴더가 임시 폴더", data_root_isolated)

    def bundled_files():
        wanted = ["web/index.html", "web/app.js", "web/styles.css", "VERSION", "data/changelog.json"]
        if frozen:
            # pywebview 가 창과 화면을 잇는 JS. 빠지면 창이 하얗게 뜬다
            wanted.append("webview/js/api.js")
        missing = [p for p in wanted if not (web_ui.PROJECT_ROOT / p).exists()]
        if missing:
            raise RuntimeError(f"묶음에 없음: {missing}")
        import updater

        return f"VERSION {updater.local_version()}"

    check("화면 파일·VERSION", bundled_files)

    # 화면 서버: 실제 앱과 같은 서버 클래스·처리기로, 다른 앱과 겹치지 않게 빈 포트(0)에
    server = None
    base = ""

    def start_server():
        nonlocal server, base
        web_ui.ensure_data_files(web_ui.workspace_for_user("local"))
        server = app.ExclusiveHTTPServer((app.HOST, 0), web_ui.DashboardHandler)
        threading.Thread(target=server.serve_forever, daemon=True).start()
        base = f"http://{app.HOST}:{server.server_address[1]}"
        return base

    check("화면 서버 시작", start_server)

    if server is not None:
        def healthz():
            data = _json(base, "/healthz")
            if data.get("ok") is not True or "mode" not in data:
                raise RuntimeError(f"모양이 다름: {data}")
            # app.existing_dashboard 는 이 모양으로 '이미 켜진 Daling' 을 알아본다
            if not app.existing_dashboard(app.HOST, server.server_address[1]):
                raise RuntimeError("existing_dashboard 가 이 서버를 못 알아봄")
            return data.get("mode")

        def index():
            status, body, _ = _get(base, "/")
            if status != 200 or b"<html" not in body[:4000].lower():
                raise RuntimeError(f"HTTP {status}, {len(body)}바이트")
            return f"{len(body)}바이트"

        def app_js():
            status, body, _ = _get(base, "/app.js")
            if status != 200 or len(body) < 10000:
                raise RuntimeError(f"HTTP {status}, {len(body)}바이트")
            return f"{len(body)}바이트"

        check("GET /healthz", healthz)
        check("GET /", index)
        check("GET /app.js", app_js)
        # 네트워크 없이 파일만 읽는 것들 (설정·업데이트 내용·소개·화면 설정)
        for route in ("/api/config", "/api/whats-new", "/api/tutorial", "/api/ui-prefs", "/api/task"):
            check(f"GET {route}", lambda route=route: f"{len(_json(base, route))}개 항목")

        if sys.platform == "darwin":
            def samsung_off():
                data = _json(base, "/api/samsung-notes/status")
                if data.get("available") is not False:
                    raise RuntimeError(f"맥인데 삼성 노트를 '있음' 으로 봄: {data}")
                return "없음(맥)"

            check("삼성 노트는 맥에서 꺼짐", samsung_off)

        if sys.platform.startswith("linux"):
            def samsung_off_linux():
                data = _json(base, "/api/samsung-notes/status")
                if data.get("available") is not False:
                    raise RuntimeError(f"리눅스인데 삼성 노트를 '있음' 으로 봄: {data}")
                return "없음(리눅스)"

            def update_manual():
                # 리눅스는 스스로 설치하지 않는다. 화면(app.js)은 manualUrl·manualNote 로 내려받을 곳을 연다.
                # (GitHub 에 묻지 않고 함수 모양만 본다 — 점검은 네트워크를 쓰지 않는다)
                import updater

                res = updater.apply_update()
                if res.get("manual") is not True or not res.get("message"):
                    raise RuntimeError(f"리눅스인데 설치를 하려 함: {res}")
                if not updater.LINUX_ASSET_PATTERN.match("daling-1.2.3-linux-x86_64.AppImage"):
                    raise RuntimeError("AppImage 이름 규칙이 맞지 않음")
                return res["message"]

            check("삼성 노트는 리눅스에서 꺼짐", samsung_off_linux)
            check("업데이트는 내려받기 안내로", update_manual)

    def worker():
        from runtime_config import WORKER_FLAG

        if frozen:
            command = [sys.executable, WORKER_FLAG, "smoke"]
        else:
            command = [sys.executable, str(Path(app.__file__).resolve()), WORKER_FLAG, "smoke"]
        env = os.environ.copy()
        env["PYTHONIOENCODING"] = "utf-8"
        # 실제 앱(web_ui.run_process)과 같은 모양으로 띄운다
        proc = subprocess.run(command, capture_output=True, text=True, encoding="utf-8",
                              errors="replace", env=env, timeout=120, cwd=str(web_ui.PROJECT_ROOT))
        out = (proc.stdout or "") + (proc.stderr or "")
        if proc.returncode != 0 or "smoke-worker ok" not in out:
            raise RuntimeError(f"종료 코드 {proc.returncode}: {out.strip()[-400:]}")
        want = os.environ.get("AUTOSAVER_SMOKE_ROOT", "")
        if want and want not in out:
            raise RuntimeError(f"데이터 경로가 안 이어짐: {out.strip()[-200:]}")
        return out.strip().splitlines()[-1]

    check("작업 프로세스 (--autosaver-job smoke)", worker)

    def playwright_driver():
        import browser_setup
        import playwright.async_api  # noqa: F401 - 묶였는지만 본다

        command = browser_setup._driver_command()
        if frozen:
            node = Path(command[0])
            if not os.access(node, os.X_OK):
                raise RuntimeError(f"실행 권한 없음: {node}")
            proc = subprocess.run([str(node), "--version"], capture_output=True, text=True, timeout=60)
            if proc.returncode != 0:
                raise RuntimeError(f"node 실행 실패 {proc.returncode}: {proc.stderr.strip()[-300:]}")
            return f"node {proc.stdout.strip()} · 브라우저 {'있음' if browser_setup.browser_ready() else '없음(처음 쓸 때 받음)'}"
        return f"{command[:2]} · 브라우저 {'있음' if browser_setup.browser_ready() else '없음'}"

    check("Playwright 드라이버", playwright_driver)

    if sys.platform == "darwin":
        def cocoa_modules():
            import AppKit  # noqa: F401
            import Foundation  # noqa: F401
            import WebKit  # noqa: F401
            import webview  # noqa: F401

            # webview.platforms.cocoa 는 불러오기만 해도 NSApplication 을 만들어 Dock 에 아이콘이 뜬다.
            # 묶였는지만 파일로 본다.
            import importlib.util

            if importlib.util.find_spec("webview.platforms.cocoa") is None:
                raise RuntimeError("webview.platforms.cocoa 가 묶이지 않음")
            w, h, _x, _y = app.initial_window_size()
            return f"첫 창 {w}×{h}"

        def certificates():
            import ssl

            stats = ssl.create_default_context().cert_store_stats()
            if not stats.get("x509_ca"):
                raise RuntimeError(f"인증서가 비어 있음 (SSL_CERT_FILE={os.environ.get('SSL_CERT_FILE')})")
            return f"CA {stats['x509_ca']}개"

        check("Cocoa·WebKit 모듈", cocoa_modules)
        check("SSL 인증서 묶음", certificates)

        if os.environ.get("AUTOSAVER_SMOKE_KEYCHAIN") == "1":
            def keychain():
                import mac_keychain

                return mac_keychain.self_test()

            check("키체인 왕복 (점검용 계정)", keychain)

    if sys.platform.startswith("linux"):
        def qt_modules():
            # pywebview 의 Qt 창이 쓰는 모듈. 불러오기만 하고 QApplication 은 만들지 않는다 (화면 없이도 돈다).
            import importlib.util

            import linux_support

            linux_support.prepare_qt()  # QT_API=pyqt6 (qtpy 가 고르는 바인딩)
            from PyQt6 import QtCore, QtGui, QtNetwork, QtWebChannel, QtWebEngineCore, QtWebEngineWidgets, QtWidgets  # noqa: F401
            import qtpy
            import webview  # noqa: F401

            if qtpy.API_NAME != "PyQt6":
                raise RuntimeError(f"qtpy 가 {qtpy.API_NAME} 를 고름")
            if importlib.util.find_spec("webview.platforms.qt") is None:
                raise RuntimeError("webview.platforms.qt 가 묶이지 않음")
            libexec = Path(QtCore.QLibraryInfo.path(QtCore.QLibraryInfo.LibraryPath.LibraryExecutablesPath))
            helper = libexec / "QtWebEngineProcess"
            if not helper.is_file() or not os.access(helper, os.X_OK):
                raise RuntimeError(f"QtWebEngineProcess 가 없거나 실행 권한 없음: {helper}")
            plugins = Path(QtCore.QLibraryInfo.path(QtCore.QLibraryInfo.LibraryPath.PluginsPath))
            missing = [p for p in ("platforms/libqxcb.so", "platforms/libqwayland-generic.so") if not (plugins / p).exists()]
            # 화면 연결 플러그인: X11(xcb)은 꼭 있어야 하고, Wayland 는 없으면 Qt 가 XWayland(xcb)로 붙는다
            if "platforms/libqxcb.so" in missing:
                raise RuntimeError(f"Qt 플러그인 없음: {missing} ({plugins})")
            sandbox = linux_support.webengine_sandbox_problem() or "씀"
            wayland = "Wayland 플러그인 없음" if missing else "X11·Wayland"
            return f"Qt {QtCore.qVersion()} · {wayland} · 샌드박스 {sandbox}"

        def certificates_linux():
            import ssl

            stats = ssl.create_default_context().cert_store_stats()
            if not stats.get("x509_ca"):
                raise RuntimeError(f"인증서가 비어 있음 (SSL_CERT_FILE={os.environ.get('SSL_CERT_FILE')})")
            return f"CA {stats['x509_ca']}개 ({os.environ.get('SSL_CERT_FILE') or '기본 경로'})"

        def secret_file():
            # 키링을 못 쓸 때의 파일 길. 데이터 폴더가 임시 폴더일 때만 (실제 secrets.json 은 건드리지 않는다)
            import linux_secrets

            want = os.environ.get("AUTOSAVER_SMOKE_ROOT", "")
            if not want or Path(linux_secrets.file_path()).parent != Path(want):
                raise RuntimeError(f"임시 폴더가 아니라 {linux_secrets.file_path()} 를 씀")
            return linux_secrets.file_self_test()

        def desktop_tools():
            # 없어도 앱은 돈다 (알림은 건너뛰고, 열기는 실패를 알린다). 무엇이 있는지만 남긴다
            import shutil

            import linux_support

            found = [name for name in ("xdg-open", "notify-send", "gio") if shutil.which(name)]
            screen = linux_support.display_problem() or "있음"
            return f"{', '.join(found) or '없음'} · 화면 {screen}"

        check("PyQt6·QtWebEngine 모듈", qt_modules)
        check("SSL 인증서 묶음", certificates_linux)
        check("비밀 설정 파일 길 (0600)", secret_file)
        check("데스크톱 도구", desktop_tools)

        if os.environ.get("AUTOSAVER_SMOKE_KEYCHAIN") == "1":
            def secret_service():
                import linux_secrets

                return linux_secrets.self_test()

            check("Secret Service 왕복 (점검용 항목)", secret_service)

    if server is not None:
        try:
            server.shutdown()
            server.server_close()
        except Exception:
            pass

    failed = [name for ok, name, _detail, _took in results if not ok]
    if failed:
        print(f"SMOKE FAIL ({len(failed)}/{len(results)}): {', '.join(failed)}", flush=True)
        return 1
    print(f"SMOKE PASS ({len(results)}개)", flush=True)
    return 0
