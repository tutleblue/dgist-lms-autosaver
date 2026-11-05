"""메일 쓰기 흐름 — 교수·조교 메일의 첫머리(인사·자기소개)와 끝(감사·서명)을 미리 만들어 둔다.

2026-10-19 사용자: 'AI 초안'을 채팅처럼 통째로 받아 붙이는 것보다, 처음과 끝은 늘 비슷하니 그 흐름이 회색 글씨로
보이고 클릭하거나 Tab 을 치면 바로 써지게(자동완성). AI 는 가운데 용건 정리에만. 외국인 교수님이면 영어,
한국인 교수님이면 한국어로. 이름·학번은 LMS 에서 받아 자동으로.

- 영어 꼴은 사용자가 실제로 보낸 메일(Dear Professor …, I hope this email finds you well. My name is … (Student ID: …),
  a first-year student in the School of Undergraduate Studies taking your … class (BS101, Section 04). … Sincerely,)을 따랐다.
- 외국인 판별: LMS·조직도는 외국인 교원 이름을 로마자로 적는다(실측: 교원 247명 중 11명, 'Carlos Scarinci',
  'DEVECIOGLU DENIZ OLGU'). 이름에 한글이 없고 로마자가 있으면 외국인으로 본다. 화면에서 언제든 바꿀 수 있다.
- 글 조각은 여기(파이썬)에서 만든다. app.js 에 한국어 메일 글이 들어가면 영어 화면 번역표(i18n)가 그것까지 번역하려 든다.
"""

from __future__ import annotations

import json
import re
import unicodedata
from datetime import date
from pathlib import Path
from typing import Any

HANGUL = re.compile(r"[가-힣]")
LATIN = re.compile(r"[A-Za-z]")

# ===== 한글 이름 → 로마자 (LMS 는 영문 이름을 주지 않는다. 추정값이라 설정에서 고칠 수 있다) =====
# 이름은 국어의 로마자 표기법대로 음절마다 따로 적고(소리 바꿈 없음, 예: 한복남 Han Boknam), 성은 흔히 쓰는 표기를 쓴다.
_INITIAL = ["g", "kk", "n", "d", "tt", "r", "m", "b", "pp", "s", "ss", "", "j", "jj", "ch", "k", "t", "p", "h"]
_MEDIAL = ["a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa", "wae", "oe", "yo", "u", "wo", "we", "wi",
           "yu", "eu", "ui", "i"]
_FINAL = ["", "k", "k", "k", "n", "n", "n", "t", "l", "k", "m", "l", "l", "l", "p", "l", "m", "p", "p", "t", "t",
          "ng", "t", "t", "k", "t", "p", "t"]
SURNAMES = {
    "김": "Kim", "이": "Lee", "박": "Park", "최": "Choi", "정": "Jung", "강": "Kang", "조": "Cho", "윤": "Yoon",
    "장": "Jang", "임": "Lim", "한": "Han", "오": "Oh", "서": "Seo", "신": "Shin", "권": "Kwon", "황": "Hwang",
    "안": "Ahn", "송": "Song", "류": "Ryu", "유": "Yoo", "홍": "Hong", "전": "Jeon", "고": "Ko", "문": "Moon",
    "양": "Yang", "손": "Son", "배": "Bae", "백": "Baek", "허": "Heo", "노": "Noh", "남": "Nam", "심": "Shim",
    "하": "Ha", "곽": "Kwak", "성": "Sung", "차": "Cha", "주": "Joo", "우": "Woo", "구": "Koo", "나": "Na",
    "민": "Min", "진": "Jin", "지": "Ji", "엄": "Eom", "채": "Chae", "원": "Won", "천": "Cheon", "방": "Bang",
    "공": "Kong", "현": "Hyun", "함": "Ham", "변": "Byun", "염": "Yeom", "여": "Yeo", "추": "Choo", "도": "Do",
    "소": "So", "석": "Seok", "선": "Sun", "설": "Seol", "마": "Ma", "길": "Gil", "연": "Yeon", "위": "Wi",
    "표": "Pyo", "명": "Myung", "기": "Ki", "반": "Ban", "왕": "Wang", "금": "Keum", "옥": "Ok", "육": "Yook",
    "인": "In", "맹": "Maeng", "제": "Je", "모": "Mo", "탁": "Tak", "국": "Kook", "은": "Eun", "편": "Pyeon",
    "용": "Yong", "예": "Ye", "경": "Kyung", "봉": "Bong", "사": "Sa", "부": "Boo", "범": "Beom", "피": "Pi",
    "황보": "Hwangbo", "남궁": "Namgoong", "제갈": "Jegal", "선우": "Sunwoo", "독고": "Dokgo", "사공": "Sagong",
    "서문": "Seomun", "동방": "Dongbang",
}


def _romanize_syllables(text: str) -> str:
    out = []
    for ch in text:
        code = ord(ch) - 0xAC00
        if 0 <= code < 11172:
            out.append(_INITIAL[code // 588] + _MEDIAL[(code % 588) // 28] + _FINAL[code % 28])
        elif ch.isalpha():
            out.append(ch)
    return "".join(out)


def romanize_name(name: str) -> str:
    """'홍길동' → 'Gildong Hong' (영어 메일은 이름 성 순서. 사용자 메일의 서명도 이 순서였다)."""
    name = re.sub(r"\s+", "", str(name or ""))
    if not name or not HANGUL.search(name) or len(name) < 2:
        return ""
    surname = name[:2] if len(name) >= 4 and name[:2] in SURNAMES else name[:1]
    given = name[len(surname):]
    family = SURNAMES.get(surname) or _romanize_syllables(surname).capitalize()
    first = _romanize_syllables(given).capitalize()
    return f"{first} {family}".strip()


# ===== 소속 =====
DEPT_EN = {
    "기초학부": "School of Undergraduate Studies",
    "융복합대학": "School of Undergraduate Studies",
}


def clean_dept(dept: str) -> str:
    """'DGIST 기초학부 2', '기초학부(학생)' → '기초학부'. 화면 칸에 적힌 군더더기를 덜어 낸다."""
    text = re.sub(r"\(.*?\)", "", str(dept or ""))
    text = re.sub(r"^\s*(DGIST|디지스트)\s*", "", text, flags=re.I)
    text = re.sub(r"\s*\d+\s*(학년)?\s*$", "", text)
    return text.strip()


def dept_en(dept: str) -> str:
    key = clean_dept(dept).replace(" ", "")
    for ko, en in DEPT_EN.items():
        if ko in key:
            return en
    return ""


def school_year(student_id: str, today: date | None = None) -> int:
    """학번 앞 네 자리(입학 연도)로 몇 학년인지. 3월 전이면 지난 학년도. 휴학은 알 수 없어 추정값이다."""
    m = re.match(r"^(20\d{2})\d{4,}$", str(student_id or ""))
    if not m:
        return 0
    today = today or date.today()
    academic = today.year if today.month >= 3 else today.year - 1
    year = academic - int(m.group(1)) + 1
    return year if 1 <= year <= 6 else 0


ORDINAL = {1: "first-year", 2: "second-year", 3: "third-year", 4: "fourth-year", 5: "fifth-year", 6: "sixth-year"}


# ===== 내 정보: 직접 적은 값 > LMS > 조직도 =====
def _read(path: Path, fallback: Any) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8-sig"))
    except (OSError, ValueError):
        return fallback


def auto_profile(root: Path, people: list[dict[str, Any]], school_email: str = "") -> dict[str, str]:
    """LMS(/users/me)와 조직도에서 가져온 내 정보. 직접 적은 값이 없을 때 쓴다."""
    lms = _read(root / "lms_profile.json", {})
    lms = lms if isinstance(lms, dict) else {}
    email = str(lms.get("email") or school_email or "").strip().lower()
    mine = next((p for p in people if email and str(p.get("email", "")).lower() == email), None) or {}
    name = str(lms.get("name") or mine.get("name") or "").strip()
    student_id = str(lms.get("studentId") or "").strip()
    dept = clean_dept(str(mine.get("dept") or lms.get("department") or ""))
    return {
        "name": name,
        "nameEn": romanize_name(name) if HANGUL.search(name) else name,
        "studentId": student_id,
        "dept": dept,
        "email": email,
        "from": "lms" if lms.get("studentId") else ("directory" if mine else ""),
    }


def my_profile(manual: dict[str, str], auto: dict[str, str]) -> dict[str, Any]:
    """화면·초안에 쓸 최종 내 정보."""
    pick = lambda key: str(manual.get(key) or "").strip() or str(auto.get(key) or "").strip()
    name = pick("name")
    name_en = str(manual.get("nameEn") or "").strip() or (romanize_name(name) if HANGUL.search(name) else "") or str(auto.get("nameEn") or "")
    student_id = pick("studentId")
    dept = clean_dept(pick("dept")) or "기초학부"  # DGIST 학부생은 모두 기초학부로 들어온다
    year = school_year(student_id)
    return {
        "name": name, "nameEn": name_en, "studentId": student_id, "dept": dept, "deptEn": dept_en(dept),
        "year": year, "email": str(auto.get("email") or ""),
    }


# ===== 받는 사람 =====
def is_foreign(name: str) -> bool:
    return bool(name) and not HANGUL.search(name) and bool(LATIN.search(name))


def family_name(name: str) -> str:
    """'Carlos Scarinci' → 'Scarinci'. 학교 명부는 'DEVECIOGLU DENIZ OLGU' 처럼 성을 대문자로 앞에 쓰기도 한다."""
    parts = [p for p in re.split(r"[\s,]+", str(name or "").strip()) if p]
    if not parts:
        return ""
    if len(parts) > 1 and parts[0].isupper() and len(parts[0]) > 1:
        return parts[0].capitalize()
    return parts[-1] if not parts[-1].isupper() else parts[-1].capitalize()


def course_en(text: str) -> str:
    """LMS 영어 과목명 정리: 'General PhysicsⅡ' → 'General Physics II'."""
    text = unicodedata.normalize("NFKC", str(text or "")).strip()
    text = re.sub(r"(?<=[a-z])(I{1,3}|IV|V)$", r" \1", text)
    return re.sub(r"\s+", " ", text)


def _norm(text: str) -> str:
    return re.sub(r"\s+", "", unicodedata.normalize("NFKC", str(text or ""))).lower()


def course_number(timetable: list[dict[str, Any]], title: str, professor: str) -> str:
    """시간표(학교 수강 내역에서 가져온 것)의 학수번호. 과목명이 같거나 교수 이름이 같은 칸에서."""
    t, p = _norm(title), _norm(professor)
    for entry in timetable:
        no = str(entry.get("courseNo") or "").strip()
        if not no:
            continue
        if t and _norm(entry.get("title")) == t:
            return no
    for entry in timetable:
        no = str(entry.get("courseNo") or "").strip()
        if no and p and _norm(entry.get("professor")) == p:
            return no
    return ""


def recipient(email: str, typed_name: str, staff: dict[str, Any], people: list[dict[str, Any]],
              timetable: list[dict[str, Any]]) -> dict[str, Any]:
    """받는 사람 주소 → 누구인지(교수·조교·그 밖), 외국인인지, 내 어느 과목인지.

    staff: get_course_staff(...)['courses'] (이번 학기 과목 영어 이름 → 교수·조교 줄)
    """
    email = str(email or "").strip().lower()
    courses = []
    who: dict[str, Any] = {}
    for label, rows in (staff or {}).items():
        for r in rows or []:
            if email and str(r.get("email") or "").lower() == email:
                who = who or r
                prof = next((x.get("name") for x in rows if x.get("role") == "교수"), "")
                courses.append({
                    "title": str(r.get("title") or ""),
                    "titleEn": course_en(label),
                    "section": str(r.get("section") or ""),
                    "courseNo": course_number(timetable, str(r.get("title") or ""), str(prof or "")),
                    "professor": str(prof or ""),
                })
    if not who and email:
        hit = next((p for p in people if str(p.get("email", "")).lower() == email), None)
        if hit:
            role = str(hit.get("role") or "")
            who = {"name": hit.get("name"), "role": "교수" if role == "교원" else ("직원" if role == "직원" else "")}
    name = str(who.get("name") or typed_name or "").strip()
    name = re.sub(r"\s*/.*$", "", name)  # '이름/소속' 꼴(주소찾기)에서 이름만
    role = str(who.get("role") or "")
    kind = "professor" if role == "교수" else ("ta" if "조교" in role else ("staff" if role == "직원" else ""))
    return {
        "email": email, "name": name, "role": role, "kind": kind,
        "foreign": is_foreign(name), "family": family_name(name) if is_foreign(name) else "",
        "courses": courses,
    }


# ===== 글 조각 =====
# kind: greeting → intro → leadin → (내 용건) → closing → signoff. after: 넣은 뒤 줄바꿈 수(0 이면 그 줄에서 이어 쓴다).
# match: 이미 쓴 줄이 어느 단계인지 알아보는 정규식(자바스크립트에서 i 플래그로 쓴다). 화면이 Tab 으로 넣을 다음 조각을 고른다.
MATCH = {
    "ko": {
        "greeting": r"(안녕하(세요|십니까)|^.{0,24}(교수님|조교님|선생님|담당자님)(께)?\s*[,.!]?$)",
        "intro": r"(수강\s*중|\d학년)",
        "leadin": r"^(다름이\s*아니(오)?라|다름이\s*아니고|이렇게\s*(메일|연락))",
        "closing": r"(감사(합니다|드립니다)|읽어\s*주셔서|확인해\s*주셔서|좋은\s*하루|건강하시)",
        "signoff": r"(드림|올림)\s*$",
    },
    "en": {
        "greeting": r"^(dear|hello|hi|good\s+(morning|afternoon|evening))\b",
        "intro": r"(my name is|student id|finds you well|hope you are)",
        "leadin": r"^(i am|i'm)\s+writing|^i would like to|^i wanted to",
        "closing": r"^(thank you|thanks|i appreciate|i would appreciate)",
        "signoff": r"^(sincerely|best regards|kind regards|regards|best wishes|respectfully|yours)\b",
    },
}


def _course_ko(c: dict[str, Any] | None) -> str:
    if not c:
        return ""
    title = c.get("title") or ""
    no = f"({c['courseNo']})" if c.get("courseNo") else ""
    sec = f" {c['section']}분반" if c.get("section") else ""
    return f"{title}{no}{sec}"


def _course_en(c: dict[str, Any] | None, mine: bool) -> str:
    if not c:
        return ""
    title = c.get("titleEn") or c.get("title") or ""
    bits = [b for b in (c.get("courseNo"), f"Section {c['section']}" if c.get("section") else "") if b]
    tail = f" ({', '.join(bits)})" if bits else ""
    return f"your {title} class{tail}" if mine else f"{title}{tail}"


def _eul(text: str) -> str:
    """'일반화학Ⅱ(CHEM102) 2분반' → '을', '물리학' → '을', '화학' → '을', '수학' 같은 받침 없는 끝 → '를'.

    한글 끝 글자의 받침으로 고르고, 끝이 괄호·로마 숫자·영문이면 그 앞 한글을 본다. 끝까지 한글이 없으면 '을(를)'.
    """
    t = re.sub(r"\([^)]*\)\s*$", "", str(text or "")).strip()
    for ch in reversed(t):
        if "가" <= ch <= "힣":
            return "을" if (ord(ch) - 0xAC00) % 28 else "를"
        if ch.isdigit():
            # 숫자 읽기: 0 영·1 일·3 삼·6 육·7 칠·8 팔 은 받침이 있다
            return "을" if ch in "013678" else "를"
    return "을(를)"


# ===== 부서 이름 → 영어 (2026-10-21 사용자: '영어로 쓸 때도 DGIST 장학을 DGIST Scholarship 으로, 그런 디테일을') =====
# 영어 메일 첫 줄에 'Dear DGIST상담경력개발팀,' 처럼 한글이 그대로 들어갔다. 학교 부서 이름의 핵심 낱말과 끝말(팀·과·센터…)을
# 영어로 옮겨 'Dear DGIST Counseling and Career Development Team,' 으로 쓴다. 모르는 부서면 'Dear Sir or Madam,'.
OFFICE_CORE_EN = [  # 긴 낱말부터 (학사지원 이 학사 보다 먼저 맞게)
    ("상담경력개발", "Counseling and Career Development"), ("학사지원", "Academic Affairs"), ("학생지원", "Student Affairs"),
    ("국제협력", "International Affairs"), ("연구지원", "Research Support"), ("산학협력", "Industry-Academic Cooperation"),
    ("창업지원", "Startup Support"), ("정보전산", "IT Services"), ("교육혁신", "Educational Innovation"),
    ("학부교육", "Undergraduate Education"), ("기초학부", "School of Undergraduate Studies"), ("대학원", "Graduate School"),
    ("생활관", "Residence Hall"), ("기숙사", "Dormitory"), ("도서관", "Library"), ("장학", "Scholarship"),
    ("입학", "Admissions"), ("교무", "Academic Affairs"), ("학사", "Academic Affairs"), ("학생", "Student Affairs"),
    ("국제", "International Affairs"), ("총무", "General Affairs"), ("인사", "Human Resources"), ("재무", "Finance"),
    ("회계", "Finance"), ("연구", "Research"), ("창업", "Startup Support"), ("전산", "IT Services"), ("보건", "Health"),
    ("홍보", "Public Relations"), ("시설", "Facilities"), ("안전", "Safety"), ("상담", "Counseling"), ("경력개발", "Career Development"),
]
OFFICE_SUFFIX_EN = [("사무국", "Office"), ("본부", "Division"), ("센터", "Center"), ("팀", "Team"), ("과", "Office"),
                    ("처", "Office"), ("실", "Office"), ("단", "Group")]
# 끝말을 붙이지 않는 이름 (이미 '…관·…원·…학부' 로 끝나는 곳)
OFFICE_WHOLE = {"Residence Hall", "Dormitory", "Library", "Graduate School", "School of Undergraduate Studies"}


# 학과·전공 주소 (2026-10-21 '인공지능전공' 이 사람 이름으로 잡혀 'Dear Gongjineungjeongong In,' 이 나왔다).
# DGIST 학과·전공의 영어 이름. 끝말(학과·전공)을 뗀 낱말로 찾는다.
ACADEMIC_SUFFIX = ("학과", "전공", "학부", "대학원", "연구소", "연구실")
DEPT_FIELD_EN = {
    "인공지능": "Artificial Intelligence",
    "전기전자컴퓨터공학": "Electrical Engineering and Computer Science",
    "로봇및기계전자공학": "Robotics and Mechatronics Engineering",
    "로봇공학": "Robotics Engineering",
    "에너지공학": "Energy Science and Engineering",
    "뇌과학": "Brain Sciences",
    "뇌인지과학": "Brain and Cognitive Sciences",
    "뉴바이오": "New Biology",
    "화학물리": "Physics and Chemistry",
    "의생명공학": "Biomedical Engineering",
    "반도체공학": "Semiconductor Engineering",
    "신소재공학": "Materials Science and Engineering",
    "기초학부": "School of Undergraduate Studies",
}


def looks_like_person(name: str) -> bool:
    """한국 사람 이름처럼 보이는가: 띄어쓰기 없이 2~4글자 한글이고 흔한 성으로 시작하며 부서·학과가 아니다."""
    text = re.sub(r"\s+", "", re.sub(r"\s*/.*$", "", str(name or "")))
    if not re.fullmatch(r"[가-힣]{2,4}", text) or office_core(text):
        return False
    return text[:1] in SURNAMES or text[:2] in SURNAMES


def dept_name_en(core: str) -> str:
    """'인공지능전공' → 'DGIST Department of Artificial Intelligence'. 모르면 ''."""
    # '뇌과학과' 는 '뇌과학+과', '화학물리학과' 는 '화학물리+학과' — 끝말을 둘 다 떼어 보고 표에 있는 쪽을 쓴다
    for suf in ("전공", "학과", "과"):
        if core.endswith(suf):
            field = DEPT_FIELD_EN.get(core[: -len(suf)])
            if field:
                return f"DGIST Department of {field}"
    if core.endswith(("학과", "전공")):
        return ""
    if core in DEPT_FIELD_EN:
        return f"DGIST {DEPT_FIELD_EN[core]}"
    return ""


def office_core(name: str) -> str:
    """'DGIST상담경력개발팀/대구경북과학기술원' → '상담경력개발팀'. 부서처럼 보이지 않으면 ''."""
    text = re.sub(r"\s*/.*$", "", str(name or ""))
    text = re.sub(r"^\s*(DGIST|디지스트)\s*", "", text, flags=re.I).strip()
    if not HANGUL.search(text):
        return ""
    if any(text == k for k, _ in OFFICE_CORE_EN):  # '장학'·'생활관' 처럼 부서 낱말만 적힌 주소
        return text
    if len(text) >= 3 and text.endswith(ACADEMIC_SUFFIX):  # '인공지능전공'·'뇌과학과'·'기초학부'
        return text
    if any(text.endswith(k) for k, _ in OFFICE_SUFFIX_EN) or any(k in text for k, _ in OFFICE_CORE_EN):
        # 두세 글자 사람 이름('장학수') 이 '장학' 으로 잡히지 않게: 부서 끝말이 없고 4글자 이하면 사람으로 본다
        if not any(text.endswith(k) for k, _ in OFFICE_SUFFIX_EN) and len(text) <= 4:
            return ""
        return text
    return ""


def office_en(name: str) -> str:
    """'상담경력개발팀' → 'DGIST Counseling and Career Development Team', '장학' → 'DGIST Scholarship Office'."""
    core = office_core(name)
    if not core:
        return ""
    if core.endswith(ACADEMIC_SUFFIX):
        return dept_name_en(core)
    suffix = next((en for ko, en in OFFICE_SUFFIX_EN if core.endswith(ko)), "")
    body = core[: -len(next(ko for ko, en in OFFICE_SUFFIX_EN if core.endswith(ko)))] if suffix else core
    words = []
    rest = body
    while rest:
        hit = next(((ko, en) for ko, en in OFFICE_CORE_EN if rest.startswith(ko)), None)
        if not hit:
            return ""  # 모르는 낱말이 섞이면 지어내지 않는다
        words.append(hit[1])
        rest = rest[len(hit[0]):]
    en = " and ".join(dict.fromkeys(words)) if len(words) > 1 and "Counseling" in words and "Career Development" in words else " ".join(dict.fromkeys(words))
    if en in OFFICE_WHOLE:
        return f"DGIST {en}"
    return f"DGIST {en} {suffix or 'Office'}"


def segments(me: dict[str, Any], to: dict[str, Any], course_index: int = 0) -> dict[str, list[dict[str, Any]]]:
    """한국어·영어 흐름 조각. 모르는 값은 빼고 문장을 만든다(빈 [ ] 를 남기지 않는다)."""
    courses = to.get("courses") or []
    course = courses[course_index] if 0 <= course_index < len(courses) else (courses[0] if courses else None)
    kind = to.get("kind") or ""
    name = to.get("name") or ""
    my_name, my_en, sid = me.get("name") or "", me.get("nameEn") or "", me.get("studentId") or ""
    year, dept = int(me.get("year") or 0), me.get("dept") or ""

    # --- 한국어 (2026-10-21 사용자: '한국어 예문이 마음에 안 든다, 공식 메일 작성법대로 다시') ---
    # 대학 공식 메일의 순서: 호칭(○○○ 교수님께,) → 인사(안녕하십니까.) → 자기소개(저는 … 수강하고 있는 소속 학년 이름
    # (학번 …)입니다.) → 용건(다름이 아니라 …) → 감사·축원 → 서명(소속 학년 이름 올림 / 학번). 교수님께는 '올림',
    # 그 밖에는 '드림'. 조교님은 한 단계 덜 딱딱하게(안녕하세요). 예전 꼴은 '안녕하세요, ○○ 교수님.' 으로 시작해
    # 가볍게 읽혔고, 자기소개가 과목부터 늘어놓아 누가 쓰는지가 늦게 나왔다.
    me_ko = " ".join(b for b in (dept, f"{year}학년" if year else "", my_name) if b)
    sid_ko = f"(학번 {sid})" if sid else ""
    if kind == "professor":
        hello = f"{name} 교수님께,\n안녕하십니까." if name else "교수님께,\n안녕하십니까."
        thanks = "바쁘신 와중에 읽어 주셔서 감사합니다.\n늘 건강하시고 좋은 하루 보내십시오."
        sign = f"{me_ko} 올림" if my_name else ""
    elif kind == "ta":
        hello = f"{name} 조교님께,\n안녕하세요." if name else "조교님께,\n안녕하세요."
        thanks = "바쁘신 와중에 확인해 주셔서 감사합니다.\n좋은 하루 보내세요."
        sign = f"{me_ko} 드림" if my_name else ""
    else:
        polite = bool(name) and not to.get("foreign") and looks_like_person(name)
        # '상담경력개발팀'·'학사지원과' 같은 부서 주소는 '○○팀 담당자님께,' (조직도 이름 '…팀/대구경북과학기술원' 은 앞만)
        office = office_core(name) if name and not to.get("foreign") else ""
        if office:
            hello = f"{office} 담당자님께,\n안녕하십니까."
        else:
            hello = f"{name}님께,\n안녕하십니까." if polite else "안녕하십니까."
        thanks = "읽어 주셔서 감사합니다.\n좋은 하루 보내십시오."
        sign = f"{me_ko} 드림" if my_name else ""
    if sign and sid:
        sign += f"\n학번 {sid}"
    # 이름을 아직 모르면(새 설치, LMS 동기화 전) 자기소개는 건너뛴다 — '기초학부입니다.' 만 남는 문장이 나왔다
    if my_name and course:
        intro_ko = f"저는 {_course_ko(course)}{_eul(_course_ko(course))} 수강하고 있는 {me_ko}{sid_ko}입니다."
    elif my_name:
        intro_ko = f"저는 {me_ko}{sid_ko}입니다."
    else:
        intro_ko = ""
    ko = [
        {"kind": "greeting", "text": hello, "after": 2},
        {"kind": "intro", "text": intro_ko, "after": 2},
        {"kind": "leadin", "text": "다름이 아니라, ", "after": 0},
        {"kind": "closing", "text": thanks, "after": 2},
        {"kind": "signoff", "text": sign, "after": 0},
    ]

    # --- 영어 (사용자가 보낸 메일 꼴) ---
    # 한국인 교수님께 영어로 쓸 때는 성만 로마자로('김철수' → Professor Kim)
    fam = to.get("family") or (romanize_name(name).split(" ")[-1] if HANGUL.search(name) else name)
    if kind == "professor":
        dear = f"Dear Professor {fam}," if fam else "Dear Professor,"
        wish = "I hope this email finds you well."
        thank_en = "Thank you for your time and understanding."
        bye = "Sincerely,"
    elif kind == "ta":
        # 한국인 조교님은 이름을 로마자로 (Dear 김민수 → Dear Minsu Kim)
        ta_en = romanize_name(name) if looks_like_person(name) else ("" if HANGUL.search(name or "") else name)
        dear = f"Dear {ta_en}," if ta_en else "Dear TA,"
        wish = "I hope you are doing well."
        thank_en = "Thank you for your help."
        bye = "Best regards,"
    else:
        # 부서면 영어 부서 이름(Dear DGIST Scholarship Office,), 한국인이면 로마자 이름, 모르면 Sir or Madam
        office_name = office_en(name) if name and HANGUL.search(name) else ""
        person_en = romanize_name(name) if looks_like_person(name) else ""
        if office_name:
            dear = f"Dear {office_name},"
        elif person_en:
            dear = f"Dear {person_en},"
        elif name and not HANGUL.search(name):
            dear = f"Dear {name},"
        else:
            dear = "Dear Sir or Madam,"
        wish = "I hope this email finds you well."
        thank_en = "Thank you for your time."
        bye = "Best regards,"
    sid_en = f" (Student ID: {sid})" if sid else ""
    ord_en = ORDINAL.get(year, "")
    school = me.get("deptEn") or ""
    if ord_en and school:
        status = f"a {ord_en} student in the {school}" + ("" if course else " at DGIST")
    elif ord_en:
        status = f"a {ord_en} student at DGIST"
    else:
        status = f"a student in the {school}" if school else "a student at DGIST"
    taking_en = f" taking {_course_en(course, kind == 'professor')}" if course else ""
    intro_en = f"{wish} My name is {my_en}{sid_en}, {status}{taking_en}." if my_en else wish
    sign_lines = [bye, my_en, f"{school}, DGIST" if school else "DGIST", f"Student ID: {sid}" if sid else ""] if my_en else [bye]
    en = [
        {"kind": "greeting", "text": dear, "after": 2},
        {"kind": "intro", "text": intro_en, "after": 2},
        {"kind": "leadin", "text": "I am writing to ", "after": 0},
        {"kind": "closing", "text": thank_en, "after": 2},
        {"kind": "signoff", "text": "\n".join(l for l in sign_lines if l), "after": 0},
    ]
    # 자기소개 줄은 내 이름·학번이 들어 있는지로도 알아본다('…입니다.' 로 끝나는 용건 줄과 헷갈리지 않게)
    mine = "|".join(re.escape(x) for x in (my_name, my_en, sid) if x)
    out = {}
    for lang, segs in (("ko", ko), ("en", en)):
        match = dict(MATCH[lang])
        if mine:
            match["intro"] = match["intro"][:-1] + "|" + mine + ")"
        out[lang] = [{**s, "match": match[s["kind"]]} for s in segs if s["text"]]
    return out


def build(me: dict[str, Any], to: dict[str, Any], course_index: int = 0) -> dict[str, Any]:
    return {
        "ok": True,
        "me": me,
        "to": to,
        "lang": "en" if to.get("foreign") else "ko",
        "segments": segments(me, to, course_index),
    }
