"""비밀 설정을 운영체제 저장소에 두는 곳을 하나로 모은다 (Windows 는 DPAPI 라 여기를 쓰지 않는다).

    맥     mac_keychain   로그인 키체인                         config.json 에 'keychain:<키>'
    리눅스  linux_secrets  Secret Service(GNOME 키링·KWallet)     'keychain:<키>'
                          못 쓰면 <데이터 폴더>/secrets.json(0600)  'secretfile:<키>'

왜 한 곳으로 모으나
    화면 서버(web_ui.read_config·save_config_dict)와 작업 프로세스(runtime_config._load_config)가 같은 표시를 같은
    함수로 풀어야 한다. 한쪽만 풀면 작업 프로세스가 'keychain:LMS_PASSWORD' 같은 표시를 비밀번호로 써서 로그인이
    실패한다 (CLAUDE.md 5). 맥 동작은 예전과 같다 — 맥에서는 그대로 mac_keychain 을 부른다.
"""
from __future__ import annotations

import sys

KEYCHAIN_PREFIX = "keychain:"
FILE_PREFIX = "secretfile:"


def _is_linux() -> bool:
    return sys.platform.startswith("linux")


def supported() -> bool:
    """이 운영체제에 비밀 저장소 길이 있는지 (Windows 는 DPAPI 를 따로 쓴다)."""
    return sys.platform == "darwin" or _is_linux()


def prefixes() -> tuple[str, ...]:
    """config.json 에 적히는 표시들. Windows 는 없음."""
    if sys.platform == "darwin":
        return (KEYCHAIN_PREFIX,)
    if _is_linux():
        return (KEYCHAIN_PREFIX, FILE_PREFIX)
    return ()


def is_marker(value: object) -> bool:
    return isinstance(value, str) and bool(prefixes()) and value.startswith(prefixes())


def _backend():
    if sys.platform == "darwin":
        import mac_keychain

        return mac_keychain
    if _is_linux():
        import linux_secrets

        return linux_secrets
    raise RuntimeError("이 운영체제에는 비밀 저장소 길이 없습니다 (Windows 는 DPAPI).")


def protect(key: str, value: str) -> str:
    """값을 저장소에 넣고 config.json 에 적을 표시를 돌려준다. 실패하면 예외 (부르는 쪽이 평문을 남긴다)."""
    return _backend().protect(key, value)


def unprotect(value: str) -> str:
    """표시면 저장소의 값, 아니면 그대로. 못 읽으면 빈 문자열."""
    if not is_marker(value):
        return value
    return _backend().unprotect(value)


def forget(key: str) -> None:
    """설정에서 지운 비밀 값을 저장소에서도 뺀다."""
    _backend().forget(key)


def self_test() -> str:
    """CI 점검용 왕복 (실제 설정 항목은 건드리지 않는다)."""
    return _backend().self_test()
