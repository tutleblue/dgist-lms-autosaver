"""구글 캘린더 동기화.

메일에서 뽑아낸 일정을 사용자의 구글 캘린더 안에 전용 캘린더(카테고리)를 만들어
자동으로 올린다. 같은 메일은 여러 번 올려도 중복되지 않도록
extendedProperties에 고유 키를 심어 upsert 방식으로 동작한다.
"""
from __future__ import annotations

import datetime as _dt
import hashlib
import json
import threading
from pathlib import Path
from typing import Any, Iterable

from runtime_config import (
    GOOGLE_CLIENT_SECRETS_PATH,
    GOOGLE_SCOPES,
    GOOGLE_TOKEN_PATH,
    atomic_write_text,
    calendar_scope_granted,
)

# Drive와 Calendar를 함께 쓰므로 권한 목록은 runtime_config 한 곳에서 가져온다.
SCOPES = list(GOOGLE_SCOPES)

DEFAULT_CALENDAR_NAME = "DGIST 메일 일정"
TIMEZONE = "Asia/Seoul"
# 이 앱이 만든 일정임을 표시하는 키 (다른 일정과 섞이지 않도록)
_TAG = "dgist-autosaver"


def _credentials(token_path: str | None = None):
    """저장된 토큰으로 Credentials를 만든다. 만료 시 자동 갱신."""
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials

    path = str(token_path or GOOGLE_TOKEN_PATH)
    # 파일에 실제로 승인된 권한 그대로 읽는다. SCOPES 를 넘기면 갱신할 때 그 권한을 달라고
    # 요청하는데, 예전 토큰(전체 'calendar')에 없는 좁은 권한을 달라고 하면 invalid_scope 로 실패한다.
    creds = Credentials.from_authorized_user_file(path)
    if not creds.valid:
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            with open(path, "w", encoding="utf-8") as fp:
                fp.write(creds.to_json())
        else:
            raise RuntimeError("구글 인증이 만료되었습니다. 설정에서 다시 연결해 주세요.")
    return creds


def get_calendar_service(token_path: str | None = None):
    from googleapiclient.discovery import build

    return build("calendar", "v3", credentials=_credentials(token_path), cache_discovery=False)


def granted_scopes(token_path: str | None = None) -> set[str]:
    """토큰 파일에 '실제로 승인된' 스코프를 읽는다.

    주의: Credentials.from_authorized_user_file(path, SCOPES)로 읽으면
    creds.scopes가 '요청한' 스코프를 그대로 돌려주기 때문에
    권한 보유 여부 판단에 쓸 수 없다. 반드시 파일을 직접 봐야 한다.
    """
    import json

    path = str(token_path or GOOGLE_TOKEN_PATH)
    try:
        with open(path, encoding="utf-8") as fp:
            data = json.load(fp)
        if isinstance(data, dict):
            return {str(s) for s in (data.get("scopes") or [])}
    except Exception:
        pass
    return set()


def has_calendar_scope(token_path: str | None = None) -> bool:
    """토큰이 캘린더 권한까지 가지고 있는지 확인 (없으면 재연결 필요).

    새 토큰은 좁은 권한 둘(app.created + calendarlist.readonly), 예전 토큰은 전체 'calendar'.
    """
    return calendar_scope_granted(granted_scopes(token_path))


def _saved_calendars_path(token_path: str | None) -> Path:
    return Path(str(token_path or GOOGLE_TOKEN_PATH)).with_name("gcal_calendars.json")


def _load_saved_calendars(token_path: str | None) -> dict[str, str]:
    try:
        data = json.loads(_saved_calendars_path(token_path).read_text(encoding="utf-8"))
        return {str(k): str(v) for k, v in data.items()} if isinstance(data, dict) else {}
    except Exception:
        return {}


# '지금 넣기'(메일 일정)와 '학사일정도 넣기' 를 연달아 누르면 두 요청이 동시에 돈다(ThreadingHTTPServer).
# 둘 다 gcal_calendars.json 을 읽고 고쳐 쓰므로 늦게 쓴 쪽이 먼저 쓴 쪽의 기록을 지웠다(리뷰 지적).
# 찾기·만들기·기록을 통째로 한 번에 하나만 한다. 같은 이름 캘린더를 둘이 동시에 만드는 일도 막는다.
# 자물쇠는 기록 파일(=토큰, 사용자)마다 따로 둔다. 하나로 두면 공유 웹 모드에서 다른 사용자의 동기화까지
# Google 응답을 기다리며 줄을 섰다(리뷰 지적).
_calendar_locks: dict[str, threading.RLock] = {}
_calendar_locks_guard = threading.Lock()


def _calendar_lock(token_path: str | None) -> threading.RLock:
    key = str(_saved_calendars_path(token_path).resolve())
    with _calendar_locks_guard:
        lock = _calendar_locks.get(key)
        if lock is None:
            lock = _calendar_locks[key] = threading.RLock()
        return lock


def _save_calendar_id(token_path: str | None, name: str, calendar_id: str) -> None:
    with _calendar_lock(token_path):
        saved = _load_saved_calendars(token_path)
        if saved.get(name) == calendar_id:
            return
        saved[name] = calendar_id
        try:
            atomic_write_text(
                _saved_calendars_path(token_path),
                json.dumps(saved, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
        except Exception:
            pass  # 기억 못 해도 다음에 이름으로 다시 찾는다


# Google Calendar 는 호출 한도도 429 가 아니라 403 으로 돌려준다(이유: rateLimitExceeded 등).
# 상태 코드만 보면 '권한 없음' 과 구별이 안 돼, 이유 문자열을 함께 본다(리뷰 지적).
_RATE_LIMIT_REASONS = {
    "ratelimitexceeded", "userratelimitexceeded", "dailylimitexceeded", "quotaexceeded",
    "variabletermlimitexceeded", "rate_limit_exceeded", "resource_exhausted",
}


def _error_reasons(exc: Exception) -> set[str]:
    """HttpError 응답 본문에서 이유(reason·status)를 모두 꺼낸다. 못 읽으면 빈 집합."""
    reasons: set[str] = set()
    try:
        content = getattr(exc, "content", b"") or b""
        data = json.loads(content.decode("utf-8") if isinstance(content, bytes) else str(content))
        errors = data if isinstance(data, list) else [data]
        for item in errors:
            err = item.get("error") if isinstance(item, dict) else None
            if not isinstance(err, dict):
                continue
            if err.get("status"):
                reasons.add(str(err["status"]).lower())
            for key in ("errors", "details"):
                for detail in err.get(key) or []:
                    if isinstance(detail, dict) and detail.get("reason"):
                        reasons.add(str(detail["reason"]).lower())
    except Exception:
        pass
    return reasons


def _can_use_calendar(service, calendar_id: str) -> bool:
    """이 토큰으로 그 캘린더의 일정을 읽을 수 있는지.

    좁은 권한(app.created)은 이 앱이 만든 캘린더만 열어 준다. 같은 이름이어도
    사용자가 직접 만든 캘린더나 남이 공유한 캘린더면 403·404 가 난다.
    """
    try:
        service.events().list(calendarId=calendar_id, maxResults=1, fields="items(id)").execute()
        return True
    except Exception as exc:
        # 권한 없음·없는 캘린더(403·404)만 '못 쓴다' 로 본다. 호출 한도·시간 초과·5xx 같은 잠깐의 오류까지
        # False 로 보면 멀쩡한 캘린더를 버리고 같은 이름 캘린더를 또 만들었다(리뷰 지적). 그런 오류는
        # 그대로 올려 이번 동기화만 실패시키고, 다음 동기화 때 다시 해 본다.
        status = getattr(getattr(exc, "resp", None), "status", None)
        try:
            status = int(status)
        except (TypeError, ValueError):
            status = None
        if status == 403 and _error_reasons(exc) & _RATE_LIMIT_REASONS:
            raise
        if status in (403, 404):
            return False
        raise


def find_or_create_calendar(service, name: str | None = None, token_path: str | None = None) -> str:
    """이름이 같은 캘린더(카테고리)를 찾고, 없으면 새로 만든다.

    찾은 캘린더는 gcal_calendars.json 에 적어 두고 다음부터 먼저 쓴다. 같은 이름의
    캘린더가 여럿이거나 그중 하나를 이 토큰으로 못 열 때, 매번 새로 만들지 않기 위해서다.
    """
    target = (name or DEFAULT_CALENDAR_NAME).strip() or DEFAULT_CALENDAR_NAME
    with _calendar_lock(token_path):
        return _find_or_create_locked(service, target, token_path)


def _find_or_create_locked(service, target: str, token_path: str | None) -> str:
    saved_id = _load_saved_calendars(token_path).get(target)
    if saved_id and _can_use_calendar(service, saved_id):
        return saved_id

    page_token = None
    while True:
        resp = service.calendarList().list(pageToken=page_token, minAccessRole="writer").execute()
        for entry in resp.get("items", []):
            if (entry.get("summary") or "").strip() == target and _can_use_calendar(service, entry["id"]):
                _save_calendar_id(token_path, target, entry["id"])
                return entry["id"]
        page_token = resp.get("nextPageToken")
        if not page_token:
            break

    created = service.calendars().insert(
        body={"summary": target, "timeZone": TIMEZONE}
    ).execute()
    _save_calendar_id(token_path, target, created["id"])
    return created["id"]


def _parse_dt(value: Any) -> _dt.datetime | None:
    if not value:
        return None
    text = str(value).strip().replace("Z", "+00:00")
    try:
        return _dt.datetime.fromisoformat(text)
    except ValueError:
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d", "%Y/%m/%d"):
            try:
                return _dt.datetime.strptime(text, fmt)
            except ValueError:
                continue
    return None


def _event_key(mail: dict) -> str:
    raw = str(mail.get("id") or "") + "|" + str(mail.get("eventDate") or "")
    return _TAG + "-" + hashlib.sha1(raw.encode("utf-8")).hexdigest()[:24]


def _build_event(mail: dict) -> dict[str, Any] | None:
    start = _parse_dt(mail.get("eventDate"))
    if not start:
        return None
    title = str(mail.get("summary") or mail.get("subject") or "제목 없는 일정").strip()
    sender = str(mail.get("fromName") or mail.get("fromEmail") or "").strip()

    # 시:분이 모두 0이면 종일 일정으로 취급
    all_day = start.hour == 0 and start.minute == 0 and start.second == 0
    last = _parse_dt(mail.get("eventEnd"))
    if all_day:
        day = start.date()
        # 여러 날 행사(eventEnd)면 끝날까지 (구글 종일 일정의 end 는 다음 날)
        stop = last.date() if last and last.date() > day else day
        when = {
            "start": {"date": day.isoformat()},
            "end": {"date": (stop + _dt.timedelta(days=1)).isoformat()},
        }
    else:
        end = start + _dt.timedelta(hours=1)
        when = {
            "start": {"dateTime": start.isoformat(), "timeZone": TIMEZONE},
            "end": {"dateTime": end.isoformat(), "timeZone": TIMEZONE},
        }

    description_parts = []
    seminar = mail.get("seminar") or {}
    if seminar.get("speaker"):
        description_parts.append(f"연사: {seminar['speaker']}")
    if seminar.get("title"):
        description_parts.append(f"발표 제목: {seminar['title']}")
    if seminar.get("place"):
        description_parts.append(f"장소: {seminar['place']}")
    if seminar:
        description_parts.append("")
    if sender:
        description_parts.append(f"보낸 사람: {sender}")
    if mail.get("subject"):
        description_parts.append(f"메일 제목: {mail['subject']}")
    description_parts.append("(DGIST LMS AutoSaver가 메일에서 자동 등록한 일정입니다.)")

    body = {
        "summary": title[:250],
        "description": "\n".join(description_parts),
        "extendedProperties": {"private": {"autosaverKey": _event_key(mail), "source": _TAG}},
    }
    if seminar.get("place"):
        body["location"] = str(seminar["place"])[:200]
    body.update(when)
    return body


def sync_email_events(
    emails: Iterable[dict],
    calendar_name: str | None = None,
    token_path: str | None = None,
) -> dict[str, Any]:
    """메일 일정들을 전용 캘린더에 upsert 한다.

    반환: {"ok", "created", "updated", "skipped", "calendar", "message"}
    """
    mails = [m for m in (emails or []) if m.get("eventDate")]
    if not mails:
        return {
            "ok": True,
            "created": 0,
            "updated": 0,
            "skipped": 0,
            "calendar": calendar_name or DEFAULT_CALENDAR_NAME,
            "message": "동기화할 메일 일정이 없습니다.",
        }

    service = get_calendar_service(token_path)
    calendar_id = find_or_create_calendar(service, calendar_name, token_path)

    created = updated = skipped = 0
    for mail in mails:
        body = _build_event(mail)
        if not body:
            skipped += 1
            continue
        key = body["extendedProperties"]["private"]["autosaverKey"]
        try:
            existing = (
                service.events()
                .list(
                    calendarId=calendar_id,
                    privateExtendedProperty=f"autosaverKey={key}",
                    showDeleted=False,
                    maxResults=1,
                )
                .execute()
                .get("items", [])
            )
            if existing:
                service.events().update(
                    calendarId=calendar_id, eventId=existing[0]["id"], body=body
                ).execute()
                updated += 1
            else:
                service.events().insert(calendarId=calendar_id, body=body).execute()
                created += 1
        except Exception:
            skipped += 1

    return {
        "ok": True,
        "created": created,
        "updated": updated,
        "skipped": skipped,
        "calendar": calendar_name or DEFAULT_CALENDAR_NAME,
        "message": f"새 일정 {created}건, 갱신 {updated}건" + (f", 실패 {skipped}건" if skipped else ""),
    }


ACADEMIC_CALENDAR_NAME = "DGIST 학사일정"


def _build_academic_event(item: dict) -> dict[str, Any] | None:
    """학사일정 한 건을 구글 캘린더 종일 일정으로."""
    title = (item.get("title") or "").strip()
    start = (item.get("start") or "").strip()
    if not title or not start:
        return None
    end = (item.get("end") or start).strip()
    # 구글의 종일 일정은 end가 '다음 날'이어야 마지막 날까지 칠해진다.
    try:
        end_date = _dt.date.fromisoformat(end) + _dt.timedelta(days=1)
    except ValueError:
        return None
    kind = (item.get("kind") or "").strip()
    return {
        "summary": title,
        "description": f"DGIST 학사일정{f' · {kind}' if kind else ''}\nDaling이 자동으로 넣었습니다.",
        "start": {"date": start},
        "end": {"date": end_date.isoformat()},
        "extendedProperties": {"private": {"autosaverKey": f"acad-{item.get('id') or start}"}},
    }


def sync_academic_events(
    events: Iterable[dict],
    calendar_name: str | None = None,
    token_path: str | None = None,
) -> dict[str, Any]:
    """학사일정을 전용 캘린더에 upsert 한다.

    메일 일정과 섞이면 지저분해서 별도 캘린더를 쓴다.
    """
    items = list(events or [])
    name = calendar_name or ACADEMIC_CALENDAR_NAME
    if not items:
        return {"ok": True, "created": 0, "updated": 0, "skipped": 0,
                "calendar": name, "message": "동기화할 학사일정이 없습니다."}

    service = get_calendar_service(token_path)
    calendar_id = find_or_create_calendar(service, name, token_path)

    created = updated = skipped = 0
    last_error = ""
    for item in items:
        body = _build_academic_event(item)
        if not body:
            skipped += 1
            continue
        key = body["extendedProperties"]["private"]["autosaverKey"]
        try:
            existing = (
                service.events()
                .list(
                    calendarId=calendar_id,
                    privateExtendedProperty=f"autosaverKey={key}",
                    showDeleted=False,
                    maxResults=1,
                )
                .execute()
                .get("items", [])
            )
            if existing:
                service.events().update(
                    calendarId=calendar_id, eventId=existing[0]["id"], body=body
                ).execute()
                updated += 1
            else:
                service.events().insert(calendarId=calendar_id, body=body).execute()
                created += 1
        except Exception as exc:
            skipped += 1
            # 왜 실패했는지 하나는 남긴다. 전부 삼키면 원인을 알 수 없다.
            if not last_error:
                last_error = str(exc)

    message = f"새 일정 {created}건, 갱신 {updated}건"
    if skipped:
        message += f", 실패 {skipped}건"
        if last_error:
            message += f" ({last_error[:120]})"
    return {
        "ok": created + updated > 0 or not skipped,
        "created": created,
        "updated": updated,
        "skipped": skipped,
        "calendar": name,
        "message": message,
    }
