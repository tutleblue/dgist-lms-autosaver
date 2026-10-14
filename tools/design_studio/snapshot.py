r"""디자인 스튜디오 저장본을 '지금 화면' 과 '요청한 화면' 으로 찍어 나란히 비교한다.

    .venv\Scripts\python.exe tools\design_studio\snapshot.py <저장본 이름>              (반영 전: now + target)
    .venv\Scripts\python.exe tools\design_studio\snapshot.py <저장본 이름> --tag after  (반영 뒤: 지금 소스로 다시)
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
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
REQUESTS = HERE / "requests"


def find_request(name: str) -> Path:
    for sub in (REQUESTS, REQUESTS / "applied"):
        exact = sub / f"{name}.json"
        if exact.exists():
            return exact
        hits = sorted(sub.glob(f"{name}*.json"))
        if hits:
            return hits[-1]
    sys.exit(f"저장본을 못 찾았어요: {name}")


def start_server(port: int) -> tuple[subprocess.Popen, str]:
    proc = subprocess.Popen(
        [sys.executable, "-X", "utf8", str(HERE / "studio_server.py"), "--no-open", "--port", str(port)],
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
    args = ap.parse_args()

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
    theme = args.theme or data.get("theme") or "claude"
    vp = data.get("viewport") or {}
    width = args.width or int(vp.get("w") or 1440)
    height = args.height or int(vp.get("h") or 900)

    out = REQUESTS / "shots" / stem
    out.mkdir(parents=True, exist_ok=True)
    tag = args.tag or "now"
    need_target = not any(out.glob("*-target.png"))

    from playwright.sync_api import sync_playwright

    proc, base = start_server(args.port)
    saved = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            ctx = browser.new_context(viewport={"width": width, "height": height}, locale="ko-KR")
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
