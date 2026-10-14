r"""디자인 스튜디오 — 앱과 똑같이 생긴 '연습용 복제 앱' 위에서 화면을 직접 만져 보고 댓글을 남긴다.

    .venv\Scripts\python.exe tools\design_studio\studio_server.py            (가짜 학생 데이터, 8796 포트)
    .venv\Scripts\python.exe tools\design_studio\studio_server.py --data real (내 데이터로, 읽기만)

어떻게 '똑같이' 생겼나
  화면 파일(web/index.html·app.js·styles.css)과 서버 코드(web_ui.DashboardHandler)를 그대로 쓴다.
  따로 베낀 화면을 만들면 앱이 바뀔 때마다 어긋나서, 진짜 화면 위에 편집 도구(studio.js)만 얹었다.

어떻게 '실제로는 아무것도 안 하게' 했나
  - POST(동기화·메일 보내기·삼성 노트·설정 저장…)는 전부 가짜 '됐어요' 답으로 바꾼다.
    demo 모드에서는 임시 폴더 안에서만 끝나는 것(시간표·내 일정·선택 상태)만 진짜로 처리해 만져 볼 수 있게 했다.
  - demo 모드는 바깥으로 나가는 연결을 소켓에서 막는다(LMS·메일 서버·학교 API 에 절대 안 닿는다).
  - real 모드도 POST 는 막는다. 사용자 데이터 폴더(C:\lms-autosaver)는 읽기만 한다.

저장한 결과는 tools/design_studio/requests/ 에 .json(기계용)과 .md(사람·Claude 용)로 남는다.
Claude Code 는 /design-studio 스킬로 그것을 읽어 실제 코드에 반영한다 (.claude/skills/design-studio/SKILL.md).
"""
from __future__ import annotations

import argparse
import json
import os
import re
import socket
import sys
import tempfile
import threading
import webbrowser
from datetime import datetime
from http import HTTPStatus
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

HERE = Path(__file__).resolve().parent
PROJ = HERE.parent.parent
REQUESTS_DIR = HERE / "requests"
STATIC = {"studio.js": "application/javascript", "studio.css": "text/css"}

parser = argparse.ArgumentParser(description="Daling 디자인 스튜디오")
parser.add_argument("--data", choices=["demo", "real"], default="demo",
                    help="demo: 지어낸 학생 데이터(기본) / real: 내 데이터 폴더를 읽기만")
parser.add_argument("--port", type=int, default=int(os.environ.get("STUDIO_PORT", "8796")))
parser.add_argument("--no-open", action="store_true", help="브라우저를 자동으로 열지 않음")
args = parser.parse_args()

sys.path.insert(0, str(PROJ))
os.chdir(PROJ)
os.environ["AUTOSAVER_OPEN_BROWSER"] = "0"
if args.data == "demo":
    DEMO_ROOT = Path(tempfile.mkdtemp(prefix="daling-studio-"))
    # web_ui 는 AUTOSAVER_ROOT, 작업 프로세스 쪽(runtime_config)은 AUTOSAVER_DATA_ROOT 를 본다. 둘 다 임시 폴더로.
    os.environ["AUTOSAVER_ROOT"] = str(DEMO_ROOT)
    os.environ["AUTOSAVER_DATA_ROOT"] = str(DEMO_ROOT)
    os.environ["AUTOSAVER_CONFIG_PATH"] = str(DEMO_ROOT / "config.json")
    os.environ["AUTOSAVER_GOOGLE_CLIENT_SECRETS"] = str(DEMO_ROOT / "credentials.json")

    # 바깥으로 나가는 연결을 통째로 막는다. 화면 코드가 무엇을 부르든 LMS·메일·학교 서버에 닿지 않게.
    _LOOPBACK = {"127.0.0.1", "::1", "localhost"}
    _real_connect = socket.socket.connect
    _real_getaddrinfo = socket.getaddrinfo

    def _guard_connect(self, address):  # type: ignore[no-untyped-def]
        host = address[0] if isinstance(address, tuple) else address
        if self.family in (socket.AF_INET, socket.AF_INET6) and isinstance(host, str) and host not in _LOOPBACK:
            raise OSError(f"디자인 스튜디오(demo)는 바깥 연결을 막습니다: {host}")
        return _real_connect(self, address)

    def _guard_getaddrinfo(host, *a, **kw):  # type: ignore[no-untyped-def]
        if host not in _LOOPBACK and host is not None:
            raise socket.gaierror(f"디자인 스튜디오(demo)는 바깥 연결을 막습니다: {host}")
        return _real_getaddrinfo(host, *a, **kw)

    socket.socket.connect = _guard_connect  # type: ignore[method-assign]
    socket.getaddrinfo = _guard_getaddrinfo  # type: ignore[assignment]
    # 이 컴퓨터에 프록시(127.0.0.1 에서 도는 VPN·보안 도구)가 있으면 '루프백 연결' 로 통과해 바깥으로 나간다.
    # 실제로 시험 환경에서 프록시를 거쳐 학교 서버에 요청이 나갔다. 프록시를 아예 안 쓰게 한다 (Windows 는 레지스트리 설정도 읽으므로 함수째 막는다).
    import urllib.request

    for _key in ("HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"):
        os.environ.pop(_key, None)
    os.environ["NO_PROXY"] = "*"
    urllib.request.getproxies = lambda: {}  # type: ignore[assignment]

import web_ui  # noqa: E402  (데이터 경로를 잡은 뒤에 불러야 한다)

try:
    VERSION = (PROJ / "VERSION").read_text(encoding="utf-8").strip()
except OSError:
    VERSION = ""

if args.data == "demo":
    sys.path.insert(0, str(HERE))
    import demo_data  # noqa: E402

    demo_data.build(DEMO_ROOT, VERSION)

# demo 모드에서 진짜로 처리해도 되는 POST: 임시 폴더 안의 파일만 바꾸고 바깥과 말하지 않는다
DEMO_LOCAL_POSTS = {
    "/api/selection", "/api/timetable/save", "/api/timetable/delete", "/api/timetable/bulk",
    "/api/my-events/save", "/api/my-events/delete", "/api/ui-prefs", "/api/tutorial/done",
    "/api/whats-new/seen", "/api/shelves/save",
}

# 바깥 서버에서 받아 오는 GET 은 demo 에서 그럴듯한 빈 답을 준다 (연결이 막혀 오류 문구가 뜨지 않게)
DEMO_GET_MOCKS = {
    "/api/notices": {"ok": True, "items": []},
    "/api/seminars": {"ok": True, "items": []},
    "/api/school-events": {"ok": True, "items": []},
    "/api/dgist-api/status": {"ok": True, "hasKey": False},
    "/api/shuttle": {"ok": True, "routes": []},
    "/api/place-search": {"ok": True, "places": []},
    "/api/fglp": {"ok": True, "schools": []},
    "/api/directory": {"ok": True, "results": []},
    "/api/mail/folders": {"ok": True, "folders": [
        {"key": "inbox", "name": "받은편지함"}, {"key": "sent", "name": "보낸편지함"},
        {"key": "trash", "name": "휴지통"}]},
    "/api/update/check": {"ok": True, "available": False, "current": VERSION, "latest": VERSION},
    "/api/samsung-notes/status": {"ok": True, "available": True},
    "/api/window": {"ok": True},
    "/api/drive/list": {"ok": True, "files": []},
}


SHELL_HTML = """<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Daling 디자인 스튜디오</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=daling" />
  <style>
    html, body { margin: 0; height: 100%; overflow: hidden; background: #141416; }
    #app { position: fixed; top: 0; left: 0; width: 100%; height: 100%; border: 0; background: #faf9f5; }
    /* 패널(330px + 여백)을 붙이면 앱 칸이 그만큼 좁아진다 */
    html.dock-right #app { width: calc(100% - 354px); }
    html.dock-left #app { left: 354px; width: calc(100% - 354px); }
  </style>
</head>
<body>
  <script>window.__STUDIO_SHELL__ = true;</script>
  <iframe id="app" title="Daling" src="{SRC}"></iframe>
</body>
</html>
"""


def _studio_mock(_route: str) -> dict:
    return {"ok": True, "studio": True, "message": "디자인 스튜디오라 실제로는 하지 않았어요."}


def _slug(text: str) -> str:
    text = re.sub(r"[^\w가-힣-]+", "-", text or "").strip("-")
    return text[:40]


def list_requests() -> list[dict]:
    out = []
    if not REQUESTS_DIR.exists():
        return out
    for sub, applied in ((REQUESTS_DIR, False), (REQUESTS_DIR / "applied", True)):
        if not sub.exists():
            continue
        for path in sub.glob("*.json"):
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                continue
            out.append({
                "name": path.stem,
                "applied": applied,
                "title": data.get("title", ""),
                "savedAt": data.get("savedAt", ""),
                "comments": len(data.get("comments") or []),
                "changes": sum(len(v.get("changes") or []) for v in data.get("variants") or []),
            })
    out.sort(key=lambda r: r["name"], reverse=True)
    return out


class StudioHandler(web_ui.DashboardHandler):
    def _send_bytes(self, body: bytes, ctype: str) -> None:
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _do_GET(self) -> None:  # noqa: N802
        if self.reject_bad_host():
            return
        parsed = urlparse(self.path)
        route = parsed.path
        params = parse_qs(parsed.query)

        if route in ("/", "/index.html") and not ({"frame", "clean"} & set(params)):
            # 바깥 틀: 앱은 iframe 안에서 돈다. 패널을 옆에 붙이면 iframe 이 좁아져 앱이 그 너비의 진짜 배치로 그려진다.
            query = parsed.query
            src = "/?frame=1" + (f"&{query}" if query else "")
            self._send_bytes(SHELL_HTML.replace("{SRC}", src.replace('"', "&quot;")).encode("utf-8"),
                             "text/html; charset=utf-8")
            return
        if route in ("/", "/index.html"):
            html = (web_ui.WEB_ROOT / "index.html").read_text(encoding="utf-8")
            # 진짜 화면에 편집 도구만 끼운다. app.js 다음에 불러야 화면이 다 그려진 뒤 붙는다(둘 다 defer 라 순서대로).
            html = html.replace("</head>", '  <link rel="stylesheet" href="/__studio/studio.css" />\n  </head>', 1)
            html = html.replace(
                '<script src="/app.js" defer></script>',
                '<script src="/app.js" defer></script>\n'
                f'    <script>window.__STUDIO__ = {json.dumps({"mode": args.data, "version": VERSION})};</script>\n'
                '    <script src="/__studio/studio.js" defer></script>',
                1,
            )
            self._send_bytes(html.encode("utf-8"), "text/html; charset=utf-8")
            return
        if route.startswith("/__studio/"):
            name = route[len("/__studio/"):]
            if name in STATIC:
                self._send_bytes((HERE / name).read_bytes(), STATIC[name] + "; charset=utf-8")
                return
            if name == "requests":
                self.send_json({"ok": True, "items": list_requests(), "dir": str(REQUESTS_DIR)})
                return
            if name == "request":
                stem = Path(params.get("name", [""])[0]).name
                for sub in (REQUESTS_DIR, REQUESTS_DIR / "applied"):
                    path = sub / f"{stem}.json"
                    if path.exists():
                        self.send_json(json.loads(path.read_text(encoding="utf-8")))
                        return
                self.send_json({"ok": False, "message": "그런 저장본이 없어요."}, HTTPStatus.NOT_FOUND)
                return
            self.send_json({"ok": False}, HTTPStatus.NOT_FOUND)
            return
        if args.data == "demo" and route in DEMO_GET_MOCKS:
            self.send_json(DEMO_GET_MOCKS[route])
            return
        if route == "/api/mail/eml":
            self.send_json({"ok": False, "message": "디자인 스튜디오에서는 메일 원본을 받지 않아요."},
                           HTTPStatus.BAD_REQUEST)
            return
        super()._do_GET()

    def _do_POST(self) -> None:  # noqa: N802
        if self.reject_bad_host():
            return
        route = urlparse(self.path).path
        if route == "/__studio/save":
            self._save_request()
            return
        if args.data == "demo" and route in DEMO_LOCAL_POSTS:
            super()._do_POST()
            return
        self.read_body_json()  # 본문은 버린다 (keep-alive 연결이 꼬이지 않게 읽기만)
        self.send_json(_studio_mock(route))

    def _save_request(self) -> None:
        payload = self.read_body_json()
        data = payload.get("data")
        markdown = str(payload.get("markdown") or "")
        if not isinstance(data, dict):
            self.send_json({"ok": False, "message": "저장할 내용이 비었어요."}, HTTPStatus.BAD_REQUEST)
            return
        REQUESTS_DIR.mkdir(parents=True, exist_ok=True)
        stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        stem = stamp + (("-" + _slug(data.get("title", ""))) if data.get("title") else "")
        data["savedAt"] = datetime.now().astimezone().isoformat(timespec="seconds")
        data["file"] = f"tools/design_studio/requests/{stem}.json"
        (REQUESTS_DIR / f"{stem}.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        (REQUESTS_DIR / f"{stem}.md").write_text(markdown, encoding="utf-8")
        self.send_json({"ok": True, "name": stem, "path": str(REQUESTS_DIR / f"{stem}.md")})


class ExclusiveServer(ThreadingHTTPServer):
    # app.ExclusiveHTTPServer 와 같은 이유: Windows 에서 남의 포트를 겹쳐 잡지 않게 (CLAUDE.md 21)
    allow_reuse_address = False

    def server_bind(self) -> None:
        exclusive = getattr(socket, "SO_EXCLUSIVEADDRUSE", None)
        if exclusive is not None:
            self.socket.setsockopt(socket.SOL_SOCKET, exclusive, 1)
        super().server_bind()


def main() -> None:
    server = None
    for port in range(args.port, args.port + 20):
        try:
            server = ExclusiveServer(("127.0.0.1", port), StudioHandler)
            break
        except OSError:
            continue
    if server is None:
        sys.exit(f"{args.port}~{args.port + 19} 포트가 모두 쓰이고 있어요.")
    url = f"http://127.0.0.1:{server.server_address[1]}/"
    print(f"디자인 스튜디오 ({args.data}) : {url}", flush=True)
    print(f"저장 위치: {REQUESTS_DIR}", flush=True)
    if args.data == "demo":
        print(f"가짜 데이터 폴더: {DEMO_ROOT}", flush=True)
    if not args.no_open:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
