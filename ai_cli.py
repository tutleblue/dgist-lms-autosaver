"""AI CLI(Claude Code · Gemini CLI · Codex)를 앱 안에서 부른다 — 번역·자연어 검색·메일 쓰기·고치기.

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
import sys
import tempfile
import time
from pathlib import Path

PROVIDERS = ("claude", "gemini", "codex")
LABELS = {"claude": "Claude", "gemini": "Gemini", "codex": "Codex"}
TIMEOUT = 180  # 초. 긴 메일 번역도 이 안에 끝났다

_found: dict[str, str | None] = {}


def _unix_bin_dirs() -> list[Path]:
    """맥·리눅스에서 PATH 밖에 CLI 가 있을 만한 곳.

    맥에서 Finder·Dock 으로 켠 앱은 PATH 가 /usr/bin:/bin:/usr/sbin:/sbin 뿐이다(터미널의 셸 설정을 읽지 않는다).
    그래서 터미널에서는 되는 claude 를 앱은 '없음' 으로 봤다. 공식 설치 스크립트·Homebrew·npm 전역·nvm 자리를 직접 본다.
    """
    home = Path.home()
    dirs = [
        home / ".local" / "bin",          # Claude Code 공식 설치 스크립트
        home / ".claude" / "local",       # 예전 Claude Code 설치 자리
        Path("/opt/homebrew/bin"),        # Homebrew (M칩 맥)
        Path("/usr/local/bin"),           # Homebrew (인텔 맥)·npm 기본 전역
        home / ".npm-global" / "bin",
        home / ".volta" / "bin",
        home / ".bun" / "bin",
    ]
    # nvm 은 판마다 따로 깔린다. 새 판부터
    dirs += sorted((home / ".nvm" / "versions" / "node").glob("*/bin"), reverse=True)
    return [d for d in dirs if d.is_dir()]


def _which(name: str) -> str | None:
    """npm 전역 설치는 PATH 에 claude.cmd 로 잡힌다. 설치형 앱은 사용자 PATH 를 그대로 물려받는다(Windows)."""
    if name in _found:
        return _found[name]
    path = shutil.which(name)
    if not path and os.name == "nt":
        npm = Path(os.environ.get("APPDATA", "")) / "npm" / f"{name}.cmd"
        path = str(npm) if npm.exists() else None
    elif not path:
        path = shutil.which(name, path=os.pathsep.join(map(str, _unix_bin_dirs())))
    _found[name] = path
    return path


def _child_path(exe: str) -> str:
    """맥·리눅스에서 CLI 를 돌릴 때의 PATH. npm 으로 깐 CLI 는 '#!/usr/bin/env node' 라서 node 가 있는 곳도 있어야 한다."""
    parts = [str(Path(exe).parent)] + [str(d) for d in _unix_bin_dirs()] + os.environ.get("PATH", "").split(os.pathsep)
    seen: set[str] = set()
    return os.pathsep.join(p for p in parts if p and not (p in seen or seen.add(p)))


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


# 로그인을 다시 하는 법 (CLI 마다 다르다). 2026-11-04 사용자: '터미널로 안내하지 말고 설정창에서 연결하게'
LOGIN_HOW = {
    "claude": "설정 → AI 연결에서 Claude 를 다시 연결",
    "gemini": "Claude 나 Codex 로 바꾸어 사용",
    "codex": "설정 → AI 연결에서 Codex 를 다시 연결",
}


# ===== 연결(로그인) =====
# 앱은 키·비밀번호를 받지 않고 각 CLI 의 로그인을 그대로 쓴다. 설정 화면이 상태를 보이고, '연결' 을 누르면
# 그 CLI 의 로그인 명령을 보이는 터미널 창에서 띄운다(브라우저가 열리고 사용자가 직접 로그인한다).
# 실측(2026-11-04, 이 PC):
# - claude 2.x: 'claude auth status --json' → {"loggedIn": false, "authMethod": "none", …}, 로그인은 'claude auth login'
# - codex: 'codex login status' → 'Logged in using ChatGPT' / 'Not logged in', 로그인은 'codex login'
# - gemini 0.62: 로그인 명령이 없고, 구글 개인 계정 로그인은 'This client is no longer supported for Gemini Code
#   Assist for individuals'(IneligibleTierError)로 막혔다 → API 키로만 된다. 앱은 API 키 칸을 두지 않는다
#   (2026-10-21·11-04 사용자: 'API 키 넣기는 다 빼라'). 사용자가 운영체제 환경 변수에 GEMINI_API_KEY 를 둔 경우만 쓸 수 있다.
#   창 없이 돌릴 때는 폴더 신뢰 질문이 막으므로 GEMINI_CLI_TRUST_WORKSPACE.


def _quiet_kwargs() -> dict:
    return {"creationflags": 0x08000000} if os.name == "nt" else {}  # CREATE_NO_WINDOW


def _cli_env(provider: str, exe: str) -> dict:
    env = dict(os.environ)
    if sys.platform.startswith("linux") and getattr(sys, "frozen", False):
        # 리눅스 묶음 앱은 LD_LIBRARY_PATH 가 묶음 안을 가리킨다 — node(claude·gemini·codex)가 묶음의 옛 libstdc++ 를
        # 집어 죽을 수 있어, 브라우저·xdg-open 처럼 원래 환경으로 띄운다(2026-10-21 맥·리눅스 점검)
        try:
            import linux_support

            env = linux_support.system_env()
        except Exception:
            pass
    if os.name != "nt":
        env["PATH"] = _child_path(exe)
    env.setdefault("NO_COLOR", "1")
    if provider == "gemini":
        env["GEMINI_CLI_TRUST_WORKSPACE"] = "true"
    return env


def auth_status(provider: str) -> dict:
    """{provider, label, installed, connected(True/False/None=모름), note}. 네트워크를 쓰지 않는 상태 명령만 부른다."""
    out = {"provider": provider, "label": LABELS[provider], "installed": False, "connected": None, "note": ""}
    exe = _which(provider)
    if not exe:
        out["note"] = "이 컴퓨터에 설치되어 있지 않아요"
        return out
    out["installed"] = True
    if provider == "gemini":
        has_key = bool(os.environ.get("GEMINI_API_KEY"))
        out["connected"] = has_key
        out["blocked"] = not has_key
        out["note"] = "연결됨" if has_key else "구글이 개인 계정 로그인을 막아 지금은 쓸 수 없어요"
        return out
    cmd = [exe, "auth", "status", "--json"] if provider == "claude" else [exe, "login", "status"]
    try:
        proc = subprocess.run(cmd, capture_output=True, stdin=subprocess.DEVNULL, timeout=25,
                              env=_cli_env(provider, exe), **_quiet_kwargs())
    except (subprocess.TimeoutExpired, OSError) as exc:
        out["note"] = f"상태를 확인하지 못했어요 ({type(exc).__name__})"
        return out
    text = (proc.stdout + proc.stderr).decode("utf-8", errors="replace")
    if provider == "claude":
        import json

        try:
            data = json.loads(proc.stdout.decode("utf-8", errors="replace"))
        except ValueError:
            data = {}
        if isinstance(data, dict) and "loggedIn" in data:
            out["connected"] = bool(data.get("loggedIn"))
            who = data.get("email") or data.get("account") or ""
            out["note"] = (f"{who} 로 로그인됨" if who else "로그인됨") if out["connected"] else "로그인이 필요해요"
        else:
            out["note"] = "상태를 확인하지 못했어요"
        return out
    low = text.lower()
    if "not logged in" in low:
        out["connected"], out["note"] = False, "로그인이 필요해요"
    elif "logged in" in low:
        out["connected"] = True
        out["note"] = "ChatGPT 계정으로 로그인됨" if "chatgpt" in low else "로그인됨"
    else:
        out["note"] = "상태를 확인하지 못했어요"
    return out


def open_login(provider: str) -> dict:
    """그 CLI 의 로그인 명령을 보이는 터미널 창에서 띄운다. 로그인은 사용자가 브라우저에서 직접 한다."""
    if provider not in ("claude", "codex"):
        raise AIError("이 AI 는 로그인 창이 없어요.")
    exe = _which(provider)
    if not exe:
        raise AIError(f"{LABELS[provider]} CLI 가 이 컴퓨터에 없어요.")
    args = ["auth", "login"] if provider == "claude" else ["login"]
    title = f"{LABELS[provider]} 로그인 - 브라우저에서 로그인한 뒤 이 창을 닫으세요"
    if os.name == "nt":
        # 보이는 콘솔 창(CREATE_NEW_CONSOLE). exe 는 _which 가 찾은 경로, 나머지는 고정 문자열이라 인자 해석 걱정이 없다
        line = f'title {title} & "{exe}" {" ".join(args)} & echo. & pause'
        # 목록으로 넘기면 파이썬이 안쪽 따옴표를 \" 로 바꾸는데 cmd 는 그걸 모른다 → 한 줄 그대로 넘긴다
        subprocess.Popen(f"cmd.exe /c {line}", creationflags=0x00000010, cwd=str(Path.home()))
        return {"ok": True}
    import shlex

    command = f"cd ~ && {shlex.join([exe, *args])}"
    if sys.platform == "darwin":
        # 터미널.app 에 명령을 넘긴다. 글은 osascript 인자로만(문자열을 스크립트에 끼우지 않는다)
        script = ('on run argv\ntell application "Terminal"\nactivate\ndo script (item 1 of argv)\n'
                  'end tell\nend run')
        subprocess.Popen(["osascript", "-e", script, command])
        return {"ok": True}
    env = _cli_env(provider, exe)
    for term, flag in (("x-terminal-emulator", "-e"), ("gnome-terminal", "--"), ("konsole", "-e"), ("xterm", "-e")):
        found = shutil.which(term)
        if found:
            subprocess.Popen([found, flag, "sh", "-c", command + "; echo; read -r _"], env=env)
            return {"ok": True}
    raise AIError(f"터미널을 찾지 못했어요. 터미널에서 {shlex.join([Path(exe).name, *args])} 를 실행해 주세요.")


def _explain_failure(provider: str, text: str) -> str:
    low = text.lower()
    if provider == "gemini" and ("ineligibletier" in low or "no longer supported" in low or "gemini_api_key" in low
                                 or "auth method" in low or "api key" in low):
        return "Gemini 는 구글이 개인 계정 로그인을 막아 지금은 쓸 수 없어요. 메일 쓰기 창의 모델 단추에서 Claude 나 Codex 를 골라 주세요."
    # 2026-11-04: Claude CLI 가 'Failed to authenticate: OAuth session expired and could not be refreshed' 로 끝났는데
    # 아래 낱말 어디에도 안 걸려 'Claude 가 답하지 못했어요' 만 떴다 — 메일의 /ai 가 그냥 안 되는 것처럼 보였다
    if any(word in low for word in ("auth method", "login", "log in", "not logged", "unauthorized", "authenticate",
                                    "oauth", "session expired", "token expired", "credentials")):
        return (f"{LABELS[provider]} 로그인이 만료됐어요. {LOGIN_HOW[provider]}하거나, "
                "메일 쓰기 창의 모델 단추에서 다른 AI 를 골라 주세요.")
    if "rate limit" in low or "quota" in low or "usage limit" in low:
        return f"{LABELS[provider]} 사용 한도에 걸렸어요. 잠시 뒤 다시 해 보거나 다른 AI 를 골라 주세요."
    # 그 밖의 실패는 CLI 가 한 말 첫 줄을 붙인다 (무엇 때문인지 알 수 있게). 'Denying Bash …' 같은 경고 줄은 뺀다
    said = next((line.strip() for line in text.splitlines()
                 if line.strip() and not re.search(r"^(Denying|Permission deny rule|Warning)", line.strip())), "")
    return f"{LABELS[provider]} 가 답하지 못했어요" + (f" ({said[:140]})." if said else ".")


def run(prompt: str, provider: str | None = None, timeout: int = TIMEOUT, model: str = "") -> dict:
    """질문을 보내고 답 글을 돌려준다. {ok, text, provider, seconds}"""
    chosen = pick(provider)
    if not chosen:
        if provider in PROVIDERS:
            raise AIError(f"{LABELS[provider]} CLI 가 이 PC 에 없어요. 설정에서 다른 AI 를 고르거나 설치해 주세요.")
        raise AIError("Claude·Gemini·Codex CLI 가 하나도 설치되어 있지 않아요.")
    exe = _which(chosen)
    started = time.time()
    # ignore_cleanup_errors: CLI 가 띄운 자식 프로세스가 아직 이 폴더를 잡고 있으면 Windows 가 지우기를 막아(WinError 32)
    # 이미 받은 답을 버리고 오류로 끝났다(2026-11-11 실측 — 메일 AI 를 여럿 동시에 돌릴 때). 남은 빈 폴더는 임시 폴더라 둔다
    with tempfile.TemporaryDirectory(prefix="daling-ai-", ignore_cleanup_errors=True) as work:
        out_file = Path(work) / "answer.txt"
        # 고른 모델은 그 CLI 일 때만. 안 골랐으면 화면 단추에 보이는 그 CLI 의 기본 모델(models() default)을 쓴다
        # — CLI 자체 기본값에 맡기면 단추엔 'Opus 5.5' 인데 다른 모델이 답할 수 있었다.
        if not (model and chosen == provider):
            model = (models().get(chosen) or {}).get("default", "")
            provider = chosen
        cmd = _command(chosen, exe, out_file, model)
        kwargs = _quiet_kwargs()
        env = _cli_env(chosen, exe)
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


# 번역투 막기 (2026-11-10 사용자: AI 옆 창에 '번역체 같은 것 없애고'). 질문·보기·한 줄 설명·본문 모두에 붙인다.
# '자연스럽게' 를 '편하게' 로 읽고 메일 본문을 해요체로 쓴 일이 있어(2026-11-11 사용자: '형식이 전혀 formal 하지 않다')
# 본문의 격식은 아래 FORMAL_RULES 가 정한다고 못 박는다
NATURAL_KO = (
    "[말투] 번역투 없는 자연스러운 한국어로 씁니다(메일 본문은 아래 [격식]대로 합쇼체). 번역투를 쓰지 마세요: '~에 대해(서)', "
    "'~하는 것이 가능합니다', '~되어지다', '~를 통해', '~에 있어서', '~하는 중에 있습니다', '당신', 주어 '저는/제가' 되풀이."
)

# 메일 격식 (2026-11-11 사용자: '제목이나 내용이나 형식을 명확히 정해서 규칙처럼 지켜지면 좋겠어').
# 새로 쓰기·고치기·끌어 고치기 세 곳에 같은 글을 넣고, 본문은 _formal_issues 로 한 번 더 본다(어기면 한 번 고쳐 쓴다).
# 같은 날 사용자가 준 '대학생을 위한 이메일 작성법 — 한국어·영어 이론과 예시'(연세대 IDOL Lab·국립국어원·링커리어·
# Biesenbach-Lucas 2007·Inside Higher Ed 등을 정리한 글)를 줄여 넣었다: 제목 꼴 '[과목 분반] 용건_학번 이름' /
# '용건 – 과목 코드', 결론 먼저(BLUF), 부탁이 클수록 간접적으로, 윗사람에게 틀리는 말, 영어 상투어.
FORMAL_RULES = (
    "[격식 — 반드시 지킵니다. 받는 사람은 교수·조교·연구원·교직원입니다]\n"
    "제목 — 열기 전에 용건을 알 수 있게. 메일 하나에 용건 하나\n"
    "- 한국어: '[과목명 분반] 용건_학번 이름' (예: '[일반물리학 02분반] 6주차 과제 3번 문항 조건 질문_202612345 홍길동',\n"
    "  '[일반화학 01분반] 11/10(화) 결석 관련 출석인정 요청_202612345 홍길동'). 과목 일이 아니면 [ ] 에 용건 갈래를 씁니다\n"
    "  ('[국가근로장학] 2학기 근로일지 제출 방법 문의_202612345 홍길동', '[학부연구생 문의] 2027년 겨울방학 참여 희망_기초학부 1학년 홍길동').\n"
    "  용건은 '…질문·문의·요청·확인 요청·제출' 같은 명사형으로 끝냅니다. 급하면 느낌표 대신 날짜·시각을 넣습니다.\n"
    "  '~요'·'?'·'!'·'~'·이모티콘·'ㅠ'·'급해요'·'꼭 읽어 주세요' 는 쓰지 않습니다. 답이 없어 다시 보내는 메일은 앞에 '[재문의]'.\n"
    "- 영어: '용건(Title Case) – 과목 코드 (Section 분반)' (예: 'Question about Problem 3, HW 6 – PHYS 101 (Section 02)',\n"
    "  'Request for a Meeting about My Midterm Exam – CHEM 101 (Section 01)'). 과목 일이 아니면 용건만, 행정 부서면 끝에\n"
    "  '– Student ID 학번'. 'Hi'·'Hey professor'·'Quick question'·느낌표·이모티콘 금지. 다시 보내면 앞에 'Follow-up: '.\n"
    "- 답장(제목이 'Re:' 로 시작)은 제목을 바꾸지 않습니다.\n"
    "본문 — 받는 사람이 한 번 읽고 바로 처리할 수 있게\n"
    "- 결론 먼저: 용건 첫 문장에 무엇을 바라는지 한 문장으로(예: '…가능할지 여쭙고자 메일 드립니다', 'I am writing to ask whether…').\n"
    "  이어서 근거·사정(학생이 이미 확인한 자료가 있으면 그것), 끝에 상대가 해 줄 일과 기한. 사정은 큰 틀만, 한 화면 안에.\n"
    "- 날짜는 '오늘·내일·이번 주' 대신 '11월 18일(수)' / 'on Wednesday, November 18' 처럼 씁니다. 상대가 기억한다고 가정하지 않습니다\n"
    "  ('지난번 말씀하신 건' 대신 '10월 30일 면담에서 말씀하신 기말 프로젝트 주제 변경 건').\n"
    "- 부탁이 클수록 간접적으로, 상대가 거절할 여지를 남깁니다. 간단한 확인은 '…알려 주실 수 있을까요?' / 'Could you let me know…?',\n"
    "  면담·자료는 '…가능할지 여쭙고 싶습니다' / 'Would it be possible for me to…?', 연장·추천서·예외는 '…해 주실 수 있을지\n"
    "  조심스럽게 여쭙습니다', '어려우시다면 괜찮습니다' / 'I was wondering if…', 'I completely understand if…'.\n"
    "  재촉·명령('빨리 답장 부탁드려요', '오늘까지 해 주세요', 'Please answer me as soon as possible')은 쓰지 않습니다.\n"
    "- 성적은 올려 달라가 아니라 채점 기준을 확인하고 싶다고, 결석 뒤에는 '무엇을 놓쳤는지' 묻지 말고 스스로 보충하겠다고 씁니다.\n"
    "- 한국어: 평서문은 합쇼체('-습니다·-ㅂ니다·-드립니다·-겠습니다'). 물음·부탁은 '…주실 수 있을까요?'·'…여쭤도 될까요?' 도 됩니다.\n"
    "  해요체 평서문('-어요·-해요·-죠'), 반말, 구어('좀'·'너무'·'진짜'·'되게'), 줄임말, 이모티콘, 'ㅠㅠ'·'ㅎㅎ', '!'·'~' 는 쓰지 않습니다.\n"
    "  윗사람에게 틀리는 말도 쓰지 않습니다: '수고하세요', '좋은 밤 되세요', 사물 높임('파일 첨부되셨습니다' → '파일을 첨부했습니다'),\n"
    "  '…로부터'. 지나친 겸양·옛말('말씀 올리옵니다')도 피합니다. 맞춤법: 됐습니다·봬요·며칠·말씀드립니다·학생으로서·교수님께.\n"
    "- 영어: formal academic register. 줄임꼴(I'm, don't, can't, I'll), 'I want…', 'Hey', 'gonna', 'Thx', 'Thanks in advance',\n"
    "  'Sorry for disturbing you' 되풀이, 느낌표·이모티콘은 쓰지 않습니다. 'Thanks for…' 보다 'Thank you for…'.\n"
    "- 학생이 '친근하게'·'편하게' 처럼 말투를 정하면 그 말을 따릅니다."
)

# 인사·자기소개·맺음 (2026-11-11 사용자: '인삿말, 끝말이 정형화해서 모든 것을 같게 하지 말고, 맥락과 대상과 본문의
# 내용에 맞게'). 예전엔 앱이 받는 사람 갈래(교수·조교·그 밖)마다 한 문장씩 정해 붙여, 질문이든 결석이든 답장이든
# 끝이 늘 '바쁘신 와중에 읽어 주셔서 감사합니다. 늘 건강하시고 좋은 하루 보내십시오.' 였다. 이제 호칭 줄(○○ 교수님께,)과
# 이름·학번 서명만 앱이 붙이고(틀리면 안 되는 사실), 그 사이 인사·소개·맺음은 모델이 용건에 맞게 쓴다.
FRAME_RULES = (
    "[인사·자기소개·맺음 — 받는 사람·사이·용건에 맞게. 늘 같은 문장으로 쓰지 않습니다]\n"
    "- 호칭 줄('김민수 교수님께,' / 'Dear Professor Kim,')과 이름·학번 서명 줄은 앱이 붙이니 쓰지 마세요.\n"
    "- hello(호칭 다음 인사 한 줄): 한국어는 받는 사람에 맞게 — 교수 '교수님, 안녕하십니까.'·'안녕하십니까.', 조교 '조교님, 안녕하세요.',\n"
    "  교직원 '안녕하십니까.'·'안녕하세요.'. 답장이면 받은 메일을 이어받는 짧은 인사도 됩니다('교수님, 답변 감사합니다.').\n"
    "  영어는 보통 빈칸(호칭 다음 바로 소개). 'I hope this email finds you well.' 은 상투어라 기본으로 넣지 않습니다.\n"
    "- intro(자기소개): 처음 연락하거나 교수님께 보내면 '일반물리학 02분반 수강생 홍길동(202612345)입니다.' 처럼 과목·분반·이름·학번을\n"
    "  [내 정보]의 값 그대로 한 문장. 연구실·행정 부서면 소속·학년·이름(·학번). 이미 주고받는 답장이면 '일반물리학 02분반 홍길동입니다.'\n"
    "  처럼 짧게 하거나 빈칸. 영어 'I am Gildong Hong, a first-year student in your PHYS 101 class (Section 02).' — 'My name is' 만 되풀이하지 않습니다.\n"
    "- closing(맺음 문장 1~2줄)은 용건에 맞게 고릅니다: 질문 '바쁘신 중에 읽어 주셔서 감사합니다.', 부탁·면담 '시간 내어 검토해 주시면\n"
    "  감사하겠습니다.', 결석 '놓친 수업 내용은 강의자료로 보충하겠습니다. 감사합니다.', 제출·확인 '확인 부탁드립니다. 감사합니다.',\n"
    "  감사 답장 '덕분에 많이 배웠습니다.', 답장 '말씀해 주신 대로 준비하겠습니다.' 같은 식.\n"
    "  예시를 그대로 옮기지 말고 이 메일의 일에 닿게 씁니다(감점 문의 → '알려 주시면 다음 보고서부터 반영하겠습니다.',\n"
    "  서류 문의 → '안내해 주시는 대로 기한 안에 제출하겠습니다.'). 인사·용건·맺음에서 같은 감사를 두 번 하지 않습니다\n"
    "  (인사가 '답변 감사합니다' 면 맺음은 감사 없이 할 일만, 용건 끝에 할 일을 이미 썼으면 맺음은 '감사합니다.' 한 마디).\n"
    "  영어: 'Thank you for your time.' / 'Thank you for considering my request.' / 'Thank you for your help.' / 'I look forward to hearing from you.'\n"
    "  '늘 건강하시고 좋은 하루 보내십시오' 같은 축원은 매번 붙이지 않습니다.\n"
    "- signoff: 한국어 '올림'(교수님, 첫 연락·부탁) 또는 '드림'(조교·교직원·짧은 답장). 영어 'Sincerely,'(첫 연락·큰 부탁·격식) /\n"
    "  'Best regards,'(무난) / 'Best,'(이미 주고받는 가벼운 답장)."
)

# 학생이 말투를 편하게 하라고 했으면 격식 검사를 하지 않는다
_CASUAL_ASK = re.compile(r"친근|편하게|편한\s*말|반말|캐주얼|가볍게|casual|friendly|informal", re.I)
_EMOJI = re.compile("[\U0001F300-\U0001FAFF☀-➿]")
# '-신지요·-는지요·-을지요' 는 편지글에 쓰는 높임 물음이라 둔다. '…주실 수 있을까요?'·'여쭤도 될까요?' 도 메일 작성법
# 글(2026-11-11)이 교수님께 쓰는 부탁 물음으로 권하는 꼴이라 둔다
_KO_POLITE_YO = re.compile(r"((신지|실지|는지|은지|을지|ㄹ지|인지|런지)요|까요)$")
_EN_CASUAL = re.compile(r"\b(i'm|i've|i'll|i'd|don't|doesn't|didn't|can't|won't|isn't|aren't|wasn't|it's|that's|hey|gonna|wanna|thanks a lot)\b", re.I)


def _formal_issues(text: str, lang: str = "") -> list[str]:
    """메일 글에서 격식에 어긋난 문장(해요체·반말 끝맺음, 이모티콘, ㅠ·ㅎ, 느낌표, 영어 줄임꼴)을 찾는다. [ ] 빈칸·인용은 본다."""
    out: list[str] = []
    for raw in re.split(r"(?<=[.?!])\s+|\n+", text or ""):
        s = raw.strip()
        if len(s) < 4 or s.startswith(">"):
            continue
        core = re.sub(r"[\s\]\[)(\"'”’.?!~]+$", "", s)
        bad = bool(_EMOJI.search(s)) or bool(re.search(r"[ㅠㅜㅎㅋ]{2,}", s)) or "!" in s
        if re.search(r"안녕하세요$", core):
            continue  # 첫인사는 학생이 정한 꼴(mail_flow)이고 메일에서 흔히 쓰는 높임이라 둔다
        if re.search(r"[가-힣]", s):
            if (core.endswith("요") and not _KO_POLITE_YO.search(core)) or core.endswith("죠") or s.rstrip().endswith("~"):
                bad = True
        elif lang != "ko" and _EN_CASUAL.search(s):
            bad = True
        if bad:
            out.append(s[:160])
    return out[:8]


def _formalize(text: str, issues: list[str], lang: str, provider: str | None, model: str) -> str:
    """격식에 어긋난 문장만 고쳐 쓴다(나머지는 그대로). 실패하면 원래 글."""
    prompt = (
        "다음은 대학생이 교수·조교에게 보낼 메일 글입니다. [고칠 문장]만 아래 [격식]에 맞게 고치고, 나머지 글은 한 글자도 바꾸지 마세요.\n"
        "뜻·사실·[ ] 빈칸·줄바꿈은 그대로 둡니다. 출력은 고친 글 전체만(설명·따옴표·코드 블록 없이).\n\n"
        f"{FORMAL_RULES}\n\n[고칠 문장]\n" + "\n".join(f"- {s}" for s in issues)
        + f"\n\n[메일 글]\n<<<\n{text}\n>>>"
    )
    try:
        res = run(prompt, provider, model=model)
    except AIError:
        return text
    fixed = re.sub(r"^```[a-zA-Z]*\s*|\s*```$", "", res["text"].strip()).strip()
    fixed = fixed.removeprefix("<<<").removesuffix(">>>").strip("\n")
    # 모델이 글을 크게 줄이거나 늘렸으면(설명을 붙였거나 잘랐으면) 원래 글을 쓴다
    if not fixed.strip() or not (0.6 * len(text) <= len(fixed) <= 1.5 * len(text) + 40):
        return text
    return fixed

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


def _json_from(text: str) -> dict | None:
    """모델 답에서 JSON 한 덩어리를 꺼낸다. 문자열 안의 날 줄바꿈도 받는다(strict=False — 모델이 \\n 대신 그냥 줄을 바꿨다)."""
    import json

    text = re.sub(r"^```[a-zA-Z]*\s*|\s*```$", "", (text or "").strip())
    start, end = text.find("{"), text.rfind("}")
    if start < 0 or end <= start:
        return None
    try:
        data = json.loads(text[start:end + 1], strict=False)
    except ValueError:
        return None
    return data if isinstance(data, dict) else None


def _clean_ask(raw) -> list[dict]:
    """[{q, options[]}] — 질문은 3개까지, 보기는 4개까지. '기타·직접 입력' 은 화면이 붙이므로 뺀다."""
    out = []
    for item in raw if isinstance(raw, list) else []:
        if not isinstance(item, dict):
            continue
        q = str(item.get("q") or item.get("question") or "").strip()[:160]
        opts = []
        for o in item.get("options") or []:
            text = str(o.get("label") if isinstance(o, dict) else o or "").strip()[:90]
            if text and not re.fullmatch(r"(기타|직접\s*입력|other|직접 쓰기).*", text, re.I) and text not in opts:
                opts.append(text)
        if q:
            out.append({"q": q, "options": opts[:4]})
    return out[:3]


def _ids(raw) -> list[str]:
    if isinstance(raw, str):
        raw = [x for x in re.split(r"[,\s]+", raw) if x]
    return [str(x).strip() for x in (raw or []) if str(x).strip()][:6] if isinstance(raw, list) else []


def _people_lines(people: list[dict]) -> str:
    return "\n".join(
        " | ".join([p["id"], p.get("name") or "(이름 모름)", p.get("role") or "-",
                    " ".join(x for x in (p.get("course"), p.get("dept")) if x) or "-",
                    p.get("tag") or "-", p["email"]])
        for p in people[:90]
    )


def _flow_facts(flow: dict) -> str:
    """화면이 /api/mail/flow 에서 받은 받는 사람(이름·교수/조교)·과목(이름·학수번호·분반) → 질문에 넣을 줄."""
    to = flow.get("to") if isinstance(flow, dict) and isinstance(flow.get("to"), dict) else {}
    courses = to.get("courses") if isinstance(to.get("courses"), list) else []
    course = courses[0] if courses and isinstance(courses[0], dict) else {}
    role = {"professor": "교수", "ta": "조교", "staff": "직원"}.get(str(to.get("kind") or ""), "")
    return "\n".join(f"- {k}: {v}" for k, v in (
        ("받는 사람", f"{to.get('name') or ''} {role}".strip()),
        ("과목", " / ".join(x for x in (course.get("title"), course.get("titleEn")) if x)),
        ("학수번호", course.get("courseNo")), ("분반", course.get("section")),
    ) if v)


# 모델이 시킨 대로 하지 않고 인사·서명을 붙였을 때 떼어 낼 줄 (인사·소개·서명은 앱이 학생의 꼴로 붙인다)
_HEAD_LINE = re.compile(r"^\s*(dear|hello|hi|안녕하(세요|십니까)|.{0,24}(교수님|조교님|담당자님|선생님)\s*께?\s*[,.]?$|.{0,24}님\s*께\s*[,.]?$"
                        r"|i hope (this email|you)|my name is|저는 .{0,80}(학번|입니다))", re.I)
_TAIL_LINE = re.compile(r"^\s*(sincerely|best regards|kind regards|regards|best wishes|respectfully|thank you|thanks"
                        r"|.{0,30}(드림|올림)\s*$|바쁘신|읽어 주셔서|확인해 주셔서|감사합니다|감사드립니다|늘 건강|좋은 하루)", re.I)


def _content_only(text: str) -> str:
    """용건만 남긴다: 앞의 호칭·인사·자기소개 줄, 끝의 감사 인사·서명 덩어리를 뗀다.
    끝 덩어리는 '맺음 줄 + 그 뒤 짧은 줄들(이름·소속·학번)' 일 때만 — 용건 문단(긴 줄)을 잘라 먹지 않게."""
    lines = (text or "").strip().splitlines()
    while lines and (not lines[0].strip() or _HEAD_LINE.match(lines[0])):
        lines.pop(0)
    for i in range(max(1, len(lines) - 8), len(lines)):
        s = lines[i].strip()
        if s and len(s) <= 70 and _TAIL_LINE.match(s) and all(len(x.strip()) <= 70 for x in lines[i:]):
            lines = lines[:i]
            break
    return "\n".join(lines).strip()


def compose_mail(request: str, answers: list[dict], people: list[dict], me: dict, extra: dict,
                 force: bool = False, provider: str | None = None, model: str = "") -> dict:
    """메일 쓰기 옆 창(2026-11-09 사용자): 한 마디 부탁 → 받는 사람·참조·제목·용건까지 정하고, 모자란 것은 되묻는다.

    '누구에게 보낼지, 참조는 누구, 내용은 어떻게 — 빠진 게 있으면 Claude 처럼 1·2·3안을 골라 받고, 보내기만 누르면
    되게'. 호칭 줄과 이름·학번 서명은 화면 서버가 mail_flow 로 붙이고, 그 사이 인사·자기소개·맺음은 모델이 받는 사람과
    용건에 맞게 고른다(2026-11-11 사용자: '인삿말, 끝말이 정형화해서 모든 것을 같게 하지 말고') — FRAME_RULES·_frame_parts.
    people: [{id, name, email, role, course, dept, tag}] — 받는 사람·참조는 이 id 로만 고른다(모델이 주소를 지어내지 않게).
    extra: timetable·deadlines(줄 글), current{to,cc,subject,body}, quote(답장하는 메일)
    답: {ask[], to[], cc[], course, lang, subject, content, hello?, intro?, closing?, signoff?, note}
    """
    me_lines = "\n".join(f"- {k}: {v}" for k, v in (
        ("이름", me.get("name")), ("영문 이름", me.get("nameEn")), ("학번", me.get("studentId")),
        ("소속", me.get("dept")), ("소속(영문)", me.get("deptEn")),
        ("학년", f"{me.get('year')}학년" if str(me.get("year") or "0") not in ("", "0") else ""),
    ) if v)
    cur = extra.get("current") if isinstance(extra.get("current"), dict) else {}
    cur_lines = "\n".join(f"- {k}: {v}" for k, v in (
        ("받는 사람", cur.get("to")), ("참조", cur.get("cc")), ("제목", cur.get("subject")),
    ) if v)
    # 학생이 본문에 이미 쓴 글(답장 원문 앞까지) — 2026-11-11 사용자: '제목이나 내용을 이미 썼을 때도 그 맥락을 반영해서'
    written = str(cur.get("body") or "").strip()[:3000]
    quote = str(extra.get("quote") or "").strip()[:4000]
    reply = bool(quote) or bool(re.match(r"\s*re\s*:", str(cur.get("subject") or ""), re.I))
    got = "\n".join(f"- {a.get('q')} → {a.get('a')}" for a in answers if isinstance(a, dict) and a.get("a"))
    ask_rule = ("- 이번에는 더 묻지 말고 바로 씁니다. 모르는 것은 본문에 [ ] 로 비웁니다." if force
                else "- 다 알면 묻지 말고 바로 씁니다. 같은 것을 두 번 묻지 마세요.")
    today = time.strftime("%Y-%m-%d")
    prompt = (
        "당신은 DGIST 대학생의 메일 비서입니다. 학생의 부탁을 보고 메일을 끝까지 준비해, 학생은 '보내기'만 누르면 되게 합니다.\n"
        "정할 것: 받는 사람(to), 참조(cc), 메일 언어, 제목, 용건 본문.\n\n"
        "[받는 사람·참조]\n"
        "- [사람 목록]의 id 로만 고릅니다. 학생이 주소를 직접 적었으면 그 주소를 씁니다. 목록에 없는 주소를 지어내지 마세요.\n"
        "- 과목 일(결석·시험·성적·수업 질문)은 그 과목 교수님께 보내고, 그 과목 조교가 목록에 있으면 참조에 넣습니다.\n"
        "  과제 제출·실습·채점처럼 조교가 맡는 일은 조교에게 보내고, 필요할 때만 교수님을 참조로 넣습니다.\n"
        "- 학생이 '참조 빼', '조교님께만' 처럼 정하면 그대로 따릅니다.\n"
        "- [지금 메일 칸]에 받는 사람이 이미 있으면(답장 등) 학생이 바꾸라고 하지 않는 한 그 사람에게 보냅니다.\n"
        "- 누구에게 보낼지 정말 모르겠으면 묻습니다(보기는 목록의 알맞은 사람 2~4명, '이름 (역할·과목)' 꼴).\n\n"
        "[묻기]\n"
        "- 메일을 쓰는 데 꼭 필요한데 학생 말·[이미 받은 답]에 없는 것만 묻습니다(예: 결석 날짜, 사유, 어느 과목·과제인지,\n"
        "  면담 희망 시간). 사소한 것은 묻지 말고 본문에 [ ] 로 비웁니다. 한 번에 최대 3개.\n"
        "- 보기는 2~4개, 학생이 그대로 고를 수 있게 구체적으로: 날짜는 [달력]·[내 시간표]를 보고 'M월 D일(요일)', 과제는 [다가오는 마감]의 이름.\n"
        "  '기타·직접 입력' 보기는 넣지 마세요(앱이 붙입니다).\n"
        "- 질문은 학생에게 하는 짧은 해요체로(예: '언제 빠지나요?', '사유는 뭔가요?'). 합쇼체·존댓말 과잉은 쓰지 않습니다.\n"
        "  보기는 10자 안팎의 짧은 말로(예: '병원 진료', '네, 넣어 주세요').\n"
        f"{ask_rule}\n\n"
        "[언어] 받는 사람 이름이 로마자(외국인 교수님)면 영어, 아니면 한국어. 답장이면 [답장하는 메일]의 언어. 학생이 언어를 정하면 그 말대로.\n"
        "[본문] content 에는 용건 문단만 씁니다(호칭·인사·자기소개·맺음·서명은 hello·intro·closing·signoff 칸에 따로).\n"
        "- 첫 문장에 용건을 바로 씁니다. 늘 '다름이 아니라' 나 'I am writing to' 로 시작하지 말고 용건에 맞게 엽니다.\n"
        "- 1~3문단, 목록 기호 없이 문장으로(행정 부서에 여러 가지를 물을 때만 '1. 2.' 번호). 학생 말·답·아래 자료에 있는 사실만 씁니다.\n"
        "  요일은 [달력]으로 맞춥니다. 짧은 확인·감사 답장은 두세 문장이면 충분합니다.\n"
        + ("[답장] 이 메일은 [답장하는 메일]에 대한 답장입니다.\n"
           "- 그 메일이 묻거나 부탁한 것에 바로 답합니다. 거기 적힌 날짜·시간·장소·과제 이름은 그대로 옮겨 씁니다.\n"
           "- 받은 메일을 이어받아 시작하되 늘 같은 문장으로 열지 않습니다. 받은 메일이 안내·답변이면 '안내해 주셔서 감사합니다',\n"
           "  묻는 메일이면 그 물음에 대한 답부터('11월 18일(수) 오후 2시에 참석하겠습니다.'), 부탁이면 할 수 있는지부터.\n"
           "- 원문을 되풀이하거나 요약하지 마세요. 받는 사람은 학생이 바꾸라고 하지 않는 한 그 메일을 보낸 사람입니다.\n"
           "- 이미 주고받는 사이이므로 자기소개(intro)는 짧게 하거나 빈칸으로 둡니다.\n"
           "- 제목은 [지금 메일 칸]의 'Re: …' 를 그대로 씁니다.\n" if reply else "")
        + ("[학생이 이미 쓴 것] 학생이 제목·본문에 이미 적은 글은 학생의 뜻입니다.\n"
           "- 거기 담긴 용건·사실·부탁을 빠짐없이 살려 쓰고, 말투와 꼴만 [격식]에 맞게 다듬습니다. 학생이 쓰지 않은 사실을 보태지 마세요.\n"
           "- 답장이 아니면 제목은 학생이 쓴 용건을 지키며 [격식]의 제목 꼴로 맞춥니다.\n"
           if (written or (cur.get("subject") and not reply)) else "")
        + f"{FORMAL_RULES}\n"
        f"{FRAME_RULES}\n"
        f"{NATURAL_KO}\n"
        f"[상황별로 들어가면 좋은 것]\n{SITUATION_GUIDE}\n\n"
        "출력은 JSON 하나만(설명·코드 블록 없이):\n"
        '- 물어야 하면: {"ask": [{"q": "질문", "options": ["보기1", "보기2", "보기3"]}], "to": ["id"], "cc": ["id"]}  (to·cc 는 이미 정했으면)\n'
        '- 쓸 수 있으면: {"to": ["id"], "cc": ["id"], "course": "과목 이름(과목 일이 아니면 빈칸)", "lang": "ko 또는 en", '
        '"subject": "제목", "hello": "호칭 다음 인사 한 줄(없으면 빈칸)", "intro": "자기소개(없으면 빈칸)", '
        '"content": "용건 본문(문단 사이는 빈 줄)", "closing": "맺음 문장", "signoff": "올림·드림 또는 Sincerely,·Best regards,·Best,", '
        '"note": "누구에게 보내고 누구를 참조로 넣었는지와 까닭(한 줄, 해요체, id 는 적지 않음)"}\n\n'
        f"[오늘] {today}\n[달력] {_calendar(28)}\n\n"
        f"[내 정보]\n{me_lines or '- (모름)'}\n\n"
        f"[내 시간표]\n{extra.get('timetable') or '- (없음)'}\n\n"
        f"[다가오는 마감]\n{extra.get('deadlines') or '- (없음)'}\n\n"
        f"[사람 목록: id | 이름 | 역할 | 과목·소속 | 어디서 | 주소]\n{_people_lines(people) or '- (없음)'}\n\n"
        f"[지금 메일 칸]\n{cur_lines or '- (비어 있음)'}\n\n"
        + (f"[학생이 본문에 이미 쓴 글]\n<<<\n{written}\n>>>\n\n" if written else "")
        + (f"[답장하는 메일]\n<<<\n{quote}\n>>>\n\n" if quote else "")
        + f"[학생의 부탁]\n{request[:3000]}\n\n"
        + f"[이미 받은 답]\n{got or '- (없음)'}"
    )
    res = run(prompt, provider, model=model)
    data = _json_from(res["text"])
    if data is None:
        # JSON 이 아니면 글을 용건으로 본다(받는 사람은 못 정함)
        return {**res, "ask": [], "to": [], "cc": [], "course": "", "lang": "", "subject": "",
                "content": _content_only(res["text"]), "note": ""}
    ask = [] if force else _clean_ask(data.get("ask"))
    lang = str(data.get("lang") or "").strip().lower()
    content = "" if ask else _content_only(str(data.get("content") or data.get("body") or ""))
    # 격식 검사: 해요체·이모티콘·느낌표·영어 줄임꼴이 남았으면 그 문장만 한 번 고쳐 쓴다(학생이 편하게 쓰라고 했으면 둔다)
    issues = _formal_issues(content, lang) if content and not _CASUAL_ASK.search(request + " " + got) else []
    if issues:
        content = _content_only(_formalize(content, issues, lang, provider, model))
        res = {**res, "formalFixed": len(issues)}
    casual = bool(_CASUAL_ASK.search(request + " " + got))
    return {
        **res,
        "ask": ask,
        "to": _ids(data.get("to")),
        "cc": _ids(data.get("cc")),
        "course": str(data.get("course") or "").strip()[:120],
        "lang": lang if lang in ("ko", "en") else "",
        "subject": str(data.get("subject") or "").strip().splitlines()[0][:200] if data.get("subject") else "",
        "content": content,
        **({} if ask else _frame_parts(data, lang, me, casual)),
        "note": str(data.get("note") or "").strip()[:240],
    }


_SIGNOFFS = {"올림": "올림", "드림": "드림", "sincerely": "Sincerely,", "best regards": "Best regards,",
             "kind regards": "Kind regards,", "best": "Best,", "regards": "Regards,", "respectfully": "Respectfully,"}


def _frame_parts(data: dict, lang: str, me: dict, casual: bool = False) -> dict:
    """모델이 고른 인사(hello)·자기소개(intro)·맺음(closing)·서명 인사(signoff)를 거른다.

    없는 칸은 넣지 않는다(화면 서버가 mail_flow 의 기본 꼴을 쓴다). 빈 문자열은 '일부러 뺌'(답장의 자기소개 등).
    - 호칭 줄('○○ 교수님께,' / 'Dear …,')·서명 이름 줄은 앱이 붙이므로 모델이 써 넣었으면 뗀다.
    - 격식에 어긋나면(해요체·느낌표·영어 줄임꼴) 그 칸만 기본 꼴로 돌린다 — 짧은 줄이라 고쳐 쓰기보다 기본이 낫다.
    - 자기소개에 [내 정보]와 다른 학번이 들어가면 버린다(모델이 예시의 학번을 옮겨 쓴 일을 막는다)."""
    out: dict[str, str] = {}
    sid = str(me.get("studentId") or "").strip()
    for key, limit in (("hello", 80), ("intro", 300), ("closing", 240)):
        if key not in data or not isinstance(data.get(key), str):
            continue
        lines = [l.strip() for l in data[key].strip().splitlines() if l.strip()]
        # 호칭 줄·서명 줄을 뗀다
        lines = [l for l in lines if not re.match(r"^(dear\s|to whom|.{0,30}께\s*,?$)", l, re.I)
                 and not re.search(r"(드림|올림)$|^(sincerely|best regards|kind regards|best|regards),?$", l, re.I)]
        text = "\n".join(lines)
        text = re.sub(r"^.{0,30}께\s*,\s*", "", text)  # '김민수 교수님께, 안녕하십니까.' → '안녕하십니까.'
        if len(text) > limit:
            continue
        if key == "intro" and any(n != sid for n in re.findall(r"(?<!\d)\d{8,10}(?!\d)", text)):
            continue
        if text and not casual and _formal_issues(text, lang):
            continue
        out[key] = text
    sign = re.sub(r"[\s,.]+$", "", str(data.get("signoff") or "")).strip().lower()
    if sign in _SIGNOFFS:  # 언어가 맞는지는 화면 서버가 본다(그쪽이 메일 언어를 최종으로 정한다)
        out["signoff"] = _SIGNOFFS[sign]
    return out


AI_MARK = "⟦여기⟧"


def revise_mail(instruction: str, mail: dict, people: list[dict], provider: str | None = None, model: str = "",
                allow_ask: bool = True) -> dict:
    """다 쓴 메일을 지시대로 고친다 — 옆 창의 두 번째 말부터, 그리고 본문의 '/ai 지시'(2026-11-09 사용자: /ai 는 부가 기능,
    주로 고치는 데). 본문에 ⟦여기⟧(지시를 적은 자리)가 있으면 그 자리에 넣기만 할지(insert), 다른 데를 고칠지(body)를
    모델이 고른다 — 넣기만 하는 지시에 메일 전체를 다시 받으면 느리고, 손대지 않은 줄까지 바뀔 수 있다.
    답: {body | insert, subject?, to?, cc?, ask[], note}"""
    body = str(mail.get("body") or "")[:8000]
    marked = AI_MARK in body
    mark_rule = (
        f"- 메일 안의 {AI_MARK} 는 학생이 지시를 적은 자리입니다. 그 자리에 새 글을 넣기만 하면 되는 지시(예: '결석 사유 한 문장 추가',\n"
        "  '여기에 면담 가능한 시간')면 body 대신 {\"insert\": \"그 자리에 넣을 글\", \"note\": \"…\"} 만 주세요. 앞뒤 글에 자연스럽게\n"
        "  이어지게, 앞 글을 되풀이하지 말고. 다른 곳을 고쳐야 하는 지시(예: '위 문단 더 짧게', '전체적으로 더 공손하게')면\n"
        f"  body 에 메일 전체를 주고 {AI_MARK} 는 지웁니다.\n"
    ) if marked else ""
    head = "\n".join(f"- {k}: {v}" for k, v in (
        ("받는 사람", mail.get("to")), ("참조", mail.get("cc")), ("제목", mail.get("subject")),
    ) if v)
    # 답장이면 원문도 본다(2026-11-11 사용자: '답신할 때 AI 를 쓰면 그 답신의 맥락도 같이') — 고칠 글이 아니라 참고
    quote = str(mail.get("quote") or "").strip()[:4000]
    quote_part = (f"[답장하는 메일 — 참고만, 고치지 않음]\n<<<\n{quote}\n>>>\n\n" if quote else "")
    # 본문의 /ai 는 되묻지 않는다(쓰던 자리에서 바로 고친다). 옆 창은 모자라면 보기를 골라 받는다
    ask_rule = (
        "- 지시대로 하려면 꼭 알아야 하는데 모르는 것이 있으면 고치지 말고 묻습니다: "
        '{"ask": [{"q": "질문", "options": ["보기1", "보기2"]}]} (보기 2~4개, 구체적으로, 질문은 짧은 해요체).\n'
        if allow_ask else "- 되묻지 말고 바로 고칩니다. 모르는 것은 [ ] 로 비웁니다.\n"
    )
    prompt = (
        "당신은 메일 편집기 안의 비서입니다. 대학생이 교수·조교·학교에 보낼 메일을 학생의 지시대로 고칩니다.\n"
        "- 지시와 관계없는 줄은 한 글자도 바꾸지 말고 그대로 둡니다(인사·자기소개·서명 포함).\n"
        "- 메일의 언어를 지킵니다. 지시가 번역을 바랄 때만 바꿉니다.\n"
        "- 사실을 지어내지 마세요. 꼭 필요한데 모르면 [ ] 로 비웁니다. 요일은 [달력]으로 맞춥니다.\n"
        + ("- 답장입니다. [답장하는 메일]이 묻거나 부탁한 것에 맞게 고치고, 거기 적힌 날짜·이름 같은 사실은 그대로 씁니다.\n" if quote else "")
        + "- 고친 글과 제목은 아래 [격식]을 지킵니다(지시가 말투를 따로 정하면 그 말대로).\n"
        "- 고쳐서 용건이 달라지면(예: 질문 → 결석 알림) 인사·맺음 문장도 아래 [인사·자기소개·맺음]에 맞게 함께 고칩니다.\n"
        "  호칭 줄과 이름·학번 서명 줄은 지시가 없으면 그대로 둡니다.\n"
        f"{FORMAL_RULES}\n"
        f"{FRAME_RULES}\n"
        f"{NATURAL_KO}\n"
        f"{mark_rule}"
        "- 받는 사람·참조를 바꾸라는 지시면 [사람 목록]의 id(또는 학생이 적은 주소)로 to·cc 를 줍니다(바뀐 뒤 전체). 아니면 넣지 마세요.\n"
        "  받는 사람이 바뀌면 호칭·인사도 그 사람에 맞게 고칩니다.\n"
        "- 내용이 바뀌어 제목이 맞지 않게 되거나 제목을 고치라는 지시면 subject 를 줍니다. 아니면 넣지 마세요.\n"
        f"{ask_rule}"
        "출력은 JSON 하나만(설명·코드 블록 없이): "
        '{"body": "고친 메일 본문 전체", "subject": "…", "to": ["id"], "cc": ["id"], "note": "무엇을 고쳤는지 20자 안팎 한 줄(해요체, 예: \'두 문단으로 줄였어요\', id 는 적지 않음)"}\n\n'
        f"[달력] {_calendar(28)}\n\n"
        f"[사람 목록: id | 이름 | 역할 | 과목·소속 | 어디서 | 주소]\n{_people_lines(people) or '- (없음)'}\n\n"
        f"[메일 머리]\n{head or '- (비어 있음)'}\n\n[메일 본문]\n<<<\n{body}\n>>>\n\n"
        f"{quote_part}"
        f"[학생의 지시]\n{instruction[:3000]}"
    )
    res = run(prompt, provider, model=model)
    data = _json_from(res["text"])
    if data is None:
        raise AIError("AI 답을 읽지 못했어요. 한 번 더 해 주세요.")
    out = {"ask": _clean_ask(data.get("ask")), "note": str(data.get("note") or "").strip()[:240]}
    if out["ask"]:
        return {**res, **out}
    if marked and isinstance(data.get("insert"), str):
        out["insert"] = data["insert"].strip().strip("`").strip()
    else:
        text = str(data.get("body") or "")
        if not text.strip():
            raise AIError("AI 가 빈 답을 줬어요. 한 번 더 해 주세요.")
        out["body"] = text.replace(AI_MARK, "").strip("\n")
    # 격식 검사: AI 가 새로 쓰거나 바꾼 문장만 본다(학생이 원래 써 둔 줄은 지시와 관계없으면 그대로 두는 것이 약속)
    key = "insert" if "insert" in out else "body"
    if out.get(key) and not _CASUAL_ASK.search(instruction):
        issues = [s for s in _formal_issues(out[key]) if s not in body]
        if issues:
            out[key] = _formalize(out[key], issues, "", provider, model)
            res = {**res, "formalFixed": len(issues)}
    if isinstance(data.get("subject"), str) and data["subject"].strip():
        out["subject"] = data["subject"].strip().splitlines()[0][:200]
    for key in ("to", "cc"):
        if isinstance(data.get(key), (list, str)):
            out[key] = _ids(data.get(key))
    return {**res, **out}


def rewrite_part(instruction: str, selection: str, before: str, after: str, flow: dict,
                 provider: str | None = None, model: str = "", subject: str = "", quote: str = "") -> dict:
    """본문에서 끌어 고른 부분만 지시대로 고친다 (2026-11-09 사용자: '드래그해서 고르면 그 자리에서 댓글 달듯 프롬프트').
    답은 고른 부분을 대신할 글만. subject·quote: 메일 제목과 답장하는 원문(맥락으로만 본다)."""
    facts = _flow_facts(flow)
    quote = str(quote or "").strip()[:3000]
    prompt = (
        "당신은 메일 편집기 안의 비서입니다. 대학생이 메일에서 끌어 고른 한 부분만 학생의 지시대로 고쳐 씁니다.\n"
        "- 출력은 [고른 부분]을 대신할 글만(설명·따옴표·머리말 없이).\n"
        "- [앞 글]·[뒤 글]과 자연스럽게 이어지게 쓰고, 앞뒤 글을 되풀이하지 마세요. 고른 부분이 문장 중간에서 시작·끝나면 그 모양을 지킵니다.\n"
        "- 고른 부분의 언어를 지킵니다. 지시가 번역을 바랄 때만 바꿉니다.\n"
        "- 줄바꿈은 고른 부분에 있던 만큼만 둡니다(문단을 늘리라는 지시가 아니면).\n"
        "- 사실을 지어내지 마세요. 꼭 필요한데 모르면 [ ] 로 비웁니다. 요일은 [달력]으로 맞춥니다.\n"
        + ("- 답장입니다. [답장하는 메일]이 묻거나 부탁한 것에 맞게 씁니다(그 메일은 고치지 않습니다).\n" if quote else "")
        + "- 고친 글은 아래 [격식]의 본문 규칙을 지킵니다(지시가 말투를 따로 정하면 그 말대로).\n"
        f"{FORMAL_RULES}\n{NATURAL_KO}\n\n"
        f"[달력] {_calendar(28)}\n\n[받는 사람·과목]\n{facts or '- (모름)'}\n\n"
        + (f"[메일 제목] {subject[:200]}\n\n" if subject.strip() else "")
        + (f"[답장하는 메일]\n<<<\n{quote}\n>>>\n\n" if quote else "")
        + f"[앞 글]\n<<<\n{before[-3000:]}\n>>>\n\n[고른 부분]\n<<<\n{selection[:4000]}\n>>>\n\n"
        f"[뒤 글]\n<<<\n{after[:2000]}\n>>>\n\n[학생의 지시]\n{instruction[:2000]}"
    )
    res = run(prompt, provider, model=model)
    text = re.sub(r"^```[a-zA-Z]*\s*|\s*```$", "", res["text"].strip()).strip()
    if text.startswith("<<<"):
        text = text[3:]
    if text.endswith(">>>"):
        text = text[:-3]
    text = text.strip("\n")
    if len(text) > 1 and text[0] == text[-1] and text[0] in "\"'“”" and not (selection.strip()[:1] in "\"'“”"):
        text = text[1:-1]
    # 고른 부분이 줄바꿈 없이 끝났으면 모델이 붙인 끝 줄바꿈을 뗀다(뒤 글과 붙어 있어야 한다)
    if not selection.endswith("\n"):
        text = text.rstrip("\n")
    if not text.strip():
        raise AIError("AI 가 빈 답을 줬어요. 한 번 더 해 주세요.")
    return {**res, "text": text}


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
