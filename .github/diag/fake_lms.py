"""맥 진단(mac-diagnose.yml)용 가짜 LMS. 진짜 학교 서버 대신 러너 안에서만 돈다.

    python3 fake_lms.py <포트> <바라는 ID> <바라는 비밀번호> <기록 파일>

lms_crawler.login_lms 가 보는 것만 흉내 낸다:
  GET  /login                         'Login ID' 칸·비밀번호 칸·Login 단추가 있는 폼
  POST /login                         받은 ID·비밀번호가 바라는 것과 같을 때만 로그인 → /ultra/course 로 보냄
  GET  /learn/api/public/v1/users/me  로그인했으면 200, 아니면 401 (앱이 '로그인 완료' 를 판단하는 곳)
  GET  /learn/api/...                 빈 목록 (과목 0개)
무엇이 들어왔는지(비밀번호는 맞았는지·길이만, 값은 적지 않음)를 기록 파일에 JSON 으로 남긴다.
"""
import json
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs

PORT, WANT_ID, WANT_PW, RECORD = int(sys.argv[1]), sys.argv[2], sys.argv[3], sys.argv[4]
state = {"logged_in": False, "posts": [], "gets": []}

FORM = """<!doctype html><html><body>
<form method="post" action="/login">
  <input name="id" placeholder="Login ID">
  <input name="pw" type="password">
  <button type="submit">Login</button>
</form></body></html>"""


def save():
    with open(RECORD, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, body, ctype="application/json", extra=None):
        data = body.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", ctype + "; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        path = self.path.split("?")[0]
        state["gets"].append(path)
        if path == "/login":
            return self._send(200, FORM, "text/html")
        if path == "/learn/api/public/v1/users/me":
            if not state["logged_in"]:
                return self._send(401, '{"status":401}')
            return self._send(200, json.dumps({"id": "_1_1", "userName": WANT_ID, "studentId": "0",
                                               "name": {"given": "Diag", "family": "User"}}))
        if path.startswith("/learn/api/"):
            return self._send(200, '{"results": [], "paging": {}}')
        return self._send(200, "<!doctype html><html><body>LMS</body></html>", "text/html")

    def do_POST(self):
        length = int(self.headers.get("Content-Length") or 0)
        form = parse_qs(self.rfile.read(length).decode("utf-8", "replace"))
        got_id = (form.get("id") or [""])[0]
        got_pw = (form.get("pw") or [""])[0]
        ok = got_id == WANT_ID and got_pw == WANT_PW
        state["posts"].append({"id": got_id, "pw_len": len(got_pw), "pw_matches": got_pw == WANT_PW, "accepted": ok})
        state["logged_in"] = state["logged_in"] or ok
        save()
        return self._send(302, "", "text/html", {"Location": "/ultra/course"})

    def log_message(self, fmt, *args):
        sys.stderr.write("fake-lms " + (fmt % args) + "\n")


save()
ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
