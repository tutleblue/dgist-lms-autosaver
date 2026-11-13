"""Daling 점검: 메일·LMS 동기화가 안 될 때 단계별로 시험해 근본 원인을 찾고, 고칠 수 있는 것은 고친다.

왜 만들었나(2026-11-12 사용자): 친구 컴퓨터에서 메일이 안 받아지는데 화면엔 'auth failed' 비슷한 말만 보였다.
앱이 아는 것은 '실패했다' 뿐이고, 인터넷·와이파이가 메일 포트를 막은 것인지, 비밀번호가 다른 컴퓨터에서 옮겨 와
풀리지 않는 것인지, 비밀번호에 한글이 섞인 것인지, 학교 서버가 잦은 로그인을 잠시 막은 것인지 가릴 수 없었다.
점검은 아래 순서로 한 단계씩 시험하고, 앞 단계가 막혔으면 뒤 단계는 '앞 단계 때문' 으로 건너뛴다.
가장 앞에서 막힌 단계가 근본 원인이다.

  데이터 폴더 → 설정 파일 → 저장된 비밀번호 풀기 → 계정 칸 모양 → 인터넷·학교 서버(DNS·연결·TLS) → 컴퓨터 시계
  → 메일 로그인(서버가 한 말 그대로) → LMS(서버·브라우저·최근 기록) → Google 연결 → 데이터 파일 → 최근 오류 기록

지키는 것:
- 메일 로그인은 점검 한 번에 최대 1번. 이미 열린 연결이 있으면 새로 로그인하지 않는다(email_reader 같이 쓰는 연결).
  10분 안에 다시 점검하면 앞서 본 로그인 결과를 쓴다 — 거절된 계정을 두드리면 학교 서버가 더 오래 막는다.
- LMS 는 브라우저 로그인을 하지 않는다(무겁고 느리다). 로그인 시험은 사용자가 단추로 마감 확인을 돌려서 한다.
- 비밀번호·주소는 보고서에 넣지 않는다(주소는 앞 글자만). 파일은 지우지 않고 옮긴다.
- 운영체제마다 다른 것(DPAPI·키체인)은 secret_store·web_ui 를 거친다. 경로는 pathlib 로만 잇는다.
"""
from __future__ import annotations

import concurrent.futures
import http.client
import json
import os
import re
import shutil
import socket
import ssl
import threading
import time
import unicodedata
from datetime import datetime
from email.utils import parsedate_to_datetime
from pathlib import Path
from typing import Any

# 점검 결과(작업 공간마다). 화면은 /api/doctor 로 0.7초마다 진행 상황을 읽는다.
_STATE: dict[str, dict[str, Any]] = {}
_LOCK = threading.Lock()
# 메일 로그인 결과를 10분 동안 다시 쓴다 (위 설명)
_MAIL_LOGIN_CACHE: dict[str, Any] = {}
MAIL_LOGIN_REUSE = 600

HANGUL = re.compile(r"[ᄀ-ᇿ㄰-㆏가-힣]")
# 깨져도 다음 새로고침이 다시 만드는 파일 (옮겨 두면 앱이 새로 받는다). 사용자가 만든 것(시간표·내 일정·설정)은 넣지 않는다.
REBUILDABLE = {
    "emails.json", "notices.json", "course_announcements.json", "course_staff.json", "academic_calendar.json",
    "school_events.json", "shuttle.json", "directory.json", "drive_status.json", "gcal_calendars.json",
    "lms_profile.json", "last_sync.json", "health.json",
}
USER_MADE = {"config.json", "timetable.json", "my_events.json", "file_metadata.json", "downloaded_files.json",
             "upload_selection.json", "ui_prefs.json", "shelves.json", "my_deadlines.json"}


# ───────── 결과 모양 ─────────

def _step(sid: str, group: str, title: str) -> dict[str, Any]:
    return {"id": sid, "group": group, "title": title, "status": "run", "detail": "", "cause": "",
            "evidence": [], "fix": None, "ms": None}


def _set(step: dict[str, Any], status: str, detail: str = "", cause: str = "", fix: dict | list | None = None,
         evidence: list[str] | None = None) -> dict[str, Any]:
    """fix 는 하나 또는 여럿(문제가 둘이면 고치는 단추도 둘: 주소에 @ 붙이기 + 비밀번호 다시 넣기)."""
    fixes = [f for f in (fix if isinstance(fix, list) else [fix]) if f]
    step.update(status=status, detail=detail, cause=cause, fix=fixes[0] if fixes else None, fixes=fixes,
                evidence=evidence or step.get("evidence") or [])
    return step


def _fix(action: str, label: str, **extra: Any) -> dict[str, Any]:
    """고치는 길. action 은 화면(app.js DOCTOR_FIX)이나 /api/doctor/fix 가 안다."""
    return {"action": action, "label": label, **extra}


def mask_email(value: str) -> str:
    value = str(value or "").strip()
    if "@" not in value:
        return (value[:1] + "***") if value else ""
    local, domain = value.split("@", 1)
    return f"{local[:1]}***@{domain}"


def _scrub(text: str, hide: tuple[str, ...] = ()) -> str:
    """보고서에 들어갈 글에서 사용자 폴더 경로·메일 주소·학번(LMS 아이디)을 가린다.

    작업 로그 끝 몇 줄(health.json tail)에는 학번이 그대로 찍힐 때가 있다('로그인: 2023xxxx'). 주소 모양만 가리면
    학번은 남으므로, 이 컴퓨터의 아이디·메일 앞부분을 hide 로 받아 따로 가린다. 사용자 이름은 홈 폴더 밖
    (OneDrive·다른 드라이브 경로)에도 나와서 홈 경로와 따로 가린다.
    """
    text = str(text or "")
    try:
        home = Path.home()
        if str(home):
            text = text.replace(str(home), "~").replace(str(home).replace("\\", "/"), "~")
        hide = tuple(hide) + ((home.name,) if len(home.name) >= 3 else ())
    except Exception:
        pass
    text = re.sub(r"([\w.+-])[\w.+-]*@([\w-]+(?:\.[\w-]+)+)", r"\1***@\2", text)
    for word in sorted({w for w in hide if w and len(w) >= 3}, key=len, reverse=True):
        text = re.sub(re.escape(word), word[:1] + "***", text, flags=re.IGNORECASE)
    return text


def _hide_words(config: dict[str, Any]) -> tuple[str, ...]:
    """보고서에서 가릴 이 사람의 낱말: 학번(LMS 아이디)·메일 앞부분."""
    words = [str(config.get("LMS_ID") or "").strip()]
    for key in ("SCHOOL_EMAIL", "GMAIL_ADDRESS", "EMAIL_ADDRESS"):
        value = str(config.get(key) or "").strip()
        if "@" in value:
            words.append(value.split("@", 1)[0])
    return tuple(w for w in words if len(w) >= 3)


# ───────── 인터넷·학교 서버 ─────────

def probe(host: str, port: int, tls: bool = True, timeout: float = 4.0) -> dict[str, Any]:
    """DNS → TCP 연결 → TLS 인증서 확인까지. 어디서 막혔는지(stage)와 걸린 시간을 돌려준다."""
    out: dict[str, Any] = {"host": host, "port": port, "ok": False, "stage": "dns", "error": "", "ms": None}
    started = time.monotonic()
    try:
        infos = socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)
    except socket.gaierror as exc:
        out["error"] = f"주소를 찾지 못함 ({exc.errno})"
        return out
    out["stage"] = "connect"
    sock = None
    last: Exception | None = None
    for family, kind, proto, _name, addr in infos[:3]:
        try:
            sock = socket.socket(family, kind, proto)
            sock.settimeout(timeout)
            sock.connect(addr)
            break
        except OSError as exc:
            last = exc
            if sock is not None:
                sock.close()
            sock = None
    if sock is None:
        out["error"] = "시간 초과" if isinstance(last, socket.timeout) else type(last).__name__ if last else "연결 안 됨"
        if isinstance(last, ConnectionRefusedError):
            out["error"] = "연결 거부"
        return out
    try:
        if tls:
            out["stage"] = "tls"
            ctx = ssl.create_default_context()
            with ctx.wrap_socket(sock, server_hostname=host):
                pass
        out["ok"] = True
        out["stage"] = "ok"
    except ssl.SSLCertVerificationError as exc:
        out["error"] = f"인증서 확인 실패 ({getattr(exc, 'verify_message', '') or exc.reason})"
        out["cert"] = True
        out["issuer"] = cert_issuer(host, port)
    except (ssl.SSLError, OSError) as exc:
        out["error"] = f"보안 연결 실패 ({type(exc).__name__})"
    finally:
        try:
            sock.close()
        except OSError:
            pass
        out["ms"] = round((time.monotonic() - started) * 1000)
    return out


# 학교·Google 서버 인증서를 실제로 내주는 곳(2026-11-12 실측: lms=Amazon, saml·mail=Sectigo, Google=Google Trust Services)
# 과 흔한 공인 인증 기관. 인증서 확인이 실패했는데 내준 곳이 여기 없으면, 백신·회사망·공용 와이파이가 연결 가운데에서
# 자기 인증서로 바꿔 끼운 것이다(HTTPS 검사). 여기 있으면 가로챈 것이 아니라 시계나 이 컴퓨터의 인증서 목록 문제다.
PUBLIC_CAS = ("amazon", "sectigo", "google trust", "digicert", "globalsign", "let's encrypt", "isrg", "usertrust",
              "comodo", "entrust", "geotrust", "thawte", "go daddy", "godaddy", "microsoft", "baltimore", "certum",
              "identrust", "starfield", "verisign", "kisa", "korea information")


def cert_issuer(host: str, port: int, timeout: float = 4.0) -> str:
    """확인을 끈 채 붙어서 서버가 내민 인증서를 누가 내줬는지(조직 이름·없으면 CN). 못 알아내면 빈 글.

    표준 라이브러리만 쓴다(_ssl._test_decode_cert) — cryptography 는 Windows 묶음에 들어가지 않는다.
    """
    try:
        import _ssl
        import tempfile

        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        with socket.create_connection((host, port), timeout=timeout) as raw, ctx.wrap_socket(raw, server_hostname=host) as tls:
            der = tls.getpeercert(binary_form=True)
        if not der:
            return ""
        with tempfile.NamedTemporaryFile("w", suffix=".pem", delete=False, encoding="ascii") as fh:
            fh.write(ssl.DER_cert_to_PEM_cert(der))
            pem = fh.name
        try:
            issuer = _ssl._test_decode_cert(pem).get("issuer") or ()
        finally:
            os.unlink(pem)
        fields = {k: v for rdn in issuer for k, v in rdn}
        return str(fields.get("organizationName") or fields.get("commonName") or "")[:80]
    except Exception:
        return ""


def proxies() -> list[str]:
    """이 컴퓨터에 설정된 프록시 종류 (Windows 는 인터넷 옵션, 맥은 네트워크 설정, 그 밖엔 환경 변수).

    Daling 의 메일(IMAP)·점검 연결은 프록시를 거치지 않고 곧장 나간다. 프록시를 거쳐야만 밖으로 나가는 망이면
    웹 브라우저는 되는데 메일만 안 된다.
    """
    try:
        import urllib.request

        return sorted(k for k, v in urllib.request.getproxies().items() if v and k in ("http", "https", "all"))
    except Exception:
        return []


def clock_skew(host: str = "lms.dgist.ac.kr") -> float | None:
    """컴퓨터 시계가 학교 서버와 몇 초 다른지(+ 면 컴퓨터가 빠름). http 로 묻는다 — 시계가 틀리면 https 가 먼저 깨진다."""
    try:
        conn = http.client.HTTPConnection(host, 80, timeout=4)
        conn.request("HEAD", "/")
        resp = conn.getresponse()
        date = resp.getheader("Date")
        conn.close()
        if not date:
            return None
        server = parsedate_to_datetime(date)
        return (datetime.now().astimezone() - server).total_seconds()
    except Exception:
        return None


# ───────── 메일 서버가 한 말 → 까닭 ─────────

def explain_mail_reply(reply: str, password_same_as_success: bool) -> tuple[str, str, dict | None]:
    """학교 메일 서버(Bee-Hive)의 로그인 거절 글을 사람 말로. (detail, cause, fix)

    실측(2026-11-12): 없는 주소 → 'NO login failure: unable user'.
    같은 계정 로그인이 잦을 때·비밀번호가 틀릴 때 → 'NO login failure: invalid auth or access denied'
    (FEATURES.md 메일 절: 맞는 비밀번호도 몇 시간 이렇게 거절되다 풀렸다. 9/27·10/12·10/21).
    """
    low = reply.lower()
    said = f'학교 메일 서버: "{reply}"'
    if "unable user" in low or "no such user" in low or "unknown user" in low:
        return (said, "학교 메일 서버에 이 주소가 없어요. 주소를 '아이디@dgist.ac.kr' 꼴로 정확히 넣었는지 확인해 주세요.",
                _fix("field", "메일 주소 고치기", field="schoolEmail"))
    if "invalid auth" in low or "access denied" in low or "auth" in low or "password" in low or "login" in low:
        if password_same_as_success:
            return (said, "예전에 되던 비밀번호 그대로인데 거절됐어요. 같은 학교 계정을 여러 기기(다른 컴퓨터·휴대폰 앱)에서 자주 쓰면 학교 서버가 잠시 막아요. 보통 1~2시간 뒤 풀리니 앱이 2시간 뒤 다시 해 볼게요. 그 사이 학교 포털 비밀번호를 바꿨다면 여기도 바꿔 주세요.",
                    _fix("field", "비밀번호 바꾸기", field="schoolEmailPassword"))
        return (said, "비밀번호가 틀렸을 가능성이 커요. 학교 포털 비밀번호를 바꿨다면 여기에도 새 비밀번호를 넣어 주세요. 맞는데도 거절되면 같은 계정을 여러 기기에서 쓰고 있어 학교 서버가 잠시 막은 것일 수 있어요.",
                _fix("field", "비밀번호 바꾸기", field="schoolEmailPassword"))
    return (said, "학교 메일 서버가 로그인을 거절했어요. 서버가 한 말을 '보고서 복사' 로 만든 사람에게 보내 주세요.",
            _fix("copy", "보고서 복사"))


# ───────── 점검 ─────────

def run(workspace: Any, on_step=None, force: tuple[str, ...] = (), own_port: int | None = None) -> dict[str, Any]:
    """점검을 한 번 돈다. on_step(steps) 는 단계가 바뀔 때마다 불린다(화면 진행 표시).

    force: 'mail' 이면 막 거절된 계정이라도 메일 로그인을 시험한다(사용자가 '그래도 지금 시험' 을 눌렀을 때).
    own_port: 이 화면 서버의 포트 (다른 Daling 이 함께 켜져 있는지 볼 때 나를 뺀다).
    """
    import web_ui

    steps: list[dict[str, Any]] = []
    fixed: list[str] = []
    env: dict[str, Any] = _environment(web_ui)

    def add(sid: str, group: str, title: str) -> dict[str, Any]:
        step = _step(sid, group, title)
        steps.append(step)
        if on_step:
            on_step(steps)
        return step

    def done() -> None:
        if on_step:
            on_step(steps)

    root = Path(workspace.root)
    raw_config = web_ui.read_json(workspace.config_path, None) if Path(workspace.config_path).exists() else {}
    config_broken = Path(workspace.config_path).exists() and raw_config is None
    raw_config = raw_config if isinstance(raw_config, dict) else {}
    try:
        config = web_ui.read_config(workspace) if not config_broken else {}
    except Exception:
        config = {}
    health = web_ui.read_json(workspace.health_path, {}) or {}
    if not isinstance(health, dict):
        health = {}
    blocked: dict[str, str] = {}  # 막힌 갈래 → 막은 단계 제목 (뒤 단계는 건너뛴다)

    # 1. 데이터 폴더
    step = add("data.folder", "앱", "데이터 폴더에 쓸 수 있는지")
    try:
        root.mkdir(parents=True, exist_ok=True)
        probe_file = root / f".doctor-{os.getpid()}.tmp"
        probe_file.write_text("ok", encoding="utf-8")
        probe_file.unlink()
        free = shutil.disk_usage(root).free
        free_mb = free // (1024 * 1024)
        if free_mb < 50:
            _set(step, "fail", f"남은 공간 {free_mb}MB", "저장 공간이 거의 없어 자료·메일을 저장하지 못해요. 공간을 비워 주세요.",
                 _fix("storage", "저장 위치 보기"))
            blocked["all"] = step["title"]
        elif free_mb < 300:
            _set(step, "warn", f"남은 공간 {free_mb}MB", "저장 공간이 넉넉하지 않아요.", _fix("storage", "저장 위치 보기"))
        else:
            _set(step, "ok", f"쓸 수 있음 · 남은 공간 {free_mb / 1024:.1f}GB")
    except OSError as exc:
        _set(step, "fail", f"쓰기 실패 ({type(exc).__name__})",
             "데이터 폴더에 쓸 수 없어요. 백신·폴더 보호 기능이 막았거나 권한이 없는 것일 수 있어요.")
        blocked["all"] = step["title"]
    done()

    # 1-1. 다른 Daling 이 함께 켜져 있는지 (같은 계정으로 메일에 두 배로 로그인 → 학교 서버가 막는다).
    # Windows 에서 닫힌 포트는 거절까지 약 2초 걸려(2026-11-12 실측: 이 단계만 5초) 뒤에서 함께 묻고 끝에 받는다
    copies_pool = concurrent.futures.ThreadPoolExecutor(max_workers=2)
    copies_future = copies_pool.submit(other_copies, own_port) if own_port else None
    # AI 연결 상태(Claude·Codex CLI 의 로그인 상태 명령, 네트워크 안 씀 · 이 PC 0.9초)도 뒤에서 함께 묻는다
    ai_future = copies_pool.submit(ai_connections)
    copies_pool.shutdown(wait=False)
    copies_step = add("app.copies", "앱", "다른 Daling 이 함께 켜져 있는지") if own_port else None

    def finish_copies() -> None:
        if copies_future is None or copies_step is None:
            return
        step = copies_step
        try:
            others = copies_future.result(timeout=15)
        except Exception:
            _set(step, "skip", "확인하지 못함")
            return
        if others:
            names = ", ".join(f"{o['version'] or '?'} (포트 {o['port']})" for o in others)
            _set(step, "warn", " · ".join([f"{len(others) + 1}개 켜져 있음", names]),
                 "Daling 이 이 컴퓨터에 둘 이상 켜져 있어요(설치본·Store 판·시험판 등). 함께 켜 두면 메일 서버에 두 배로 로그인해 학교 서버가 맞는 비밀번호도 막을 수 있어요. 하나만 남기고 꺼 주세요.",
                 None, [f"다른 Daling: {names}"])
        else:
            _set(step, "ok", "이 앱 하나만 켜져 있음")

    # 2. 설정 파일
    step = add("data.config", "앱", "설정 파일")
    if config_broken:
        _set(step, "fail", "config.json 을 읽을 수 없음",
             "설정 파일이 깨져 계정이 비어 보여요. 설정에서 계정을 다시 넣거나, 내보내 둔 설정을 불러와 주세요.",
             _fix("field", "계정 다시 넣기", field="schoolEmail"))
        blocked["mail"] = blocked["lms"] = step["title"]
    elif not raw_config:
        _set(step, "warn", "아직 설정이 없음", "설정에서 학교 계정을 넣어 주세요.", _fix("field", "계정 넣기", field="schoolEmail"))
    else:
        _set(step, "ok", "읽힘")
    done()

    # 3. 저장된 비밀번호 풀기 (Windows DPAPI · 맥 키체인 · 리눅스 키링)
    step = add("secrets", "앱", "저장된 비밀번호를 풀 수 있는지")
    problems: list[str] = []
    evidence: list[str] = []
    try:
        import runtime_config

        if set(web_ui.SECRET_KEYS) != set(runtime_config.SECRET_KEYS):
            # CLAUDE.md 5: 한쪽에만 있으면 작업 프로세스가 'dpapi:' 암호문을 비밀번호로 쓴다
            evidence.append("SECRET_KEYS 가 두 곳에서 다름: " + ", ".join(sorted(set(web_ui.SECRET_KEYS) ^ set(runtime_config.SECRET_KEYS))))
    except Exception:
        pass
    secret_fail: dict[str, str] = {}
    for key, kind, field in (("SCHOOL_EMAIL_PASSWORD", "mail", "schoolEmailPassword"), ("LMS_PASSWORD", "lms", "lmsPassword")):
        stored = raw_config.get(key)
        if not stored:
            continue
        label = web_ui.SECRET_LABELS.get(key, key)
        text = str(stored)
        if text.startswith(web_ui.DPAPI_PREFIX):
            if os.name != "nt":
                secret_fail[key] = f"{label}: Windows 에서 옮겨 온 암호문이라 이 컴퓨터에서는 못 풀어요."
            elif not web_ui.dpapi_unprotect(text):
                secret_fail[key] = (f"{label}: 다른 컴퓨터나 다른 Windows 사용자에서 옮겨 온 암호문이라 이 컴퓨터에서 못 풀어요. (설정을 옮길 때 '비밀번호 포함' 으로 내보내야 해요)")
        elif web_ui.secret_store.is_marker(text):
            reason = web_ui.secret_read_problems(workspace).get(key)
            if reason:
                secret_fail[key] = web_ui.secret_store.read_problem(label, reason)
        if key in secret_fail:
            blocked.setdefault(kind, step["title"])
            problems.append(secret_fail[key])
    if problems:
        first_key = next(iter(secret_fail))
        _set(step, "fail", " ".join(problems), "비밀번호를 설정에 다시 넣으면 이 컴퓨터에 맞게 새로 저장돼요.",
             _fix("field", "비밀번호 다시 넣기",
                  field="schoolEmailPassword" if first_key == "SCHOOL_EMAIL_PASSWORD" else "lmsPassword"),
             evidence)
    elif evidence:
        _set(step, "fail", evidence[0], "앱 안의 설정 목록이 어긋났어요. 앱 업데이트가 필요하니 보고서를 보내 주세요.",
             _fix("copy", "보고서 복사"), evidence)
    else:
        _set(step, "ok", "풀림" if any(raw_config.get(k) for k in ("SCHOOL_EMAIL_PASSWORD", "LMS_PASSWORD")) else "저장된 비밀번호 없음")
    done()

    # 3-1. 자료를 저장할 폴더 ('내 컴퓨터에 저장' 이 켜져 있을 때). 데이터 폴더와 다른 곳이라(문서·외장 디스크) 따로 본다
    step = add("data.save", "앱", "자료를 저장할 폴더")
    _save_folder_step(step, workspace, config, web_ui)
    done()

    # 3-2. 작업 프로세스: 자료 동기화·마감 확인은 따로 된 프로세스(Daling --autosaver-job)에서 돈다. 화면 서버는 멀쩡한데
    # 그 프로세스만 백신에 막히거나, 거기서 비밀번호를 못 풀면(CLAUDE.md 5) 화면 점검은 모두 정상인데 동기화만 실패한다
    step = add("worker", "앱", "동기화 작업이 뜨는지")
    if "all" in blocked:
        _set(step, "skip", f"앞 단계({blocked['all']}) 때문에 건너뜀")
    else:
        res = worker_check(workspace, web_ui)
        step["ms"] = res.get("ms")
        stored = [k for k in ("LMS_PASSWORD", "SCHOOL_EMAIL_PASSWORD") if raw_config.get(k) and k not in secret_fail]
        if not res["ok"]:
            _set(step, "fail", res["error"],
                 "동기화를 하는 작업 프로세스가 뜨지 않아요. 백신이 Daling 을 막았거나 설치가 깨졌을 수 있어요. 백신의 검사 기록·차단 목록에서 Daling 을 허용하고, 그래도 안 되면 다시 설치해 주세요.",
                 _fix("copy", "보고서 복사"), res.get("tail") or [])
            blocked.setdefault("lms", step["title"])
        elif res.get("data") and Path(res["data"]).resolve() != root.resolve():
            _set(step, "fail", "작업이 다른 데이터 폴더를 봄",
                 "작업 프로세스가 화면과 다른 데이터 폴더를 써서 가져온 것이 화면에 안 보여요. 보고서를 보내 주세요.",
                 _fix("copy", "보고서 복사"), [f"작업: {res['data']}", f"화면: {root}"])
        elif res.get("secrets") is not None and res["secrets"] < len(stored):
            _set(step, "fail", f"작업이 비밀번호를 못 풂 ({res['secrets']}/{len(stored)})",
                 "화면은 비밀번호를 읽는데 동기화 작업은 못 읽어요. 설정에서 비밀번호를 다시 넣어 저장해 주세요. 그래도 같으면 보고서를 보내 주세요.",
                 _fix("field", "비밀번호 다시 넣기", field="lmsPassword"))
            blocked.setdefault("lms", step["title"])
        else:
            bits = ["뜸", f"{res.get('ms')}ms"] + ([f"비밀번호 {res['secrets']}개 읽힘"] if res.get("secrets") else [])
            _set(step, "ok", " · ".join(bits))
    done()

    # 4. 계정 칸 모양
    mail_addr = str(config.get("SCHOOL_EMAIL") or "")
    mail_pw = str(config.get("SCHOOL_EMAIL_PASSWORD") or "")
    imap_host = str(config.get("SCHOOL_IMAP_HOST") or "mail.dgist.ac.kr").strip() or "mail.dgist.ac.kr"
    step = add("account.mail", "메일", "학교 메일 계정 칸")
    if "mail" in blocked:
        _set(step, "skip", f"앞 단계({blocked['mail']}) 때문에 건너뜀")
    elif not mail_addr:
        _set(step, "fail", "메일 주소가 비어 있음", "설정에서 학교 메일 주소와 비밀번호를 넣어 주세요.",
             _fix("field", "계정 넣기", field="schoolEmail"))
        blocked["mail"] = step["title"]
    else:
        notes: list[str] = []
        fixes: list[dict] = []
        status = "ok"
        normal = unicodedata.normalize("NFKC", mail_addr).strip()
        if "@" not in normal:
            status = "fail"
            fixes.append(_fix("server", "끝에 @dgist.ac.kr 붙이기", op="mail-domain"))
            notes.append("주소에 '@dgist.ac.kr' 이 없어요. 학교 메일 서버는 전체 주소로 로그인해요.")
        elif normal != mail_addr or re.search(r"\s", mail_addr):
            status = "warn"
            fixes.append(_fix("server", "주소 다듬기", op="mail-normalize"))
            notes.append("주소에 빈칸이나 전각 글자가 섞여 있어요.")
        if "@" in normal and imap_host.endswith("dgist.ac.kr") and not normal.lower().endswith("@dgist.ac.kr"):
            status = "fail"
            fixes.append(_fix("field", "메일 주소 고치기", field="schoolEmail"))
            notes.append(f"학교 메일 서버에 '{normal.split('@', 1)[1]}' 주소로 로그인하려 해요. 학교 주소(@dgist.ac.kr)를 넣어 주세요.")
        if not mail_pw:
            status = "fail"
            fixes.append(_fix("field", "비밀번호 넣기", field="schoolEmailPassword"))
            notes.append("메일 비밀번호가 비어 있어요.")
        elif HANGUL.search(mail_pw):
            status = "fail"
            fixes.append(_fix("field", "비밀번호 다시 넣기", field="schoolEmailPassword"))
            notes.append("비밀번호에 한글이 들어 있어요. 한/영 키가 한글일 때 입력된 것 같아요.")
        elif any(ord(ch) > 126 for ch in mail_pw):
            status = "warn" if status == "ok" else status
            notes.append("비밀번호에 영어·숫자·기호가 아닌 글자가 있어요. 학교 메일 서버가 못 알아들을 수 있어요.")
        if status == "fail":
            blocked["mail"] = step["title"]
        _set(step, status, mask_email(normal), " ".join(notes), fixes)
    done()

    lms_id = str(config.get("LMS_ID") or "")
    lms_pw = str(config.get("LMS_PASSWORD") or "")
    step = add("account.lms", "LMS", "LMS 계정 칸")
    if "lms" in blocked:
        _set(step, "skip", f"앞 단계({blocked['lms']}) 때문에 건너뜀")
    elif not lms_id or not lms_pw:
        _set(step, "fail", "아이디나 비밀번호가 비어 있음", "설정에서 LMS(학교 포털) 아이디와 비밀번호를 넣어 주세요.",
             _fix("field", "계정 넣기", field="lmsId" if not lms_id else "lmsPassword"))
        blocked["lms"] = step["title"]
    else:
        notes, fix, status = [], None, "ok"
        if unicodedata.normalize("NFKC", lms_id).strip() != lms_id:
            status, fix = "warn", _fix("server", "아이디 다듬기", op="lms-normalize")
            notes.append("아이디에 빈칸이나 전각 글자가 섞여 있어요.")
        if HANGUL.search(lms_pw):
            status, fix = "fail", _fix("field", "비밀번호 다시 넣기", field="lmsPassword")
            notes.append("비밀번호에 한글이 들어 있어요. 한/영 키가 한글일 때 입력된 것 같아요.")
            blocked["lms"] = step["title"]
        _set(step, status, (lms_id[:2] + "***") if lms_id else "", " ".join(notes), fix)
    done()

    # 5. 인터넷·학교 서버 (함께 묻는다)
    try:
        import email_reader

        imap_port = int(config.get("SCHOOL_IMAP_PORT") or getattr(email_reader, "SCHOOL_IMAP_PORT", 993) or 993)
    except Exception:
        imap_port = 993
    token_path = Path(workspace.token_path)
    targets = [
        ("net.lms", "LMS 서버", "lms.dgist.ac.kr", 443),
        ("net.sso", "학교 로그인 서버", "saml.dgist.ac.kr", 443),
        ("net.mail", "학교 메일 서버", imap_host, imap_port),
    ]
    if token_path.exists():
        targets.append(("net.google", "Google", "oauth2.googleapis.com", 443))
    net_steps = {sid: add(sid, "인터넷", f"{label}에 닿는지") for sid, label, _h, _p in targets}
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(targets) + 2) as pool:
        futures = {sid: pool.submit(probe, host, port) for sid, _l, host, port in targets}
        skew_future = pool.submit(clock_skew)
        proxy_future = pool.submit(proxies)
        results = {sid: fut.result() for sid, fut in futures.items()}
        skew = skew_future.result()
        proxy_kinds = proxy_future.result()
    env["proxy"] = ", ".join(proxy_kinds) or "없음"
    for sid, label, host, port in targets:
        res = results[sid]
        step = net_steps[sid]
        step["ms"] = res.get("ms")
        if res["ok"]:
            _set(step, "ok", f"{host}:{port} · {res['ms']}ms")
        else:
            _set(step, "fail", f"{host}:{port} — {res['error']}", "", _fix("retry", "다시 점검"),
                 evidence=[f"막힌 곳: {res['stage']}"])
    ok_web = [sid for sid in ("net.lms", "net.sso") if results[sid]["ok"]]
    all_down = not any(r["ok"] for r in results.values())
    for sid, label, host, port in targets:
        res, step = results[sid], net_steps[sid]
        if res["ok"]:
            continue
        group = {"net.mail": "mail", "net.google": "google"}.get(sid, "lms")
        blocked.setdefault(group, step["title"])
        if all_down:
            step["cause"] = "인터넷이 끊겼거나 학교 서버 모두에 닿지 않아요. 와이파이·랜선을 확인해 주세요. 연결되면 저절로 다시 해요."
        elif res["stage"] == "dns":
            step["cause"] = f"{host} 주소를 찾지 못했어요. 인터넷 공유기나 DNS 설정 문제일 수 있어요."
        elif res.get("cert"):
            issuer = str(res.get("issuer") or "")
            if issuer:
                step["evidence"] = step["evidence"] + [f"인증서를 내준 곳: {issuer}"]
            if issuer and not any(ca in issuer.lower() for ca in PUBLIC_CAS):
                # 가운데에서 바꿔 끼운 인증서 — 그 프로그램 이름이 곧 원인이다
                step["cause"] = (f"연결 가운데에 '{issuer}' 의 인증서가 끼어 있어요. 백신이나 회사·학교 밖 와이파이가 보안 연결을 열어 보고 있는 거예요. 그 프로그램의 'HTTPS 검사·암호화된 연결 검사' 를 끄거나 Daling 을 예외에 넣어 주세요.")
            elif issuer:
                step["cause"] = ("학교 서버의 인증서는 맞는데 이 컴퓨터가 믿지 못해요. 컴퓨터 시계가 틀렸거나 운영체제의 인증서 목록이 오래됐어요. 시계를 맞추고 운영체제를 업데이트해 주세요.")
            else:
                step["cause"] = ("보안 연결의 인증서를 믿을 수 없어요. 컴퓨터 시계가 틀렸거나, 백신·회사·공용 와이파이가 연결을 가로채고 있어요.")
        elif sid == "net.mail" and ok_web:
            step["cause"] = (f"웹(443)은 되는데 메일 포트({port})만 막혀 있어요. 지금 쓰는 와이파이(공용·카페·회사망)나 백신 방화벽이 메일 포트를 막은 거예요. 다른 와이파이나 휴대폰 핫스팟에서 해 보세요.")
        else:
            step["cause"] = f"{label}에 닿지 않아요. 학교 서버 점검 중이거나 이 인터넷에서 막힌 것일 수 있어요."
        if proxy_kinds and not res.get("cert"):
            step["cause"] += " 이 컴퓨터에 프록시가 설정돼 있어요. 프록시를 거쳐야만 밖으로 나가는 망이면 메일 연결은 막혀요."
            step["evidence"] = step["evidence"] + ["프록시: " + ", ".join(proxy_kinds)]
    step = add("clock", "인터넷", "컴퓨터 시계")
    if skew is None:
        _set(step, "skip", "학교 서버 시각을 못 받아 건너뜀")
    elif abs(skew) > 300:
        _set(step, "fail", f"학교 서버보다 {abs(skew) / 60:.0f}분 {'빠름' if skew > 0 else '느림'}",
             "컴퓨터 시계가 틀리면 보안 연결과 Google 로그인이 실패해요. 시계를 '자동으로 시간 설정' 으로 맞춰 주세요.")
    else:
        _set(step, "ok", f"맞음 (차이 {abs(skew):.0f}초)")
    done()

    finish_copies()
    done()

    # 6. 메일 로그인
    step = add("mail.login", "메일", "학교 메일 로그인")
    mail_fail_reason = ""
    logins_hour = _recent_logins()
    env["mailLogins"] = logins_hour
    locked = (health.get("authFailed") or {}).get("emails") or {}
    locked_fresh = (
        isinstance(locked, dict) and locked.get("configStamp") == list(web_ui._file_stamp(Path(workspace.config_path)))
        and _minutes_since(locked.get("at")) < AUTH_COOL_MINUTES
    )
    if "mail" in blocked or "all" in blocked:
        _set(step, "skip", f"앞 단계({blocked.get('mail') or blocked.get('all')}) 때문에 건너뜀")
    elif locked_fresh and "mail" not in force:
        # 막 거절된 계정을 또 두드리면 학교 서버가 더 오래 막는다. 설정을 안 바꿨으면 서버가 그때 한 말로 판단하고,
        # 사용자가 원하면 '그래도 지금 시험' 으로 한 번 해 본다
        reply = str(locked.get("reason") or "")
        reply = re.sub(r"^.*\(서버: (.+)\)\s*$", r"\1", reply)
        detail, cause, fix = explain_mail_reply(reply, _password_same_as_success(workspace, health)) if reply else (
            "", "학교 메일 서버가 로그인을 거절했어요.", _fix("field", "비밀번호 바꾸기", field="schoolEmailPassword"))
        mail_fail_reason = reply
        when = web_ui._short_when(locked.get("at"))
        _set(step, "fail", " · ".join([f"{when}에 거절됨", "30분이 안 지나 다시 시험하지 않았어요"]),
             cause, [fix, _fix("force-mail", "그래도 지금 시험")],
             [detail] if detail else [])
    else:
        cache_key = f"{workspace.user_id}|{mail_addr}|{imap_host}|{_file_mtime(workspace.config_path)}"
        cached = _MAIL_LOGIN_CACHE.get(cache_key)
        if cached and time.monotonic() - cached["at"] < MAIL_LOGIN_REUSE:
            res = dict(cached["res"], reused=True)
        else:
            res = _try_mail_login(mail_addr, mail_pw, imap_host, imap_port)
            _MAIL_LOGIN_CACHE.clear()
            _MAIL_LOGIN_CACHE[cache_key] = {"at": time.monotonic(), "res": res}
        step["ms"] = res.get("ms")
        # ' · ' 로 이어야 영어 화면이 마디마다 옮긴다
        again = " · 10분 안에 본 결과" if res.get("reused") else ""
        if res["ok"]:
            _set(step, "ok", f"로그인됨 · 받은편지함 {res.get('count', '?')}통{again}")
            # 서버는 받아 주는데 예전 거절 기록 때문에 자동 확인이 멈춰 있으면 기록을 지우고 곧바로 다시 가져온다
            if (health.get("authFailed") or {}).get("emails") or (health.get("failures") or {}).get("emails"):
                web_ui.reset_task_failures(workspace, ["emails"])
                try:
                    web_ui.start_task(workspace, "emails")
                except Exception:
                    pass
                fixed.append("메일: 예전 실패 기록 때문에 멈춰 있던 자동 확인을 풀고 다시 가져오기 시작했어요.")
        elif res.get("busy"):
            _set(step, "skip", "메일을 가져오는 중이라 이번엔 건너뜀. 잠시 뒤 다시 점검해 주세요.")
        elif res.get("rejected"):
            same = _password_same_as_success(workspace, health)
            detail, cause, fix = explain_mail_reply(res["reply"], same)
            mail_fail_reason = res["reply"]
            if logins_hour >= MANY_LOGINS and "unable user" not in res["reply"].lower():
                cause += f" 이 컴퓨터만 해도 지난 1시간에 {logins_hour}번 로그인했어요."
            _set(step, "fail", detail + again, cause, fix, [f"이 컴퓨터의 메일 로그인: 지난 1시간 {logins_hour}번"])
        else:
            _set(step, "fail", f"{res.get('error', '알 수 없음')}{again}",
                 "메일 서버와 연결은 됐지만 로그인 중에 끊겼어요. 잠시 뒤 다시 해 보세요.", _fix("retry", "다시 점검"))
    done()

    # 7. LMS
    step = add("lms.api", "LMS", "LMS 서버 응답")
    if "lms" in blocked and blocked["lms"].endswith("닿는지") or "all" in blocked:
        _set(step, "skip", f"앞 단계({blocked.get('lms') or blocked.get('all')}) 때문에 건너뜀")
    else:
        res = _lms_version()
        if res.get("ok"):
            _set(step, "ok", f"응답함 · Blackboard {res.get('version', '')} · {res.get('ms')}ms")
        else:
            _set(step, "warn", f"응답 {res.get('status') or res.get('error')}", "LMS 서버가 지금 제대로 답하지 않아요. 점검 중일 수 있어요.")
    done()

    step = add("lms.browser", "LMS", "LMS 로그인에 쓸 브라우저")
    try:
        import browser_setup

        label = browser_setup.browser_label()
        if browser_setup.browser_ready():
            note = " · Edge 가 안 떠서 내장 브라우저를 써요" if browser_setup.edge_failed() and label != "Edge" else ""
            _set(step, "ok", f"{label}{note}")
        else:
            _set(step, "warn", "아직 없음", "다음 동기화 때 LMS 로그인용 브라우저를 저절로 받아요(약 100MB).")
    except Exception as exc:
        _set(step, "warn", f"확인하지 못함 ({type(exc).__name__})")
    done()

    step = add("lms.history", "LMS", "최근 LMS 동기화")
    _history_step(step, health, ("sync", "deadlines"), blocked.get("lms"), web_ui)
    done()

    # 8. Google
    step = add("google", "Google", "Google 연결")
    if not token_path.exists():
        _set(step, "skip", "연결하지 않음")
    elif "google" in blocked:
        _set(step, "skip", f"앞 단계({blocked['google']}) 때문에 건너뜀")
    else:
        _google_step(step, token_path)
    done()

    # 9. 데이터 파일
    step = add("data.json", "앱", "데이터 파일")
    broken = []
    for path in sorted(root.glob("*.json")):
        if path.name == "config.json":
            continue
        try:
            with path.open("r", encoding="utf-8-sig") as fh:
                json.load(fh)
        except (OSError, ValueError):
            broken.append(path.name)
    if broken:
        movable = [name for name in broken if name in REBUILDABLE]
        _set(step, "warn", "깨진 파일: " + ", ".join(broken),
             ("깨진 파일은 빈 것처럼 읽혀 목록이 비어 보일 수 있어요. 옮겨 두면 다음 새로고침이 새로 만들어요." if movable
              else "깨진 파일은 빈 것처럼 읽혀 목록이 비어 보일 수 있어요."),
             _fix("server", "깨진 파일 옮겨 두기", op="move-broken", files=movable) if movable else None)
    else:
        _set(step, "ok", f"{len(list(root.glob('*.json')))}개 모두 읽힘")
    done()

    # 10. 최근 오류 기록
    step = add("errors", "앱", "최근 앱 오류 기록")
    entries = _recent_server_errors(web_ui)
    if entries:
        first = entries[-1]
        _set(step, "warn", f"사흘 안에 {len(entries)}번 · 마지막: {first['when']} {first['what']}",
             "앱 안에서 잡히지 않은 오류가 있었어요. 계속되면 보고서를 보내 주세요.", _fix("copy", "보고서 복사"),
             [first["line"]])
    else:
        _set(step, "ok", "사흘 안에 없음")
    done()

    # 메일 최근 기록은 로그인 결과 뒤에 둔다 (지금 로그인이 되면 지난 실패는 이미 풀린 것)
    step = add("mail.history", "메일", "최근 메일 가져오기")
    _history_step(step, health, ("emails",), blocked.get("mail") if "mail" in blocked else None, web_ui,
                  login_ok=next((s["status"] == "ok" for s in steps if s["id"] == "mail.login"), False))
    done()

    # 11. 자동 확인: 계정·로그인이 멀쩡해도 '안 가져온다' 가 될 수 있다 — 설정에서 꺼 뒀거나, 실패가 쌓여 최대 6시간 쉬거나,
    # 작업 하나가 끝나지 않고 붙들려 다음 차례가 오지 않을 때. 메일 로그인 단계가 기록을 지웠을 수 있어 health 를 다시 읽는다
    health_now = web_ui.read_json(workspace.health_path, {}) or {}
    step = add("auto.mail", "메일", "메일 자동 확인")
    _auto_step(step, workspace, config, health_now if isinstance(health_now, dict) else {}, ("emails",), web_ui, blocked.get("mail"))
    done()
    step = add("auto.lms", "LMS", "LMS 자동 확인")
    _auto_step(step, workspace, config, health_now if isinstance(health_now, dict) else {}, ("deadlines", "sync"), web_ui, blocked.get("lms"))
    done()

    # 12. AI 연결: 메일 쓰기의 AI(회색 글씨·/ai)는 이 컴퓨터의 Claude·Codex CLI 로그인을 쓴다. 로그인이 만료되면
    # CLI 가 'Failed to authenticate: OAuth … token' 같은 말로 끝난다(2026-11-04 실측) — 친구가 본 'auth/token failed' 가
    # 메일 받기가 아니라 이쪽일 수 있어 함께 본다
    step = add("ai", "AI", "메일 AI 연결")
    try:
        _ai_step(step, ai_future.result(timeout=40))
    except Exception as exc:
        _set(step, "skip", f"확인하지 못함 ({type(exc).__name__})")
    done()

    # 화면·보고서에 나가는 글에서 학번·메일 앞부분·사용자 이름을 가린다 (로그 끝줄에 그대로 찍힐 때가 있다)
    hide = _hide_words(config) + _hide_words(raw_config)
    for s in steps:
        s["detail"] = _scrub(s["detail"], hide)
        s["cause"] = _scrub(s["cause"], hide)
        s["evidence"] = [_scrub(e, hide) for e in s.get("evidence") or []]
    return _summarize(steps, fixed, _scrub(mail_fail_reason, hide), env)


# 막 거절된 메일 계정은 이 시간 안에는 다시 두드리지 않는다 (설정을 바꾸지 않았을 때)
AUTH_COOL_MINUTES = 30
# 앱을 보고 있으면 5분마다 = 1시간에 12번 로그인이 보통이다(학교 메일 서버가 20~40초면 연결을 끊는다, web_ui.PRESENCE).
# 그보다 많으면 '잦은 로그인' 을 까닭에 덧붙인다
MANY_LOGINS = 15
# 작업이 이만큼 넘게 '도는 중' 이면 붙들린 것으로 본다 (메일 한 번 3~10초, 자료 동기화 수 분)
STUCK_MINUTES = {"emails": 10, "deadlines": 30, "sync": 60}


def _minutes_since(stamp: Any) -> float:
    try:
        when = datetime.fromisoformat(str(stamp).replace("Z", "+00:00"))
        if when.tzinfo is not None:
            when = when.astimezone().replace(tzinfo=None)
        return (datetime.now() - when).total_seconds() / 60
    except (TypeError, ValueError):
        return float("inf")


def _recent_logins(seconds: int = 3600) -> int:
    """이 프로세스가 학교 메일 서버에 LOGIN 을 보낸 횟수 (메일 새로고침은 화면 서버 안에서 돈다, web_ui._mail_in_process)."""
    try:
        import email_reader

        return int(email_reader.recent_logins(seconds))
    except Exception:
        return 0


def _environment(web_ui: Any) -> dict[str, Any]:
    """보고서 머리에 붙는 이 컴퓨터의 모습 (멀리 있는 친구 컴퓨터를 짐작할 때 쓴다). 개인 정보는 넣지 않는다."""
    import sys

    kind = "설치본" if getattr(sys, "frozen", False) else "소스"
    try:
        import runtime_config

        if runtime_config.msix_package_full_name():
            kind = "Store 판"
    except Exception:
        pass
    offset = datetime.now().astimezone().strftime("%z")
    return {"install": kind, "tz": f"UTC{offset[:3]}:{offset[3:]}" if offset else "?"}


def other_copies(own_port: int, ports: range = range(8765, 8800)) -> list[dict[str, Any]]:
    """이 컴퓨터에 함께 켜진 다른 Daling (설치본·Store 판·개발 서버). 화면 서버 포트를 차례로 물어본다.

    Daling 이 아닌 프로그램이 같은 포트를 쓸 수 있어(CLAUDE.md 21), '업데이트 내용' 응답 모양(version·entries)이
    맞을 때만 센다. 잠긴 앱은 423 을 준다. 끄지는 않는다 — 내가 띄우지 않은 프로세스다.
    """
    def ask(port: int) -> dict[str, Any] | None:
        if port == own_port:
            return None
        try:
            conn = http.client.HTTPConnection("127.0.0.1", port, timeout=0.8)
            conn.request("GET", "/api/whats-new")
            resp = conn.getresponse()
            body = resp.read(400_000)
            conn.close()
        except Exception:
            return None
        if resp.status == 423:
            return {"port": port, "version": "잠김"}
        if resp.status != 200:
            return None
        try:
            data = json.loads(body.decode("utf-8", "replace"))
        except ValueError:
            return None
        if isinstance(data, dict) and "entries" in data and "version" in data:
            return {"port": port, "version": str(data.get("version") or "")}
        return None

    with concurrent.futures.ThreadPoolExecutor(max_workers=len(ports)) as pool:
        found = [r for r in pool.map(ask, ports) if r]
    return found


def _save_folder_step(step: dict[str, Any], workspace: Any, config: dict[str, Any], web_ui: Any) -> None:
    """'내 컴퓨터에 저장' 폴더에 쓸 수 있는지. Windows 의 '랜섬웨어 방지(제어된 폴더 액세스)' 는 처음 보는 앱이
    문서 폴더에 쓰는 것을 조용히 막는다(PermissionError). 외장 디스크를 저장 위치로 골라 두고 빼면 폴더가 없다."""
    try:
        mode = web_ui.local_autosave_mode(config)
    except Exception:
        mode = "off"
    if mode == "off":
        _set(step, "skip", "'내 컴퓨터에 저장' 꺼짐")
        return
    custom = str(config.get("LOCAL_SAVE_PATH") or "").strip()
    try:
        folder = Path(web_ui.get_local_save_dir(workspace))
    except Exception as exc:
        _set(step, "fail", f"폴더를 정하지 못함 ({type(exc).__name__})", "저장 위치를 다시 골라 주세요.", _fix("storage", "저장 위치 보기"))
        return
    if custom and not Path(custom).exists():
        _set(step, "fail", "고른 폴더가 없음",
             "저장 위치로 고른 폴더가 없어요. 외장 디스크·USB 를 뺐거나 폴더 이름을 바꾼 것 같아요. 다시 꽂거나 저장 위치를 바꿔 주세요.",
             _fix("storage", "저장 위치 바꾸기"), [f"폴더: {custom}"])
        return
    try:
        folder.mkdir(parents=True, exist_ok=True)
        probe_file = folder / f".daling-doctor-{os.getpid()}.tmp"
        probe_file.write_text("ok", encoding="utf-8")
        probe_file.unlink()
    except OSError as exc:
        _set(step, "fail", f"쓰기 실패 ({type(exc).__name__})",
             "자료를 저장할 폴더에 쓸 수 없어요. 백신이나 운영체제의 '랜섬웨어 방지(폴더 보호)' 가 문서 폴더를 막았을 수 있어요. 거기서 Daling 을 허용하거나 저장 위치를 바꿔 주세요.",
             _fix("storage", "저장 위치 바꾸기"), [f"폴더: {folder}", f"오류: {exc}"[:200]])
        return
    try:
        free_mb = shutil.disk_usage(folder).free // (1024 * 1024)
    except OSError:
        free_mb = -1
    cloud = next((p for p in folder.parts if re.search(r"onedrive|icloud|google ?drive|dropbox", p, re.I)), "")
    note = [f"{cloud} 안"] if cloud else []
    if 0 <= free_mb < 300:
        _set(step, "warn", " · ".join([f"남은 공간 {free_mb}MB"] + note), "자료를 저장할 곳의 공간이 넉넉하지 않아요.",
             _fix("storage", "저장 위치 보기"))
    else:
        _set(step, "ok", " · ".join(["쓸 수 있음"] + note + ([f"남은 공간 {free_mb / 1024:.1f}GB"] if free_mb >= 0 else [])))


def worker_check(workspace: Any, web_ui: Any, timeout: int = 40) -> dict[str, Any]:
    """작업 프로세스를 실제 동기화와 같은 모양으로 띄워 본다(web_ui.run_process 와 같은 환경, '--autosaver-job smoke').

    smoke 작업은 데이터 폴더와 비밀번호를 몇 개 풀었는지만 찍고 끝난다 — 로그인하지 않는다.
    """
    import subprocess
    import sys

    from runtime_config import WORKER_FLAG

    if getattr(sys, "frozen", False):
        command = [sys.executable, WORKER_FLAG, "smoke"]
    else:
        command = [sys.executable, str(Path(web_ui.PROJECT_ROOT) / "app.py"), WORKER_FLAG, "smoke"]
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    env["AUTOSAVER_DATA_ROOT"] = str(workspace.root)
    env["AUTOSAVER_CONFIG_PATH"] = str(workspace.config_path)
    handover = None
    try:
        handover = web_ui._secret_handover(workspace)
        if handover is not None:
            from runtime_config import SECRETS_STDIN_FLAG

            env[SECRETS_STDIN_FLAG] = "1"
    except Exception:
        handover = None
    extra: dict[str, Any] = {}
    if os.name == "nt":
        extra["creationflags"] = getattr(subprocess, "CREATE_NO_WINDOW", 0)
    started = time.monotonic()
    try:
        proc = subprocess.run(command, input=handover, capture_output=True, text=True, encoding="utf-8", errors="replace",
                              env=env, timeout=timeout, cwd=str(web_ui.PROJECT_ROOT), **extra)
    except subprocess.TimeoutExpired:
        return {"ok": False, "error": f"{timeout}초 안에 끝나지 않음"}
    except OSError as exc:
        return {"ok": False, "error": f"실행하지 못함 ({type(exc).__name__})", "tail": [str(exc)[:200]]}
    ms = round((time.monotonic() - started) * 1000)
    out = (proc.stdout or "") + (proc.stderr or "")
    line = next((ln for ln in reversed(out.splitlines()) if "smoke-worker ok" in ln), "")
    if proc.returncode != 0 or not line:
        tail = [ln for ln in out.strip().splitlines() if ln.strip()][-6:]
        return {"ok": False, "error": f"종료 코드 {proc.returncode}", "tail": tail, "ms": ms}
    data = re.search(r"data=(.*?) package=", line)
    secrets = re.search(r"secrets=(\d+)/(\d+)", line)
    return {"ok": True, "ms": ms, "data": data.group(1) if data else "",
            "secrets": int(secrets.group(1)) if secrets else None}


def _auto_step(step: dict[str, Any], workspace: Any, config: dict[str, Any], health: dict[str, Any],
               kinds: tuple[str, ...], web_ui: Any, blocked_by: str | None) -> None:
    """자동 확인이 지금 도는지, 언제 다시 하는지. 다음 시도 시각은 app.next_due_job 과 같은 셈이다
    (실패가 쌓일수록 두 배, 최대 6시간 · 실패 뒤 주기 절반은 쉼 · 인터넷 문제는 5분 · 로그인 거절은 2시간)."""
    names = {"emails": "메일", "deadlines": "마감 확인", "sync": "자료 동기화"}
    minutes = web_ui.auto_minutes(config)
    on = [k for k in kinds if int(minutes.get(k, 0) or 0) > 0]
    off = [k for k in kinds if k not in on]
    field = {"emails": "autoEmailMinutes", "deadlines": "autoDeadlineMinutes", "sync": "autoSyncMinutes"}
    if not on:
        _set(step, "warn", "꺼져 있음", "설정에서 자동 확인을 꺼 두어 새로고침을 눌러야만 가져와요.",
             _fix("auto", "자동 확인 켜기", field=field[kinds[0]]))
        return
    # 작업 하나가 끝나지 않고 붙들려 있으면 다음 차례가 영영 오지 않는다
    lane = web_ui.task_key(workspace.user_id, kinds[0])
    with web_ui.task_lock:
        state = dict(web_ui.task_states.get(lane) or {})
    if state.get("running") and state.get("kind") in kinds:
        age = _minutes_since(state.get("startedAt"))
        limit = STUCK_MINUTES.get(str(state.get("kind")), 30)
        if age > limit:
            _set(step, "warn", f"{names.get(str(state.get('kind')), '')} {age:.0f}분째 끝나지 않음",
                 "작업 하나가 끝나지 않고 붙들려 있어 다음 자동 확인이 오지 않아요. 멈추면 곧 다시 해요.",
                 _fix("task", "멈추고 다시 하기", op="stop-task", lane="mail" if kinds == ("emails",) else "main"))
        else:
            _set(step, "ok", f"{names.get(str(state.get('kind')), '')} 하는 중")
        return
    try:
        import background_sync

        if background_sync.busy(Path(workspace.root)):
            _set(step, "ok", "뒤에서 하루 한 번 가져오기 하는 중")
            return
    except Exception:
        pass
    if blocked_by:
        _set(step, "skip", f"앞 단계({blocked_by}) 때문에 건너뜀")
        return
    success = health.get("lastSuccess") or {}
    auth = health.get("authFailed") or {}
    streaks = health.get("failStreak") or {}
    failures = health.get("failures") or {}
    stamp = list(web_ui._file_stamp(Path(workspace.config_path)))
    now = datetime.now()
    waits: list[tuple[datetime, str, str, int]] = []
    for kind in on:
        every = int(minutes[kind])
        locked = auth.get(kind) if isinstance(auth.get(kind), dict) else None
        if locked and locked.get("configStamp") == stamp and _minutes_since(locked.get("at")) < 120:
            waits.append((now + _delta(120 - _minutes_since(locked.get("at"))), kind, "auth", 0))
            continue
        streak = int(streaks.get(kind, 0) or 0)
        mine = failures.get(kind) if isinstance(failures.get(kind), dict) else {}
        failed_at = mine.get("at")
        if not failed_at or not streak:
            continue
        wait = min(max(5, every) * (2 ** max(0, streak - 1)), 360)
        wait = max(wait, max(5, every / 2))
        if mine.get("category") == "network":
            wait = min(wait, 5)
        left = wait - _minutes_since(failed_at)
        if left > 10:
            waits.append((now + _delta(left), kind, "backoff", streak))
    off_note = [f"꺼 둔 것: {', '.join(names[k] for k in off)}"] if off else []
    if waits:
        when, kind, why, streak = max(waits)
        at = when.strftime("%H:%M") if when.date() == now.date() else f"{when.month}월 {when.day}일 {when:%H:%M}"
        if why == "auth":
            _set(step, "warn", " · ".join([f"{names[kind]}: 로그인 거절로 쉬는 중", f"{at}에 다시 해 봐요"] + off_note),
                 "학교 서버가 로그인을 거절해 계정이 잠기지 않게 2시간 쉬어요. 비밀번호를 바꾸면 곧바로 다시 해요.")
        else:
            _set(step, "warn", " · ".join([f"{names[kind]}: {streak}번 실패해 쉬는 중", f"다음 {at}"] + off_note),
                 "실패할수록 다음 시도까지 오래 쉬어요(최대 6시간). 원인을 고쳤으면 지금 바로 가져올 수 있어요.",
                 _fix("task", "지금 가져오기", op="run-now", kind=kind))
        return
    parts = []
    for kind in on:
        every = int(minutes[kind])
        since = _minutes_since(success.get(kind))
        due = now + _delta(every - since) if since != float("inf") else now
        # 이름 뒤에 쌍점: '마감 확인 60분마다' 는 영어 번역 틀 '{0} {1}분마다' 가 '마감'·'확인 60' 으로 잘못 끊었다
        parts.append(f"{names[kind]}: {every}분마다")
        parts.append(f"다음 {due:%H:%M}" if (due - now).total_seconds() > 90 else "곧 다시 확인")
    if kinds == ("emails",) and int(minutes["emails"]) < web_ui.AWAY_EMAIL_MINUTES:
        parts.append("앱을 안 볼 땐 15분마다")
    _set(step, "ok", " · ".join(parts + off_note))


def ai_connections() -> list[dict[str, Any]]:
    """메일 AI 가 쓰는 CLI 들의 로그인 상태 (ai_cli.auth_status, 함께 묻는다). Gemini 는 API 키로만 돼 뺀다."""
    import ai_cli

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        return list(pool.map(ai_cli.auth_status, ("claude", "codex")))


def _ai_step(step: dict[str, Any], rows: list[dict[str, Any]]) -> None:
    installed = [r for r in rows if r.get("installed")]
    if not installed:
        _set(step, "skip", "AI 도구가 설치되어 있지 않음")
        return
    ok = [r for r in installed if r.get("connected") is True]
    expired = [r for r in installed if r.get("connected") is False]
    # 계정 주소는 화면·보고서에 넣지 않는다 (auth_status 의 note 에는 로그인한 주소가 들어 있다)
    bits = [f"{r['label']}: 연결됨" for r in ok] + [f"{r['label']}: 로그인 필요" for r in expired]
    if ok or not expired:
        _set(step, "ok", " · ".join(bits) or "상태를 확인하지 못함")
        return
    names = ", ".join(r["label"] for r in expired)
    _set(step, "warn", " · ".join(bits),
         f"메일 쓰기의 AI 가 쓰는 {names} 로그인이 만료됐어요. 이때 AI 는 'auth·token 실패' 같은 말로 멈춰요. 설정 → AI 연결에서 다시 연결해 주세요.",
         _fix("ai", "AI 다시 연결"))


def _delta(minutes: float):
    from datetime import timedelta

    return timedelta(minutes=max(0.0, float(minutes)))


def _file_mtime(path: Any) -> float:
    try:
        return Path(path).stat().st_mtime
    except OSError:
        return 0.0


def _password_same_as_success(workspace: Any, health: dict[str, Any]) -> bool:
    """마지막으로 메일을 받은 뒤 설정 파일을 고치지 않았는지 (그러면 그때 되던 비밀번호 그대로다)."""
    last = (health.get("lastSuccess") or {}).get("emails")
    if not last:
        return False
    try:
        when = datetime.fromisoformat(str(last)).timestamp()
    except ValueError:
        return False
    return _file_mtime(workspace.config_path) <= when


def _try_mail_login(account: str, password: str, host: str, port: int) -> dict[str, Any]:
    """같이 쓰는 연결로 한 번. 이미 로그인된 연결이 있으면 새로 로그인하지 않는다(email_reader._session_client)."""
    import email_reader

    started = time.monotonic()
    lock = email_reader._SESSION_LOCK
    if not lock.acquire(timeout=20):
        return {"ok": False, "busy": True}
    try:
        with email_reader.imap_session(account, password, host, port) as client:
            # STATUS 는 고른 폴더를 바꾸지 않는다 (EXAMINE 은 같이 쓰는 연결의 폴더를 읽기 전용으로 바꿔 놓는다)
            status, lines = client.cmd("STATUS INBOX (MESSAGES)")
            count = None
            for line, _lit in lines:
                m = re.search(rb"MESSAGES (\d+)", line)
                if m:
                    count = int(m.group(1))
            return {"ok": True, "count": count, "ms": round((time.monotonic() - started) * 1000)}
    except PermissionError as exc:
        reply = re.search(r"\(서버: (.+)\)\s*$", str(exc))
        return {"ok": False, "rejected": True, "reply": reply.group(1) if reply else str(exc),
                "ms": round((time.monotonic() - started) * 1000)}
    except Exception as exc:
        return {"ok": False, "error": f"{type(exc).__name__}: {exc}"[:160], "ms": round((time.monotonic() - started) * 1000)}
    finally:
        lock.release()


def _lms_version() -> dict[str, Any]:
    """로그인 없이 묻는 LMS 판 번호 (/learn/api/public/v1/system/version)."""
    started = time.monotonic()
    try:
        conn = http.client.HTTPSConnection("lms.dgist.ac.kr", 443, timeout=6, context=ssl.create_default_context())
        conn.request("GET", "/learn/api/public/v1/system/version", headers={"Accept": "application/json"})
        resp = conn.getresponse()
        body = resp.read(4000)
        conn.close()
        ms = round((time.monotonic() - started) * 1000)
        if resp.status != 200:
            return {"ok": False, "status": resp.status, "ms": ms}
        learn = (json.loads(body.decode("utf-8", "replace")) or {}).get("learn") or {}
        version = ".".join(str(learn.get(k)) for k in ("major", "minor", "patch") if learn.get(k) is not None)
        return {"ok": True, "version": version, "ms": ms}
    except Exception as exc:
        return {"ok": False, "error": type(exc).__name__}


def _google_step(step: dict[str, Any], token_path: Path) -> None:
    try:
        from google.auth.transport.requests import Request
        from google.oauth2.credentials import Credentials

        creds = Credentials.from_authorized_user_file(str(token_path))
        scopes = set(creds.scopes or [])
        if not creds.valid:
            if not creds.refresh_token:
                _set(step, "fail", "다시 연결이 필요함", "구글 연결이 끊겼어요. 다시 연결해 주세요.", _fix("google", "구글 다시 연결"))
                return
            creds.refresh(Request())  # 새 접속 열쇠만 받아 본다 (파일에는 쓰지 않는다)
        drive = any(s.endswith("/drive.file") or s.endswith("/drive") for s in scopes)
        cal = any("calendar" in s for s in scopes)
        if not drive:
            _set(step, "warn", "연결됨 · Drive 권한 없음",
                 "구글에 연결할 때 Drive 칸을 체크하지 않아 자료를 Drive 에 못 올려요. 다시 연결하면서 체크해 주세요.",
                 _fix("google", "구글 다시 연결"))
            return
        _set(step, "ok", "연결됨 · " + " · ".join(x for x, on in (("Drive", drive), ("캘린더", cal)) if on))
    except Exception as exc:
        text = f"{type(exc).__name__}: {exc}"
        if "invalid_grant" in text or "RefreshError" in text:
            _set(step, "fail", "구글이 연결을 끊음 (invalid_grant)",
                 "구글 계정에서 권한을 해제했거나 오래 안 써서 연결이 끊겼어요. 다시 연결해 주세요.", _fix("google", "구글 다시 연결"))
        else:
            _set(step, "warn", f"확인하지 못함 ({type(exc).__name__})", "", None, [text[:200]])


def _history_step(step: dict[str, Any], health: dict[str, Any], kinds: tuple[str, ...], blocked_by: str | None,
                  web_ui: Any, login_ok: bool = False) -> None:
    """health.json 의 작업별 실패 기록(갈래·서버의 말·마지막 로그)을 읽어 지금도 이어지는 문제인지 말한다."""
    failures = health.get("failures") or {}
    auth = health.get("authFailed") or {}
    success = health.get("lastSuccess") or {}
    rows = [(k, failures.get(k)) for k in kinds if isinstance(failures.get(k), dict)]
    last_ok = max((str(success.get(k)) for k in kinds if success.get(k)), default="")
    when_ok = f"마지막 성공 {web_ui._short_when(last_ok)}" if last_ok else "아직 성공한 적 없음"
    if not rows and not any(k in auth for k in kinds):
        _set(step, "ok", when_ok)
        return
    kind, info = rows[0] if rows else (next(k for k in kinds if k in auth), {})
    names = {"emails": "메일", "sync": "자료 동기화", "deadlines": "마감 확인"}
    count = int(info.get("count", 0) or 0)
    since = web_ui._short_when(info.get("since")) if info.get("since") else "얼마 전"
    reason = str((auth.get(kind) or {}).get("reason") or info.get("reason") or "")
    evidence = [f"서버·오류가 한 말: {reason}"] if reason else []
    evidence += [f"로그: {line}" for line in (info.get("tail") or [])[-6:]]
    # 서버가 로그인을 거절했으면 그것이 까닭이다 (그 뒤 로그에 남은 '사이트에서 못 찾음' 같은 갈래보다 앞선다)
    title = "로그인이 거절됐어요" if kind in auth else (info.get("title") or "알 수 없는 오류가 났어요")
    detail = f"{names.get(kind, kind)}: {since}부터 {count}번 실패 · {title} · {when_ok}"
    if login_ok and kind == "emails":
        _set(step, "ok", detail + " → 지금은 로그인됨", "지난 실패는 풀렸어요.", None, evidence)
        return
    if blocked_by:
        _set(step, "skip", detail, f"앞 단계({blocked_by})가 원인이에요.", None, evidence)
        return
    category = "login" if kind in auth else str(info.get("category") or "unknown")
    fix = {
        "login": _fix("field", "비밀번호 바꾸기", field="lmsPassword" if kind != "emails" else "schoolEmailPassword"),
        "account": _fix("field", "계정 넣기", field="lmsId" if kind != "emails" else "schoolEmail"),
        "site": _fix("update", "업데이트 확인"),
        "drive": _fix("google", "구글 다시 연결"),
        "disk": _fix("storage", "저장 위치 보기"),
        "busy": None,
    }.get(category, _fix("lms-test", "LMS 로그인 다시 시험") if kind != "emails" else _fix("retry", "다시 점검"))
    if category == "login" and kind != "emails":
        cause = ("LMS(학교 포털) 로그인이 거절됐어요. 학교 포털 비밀번호를 바꿨다면 여기도 바꿔 주세요. 바꾼 뒤 'LMS 로그인 다시 시험' 으로 바로 확인할 수 있어요.")
    else:
        cause = str(info.get("hint") or "")
    status = "warn" if category in ("network", "server", "timeout", "busy") else "fail"
    _set(step, status, detail, cause, fix, evidence)


def _recent_server_errors(web_ui: Any) -> list[dict[str, str]]:
    """server_errors.log 에서 사흘 안의 항목 (화면 서버 안에서 잡히지 않은 오류)."""
    try:
        log = Path(web_ui.AUTOSAVER_ROOT) / "server_errors.log"
        if not log.exists():
            return []
        text = log.read_text(encoding="utf-8", errors="replace")[-200_000:]
    except OSError:
        return []
    out = []
    for entry in text.split("\n=== ")[1:]:
        head, _, body = entry.partition("\n")
        stamp = head.split(" ", 1)[0]
        try:
            when = datetime.fromisoformat(stamp)
        except ValueError:
            continue
        if (datetime.now() - when).days >= 3:
            continue
        last_line = next((ln for ln in reversed(body.strip().splitlines()) if ln.strip()), "")
        out.append({"when": web_ui._short_when(stamp), "what": head.split(" ", 2)[-1][:60], "line": _scrub(last_line[:200])})
    return out


ORDER = ["data.folder", "data.config", "secrets", "net.lms", "net.sso", "net.mail", "net.google", "clock",
         "account.mail", "account.lms", "worker", "mail.login", "lms.api", "lms.history", "google", "lms.browser",
         "data.save", "app.copies", "auto.mail", "auto.lms", "data.json", "mail.history", "errors", "ai"]


def _summarize(steps: list[dict[str, Any]], fixed: list[str], mail_reply: str, env: dict[str, Any] | None = None) -> dict[str, Any]:
    """가장 앞에서 막힌 단계가 근본 원인. 인터넷이 모두 끊겼으면 그것 하나로 말한다."""
    rank = {sid: i for i, sid in enumerate(ORDER)}
    fails = sorted((s for s in steps if s["status"] == "fail"), key=lambda s: rank.get(s["id"], 99))
    warns = sorted((s for s in steps if s["status"] == "warn"), key=lambda s: rank.get(s["id"], 99))
    root = fails[0] if fails else None
    net_fails = [s for s in steps if s["id"].startswith("net.") and s["status"] == "fail"]
    if net_fails and len(net_fails) == len([s for s in steps if s["id"].startswith("net.")]):
        root = net_fails[0]
    others = [s for s in fails if s is not root]
    if root:
        headline = f"{root['title']}: {root['detail']}"
    elif warns:
        headline = f"큰 문제는 없어요. 살펴볼 것이 {len(warns)}개 있어요."
    else:
        headline = "모두 정상이에요."
    return {
        "ok": not fails,
        "at": datetime.now().isoformat(timespec="seconds"),
        "headline": headline,
        "root": root["id"] if root else "",
        "others": [s["id"] for s in others],
        "fixed": fixed,
        "mailReply": mail_reply,
        "env": env or {},
        "steps": steps,
    }


def report_text(result: dict[str, Any], version: str = "", os_name: str = "") -> str:
    """'보고서 복사' 글. 비밀번호는 들어가지 않고, 주소·사용자 폴더는 가린다."""
    marks = {"ok": "✓", "warn": "!", "fail": "✗", "skip": "-", "run": "…"}
    lines = [f"Daling 점검 보고서 · {result.get('at', '')}"]
    if version or os_name:
        lines.append(f"버전 {version} · {os_name}".strip(" ·"))
    env = result.get("env") or {}
    if env:
        # 멀리 있는 컴퓨터를 짐작할 단서: 설치 모양 · 시간대 · 프록시 · 이 컴퓨터가 1시간에 메일에 로그인한 횟수
        bits = [str(env.get("install") or ""), f"시간대 {env.get('tz', '?')}", f"프록시 {env.get('proxy', '?')}"]
        if env.get("mailLogins") is not None:
            bits.append(f"메일 로그인 1시간 {env.get('mailLogins')}번")
        lines.append("환경: " + " · ".join(b for b in bits if b))
    lines.append(f"결론: {result.get('headline', '')}")
    root = next((s for s in result.get("steps", []) if s["id"] == result.get("root")), None)
    if root and root.get("cause"):
        lines.append(f"원인: {root['cause']}")
    for item in result.get("fixed") or []:
        lines.append(f"고친 것: {item}")
    lines.append("")
    for s in result.get("steps", []):
        ms = f" ({s['ms']}ms)" if s.get("ms") is not None and "ms" not in str(s.get("detail")) else ""
        lines.append(f"{marks.get(s['status'], '?')} [{s['group']}] {s['title']}: {s['detail']}{ms}")
        if s["status"] in ("fail", "warn") and s.get("cause"):
            lines.append(f"    → {s['cause']}")
        for ev in (s.get("evidence") or [])[:8]:
            lines.append(f"    · {ev}")
    return _scrub("\n".join(lines))


# ───────── 뒤에서 돌리기 · 고치기 ─────────

def start(workspace: Any, force: tuple[str, ...] = (), own_port: int | None = None) -> dict[str, Any]:
    with _LOCK:
        state = _STATE.get(workspace.user_id)
        if state and state.get("running"):
            return snapshot(workspace)
        state = {"running": True, "startedAt": datetime.now().isoformat(timespec="seconds"), "steps": [], "result": None}
        _STATE[workspace.user_id] = state

    def progress(steps: list[dict[str, Any]]) -> None:
        with _LOCK:
            state["steps"] = [dict(s) for s in steps]

    def work() -> None:
        try:
            result = run(workspace, progress, tuple(force), own_port)
        except Exception as exc:  # 점검이 죽으면 그 까닭을 결과로 돌려준다
            import traceback

            result = {"ok": False, "at": datetime.now().isoformat(timespec="seconds"), "headline": f"점검 중 오류: {exc}",
                      "root": "", "others": [], "fixed": [], "steps": state.get("steps") or [],
                      "crash": _scrub(traceback.format_exc()[-1500:])}
        with _LOCK:
            state.update(running=False, result=result, steps=result.get("steps", []))
        _remember(workspace, result)

    threading.Thread(target=work, name="daling-doctor", daemon=True).start()
    return snapshot(workspace)


def snapshot(workspace: Any) -> dict[str, Any]:
    with _LOCK:
        state = _STATE.get(workspace.user_id)
        if not state:
            last = _last(workspace)
            return {"running": False, "steps": (last or {}).get("steps", []), "result": last}
        return {"running": state["running"], "startedAt": state["startedAt"],
                "steps": [dict(s) for s in state.get("steps", [])], "result": state.get("result")}


def _last_path(workspace: Any) -> Path:
    return Path(workspace.root) / "doctor_last.json"


def _remember(workspace: Any, result: dict[str, Any]) -> None:
    """마지막 점검 결과를 남긴다 ('문제 알리기' 메일에 붙고, 앱을 다시 켜도 보인다)."""
    try:
        import web_ui

        web_ui.atomic_write_text(_last_path(workspace), json.dumps(result, ensure_ascii=False, indent=1), encoding="utf-8")
    except Exception:
        pass


def _last(workspace: Any) -> dict[str, Any] | None:
    try:
        data = json.loads(_last_path(workspace).read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else None
    except (OSError, ValueError):
        return None


def last_report(workspace: Any, days: int = 3) -> str:
    """사흘 안의 마지막 점검 보고서 (없으면 빈 글)."""
    data = _last(workspace)
    if not data:
        return ""
    try:
        if (datetime.now() - datetime.fromisoformat(str(data.get("at")))).days >= days:
            return ""
    except ValueError:
        return ""
    return report_text(data)


def apply_fix(workspace: Any, op: str, files: list[str] | None = None, kind: str = "", lane: str = "") -> dict[str, Any]:
    """서버에서 고치는 것들. 설정은 비밀이 아닌 칸(주소·아이디)만 바꾼다 — 비밀번호는 사용자가 설정에서 넣는다."""
    import web_ui

    if op in ("mail-normalize", "mail-domain", "lms-normalize"):
        raw = web_ui.read_json(workspace.config_path, None)
        if not isinstance(raw, dict):
            return {"ok": False, "message": "설정 파일을 읽지 못했어요."}
        key = "LMS_ID" if op == "lms-normalize" else "SCHOOL_EMAIL"
        old = str(raw.get(key) or "")
        new = re.sub(r"\s+", "", unicodedata.normalize("NFKC", old))
        if op == "mail-domain" and new and "@" not in new:
            new += "@dgist.ac.kr"
        if new == old:
            return {"ok": True, "message": "고칠 것이 없었어요."}
        raw[key] = new
        web_ui.atomic_write_text(workspace.config_path, json.dumps(raw, ensure_ascii=False, indent=2), encoding="utf-8")
        kinds = ["sync", "deadlines"] if key == "LMS_ID" else ["emails"]
        web_ui.reset_task_failures(workspace, kinds)
        _MAIL_LOGIN_CACHE.clear()
        shown = mask_email(new) if key == "SCHOOL_EMAIL" else new[:2] + "***"
        return {"ok": True, "message": f"'{shown}' 로 고쳤어요. 다시 점검해 볼게요."}
    if op == "move-broken":
        names = [n for n in (files or []) if n in REBUILDABLE]
        if not names:
            return {"ok": False, "message": "옮길 파일이 없어요."}
        target = Path(workspace.root) / "_broken" / datetime.now().strftime("%Y%m%d-%H%M%S")
        target.mkdir(parents=True, exist_ok=True)
        moved = []
        for name in names:
            src = Path(workspace.root) / name
            if src.exists():
                shutil.move(str(src), str(target / name))
                moved.append(name)
        return {"ok": True, "message": f"{len(moved)}개를 '_broken' 폴더로 옮겼어요. 다음 새로고침이 새로 만들어요.", "moved": moved}
    if op == "run-now" and kind in ("emails", "deadlines", "sync"):
        # 실패가 쌓여 쉬는 중인 작업을 지금 한다. 쉬는 간격은 그대로 두고(실패하면 다시 늘어난다) 한 번만 돌린다
        ok, message = web_ui.start_task(workspace, kind)
        names = {"emails": "메일을 가져오고", "deadlines": "마감을 확인하고", "sync": "자료를 가져오고"}
        return {"ok": ok, "lane": "mail" if kind == "emails" else "main",
                "message": f"{names[kind]} 있어요. 끝나면 다시 점검해 볼게요." if ok else message}
    if op == "stop-task" and lane in ("mail", "main"):
        ok, message = web_ui.stop_task(workspace, lane)
        return {"ok": ok, "message": "붙들린 작업을 멈췄어요. 다음 자동 확인이 곧 다시 해요." if ok else message}
    if op == "lms-test":
        ok, message = web_ui.start_task(workspace, "deadlines")
        return {"ok": ok, "lane": "main", "message": "LMS 에 로그인해 마감을 확인하고 있어요. 끝나면 다시 점검해 볼게요." if ok else message}
    return {"ok": False, "message": "알 수 없는 고치기예요."}
