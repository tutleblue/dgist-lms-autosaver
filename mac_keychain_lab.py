"""CI 실험용: 사설 인증서로 서명한 '다음 빌드' 가 키체인 항목을 묻지 않고 읽게 할 길이 있는지 잰다.

mac.yml '키체인 실험' 단계(workflow_dispatch 의 keychain_lab)가 smoke_test 를 거쳐 부른다
(AUTOSAVER_SMOKE_KEYCHAIN=write|droppart|addpart, AUTOSAVER_SMOKE_KEYCHAIN_METHOD, …_PARTITION).
점검용 계정 'smoke-persist' 만 쓰고 실제 설정 항목(계정 settings)은 건드리지 않는다.
읽기는 지금 앱과 같은 길(mac_keychain.persist_test('read'), 묻는 창을 막은 읽기)로 한다.

왜 실험하나
    2026-10-15 실측(실행 38617564695·38618955367): 지금 쓰는 SecKeychainAddGenericPassword 로 만든 항목은
    '믿는 앱' 이 인증서 DR 로 묶여도 접근 목록에 partition_id = 'cdhash:<만든 빌드>' 가 따로 붙어,
    같은 인증서로 서명한 다음 빌드가 -25293 으로 못 읽었다. partition 은 애플 인증서 서명이면
    'teamid:'·'apple:' 이지만 사설 인증서 서명은 cdhash 뿐이라 빌드마다 바뀐다.

재는 것
    만드는 방법(method)
        default   지금 앱과 같은 SecKeychainAddGenericPassword
        access    SecAccessCreate(믿는 앱 = 이 앱) 를 넘겨 SecKeychainItemCreateFromContent — partition 이 그래도 붙나
        owner     access + 접근 목록 고치기(change_acl) 도 이 앱(= 인증서 DR)에 맡김 — 다음 빌드가 스스로 고칠 수 있나
        allowall  access + 읽기(decrypt)를 모든 앱에 엶 — partition 이 이것도 막나 (보호 수준은 0600 파일과 비슷, 비교용)
    고치기 (묻는 창을 막고 한다. 물어야 하면 실패로 나온다)
        droppart  만든 빌드가 곧바로 partition_id 항목을 지운다
        addpart   partition 목록에 'cdhash:<…>' 를 더한다 — 옛 빌드가 다음 빌드 것을(업데이트 직전),
                  또는 새 빌드가 제 것을(처음 켤 때)
        delete    새 빌드가 못 읽는 옛 항목을 지울 수 있나 (옛 판이 값을 넘겨주고 새 판이 다시 만드는 길의 뒷정리)

CI 에서 한 번 돌고 끝나는 프로세스라 CF 객체는 대부분 놓아주지 않는다.
"""
from __future__ import annotations

import json
import plistlib
import secrets

import mac_keychain

ACCOUNT = "smoke-persist"  # mac_keychain.persist_test 와 같은 점검 항목
METHODS = ("default", "access", "owner", "allowall")
_GENP = 0x67656E70  # 'genp' kSecGenericPasswordItemClass
_SVCE, _ACCT, _LABL = 0x73766365, 0x61636374, 0x6C61626C  # 'svce' 'acct' 'labl'
_UTF8 = 0x08000100  # kCFStringEncodingUTF8

_lib = None


def _load():
    global _lib
    if _lib is not None:
        return _lib
    ctypes, sec, cf = mac_keychain._load_api()
    vp, u32, u16, i32, idx = ctypes.c_void_p, ctypes.c_uint32, ctypes.c_uint16, ctypes.c_int32, ctypes.c_long
    P = ctypes.POINTER

    def sig(lib, name, res, *args):
        fn = getattr(lib, name)
        fn.restype, fn.argtypes = res, list(args)

    class Attr(ctypes.Structure):
        _fields_ = [("tag", u32), ("length", u32), ("data", vp)]

    class AttrList(ctypes.Structure):
        _fields_ = [("count", u32), ("attr", P(Attr))]

    # arm64 는 인자 형식을 정확히 알려 줘야 값이 제자리에 들어간다 (mac_keychain._load_api 와 같은 이유)
    sig(sec, "SecAccessCreate", i32, vp, vp, P(vp))
    sig(sec, "SecTrustedApplicationCreateFromPath", i32, ctypes.c_char_p, P(vp))
    sig(sec, "SecAccessCopyACLList", i32, vp, P(vp))
    sig(sec, "SecACLCopyAuthorizations", vp, vp)
    sig(sec, "SecACLCopyContents", i32, vp, P(vp), P(vp), P(u16))
    sig(sec, "SecACLSetContents", i32, vp, vp, vp, u16)
    sig(sec, "SecACLRemove", i32, vp)
    sig(sec, "SecKeychainItemCreateFromContent", i32, u32, P(AttrList), u32, vp, vp, vp, P(vp))
    sig(sec, "SecKeychainItemCopyAccess", i32, vp, P(vp))
    sig(sec, "SecKeychainItemSetAccess", i32, vp, vp)
    sig(sec, "SecKeychainSetUserInteractionAllowed", i32, ctypes.c_ubyte)
    sig(sec, "SecCopyErrorMessageString", vp, i32, vp)
    sig(cf, "CFStringCreateWithCString", vp, vp, ctypes.c_char_p, u32)
    sig(cf, "CFStringGetLength", idx, vp)
    sig(cf, "CFStringGetMaximumSizeForEncoding", idx, idx, u32)
    sig(cf, "CFStringGetCString", ctypes.c_bool, vp, ctypes.c_char_p, idx, u32)
    sig(cf, "CFArrayCreate", vp, vp, P(vp), idx, vp)
    sig(cf, "CFArrayGetCount", idx, vp)
    sig(cf, "CFArrayGetValueAtIndex", vp, vp, idx)
    callbacks = ctypes.addressof(ctypes.c_char.in_dll(cf, "kCFTypeArrayCallBacks"))
    _lib = (ctypes, sec, cf, Attr, AttrList, callbacks)
    return _lib


def _cfstr(text: str):
    _ct, _sec, cf, *_ = _load()
    return cf.CFStringCreateWithCString(None, text.encode("utf-8"), _UTF8)


def _pystr(ref) -> str | None:
    if not ref:
        return None
    ctypes, _sec, cf, *_ = _load()
    size = cf.CFStringGetMaximumSizeForEncoding(cf.CFStringGetLength(ref), _UTF8) + 1
    buf = ctypes.create_string_buffer(size)
    if not cf.CFStringGetCString(ref, buf, size, _UTF8):
        return "?"
    return buf.value.decode("utf-8", "replace")


def _items(array) -> list:
    _ct, _sec, cf, *_ = _load()
    if not array:
        return []
    return [cf.CFArrayGetValueAtIndex(array, i) for i in range(cf.CFArrayGetCount(array))]


def _check(status: int, what: str) -> None:
    if status != 0:
        _ct, sec, *_ = _load()
        text = _pystr(sec.SecCopyErrorMessageString(status, None)) or ""
        raise mac_keychain.KeychainError(status, f"{what}: {text}")


def _acls(access) -> list[tuple]:
    """[(SecACLRef, [권한 이름], 앱 목록 CFArray 또는 None(= 모든 앱), 설명, prompt selector)]"""
    ctypes, sec, *_ = _load()
    lst = ctypes.c_void_p()
    _check(sec.SecAccessCopyACLList(access, ctypes.byref(lst)), "접근 목록 읽기")
    out = []
    for acl in _items(lst.value):
        auths = [_pystr(a) or "" for a in _items(sec.SecACLCopyAuthorizations(acl))]
        apps, desc, prompt = ctypes.c_void_p(), ctypes.c_void_p(), ctypes.c_uint16()
        _check(sec.SecACLCopyContents(acl, ctypes.byref(apps), ctypes.byref(desc), ctypes.byref(prompt)), "접근 항목 읽기")
        out.append((acl, auths, apps.value, _pystr(desc.value) or "", prompt.value))
    return out


def _has(auths: list[str], word: str) -> bool:
    """권한 이름(kSecACLAuthorization… 의 문자열 값)을 대소문자 없이 본다. 값이 예상과 조금 달라도 로그로 알 수 있게."""
    return any(word in a.lower() for a in auths)


def _partitions(desc: str) -> tuple[list[str], str] | None:
    """partition_id 항목 설명 → (목록, 꼴). security 도구처럼 {'Partitions': [...]} plist 를 16진수로 적은 꼴('hex')로
    보고, 아니면 쉼표로 이은 평문('plain')으로 본다. 둘 다 아니면 None — 원문은 로그에 남는다."""
    try:
        return [str(p) for p in plistlib.loads(bytes.fromhex(desc))["Partitions"]], "hex"
    except Exception:
        pass
    parts = [p.strip() for p in desc.split(",") if p.strip()]
    if parts and all(":" in p for p in parts):
        return parts, "plain"
    return None


def _partition_desc(parts: list[str], form: str) -> str:
    if form == "plain":
        return ",".join(parts)
    return plistlib.dumps({"Partitions": parts}, fmt=plistlib.FMT_XML).hex()


def _describe(access) -> str:
    _ct, _sec, cf, *_ = _load()
    lines = []
    for i, (_acl, auths, apps, desc, prompt) in enumerate(_acls(access)):
        names = ",".join(a.replace("ACLAuthorization", "") for a in auths)
        who = "모든 앱" if apps is None else f"앱 {cf.CFArrayGetCount(apps)}개"
        if _has(auths, "partition"):
            parsed = _partitions(desc)
            desc = f"partitions={parsed[0]} ({parsed[1]})" if parsed else f"설명 원문={desc[:160]!r}"
        lines.append(f"  [{i}] {names} · {who} · prompt=0x{prompt:x} · {desc[:120]}")
    return "\n".join(lines) or "  (항목 없음)"


def _find_item():
    """내용 없이 항목만 찾는다 (접근 허락을 묻지 않는다)."""
    ctypes, sec, *_ = _load()
    service, acct = mac_keychain._names(ACCOUNT)
    item = ctypes.c_void_p()
    _check(
        sec.SecKeychainFindGenericPassword(None, len(service), service, len(acct), acct, None, None, ctypes.byref(item)),
        "점검 항목 찾기",
    )
    return item.value


def _item_access(item):
    ctypes, sec, *_ = _load()
    access = ctypes.c_void_p()
    _check(sec.SecKeychainItemCopyAccess(item, ctypes.byref(access)), "항목 접근 목록 가져오기")
    return access.value


def write(method: str) -> str:
    """method 로 점검 항목을 만든다 (내용은 persist_test 와 같은 꼴이라 read 가 그대로 확인한다)."""
    if method not in METHODS:
        raise ValueError(f"method 는 {METHODS}: {method!r}")
    text = json.dumps({"SMOKE": "persist-" + secrets.token_hex(8)})
    if method == "default":
        mac_keychain._write_item(text, ACCOUNT)
        print("만든 항목의 접근 목록 (API):\n" + _describe(_item_access(_find_item())), flush=True)
        return "점검 항목을 남김 (default)"
    ctypes, sec, cf, Attr, AttrList, callbacks = _load()
    access = ctypes.c_void_p()
    # 믿는 앱 목록 NULL = 부른 앱(이 앱) 하나. 요구 조건은 앱의 DR (사설 인증서면 인증서에 묶임)
    _check(sec.SecAccessCreate(_cfstr(mac_keychain.SERVICE), None, ctypes.byref(access)), "SecAccessCreate")
    if method in ("owner", "allowall"):
        want = "changeacl" if method == "owner" else "decrypt"
        targets = [x for x in _acls(access.value) if _has(x[1], want)]
        if not targets:
            raise RuntimeError(f"{want} 항목을 못 찾음:\n{_describe(access.value)}")
        apps = None  # allowall: 모든 앱
        if method == "owner":
            me = ctypes.c_void_p()
            _check(sec.SecTrustedApplicationCreateFromPath(None, ctypes.byref(me)), "이 앱 신원")
            apps = cf.CFArrayCreate(None, (ctypes.c_void_p * 1)(me.value), 1, callbacks)
        for acl, _auths, _apps, desc, prompt in targets:
            _check(sec.SecACLSetContents(acl, apps, _cfstr(desc), prompt), f"{want} 앱 목록 바꾸기")
    print("넘긴 접근 목록:\n" + _describe(access.value), flush=True)
    service, acct = mac_keychain._names(ACCOUNT)
    bufs = [ctypes.create_string_buffer(b, len(b)) for b in (service, acct, service)]
    attrs = (Attr * 3)(
        *(Attr(tag, len(b.raw), ctypes.cast(b, ctypes.c_void_p)) for tag, b in zip((_SVCE, _ACCT, _LABL), bufs))
    )
    raw = text.encode("utf-8")
    data = ctypes.create_string_buffer(raw, len(raw))
    item = ctypes.c_void_p()
    _check(
        sec.SecKeychainItemCreateFromContent(
            _GENP, ctypes.byref(AttrList(3, attrs)), len(raw), data, None, access.value, ctypes.byref(item)
        ),
        "SecKeychainItemCreateFromContent",
    )
    print("만든 항목의 접근 목록 (API):\n" + _describe(_item_access(item.value)), flush=True)
    return f"점검 항목을 남김 ({method})"


def edit_partitions(phase: str, partition: str = "") -> str:
    """droppart: partition_id 항목을 지운다. addpart: partition 목록에 partition 을 더한다.
    묻는 창을 막고 한다 — 키체인 암호나 허락이 필요하면 기다리지 않고 실패한다."""
    if phase == "addpart" and not partition:
        raise ValueError("addpart 에는 더할 partition(예: cdhash:…) 이 있어야 합니다")
    ctypes, sec, *_ = _load()
    sec.SecKeychainSetUserInteractionAllowed(0)
    try:
        item = _find_item()
        access = _item_access(item)
        print("고치기 전 (API):\n" + _describe(access), flush=True)
        found = [x for x in _acls(access) if _has(x[1], "partition")]
        if not found:
            raise RuntimeError("partition_id 항목이 없습니다")
        if phase == "droppart":
            for acl, *_rest in found:
                _check(sec.SecACLRemove(acl), "partition 항목 빼기")
        else:
            acl, _auths, apps, desc, prompt = found[0]
            parsed = _partitions(desc)
            if parsed is None:
                raise RuntimeError(f"partition 설명 꼴을 모릅니다: {desc[:160]!r}")
            parts, form = parsed
            if partition in parts:
                return f"이미 들어 있음 ({partition})"
            new_desc = _cfstr(_partition_desc(parts + [partition], form))
            _check(sec.SecACLSetContents(acl, apps, new_desc, prompt), "partition 목록 고치기")
        _check(sec.SecKeychainItemSetAccess(item, access), "SecKeychainItemSetAccess")
        print("고친 뒤 (API):\n" + _describe(_item_access(item)), flush=True)
    finally:
        sec.SecKeychainSetUserInteractionAllowed(1)
    return "partition 항목을 지움" if phase == "droppart" else f"partition 에 더함 ({partition})"


def delete() -> str:
    """점검 항목을 묻는 창 없이 지운다 (못 읽는 빌드가 지울 수 있는지)."""
    _ct, sec, *_ = _load()
    sec.SecKeychainSetUserInteractionAllowed(0)
    try:
        if not mac_keychain._delete_item(ACCOUNT):
            raise RuntimeError("점검 항목이 없습니다")
    finally:
        sec.SecKeychainSetUserInteractionAllowed(1)
    return "점검 항목을 지움"
