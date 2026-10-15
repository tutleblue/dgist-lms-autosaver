"""macOS 에서 비밀 설정(비밀번호·API 키)을 로그인 키체인에 둔다.

왜 필요한가
    Windows 는 DPAPI 로 암호화한 'dpapi:…' 를 config.json 에 적는다. 맥에는 DPAPI 가 없어서
    예전 코드(web_ui.dpapi_protect)는 학교 포털 비밀번호를 config.json 에 평문으로 남겼다.
    맥에서는 값은 키체인에, config.json 에는 'keychain:<키 이름>' 표시만 남긴다.

왜 항목 하나에 모두 넣나
    키체인 항목마다 접근 허락(ACL)이 따로 있다. ad-hoc 서명이면 새 버전을 깔 때마다 서명 해시가
    바뀌어 macOS 가 '키체인 접근 허용?' 을 다시 묻는다. 사설 인증서로 서명해도 마찬가지다: '믿는 앱' 은
    인증서 DR 로 묶이지만 항목의 partition_id 가 'cdhash:<만든 빌드>' 라서 (2026-10-15 CI 실측, persist_test).
    만들 때 접근 목록을 넘겨도 partition 은 붙고, 고치려면 키체인 암호가 필요했다 (mac_keychain_lab, FEATURES.md
    'macOS 판'). 애플 팀 ID 가 있는 서명이어야 'teamid:' 로 묶여 안 묻는다. 비밀 값 다섯 개를 항목
    다섯 개로 두면 업데이트할 때마다 다섯 번 묻는다. 그래서 서비스 "Daling" · 계정 "settings"
    항목 하나에 {키: 값} JSON 을 넣는다 (묻는 것은 한 번).

왜 /usr/bin/security 가 아니라 Security.framework(ctypes) 인가
    `security add-generic-password -w <비밀번호>` 는 비밀번호가 명령줄에 실려 같은 사용자의
    `ps` 에 보인다. ctypes 로 부르면 값이 프로세스 밖으로 나가지 않고, 새 패키지도 필요 없다.
    (SecKeychain* 함수는 deprecated 지만 macOS 15 에서도 로그인 키체인에 그대로 동작한다.
     새 SecItem + Data Protection 키체인은 팀 ID 서명이 있어야 해서 ad-hoc 앱은 못 쓴다.)

앱 안 업데이트 넘겨주기 (2026-10-15)
    위 partition 때문에 새 판은 옛 항목을 못 읽고, 사용자는 업데이트마다 '키체인 암호 입력' 창을 본다. 고칠 길은 CI 로
    다 재 봤고(mac_keychain_lab) 되는 것은 '새 판이 못 읽는 옛 항목을 묻지 않고 지우기' 하나뿐이었다. 그래서 앱 안
    업데이트(updater._run_update)는 옛 판이 기억한 {키: 값} 을 데이터 폴더의 keychain-handoff.json(0600)에 적고
    (write_handoff), 새 판은 처음 키체인을 읽을 때 그 파일이 있으면 묻는 창을 막고 읽어 본다(_restore_handoff).
    못 읽으면(-25293) 옛 항목을 지우고 파일 값으로 제 항목을 다시 만든 뒤 파일을 지운다. 읽히면(업데이트가 실패해
    옛 판이 다시 켜짐) 파일만 지운다. 하루 지났거나 깨진 파일은 쓰지 않고 지운다. 대가: 업데이트하는 몇 초 동안
    같은 사용자의 프로세스가 그 파일을 읽을 수 있다. DMG 끌어 놓기·한 줄 설치는 넘겨줄 틈이 없어 예전처럼 한 번 묻는다.

읽기 빈도
    web_ui.read_config 는 요청마다 불린다. 매번 키체인을 열면 느리고, 사용자가 '거부' 를
    누른 뒤에는 묻는 창이 끝없이 뜬다. 그래서 한 번 읽은 내용은 프로세스 안에 기억하고
    (쓰는 쪽은 화면 서버 하나뿐이다), 읽기에 실패하면 RETRY_SECONDS 동안은 다시 묻지 않는다.
"""
from __future__ import annotations

import contextlib
import json
import os
import stat
import sys
import threading
import time
from pathlib import Path

PREFIX = "keychain:"
SERVICE = "Daling"
ACCOUNT = "settings"
RETRY_SECONDS = 300

_ERR_SUCCESS = 0
_ERR_NOT_FOUND = -25300  # errSecItemNotFound
# 묻는 창을 막고 읽었는데 이 빌드에 허락이 없을 때 (CI 실측은 -25293, 잠긴 키체인 등은 -25308)
_ERR_SILENT_DENIED = (-25293, -25308)

HANDOFF_NAME = "keychain-handoff.json"
HANDOFF_MAX_AGE = 24 * 3600  # 이보다 오래된 넘겨주기 파일은 쓰지 않고 지운다
_STATUS_TEXT = {
    -128: "사용자가 키체인 접근을 거부했습니다",          # errSecUserCanceled
    -25293: "키체인 암호가 맞지 않습니다",               # errSecAuthFailed
    -25308: "키체인 접근을 물어볼 수 없는 상태입니다",     # errSecInteractionNotAllowed
    -25307: "기본 키체인이 없습니다",                    # errSecNoDefaultKeychain
}

_lock = threading.Lock()
_cache: dict[str, str] | None = None
_retry_at = 0.0
_api = None
last_handoff = ""  # 넘겨주기 결과 (값은 담지 않는다, 점검·기록용)


class KeychainError(RuntimeError):
    def __init__(self, status: int, what: str = "") -> None:
        self.status = status
        text = _STATUS_TEXT.get(status, "키체인 오류")
        super().__init__(f"{text} (OSStatus {status}{', ' + what if what else ''})")


def is_marker(value: object) -> bool:
    return isinstance(value, str) and value.startswith(PREFIX)


def _load_api():
    global _api
    if _api is None:
        if sys.platform != "darwin":
            raise RuntimeError("키체인은 macOS 에서만 씁니다.")
        import ctypes

        sec = ctypes.CDLL("/System/Library/Frameworks/Security.framework/Security")
        cf = ctypes.CDLL("/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation")
        u32, vp, cp = ctypes.c_uint32, ctypes.c_void_p, ctypes.c_char_p
        # arm64 는 인자 형식을 정확히 알려 줘야 값이 제자리에 들어간다
        sec.SecKeychainFindGenericPassword.argtypes = [
            vp, u32, cp, u32, cp, ctypes.POINTER(u32), ctypes.POINTER(vp), ctypes.POINTER(vp)
        ]
        sec.SecKeychainFindGenericPassword.restype = ctypes.c_int32
        sec.SecKeychainAddGenericPassword.argtypes = [vp, u32, cp, u32, cp, u32, cp, ctypes.POINTER(vp)]
        sec.SecKeychainAddGenericPassword.restype = ctypes.c_int32
        sec.SecKeychainItemModifyAttributesAndData.argtypes = [vp, vp, u32, cp]
        sec.SecKeychainItemModifyAttributesAndData.restype = ctypes.c_int32
        sec.SecKeychainItemFreeContent.argtypes = [vp, vp]
        sec.SecKeychainItemFreeContent.restype = ctypes.c_int32
        sec.SecKeychainItemDelete.argtypes = [vp]
        sec.SecKeychainItemDelete.restype = ctypes.c_int32
        sec.SecKeychainSetUserInteractionAllowed.argtypes = [ctypes.c_ubyte]  # Boolean
        sec.SecKeychainSetUserInteractionAllowed.restype = ctypes.c_int32
        sec.SecKeychainGetUserInteractionAllowed.argtypes = [ctypes.POINTER(ctypes.c_ubyte)]
        sec.SecKeychainGetUserInteractionAllowed.restype = ctypes.c_int32
        cf.CFRelease.argtypes = [vp]
        cf.CFRelease.restype = None
        _api = (ctypes, sec, cf)
    return _api


def _names(account: str | None = None) -> tuple[bytes, bytes]:
    # 기본값을 ACCOUNT 로 묶지 않고 부를 때 읽는다: 점검(smoke_test 넘겨주기)이 ACCOUNT 를 바꿔 실제 설정 항목을 피한다
    return SERVICE.encode("utf-8"), (account or ACCOUNT).encode("utf-8")


def _read_item(account: str | None = None) -> str | None:
    """항목 내용. 항목이 없으면 None, 못 읽으면 KeychainError."""
    ctypes, sec, _cf = _load_api()
    service, acct = _names(account)
    length = ctypes.c_uint32(0)
    data = ctypes.c_void_p()
    status = sec.SecKeychainFindGenericPassword(
        None, len(service), service, len(acct), acct, ctypes.byref(length), ctypes.byref(data), None
    )
    if status == _ERR_NOT_FOUND:
        return None
    if status != _ERR_SUCCESS:
        raise KeychainError(status, "읽기")
    if not data.value:
        return ""
    try:
        return ctypes.string_at(data, length.value).decode("utf-8", "replace")
    finally:
        sec.SecKeychainItemFreeContent(None, data)


def _write_item(text: str, account: str | None = None) -> None:
    """있으면 내용만 바꾸고, 없으면 새로 만든다."""
    ctypes, sec, cf = _load_api()
    service, acct = _names(account)
    raw = text.encode("utf-8")
    item = ctypes.c_void_p()
    # 내용(비밀번호) 없이 항목만 찾으면 접근 허락을 묻지 않는다
    status = sec.SecKeychainFindGenericPassword(
        None, len(service), service, len(acct), acct, None, None, ctypes.byref(item)
    )
    if status == _ERR_SUCCESS:
        try:
            status = sec.SecKeychainItemModifyAttributesAndData(item, None, len(raw), raw)
        finally:
            cf.CFRelease(item)
    elif status == _ERR_NOT_FOUND:
        status = sec.SecKeychainAddGenericPassword(
            None, len(service), service, len(acct), acct, len(raw), raw, None
        )
    if status != _ERR_SUCCESS:
        raise KeychainError(status, "쓰기")


def _delete_item(account: str | None = None) -> bool:
    ctypes, sec, cf = _load_api()
    service, acct = _names(account)
    item = ctypes.c_void_p()
    status = sec.SecKeychainFindGenericPassword(
        None, len(service), service, len(acct), acct, None, None, ctypes.byref(item)
    )
    if status == _ERR_NOT_FOUND:
        return False
    if status != _ERR_SUCCESS:
        raise KeychainError(status, "찾기")
    try:
        status = sec.SecKeychainItemDelete(item)
    finally:
        cf.CFRelease(item)
    if status != _ERR_SUCCESS:
        raise KeychainError(status, "지우기")
    return True


def _parse(raw: str | None) -> dict[str, str]:
    data: dict[str, str] = {}
    if raw:
        try:
            parsed = json.loads(raw)
        except ValueError:
            parsed = {}
        if isinstance(parsed, dict):
            data = {str(k): str(v) for k, v in parsed.items() if isinstance(v, str)}
    return data


@contextlib.contextmanager
def _no_prompt():
    """이 안에서 키체인은 묻는 창을 띄우지 않고 실패한다. 끝나면 원래대로 (점검이 막아 둔 것을 풀지 않게)."""
    ctypes, sec, _cf = _load_api()
    before = ctypes.c_ubyte(1)
    known = sec.SecKeychainGetUserInteractionAllowed(ctypes.byref(before)) == _ERR_SUCCESS
    sec.SecKeychainSetUserInteractionAllowed(0)
    try:
        yield
    finally:
        sec.SecKeychainSetUserInteractionAllowed(before.value if known else 1)


def handoff_path() -> Path:
    """넘겨주기 파일. 데이터 폴더(~/.lms-autosaver) 에 둔다 — 옛 판과 새 판이 같이 보는 곳."""
    try:
        # runtime_config 를 불러오는 중(_load_config → 여기)이어도 AUTOSAVER_DATA_ROOT 는 이미 정해져 있다
        from runtime_config import AUTOSAVER_DATA_ROOT

        root = Path(AUTOSAVER_DATA_ROOT)
    except Exception:
        root = Path(os.environ.get("AUTOSAVER_DATA_ROOT") or Path.home() / ".lms-autosaver")
    return root / HANDOFF_NAME


def _note(text: str) -> None:
    """넘겨주기 결과를 업데이트 기록(update-mac.log)에 한 줄 남긴다. 값은 절대 적지 않는다."""
    global last_handoff
    last_handoff = text
    try:
        with open(handoff_path().with_name("update-mac.log"), "a", encoding="utf-8") as log:
            log.write(f"{time.strftime('%Y-%m-%d %H:%M:%S')} 키체인 넘겨주기: {text}\n")
    except OSError:
        pass


def _unlink(path: Path) -> None:
    try:
        path.unlink()
    except OSError:
        pass


def write_handoff() -> bool:
    """앱 안 업데이트 직전(updater._run_update): 이 프로세스가 키체인에서 읽어 기억한 {키: 값} 을 새 판에 넘길
    0600 파일로 적는다. 키체인을 아직 못 읽었으면(_cache None) 적지 않는다 — 새 판은 예전처럼 한 번 묻는다.
    값이 없어도({}) 적는다: 빈 항목이 남아 있으면 새 판이 비밀도 없는데 암호를 묻게 된다."""
    if sys.platform != "darwin":
        return False
    with _lock:
        if _cache is None:
            _note("이 판이 키체인을 읽지 않아 넘기지 않음")
            return False
        values = dict(_cache)
        path = handoff_path()
        payload = json.dumps({"v": 1, "created": time.time(), "values": values}, ensure_ascii=False).encode("utf-8")
        path.parent.mkdir(parents=True, exist_ok=True)
        # 다 쓴 뒤 이름만 바꾼다: 반쯤 쓴 파일을 새 판이 읽지 않게. 처음부터 0600 으로 만든다(umask 는 줄이기만 한다)
        tmp = path.with_name(f".{HANDOFF_NAME}.{os.getpid()}.tmp")
        _unlink(tmp)
        fd = os.open(tmp, os.O_CREAT | os.O_EXCL | os.O_WRONLY | getattr(os, "O_NOFOLLOW", 0), 0o600)
        try:
            with os.fdopen(fd, "wb") as out:
                out.write(payload)
                out.flush()
                os.fsync(out.fileno())
            os.replace(tmp, path)
        except BaseException:
            _unlink(tmp)
            raise
        _note(f"새 판에 넘길 값 {len(values)}개를 적음")
    return True


def drop_handoff() -> None:
    """업데이트를 시작하지 못했을 때 넘겨주기 파일을 지운다 (옛 판은 키체인을 그대로 읽는다)."""
    _unlink(handoff_path())


def _flock(fd: int, timeout: float = 10.0) -> bool:
    """넘겨주기 파일을 한 프로세스만 처리하게 (화면 서버와 작업 프로세스가 같이 켜질 수 있다)."""
    import fcntl

    deadline = time.monotonic() + timeout
    while True:
        try:
            fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
            return True
        except BlockingIOError:
            if time.monotonic() >= deadline:
                return False
            time.sleep(0.05)


def _read_handoff(fd: int, st: os.stat_result) -> dict[str, str] | None:
    """넘겨주기 파일의 {키: 값}. 이 사용자의 0600 파일이 아니거나, 깨졌거나, 하루 지났으면 None."""
    if not stat.S_ISREG(st.st_mode) or st.st_mode & 0o077 or st.st_uid != os.getuid() or st.st_size > 1 << 20:
        return None
    try:
        chunks = []
        while chunk := os.read(fd, 1 << 16):
            chunks.append(chunk)
        doc = json.loads(b"".join(chunks).decode("utf-8"))
        age = time.time() - float(doc["created"])
        values = doc["values"]
        version = doc.get("v")
    except Exception:
        return None
    # 시계가 조금 뒤로 간 것(몇 분)은 봐준다
    if version != 1 or not -300 <= age <= HANDOFF_MAX_AGE or not isinstance(values, dict):
        return None
    if not all(isinstance(k, str) and isinstance(v, str) for k, v in values.items()):
        return None
    return dict(values)


def _replace_item(path: Path, values: dict[str, str], delete: bool = True) -> dict[str, str] | None:
    """못 읽는 옛 항목을 지우고 넘겨받은 값으로 이 판의 항목을 새로 만든다. _no_prompt 안에서 부른다."""
    if delete:
        try:
            _delete_item()
        except KeychainError as exc:
            # 옛 항목에 값이 그대로 있다: 파일만 지우고 예전처럼 묻는다
            _unlink(path)
            _note(f"옛 항목을 지우지 못해 넘겨받지 않음 (OSStatus {exc.status})")
            return None
    try:
        _write_item(json.dumps(values, ensure_ascii=False))
        back = _read_item()
    except KeychainError as exc:
        # 옛 항목은 지웠고 값은 이 파일에만 있다: 파일을 남겨 다음 실행에서 다시 하고, 이번에는 넘겨받은 값을 쓴다
        _note(f"새 항목을 만들지 못해 파일을 남김 (OSStatus {exc.status})")
        return values
    if _parse(back) != values:
        _note("새 항목을 다시 읽은 값이 달라 파일을 남김")
        return values
    _unlink(path)
    _note(f"넘겨받아 이 판의 키체인 항목으로 다시 만듦 (값 {len(values)}개)")
    return values


def _restore_handoff() -> dict[str, str] | None:
    """옛 판이 넘겨준 값이 있으면 묻는 창 없이 이 판의 항목으로 옮긴다. _lock 을 잡은 채로 부른다.

    돌려주는 값은 기억할 {키: 값}. None 이면 넘겨받을 것이 없거나 못 했다 — 부르는 쪽이 예전처럼 읽는다(묻는다).
    """
    path = handoff_path()
    try:
        fd = os.open(path, os.O_RDONLY | getattr(os, "O_NOFOLLOW", 0))
    except FileNotFoundError:
        return None
    except OSError:
        _unlink(path)  # 링크 같은 이상한 것
        _note("넘겨주기 파일이 이상해 지움")
        return None
    try:
        if not _flock(fd):
            return None
        st = os.fstat(fd)
        if st.st_nlink == 0:
            # 기다리는 동안 다른 프로세스가 마쳤다. 새 항목은 같은 실행 파일이 만들어 예전 길로 묻지 않고 읽힌다
            return None
        values = _read_handoff(fd, st)
        if values is None:
            _unlink(path)
            _note("하루 지났거나 깨진 넘겨주기 파일을 쓰지 않고 지움")
            return None
        with _no_prompt():
            try:
                raw = _read_item()
            except KeychainError as exc:
                if exc.status not in _ERR_SILENT_DENIED:
                    _unlink(path)
                    _note(f"키체인을 읽지 못해 넘겨받지 않음 (OSStatus {exc.status})")
                    return None
                # 새 판: partition_id 가 옛 빌드라 못 읽는다 (CI 실측 -25293)
                return _replace_item(path, values)
            if raw is None and values:
                # 항목이 없다 (지난번에 지운 뒤 만들지 못함 등): 넘겨받은 값으로 만든다
                return _replace_item(path, values, delete=False)
            # 묻지 않고 읽힌다: 업데이트가 실패해 옛 판이 다시 켜졌다. 키체인이 그대로 맞다
            _unlink(path)
            _note("키체인을 그대로 읽어 넘겨주기 파일만 지움")
            return _parse(raw)
    finally:
        os.close(fd)


def _load(fresh: bool = False) -> dict[str, str]:
    """{키: 값}. _lock 을 잡은 채로 부른다."""
    global _cache, _retry_at
    if _cache is not None and not fresh:
        return _cache
    if not fresh and time.monotonic() < _retry_at:
        raise KeychainError(-25308, "방금 읽지 못해 잠시 쉼")
    try:
        handed = _restore_handoff()
    except Exception:  # 넘겨주기가 어떻게 틀려도 예전 길(묻기)은 남긴다
        handed = None
    if handed is not None:
        _cache = handed
        return handed
    try:
        raw = _read_item()
    except KeychainError:
        _retry_at = time.monotonic() + RETRY_SECONDS
        raise
    _cache = _parse(raw)
    return _cache


def protect(key: str, value: str) -> str:
    """값을 키체인에 넣고 config.json 에 적을 표시('keychain:<키>')를 돌려준다. 실패하면 KeychainError."""
    global _cache
    with _lock:
        data = dict(_load(fresh=_cache is None))
        if data.get(key) != value:
            data[key] = value
            _write_item(json.dumps(data, ensure_ascii=False))
        _cache = data
    return PREFIX + key


def unprotect(value: str) -> str:
    """'keychain:<키>' 면 키체인의 값, 아니면 그대로. 못 읽으면 빈 문자열 (DPAPI 실패와 같게)."""
    if not is_marker(value):
        return value
    key = value[len(PREFIX):]
    with _lock:
        try:
            data = _load()
        except Exception:
            return ""
    return data.get(key, "")


def forget(key: str) -> None:
    """설정에서 지운 비밀 값을 키체인에서도 뺀다.

    이 프로세스가 키체인을 한 번이라도 읽은 뒤에만 한다. 읽기를 거부당해 빈 값으로 보이던 것을
    '지웠다' 로 오해해 남은 비밀번호까지 날리면 안 된다.
    """
    global _cache
    with _lock:
        if _cache is None or key not in _cache:
            return
        data = dict(_cache)
        data.pop(key, None)
        try:
            _write_item(json.dumps(data, ensure_ascii=False))
        except Exception:
            return
        _cache = data


def self_test(account: str = "smoke-test") -> str:
    """CI 점검용: 별도 계정 이름으로 쓰기 → 읽기 → 지우기. 실제 설정 항목은 건드리지 않는다."""
    import secrets as _secrets

    secret = "점검-" + _secrets.token_hex(8)
    _write_item(json.dumps({"SMOKE": secret}, ensure_ascii=False), account)
    try:
        back = json.loads(_read_item(account) or "{}").get("SMOKE")
        if back != secret:
            raise RuntimeError("키체인에서 읽은 값이 넣은 값과 다릅니다.")
        # 이미 있는 항목 고치기도 확인한다 (설정을 다시 저장할 때 타는 길)
        _write_item(json.dumps({"SMOKE": secret + "2"}, ensure_ascii=False), account)
        if json.loads(_read_item(account) or "{}").get("SMOKE") != secret + "2":
            raise RuntimeError("키체인 항목을 고친 값이 읽히지 않습니다.")
    finally:
        _delete_item(account)
    if _read_item(account) is not None:
        raise RuntimeError("점검용 키체인 항목이 지워지지 않았습니다.")
    return "쓰기·고치기·읽기·지우기 성공"


def persist_test(phase: str, account: str = "smoke-persist") -> str:
    """CI 점검용, 두 빌드로 나눠 부른다: 'write' 는 이 빌드로 점검 항목을 남기고,
    'read' 는 같은 자리에 깐 '다음 빌드'(같은 인증서로 다시 서명) 가 묻는 창 없이 읽는지 본다.

    파일 키체인은 항목을 만든 앱의 서명 요구 조건(DR)과 partition_id 를 함께 본다. 애플 포럼
    (developer.apple.com/forums/thread/98484) 에 애플 CA 가 아닌 인증서로 서명한 앱이 업데이트 뒤
    partition_id 에 새 cdhash 가 붙으며 다시 물었다는 글이 있어, 사설 인증서로 정말 안 묻는지 잰다.
    읽을 때는 묻는 창을 띄울 수 없게 막아 둔다 — 다시 물어야 하면 기다리지 않고 -25308 로 실패한다.
    """
    import secrets as _secrets

    if phase == "write":
        _write_item(json.dumps({"SMOKE": "persist-" + _secrets.token_hex(8)}), account)
        return "점검 항목을 남김"
    if phase != "read":
        raise ValueError(f"phase 는 write·read: {phase!r}")
    ctypes, sec, _cf = _load_api()
    sec.SecKeychainSetUserInteractionAllowed.argtypes = [ctypes.c_ubyte]  # Boolean
    sec.SecKeychainSetUserInteractionAllowed.restype = ctypes.c_int32
    sec.SecKeychainSetUserInteractionAllowed(0)
    try:
        raw = _read_item(account)
    finally:
        sec.SecKeychainSetUserInteractionAllowed(1)
    if raw is None:
        raise RuntimeError("점검 항목이 없습니다 (write 단계가 안 돌았거나 다른 키체인에 썼습니다)")
    if not str(json.loads(raw or "{}").get("SMOKE", "")).startswith("persist-"):
        raise RuntimeError("점검 항목 내용이 다릅니다")
    # 지우지 않는다: '키체인 실험' 은 3판이 이어서 읽는다. CI 는 임시 키체인째 지운다
    return "다음 빌드가 묻지 않고 읽음"
