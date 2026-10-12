"""리눅스에서 비밀 설정(비밀번호·API 키)을 Secret Service(GNOME 키링·KWallet)에 둔다.

왜 필요한가
    Windows 는 DPAPI('dpapi:…'), 맥은 로그인 키체인(mac_keychain.py)에 둔다. 리눅스는 예전 코드대로면 학교 포털
    비밀번호가 config.json 에 평문으로 남았다. 리눅스에서도 값은 freedesktop Secret Service 에 두고 config.json 에는
    맥과 같은 'keychain:<키>' 표시만 남긴다. web_ui·runtime_config 는 secret_store 를 거쳐 함께 푼다.

왜 secretstorage 인가
    순수 파이썬(jeepney 가 D-Bus 를 직접 말한다)이라 PyInstaller 묶음·AppImage 에서도 그대로 돈다. libsecret(gi)는
    시스템 GObject 라이브러리를 물어야 해서 묶기 어렵고, secret-tool 명령은 비밀번호가 다른 프로세스를 거친다.

왜 항목 하나에 모두 넣나
    맥과 같다. {키: 값} JSON 한 항목(속성 application=Daling, account=settings). 항목만 따로 잠그는 KWallet 에서도
    묻는 것이 한 번이다.

Secret Service 를 못 쓸 때
    키링 데몬이 없는 데스크톱(최소 설치·일부 창 관리자), D-Bus 세션이 없는 곳(ssh), 잠긴 키링을 풀지 못함(창을 닫음·
    응답 없음), 기본 키링이 없음(새로 만들면 새 키링 암호를 물어야 해서 만들지 않는다).
    이때는 '<데이터 폴더>/secrets.json' 을 이 사용자만 읽고 쓸 수 있게(0600) 만들어 넣고 config.json 에는
    'secretfile:<키>' 를 적는다. 표시가 달라서 나중에 키링이 생겨도 어디서 읽을지 헷갈리지 않고, 다음에 설정을 저장할 때
    키링이 되면 그쪽으로 옮긴다. 이 파일은 암호화되지 않는다(예전 config.json 평문보다 권한만 좁다). 그래서 이 길로 갈 때
    표준 오류에 까닭을 남긴다.

잠긴 키링 (묻는 창)
    화면 서버만 잠금 해제를 묻는다(UNLOCK_TIMEOUT 초까지 기다림). 작업 프로세스(--autosaver-job)는 묻지 않는다 — 5분마다
    도는 메일 확인이 그때마다 창을 띄우면 안 된다. 서버가 한 번 풀면 그 로그인 세션 동안은 풀려 있다.
    D-Bus 일은 따로 스레드에서 하고 정해 둔 시간까지만 기다린다. 응답 없는 키링 데몬에 화면 서버가 붙잡히지 않게.

읽기 빈도
    mac_keychain 과 같다. web_ui.read_config 는 요청마다 불리므로 한 번 읽은 내용은 프로세스 안에 기억하고
    (쓰는 쪽은 화면 서버 하나뿐이다), 읽기에 실패하면 RETRY_SECONDS 동안은 다시 묻지 않는다.
"""
from __future__ import annotations

import json
import os
import sys
import threading
import time
from pathlib import Path

PREFIX = "keychain:"
FILE_PREFIX = "secretfile:"
APPLICATION = "Daling"
ACCOUNT = "settings"
LABEL = "Daling 설정"
FILE_NAME = "secrets.json"
RETRY_SECONDS = 300
UNLOCK_TIMEOUT = 120.0  # 잠긴 키링: 사람이 암호를 넣을 시간
CALL_TIMEOUT = 30.0  # 그 밖의 D-Bus 왕복

_lock = threading.Lock()
_cache: dict[str, str] | None = None
_retry_at = 0.0
_fallback_noted = False


class SecretServiceError(RuntimeError):
    pass


def is_marker(value: object) -> bool:
    return isinstance(value, str) and value.startswith((PREFIX, FILE_PREFIX))


def _may_prompt() -> bool:
    """잠긴 키링을 풀어 달라고 물어도 되는 프로세스인지 (머리말 '잠긴 키링').

    runtime_config 를 불러 WORKER_FLAG 를 보면 안 된다 — runtime_config 가 불러오는 도중에 여기를 부른다.
    """
    argv = sys.argv or [""]
    return "--autosaver-job" not in argv and argv[0] != "-c"  # 소스 실행의 작업은 `python -c "..."`


def _run(work, timeout: float):
    """work() 를 다른 스레드에서 하고 timeout 초까지만 기다린다."""
    box: dict = {}

    def target() -> None:
        try:
            box["value"] = work()
        except BaseException as exc:  # noqa: BLE001 - 부른 쪽에서 다시 던진다
            box["error"] = exc

    thread = threading.Thread(target=target, name="secret-service", daemon=True)
    thread.start()
    thread.join(timeout)
    if thread.is_alive():
        raise SecretServiceError("키링이 응답하지 않습니다")
    if "error" in box:
        raise box["error"]
    return box.get("value")


def _with_collection(action, prompt: bool):
    """기본 키링(보통 '로그인')에서 action(collection) 을 한다. 못 하면 SecretServiceError."""

    def work():
        try:
            import secretstorage
        except Exception as exc:
            raise SecretServiceError(f"secretstorage 를 불러오지 못했습니다: {exc}") from exc
        from contextlib import closing

        try:
            with closing(secretstorage.dbus_init()) as conn:
                if not secretstorage.check_service_availability(conn):
                    raise SecretServiceError("키링 서비스(GNOME 키링·KWallet)가 없습니다")
                try:
                    collection = secretstorage.Collection(conn)  # 기본 모음 (aliases/default)
                except secretstorage.ItemNotFoundException as exc:
                    raise SecretServiceError("기본 키링이 없습니다") from exc
                if collection.is_locked():
                    if not prompt:
                        raise SecretServiceError("키링이 잠겨 있습니다")
                    try:
                        dismissed = collection.unlock(timeout=UNLOCK_TIMEOUT)
                    except TimeoutError as exc:
                        raise SecretServiceError("키링 잠금 해제를 기다리다 그만뒀습니다") from exc
                    if dismissed or collection.is_locked():
                        raise SecretServiceError("키링 잠금 해제가 취소됐습니다")
                return action(collection, prompt)
        except SecretServiceError:
            raise
        except Exception as exc:  # jeepney·secretstorage 의 여러 오류를 한 가지로
            raise SecretServiceError(f"키링 오류: {type(exc).__name__}: {exc}") from exc

    return _run(work, (UNLOCK_TIMEOUT * 2 if prompt else 0) + CALL_TIMEOUT)


def _attributes(account: str) -> dict[str, str]:
    return {"application": APPLICATION, "account": account}


def _unlock_item(item, prompt: bool) -> None:
    # 모음이 풀려 있어도 항목만 잠긴 경우가 있다 (KWallet)
    if item.is_locked():
        if not prompt or item.unlock(timeout=UNLOCK_TIMEOUT) or item.is_locked():
            raise SecretServiceError("키링 항목이 잠겨 있습니다")


def _read_item(account: str = ACCOUNT, prompt: bool | None = None) -> str | None:
    """항목 내용. 항목이 없으면 None, 못 읽으면 SecretServiceError."""

    def action(collection, prompt):
        for item in collection.search_items(_attributes(account)):
            _unlock_item(item, prompt)
            return item.get_secret().decode("utf-8", "replace")
        return None

    return _with_collection(action, _may_prompt() if prompt is None else prompt)


def _write_item(text: str, account: str = ACCOUNT, prompt: bool | None = None) -> None:
    """같은 속성의 항목이 있으면 바꾸고(replace), 없으면 새로 만든다."""
    label = LABEL if account == ACCOUNT else f"{LABEL} ({account})"

    def action(collection, _prompt):
        collection.create_item(label, _attributes(account), text.encode("utf-8"), replace=True)

    _with_collection(action, _may_prompt() if prompt is None else prompt)


def _delete_item(account: str, prompt: bool | None = None) -> bool:
    def action(collection, prompt):
        found = False
        for item in list(collection.search_items(_attributes(account))):
            _unlock_item(item, prompt)
            item.delete()
            found = True
        return found

    return bool(_with_collection(action, _may_prompt() if prompt is None else prompt))


# ---- Secret Service 를 못 쓸 때의 파일 ------------------------------------------------------------


def _data_root() -> Path:
    # 화면 서버는 AUTOSAVER_ROOT, 작업 프로세스는 AUTOSAVER_DATA_ROOT 로 같은 폴더를 받는다 (web_ui.run_process)
    for name in ("AUTOSAVER_DATA_ROOT", "AUTOSAVER_ROOT"):
        value = os.environ.get(name, "").strip()
        if value:
            return Path(value)
    return Path.home() / ".lms-autosaver"


def file_path() -> Path:
    return _data_root() / FILE_NAME


def _read_file(path: Path | None = None) -> dict[str, str]:
    """파일 내용. 없으면 빈 dict, 망가졌으면 ValueError (지웠다고 오해해 덮어쓰지 않게)."""
    path = path or file_path()
    try:
        raw = path.read_text(encoding="utf-8")
    except FileNotFoundError:
        return {}
    try:
        mode = path.stat().st_mode & 0o777
        if mode & 0o077:
            path.chmod(0o600)  # 누가 권한을 넓혀 두었으면 다시 좁힌다
    except OSError:
        pass
    data = json.loads(raw) if raw.strip() else {}
    if not isinstance(data, dict):
        raise ValueError(f"{path.name} 모양이 다릅니다")
    return {str(k): str(v) for k, v in data.items() if isinstance(v, str)}


def _write_file(data: dict[str, str], path: Path | None = None) -> None:
    """처음부터 0600 으로 만든 임시 파일에 다 쓴 뒤 바꿔 끼운다 (잠깐이라도 남이 읽을 수 있는 틈이 없게)."""
    path = path or file_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(f"{path.name}.{os.getpid()}.{threading.get_ident()}.tmp")
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(json.dumps(data, ensure_ascii=False))
            f.flush()
            os.fsync(f.fileno())
        os.chmod(tmp, 0o600)  # umask 와 상관없이
        os.replace(tmp, path)
    except BaseException:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise


def _drop_from_file(key: str) -> None:
    try:
        data = _read_file()
    except Exception:
        return
    if key in data:
        data.pop(key, None)
        try:
            _write_file(data)
        except OSError:
            pass


def _note_fallback(exc: BaseException) -> None:
    global _fallback_noted
    if _fallback_noted:
        return
    _fallback_noted = True
    try:
        print(
            f"[비밀 설정] 키링(Secret Service)을 쓸 수 없어 {file_path()} 에 둡니다 "
            f"(이 사용자만 읽기·쓰기, 0600, 암호화는 안 됨): {exc}",
            file=sys.stderr,
            flush=True,
        )
    except Exception:
        pass


# ---- secret_store 가 부르는 것 (mac_keychain 과 같은 모양) ---------------------------------------


def _load(fresh: bool = False) -> dict[str, str]:
    """키링 항목의 {키: 값}. _lock 을 잡은 채로 부른다."""
    global _cache, _retry_at
    if _cache is not None and not fresh:
        return _cache
    if not fresh and time.monotonic() < _retry_at:
        raise SecretServiceError("방금 읽지 못해 잠시 쉼")
    try:
        raw = _read_item()
    except Exception:
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
    """값을 키링(못 쓰면 0600 파일)에 넣고 config.json 에 적을 표시를 돌려준다. 파일에도 못 쓰면 예외."""
    global _cache
    with _lock:
        try:
            data = dict(_load(fresh=_cache is None))
            if data.get(key) != value:
                data[key] = value
                _write_item(json.dumps(data, ensure_ascii=False))
            _cache = data
        except Exception as exc:
            _note_fallback(exc)
            try:
                stored = _read_file()
            except ValueError:
                stored = {}  # 망가진 파일은 어차피 읽을 수 없다. 새로 쓴다
            stored[key] = value
            _write_file(stored)
            return FILE_PREFIX + key
    # 키링에 넣었으면, 예전에 키링을 못 써서 파일에 넣어 둔 같은 키는 지운다
    _drop_from_file(key)
    return PREFIX + key


def unprotect(value: str) -> str:
    """표시면 저장한 값, 아니면 그대로. 못 읽으면 빈 문자열 (DPAPI 실패와 같게)."""
    if not isinstance(value, str):
        return value
    if value.startswith(FILE_PREFIX):
        try:
            return _read_file().get(value[len(FILE_PREFIX):], "")
        except Exception:
            return ""
    if not value.startswith(PREFIX):
        return value
    key = value[len(PREFIX):]
    with _lock:
        try:
            data = _load()
        except Exception:
            return ""
    return data.get(key, "")


def forget(key: str) -> None:
    """설정에서 지운 비밀 값을 키링·파일에서도 뺀다.

    키링은 이 프로세스가 한 번이라도 읽은 뒤에만 고친다 (mac_keychain.forget 과 같은 까닭: 잠겨서 빈 값으로 보이던
    것을 '지웠다' 로 오해해 남은 비밀번호까지 날리면 안 된다). 파일은 언제든 읽을 수 있으니 바로 뺀다.
    """
    global _cache
    with _lock:
        if _cache is not None and key in _cache:
            data = dict(_cache)
            data.pop(key, None)
            try:
                _write_item(json.dumps(data, ensure_ascii=False))
                _cache = data
            except Exception:
                pass
    _drop_from_file(key)


def self_test(account: str = "smoke-test") -> str:
    """CI 점검용: 별도 계정 속성으로 쓰기 → 읽기 → 고치기 → 지우기. 실제 설정 항목은 건드리지 않는다."""
    import secrets as _secrets

    secret = "점검-" + _secrets.token_hex(8)
    _write_item(json.dumps({"SMOKE": secret}, ensure_ascii=False), account, prompt=True)
    try:
        back = json.loads(_read_item(account, prompt=True) or "{}").get("SMOKE")
        if back != secret:
            raise RuntimeError("키링에서 읽은 값이 넣은 값과 다릅니다.")
        # 이미 있는 항목 고치기도 확인한다 (설정을 다시 저장할 때 타는 길)
        _write_item(json.dumps({"SMOKE": secret + "2"}, ensure_ascii=False), account, prompt=True)
        if json.loads(_read_item(account, prompt=True) or "{}").get("SMOKE") != secret + "2":
            raise RuntimeError("키링 항목을 고친 값이 읽히지 않습니다.")
    finally:
        _delete_item(account, prompt=True)
    if _read_item(account, prompt=True) is not None:
        raise RuntimeError("점검용 키링 항목이 지워지지 않았습니다.")
    return "쓰기·고치기·읽기·지우기 성공"


def file_self_test() -> str:
    """점검용: 키링을 못 쓸 때의 파일 길 (0600 으로 생기는지, 표시로 읽히는지, 빼지는지).

    데이터 폴더의 secrets.json 을 쓰므로 빈 임시 데이터 폴더(smoke_test.prepare_env)에서만 부른다.
    """
    import secrets as _secrets

    path = file_path()
    secret = "점검-" + _secrets.token_hex(8)
    stored = _read_file(path)
    stored["SMOKE"] = secret
    _write_file(stored, path)
    mode = path.stat().st_mode & 0o777
    if mode != 0o600:
        raise RuntimeError(f"{path.name} 권한이 {oct(mode)} 입니다 (0o600 이어야)")
    if unprotect(FILE_PREFIX + "SMOKE") != secret:
        raise RuntimeError("파일에 넣은 값이 'secretfile:' 표시로 읽히지 않습니다.")
    _drop_from_file("SMOKE")
    if "SMOKE" in _read_file(path):
        raise RuntimeError("파일에서 값을 빼지 못했습니다.")
    return f"{path.name} 0600 쓰기·읽기·빼기 성공"
