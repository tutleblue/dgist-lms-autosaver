"""소개 사이트 공유 카드(카톡·SNS 미리보기 이미지) 만들기.

    python scripts/make_og_card.py      (시스템 파이썬의 Pillow, 앱에는 필요 없음)
    → docs/img/og-card.png, docs/img/en/og-card.png  (1200×630)

예전 미리보기는 대시보드 스크린샷을 그대로 써서 카톡 작은 칸에서 글씨가 뭉개지고 빽빽했다(2026-10-15 사용자:
'간결하게'). 로고·이름·한 줄 소개만 가운데에 크게 둔다. 카톡은 위아래를 조금 잘라 보여 주므로 가장자리는 비운다.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
W, H = 1200, 630
BG = (250, 249, 245)        # 사이트 바탕 (#faf9f5)
INK = (31, 30, 29)
SOFT = (110, 106, 98)
ACCENT = INK                # 2026-10-25 사이트에서 주황을 뺄 때 함께 먹색으로
FONTS = Path("C:/Windows/Fonts")


def font(name: str, size: int, weight: int | None = None) -> ImageFont.FreeTypeFont:
    f = ImageFont.truetype(str(FONTS / name), size)
    if weight is not None:
        try:
            f.set_variation_by_axes([weight])
        except Exception:
            pass
    return f


def make(tagline: str, out: Path) -> None:
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)

    logo = Image.open(ROOT / "docs" / "logo-512.png").convert("RGBA").resize((168, 168), Image.LANCZOS)
    title_font = font("NotoSerifKR-VF.ttf", 112, 700)
    tag_font = font("NotoSansKR-VF.ttf", 40, 500)

    title = "Daling"
    tw = draw.textlength(title, font=title_font)
    gap = 36
    block_w = logo.width + gap + tw
    x0 = (W - block_w) / 2
    y_logo = 170
    img.paste(logo, (int(x0), y_logo), logo)
    # 이름은 로고 세로 가운데에 맞춘다
    bbox = draw.textbbox((0, 0), title, font=title_font)
    th = bbox[3] - bbox[1]
    draw.text((x0 + logo.width + gap, y_logo + (logo.height - th) / 2 - bbox[1]), title, font=title_font, fill=INK)

    # 한 줄 소개 + 짧은 강조선
    tag_w = draw.textlength(tagline, font=tag_font)
    y_tag = y_logo + logo.height + 64
    draw.text(((W - tag_w) / 2, y_tag), tagline, font=tag_font, fill=SOFT)
    draw.rounded_rectangle(((W - 64) / 2, y_tag - 30, (W + 64) / 2, y_tag - 24), radius=3, fill=ACCENT)

    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, optimize=True)
    print(f"{out.relative_to(ROOT)}  {out.stat().st_size // 1024}KB")


if __name__ == "__main__":
    make("DGIST 학생을 위한 LMS·메일 정리 앱", ROOT / "docs" / "img" / "og-card.png")
    make("LMS, mail and deadlines for DGIST students", ROOT / "docs" / "img" / "en" / "og-card.png")
