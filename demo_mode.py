"""체험 모드: 계정 없이 가짜 데이터로 모든 화면을 둘러본다.

왜 있나
  Microsoft Store 정책 10.3.1 은 로그인이 필요한 앱에 심사용 시험 계정을 요구한다. DGIST 계정은 학교가
  재학생에게만 주는 SSO 계정이라 줄 수 없다. 로그인 없이 볼 수 있는 화면(학사일정·셔틀·개설강좌)만으로는
  핵심 기능(자료·마감·메일)을 보여 줄 수 없어서, 심사자와 처음 깐 사람이 계정 없이 다 볼 수 있게 했다(2026-10-15).

어떻게
  - 켜면 임시 폴더(%TEMP%\\daling-demo\\<pid>)에 가짜 과목 4개·강의자료·마감·메일·시간표·일정을 만든다.
    web_ui.workspace_for_user 가 이 폴더를 돌려주므로 화면은 그대로 이 데이터를 읽는다.
    진짜 데이터 폴더(C:\\lms-autosaver)는 읽기만 한다: 테마·언어·소개 본 기록(ui_prefs·tutorial·whats_new)을 복사해 온다.
  - 켜 있는 동안 이 프로세스의 소켓 연결은 이 컴퓨터(루프백)로만 된다. 이름 찾기(DNS)도 막는다.
    LMS·메일 서버·Google·학교 홈페이지 어디에도 요청이 나가지 않는다. 막은 시도는 BLOCKED 에 남긴다(검증용).
    작업 프로세스(동기화·메일)는 web_ui.start_task 가 아예 띄우지 않는다.
  - 끄면 체험 폴더를 지우고, 체험 중 바꾼 화면 취향(테마·언어)과 소개 본 기록만 진짜 폴더로 돌려놓는다.
  - 켠 상태는 메모리에만 둔다. 앱을 다시 켜면 늘 진짜 데이터로 시작한다.

가짜 데이터에는 실명·실제 메일 주소를 쓰지 않는다: 사람은 옛이야기 인물(이몽룡·성춘향…),
주소는 예시용으로 예약된 example.com 이다(RFC 2606). 학사일정·개설강좌는 앱에 들어 있는 공개 씨앗 자료를 그대로 쓴다.
"""
from __future__ import annotations

import json
import os
import shutil
import socket
import tempfile
import threading
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from runtime_config import atomic_write_text

MARKER = ".daling-demo"
BASE = Path(tempfile.gettempdir()) / "daling-demo"
# 체험 중 화면이 바꿀 수 있는 '취향' 파일. 진짜 폴더에서 복사해 오고, 끌 때 바뀐 것만 돌려놓는다.
PREF_FILES = ("ui_prefs.json", "tutorial.json", "whats_new.json")
BLOCK_MESSAGE = "체험 중에는 쓸 수 없어요. 체험을 끝내고 계정을 넣으면 돼요."

_lock = threading.RLock()
_state: dict[str, Any] = {"root": None, "since": None, "lang": "ko"}
BLOCKED: list[dict[str, Any]] = []
_orig: dict[str, Any] = {}


def active() -> bool:
    return _state["root"] is not None


def root() -> Path | None:
    return _state["root"]


def status() -> dict[str, Any]:
    return {
        "active": active(),
        "since": _state["since"],
        "blocked": len(BLOCKED),
        "blockedHosts": sorted({b["host"] for b in BLOCKED})[:20],
    }


# ===== 바깥 연결 막기 =====
# 프로세스 전체에 거는 안전망이다. 화면 서버의 라우트도 체험 중엔 서버에 묻지 않게 고쳤지만,
# 하나라도 빠뜨리면 가짜 계정으로 학교 서버를 두드리게 되므로 소켓에서 한 번 더 막는다.
# 끈 뒤에도 바꿔 끼운 함수는 그대로 두되 _state 를 보고 그냥 통과시킨다(풀고 다시 거는 사이의 경쟁을 피함).

def _is_local(host: Any) -> bool:
    if host is None:
        return True
    if isinstance(host, bytes):
        host = host.decode("ascii", "ignore")
    text = str(host).strip().strip("[]").lower()
    if text in ("", "localhost", "::1", "0.0.0.0", "::"):
        return True
    return text.startswith("127.") or text.startswith("::ffff:127.") or text.endswith(".localhost")


def _note(host: Any, port: Any) -> None:
    BLOCKED.append({"at": datetime.now().isoformat(timespec="seconds"), "host": str(host), "port": port})
    del BLOCKED[:-50]


def _guard_getaddrinfo(host, port, *args, **kwargs):
    if active() and not _is_local(host):
        _note(host, port)
        raise socket.gaierror(socket.EAI_NONAME, "체험 중에는 바깥으로 연결하지 않아요")
    return _orig["getaddrinfo"](host, port, *args, **kwargs)


def _blocked_address(sock: socket.socket, address: Any) -> bool:
    if not active() or sock.family not in (socket.AF_INET, socket.AF_INET6):
        return False
    host = address[0] if isinstance(address, tuple) and address else address
    if _is_local(host):
        return False
    _note(host, address[1] if isinstance(address, tuple) and len(address) > 1 else "")
    return True


def _guard_connect(self, address):
    if _blocked_address(self, address):
        raise ConnectionRefusedError("체험 중에는 바깥으로 연결하지 않아요")
    return _orig["connect"](self, address)


def _guard_connect_ex(self, address):
    if _blocked_address(self, address):
        import errno

        return errno.ECONNREFUSED
    return _orig["connect_ex"](self, address)


def _install_guard() -> None:
    with _lock:
        if _orig:
            return
        _orig["getaddrinfo"] = socket.getaddrinfo
        _orig["connect"] = socket.socket.connect
        _orig["connect_ex"] = socket.socket.connect_ex
        socket.getaddrinfo = _guard_getaddrinfo
        socket.socket.connect = _guard_connect
        socket.socket.connect_ex = _guard_connect_ex


# ===== 켜기·끄기 =====

def _sweep_old() -> None:
    """앱이 체험 중에 꺼져 남은 폴더(하루 넘은 것)를 치운다. 표지 파일이 있는 우리 폴더만."""
    if not BASE.exists():
        return
    for child in BASE.iterdir():
        try:
            if child.is_dir() and (child / MARKER).exists() and time.time() - child.stat().st_mtime > 86400:
                shutil.rmtree(child, ignore_errors=True)
        except OSError:
            pass


def _remove(folder: Path) -> None:
    if folder.exists() and (folder / MARKER).exists():
        shutil.rmtree(folder, ignore_errors=True)


def enable(real_root: Path, lang: str = "ko", academic_seed: dict[str, Any] | None = None) -> Path:
    """academic_seed: 앱에 들어 있는 학사일정 씨앗의 'years' (web_ui.read_seed 가 읽어 넘긴다)."""
    with _lock:
        _install_guard()
        _sweep_old()
        folder = BASE / str(os.getpid())
        _remove(folder)
        build(folder, real_root, lang, academic_seed or {})
        _state.update(root=folder, since=datetime.now().isoformat(timespec="seconds"), lang=lang)
        BLOCKED.clear()
        return folder


def disable(real_root: Path) -> None:
    with _lock:
        folder = _state["root"]
        _state.update(root=None, since=None)
        if folder is None:
            return
        # 체험 중에 고른 테마·언어, 끝까지 본 소개는 사람의 취향이라 진짜 폴더에도 남긴다(데이터는 옮기지 않는다)
        for name in PREF_FILES:
            src, dst = folder / name, real_root / name
            try:
                if src.exists() and src.read_bytes() != (dst.read_bytes() if dst.exists() else b""):
                    if name == "tutorial.json" and not json.loads(src.read_text(encoding="utf-8")).get("done"):
                        continue
                    real_root.mkdir(parents=True, exist_ok=True)
                    atomic_write_text(dst, src.read_text(encoding="utf-8"))
            except (OSError, ValueError):
                pass
        _remove(folder)


# ===== 가짜 데이터 =====

def _term(now: datetime) -> tuple[int, str]:
    """timetable_import.current_term_value 와 같은 셈: 7월까지 1학기, 그 뒤 2학기."""
    return now.year, ("1" if now.month <= 7 else "2")


# 사람 이름은 옛이야기 인물, 주소는 example.com. 강의실도 지어낸 이름.
COURSES = [
    {
        "ko": "미적분학Ⅱ", "en": "Calculus II", "sec": "01", "id": "_90001_1", "no": "DM102", "credit": "3.0",
        "prof": ("이몽룡", "Lee Mongryong", "mongryong.lee"), "ta": ("성춘향", "Seong Chunhyang", "chunhyang.seong"),
        "color": "blue", "slots": [(0, "09:00", "10:30", "A101"), (2, "09:00", "10:30", "A101")],
    },
    {
        "ko": "일반물리학Ⅱ", "en": "General Physics II", "sec": "02", "id": "_90002_1", "no": "DP102", "credit": "3.0",
        "prof": ("전우치", "Jeon Woochi", "woochi.jeon"), "ta": ("심청", "Sim Cheong", "cheong.sim"),
        "color": "coral", "slots": [(1, "10:30", "12:00", "B203"), (3, "10:30", "12:00", "B203")],
    },
    {
        "ko": "프로그래밍 기초", "en": "Introduction to Programming", "sec": "03", "id": "_90003_1", "no": "DC101",
        "credit": "3.0", "prof": ("장화", "Jang Hwa", "hwa.jang"), "ta": ("홍련", "Hong Ryeon", "ryeon.hong"),
        "color": "green", "slots": [(1, "14:00", "16:00", "C105"), (3, "14:00", "15:00", "C105")],
    },
    {
        "ko": "글쓰기와 소통", "en": "Writing and Communication", "sec": "01", "id": "_90004_1", "no": "DL101",
        "credit": "2.0", "prof": ("콩쥐", "Kongjwi", "kongjwi"), "ta": ("팥쥐", "Patjwi", "patjwi"),
        "color": "violet", "slots": [(4, "13:00", "15:00", "D305")],
    },
]
STUDENT = ("체험 학생", "Demo Student", "student")


def _course_name(course: dict[str, Any], year: int, term: str) -> str:
    # LMS 과목 이름 꼴 그대로: '일반물리Ⅱ (General PhysicsⅡ )_03[ 2026_2학기 ]' (web_ui.course_meta 가 이 꼴을 읽는다)
    return f"{course['ko']} ({course['en']} )_{course['sec']}[ {year}_{term}학기 ]"


def _mail_of(person: tuple[str, str, str]) -> str:
    return f"{person[2]}@example.com"


def _pdf(title: str, lines: list[str]) -> bytes:
    """글자만 있는 한 쪽짜리 PDF. 눌러서 열어 볼 수 있게 진짜 PDF 로 만든다(영문만: 한글은 글꼴을 넣어야 한다)."""
    def esc(text: str) -> str:
        return text.encode("latin-1", "replace").decode("latin-1").replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

    rows = ["BT", "/F1 22 Tf", "72 760 Td", f"({esc(title)}) Tj", "/F1 12 Tf"]
    for line in lines:
        rows += ["0 -24 Td", f"({esc(line)}) Tj"]
    rows.append("ET")
    stream = "\n".join(rows).encode("latin-1")
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
    ]
    out = bytearray(b"%PDF-1.4\n")
    offsets = []
    for number, body in enumerate(objects, start=1):
        offsets.append(len(out))
        out += f"{number} 0 obj\n".encode() + body + b"\nendobj\n"
    xref = len(out)
    out += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode()
    for offset in offsets:
        out += f"{offset:010d} 00000 n \n".encode()
    out += f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()
    return bytes(out)


# 과목마다 (LMS 폴더, 파일 이름, 며칠 전에 받았는지). 순서가 곧 LMS 에 올라온 순서.
FILES = [
    [
        (["공지사항(Announcements)"], "Syllabus_Calculus II.pdf", 40),
        (["1주차"], "Calculus II_Week1_Lecture.pdf", 38),
        (["2주차"], "Calculus II_Week2_Lecture.pdf", 31),
        (["3주차"], "Calculus II_Week3_Lecture.pdf", 24),
        (["3주차"], "Week3_Exercises.pdf", 1),
    ],
    [
        (["공지사항(Announcements)"], "Syllabus_General Physics II.pdf", 40),
        (["Lecture Notes"], "Ch21_Electric_Charge.pdf", 30),
        (["Lecture Notes"], "Ch22_Electric_Fields.pdf", 16),
        (["Lab"], "Lab3_Guide.pdf", 2),
    ],
    [
        (["1주차"], "Lecture1_Intro.pdf", 36),
        (["1주차"], "Lab1_Hello.py", 36),
        (["2주차"], "Lecture2_Loops.pdf", 9),
        (["2주차"], "Lab2_Loops_template.py", 0),
        (["과제"], "HW2_Loops.pdf", 0),
    ],
    [
        (["공지사항(Announcements)"], "Syllabus_Writing.pdf", 40),
        (["Readings"], "Reading1_Clear_Writing.pdf", 20),
        (["Templates"], "Essay_Outline_Template.txt", 6),
    ],
]


def _file_bytes(name: str, course: dict[str, Any]) -> bytes:
    if name.endswith(".py"):
        return (
            f'"""Daling demo file - {course["en"]}. Not a real assignment."""\n\n'
            "def main():\n    for i in range(3):\n        print('hello', i)\n\n\nif __name__ == '__main__':\n    main()\n"
        ).encode("utf-8")
    if name.endswith(".txt"):
        return (
            "Essay outline (Daling demo file)\r\n\r\n1. Thesis\r\n2. Reason 1 + evidence\r\n"
            "3. Reason 2 + evidence\r\n4. Counterargument\r\n5. Conclusion\r\n"
        ).encode("utf-8")
    title = Path(name).stem.replace("_", " ")
    return _pdf(title, [
        f"Course: {course['en']}",
        "Daling demo file - sample material for the demo mode.",
        "This is not a real lecture file.",
    ])


def _t(lang: str, ko: str, en: str) -> str:
    return en if lang == "en" else ko


WEEKDAY_KO = "월화수목금토일"


def _md(day: datetime, lang: str) -> str:
    """'10월 22일(수)' / 'Oct 22 (Wed)'"""
    if lang == "en":
        return day.strftime("%b %d (%a)").replace(" 0", " ")
    return f"{day.month}월 {day.day}일({WEEKDAY_KO[day.weekday()]})"


def build(folder: Path, real_root: Path, lang: str = "ko", academic_seed: dict[str, Any] | None = None) -> None:
    lang = "en" if lang == "en" else "ko"
    now = datetime.now().astimezone()
    year, term = _term(now)
    folder.mkdir(parents=True, exist_ok=True)
    (folder / MARKER).write_text("Daling demo data. Safe to delete.\n", encoding="utf-8")

    def write(name: str, data: Any) -> None:
        atomic_write_text(folder / name, json.dumps(data, ensure_ascii=False, indent=1))

    def iso(dt: datetime) -> str:
        return dt.isoformat(timespec="seconds")

    def naive(dt: datetime) -> str:
        return dt.replace(tzinfo=None).isoformat(timespec="seconds")

    def at(days: float, hour: int | None = None, minute: int = 0) -> datetime:
        dt = now + timedelta(days=days)
        if hour is not None:
            dt = dt.replace(hour=hour, minute=minute, second=0, microsecond=0)
        return dt

    def weekday(dt: datetime) -> datetime:
        """시험·세미나가 주말에 걸리면 다음 월요일로"""
        return dt + timedelta(days=7 - dt.weekday()) if dt.weekday() >= 5 else dt

    def utc_z(dt: datetime) -> str:
        return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")

    names = [_course_name(c, year, term) for c in COURSES]

    def who(person: tuple[str, str, str]) -> str:
        return _t(lang, person[0], person[1])
    downloads = folder / "downloads"

    # 설정: 비밀번호 칸은 '저장됨' 으로 보이게 자리만 채운다(진짜 비밀번호가 아니고 어디로도 보내지 않는다)
    write("config.json", {
        "LMS_ID": "demo-student",
        "LMS_PASSWORD": "demo",
        "SCHOOL_EMAIL": _mail_of(STUDENT),
        "SCHOOL_EMAIL_PASSWORD": "demo",
        "DOWNLOAD_PATH": str(downloads),
        "AUTO_DRIVE_UPLOAD": False,
        "AUTO_LOCAL_SAVE": "off",
        "SCHEDULE_TIME": "08:00",
        "NOTIFY_DEADLINES": False,
        "NOTIFY_NEW_FILES": False,
    })

    # 화면 취향은 진짜 폴더에서 가져온다(읽기만)
    for name in PREF_FILES:
        src = real_root / name
        try:
            if src.exists():
                atomic_write_text(folder / name, src.read_text(encoding="utf-8-sig"))
        except OSError:
            pass

    # 과목
    write("courses_state.json", {
        "acknowledged": [{"id": c["id"], "name": n} for c, n in zip(COURSES, names)],
        "current": [{"id": c["id"], "name": n} for c, n in zip(COURSES, names)],
        "added": [], "removed": [], "pending": False, "updatedAt": naive(now),
    })
    write("course_staff.json", {
        c["id"]: {
            "course": n, "label": c["en"], "fetchedAt": naive(now),
            "staff": [
                {"role": "교수", "name": who(c["prof"]), "lmsId": f"demo-p{i}"},
                {"role": "조교", "name": who(c["ta"]), "lmsId": f"demo-t{i}"},
            ],
        }
        for i, (c, n) in enumerate(zip(COURSES, names), start=1)
    })
    people = []
    for c in COURSES:
        people.append({"name": who(c["prof"]), "email": _mail_of(c["prof"]), "dept": _t(lang, "체험 학부", "Demo School"), "title": "", "role": "교원"})
        people.append({"name": who(c["ta"]), "email": _mail_of(c["ta"]), "dept": _t(lang, "체험 대학원", "Demo Graduate School"), "title": "", "role": "대학원생"})
    write("directory.json", {"count": len(people), "people": people})

    # 강의자료: 실제 파일을 만들고, 받은 때를 날짜별로 흩어 둔다('최근 받은 자료'가 보이게)
    metadata: dict[str, Any] = {}
    for index, (course, name, files) in enumerate(zip(COURSES, names, FILES)):
        base = f"{year}-{term}학기/{course['en']}"
        folder_order: dict[str, int] = {}
        for order, (folder_path, filename, days_ago) in enumerate(files):
            rel = f"{base}/{filename}"
            target = downloads / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(_file_bytes(filename, course))
            stamp = (now - timedelta(days=days_ago, hours=index + order)).timestamp()
            os.utime(target, (stamp, stamp))
            top = folder_order.setdefault(folder_path[0], len(folder_order))
            metadata[filename] = {
                "course": name,
                "folder_path": folder_path,
                "original_name": filename,
                "stored": rel,
                "lms_order": [top, order],
            }
    write("file_metadata.json", metadata)
    write("downloaded_files.json", sorted(metadata))
    write("upload_selection.json", {"courses": {}, "hidden": [], "hiddenDeadlines": [], "hiddenFiles": []})

    # 과제 마감: (과목, 이름, 며칠 뒤, 시, 상태, 점수)
    rows = [
        (0, "Week 3 Exercises", 1, 23, None, None),
        (0, "Quiz 2", -4, 18, "Graded", 85.0),
        (0, "Week 4 Exercises", 8, 23, None, None),
        (1, "Lab Report 3", 3, 18, None, None),
        (1, "Problem Set 4", -2, 23, "NeedsGrading", None),
        (1, "Quiz 3", -9, 12, "Graded", 92.0),
        (2, "Lab 2: Loops", 0, 23, None, None),
        (2, "HW 2", 6, 23, None, None),
        (2, "HW 1", -7, 23, "Graded", 100.0),
        (3, "Essay Draft", 5, 23, None, None),
        (3, "Reading Response 2", -1, 23, "NeedsGrading", None),
    ]
    items = []
    for n, (ci, title, days, hour, status_, score) in enumerate(rows, start=1):
        due = at(days, hour, 59 if hour == 23 else 0)
        items.append({
            "course": names[ci], "courseLabel": COURSES[ci]["en"], "courseId": COURSES[ci]["id"],
            "columnId": f"_9{n:04d}_1", "name": title, "due": utc_z(due), "scoreProvider": "",
            "pointsPossible": 100.0, "myStatus": status_, "myScore": score,
        })
    midterm = weekday(at(9, 10))
    events = [{
        "id": "_99001_1", "type": "Course", "title": _t(lang, "중간고사", "Midterm exam"),
        "calendarName": names[0], "location": None,
        "start": utc_z(midterm), "end": utc_z(midterm + timedelta(hours=2)),
    }]
    write("deadlines.json", {"updatedAt": naive(at(0) - timedelta(minutes=20)), "items": items, "events": events, "failedCourses": []})

    # 과목 공지
    def ann(i: int, ko_title: str, en_title: str, ko_text: str, en_text: str, days_ago: float) -> dict[str, Any]:
        when = utc_z(now - timedelta(days=days_ago))
        return {"id": f"_9{i:03d}_1", "courseId": "", "title": _t(lang, ko_title, en_title),
                "text": _t(lang, ko_text, en_text), "created": when, "modified": when}

    write("course_announcements.json", {"updatedAt": iso(now), "courses": {
        names[0]: [
            ann(1, "중간고사 범위 안내", "Midterm coverage",
                f"중간고사는 {_md(midterm, 'ko')} 10:00, A101호에서 봅니다.\n범위: 12장~14장\n계산기는 쓸 수 없습니다.",
                f"The midterm is on {_md(midterm, 'en')} at 10:00 in Room A101.\nCoverage: chapters 12-14\nNo calculators.", 0.2),
            ann(2, "질문 시간 변경", "Office hours moved",
                "이번 주 질문 시간은 목요일 16:00로 옮깁니다.", "Office hours this week move to Thursday 4 PM.", 9),
        ],
        names[1]: [
            ann(3, "실험 3 안전 수칙", "Lab 3 safety notes",
                "실험 3에서는 보안경을 꼭 써 주세요. 실험 안내서는 자료실에 올렸습니다.",
                "Wear safety goggles in Lab 3. The lab guide is in the course files.", 1),
        ],
        names[2]: [
            ann(4, "실습실 변경 안내", "Lab room changed",
                "다음 주부터 실습은 C105호에서 합니다.", "From next week, labs meet in Room C105.", 3),
            ann(5, "HW 2 공지", "HW 2 posted",
                "반복문 과제(HW 2)를 올렸습니다. 템플릿 파일을 받아서 시작하세요.",
                "HW 2 (loops) is posted. Start from the template file.", 0.1),
        ],
        names[3]: [
            ann(6, "에세이 피드백 일정", "Essay feedback schedule",
                "에세이 초안을 낸 뒤 다음 주에 한 명씩 피드백 시간을 잡습니다.",
                "After the draft is in, we will book one-on-one feedback next week.", 5),
        ],
    }})

    # 시간표
    entries = []
    for ci, c in enumerate(COURSES):
        for si, (day, start, end, room) in enumerate(c["slots"]):
            entries.append({
                "id": f"tt-demo-{ci}{si}", "title": _t(lang, c["ko"], c["en"]), "day": day, "start": start, "end": end, "room": room,
                "color": c["color"], "courseLabel": "", "credit": c["credit"], "courseNo": c["no"],
                "professor": who(c["prof"]),
            })
    write("timetable.json", {"entries": entries, "semester": ""})

    # 내 일정
    def my(i: int, title: str, days: int, time_: str, end: str, place: str) -> dict[str, Any]:
        return {"id": f"my-demo-{i}", "title": title, "date": at(days).strftime("%Y-%m-%d"), "time": time_,
                "endTime": end, "endDate": "", "repeat": "", "repeatUntil": "", "location": place, "note": "",
                "updatedAt": naive(now)}

    write("my_events.json", [
        my(1, _t(lang, "스터디 모임", "Study group"), 2, "19:00", "21:00", _t(lang, "도서관 3층", "Library, 3rd floor")),
        my(2, _t(lang, "동아리 회의", "Club meeting"), 4, "18:30", "19:30", _t(lang, "학생회관", "Student center")),
    ])

    # 메일
    seminar = weekday(at(7, 16))
    career = weekday(at(6, 18))
    you = (who(STUDENT), _mail_of(STUDENT))
    mails: list[dict[str, Any]] = []

    def mail(uid: int, folder_: str, sender: tuple[str, str], to: tuple[str, str], hours_ago: float,
             subject: str, body: str, category: str, unread: bool = False, starred: bool = False,
             reply: bool = False, score: int = 0, event: datetime | None = None) -> None:
        when = now - timedelta(hours=hours_ago)
        html_body = "".join(f"<p>{line}</p>" for line in body.split("\n") if line)
        item = {
            "id": f"{folder_}:{uid}", "uid": uid, "folder": folder_, "messageId": f"<demo-{uid}@example.com>",
            "subject": subject, "fromName": sender[0], "fromEmail": sender[1], "toName": to[0], "toEmail": to[1],
            "date": iso(when), "isReply": reply, "unread": unread, "snippet": " ".join(body.split())[:300],
            "body": body, "bodyHtml": f'<div style="font-family:sans-serif;line-height:1.6">{html_body}</div>',
            "inlineImages": [], "attachments": [], "hasAttachment": False, "bodyVersion": 3, "starred": starred,
            "category": category, "score": score, "summary": "", "info": {},
        }
        if event is not None:
            item.update(eventDate=event.replace(tzinfo=None).isoformat(timespec="minutes"), eventGuessed=True)
        mails.append(item)

    calc, phys, prog, writ = COURSES
    lms = (_t(lang, "LMS 알림", "LMS Notice"), "no-reply@example.com")
    office = (_t(lang, "체험학과 사무실", "Demo Dept. Office"), "office@example.com")
    student_team = (_t(lang, "학생팀", "Student Affairs"), "student-affairs@example.com")
    careers = (_t(lang, "진로센터", "Career Center"), "career@example.com")
    council = (_t(lang, "총학생회", "Student Council"), "council@example.com")
    it_team = (_t(lang, "정보팀", "IT Team"), "it@example.com")
    prof = lambda c: (who(c["prof"]), _mail_of(c["prof"]))  # noqa: E731
    ta = lambda c: (who(c["ta"]), _mail_of(c["ta"]))  # noqa: E731

    mail(91001, "inbox", prof(calc), you, 2, _t(lang, "[미적분학Ⅱ] 중간고사 범위 안내", "[Calculus II] Midterm coverage"),
         _t(lang,
            f"미적분학Ⅱ 수강생 여러분, 안녕하세요.\n\n중간고사는 {_md(midterm, 'ko')} 10:00, A101호에서 봅니다.\n범위는 12장~14장입니다.\n\n이몽룡 드림",
            f"Hello Calculus II class,\n\nThe midterm is on {_md(midterm, 'en')} at 10:00 in Room A101.\nCoverage: chapters 12-14.\n\nProf. Lee"),
         "수업·LMS", unread=True, starred=True, score=6, event=midterm)
    mail(91002, "inbox", lms, you, 5, _t(lang, "[LMS] 새 과제: Lab 2: Loops (프로그래밍 기초)", "[LMS] New assignment: Lab 2: Loops"),
         _t(lang, "프로그래밍 기초에 새 과제가 올라왔습니다.\n과제: Lab 2: Loops\n마감: 오늘 23:59",
            "A new assignment was posted in Introduction to Programming.\nAssignment: Lab 2: Loops\nDue: today 23:59"),
         "수업·LMS", unread=True)
    mail(91003, "inbox", office, you, 20,
         _t(lang, f"[세미나] {_md(seminar, 'ko')} 16:00 양자 컴퓨팅 입문 특강", f"[Seminar] Intro to quantum computing, {_md(seminar, 'en')} 4 PM"),
         _t(lang,
            f"양자 컴퓨팅 입문 특강을 엽니다.\n\n일시: {_md(seminar, 'ko')} 16:00\n장소: B동 대강당\n연사: 체험 연구소 연구원\n\n관심 있는 학생은 누구나 오세요.",
            f"Join our intro talk on quantum computing.\n\nDate: {_md(seminar, 'en')} 4:00 PM\nPlace: B-building main hall\nSpeaker: researcher, Demo Institute\n\nEveryone is welcome."),
         "세미나·행사", unread=True, score=6, event=seminar)
    mail(91004, "inbox", student_team, you, 26, _t(lang, "시험 기간 도서관 24시간 개방 안내", "Library open 24/7 during exams"),
         _t(lang, "중간고사 기간 동안 도서관 열람실을 24시간 엽니다.\n학생증을 꼭 가져오세요.",
            "The library reading rooms stay open 24/7 during midterms.\nPlease bring your student ID."),
         "행정·학생팀")
    mail(91005, "inbox", ta(phys), you, 28, _t(lang, "Re: 실험 보고서 3 질문", "Re: Question on Lab Report 3"),
         _t(lang, "안녕하세요.\n그래프는 손으로 그려서 사진으로 붙여도 됩니다.\n\n심청 드림",
            "Hi,\nA hand-drawn graph is fine. You can attach a photo of it.\n\nCheong (TA)"),
         "답신", reply=True)
    mail(91006, "inbox", careers, you, 46,
         _t(lang, f"[진로] {_md(career, 'ko')} 18:00 선배와의 대화 신청 안내", f"[Career] Talk with alumni, {_md(career, 'en')} 6 PM"),
         _t(lang, f"선배와의 대화를 엽니다.\n일시: {_md(career, 'ko')} 18:00\n장소: 학생회관 2층\n신청은 이번 주까지 받습니다.",
            f"Meet alumni and ask anything.\nDate: {_md(career, 'en')} 6:00 PM\nPlace: Student center, 2nd floor\nSign up by this week."),
         "취업·진로", score=5, event=career)
    mail(91007, "inbox", council, you, 70, _t(lang, "가을 축제 부스 모집", "Fall festival booths: call for teams"),
         _t(lang, "가을 축제에서 부스를 열 동아리·팀을 모집합니다.\n신청서는 학생회 게시판에 있습니다.",
            "Clubs and teams can apply to run a booth at the fall festival.\nForms are on the council board."),
         "학생회")
    mail(91008, "inbox", it_team, you, 96, _t(lang, "[알림] 비밀번호 변경 주기 안내", "[Notice] Time to change your password"),
         _t(lang, "학교 계정 비밀번호를 바꾼 지 90일이 지났습니다.\n포털에서 새 비밀번호로 바꿔 주세요.",
            "It has been 90 days since your last password change.\nPlease set a new one on the portal."),
         "계정·알림")
    mail(91009, "inbox", prof(prog), you, 74, _t(lang, "[프로그래밍 기초] 실습실 변경 안내", "[Intro to Programming] Lab room changed"),
         _t(lang, "다음 주부터 실습은 C105호에서 합니다.\n노트북을 가져오지 않아도 됩니다.\n\n장화 드림",
            "From next week, labs meet in Room C105.\nNo need to bring a laptop.\n\nProf. Jang"),
         "수업·LMS")
    mail(91010, "inbox", prof(writ), you, 120, _t(lang, "[글쓰기와 소통] 에세이 피드백 일정", "[Writing] Essay feedback schedule"),
         _t(lang, "에세이 초안을 낸 뒤 다음 주에 한 명씩 피드백 시간을 잡겠습니다.\n\n콩쥐 드림",
            "After you hand in the draft, we will book one-on-one feedback next week.\n\nProf. Kong"),
         "수업·LMS")
    mail(91011, "sent", you, ta(phys), 30, _t(lang, "실험 보고서 3 질문", "Question on Lab Report 3"),
         _t(lang, "조교님 안녕하세요.\n실험 보고서 3의 그래프를 손으로 그려도 되는지 궁금합니다.\n\n체험 학생 드림",
            "Hello,\nCan I draw the graph for Lab Report 3 by hand?\n\nDemo Student"),
         "기타")
    mail(91012, "sent", you, prof(prog), 170, _t(lang, "HW 1 제출 확인 부탁드립니다", "Please confirm my HW 1 submission"),
         _t(lang, "교수님 안녕하세요.\nHW 1을 냈는데 LMS에 제출로 보이는지 확인 부탁드립니다.\n\n체험 학생 드림",
            "Hello Professor,\nCould you check that my HW 1 shows as submitted on LMS?\n\nDemo Student"),
         "기타")
    mail(91013, "trash", ("Promo", "promo@example.com"), you, 140, _t(lang, "[광고] 오늘만 반값!", "[Ad] Half price today only!"),
         _t(lang, "체험용 광고 메일입니다.", "A sample ad mail for the demo."), "기타")
    contacts = {}
    for m in mails:
        for name, addr in ((m["fromName"], m["fromEmail"]), (m["toName"], m["toEmail"])):
            if addr != you[1]:
                contacts.setdefault(addr, {"email": addr, "name": name, "count": 0})["count"] += 1
    write("emails.json", {
        "updatedAt": naive(at(0) - timedelta(minutes=3)),
        "interests": "",
        "briefing": {"intro": "", "todo": []},
        "contacts": sorted(contacts.values(), key=lambda c: -c["count"]),
        "emails": mails,
    })

    # 학교 공지 (홈페이지 게시판 꼴). 눌러도 열 곳이 없게 주소는 비운다.
    notice_rows = [
        ("학사", "Academics", "2학기 중간고사 시간표 안내", "Fall midterm exam timetable", 1, True),
        ("장학", "Scholarships", "교내 장학금 신청 안내", "Campus scholarship applications open", 2, False),
        ("일반", "General", "시험 기간 도서관 24시간 개방", "Library open 24/7 during exams", 3, False),
        ("행사", "Events", "가을 축제 부스 모집", "Fall festival booth sign-up", 4, False),
        ("채용", "Jobs", "학생 연구원 모집", "Student researcher openings", 6, False),
        ("일반", "General", "캠퍼스 셔틀 노선 안내", "Campus shuttle routes", 8, False),
    ]
    write("notices.json", {
        "ok": True, "count": len(notice_rows), "failed": [], "fetchedAt": naive(now),
        "items": [
            {"id": f"demo-notice-{i}", "title": _t(lang, ko, en), "writer": _t(lang, "체험", "Demo"),
             "date": at(-days).strftime("%Y-%m-%d"), "hit": str(120 * (7 - i)), "pinned": pinned,
             "board": _t(lang, board_ko, board_en), "url": ""}
            for i, (board_ko, board_en, ko, en, days, pinned) in enumerate(notice_rows, start=1)
        ],
    })

    # 학교 행사 (공공데이터 꼴). 사진 주소는 비운다(바깥 그림을 불러오지 않게).
    fest = at(11)
    fair = weekday(at(4))
    write("school_events.json", {"fetchedAt": naive(now), "items": [
        {"id": "evt-demo-1", "title": _t(lang, "가을 축제", "Fall festival"), "start": fest.strftime("%Y-%m-%d"),
         "end": (fest + timedelta(days=1)).strftime("%Y-%m-%d"), "time": "", "timeText": "",
         "place": _t(lang, "대운동장", "Main field"), "host": _t(lang, "총학생회", "Student Council"), "link": "",
         "photo": "", "date": fest.strftime("%Y-%m-%d"), "body": "", "source": "세미나·행사"},
        {"id": "evt-demo-2", "title": _t(lang, "진로 박람회", "Career fair"), "start": fair.strftime("%Y-%m-%d"),
         "end": fair.strftime("%Y-%m-%d"), "time": "13:00", "timeText": "13:00~17:00",
         "place": _t(lang, "학생회관", "Student center"), "host": _t(lang, "진로센터", "Career Center"), "link": "",
         "photo": "", "date": fair.strftime("%Y-%m-%d"), "body": "", "source": "세미나·행사"},
    ]})

    # 셔틀: 지어낸 노선. 화면이 '체험용 시간표' 라고 적는다(demo: True).
    def route(group: str, kind: str, name: str, stops: list[tuple[str, str]]) -> dict[str, Any]:
        return {"group": group, "kind": kind, "days": _t(lang, "평일", "Weekdays"), "name": name,
                "stops": [{"name": s, "time": t, "via": False} for s, t in stops],
                "depart": stops[0][1], "arrive": stops[-1][1], "note": _t(lang, "체험용 예시", "Demo sample"), "extra": ""}

    loop_ = _t(lang, "캠퍼스 순환 (평일)", "Campus loop (weekdays)")
    town = _t(lang, "시내 방면 (평일)", "To town (weekdays)")
    dorm, hall, lib, station = (_t(lang, "기숙사", "Dorm"), _t(lang, "본관", "Main hall"),
                                _t(lang, "도서관", "Library"), _t(lang, "역 앞", "Station"))
    routes = [route(loop_, "순환", _t(lang, "순환", "Loop"), [(dorm, f"{h:02d}:20"), (hall, f"{h:02d}:25"), (lib, f"{h:02d}:30")])
              for h in (8, 10, 12, 14, 16, 18)]
    routes += [route(town, "통학", _t(lang, "시내", "Town"), [(hall, f"{h:02d}:10"), (station, f"{h:02d}:40")])
               for h in (7, 13, 18, 21)]
    write("shuttle.json", {"ok": True, "count": len(routes), "routes": routes, "failed": [], "source": "demo",
                           "fetchedAt": naive(now), "demo": True})

    # 학사일정: 앱에 들어 있는 공개 씨앗 그대로(받은 때를 지금으로 적어 다시 받으러 가지 않게)
    seed = (academic_seed or {}).get(str(year)) or {}
    if seed.get("events"):
        write("academic_calendar.json", {str(year): {"count": len(seed["events"]), "events": seed["events"],
                                                     "fetchedAt": naive(now)}})

    # 상태판: 방금 가져온 것처럼
    write("health.json", {
        "lastSuccess": {"emails": naive(at(0) - timedelta(minutes=3)), "deadlines": naive(at(0) - timedelta(minutes=20)),
                        "sync": naive(at(0) - timedelta(minutes=50))},
        "consecutiveFailures": 0, "failStreak": {}, "authFailed": {},
    })
    write("last_full_sync.json", {"lastFullSync": iso(at(0) - timedelta(hours=6))})


# ===== 체험 중 메일 작업 =====
# 진짜 앱은 IMAP 으로 서버에서 바꾸고 emails.json 을 고친다. 체험 중에는 emails.json 만 고친다.

def patch_mail(emails_path: Path, action: str, uid: Any, folder: str, **opts: Any) -> dict[str, Any]:
    data = json.loads(emails_path.read_text(encoding="utf-8")) if emails_path.exists() else {}
    mails = data.get("emails") if isinstance(data, dict) else None
    if not isinstance(mails, list):
        return {"ok": False, "message": "메일을 찾지 못했습니다."}
    try:
        uid = int(uid) if uid not in (None, "", "null") else None
    except (TypeError, ValueError):
        uid = None
    target = [m for m in mails if isinstance(m, dict) and (action == "mark-all-read" or m.get("uid") == uid)]
    if action == "mark-all-read":
        target = [m for m in target if m.get("folder") == folder and m.get("unread")]
    if not target:
        return {"ok": False, "message": "메일을 찾지 못했습니다."}
    message = ""
    for m in target:
        if action == "mark-read":
            m["unread"] = not bool(opts.get("seen", True))
        elif action == "mark-all-read":
            m["unread"] = False
        elif action == "star":
            m["starred"] = bool(opts.get("starred", True))
        elif action == "delete":
            if m.get("folder") == "trash" or opts.get("permanent"):
                mails.remove(m)
                message = "완전히 지웠습니다."
            else:
                m["origFolder"] = m.get("folder")
                m["folder"] = "trash"
                m["id"] = f"trash:{m['uid']}"
                message = "휴지통으로 옮겼습니다."
        elif action == "restore":
            m["folder"] = m.pop("origFolder", None) or "inbox"
            m["id"] = f"{m['folder']}:{m['uid']}"
            message = "받은 편지함으로 되돌렸습니다."
    if action == "mark-all-read":
        message = f"{len(target)}개를 읽음으로 표시했습니다."
    atomic_write_text(emails_path, json.dumps(data, ensure_ascii=False, indent=1))
    return {"ok": True, "message": message} if message else {"ok": True}
