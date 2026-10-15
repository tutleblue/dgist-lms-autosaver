"""AI CLI(Claude Code · Gemini CLI · Codex)를 앱 안에서 부른다 — 번역·자연어 검색·메일 초안.

사용자가 'AI CLI 를 탑재해 번역·자연어 검색·메일 초안을 쓰자, Claude·Gemini·Codex 를 모두 고를 수 있게' 해서 넣었다
(2026-10-15). API 키를 앱이 받지 않고, 각 CLI 에 사용자가 이미 로그인한 계정을 그대로 쓴다(키·비밀번호를 앱에
적지 않는다는 원칙과 맞다).

안전장치
- 질문은 명령줄 인자가 아니라 표준입력으로 넘긴다. npm 이 깔아 주는 claude.cmd 같은 배치 파일은 인자에 든
  특수문자를 명령으로 해석할 수 있다(BatBadBut). 인자에는 우리가 정한 고정 문자열만 들어간다.
- 저장소·사용자 폴더가 아닌 빈 임시 폴더에서 돌린다. 도구(파일 쓰기·셸)는 쓰지 않게 막는다.
- 창이 뜨지 않게(CREATE_NO_WINDOW), 시간 제한을 둔다.

실측(2026-10-15, 이 PC): '사과를 영어로?' 한 줄에 claude 9초, codex 10초. gemini 는 로그인이 안 되어 있으면
'Please set an Auth method' 를 내고 바로 끝난다 → '로그인 필요' 로 바꿔 알린다.
"""

from __future__ import annotations

import os
import re
import shutil
import subprocess
import tempfile
import time
from pathlib import Path

PROVIDERS = ("claude", "gemini", "codex")
LABELS = {"claude": "Claude", "gemini": "Gemini", "codex": "Codex"}
TIMEOUT = 180  # 초. 긴 메일 번역도 이 안에 끝났다

_found: dict[str, str | None] = {}


def _which(name: str) -> str | None:
    """npm 전역 설치는 PATH 에 claude.cmd 로 잡힌다. 설치형 앱은 사용자 PATH 를 그대로 물려받는다."""
    if name in _found:
        return _found[name]
    path = shutil.which(name)
    if not path and os.name == "nt":
        npm = Path(os.environ.get("APPDATA", "")) / "npm" / f"{name}.cmd"
        path = str(npm) if npm.exists() else None
    _found[name] = path
    return path


def available() -> dict:
    """설치된 CLI 목록. 설정 화면에 '설치됨/없음' 을 보인다."""
    _found.clear()
    return {p: bool(_which(p)) for p in PROVIDERS}


def pick(provider: str | None) -> str | None:
    """고른 것이 없거나 '자동' 이면 설치된 것 중 앞에서부터."""
    if provider in PROVIDERS and _which(provider):
        return provider
    if provider in PROVIDERS:
        return None  # 골랐는데 없으면 다른 걸로 몰래 바꾸지 않는다
    for p in PROVIDERS:
        if _which(p):
            return p
    return None


class AIError(Exception):
    pass


# ===== 모델 고르기 =====
# 2026-10-15 사용자: 'AI 초안' 대신 'Opus 5.5', 'GPT-6-Astra' 처럼 모델 이름을 보이고 자유롭게 바꾸게.
# Claude 는 별칭(최신 판으로 풀림), Gemini 는 CLI 가 아는 이름, Codex 는 CLI 가 받아 둔 목록(~/.codex/models_cache.json).
CLAUDE_MODELS = [("opus", "Opus 5.5"), ("sonnet", "Sonnet 5.5"), ("fable", "Fable 5.1"), ("haiku", "Haiku 4.5")]
GEMINI_MODELS = [("gemini-2.5-pro", "Gemini 2.5 Pro"), ("gemini-3.1-pro-preview", "Gemini 3.1 Pro"),
                 ("gemini-3.5-flash", "Gemini 3.5 Flash"), ("gemini-2.5-flash", "Gemini 2.5 Flash")]
CODEX_FALLBACK = [("gpt-6.1-sol", "GPT-6.1-Sol"), ("gpt-6-astra", "GPT-6-Astra"), ("gpt-6-luna", "GPT-6-Luna")]
_SAFE_MODEL = re.compile(r"^[A-Za-z0-9._:-]{1,64}$")  # 배치 파일 인자로 넘어가므로 글자를 좁힌다


def _codex_models() -> list[tuple[str, str]]:
    import json

    try:
        data = json.loads((Path.home() / ".codex" / "models_cache.json").read_text(encoding="utf-8"))
        out = [(m["slug"], m.get("display_name") or m["slug"]) for m in data.get("models", [])
               if isinstance(m, dict) and m.get("slug") and m.get("visibility") == "list"]
        return out or CODEX_FALLBACK
    except (OSError, ValueError, KeyError):
        return CODEX_FALLBACK


def _codex_default() -> str:
    try:
        text = (Path.home() / ".codex" / "config.toml").read_text(encoding="utf-8")
        m = re.search(r'^\s*model\s*=\s*"([^"]+)"', text, re.M)
        return m.group(1) if m else ""
    except OSError:
        return ""


def models() -> dict:
    """{provider: {"models": [{id, label}], "default": id}} — 설치된 CLI 만."""
    out = {}
    have = available()
    if have.get("claude"):
        out["claude"] = {"models": [{"id": i, "label": l} for i, l in CLAUDE_MODELS], "default": "opus"}
    if have.get("gemini"):
        out["gemini"] = {"models": [{"id": i, "label": l} for i, l in GEMINI_MODELS], "default": "gemini-2.5-pro"}
    if have.get("codex"):
        cm = _codex_models()
        default = _codex_default() or cm[0][0]
        out["codex"] = {"models": [{"id": i, "label": l} for i, l in cm], "default": default}
    return out


def model_label(provider: str, model: str) -> str:
    for i, l in CLAUDE_MODELS + GEMINI_MODELS + _codex_models():
        if i == model:
            return l
    return model or LABELS.get(provider, "AI")


def _command(provider: str, exe: str, out_file: Path, model: str = "") -> list[str]:
    extra = []
    if model and _SAFE_MODEL.match(model):
        extra = ["--model", model] if provider == "claude" else ["-m", model]
    if provider == "claude":
        # -p 는 표준입력을 질문으로 읽는다. 도구는 쓰지 않는다(답만 받는다).
        return [exe, "-p", "--output-format", "text", *extra,
                "--disallowedTools", "Bash,Edit,Write,MultiEdit,NotebookEdit,WebFetch,WebSearch"]
    if provider == "gemini":
        # -p 의 글은 표준입력 뒤에 붙는다. 고정 문자열만 넣는다.
        return [exe, "-p", "Answer the request above.", "-o", "text", *extra]
    # codex: '-' 는 표준입력에서 지시를 읽는다. 읽기 전용 샌드박스, 마지막 답만 파일로.
    return [exe, "exec", "--skip-git-repo-check", "--ephemeral", "-s", "read-only",
            "--color", "never", *extra, "-o", str(out_file), "-"]


def _explain_failure(provider: str, text: str) -> str:
    low = text.lower()
    if "auth method" in low or "login" in low or "log in" in low or "not logged" in low or "unauthorized" in low:
        return f"{LABELS[provider]} 로그인이 필요해요. 터미널에서 {provider} 를 한 번 실행해 로그인해 주세요."
    if "rate limit" in low or "quota" in low or "usage limit" in low:
        return f"{LABELS[provider]} 사용 한도에 걸렸어요. 잠시 뒤 다시 해 보거나 다른 AI 를 골라 주세요."
    return f"{LABELS[provider]} 가 답하지 못했어요."


def run(prompt: str, provider: str | None = None, timeout: int = TIMEOUT, model: str = "") -> dict:
    """질문을 보내고 답 글을 돌려준다. {ok, text, provider, seconds}"""
    chosen = pick(provider)
    if not chosen:
        if provider in PROVIDERS:
            raise AIError(f"{LABELS[provider]} CLI 가 이 PC 에 없어요. 설정에서 다른 AI 를 고르거나 설치해 주세요.")
        raise AIError("Claude·Gemini·Codex CLI 가 하나도 설치되어 있지 않아요.")
    exe = _which(chosen)
    started = time.time()
    with tempfile.TemporaryDirectory(prefix="daling-ai-") as work:
        out_file = Path(work) / "answer.txt"
        # 고른 모델은 그 CLI 일 때만. 안 골랐으면 화면 단추에 보이는 그 CLI 의 기본 모델(models() default)을 쓴다
        # — CLI 자체 기본값에 맡기면 단추엔 'Opus 5.5' 인데 다른 모델이 답할 수 있었다.
        if not (model and chosen == provider):
            model = (models().get(chosen) or {}).get("default", "")
            provider = chosen
        cmd = _command(chosen, exe, out_file, model)
        kwargs = {}
        if os.name == "nt":
            kwargs["creationflags"] = 0x08000000  # CREATE_NO_WINDOW
        env = dict(os.environ)
        env.setdefault("NO_COLOR", "1")
        try:
            proc = subprocess.run(
                cmd,
                input=prompt.encode("utf-8"),
                capture_output=True,
                cwd=work,
                env=env,
                timeout=timeout,
                **kwargs,
            )
        except subprocess.TimeoutExpired:
            raise AIError(f"{LABELS[chosen]} 가 {timeout}초 안에 답하지 않았어요.")
        except OSError as exc:
            raise AIError(f"{LABELS[chosen]} 를 실행하지 못했어요 ({exc}).")
        stdout = proc.stdout.decode("utf-8", errors="replace")
        stderr = proc.stderr.decode("utf-8", errors="replace")
        if chosen == "codex":
            text = out_file.read_text(encoding="utf-8", errors="replace") if out_file.exists() else ""
        else:
            text = stdout
    text = text.strip()
    if proc.returncode != 0 or not text:
        raise AIError(_explain_failure(chosen, f"{stdout}\n{stderr}"))
    used = model if chosen == provider and model else ""
    return {"ok": True, "text": text, "provider": chosen, "model": used,
            "modelLabel": model_label(chosen, used) if used else LABELS[chosen],
            "seconds": round(time.time() - started, 1)}


# ===== 기능별 질문 =====
# 화면(app.js)이 자료를 모아 보내고, 여기서 질문을 만든다. 답은 글 그대로(번역·초안) 또는 JSON(검색).

def translate(text: str, target: str = "ko", provider: str | None = None, model: str = "") -> dict:
    lang = "한국어" if target == "ko" else "English"
    prompt = (
        f"다음 글을 자연스러운 {lang}로 번역해 주세요. 번역문만 출력하고, 설명·머리말·따옴표는 붙이지 마세요. "
        "줄바꿈과 목록 모양은 살리고, 이름·주소·숫자·날짜·URL 은 그대로 두세요.\n\n"
        f"<<<원문\n{text[:20000]}\n원문>>>"
    )
    return run(prompt, provider, model=model)


def search(query: str, index: list[dict], provider: str | None = None, model: str = "") -> dict:
    """index: [{id, kind, title, sub, date}] — 화면이 가진 메일·자료·과제·일정 목록(줄인 것).
    답은 고른 id 목록(JSON). 모델이 지어낸 id 는 화면에서 걸러진다."""
    import json

    lines = "\n".join(
        f"{it.get('id')}\t{it.get('kind')}\t{it.get('date') or ''}\t{it.get('title') or ''}\t{it.get('sub') or ''}"
        for it in index[:1500]
    )
    prompt = (
        "아래는 대학생 앱의 메일·강의자료·과제·일정 목록입니다(탭으로 구분: id, 종류, 날짜, 제목, 부가정보). "
        "사용자의 찾는 말에 가장 잘 맞는 항목을 최대 8개 고르세요. 오늘 날짜는 "
        f"{time.strftime('%Y-%m-%d')} 입니다. '지난주', '물리' 같은 말은 날짜·과목으로 해석하세요.\n"
        '반드시 JSON 한 줄만 출력하세요: {"ids": ["id1", "id2"], "note": "한 줄 설명(id 번호는 쓰지 말고 20자 안팎)"}\n\n'
        f"찾는 말: {query[:300]}\n\n목록:\n{lines}"
    )
    res = run(prompt, provider, model=model)
    text = res["text"]
    start, end = text.find("{"), text.rfind("}")
    ids, note = [], ""
    if start >= 0 and end > start:
        try:
            data = json.loads(text[start:end + 1])
            ids = [str(x) for x in data.get("ids", [])][:8]
            note = str(data.get("note") or "")[:200]
        except ValueError:
            pass
    return {**res, "ids": ids, "note": note}


def draft(request: str, profile: dict, context: dict, provider: str | None = None, model: str = "") -> dict:
    """메일 초안 + 받는 사람·참조 추천 (밀착형: 글만 주는 게 아니라 누구에게 보낼지까지).

    profile: 내 정보(이름·학번·소속·소개·서명)
    context: 받는 사람·과목·분반·제목·이미 쓴 글, candidates=[{name,email,role,course,section}] (내 과목 교수·조교)
    답: subject, body, to[], cc[], why — to/cc 는 candidates 안의 주소만 화면이 받아들인다."""
    import json

    me = "\n".join(f"- {k}: {v}" for k, v in (
        ("이름", profile.get("name")), ("학번", profile.get("studentId")), ("소속", profile.get("dept")),
        ("자기소개", profile.get("intro")), ("서명", profile.get("signature")),
    ) if v)
    ctx = "\n".join(f"- {k}: {v}" for k, v in (
        ("지금 받는 사람 칸", context.get("to")), ("받는 사람의 역할", context.get("role")),
        ("과목", context.get("course")), ("분반", context.get("section")),
        ("지금 제목 칸", context.get("subject")), ("이미 쓴 내용(답장이면 원문 인용 포함)", context.get("body")),
    ) if v)
    cands = context.get("candidates") if isinstance(context.get("candidates"), list) else []
    cand_lines = "\n".join(
        f"- {c.get('email')} | {c.get('name')} | {c.get('role')} | {c.get('course')} {c.get('section') or ''}".rstrip()
        for c in cands[:80] if isinstance(c, dict) and c.get("email")
    )
    prompt = (
        "당신은 대학생의 메일 비서입니다. 아래 정보를 보고 교수·조교·학교 부서에 보낼 메일을 완성해 주세요.\n"
        "1) 받는 사람(to)과 참조(cc)를 '후보' 목록에서 고르세요. 예: 과목 일로 교수님께 보내면 그 과목 조교를 참조로, "
        "조교에게 보내면 필요할 때만 교수님을 참조로. 지금 받는 사람 칸이 이미 맞으면 그대로 두세요. 후보에 없는 주소는 쓰지 마세요.\n"
        "2) 제목은 '[과목 분반] 학번 이름 용건' 꼴로 짧게.\n"
        "3) 본문은 정중하고 간결하게: 인사 → 자기소개(소속·학번·이름, 과목·분반) → 용건 → 마무리 → 서명. "
        "받는 사람이 외국인 교수(영문 이름)면 영어로 씁니다. 사실을 지어내지 말고 모르는 부분은 [ ] 로 비워 두세요.\n"
        '출력은 JSON 한 줄만: {"to": ["주소"], "cc": ["주소"], "why": "누구에게 왜(한 줄)", "subject": "제목", "body": "본문(줄바꿈 \n)"}\n\n'
        f"[내 정보]\n{me or '- (입력 안 됨)'}\n\n[상황]\n{ctx or '- (없음)'}\n\n"
        f"[후보: 주소 | 이름 | 역할 | 과목 분반]\n{cand_lines or '- (없음)'}\n\n"
        f"[쓰고 싶은 내용]\n{request[:2000]}"
    )
    res = run(prompt, provider, model=model)
    text = res["text"]
    out = {"subject": "", "body": text, "to": [], "cc": [], "why": ""}
    start, end = text.find("{"), text.rfind("}")
    if start >= 0 and end > start:
        try:
            data = json.loads(text[start:end + 1])
            allowed = {str(c.get("email", "")).lower() for c in cands if isinstance(c, dict)}
            pick_mails = lambda xs: [str(x).strip() for x in (xs or []) if str(x).strip().lower() in allowed][:5]
            out = {
                "subject": str(data.get("subject") or ""),
                "body": str(data.get("body") or text),
                "to": pick_mails(data.get("to")),
                "cc": pick_mails(data.get("cc")),
                "why": str(data.get("why") or "")[:200],
            }
        except ValueError:
            pass
    return {**res, **out}


# ===== 내 정보 (메일 초안에 매번 쓰는 학번·소개) =====
# enabled: 실험실 스위치. "1" 이면 켬, 빈 값이면 끔(처음엔 꺼져 있다 — 2026-10-15 사용자: 실험실 기능으로, 껐다 켤 수 있게)
PROFILE_KEYS = ("name", "studentId", "dept", "intro", "signature", "provider", "model", "enabled")


def load_profile(path: Path) -> dict:
    import json

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return {k: str(data.get(k) or "") for k in PROFILE_KEYS}
    except (OSError, ValueError):
        return {k: "" for k in PROFILE_KEYS}


def save_profile(path: Path, payload: dict) -> dict:
    from runtime_config import atomic_write_json

    data = {k: str(payload.get(k) or "")[:2000] for k in PROFILE_KEYS}
    if data["provider"] not in PROVIDERS:
        data["provider"] = ""  # 빈 값 = 자동(설치된 것 중 앞에서부터)
    if not _SAFE_MODEL.match(data["model"] or "x"):
        data["model"] = ""
    data["enabled"] = "1" if data["enabled"] in ("1", "true", "True") else ""
    atomic_write_json(path, data)
    return data


def enabled(profile: dict) -> bool:
    return profile.get("enabled") == "1"
