r"""Microsoft Store 목록 스크린샷을 체험 모드(가짜 데이터)로 찍는다.

    .venv\Scripts\python.exe packaging\msix\store_screenshots.py
    .venv\Scripts\python.exe packaging\msix\store_screenshots.py --lang en --theme dark

- 진짜 데이터(C:\lms-autosaver)는 쓰지도 읽지도 않는다. 임시 폴더를 데이터 폴더로 삼아 scripts\dev_server.py 를
  따로 띄우고(포트 8792), POST /api/demo 로 체험 모드를 켠 뒤 화면마다 찍는다. 끝나면 서버와 임시 폴더를 치운다.
- Store 는 1366×768 이상을 요구한다. 기본은 1536×864 화면을 1.25배로 찍은 1920×1080
  (1080p 노트북의 Windows 기본 배율 125% 와 같은 모양).
- 개발 서버는 창 제목 줄 모드가 아니라서(`/api/window` custom:false) 창 단추가 없다. 설치본처럼 보이게
  이 대답만 custom:true 로 바꿔 상단 바에 최소화·최대화·닫기를 그린다(--no-frame 이면 그대로).
- 체험 중에는 바깥 글꼴(Inter·Lora, Google Fonts)을 빼고 준다(바깥 요청 0건). 계정을 넣은 보통 화면과
  같은 글꼴로 찍으려고 찍는 브라우저에만 다시 붙인다(--no-fonts 면 체험 화면 그대로).
- 목록 사진에는 체험 표시를 넣지 않는다(사용자 결정, 2026-10-15). 첫 화면의 <html data-demo="1"> 만 떼고 받아
  화면 코드가 보통 모드(DEMO_ON=false)로 그리므로 체험 띠·'체험 중' 알약·상태판 '체험 중' 이 없다. 서버는 그대로
  체험 중이라 데이터는 가짜이고 바깥 요청은 막힌다. 화면에 보이는 것은 모두 계정을 넣은 보통 화면에도 있는 것.
  체험 화면 그대로 찍으려면 --demo-badge.
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
PROJ = HERE.parent.parent
FONTS = "https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"

# (파일 이름, 사이드바 data-view, 찍기 전에 할 일)
SHOTS = [
    ("1-dashboard", "dashboard", None),
    ("2-deadlines", "deadlines", None),
    ("3-calendar", "calendar", "calendar"),
    ("4-courses", "courses", None),
    ("5-files", "files", "files"),
    ("6-mail", "emails", "mail"),
]


def post(base: str, path: str, body: dict) -> dict:
    req = urllib.request.Request(base + path, data=json.dumps(body).encode(), method="POST",
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as res:
        return json.loads(res.read().decode("utf-8"))


def wait_up(base: str, seconds: float = 30) -> None:
    end = time.time() + seconds
    while time.time() < end:
        try:
            with urllib.request.urlopen(base + "/api/demo", timeout=2) as res:
                if json.loads(res.read()).get("available"):
                    return
        except OSError:
            time.sleep(0.4)
    raise SystemExit("개발 서버가 뜨지 않았습니다")


def prepare(page, view: str, extra: str | None) -> None:
    page.click(f'.nav-item[data-view="{view}"]')
    page.wait_for_timeout(1500)
    if extra == "calendar":
        # 메일에서 뽑은 세미나 날을 골라 오른쪽 상세에서 그 메일을 펼친다(연사·장소·본문까지 보이게).
        # 가짜 세미나는 '오늘 + 7일' 이라 날짜가 날마다 바뀌므로 칸을 차례로 눌러 찾는다.
        cells = page.locator("#view-calendar .cal-cell:has(.cal-event)")
        for i in range(cells.count()):
            cells.nth(i).click()
            page.wait_for_timeout(400)
            item = page.locator("#view-calendar .day-item[data-mailid]:has(.sem-info)").first
            if item.count():
                item.click()
                page.wait_for_timeout(1200)
                break
    elif extra == "files":
        # 과목 폴더 4개만 보이면 화면이 비어 보여서 '전체 목록'(파일 17개)으로
        page.click('#view-files .file-mode-tab[data-filemode="list"]')
        page.wait_for_timeout(800)
    elif extra == "mail":
        # 맨 위 메일을 열어 읽기 창까지 보이게
        row = page.locator("#view-emails .email-list-row[data-mail-id]").first
        if row.count():
            row.click()
            page.wait_for_timeout(1200)


def capture(base: str, out: Path, lang: str, theme: str, width: int, height: int, scale: float,
            frame: bool, fonts: bool, clean: bool, only: list[str] | None) -> list[Path]:
    from playwright.sync_api import sync_playwright

    saved: list[Path] = []
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        ctx = browser.new_context(viewport={"width": width, "height": height}, device_scale_factor=scale,
                                  color_scheme="dark" if theme == "dark" else "light",
                                  reduced_motion="reduce", locale="ko-KR" if lang == "ko" else "en-US")
        if frame:
            ctx.route("**/api/window", lambda route: route.fulfill(
                status=200, content_type="application/json",
                body=json.dumps({"ok": True, "custom": True, "maximized": False})))
        if clean:
            def plain_index(route):
                res = route.fetch()
                route.fulfill(response=res, body=res.text().replace('data-demo="1" ', "", 1))
            ctx.route(base + "/", plain_index)
        page = ctx.new_page()
        errors: list[str] = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(base + "/", wait_until="load")
        if fonts:
            page.add_style_tag(url=FONTS)
        page.wait_for_timeout(2500)
        for name, view, extra in SHOTS:
            if only and name not in only and view not in only:
                continue
            prepare(page, view, extra)
            path = out / f"{lang}-{name}.png"
            page.screenshot(path=str(path))
            saved.append(path)
            print("찍음", path.name, flush=True)
        if errors:
            print("화면 오류:", *errors, sep="\n  ", flush=True)
        browser.close()
    return saved


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--lang", choices=["ko", "en", "both"], default="both")
    ap.add_argument("--theme", choices=["light", "dark"], default="light")
    ap.add_argument("--size", default="1536x864", help="화면 크기(CSS 픽셀). 기본 1536x864")
    ap.add_argument("--scale", type=float, default=1.25, help="배율. 1536x864 × 1.25 = 1920x1080")
    ap.add_argument("--out", type=Path, default=HERE / "store-screenshots")
    ap.add_argument("--src", type=Path, default=PROJ, help="띄울 소스 폴더(체험 모드가 든 저장소)")
    ap.add_argument("--port", type=int, default=8792)
    ap.add_argument("--no-frame", action="store_true", help="창 단추를 그리지 않는다")
    ap.add_argument("--no-fonts", action="store_true", help="체험 화면 그대로(바깥 글꼴 없이)")
    ap.add_argument("--demo-badge", action="store_true", help="체험 띠·'체험 중' 알약·상태판까지 체험 화면 그대로")
    ap.add_argument("--only", nargs="*", help="이 화면만 (예: dashboard emails)")
    args = ap.parse_args()

    width, height = (int(x) for x in args.size.lower().split("x"))
    if min(round(width * args.scale), round(height * args.scale)) < 768 or round(width * args.scale) < 1366:
        raise SystemExit("Store 는 1366×768 이상이어야 합니다")
    if not (args.src / "demo_mode.py").exists():
        raise SystemExit(f"{args.src} 에 demo_mode.py 가 없습니다 (--src 로 체험 모드가 든 소스를 고르세요)")
    args.out.mkdir(parents=True, exist_ok=True)

    root = Path(tempfile.mkdtemp(prefix="daling-store-shots-"))
    base = f"http://127.0.0.1:{args.port}"
    env = {**os.environ, "AUTOSAVER_ROOT": str(root), "AUTOSAVER_DATA_ROOT": str(root),
           "AUTOSAVER_CONFIG_PATH": str(root / "config.json"), "AUTOSAVER_DEV_PORT": str(args.port),
           "PYTHONIOENCODING": "utf-8"}
    python = args.src / ".venv" / "Scripts" / "python.exe"
    if not python.exists():
        python = Path(sys.executable)
    theme = "dark" if args.theme == "dark" else "claude"
    # 소개·새 업데이트 창이 화면을 덮지 않게 본 것으로 둔다
    version = (args.src / "VERSION").read_text(encoding="utf-8").strip()
    (root / "tutorial.json").write_text(json.dumps({"done": True, "skipped": True, "step": 0}), encoding="utf-8")
    (root / "whats_new.json").write_text(json.dumps({"seen": version}), encoding="utf-8")
    server = subprocess.Popen([str(python), "-X", "utf8", "scripts/dev_server.py"], cwd=args.src, env=env,
                              stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
    try:
        wait_up(base)
        for lang in (["ko", "en"] if args.lang == "both" else [args.lang]):
            post(base, "/api/demo", {"on": False})
            (root / "ui_prefs.json").write_text(json.dumps({"theme": theme, "lang": lang}), encoding="utf-8")
            st = post(base, "/api/demo", {"on": True, "lang": lang})
            if not st.get("active"):
                raise SystemExit(f"체험 모드가 켜지지 않았습니다: {st}")
            capture(base, args.out, lang, args.theme, width, height, args.scale,
                    not args.no_frame, not args.no_fonts, not args.demo_badge, args.only)
            with urllib.request.urlopen(base + "/api/demo", timeout=5) as res:
                blocked = json.loads(res.read()).get("blocked")
            print(f"[{lang}] 서버가 막은 바깥 연결: {blocked}건", flush=True)
        post(base, "/api/demo", {"on": False})
    finally:
        server.terminate()
        server.wait(timeout=10)
        shutil.rmtree(root, ignore_errors=True)


if __name__ == "__main__":
    main()
