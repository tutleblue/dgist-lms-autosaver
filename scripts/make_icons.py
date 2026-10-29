"""Daling 로고 아이콘 일괄 생성.

원본 그림(design/logo/daling-source.webp, 흰 바탕에 검은 붓선) 하나에서
창 아이콘(app.png), 윈도우 바로가기(app.ico), 구글 동의화면·설정 '앱' 카드용(app-logo-120.png),
브라우저 탭 아이콘(favicon.svg)을 모두 만든다.
로고를 바꿀 때는 원본 그림만 바꾸고 다시 실행하면 된다. (2026-10-11 옛 물고기 로고 → Daling)

    python scripts/make_icons.py      (시스템 파이썬의 Pillow. 앱에는 필요 없다)
    python scripts/make_icons.py --mac   맥 앱 아이콘(packaging/mac/Daling.icns)만 다시 만든다
    python scripts/make_icons.py --linux 리눅스 아이콘(packaging/linux/daling-128·256·512.png)만 다시 만든다
    python scripts/make_icons.py --msix  Store 판(MSIX) 로고(packaging/msix/Assets)만 다시 만든다

- 맥 아이콘(.icns)은 Windows 처럼 타일을 꽉 채우면 Dock 에서 다른 앱보다 한 치수 크게 보인다.
  애플 격자(1024 안에 824 네모, 둘레 100 여백)대로 여백을 두고 같은 타일을 얹는다.
  CI(.github/workflows/mac.yml)에는 원본 그림이 없을 수 있어 만든 파일을 저장소에 둔다.

- 흰 바탕을 투명하게 하고 붓선만 남겨(밝기 → 불투명도) 크림색 둥근 네모 위에 올린다.
  검은 선만 두면 작업표시줄이 어두울 때 안 보이므로 바탕 타일을 깐다(예전 물고기 아이콘과 같은 톤).
- 16·24·32px 에서는 선이 1px 아래로 얇아져 사라졌다. 작은 크기는 선을 미리 굵게(MaxFilter) 한다.
"""
from __future__ import annotations

import base64
import io
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "web"
SOURCE = ROOT / "design" / "logo" / "daling-source.webp"

BG = (250, 246, 236, 255)    # 크림 바탕 (앱 밝은 테마 --bg 에 가까운 톤)
INK = (31, 30, 29, 255)      # 먹색 붓선 (앱 --text)
LOGO_SHARE = 0.66            # 타일 한 변에서 로고가 차지하는 비율
RADIUS = 0.22                # 타일 모서리 둥글기 (한 변 대비)


def load_mask() -> Image.Image:
    """원본에서 붓선만: 어두울수록 불투명. 내용 상자에 맞춰 자르고 정사각형으로 가운데 둔다."""
    gray = Image.open(SOURCE).convert("L")
    alpha = gray.point(lambda v: 255 - v)                     # 흰 바탕 → 투명
    alpha = alpha.point(lambda v: 0 if v < 24 else min(255, int(v * 1.08)))  # 종이 얼룩 걷기
    box = alpha.getbbox()
    alpha = alpha.crop(box)
    side = max(alpha.size)
    square = Image.new("L", (side, side), 0)
    square.paste(alpha, ((side - alpha.width) // 2, (side - alpha.height) // 2))
    return square


# 붓선 세 획의 가운데 줄 (원본 1254px 그림 좌표, 가로줄마다 잰 값). 작은 아이콘은 이 선으로 다시 그린다.
#   원본을 줄인 뒤 굵게(MaxFilter) 했더니 16px 에서 삼각형 안이 메워져 검은 덩어리가 됐다(창 왼쪽 위 아이콘).
STROKES = [
    [(772, 362), (360, 820)],                                               # 긴 사선
    [(360, 822), (446, 800), (540, 782), (646, 774), (760, 771)],            # 아래 곡선
    [(677, 600), (682, 625), (696, 650), (712, 675), (731, 700), (750, 725),
     (780, 763), (809, 800), (829, 825), (843, 850)],                        # 오른쪽 획
]
SRC_BOX = (337, 340, 871, 871)  # 원본에서 붓선이 든 상자 (load_mask 의 getbbox 와 같은 값)


def strokes_mask(px: int, width_ratio: float) -> Image.Image:
    """획을 선으로 그린 마스크 (px×px). width_ratio: 한 변 대비 선 굵기."""
    ss = 8
    big = px * ss
    m = Image.new("L", (big, big), 0)
    d = ImageDraw.Draw(m)
    x0, y0, x1, y1 = SRC_BOX
    side = max(x1 - x0, y1 - y0)
    pad = ((side - (x1 - x0)) / 2, (side - (y1 - y0)) / 2)
    k = big / side
    w = max(1, round(big * width_ratio))
    for line in STROKES:
        pts = [((x - x0 + pad[0]) * k, (y - y0 + pad[1]) * k) for x, y in line]
        d.line(pts, fill=255, width=w, joint="curve")
        for x, y in (pts[0], pts[-1]):  # 둥근 끝
            d.ellipse((x - w / 2, y - w / 2, x + w / 2, y + w / 2), fill=255)
    return m.resize((px, px), Image.LANCZOS)


def tile(size: int, mask: Image.Image) -> Image.Image:
    """크림 둥근 네모 + 가운데 로고."""
    scale = 4  # 크게 그린 뒤 줄여 가장자리를 매끄럽게
    big = size * scale
    out = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    ImageDraw.Draw(out).rounded_rectangle((0, 0, big - 1, big - 1), radius=round(big * RADIUS), fill=BG)

    if size <= 48:
        # 작은 아이콘: 로고를 조금 크게, 선 굵기는 픽셀로 맞춰 다시 그린다(16px 에서 선 약 1.4px)
        share = {16: 0.80, 24: 0.76, 32: 0.74}.get(size, 0.72)
        logo_px = round(big * share)
        ratio = {16: 0.105, 24: 0.085, 32: 0.075}.get(size, 0.065)
        m = strokes_mask(logo_px, ratio)
    else:
        logo_px = round(big * LOGO_SHARE)
        m = mask.resize((logo_px, logo_px), Image.LANCZOS)
    ink = Image.new("RGBA", (logo_px, logo_px), INK)
    ink.putalpha(m)
    off = (big - logo_px) // 2
    out.alpha_composite(ink, (off, off))
    return out.resize((size, size), Image.LANCZOS)


MAC_ICNS = ROOT / "packaging" / "mac" / "Daling.icns"
MAC_INNER = 824 / 1024  # 애플 macOS 아이콘 격자: 1024px 캔버스 안의 824px 둥근 네모


def mac_frame(size: int, mask: Image.Image) -> Image.Image:
    """맥 아이콘 한 장: 투명 캔버스 가운데에 여백을 두고 타일을 얹는다."""
    inner = round(size * MAC_INNER)
    if inner <= 48:
        # 작은 크기는 tile() 이 획을 다시 그리는 표(16·24·32)가 있는 크기로 맞춘다 (32px 아이콘 → 24px 타일)
        inner = min((16, 24, 32, 48), key=lambda k: abs(k - inner))
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    off = (size - inner) // 2
    canvas.alpha_composite(tile(inner, mask), (off, off))
    return canvas


def save_mac_icns(mask: Image.Image) -> None:
    # Pillow 의 ICNS 쓰기는 32·64·128·256·512·1024 를 담는다(16 은 macOS 가 32 에서 줄인다).
    # 크기마다 따로 그린 것을 넘겨야 작은 크기 획이 뭉개지지 않는다.
    MAC_ICNS.parent.mkdir(parents=True, exist_ok=True)
    sizes = [32, 64, 128, 256, 512, 1024]
    frames = [mac_frame(s, mask) for s in sizes]
    frames[-1].save(MAC_ICNS, format="ICNS", append_images=frames[:-1])


LINUX_DIR = ROOT / "packaging" / "linux"
LINUX_SIZES = (128, 256, 512)
# 리눅스 데스크톱(GNOME·KDE) 앱 아이콘은 캔버스를 꽉 채우지 않고 둘레에 조금 여백을 둔다 (GNOME 아이콘 격자 128 안 112 정도).
# 꽉 채우면 독·앱 목록에서 다른 앱보다 커 보인다 — 맥(.icns)과 같은 까닭, 여백은 맥보다 적다.
LINUX_INNER = 112 / 128


def save_linux_pngs(mask: Image.Image) -> list[Path]:
    """AppImage(.DirIcon·hicolor)와 tar.gz 의 install.sh 가 쓰는 PNG. CI 에는 원본 그림이 없을 수 있어 저장소에 둔다."""
    LINUX_DIR.mkdir(parents=True, exist_ok=True)
    out = []
    for size in LINUX_SIZES:
        inner = round(size * LINUX_INNER)
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        off = (size - inner) // 2
        canvas.alpha_composite(tile(inner, mask), (off, off))
        path = LINUX_DIR / f"daling-{size}.png"
        canvas.save(path, optimize=True)
        out.append(path)
    return out


MSIX_DIR = ROOT / "packaging" / "msix" / "Assets"
MSIX_SCALES = (100, 125, 150, 200, 400)
# 작업 표시줄·시작 메뉴·알림이 고르는 크기 (Square44x44Logo.targetsize-N). 'altform-unplated' 는 Windows 가 바탕판을
# 깔지 않고 그대로 쓰는 판 — 없으면 작업 표시줄 아이콘 둘레에 색 네모가 생긴다. 타일이 이미 크림 바탕이라 같은 그림을 쓴다.
MSIX_TARGET_SIZES = (16, 20, 24, 30, 32, 36, 40, 48, 60, 64, 72, 80, 96, 256)


def _msix_canvas(width: int, height: int, mask: Image.Image, share: float) -> Image.Image:
    """투명 캔버스 가운데에 타일(높이의 share 만큼). 시작 타일·넓은 타일·시작 화면용."""
    side = max(16, round(min(width, height) * share))
    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    canvas.alpha_composite(tile(side, mask), ((width - side) // 2, (height - side) // 2))
    return canvas


def save_msix_assets(mask: Image.Image) -> list[Path]:
    """Store 판(packaging/msix/AppxManifest.xml)의 로고. build_msix.ps1 이 makepri 로 배율·크기 판을 묶는다.

    CI 에는 원본 그림이 없을 수 있어 만든 파일을 저장소에 둔다 (맥·리눅스와 같이).
    """
    MSIX_DIR.mkdir(parents=True, exist_ok=True)
    out: list[Path] = []

    def save(img: Image.Image, name: str) -> None:
        path = MSIX_DIR / name
        img.save(path, optimize=True)
        out.append(path)

    for scale in MSIX_SCALES:
        k = scale / 100
        # 앱 목록·설치 창 (StoreLogo 50, Square44x44Logo 44): 타일을 꽉 채운다 (.ico 와 같은 모양)
        save(tile(round(50 * k), mask), f"StoreLogo.scale-{scale}.png")
        save(tile(round(44 * k), mask), f"Square44x44Logo.scale-{scale}.png")
        # Windows 10 시작 타일은 아래에 이름이 붙으므로 둘레를 비운다
        save(_msix_canvas(round(150 * k), round(150 * k), mask, 0.62), f"Square150x150Logo.scale-{scale}.png")
        save(_msix_canvas(round(310 * k), round(150 * k), mask, 0.62), f"Wide310x150Logo.scale-{scale}.png")
        # 시작 화면 그림: 데스크톱 앱에는 안 보이지만 매니페스트에 꼭 있어야 한다
        save(_msix_canvas(round(620 * k), round(300 * k), mask, 0.42), f"SplashScreen.scale-{scale}.png")
    for size in MSIX_TARGET_SIZES:
        img = tile(size, mask)
        save(img, f"Square44x44Logo.targetsize-{size}.png")
        save(img, f"Square44x44Logo.targetsize-{size}_altform-unplated.png")
        save(img, f"Square44x44Logo.targetsize-{size}_altform-lightunplated.png")
    return out


def main() -> None:
    import sys

    mask = load_mask()
    if "--msix" in sys.argv[1:]:
        paths = save_msix_assets(mask)
        print(f"packaging/msix/Assets 에 {len(paths)}개를 만들었습니다.")
        return
    if "--mac" in sys.argv[1:]:
        save_mac_icns(mask)
        print(f"{MAC_ICNS.relative_to(ROOT)} 를 만들었습니다.")
        return
    if "--linux" in sys.argv[1:]:
        paths = save_linux_pngs(mask)
        print(", ".join(str(p.relative_to(ROOT)) for p in paths), "를 만들었습니다.")
        return

    tile(256, mask).save(WEB / "app.png")
    tile(120, mask).save(WEB / "app-logo-120.png")
    sizes = [16, 24, 32, 48, 64, 128, 256]
    frames = [tile(s, mask) for s in sizes]
    frames[-1].save(WEB / "app.ico", sizes=[(s, s) for s in sizes], append_images=frames[:-1])
    # 바로가기용은 파일 이름을 달리한다. Windows 는 아이콘을 '파일 경로'로 기억해서, 같은 app.ico 를 가리키면
    # 바탕화면 바로가기에 옛 물고기 그림이 계속 남았다(2026-10-11). 로고를 또 바꾸면 이 이름도 바꾼다.
    frames[-1].save(WEB / "daling.ico", sizes=[(s, s) for s in sizes], append_images=frames[:-1])

    # 탭 아이콘: 64px 타일을 SVG 안에 넣는다 (붓선 모양을 그대로 살리려고 벡터로 다시 그리지 않음)
    buf = io.BytesIO()
    tile(64, mask).save(buf, "PNG")
    data = base64.b64encode(buf.getvalue()).decode("ascii")
    (WEB / "favicon.svg").write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
        'viewBox="0 0 64 64" role="img" aria-label="Daling">'
        f'<image width="64" height="64" href="data:image/png;base64,{data}" xlink:href="data:image/png;base64,{data}"/>'
        "</svg>\n",
        encoding="utf-8",
    )

    # 화면 안에서 쓸 투명 로고(바탕 없이 선만, 색은 CSS 에서 칠할 수 있게 마스크로)
    mark = Image.new("RGBA", mask.size, INK)
    mark.putalpha(mask)
    mark.resize((240, 240), Image.LANCZOS).save(WEB / "img" / "daling-mark.png")
    save_mac_icns(mask)
    save_msix_assets(mask)
    print("app.png, app.ico, app-logo-120.png, favicon.svg, img/daling-mark.png, packaging/mac/Daling.icns, "
          "packaging/msix/Assets 를 만들었습니다.")


if __name__ == "__main__":
    main()
