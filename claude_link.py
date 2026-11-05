"""Claude 연결 — Claude(웹·모바일·데스크톱)의 'Daling' 커넥터가 이 컴퓨터의 강의자료·과제 마감을 보고 정리하게 한다.

Claude 는 이 컴퓨터(localhost)에 닿을 수 없다. 그래서 Daling 이 중계 서버(cloud/daling-mcp, mcp.gudaling.dev)로
WebSocket 하나를 걸어 두고, Claude 의 도구 호출을 그 연결로 받아 여기서 처리해 답을 돌려준다.
중계 서버에는 자료가 남지 않는다. 사용자가 켰을 때만, Daling 이 떠 있는 동안만 이어진다.

- 이 컴퓨터는 처음 켤 때 만든 기기 비밀값(32바이트)으로 자기를 밝힌다. 중계 서버는 그 해시만 안다.
  비밀값은 config.json 이 아니라 claude_link.json 에 암호문(Windows DPAPI·맥 키체인)으로 둔다.
  write_config 는 아는 키만 다시 써서, config.json 에 두면 설정을 저장할 때마다 지워진다.
  같은 까닭으로 web_ui.SECRET_KEYS 에도 넣지 않는다(넣으면 save_config_dict 가 맥 키체인의 이 항목을 지운다).
- Claude 가 할 수 있는 일은 OPS 에 적은 것뿐이다. 파일 내용·메일·계정·내 컴퓨터 경로는 넘기지 않는다.
- 체험 모드에서는 끊는다(바깥 요청 0건, CLAUDE.md 26-6).
- 개발 서버와 설치된 앱이 같은 데이터 폴더를 쓰므로, 잠금 파일을 잡은 프로세스 하나만 잇는다.
  둘 다 이으면 중계 서버가 '같은 PC 의 새 연결' 로 보고 서로를 끊어 번갈아 끊긴다.
"""
from __future__ import annotations

import hashlib
import json
import os
import random
import re
import secrets
import threading
import time
import unicodedata
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import demo_mode
from runtime_config import atomic_write_text

DEFAULT_RELAY = "https://mcp.gudaling.dev"
STATE_NAME = "claude_link.json"
LOCK_NAME = "claude_link.lock"
SECRET_LABEL = "CLAUDE_LINK_SECRET"
SECRET_RE = re.compile(r"^[A-Za-z0-9_-]{43,128}$")
# 중계 서버의 'ping'→'pong' 자동 응답으로 연결이 살아 있는지 본다. 세 번 연달아 답이 없으면 다시 잇는다.
PING_SECONDS = 25
MAX_REPLY_BYTES = 1_900_000  # 중계 서버가 받는 한 메시지는 2MB 까지
MAX_MY_DEADLINES = 500

_lock = threading.RLock()
_write_lock = threading.Lock()
_wake = threading.Event()
_status: dict[str, Any] = {"connected": False, "since": None, "error": "", "thread": None, "ws": None}
_process_lock: Any = None


class LinkError(Exception):
    """Claude 에 돌려줄 오류. code 는 중계 서버가 아는 것(invalid·not_found·read_only·unsupported_op)만 문구를 옮긴다."""

    def __init__(self, code: str, message: str = "") -> None:
        super().__init__(message or code)
        self.code = code
        self.message = message


def _web_ui():
    # web_ui 가 이 모듈을 부르므로 맨 위에서 부르면 서로 물린다
    import web_ui

    return web_ui


def relay_url() -> str:
    """중계 서버 주소. 개발 때는 DALING_MCP_URL=http://localhost:8787 (wrangler dev --env local)."""
    url = (os.environ.get("DALING_MCP_URL") or DEFAULT_RELAY).strip().rstrip("/")
    if not re.match(r"^https?://[A-Za-z0-9.\-]+(:\d+)?$", url):
        return DEFAULT_RELAY
    return url


def _version() -> str:
    try:
        import updater

        return updater.local_version()
    except Exception:
        return "0.0.0"


# ===== 상태 파일 =====


def _state_path() -> Path:
    return _web_ui().AUTOSAVER_ROOT / STATE_NAME


def _load_state() -> dict[str, Any]:
    data = _web_ui().read_json(_state_path(), {})
    return data if isinstance(data, dict) else {}


def _save_state(data: dict[str, Any]) -> None:
    path = _state_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    atomic_write_text(path, json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def enabled() -> bool:
    return _load_state().get("enabled") is True


def _device_secret(create: bool) -> str:
    """기기 비밀값. 저장된 것을 풀지 못하면(맥 키체인을 아직 안 열었음) 빈 값 — 새로 만들면 기존 Claude 연결이 끊기므로 만들지 않는다."""
    ui = _web_ui()
    with _lock:
        data = _load_state()
        stored = data.get("secret")
        if isinstance(stored, str) and stored:
            value = ui.dpapi_unprotect(stored)
            return value if SECRET_RE.match(value or "") else ""
        if not create:
            return ""
        value = secrets.token_urlsafe(32)
        data["secret"] = ui.dpapi_protect(value, SECRET_LABEL)
        data["secretCreatedAt"] = ui.now_iso()
        _save_state(data)
        return value


def set_enabled(on: bool) -> dict[str, Any]:
    with _lock:
        data = _load_state()
        data["enabled"] = bool(on)
        data["changedAt"] = _web_ui().now_iso()
        _save_state(data)
    if on:
        _device_secret(create=True)
        start()
    else:
        _close_current()
    _wake.set()
    return local_status()


def _should_run() -> bool:
    return enabled() and not demo_mode.active() and not _web_ui().MULTI_USER_MODE


# ===== 연결 =====


def _hold_process_lock() -> bool:
    """이 데이터 폴더로 Claude 에 잇는 프로세스는 하나만. 프로세스가 끝나면 운영체제가 풀어 준다."""
    global _process_lock
    if _process_lock is not None:
        return True
    path = _web_ui().AUTOSAVER_ROOT / LOCK_NAME
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        handle = open(path, "a+b")
    except OSError:
        return False
    try:
        if os.name == "nt":
            import msvcrt

            handle.seek(0)
            msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
        else:
            import fcntl

            fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError:
        handle.close()
        return False
    _process_lock = handle
    return True


def start() -> None:
    """뒤에서 잇는 스레드를 띄운다. 여러 번 불러도 하나만 돈다. 꺼져 있으면 아무 데도 묻지 않고 기다리기만 한다."""
    with _lock:
        thread = _status.get("thread")
        if thread is not None and thread.is_alive():
            return
        thread = threading.Thread(target=_loop, name="claude-link", daemon=True)
        _status["thread"] = thread
        thread.start()


def _set_status(**values: Any) -> None:
    with _lock:
        _status.update(values)


def _close_current() -> None:
    with _lock:
        ws = _status.get("ws")
    if ws is not None:
        try:
            ws.close(1000, "turned off")
        except Exception:
            pass


def _loop() -> None:
    backoff = 5.0
    while True:
        _wake.clear()
        if not _should_run():
            _set_status(connected=False, error="")
            _wake.wait(30)
            continue
        if not _hold_process_lock():
            _set_status(connected=False, error="other_app")
            _wake.wait(60)
            continue
        secret = _device_secret(create=True)
        if not secret:
            _set_status(connected=False, error="secret_locked")
            _wake.wait(60)
            continue
        started = time.monotonic()
        error = ""
        try:
            _session(secret)
        except Exception as exc:  # 연결이 끊긴 까닭은 화면에 짧게만. 다시 이으면 된다.
            error = _error_code(exc)
        _set_status(connected=False, ws=None, error=error)
        if time.monotonic() - started > 120:
            backoff = 5.0
        if not _should_run():
            continue
        _wake.wait(backoff + random.uniform(0, backoff / 4))
        backoff = min(backoff * 2, 300.0)


def _error_code(exc: Exception) -> str:
    name = type(exc).__name__
    rcvd = getattr(exc, "rcvd", None)
    code = getattr(rcvd, "code", None)
    if code == 4000:
        return "replaced"
    if code in (1000, 1001, 4001):
        return ""
    response = getattr(exc, "response", None)
    status = getattr(response, "status_code", None)
    if status == 401:
        return "unauthorized"
    if status == 429:
        return "rate_limited"
    if "Timeout" in name or isinstance(exc, (OSError, ConnectionError)):
        return "offline"
    return "error"


def _ws_url() -> str:
    url = relay_url()
    return ("wss://" + url[len("https://"):] if url.startswith("https://") else "ws://" + url[len("http://"):]) + "/device/connect"


def _session(secret: str) -> None:
    from websockets.sync.client import connect

    version = _version()
    with connect(
        _ws_url(),
        additional_headers={"Authorization": f"Bearer {secret}", "X-Daling-Version": version},
        user_agent_header=f"Daling/{version}",
        open_timeout=15,
        close_timeout=5,
        ping_interval=None,  # 텍스트 'ping' 은 중계 서버가 DO 를 깨우지 않고 답한다 (protocol ping 은 쓰지 않음)
        compression=None,
        max_size=256 * 1024,  # 들어오는 것은 도구 호출뿐이라 작다
    ) as ws:
        _set_status(ws=ws, connected=True, since=_web_ui().now_iso(), error="")
        pool = ThreadPoolExecutor(max_workers=3, thread_name_prefix="claude-link-op")
        last_rx = time.monotonic()
        try:
            while True:
                if not _should_run():
                    ws.close(1000, "turned off")
                    return
                try:
                    message = ws.recv(timeout=PING_SECONDS)
                except TimeoutError:
                    if time.monotonic() - last_rx > PING_SECONDS * 3:
                        raise ConnectionError("no pong")
                    ws.send("ping")
                    continue
                last_rx = time.monotonic()
                if not isinstance(message, str) or message == "pong":
                    continue
                try:
                    msg = json.loads(message)
                except ValueError:
                    continue
                if isinstance(msg, dict) and msg.get("t") == "call" and isinstance(msg.get("id"), str):
                    pool.submit(_answer, ws, msg)
        finally:
            pool.shutdown(wait=False, cancel_futures=True)


def _answer(ws: Any, msg: dict[str, Any]) -> None:
    call_id = msg["id"][:80]
    op = str(msg.get("op") or "")
    args = msg.get("args") if isinstance(msg.get("args"), dict) else {}
    try:
        reply: dict[str, Any] = {"t": "result", "id": call_id, "ok": True, "data": dispatch(op, args)}
    except LinkError as exc:
        reply = {"t": "result", "id": call_id, "ok": False, "error": {"code": exc.code, "message": exc.message[:300]}}
    except Exception as exc:
        # 까닭은 이 컴퓨터의 로그에만. Claude 에는 '안 됐다' 만 간다 (중계 서버도 internal 문구는 옮기지 않는다)
        print(f"[claude-link] {op} 실패: {type(exc).__name__}: {str(exc)[:200]}", flush=True)
        reply = {"t": "result", "id": call_id, "ok": False, "error": {"code": "internal"}}
    text = json.dumps(reply, ensure_ascii=False, default=str)
    if len(text.encode("utf-8")) > MAX_REPLY_BYTES:
        text = json.dumps({"t": "result", "id": call_id, "ok": False, "error": {"code": "invalid", "message": "The answer was too large. Ask for fewer items."}})
    try:
        ws.send(text)
    except Exception:
        pass  # 그새 끊겼다. Claude 쪽은 중계 서버가 '꺼져 있음' 으로 답한다


# ===== Claude 가 할 수 있는 일 =====


def _workspace():
    return _web_ui().workspace_for_user("local")


def _norm(text: Any) -> str:
    # 맥에서 받은 파일 이름은 자모가 풀린(NFD) 꼴일 수 있다
    return unicodedata.normalize("NFC", str(text or "")).casefold()


def _aware_iso(value: Any) -> str | None:
    """시간대 없는 현지 시각(자료 저장 시각 등)은 이 컴퓨터의 시간대를 붙여 준다. 중계 서버가 UTC 로 잘못 읽지 않게."""
    if not value:
        return None
    try:
        when = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None
    if when.tzinfo is None:
        when = when.astimezone()
    return when.isoformat(timespec="seconds")


def _utc_iso(value: Any) -> str | None:
    if not value:
        return None
    try:
        when = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None
    if when.tzinfo is None:
        when = when.astimezone()
    return when.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def material_id(local_name: str) -> str:
    return "m_" + hashlib.sha1(local_name.encode("utf-8")).hexdigest()[:16]


def _shelf_index(workspace) -> dict[str, list[str]]:
    index: dict[str, list[str]] = {}
    for shelf in _web_ui().get_shelves(workspace)["shelves"]:
        for name in shelf["files"]:
            index.setdefault(name, []).append(shelf["id"])
    return index


def _material_out(row: dict[str, Any], shelves: dict[str, list[str]], hidden: bool = False) -> dict[str, Any]:
    local = str(row.get("localName") or "")
    return {
        "id": material_id(local),
        "name": row.get("name"),
        "course": row.get("courseLabel") or row.get("course") or "",
        "term": row.get("termLabel") or row.get("semester") or None,
        "lmsFolder": " / ".join(row.get("folderPath") or []) or None,
        "type": row.get("type"),
        "sizeBytes": row.get("size"),
        "onComputer": row.get("status") == "local",
        "savedAt": _aware_iso(row.get("savedAt")),
        "isSyllabus": bool(row.get("isSyllabus")),
        "folderIds": shelves.get(local, []),
        "hidden": hidden,
    }


def _material_rows(workspace) -> list[dict[str, Any]]:
    # 자료가 하나도 없을 때 화면이 보여 주는 샘플은 넘기지 않는다
    return [r for r in _web_ui().get_files(workspace) if r.get("source") != "sample"]


def _resolve_material(workspace, mid: str) -> tuple[str, dict[str, Any] | None]:
    """자료 id → (file_metadata 열쇠, 화면 목록의 줄). 숨긴 자료는 줄이 없다."""
    if not re.match(r"^m_[0-9a-f]{16}$", mid or ""):
        raise LinkError("invalid", "Material ids look like 'm_' + 16 hex digits.")
    for row in _material_rows(workspace):
        if material_id(str(row.get("localName") or "")) == mid:
            return str(row["localName"]), row
    metadata = _web_ui().read_json(workspace.file_metadata_log, {})
    if isinstance(metadata, dict):
        for name in metadata:
            if material_id(str(name)) == mid:
                return str(name), None
    raise LinkError("not_found", "No material with that id. Use list_materials or search_materials.")


def _hidden_material_out(workspace, local: str, shelves: dict[str, list[str]]) -> dict[str, Any]:
    ui = _web_ui()
    metadata = ui.read_json(workspace.file_metadata_log, {})
    meta = metadata.get(local) if isinstance(metadata, dict) else None
    meta = meta if isinstance(meta, dict) else {}
    course = str(meta.get("course") or "")
    return {
        "id": material_id(local),
        "name": str(meta.get("original_name") or local),
        "course": ui.extract_course_label(course) if course else "",
        "lmsFolder": " / ".join(str(p) for p in (meta.get("folder_path") or []) if str(p).strip()) or None,
        "folderIds": shelves.get(local, []),
        "hidden": True,
    }


def _page(items: list[Any], offset: int, limit: int) -> dict[str, Any]:
    return {"total": len(items), "items": items[offset: offset + limit]}


def _int(value: Any, default: int, low: int, high: int) -> int:
    try:
        return max(low, min(high, int(value)))
    except (TypeError, ValueError):
        return default


def op_materials_list(args: dict[str, Any]) -> dict[str, Any]:
    workspace = _workspace()
    course = _norm(args.get("course"))[:100]
    folder = _norm(args.get("folder"))[:100]
    only_local = args.get("downloadedOnly") is True
    rows = []
    for row in _material_rows(workspace):
        if course and course not in _norm(row.get("courseLabel")) and course not in _norm(row.get("course")):
            continue
        if folder and folder not in _norm(" / ".join(row.get("folderPath") or [])):
            continue
        if only_local and row.get("status") != "local":
            continue
        rows.append(row)
    shelves = _shelf_index(workspace)
    page = _page(rows, _int(args.get("offset"), 0, 0, 10_000), _int(args.get("limit"), 20, 1, 50))
    page["items"] = [_material_out(r, shelves) for r in page["items"]]
    return page


def op_materials_search(args: dict[str, Any]) -> dict[str, Any]:
    workspace = _workspace()
    words = [w for w in _norm(args.get("query"))[:100].split() if w]
    if not words:
        raise LinkError("invalid", "query must not be empty.")
    course = _norm(args.get("course"))[:100]
    hits = []
    for row in _material_rows(workspace):
        if course and course not in _norm(row.get("courseLabel")) and course not in _norm(row.get("course")):
            continue
        hay = " ".join(
            [_norm(row.get("name")), _norm(row.get("courseLabel")), _norm(row.get("course")),
             _norm(" / ".join(row.get("folderPath") or []))]
        )
        if all(w in hay for w in words):
            hits.append(row)
    shelves = _shelf_index(workspace)
    page = _page(hits, 0, _int(args.get("limit"), 20, 1, 50))
    page["items"] = [_material_out(r, shelves) for r in page["items"]]
    return page


def op_materials_get(args: dict[str, Any]) -> dict[str, Any]:
    workspace = _workspace()
    local, row = _resolve_material(workspace, str(args.get("id") or ""))
    shelves = _shelf_index(workspace)
    return _material_out(row, shelves) if row else _hidden_material_out(workspace, local, shelves)


def op_materials_update(args: dict[str, Any]) -> dict[str, Any]:
    ui = _web_ui()
    workspace = _workspace()
    add = [str(x) for x in (args.get("addToFolders") or []) if str(x).strip()][:20]
    remove = [str(x) for x in (args.get("removeFromFolders") or []) if str(x).strip()][:20]
    hidden = args.get("hidden")
    if hidden is not None and not isinstance(hidden, bool):
        raise LinkError("invalid", "hidden must be true or false.")
    with _write_lock:
        local, _row = _resolve_material(workspace, str(args.get("id") or ""))
        if add or remove:
            shelves = ui.get_shelves(workspace)["shelves"]
            known = {s["id"] for s in shelves}
            unknown = [f for f in add + remove if f not in known]
            if unknown:
                raise LinkError("invalid", f"No folder with id {unknown[0]!r}. Use list_folders.")
            for shelf in shelves:
                if shelf["id"] in add and local not in shelf["files"]:
                    if len(shelf["files"]) >= 500:
                        raise LinkError("invalid", f"The folder {shelf['name']!r} is full (500 materials).")
                    shelf["files"].append(local)
                if shelf["id"] in remove:
                    shelf["files"] = [f for f in shelf["files"] if f != local]
            ui.save_shelves(workspace, {"shelves": shelves})
        if hidden is not None:
            selection = ui.get_upload_selection(workspace)
            files = set(selection.get("hiddenFiles") or [])
            files.add(local) if hidden else files.discard(local)
            selection["hiddenFiles"] = sorted(files)
            ui.save_upload_selection(workspace, selection)
        ui.note_outside_change()
    return op_materials_get({"id": args.get("id")})


def op_folders_list(_args: dict[str, Any]) -> dict[str, Any]:
    shelves = _web_ui().get_shelves(_workspace())["shelves"]
    return {"folders": [{"id": s["id"], "name": s["name"], "materialCount": len(s["files"])} for s in shelves]}


def op_folders_create(args: dict[str, Any]) -> dict[str, Any]:
    ui = _web_ui()
    workspace = _workspace()
    name = str(args.get("name") or "").strip()[:60]
    if not name:
        raise LinkError("invalid", "Give the folder a name.")
    with _write_lock:
        shelves = ui.get_shelves(workspace)["shelves"]
        if len(shelves) >= 60:
            raise LinkError("invalid", "Daling allows up to 60 folders. Remove one in the app first.")
        shelf = {"id": f"shelf-{secrets.token_hex(5)}", "name": name, "files": [], "courses": []}
        ui.save_shelves(workspace, {"shelves": [*shelves, shelf]})
        ui.note_outside_change()
    return {"id": shelf["id"], "name": name, "materialCount": 0}


# ----- 마감 -----


def _lms_id(item: dict[str, Any]) -> str:
    course_id = re.sub(r"[^A-Za-z0-9_.-]", "", str(item.get("courseId") or ""))[:60]
    column_id = re.sub(r"[^A-Za-z0-9_.-]", "", str(item.get("columnId") or ""))[:60]
    if course_id and column_id:
        return f"lms:{course_id}:{column_id}"
    return "lms:k" + hashlib.sha1(_web_ui().deadline_key(item).encode("utf-8")).hexdigest()[:16]


def _deadline_id(item: dict[str, Any]) -> str:
    return str(item.get("id")) if item.get("source") == "manual" else _lms_id(item)


def _deadline_out(item: dict[str, Any], hidden: bool) -> dict[str, Any]:
    manual = item.get("source") == "manual"
    out = {
        "id": _deadline_id(item),
        "source": "manual" if manual else "lms",
        "title": item.get("name") or "",
        "course": item.get("courseLabel") or item.get("course") or "",
        "due": _utc_iso(item.get("due")),
        "myStatus": item.get("myStatus"),
        "hidden": hidden,
    }
    if manual:
        out["note"] = item.get("note") or ""
    else:
        out["myScore"] = item.get("myScore")
        out["pointsPossible"] = item.get("pointsPossible")
    return out


def _all_deadlines(workspace) -> list[tuple[dict[str, Any], bool]]:
    data = _web_ui().get_deadlines(workspace, with_hidden=True)
    return [(i, False) for i in data.get("items", [])] + [(i, True) for i in data.get("hiddenItems", [])]


def _find_deadline(workspace, did: str) -> tuple[dict[str, Any], bool]:
    for item, hidden in _all_deadlines(workspace):
        if _deadline_id(item) == did:
            return item, hidden
    raise LinkError("not_found", "No deadline with that id. Use list_deadlines to find it.")


def op_deadlines_list(args: dict[str, Any]) -> dict[str, Any]:
    workspace = _workspace()
    data = _web_ui().get_deadlines(workspace, with_hidden=True)
    items = [_deadline_out(i, False) for i in data.get("items", [])]
    if args.get("includeHidden") is True:
        items += [_deadline_out(i, True) for i in data.get("hiddenItems", [])]
    return {"updatedAt": _aware_iso(data.get("updatedAt")), "items": items}


def _clean_text(value: Any, limit: int, field: str, required: bool = False) -> str:
    text = str(value or "").strip()
    if required and not text:
        raise LinkError("invalid", f"{field} must not be empty.")
    if len(text) > limit:
        raise LinkError("invalid", f"{field} is too long (max {limit} characters).")
    return text


def _clean_due(value: Any) -> str:
    due = _utc_iso(value)
    if not due:
        raise LinkError("invalid", "due must be an ISO 8601 date-time.")
    return due


def op_deadlines_create(args: dict[str, Any]) -> dict[str, Any]:
    ui = _web_ui()
    workspace = _workspace()
    entry = {
        "id": f"my:{secrets.token_hex(8)}",
        "title": _clean_text(args.get("title"), 200, "title", required=True),
        "course": _clean_text(args.get("course"), 100, "course"),
        "due": _clean_due(args.get("due")),
        "note": _clean_text(args.get("note"), 1000, "note"),
        "done": False,
        "by": "claude",
        "createdAt": ui.now_iso(),
        "updatedAt": ui.now_iso(),
    }
    with _write_lock:
        items = ui.get_my_deadlines(workspace)
        if len(items) >= MAX_MY_DEADLINES:
            raise LinkError("invalid", f"Daling keeps up to {MAX_MY_DEADLINES} of the user's own deadlines.")
        ui.save_my_deadlines(workspace, [*items, entry])
        ui.note_outside_change()
    return _deadline_out(ui.manual_deadline_item(entry), False)


def _change_manual(did: str, change) -> dict[str, Any]:
    """내 마감 하나를 고친다. 숨겨 둔 것이면 숨김 열쇠(과목|제목|마감)도 새 값으로 옮긴다 — 안 옮기면 고치는 순간 다시 보인다."""
    ui = _web_ui()
    workspace = _workspace()
    if not did.startswith("my:"):
        raise LinkError("read_only", "Only deadlines the user added ('my:' ids) can be changed here.")
    with _write_lock:
        items = ui.get_my_deadlines(workspace)
        entry = next((e for e in items if e.get("id") == did), None)
        if entry is None:
            raise LinkError("not_found", "No deadline with that id. Use list_deadlines to find it.")
        old_key = ui.deadline_key(ui.manual_deadline_item(entry))
        change(entry)
        entry["updatedAt"] = ui.now_iso()
        new_key = ui.deadline_key(ui.manual_deadline_item(entry))
        selection = ui.get_upload_selection(workspace)
        hidden_keys = set(selection.get("hiddenDeadlines") or [])
        hidden = old_key in hidden_keys
        ui.save_my_deadlines(workspace, items)
        if hidden and new_key != old_key:
            hidden_keys.discard(old_key)
            hidden_keys.add(new_key)
            selection["hiddenDeadlines"] = sorted(hidden_keys)
            ui.save_upload_selection(workspace, selection)
        ui.note_outside_change()
    return _deadline_out(ui.manual_deadline_item(entry), hidden)


def op_deadlines_update(args: dict[str, Any]) -> dict[str, Any]:
    fields: dict[str, Any] = {}
    if "title" in args:
        fields["title"] = _clean_text(args.get("title"), 200, "title", required=True)
    if "course" in args:
        fields["course"] = _clean_text(args.get("course"), 100, "course")
    if "note" in args:
        fields["note"] = _clean_text(args.get("note"), 1000, "note")
    if "due" in args:
        fields["due"] = _clean_due(args.get("due"))
    if not fields:
        raise LinkError("invalid", "Give at least one field to change.")
    return _change_manual(str(args.get("id") or ""), lambda entry: entry.update(fields))


def op_deadlines_complete(args: dict[str, Any]) -> dict[str, Any]:
    done = args.get("done", True)
    if not isinstance(done, bool):
        raise LinkError("invalid", "done must be true or false.")
    return _change_manual(str(args.get("id") or ""), lambda entry: entry.update(done=done))


def op_deadlines_hide(args: dict[str, Any]) -> dict[str, Any]:
    """지우기 = 숨기기. 화면의 휴지통 단추와 같은 목록(hiddenDeadlines)을 써서 앱의 '숨긴 과제'에서 되돌릴 수 있다."""
    ui = _web_ui()
    workspace = _workspace()
    hidden = args.get("hidden")
    if not isinstance(hidden, bool):
        raise LinkError("invalid", "hidden must be true or false.")
    with _write_lock:
        item, _was_hidden = _find_deadline(workspace, str(args.get("id") or ""))
        key = ui.deadline_key(item)
        selection = ui.get_upload_selection(workspace)
        keys = set(selection.get("hiddenDeadlines") or [])
        keys.add(key) if hidden else keys.discard(key)
        selection["hiddenDeadlines"] = sorted(keys)
        ui.save_upload_selection(workspace, selection)
        ui.note_outside_change()
    return _deadline_out(item, hidden)


OPS = {
    "ping": lambda _args: {"pong": True, "version": _version()},
    "materials.list": op_materials_list,
    "materials.search": op_materials_search,
    "materials.get": op_materials_get,
    "materials.update": op_materials_update,
    "folders.list": op_folders_list,
    "folders.create": op_folders_create,
    "deadlines.list": op_deadlines_list,
    "deadlines.create": op_deadlines_create,
    "deadlines.update": op_deadlines_update,
    "deadlines.complete": op_deadlines_complete,
    "deadlines.hide": op_deadlines_hide,
}


def dispatch(op: str, args: dict[str, Any]) -> Any:
    handler = OPS.get(op)
    if handler is None:
        raise LinkError("unsupported_op")
    if demo_mode.active():
        # 연결은 체험을 켤 때 끊기지만, 그 사이에 온 호출이 체험 자료를 보지 않게
        raise LinkError("device_offline")
    return handler(args)


# ===== 화면(설정 → Claude 연결)이 부르는 것 =====


def _relay_call(method: str, path: str, body: dict[str, Any] | None = None) -> dict[str, Any]:
    secret = _device_secret(create=True)
    if not secret:
        raise LinkError("secret_locked", "기기 열쇠를 읽지 못했어요. 잠시 뒤에 다시 해 주세요.")
    data = json.dumps(body).encode("utf-8") if body is not None else None
    request = urllib.request.Request(
        relay_url() + path,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {secret}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": f"Daling/{_version()}",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return json.loads(response.read().decode("utf-8") or "{}")
    except urllib.error.HTTPError as exc:
        if exc.code == 429:
            raise LinkError("rate_limited", "잠깐 너무 자주 눌렀어요. 1분 뒤에 다시 해 주세요.") from None
        raise LinkError("relay_error", "연결 서버가 요청을 받지 않았어요. 잠시 뒤에 다시 해 주세요.") from None
    except (urllib.error.URLError, OSError, ValueError):
        raise LinkError("relay_unreachable", "연결 서버에 닿지 않아요. 인터넷 연결을 확인해 주세요.") from None


def local_status() -> dict[str, Any]:
    with _lock:
        status = {k: _status.get(k) for k in ("connected", "since", "error")}
    return {
        "enabled": enabled(),
        "demo": demo_mode.active(),
        "connectorUrl": relay_url() + "/mcp",
        **status,
    }


def status() -> dict[str, Any]:
    """설정 화면용. 켜 두었을 때만 중계 서버에 연결된 Claude 목록을 묻는다(꺼 두면 바깥에 아무것도 묻지 않는다)."""
    out = local_status()
    out["grants"] = []
    if out["enabled"] and not out["demo"]:
        try:
            remote = _relay_call("GET", "/device/status")
            out["grants"] = [
                {
                    "id": str(g.get("id") or ""),
                    "clientName": str(g.get("clientName") or "Claude")[:80],
                    "canWrite": bool(g.get("canWrite")),
                    "createdAt": g.get("createdAt"),
                }
                for g in (remote.get("grants") or [])
                if isinstance(g, dict)
            ]
        except LinkError as exc:
            out["grantsError"] = exc.message
    return out


def pair() -> dict[str, Any]:
    if not enabled():
        raise LinkError("disabled", "먼저 'Claude 에서 보기'를 켜 주세요.")
    start()
    _wake.set()
    data = _relay_call("POST", "/device/pair")
    return {"code": data.get("code"), "expiresAt": data.get("expiresAt"), "connectorUrl": relay_url() + "/mcp"}


def revoke(grant_id: str | None = None, all_grants: bool = False) -> dict[str, Any]:
    body: dict[str, Any] = {"all": True} if all_grants else {"grantId": str(grant_id or "")[:200]}
    data = _relay_call("POST", "/device/revoke", body)
    return {"revoked": int(data.get("revoked") or 0)}


def wake() -> None:
    """설정·체험 모드가 바뀌었을 때. 지금 연결을 끊어야 하면 끊고, 기다리던 스레드를 깨운다."""
    if not _should_run():
        _close_current()
    _wake.set()
