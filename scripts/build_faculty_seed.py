"""조직도(directory.json)에서 교원만 골라 설치 파일에 넣을 씨앗을 만든다.

    python scripts/build_faculty_seed.py [조직도 파일]   (기본: C:\\lms-autosaver\\directory.json)
    → data/seed_directory_faculty.json

새 사용자도 교수 주소가 바로 채워지게 하려고 넣는다(2026-10-15 사용자). 교수 주소는 학교 홈페이지에
공개된 정보라 공개 설치 파일에 담아도 된다. 학생·직원까지 든 전체 조직도는 포탈 로그인 뒤에만 보이는
정보라 넣지 않는다 — 설치 파일은 GitHub 릴리스·소개 사이트에서 누구나 받고 쉽게 풀린다.
학기가 바뀌어 교원이 달라지면 새 조직도로 다시 만든다.
"""
from __future__ import annotations

import json
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import directory  # noqa: E402

OUT = ROOT / "data" / "seed_directory_faculty.json"


def main() -> None:
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(r"C:\lms-autosaver\directory.json")
    people = directory.load_directory(src)
    faculty = sorted(
        (
            {k: str(p.get(k, "")).strip() for k in ("name", "email", "dept", "title", "role")}
            for p in people
            if str(p.get("role", "")).strip() == "교원" and str(p.get("email", "")).lower().endswith("@dgist.ac.kr")
        ),
        key=lambda p: (p["name"], p["email"]),
    )
    if len(faculty) < 100:
        raise SystemExit(f"교원이 {len(faculty)}명뿐입니다. 조직도 파일이 맞는지 확인하세요: {src}")
    data = {
        "builtAt": datetime.now().isoformat(timespec="seconds"),
        "source": "DGIST 웹메일 조직도 중 교원",
        "count": len(faculty),
        "people": faculty,
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"교원 {len(faculty)}명 → {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
