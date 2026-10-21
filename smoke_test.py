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
    - 체험 모드(Store 심사용 가짜 데이터)를 켜면 데이터가 차고 바깥 연결이 막히며, 끄면 체험 폴더가 지워지는지
    - 작업 프로세스(`--autosaver-job smoke`)가 창 없이 뜨고 출력·데이터 경로가 이어지는지
    - Playwright 드라이버(node)가 실행되는지, 맥이면 AppKit·WebKit·인증서 묶음
    - Windows Store 판(MSIX)이면 업데이트를 Store 에 맡기는지, 작업 프로세스가 같은 패키지 안에서 도는지
    - 리눅스면 PyQt6·QtWebEngine(창은 만들지 않음)·QtWebEngineProcess·인증서 묶음, 키링 대신 쓰는 0600 파일 길
    - 맥이면 앱 안 업데이트 도구(install.sh)가 묶였는지, AUTOSAVER_SMOKE_DOWNLOAD_URL 이 있으면 앱이 받은 파일에 격리 표시가 없는지
    - AUTOSAVER_SMOKE_KEYCHAIN=1 이면 점검용 계정으로 키체인(리눅스는 Secret Service) 쓰기·읽기·지우기
      (CI 는 맥은 임시 키체인, 리눅스는 dbus-run-session 안의 gnome-keyring 에서)
    - 맥에서 AUTOSAVER_SMOKE_KEYCHAIN=write / read 면 그것만: 이 빌드가 남긴 항목을 '다음 빌드' 가 묻지 않고 읽는지
      (mac.yml 이 같은 자리에 같은 인증서로 다시 서명한 앱을 놓고 read 로 부른다, mac_keychain.persist_test)
      write 에 AUTOSAVER_SMOKE_KEYCHAIN_METHOD, droppart·addpart(+ …_PARTITION)·delete·readui 는 mac.yml '키체인 실험' 용 (mac_keychain_lab)
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import threading
import time
from pathlib import Path


# 화면 서버의 GET 길 전부 ('화면 API 전부' 점검). 쿼리가 필요한 길은 빈 값으로 — 400 이 와도 500 이 아니면 된다.
SWEEP_GET = (
    "/api/academic-calendar", "/api/ai/status", "/api/config", "/api/config/export", "/api/course-announcements",
    "/api/course-catalog?q=", "/api/course-staff", "/api/course-state", "/api/course-terms", "/api/deadlines",
    "/api/deadlines.ics", "/api/demo", "/api/dgist-api/status", "/api/diagnostics", "/api/directory?q=",
    "/api/drive/get", "/api/drive/list", "/api/email-body?id=1", "/api/emails", "/api/fglp", "/api/file?path=x",
    "/api/files", "/api/files/bulk", "/api/health", "/api/local-autosave/job", "/api/mail-image",
    "/api/mail/discard-draft", "/api/mail/eml", "/api/mail/folders", "/api/mail/me", "/api/mail/pending",
    "/api/my-events", "/api/notices", "/api/place-search?q=", "/api/samsung-notes/job", "/api/samsung-notes/status",
    "/api/school-events", "/api/selection", "/api/seminars", "/api/shelves", "/api/shuttle", "/api/status",
    "/api/storage", "/api/task", "/api/timetable", "/api/tutorial", "/api/ui-prefs", "/api/update/check",
    "/api/update/job", "/api/whats-new", "/api/window",
)
# 아래 '빠진 길' 비교는 쿼리 앞까지만 본다
_SWEEP_PATHS = {r.split("?")[0] for r in SWEEP_GET}


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

    phase = os.environ.get("AUTOSAVER_SMOKE_KEYCHAIN", "")
    if sys.platform == "darwin" and phase in ("write", "read", "droppart", "addpart", "delete", "readui"):
        # 키체인 허락이 다음 빌드로 이어지는지만 본다 (mac.yml '키체인 허락 유지 점검'·'키체인 실험'). 다른 점검은 건너뜀
        method = os.environ.get("AUTOSAVER_SMOKE_KEYCHAIN_METHOD", "default")

        def keychain_persist():
            if phase == "read" or (phase == "write" and method == "default"):
                import mac_keychain

                return mac_keychain.persist_test(phase)
            import mac_keychain_lab

            if phase == "write":
                return mac_keychain_lab.write(method)
            if phase == "delete":
                return mac_keychain_lab.delete()
            if phase == "readui":
                return mac_keychain_lab.read_ui()
            return mac_keychain_lab.edit_partitions(phase, os.environ.get("AUTOSAVER_SMOKE_KEYCHAIN_PARTITION", ""))

        check(f"키체인 허락 유지 ({phase})", keychain_persist)
        ok = results[-1][0]
        print(f"SMOKE {'PASS' if ok else 'FAIL'} (키체인 {phase})", flush=True)
        return 0 if ok else 1

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

        def demo_mode_check():
            # 체험 모드(Store 심사용): 켜면 가짜 데이터가 차고, 바깥 연결이 막히고, 끄면 폴더가 지워진다.
            # 바깥 연결 확인은 막혔을 때만 부른다(점검은 네트워크를 쓰지 않는다).
            import socket
            import urllib.request

            import demo_mode

            def post(on: bool) -> dict:
                req = urllib.request.Request(base + "/api/demo", data=json.dumps({"on": on}).encode(),
                                             headers={"Content-Type": "application/json"}, method="POST")
                with urllib.request.urlopen(req, timeout=20) as resp:
                    return json.loads(resp.read().decode("utf-8"))

            post(True)
            try:
                folder = demo_mode.root()
                if not demo_mode.active() or folder is None or not (folder / demo_mode.MARKER).exists():
                    raise RuntimeError("체험 폴더가 안 생김")
                files = len(_json(base, "/api/files").get("files", []))
                mails = len(_json(base, "/api/emails").get("emails", []))
                if files < 10 or mails < 10:
                    raise RuntimeError(f"가짜 데이터가 덜 참: 자료 {files}, 메일 {mails}")
                _status, body, _ = _get(base, "/")
                if b'data-demo="1"' not in body or b"webFonts" in body:
                    raise RuntimeError("첫 화면에 체험 표시가 없거나 바깥 글꼴이 남음")
                try:
                    socket.getaddrinfo("lms.dgist.ac.kr", 443)
                    raise RuntimeError("체험 중인데 바깥 이름 찾기가 됨")
                except socket.gaierror:
                    pass
                ok, _msg = web_ui.start_task(web_ui.workspace_for_user("local"), "sync")
                if ok:
                    raise RuntimeError("체험 중인데 동기화가 시작됨")
            finally:
                post(False)
            if demo_mode.active() or folder.exists():
                raise RuntimeError("끈 뒤에도 체험 폴더가 남음")
            return f"자료 {files} · 메일 {mails} · 바깥 연결 막힘 · 끄면 지워짐"

        def api_sweep():
            # 화면이 부르는 GET 을 모두 한 번씩 (2026-10-21 사용자: 'Windows 기능이 맥·리눅스에서도 다 되는지 점검').
            # 점검 PC 에는 맥이 없어 기능별 화면 서버 코드가 맥·리눅스에서 도는지를 CI 의 이 점검으로 본다.
            # 체험 모드로 켜서(바깥 연결 막힘·가짜 자료) 네트워크 없이 돈다. 500·연결 끊김이 하나라도 나면 실패.
            # 값이 없어 400/404/409 를 주는 것은 정상(빈 입력에 대한 답)이다.
            import urllib.error
            import urllib.request

            def post(on: bool) -> None:
                req = urllib.request.Request(base + "/api/demo", data=json.dumps({"on": on}).encode(),
                                             headers={"Content-Type": "application/json"}, method="POST")
                urllib.request.urlopen(req, timeout=20).read()

            # 소스에서 돌 때(개발·CI 소스 점검)는 web_ui.py 의 GET 길을 다시 읽어, 새 길이 이 목록에 빠졌으면 알린다
            if not frozen:
                import re

                src = Path(web_ui.__file__).read_text(encoding="utf-8")
                body = src[src.index("    def _do_GET(self)"):src.index("    def _do_POST(self)")]
                found = set(re.findall(r'route == "(/api/[^"]+)"', body))
                for group in re.findall(r"route in \(([^)]*)\)", body):
                    found |= set(re.findall(r'"(/api/[^"]+)"', group))
                missing = sorted(found - _SWEEP_PATHS)
                if missing:
                    raise RuntimeError(f"점검 목록에 없는 GET 길: {missing} (smoke_test.SWEEP_GET 에 넣어 주세요)")
            log = web_ui.AUTOSAVER_ROOT / "server_errors.log"
            before = log.stat().st_size if log.exists() else 0
            post(True)
            bad, codes = [], {}
            try:
                for route in SWEEP_GET:
                    try:
                        status, _body, _ctype = _get(base, route, timeout=30)
                    except urllib.error.HTTPError as err:
                        status = err.code
                    except Exception as exc:  # 연결이 끊기면 서버가 죽은 것
                        bad.append(f"{route}: {type(exc).__name__} {exc}")
                        continue
                    codes[status] = codes.get(status, 0) + 1
                    if status >= 500:
                        bad.append(f"{route}: HTTP {status}")
            finally:
                post(False)
            demo_log = log.stat().st_size if log.exists() else 0
            if bad:
                raise RuntimeError("; ".join(bad[:8]))
            if demo_log > before:
                raise RuntimeError(f"server_errors.log 에 새 오류 {demo_log - before}바이트")
            summary = " · ".join(f"{c}×{n}" for c, n in sorted(codes.items()))
            return f"{len(SWEEP_GET)}개 길 ({summary})"

        def faculty_directory():
            # 새 사용자도 교수 주소가 채워지게 설치 파일에 넣은 교원 주소록 (web_ui.directory_people).
            # 점검 폴더는 비어 있으니 내가 넣은 조직도는 0명이어야 한다.
            data = _json(base, "/api/directory?q=")
            if data.get("imported") or int(data.get("total") or 0) < 200:
                raise RuntimeError(f"교원 주소록이 안 읽힘: total={data.get('total')} imported={data.get('imported')}")
            return f"교원 {data['total']}명"

        check("GET /healthz", healthz)
        check("GET /", index)
        check("GET /app.js", app_js)
        check("체험 모드", demo_mode_check)
        check("교원 주소록", faculty_directory)
        check("화면 API 전부 (체험 모드)", api_sweep)
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
        import runtime_config

        package = runtime_config.msix_package_full_name()
        if package and f"package={package}" not in out:
            # 패키지 밖에서 돌면 AppData 에 쓴 것(LMS 브라우저 등)을 앱 본체와 다르게 본다
            raise RuntimeError(f"작업 프로세스가 패키지 밖에서 돎: {out.strip()[-200:]}")
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
            return f"node {proc.stdout.strip()} · 브라우저 {browser_setup.browser_label()}"
        return f"{command[:2]} · 브라우저 {browser_setup.browser_label()}"

    check("Playwright 드라이버", playwright_driver)

    if os.name == "nt":
        import runtime_config

        if runtime_config.is_msix():
            def store_update():
                # Store 판(MSIX, packaging/msix)은 GitHub 설치 파일을 돌리지 않는다. 네트워크 없이 바로 답해야 한다
                import updater

                res = updater.check_update()
                if res.get("store") is not True or res.get("updateAvailable"):
                    raise RuntimeError(f"Store 판인데 GitHub 업데이트를 봄: {res}")
                applied = updater.apply_update()
                if applied.get("ok") is not False or applied.get("store") is not True:
                    raise RuntimeError(f"Store 판인데 설치를 하려 함: {applied}")
                return runtime_config.msix_app_user_model_id()

            check("MSIX: 업데이트는 Store 에", store_update)

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

        def update_tool():
            # 앱 안 업데이트가 쓰는 install.sh 가 묶였는지, 앱이 받은 파일에 격리 표시를 붙이도록 설정돼 있지 않은지
            # (LSFileQuarantineEnabled 가 켜져 있으면 받은 DMG 의 앱도 Gatekeeper 에 다시 막힌다)
            import updater
            from Foundation import NSBundle

            if not updater.MAC_INSTALLER.is_file():
                raise RuntimeError(f"install.sh 없음: {updater.MAC_INSTALLER}")
            proc = subprocess.run(["/bin/sh", "-n", str(updater.MAC_INSTALLER)], capture_output=True, text=True, timeout=20)
            if proc.returncode != 0:
                raise RuntimeError(f"install.sh 문법 오류: {proc.stderr.strip()[-300:]}")
            info = NSBundle.mainBundle().infoDictionary() or {}
            if info.get("LSFileQuarantineEnabled"):
                raise RuntimeError("Info.plist 에 LSFileQuarantineEnabled 가 켜져 있음")
            if getattr(sys, "frozen", False) and not updater._mac_self_install():
                raise RuntimeError("앱 안 업데이트가 꺼져 있음 (_mac_self_install)")
            return f"install.sh {updater.MAC_INSTALLER.stat().st_size}바이트 · 받는 곳 {updater._mac_dest(updater._mac_bundle()) or '(기본)'}"

        check("Cocoa·WebKit 모듈", cocoa_modules)
        check("SSL 인증서 묶음", certificates)
        check("앱 안 업데이트 도구", update_tool)

        url = os.environ.get("AUTOSAVER_SMOKE_DOWNLOAD_URL", "")
        if url:
            def download_no_quarantine():
                # 앱이 직접 받은 파일에 com.apple.quarantine 이 붙지 않는지 (CI 가 릴리스의 작은 파일 주소를 넘긴다)
                import tempfile

                import updater

                dest = Path(tempfile.mkdtemp(prefix="daling-dl-")) / url.rsplit("/", 1)[-1]
                digest = updater._download(url, dest, 0)
                attr = subprocess.run(["xattr", "-p", "com.apple.quarantine", str(dest)], capture_output=True, text=True)
                if attr.returncode == 0:
                    raise RuntimeError(f"격리 표시가 붙음: {attr.stdout.strip()}")
                return f"{dest.name} {dest.stat().st_size}바이트 · 격리 표시 없음 · sha256 {digest[:12]}…"

            check("받은 파일 격리 표시", download_no_quarantine)

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
