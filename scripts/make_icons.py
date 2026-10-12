"""Daling 로고 아이콘 일괄 생성.

원본 그림(design/logo/daling-source.webp, 흰 바탕에 검은 붓선) 하나에서
창 아이콘(app.png), 윈도우 바로가기(app.ico), 구글 동의화면·설정 '앱' 카드용(app-logo-120.png),
브라우저 탭 아이콘(favicon.svg)을 모두 만든다.
로고를 바꿀 때는 원본 그림만 바꾸고 다시 실행하면 된다. (2026-10-11 붕어빵 물고기 → Daling)

    python scripts/make_icons.py      (시스템 파이썬의 Pillow. 앱에는 필요 없다)

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


def main() -> None:
    mask = load_mask()

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
    print("app.png, app.ico, app-logo-120.png, favicon.svg, img/daling-mark.png 를 만들었습니다.")


if __name__ == "__main__":
    main()
