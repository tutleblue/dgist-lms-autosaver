"""macOS 에서 비밀 설정(비밀번호·API 키)을 로그인 키체인에 둔다.

왜 필요한가
    Windows 는 DPAPI 로 암호화한 'dpapi:…' 를 config.json 에 적는다. 맥에는 DPAPI 가 없어서
    예전 코드(web_ui.dpapi_protect)는 학교 포털 비밀번호를 config.json 에 평문으로 남겼다.
    맥에서는 값은 키체인에, config.json 에는 'keychain:<키 이름>' 표시만 남긴다.

왜 항목 하나에 모두 넣나
    키체인 항목마다 접근 허락(ACL)이 따로 있다. ad-hoc 서명이면 새 버전을 깔 때마다 서명 해시가
    바뀌어 macOS 가 '키체인 접근 허용?' 을 다시 묻는다 (CI 는 사설 인증서가 있으면 그것으로 서명해
    서명 요구 조건을 고정한다 — mac.yml, 다음 빌드가 정말 안 묻는지는 persist_test). 비밀 값 다섯 개를 항목
    다섯 개로 두면 업데이트할 때마다 다섯 번 묻는다. 그래서 서비스 "Daling" · 계정 "settings"
    항목 하나에 {키: 값} JSON 을 넣는다 (묻는 것은 한 번).

왜 /usr/bin/security 가 아니라 Security.framework(ctypes) 인가
    `security add-generic-password -w <비밀번호>` 는 비밀번호가 명령줄에 실려 같은 사용자의
    `ps` 에 보인다. ctypes 로 부르면 값이 프로세스 밖으로 나가지 않고, 새 패키지도 필요 없다.
    (SecKeychain* 함수는 deprecated 지만 macOS 15 에서도 로그인 키체인에 그대로 동작한다.
     새 SecItem + Data Protection 키체인은 팀 ID 서명이 있어야 해서 ad-hoc 앱은 못 쓴다.)

읽기 빈도
    web_ui.read_config 는 요청마다 불린다. 매번 키체인을 열면 느리고, 사용자가 '거부' 를
    누른 뒤에는 묻는 창이 끝없이 뜬다. 그래서 한 번 읽은 내용은 프로세스 안에 기억하고
    (쓰는 쪽은 화면 서버 하나뿐이다), 읽기에 실패하면 RETRY_SECONDS 동안은 다시 묻지 않는다.
"""
from __future__ import annotations

import json
import sys
import threading
import time

PREFIX = "keychain:"
SERVICE = "Daling"
ACCOUNT = "settings"
RETRY_SECONDS = 300

_ERR_SUCCESS = 0
_ERR_NOT_FOUND = -25300  # errSecItemNotFound
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
        cf.CFRelease.argtypes = [vp]
        cf.CFRelease.restype = None
        _api = (ctypes, sec, cf)
    return _api


def _names(account: str) -> tuple[bytes, bytes]:
    return SERVICE.encode("utf-8"), account.encode("utf-8")


def _read_item(account: str = ACCOUNT) -> str | None:
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


def _write_item(text: str, account: str = ACCOUNT) -> None:
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


def _delete_item(account: str = ACCOUNT) -> bool:
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


def _load(fresh: bool = False) -> dict[str, str]:
    """{키: 값}. _lock 을 잡은 채로 부른다."""
    global _cache, _retry_at
    if _cache is not None and not fresh:
        return _cache
    if not fresh and time.monotonic() < _retry_at:
        raise KeychainError(-25308, "방금 읽지 못해 잠시 쉼")
    try:
        raw = _read_item()
    except KeychainError:
        _retry_at = time.monotonic() + RETRY_SECONDS
        raise
    data: dict[str, str] = {}
    if raw:
        try:
            parsed = json.loads(raw)
        except ValueError:
            parsed = {}
        if isinstance(parsed, dict):
            data = {str(k): str(v) for k, v in parsed.items() if isinstance(v, str)}
    _cache = data
    return data


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
    try:
        _delete_item(account)
    except KeychainError:
        pass  # 지우기 허락은 따로일 수 있다. CI 는 임시 키체인째 지운다
    return "다음 빌드가 묻지 않고 읽음"
