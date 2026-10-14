r"""디자인 스튜디오 저장본을 '지금 화면' 과 '요청한 화면' 으로 찍어 나란히 비교한다.

    .venv\Scripts\python.exe tools\design_studio\snapshot.py <저장본 이름>              (반영 전: now + target)
    .venv\Scripts\python.exe tools\design_studio\snapshot.py <저장본 이름> --tag after  (반영 뒤: 지금 소스로 다시)
    ... snapshot.py <이름> --web tools/design_studio/proposals/<이름>/web --tag proposal      (시안 폴더로 찍기)
    옵션: --views dashboard,emails  --theme dark  --width 1440 --height 900

- now    : 지금 소스 그대로 (스튜디오 도구는 감춤)
- target : 지금 소스 + 저장본의 고른 조합을 덮어쓴 모습 = 사용자가 본 그 화면 (처음 한 번만 찍는다)
- after  : 반영한 뒤의 지금 소스. target 과 같아 보이면 잘 옮긴 것이다.

사진은 tools/design_studio/requests/shots/<이름>/ 에 남는다 (Read 로 열어 본다).
Playwright 는 LMS 수집에 쓰는 것과 같다(.venv 에 이미 있다). 스튜디오 서버는 이 스크립트가 따로 띄웠다 끈다.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
REQUESTS = HERE / "requests"
# 화면 이름·태그는 파일 이름이 된다. Claude 가 인자로 넘기므로 경로가 되지 못하게 모양을 정해 둔다
# (검토에서 지적: --views C:/anywhere/x 가 저장소 밖에 사진을 썼다).
SAFE_NAME = re.compile(r"[A-Za-z0-9_-]{1,40}")


def find_request(name: str) -> Path:
    for sub in (REQUESTS, REQUESTS / "applied"):
        exact = sub / f"{name}.json"
        if exact.exists():
            return exact
        hits = sorted(sub.glob(f"{name}*.json"))
        if hits:
            return hits[-1]
    sys.exit(f"저장본을 못 찾았어요: {name}")


def start_server(port: int, web: str = "") -> tuple[subprocess.Popen, str]:
    extra = ["--web", web] if web else []
    proc = subprocess.Popen(
        [sys.executable, "-X", "utf8", str(HERE / "studio_server.py"), "--no-open", "--snapshot", "--port", str(port), *extra],
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding="utf-8",
    )
    deadline = time.time() + 30
    while time.time() < deadline:
        line = proc.stdout.readline() if proc.stdout else ""
        if "http://" in line:
            return proc, line[line.index("http://"):].strip()
        if proc.poll() is not None:
            break
    proc.kill()
    sys.exit("스튜디오 서버를 띄우지 못했어요.")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("name")
    ap.add_argument("--tag", default="", help="now(기본, 반영 전) 또는 after(반영 뒤)")
    ap.add_argument("--views", default="", help="찍을 화면 (쉼표). 비우면 저장본에 나온 화면 전부")
    ap.add_argument("--theme", default="", help="claude·light·navy·dark (비우면 저장본 테마)")
    ap.add_argument("--width", type=int, default=0)
    ap.add_argument("--height", type=int, default=0)
    ap.add_argument("--port", type=int, default=8890)
    ap.add_argument("--web", default="", help="다른 화면 폴더로 찍기 (시안: tools/design_studio/proposals/<이름>/web)")
    args = ap.parse_args()
    if args.tag and not SAFE_NAME.fullmatch(args.tag):
        sys.exit("--tag 는 영문·숫자·-·_ 만 써요.")
    if args.web:
        # 시안 폴더나 진짜 web/ 만 찍는다. 다른 폴더를 화면으로 띄우지 않게
        web = Path(args.web).resolve()
        allowed = (HERE / "proposals").resolve(), (HERE.parent.parent / "web").resolve()
        if not any(web == a or a in web.parents for a in allowed):
            sys.exit("--web 은 tools/design_studio/proposals/<이름>/web 이나 web/ 만 돼요.")

    path = find_request(args.name)
    data = json.loads(path.read_text(encoding="utf-8"))
    stem = path.stem
    chosen = int(data.get("chosen") or 0)
    variant = (data.get("variants") or [{}])[chosen]
    views = [v for v in args.views.split(",") if v]
    if not views:
        seen: list[str] = []
        for c in data.get("comments") or []:
            seen.append(c.get("anchor", {}).get("view", ""))
        for c in variant.get("changes") or []:
            seen.append((c.get("target") or {}).get("view", ""))
        seen.append(data.get("view", "dashboard"))
        views = [v for i, v in enumerate(seen) if v and v not in seen[:i]]
    views = [v for v in views if SAFE_NAME.fullmatch(v)]
    if not views:
        sys.exit("찍을 화면 이름이 없어요 (영문·숫자·-·_ 만 써요).")
    theme = args.theme or data.get("theme") or "claude"
    vp = data.get("viewport") or {}
    width = args.width or int(vp.get("w") or 1440)
    height = args.height or int(vp.get("h") or 900)

    out = REQUESTS / "shots" / stem
    out.mkdir(parents=True, exist_ok=True)
    tag = args.tag or "now"
    need_target = not any(out.glob("*-target.png"))

    from playwright.sync_api import sync_playwright

    proc, base = start_server(args.port, args.web)
    saved = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            ctx = browser.new_context(viewport={"width": width, "height": height}, locale="ko-KR")
            # 시안 화면의 스크립트는 Claude 가 고친 것이다. 이 스튜디오 서버 말고는 어디에도 요청을 못 보내게 막는다.
            ctx.route("**/*", lambda route: route.continue_() if route.request.url.startswith(base) else route.abort())
            page = ctx.new_page()
            errors: list[str] = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            for view in views:
                shots = [(tag, f"?clean=1&view={view}&theme={theme}")]
                if need_target:
                    shots.append(("target", f"?clean=1&pins=1&view={view}&theme={theme}&load={stem}&variant={chosen + 1}"))
                for label, query in shots:
                    page.goto(base + query)
                    page.wait_for_timeout(3200)  # 앱 첫 그리기 + 저장본 불러오기(0.4초 뒤) + 화면 전환
                    file = out / f"{view}-{label}.png"
                    page.screenshot(path=str(file))
                    saved.append(str(file))
            browser.close()
    finally:
        proc.terminate()
    print("\n".join(saved))
    if errors:
        print("화면 오류:", *errors[:10], sep="\n  ")


if __name__ == "__main__":
    main()
