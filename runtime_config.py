"""Runtime configuration shared by the web UI and background workers.

The original project used a single project-level config.py and a single
C:\\lms-autosaver data directory.  For hosted use, the web UI launches each
user's worker process with AUTOSAVER_CONFIG_PATH and AUTOSAVER_DATA_ROOT so
their LMS credentials, Drive token, downloads, and logs stay isolated.
"""
from __future__ import annotations

import ast
import json
import os
import sys
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parent


def atomic_write_text(path: Any, text: str, encoding: str = "utf-8") -> int:
    """임시 파일에 다 쓴 뒤 한 번에 바꿔 끼운다.

    예전에는 작업 프로세스가 file_metadata.json 을 제자리에서 다시 쓰는 동안 화면 서버가
    반쯤 쓰인 파일을 읽어 JSON 오류 → '자료 0개' 로 보이고, 그 결과가 30초 캐시에 남았다
    (2026-09-24 동기화 중 '자료가 다 없어짐'). 바꿔 끼우기는 읽는 쪽이 늘 온전한 파일을 본다.
    Windows 에서는 다른 프로세스가 파일을 열고 있으면 교체가 잠깐 거절되므로 몇 번 다시 한다.
    """
    import threading
    import time

    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    tmp = target.with_name(f"{target.name}.{os.getpid()}.{threading.get_ident()}.tmp")
    with open(tmp, "w", encoding=encoding) as f:
        f.write(text)
        f.flush()
        os.fsync(f.fileno())
    for _ in range(40):
        try:
            os.replace(tmp, target)
            return len(text)
        except PermissionError:
            time.sleep(0.05)
    try:
        os.replace(tmp, target)
    except OSError:
        try:
            os.remove(tmp)
        finally:
            raise
    return len(text)


def atomic_write_json(path: Any, data: Any, **dump_kwargs: Any) -> None:
    atomic_write_text(path, json.dumps(data, **dump_kwargs))


def default_data_root() -> Path:
    """설정이 따로 없을 때의 데이터 폴더. web_ui·작업 프로세스가 모두 이것을 따른다 (둘이 어긋나면 다른 폴더를 본다).

    맥: 새로 까는 맥은 애플 표준 위치(~/Library/Application Support/Daling, 2026-10-20~). 예전 판을 쓰던 맥은
    ~/.lms-autosaver 가 이미 있으므로 그대로 쓴다 — 옮기지 않는다. 설정·메타데이터에 절대 경로가 들어 있고
    맥에서 직접 확인할 수 없어서, 옮기다 꼬이면 받은 자료·메일이 안 보이게 된다.
    그래서 어디에서도 ~/.lms-autosaver 를 새로 만들면 안 된다 (만들면 다음 실행부터 옛 자리로 돌아간다).
    """
    if os.name == "nt":
        return Path(r"C:\lms-autosaver")
    legacy = Path.home() / ".lms-autosaver"
    if sys.platform == "darwin" and not legacy.exists():
        return Path.home() / "Library" / "Application Support" / "Daling"
    return legacy


AUTOSAVER_DATA_ROOT = Path(os.environ.get("AUTOSAVER_DATA_ROOT", str(default_data_root())))
CONFIG_JSON_PATH = Path(
    os.environ.get("AUTOSAVER_CONFIG_PATH", str(AUTOSAVER_DATA_ROOT / "config.json"))
)
LEGACY_CONFIG_PATH = PROJECT_ROOT / "config.py"


def _read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8-sig"))
        return data if isinstance(data, dict) else {}
    except (OSError, json.JSONDecodeError):
        return {}


def _read_legacy_config() -> dict[str, Any]:
    if not LEGACY_CONFIG_PATH.exists():
        return {}
    try:
        tree = ast.parse(LEGACY_CONFIG_PATH.read_text(encoding="utf-8-sig"))
    except (OSError, SyntaxError):
        return {}

    values: dict[str, Any] = {}
    for node in tree.body:
        if isinstance(node, ast.Assign) and len(node.targets) == 1:
            target = node.targets[0]
            if isinstance(target, ast.Name):
                try:
                    values[target.id] = ast.literal_eval(node.value)
                except (ValueError, SyntaxError):
                    pass
    return values


DPAPI_PREFIX = "dpapi:"
# web_ui.SECRET_KEYS 와 같아야 한다. 여기서 빠지면 설정 화면이 암호화해 저장한 값을
# 작업 프로세스와 dgist_api 가 'dpapi:...' 암호문 그대로 받아 API 호출이 실패한다.
SECRET_KEYS = ("LMS_PASSWORD", "EMAIL_PASSWORD", "SCHOOL_EMAIL_PASSWORD", "GEMINI_API_KEY", "DGIST_API_KEY")


def _dpapi_unprotect(text: str) -> str:
    """설정에 저장된 DPAPI 암호문을 푼다.

    이 모듈은 크롤러/메일 리더 같은 별도 프로세스에서도 쓰이므로,
    여기서 복호하지 않으면 암호문이 그대로 비밀번호로 들어가 로그인이 실패한다.
    """
    if not isinstance(text, str) or not text.startswith(DPAPI_PREFIX):
        return text
    if os.name != "nt":
        return ""
    try:
        import base64
        import ctypes
        from ctypes import wintypes

        class BLOB(ctypes.Structure):
            _fields_ = [("cbData", wintypes.DWORD), ("pbData", ctypes.POINTER(ctypes.c_char))]

        raw = base64.b64decode(text[len(DPAPI_PREFIX) :])
        blob_in = BLOB(
            len(raw), ctypes.cast(ctypes.create_string_buffer(raw), ctypes.POINTER(ctypes.c_char))
        )
        blob_out = BLOB()
        ok = ctypes.windll.crypt32.CryptUnprotectData(
            ctypes.byref(blob_in), None, None, None, None, 0, ctypes.byref(blob_out)
        )
        if not ok:
            return ""
        data = ctypes.string_at(blob_out.pbData, blob_out.cbData)
        ctypes.windll.kernel32.LocalFree(blob_out.pbData)
        return data.decode("utf-8")
    except Exception:
        return ""


# macOS·리눅스: 설정 화면(web_ui.dpapi_protect)이 비밀 값을 키체인(리눅스는 Secret Service, 못 쓰면 0600 파일)에
# 넣고 config.json 에는 'keychain:<키>'·'secretfile:<키>' 표시만 남긴다 (secret_store).
# 여기서 풀지 않으면 작업 프로세스가 'keychain:LMS_PASSWORD' 를 비밀번호로 써서 로그인이 실패한다.
KEYCHAIN_PREFIX = "keychain:"


def _is_store_marker(value: Any) -> bool:
    try:
        import secret_store

        return secret_store.is_marker(value)
    except Exception:
        return False


def _keychain_unprotect(text: str) -> str:
    try:
        import secret_store

        return secret_store.unprotect(text)
    except Exception:
        return ""


# 작업 프로세스(--autosaver-job)가 키체인을 직접 읽지 않게, 앱 본체(web_ui.run_process)가 풀어 둔 비밀 값을
# 표준 입력 한 줄(JSON)로 넘겨준다. 맥은 업데이트마다 키체인이 다시 묻는데(FEATURES '서명 인증서'), 작업 프로세스가
# 읽으면 60분·180분마다 뒤에서 암호 창이 뜨고, '거부' 하면 빈 비밀번호로 로그인 실패가 되어 자동 재시도가 멈췄다
# (2026-10-21 맥·리눅스 점검 4번). 파이프는 두 프로세스 사이에만 있어 환경 변수·파일처럼 남이 볼 수 없다.
SECRETS_STDIN_FLAG = "AUTOSAVER_SECRETS_STDIN"


def _read_handed_secrets() -> dict[str, str] | None:
    """앱 본체가 넘긴 비밀 값. 넘겨받는 작업이 아니면 None (예전처럼 저장소에서 직접 읽는다)."""
    if os.environ.pop(SECRETS_STDIN_FLAG, "") != "1":  # 손주 프로세스(node 등)에 물려주지 않게 바로 뺀다
        return None
    try:
        line = sys.stdin.readline() if sys.stdin else ""
        data = json.loads(line) if line.strip() else {}
    except Exception:
        data = {}
    return {str(k): str(v) for k, v in data.items()} if isinstance(data, dict) else {}


_HANDED_SECRETS = _read_handed_secrets()


def _load_config() -> dict[str, Any]:
    if CONFIG_JSON_PATH.exists():
        data = _read_json(CONFIG_JSON_PATH)
    elif os.environ.get("AUTOSAVER_CONFIG_PATH") or os.environ.get(
        "AUTOSAVER_DISABLE_LEGACY_CONFIG"
    ):
        data = {}
    else:
        data = _read_legacy_config()
    for key in SECRET_KEYS:
        value = data.get(key)
        if isinstance(value, str) and value.startswith(DPAPI_PREFIX):
            data[key] = _dpapi_unprotect(value)
        elif _is_store_marker(value):  # 맥: 'keychain:' 만, 리눅스: 'keychain:'·'secretfile:', Windows: 없음
            # 넘겨받은 작업은 저장소를 아예 열지 않는다 — 본체가 못 읽은 값(빈 문자열)도 여기서 묻지 않는다
            data[key] = _HANDED_SECRETS.get(key, "") if _HANDED_SECRETS is not None else _keychain_unprotect(value)
    return data


_CONFIG = _load_config()

LMS_ID = str(_CONFIG.get("LMS_ID", ""))
LMS_PASSWORD = str(_CONFIG.get("LMS_PASSWORD", ""))
GEMINI_API_KEY = str(_CONFIG.get("GEMINI_API_KEY", ""))
# 공공데이터포털(data.go.kr) 인증키 — 개설강좌·학사일정·세미나 조회에 쓴다
DGIST_API_KEY = str(_CONFIG.get("DGIST_API_KEY", ""))
EMAIL_ADDRESS = str(_CONFIG.get("EMAIL_ADDRESS", ""))
EMAIL_PASSWORD = str(_CONFIG.get("EMAIL_PASSWORD", ""))
EMAIL_TO = str(_CONFIG.get("EMAIL_TO", EMAIL_ADDRESS))
SCHEDULE_TIME = str(_CONFIG.get("SCHEDULE_TIME", "08:00"))
SCHOOL_EMAIL = str(_CONFIG.get("SCHOOL_EMAIL", ""))
SCHOOL_EMAIL_PASSWORD = str(_CONFIG.get("SCHOOL_EMAIL_PASSWORD", ""))
SCHOOL_IMAP_HOST = str(_CONFIG.get("SCHOOL_IMAP_HOST", "mail.dgist.ac.kr"))
SCHOOL_IMAP_PORT = int(_CONFIG.get("SCHOOL_IMAP_PORT", 993))
SCHOOL_SMTP_HOST = str(_CONFIG.get("SCHOOL_SMTP_HOST", "smtp.dgist.ac.kr"))
SCHOOL_SMTP_PORT = int(_CONFIG.get("SCHOOL_SMTP_PORT", 465))
EMAIL_INTERESTS = str(_CONFIG.get("EMAIL_INTERESTS", "전공 탐색, 취업, 음악, 세미나"))


def _int_setting(key: str, default: int, low: int, high: int) -> int:
    try:
        return min(high, max(low, int(_CONFIG.get(key, default))))
    except (TypeError, ValueError):
        return default


# 메일을 이 컴퓨터에 얼마나 남길지 (설정 > 자동으로 가져오기). 예전엔 21일·폴더당 60통으로 못 박혀 있었다.
MAIL_KEEP_DAYS = _int_setting("MAIL_KEEP_DAYS", 21, 7, 730)
MAIL_KEEP_MAX = _int_setting("MAIL_KEEP_MAX", 60, 30, 2000)
LOCAL_SAVE_PATH = str(_CONFIG.get("LOCAL_SAVE_PATH", ""))
# 동기화 때 구글 드라이브에도 올릴지. 예전 설정에는 이 키가 없고, 그때는 늘 올렸다.
DRIVE_UPLOAD = _CONFIG.get("AUTO_DRIVE_UPLOAD", True) is not False
# 저장 위치 폴더 모양: lms(LMS 폴더 그대로) / flat(과목 폴더에 모아서). folder_layout.py 참고
FOLDER_LAYOUT = str(_CONFIG.get("FOLDER_LAYOUT", "lms") or "lms")
LMS_URL = str(_CONFIG.get("LMS_URL", "https://lms.dgist.ac.kr"))
LOGIN_URL = str(
    _CONFIG.get(
        "LOGIN_URL",
        "https://saml.dgist.ac.kr/authentication/idpw/idPwLogin.html?agentId=-100000&useOauth=0",
    )
)

DOWNLOAD_PATH = str(_CONFIG.get("DOWNLOAD_PATH", str(AUTOSAVER_DATA_ROOT / "downloads")))
DOWNLOADED_FILES_LOG = str(AUTOSAVER_DATA_ROOT / "downloaded_files.json")
FILE_METADATA_LOG = str(AUTOSAVER_DATA_ROOT / "file_metadata.json")
DEADLINES_LOG = str(AUTOSAVER_DATA_ROOT / "deadlines.json")
UPLOAD_SELECTION_PATH = str(AUTOSAVER_DATA_ROOT / "upload_selection.json")
LAST_SYNC_PATH = str(AUTOSAVER_DATA_ROOT / "last_sync.json")
COURSES_STATE_PATH = str(AUTOSAVER_DATA_ROOT / "courses_state.json")
# 과목별 교수·조교 (LMS 코스 사용자에서 학생을 뺀 것). 메일 받는 사람 찾기와 강의 카드에 쓴다.
COURSE_STAFF_PATH = str(AUTOSAVER_DATA_ROOT / "course_staff.json")
# 내 이름·학번·학교 메일 (LMS /users/me). 메일 쓰기의 자기소개·서명에 쓴다. 전화번호 등은 받지 않는다.
LMS_PROFILE_PATH = str(AUTOSAVER_DATA_ROOT / "lms_profile.json")

SYNC_MODE = os.environ.get("AUTOSAVER_SYNC_MODE", "fast").strip().lower()


def extract_course_label(value: Any) -> str:
    """'일반화학Ⅰ (General chemistryⅠ )_03[ 2026_1학기 ]' → 'General chemistryⅠ'."""
    text = str(value or "").strip()
    if "(" in text and ")" in text:
        inside = text.split("(", 1)[1].split(")", 1)[0].strip()
        if inside:
            return inside
    if "[" in text:
        text = text.split("[", 1)[0].strip()
    return text or "기타"


def load_upload_selection() -> dict[str, Any]:
    """과목별 Drive 업로드 선택 상태. {"courses": {label: bool}} 형식, 기본은 전체 허용."""
    data = _read_json(Path(UPLOAD_SELECTION_PATH))
    courses = data.get("courses") if isinstance(data, dict) else None
    return {"courses": courses if isinstance(courses, dict) else {}}


def course_upload_enabled(course_name: Any, selection: dict[str, Any] | None = None) -> bool:
    selection = selection if selection is not None else load_upload_selection()
    label = extract_course_label(course_name)
    return bool(selection.get("courses", {}).get(label, True))

GOOGLE_CLIENT_SECRETS_PATH = str(
    Path(
        os.environ.get(
            "AUTOSAVER_GOOGLE_CLIENT_SECRETS",
            str(default_data_root() / "credentials.json"),
        )
    )
)
GOOGLE_TOKEN_PATH = str(AUTOSAVER_DATA_ROOT / "token.json")

# 구글 권한 목록은 여기 한 곳에서만 정한다.
# Drive와 캘린더가 token.json 한 파일을 같이 쓰기 때문에, 한쪽이 자기 권한만
# 요청해서 파일을 덮어쓰면 다른 쪽 권한이 사라진다. (실제로 그래서
# 동기화를 돌릴 때마다 캘린더 권한이 날아가 학사일정 업로드가 막혔다)
GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file"
# 캘린더는 앱이 만든 보조 캘린더('DGIST 메일 일정' 등)에만 일정을 넣으므로 좁은 권한 둘이면 된다.
# app.created = 보조 캘린더 만들기와 그 안의 일정, calendarlist.readonly = 이름으로 찾기.
# 예전의 'calendar'(모든 캘린더 보기·수정·삭제)는 Google 이 민감 범위로 분류해
# 데이터 액세스 인증(시연 영상·심사)을 받아야 했다. 두 좁은 권한은 민감하지 않은 범위다
# (2026-10-13 Cloud 콘솔 범위 목록에서 자물쇠 표시 없음 확인).
GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.app.created"
GOOGLE_CALENDAR_LIST_SCOPE = "https://www.googleapis.com/auth/calendar.calendarlist.readonly"
# 예전에 연결한 사람의 token.json 에는 이 권한이 남아 있다. 그대로 계속 쓸 수 있다.
GOOGLE_LEGACY_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar"
GOOGLE_SCOPES = [GOOGLE_DRIVE_SCOPE, GOOGLE_CALENDAR_SCOPE, GOOGLE_CALENDAR_LIST_SCOPE]


def calendar_scope_granted(granted: set[str] | list[str]) -> bool:
    """토큰에 실제로 승인된 권한으로 캘린더 동기화를 할 수 있는지."""
    granted = set(granted)
    if GOOGLE_LEGACY_CALENDAR_SCOPE in granted:
        return True
    return GOOGLE_CALENDAR_SCOPE in granted and GOOGLE_CALENDAR_LIST_SCOPE in granted

PLAYWRIGHT_HEADLESS = os.environ.get("AUTOSAVER_HEADLESS", "1").lower() not in {
    "0",
    "false",
    "no",
    "off",
}

# ===== 하위 작업(새로고침·동기화) 실행 방식 =====
# 소스로 돌 때는 `python -c "..."` 로 하위 프로세스를 띄우면 된다.
# 그런데 EXE 로 묶이면 sys.executable 이 '붕어빵.exe' 라서, 같은 방식으로 부르면
# -c 가 무시된 채 앱이 통째로 다시 켜진다. (새로고침할 때마다 창이 하나씩 더 뜨고,
#  정작 크롤링은 돌지 않는다) 그래서 EXE 일 때는 이 인자를 붙여
# app.py 가 창을 띄우지 않고 작업만 하고 끝나도록 한다.
WORKER_FLAG = "--autosaver-job"


# ===== Microsoft Store 판 (MSIX, packaging/msix) =====
# MSIX 로 깐 앱은 '패키지 신원'을 갖고 돈다(작업 프로세스·node·크로미움도 물려받는다). 그 안에서는
#   - 설치 폴더(C:\Program Files\WindowsApps\…)가 읽기 전용이고
#   - 앱 안 업데이트(GitHub 설치 파일을 받아 돌리기)를 하면 Store 판과 따로 노는 두 번째 Daling 이 깔린다 → Store 가 맡는다
#   - 작업 표시줄·알림의 앱 ID 는 패키지가 정한다(<패키지 패밀리>!Daling). 우리 ID 를 따로 붙이면 다른 앱으로 보인다
# 그래서 여기서 '지금 패키지 안인가' 를 한 번 묻고 기억해 둔다 (FEATURES.md 'Microsoft Store 판').
_PACKAGE_INFO: dict[str, str] = {}


def _package_string(func_name: str) -> str:
    """kernel32 의 GetCurrentPackageFullName·GetCurrentApplicationUserModelId 값. 패키지 밖이면 빈 문자열."""
    if func_name in _PACKAGE_INFO:
        return _PACKAGE_INFO[func_name]
    value = ""
    if os.environ.get("AUTOSAVER_PRETEND_MSIX") == "1":
        # 개발 서버에서 Store 판 화면(업데이트 칸 등)을 보려고. 실제 패키지 동작은 바뀌지 않는다.
        value = "Daling.Pretend_0.0.0.0_x64__pretend" if "Package" in func_name else "Daling.Pretend_pretend!Daling"
    elif os.name == "nt":
        try:
            import ctypes

            func = getattr(ctypes.windll.kernel32, func_name)
            length = ctypes.c_uint32(0)
            # 패키지 안이면 122(버퍼 부족)와 길이를 준다. 밖이면 15700(APPMODEL_ERROR_NO_PACKAGE)
            if func(ctypes.byref(length), None) == 122 and length.value:
                buf = ctypes.create_unicode_buffer(length.value)
                if func(ctypes.byref(length), buf) == 0:
                    value = buf.value
        except (AttributeError, OSError):
            value = ""  # Windows 8 이전에는 함수가 없다
    _PACKAGE_INFO[func_name] = value
    return value


def msix_package_full_name() -> str:
    return _package_string("GetCurrentPackageFullName")


def msix_app_user_model_id() -> str:
    """패키지 안이면 '<패키지 패밀리>!Daling'. 밖이면 빈 문자열."""
    return _package_string("GetCurrentApplicationUserModelId")


def is_msix() -> bool:
    return bool(msix_package_full_name())
