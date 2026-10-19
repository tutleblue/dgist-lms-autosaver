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


def _calendar(days: int = 21) -> str:
    """오늘부터 며칠의 날짜·요일. 모델이 '다음 주 화요일'을 날짜로 바꿀 때 요일을 틀리지 않게(달력 계산을 맡기지 않는다)."""
    from datetime import date, timedelta

    ko = "월화수목금토일"
    today = date.today()
    return ", ".join(
        f"{d.isoformat()}({ko[d.weekday()]}/{d.strftime('%a')})" for d in (today + timedelta(n) for n in range(days))
    )


# 용건에 무엇이 들어가야 하는지 (교수님께 보내는 메일에서 자주 빠지는 것)
SITUATION_GUIDE = (
    "- 결석·지각·조퇴: 날짜(요일)와 시간, 사유, 학교 공식 행사면 주관 부서·행사 이름, 미리 알리는 것임을 밝히고, "
    "출석 인정(공결)이 되는지와 증빙 서류가 필요한지 정중히 묻는다. 조교에게 먼저 연락했으면 그 사실도.\n"
    "- 과제·시험 연장이나 재응시: 사유, 원래 마감, 바라는 새 마감, 불이익을 감수하겠다는 태도.\n"
    "- 성적·채점 문의: 어느 과제·문항인지, 무엇이 궁금한지. 따지지 말고 확인을 부탁하는 말투.\n"
    "- 수업 내용 질문: 어느 강의·쪽·문제인지 구체적으로, 내가 이해한 데까지.\n"
    "- 면담 요청: 목적, 가능한 시간 2~3개, 장소(연구실·온라인).\n"
    "- 자료·공지 문의: 무엇을 어디서 찾았는데 없었는지."
)


def polish(text: str, lang: str, flow: dict, provider: str | None = None, model: str = "") -> dict:
    """메일 가운데 용건만 다듬는다 (2026-10-19 사용자: AI 는 내용 정리 같은 필요한 곳에만).

    text: 사용자가 대충 적은 용건(한국어 메모여도 된다). 인사·자기소개·마무리·서명은 이미 메일에 있어 쓰지 않는다.
    flow: 받는 사람(이름·교수/조교·외국인)·과목(이름·학수번호·분반) — 화면이 /api/mail/flow 에서 받은 것.
    """
    lang = "en" if lang == "en" else "ko"
    to = flow.get("to") if isinstance(flow.get("to"), dict) else {}
    courses = to.get("courses") if isinstance(to.get("courses"), list) else []
    course = courses[0] if courses and isinstance(courses[0], dict) else {}
    role = {"professor": "교수", "ta": "조교", "staff": "직원"}.get(str(to.get("kind") or ""), "")
    facts = "\n".join(f"- {k}: {v}" for k, v in (
        ("받는 사람", f"{to.get('name') or ''} {role}".strip()),
        ("과목", " / ".join(x for x in (course.get("title"), course.get("titleEn")) if x)),
        ("학수번호", course.get("courseNo")), ("분반", course.get("section")),
    ) if v)
    if lang == "en":
        rule = (
            "Write in natural, polite academic English for a professor. Start with \"I am writing to \" "
            "(if the notes already start that way, continue it). 2-4 short paragraphs, plain sentences, no bullet points. "
            "Typical flow: what happens and when (weekday, date, time) and why -> relevant background "
            "(e.g. already emailed the TA but no reply yet) -> the request (e.g. whether the absence can be excused, "
            "and offer to prepare supporting documents if needed)."
        )
    else:
        rule = (
            "교수님께 보내는 정중한 한국어(합쇼체, 과하지 않게)로. '다름이 아니라 ' 로 시작(메모가 이미 그렇게 시작하면 이어서). "
            "2~4문단, 목록 기호 없이 문장으로. 흐름: 무슨 일이 언제(요일·날짜·시간) 왜 → 관련 사정(예: 조교님께 먼저 메일을 "
            "드렸지만 아직 답을 받지 못함) → 부탁(예: 출석 인정이 가능한지, 필요한 서류가 있으면 바로 준비하겠다)."
        )
    prompt = (
        "당신은 대학생이 교수·조교에게 보내는 메일의 '용건 부분'만 다듬는 비서입니다.\n"
        "인사, 자기소개, 마무리 인사, 서명은 이미 메일에 있으니 절대 쓰지 마세요. 용건 문단만 출력합니다(설명·따옴표 없이).\n"
        f"{rule}\n"
        "메모에 있는 사실(날짜·시간·장소·이름·행사명)은 그대로 쓰고, 없는 사실을 지어내지 마세요. "
        "꼭 필요한데 모르는 것은 [ ] 로 비워 두세요. 요일은 아래 달력으로 맞추세요.\n\n"
        f"[상황별로 들어가면 좋은 것]\n{SITUATION_GUIDE}\n\n"
        f"[달력] {_calendar()}\n\n[받는 사람·과목]\n{facts or '- (모름)'}\n\n"
        f"[학생이 적은 메모]\n{text[:4000]}"
    )
    res = run(prompt, provider, model=model)
    body = res["text"].strip().strip("`").strip()
    # 모델이 그래도 인사·서명을 붙이면 떼어 낸다(이미 메일에 있다)
    lines = body.splitlines()
    while lines and re.match(r"^\s*(dear|hello|hi|안녕하세요)\b", lines[0], re.I):
        lines.pop(0)
    while lines and re.match(r"^\s*(sincerely|best regards|kind regards|regards|.{0,6}드림)\s*,?\s*$", lines[-1], re.I):
        lines.pop()
    return {**res, "text": "\n".join(lines).strip()}


def draft(request: str, profile: dict, context: dict, provider: str | None = None, model: str = "") -> dict:
    """메일 초안 + 받는 사람·참조 추천 (밀착형: 글만 주는 게 아니라 누구에게 보낼지까지).

    profile: 내 정보(이름·학번·소속·소개·서명)
    context: 받는 사람·과목·분반·제목·이미 쓴 글, candidates=[{name,email,role,course,section}] (내 과목 교수·조교)
    답: subject, body, to[], cc[], why — to/cc 는 candidates 안의 주소만 화면이 받아들인다."""
    import json

    me = "\n".join(f"- {k}: {v}" for k, v in (
        ("이름", profile.get("name")), ("영문 이름", profile.get("nameEn")), ("학번", profile.get("studentId")),
        ("소속", profile.get("dept")), ("소속(영문)", profile.get("deptEn")),
        ("학년", f"{profile.get('year')}학년" if str(profile.get("year") or "0") != "0" else ""),
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
        "3) 본문은 정중하고 간결하게: 인사 → 자기소개(소속·학년·이름·학번, 과목·학수번호·분반) → 용건 → 마무리 → 서명. "
        "받는 사람 이름이 로마자(외국인 교수)면 영어로, 한글이면 한국어로 씁니다. 사실을 지어내지 말고 모르는 부분은 [ ] 로 비워 두세요.\n"
        "   영어 꼴: 'Dear Professor <성>,' / 'I hope this email finds you well. My name is <영문 이름> (Student ID: <학번>), "
        "a <first-year> student in the <소속(영문)> taking your <과목> class (<학수번호>, Section <분반>).' / "
        "'I am writing to …' / 'Thank you for your time and understanding.' / 'Sincerely,' 다음 줄부터 영문 이름, 소속, Student ID.\n"
        "   한국어 꼴: '안녕하세요, <이름> 교수님.' / '<과목>(<학수번호>) <분반>분반을 수강 중인 <소속> <학년> <이름>(<학번>)입니다.' / "
        "'다름이 아니라 …' / '바쁘신 와중에 메일 읽어 주셔서 감사합니다.' / '<이름> 드림'.\n"
        f"   상황별로 들어가면 좋은 것:\n{SITUATION_GUIDE}\n   요일은 이 달력으로 맞추세요: {_calendar()}\n"
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
# nameEn: 영문 이름(LMS 가 주지 않아 한글 이름을 로마자로 바꿔 제안하고, 여기 적으면 그 값을 쓴다)
# flow: 메일 쓰기 흐름(회색 글씨) — "off" 면 끔, 빈 값이면 켬
PROFILE_KEYS = ("name", "nameEn", "studentId", "dept", "intro", "signature", "provider", "model", "enabled", "flow")


def load_profile(path: Path) -> dict:
    import json

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return {k: str(data.get(k) or "") for k in PROFILE_KEYS}
    except (OSError, ValueError):
        return {k: "" for k in PROFILE_KEYS}


def save_profile(path: Path, payload: dict) -> dict:
    from runtime_config import atomic_write_json

    # 보낸 키만 바꾼다. 내 정보(설정 '메일에 쓰는 내 정보')와 AI 고르기(설정 'AI 도우미')가 같은 파일을 따로 저장한다
    existing = load_profile(path)
    data = {k: str(payload.get(k, existing.get(k)) or "")[:2000] for k in PROFILE_KEYS}
    if data["provider"] not in PROVIDERS:
        data["provider"] = ""  # 빈 값 = 자동(설치된 것 중 앞에서부터)
    if not _SAFE_MODEL.match(data["model"] or "x"):
        data["model"] = ""
    data["enabled"] = "1" if data["enabled"] in ("1", "true", "True") else ""
    data["flow"] = "off" if data["flow"] == "off" else ""
    atomic_write_json(path, data)
    return data


def enabled(profile: dict) -> bool:
    return profile.get("enabled") == "1"
