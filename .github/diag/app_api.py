"""맥 진단(mac-diagnose.yml)이 켜 둔 Daling 앱의 화면 서버를 부르는 도우미. 시스템 python3 로 돈다.

    app_api.py port [기다릴 초]               화면 서버 포트(8765~8785)
    app_api.py post <경로> <JSON> [초]        'HTTP <코드> <본문>' 을 찍는다 (안 오면 HTTP 0)
    app_api.py wait <main|mail> <초> <파일>    작업이 끝날 때까지 기다려 상태·기록을 파일에 남긴다
    app_api.py markers <config.json>          비밀 설정이 키체인 표시인지(값은 찍지 않는다)
    app_api.py set-config <config.json> 키=값 ...
"""
import json
import sys
import time
import urllib.error
import urllib.request

SECRET_KEYS = ("LMS_PASSWORD", "SCHOOL_EMAIL_PASSWORD", "EMAIL_PASSWORD")


def find_port(wait: float = 0):
    deadline = time.time() + wait
    while True:
        for p in range(8765, 8786):
            try:
                with urllib.request.urlopen(f"http://127.0.0.1:{p}/healthz", timeout=1) as r:
                    if b'"mode"' in r.read():
                        return p
            except Exception:
                pass
        if time.time() >= deadline:
            return None
        time.sleep(1)


def call(method: str, path: str, body=None, timeout: float = 30):
    port = find_port(5)
    if not port:
        return 0, "화면 서버가 응답하지 않음"
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(f"http://127.0.0.1:{port}{path}", data=data, method=method,
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")
    except Exception as e:  # 시간 초과(키체인 창을 기다리며 멈춤 등)
        return 0, f"{type(e).__name__}: {e}"


def main(argv):
    cmd = argv[1]
    if cmd == "port":
        p = find_port(float(argv[2]) if len(argv) > 2 else 0)
        print(p or "")
        return 0 if p else 1
    if cmd == "post":
        code, body = call("POST", argv[2], json.loads(argv[3]), float(argv[4]) if len(argv) > 4 else 30)
        print(f"HTTP {code} {body[:2000]}")
        return 0
    if cmd == "get":
        code, body = call("GET", argv[2], timeout=float(argv[3]) if len(argv) > 3 else 30)
        print(f"HTTP {code} {body[:3000]}")
        return 0
    if cmd == "health":  # 건강 알림 요약: '<keychain 상태> | <경고 문구>'
        code, body = call("GET", "/api/health", timeout=float(argv[2]) if len(argv) > 2 else 30)
        try:
            h = json.loads(body)
        except Exception:
            print(f"none | (HTTP {code} {body[:200]})")
            return 0
        kc = h.get("keychain")
        state = "none" if not kc else ("waiting" if kc.get("waiting") else "denied")
        print(f"{state} | {h.get('warning', '')}")
        return 0
    if cmd == "wait":
        which, limit, out = argv[2], float(argv[3]), argv[4]
        deadline, seen, last = time.time() + limit, False, {}
        while time.time() < deadline:
            code, body = call("GET", "/api/task", timeout=15)
            if code == 200:
                state = json.loads(body)
                last = state.get("mail", {}) if which == "mail" else state
                seen = seen or bool(last.get("running") or last.get("startedAt"))
                if seen and not last.get("running"):
                    break
            time.sleep(2)
        else:
            last = dict(last, timedOut=True)
        with open(out, "w", encoding="utf-8") as f:
            json.dump(last, f, ensure_ascii=False, indent=2)
        print(f"returnCode={last.get('returnCode')} timedOut={bool(last.get('timedOut'))} 줄 {len(last.get('logs') or [])}")
        for line in (last.get("logs") or [])[-30:]:
            print("  |", line if isinstance(line, str) else json.dumps(line, ensure_ascii=False))
        return 0
    if cmd == "markers":
        try:
            cfg = json.load(open(argv[2], encoding="utf-8"))
        except Exception as e:
            print(f"config.json 못 읽음: {e}")
            return 1
        for k in SECRET_KEYS:
            v = cfg.get(k)
            kind = ("없음" if v is None else "빈 값" if v == "" else
                    f"키체인 표시({v})" if str(v).startswith("keychain:") else f"평문 {len(str(v))}자(!)")
            print(f"{k}: {kind}")
        return 0
    if cmd == "set-config":
        path = argv[2]
        cfg = json.load(open(path, encoding="utf-8"))
        for pair in argv[3:]:
            k, _, v = pair.partition("=")
            cfg[k] = v
        json.dump(cfg, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        print("config.json:", ", ".join(argv[3:]))
        return 0
    print(__doc__)
    return 2


sys.exit(main(sys.argv))
