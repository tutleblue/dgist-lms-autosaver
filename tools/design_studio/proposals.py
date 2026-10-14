"""디자인 스튜디오 '시안': 요청 → Claude 가 복사본에 고침 → 사용자가 보고 → 반영 / 더 고쳐 줘 / 버리기.

시안 하나 = tools/design_studio/proposals/<이름>/
    web/        진짜 web/ 의 글자 파일 복사본. Claude 는 여기만 고친다. (그림은 복사하지 않고 진짜 web/ 것을 쓴다 — 시안마다 9MB 씩 늘지 않게)
    base/       시안을 만든 순간의 web/ 글자 파일. 반영할 때 3-way 병합의 기준.
    meta.json   상태·회차·Claude 세션·진행 기록·반영 결과
    before-apply/  반영 직전의 진짜 web/ 파일 (되돌릴 수 있게. 사용자 파일은 지우지 않는다 — CLAUDE.md 8)

왜 git 작업 트리(worktree)가 아니라 복사본인가
  사용자 저장소에는 커밋 안 한 변경이 많다(CLAUDE.md 28). worktree 는 마지막 커밋에서 시작해 그 변경이 빠진 화면을 보여 준다.
  복사본은 '지금 사용자가 보는 web/' 그대로에서 시작하고, 결정하기 전까지 진짜 web/ 와 git 은 건드리지 않는다.

Claude 는 `claude -p` (headless) 로 띄운다. 권한은 dontAsk: 허락 목록에 없는 것은 묻지 않고 거절된다.
  허락: 읽기·찾기, 시안 폴더 안 고치기, 확인용 명령(snapshot.py·node --check). 막음: 진짜 web/ 고치기.
"""
from __future__ import annotations

import difflib
import json
import os
import re
import shutil
import subprocess
import sys
import threading
import time
import uuid
from datetime import datetime
from pathlib import Path

from claude_cli import find_claude, spawn

TEXT_EXT = {".html", ".js", ".css", ".json", ".svg", ".txt", ".md"}
ACTIVE = {"running", "queued"}


def now_iso() -> str:
    return datetime.now().astimezone().isoformat(timespec="seconds")


def _read(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return ""


def _text_files(root: Path) -> list[str]:
    out = []
    for p in root.rglob("*"):
        if p.is_file() and p.suffix.lower() in TEXT_EXT:
            out.append(p.relative_to(root).as_posix())
    return sorted(out)


class ProposalManager:
    def __init__(self, proj: Path, here: Path, web_root: Path, requests_dir: Path, proxy_env: dict | None = None,
                 manage: bool = True):
        self.proxy_env = proxy_env or {}
        self.proj = proj
        self.here = here
        self.web_root = web_root
        self.requests_dir = requests_dir
        self.root = here / "proposals"
        self.lock = threading.Lock()
        self.procs: dict[str, subprocess.Popen] = {}
        if manage:
            self._mark_orphans()

    # ---------- 기본 ----------
    @staticmethod
    def claude_path() -> str | None:
        return find_claude()

    def dir(self, name: str) -> Path:
        return self.root / Path(name).name

    def web_dir(self, name: str) -> Path:
        return self.dir(name) / "web"

    def _meta_path(self, name: str) -> Path:
        return self.dir(name) / "meta.json"

    def load(self, name: str) -> dict | None:
        try:
            return json.loads(self._meta_path(name).read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return None

    def save(self, meta: dict) -> None:
        path = self._meta_path(meta["name"])
        tmp = path.with_suffix(".tmp")
        tmp.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
        os.replace(tmp, path)

    def _mark_orphans(self) -> None:
        # 서버가 꺼질 때 돌던 작업은 이어 갈 수 없다. '멈춤' 으로 바꿔 두면 화면에서 다시 시킬 수 있다.
        if not self.root.exists():
            return
        for d in self.root.iterdir():
            meta = self.load(d.name) if d.is_dir() else None
            if meta and meta.get("status") in ACTIVE:
                meta["status"] = "failed"
                meta["error"] = "스튜디오 서버가 꺼져 작업이 멈췄어요. '더 고쳐 줘' 로 이어서 시킬 수 있어요."
                self.save(meta)

    def list(self) -> list[dict]:
        out = []
        if not self.root.exists():
            return out
        for d in sorted(self.root.iterdir(), reverse=True):
            meta = self.load(d.name) if d.is_dir() and not d.name.startswith("_") else None
            if not meta:
                continue
            out.append(self._public(meta))
        return out

    def _public(self, meta: dict) -> dict:
        keep = ("name", "title", "status", "createdAt", "updatedAt", "error", "rounds", "applyReport", "cost")
        pub = {k: meta.get(k) for k in keep}
        pub["activity"] = (meta.get("activity") or [])[-12:]
        pub["changed"] = self.changed_files(meta["name"]) if meta.get("status") not in ACTIVE else []
        return pub

    # ---------- 차이 ----------
    def changed_files(self, name: str) -> list[dict]:
        base, web = self.dir(name) / "base", self.web_dir(name)
        out = []
        if not web.exists():
            return out
        for rel in _text_files(web):
            a, b = _read(base / rel), _read(web / rel)
            if a == b:
                continue
            plus = minus = 0
            for line in difflib.unified_diff(a.splitlines(), b.splitlines(), lineterm="", n=0):
                if line.startswith("+") and not line.startswith("+++"):
                    plus += 1
                elif line.startswith("-") and not line.startswith("---"):
                    minus += 1
            out.append({"file": rel, "plus": plus, "minus": minus, "new": not (base / rel).exists()})
        return out

    def diff(self, name: str, limit: int = 4000) -> str:
        base, web = self.dir(name) / "base", self.web_dir(name)
        chunks = []
        for item in self.changed_files(name):
            rel = item["file"]
            lines = difflib.unified_diff(
                _read(base / rel).splitlines(), _read(web / rel).splitlines(),
                fromfile=f"web/{rel} (지금)", tofile=f"web/{rel} (시안)", lineterm="", n=2,
            )
            chunks.extend(lines)
            if len(chunks) > limit:
                chunks = chunks[:limit] + ["… (너무 길어 잘랐어요)"]
                break
        return "\n".join(chunks)

    # ---------- 만들기·고치기 ----------
    def create(self, request_stem: str, title: str = "") -> dict:
        # 폴더 이름은 저장 시각(영문·숫자)만 쓴다. 이 이름이 claude 권한 인자에 들어가는데,
        # Windows 에서 claude.cmd 는 cmd.exe 를 거쳐 한글 인자가 코드페이지 때문에 깨질 수 있다.
        m = re.match(r"\d{8}-\d{6}", Path(request_stem).name)
        base_name = m.group(0) if m else re.sub(r"[^A-Za-z0-9-]", "", request_stem)[:30] or "proposal"
        name, n = base_name, 2
        while self.dir(name).exists():
            name, n = f"{base_name}-{n}", n + 1
        d = self.dir(name)
        (d / "web").mkdir(parents=True)
        (d / "base").mkdir()
        for rel in _text_files(self.web_root):
            for target in (d / "web" / rel, d / "base" / rel):
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(self.web_root / rel, target)
        meta = {
            "name": name, "title": title or request_stem, "request": request_stem, "status": "queued", "createdAt": now_iso(), "updatedAt": now_iso(),
            "sessionId": str(uuid.uuid4()), "rounds": [], "activity": [], "cost": 0.0,
        }
        self.save(meta)
        self.run(name, request_stem, followup=False)
        return meta

    def revise(self, name: str, request_stem: str) -> dict:
        meta = self.load(name)
        if not meta:
            raise ValueError("그런 시안이 없어요.")
        if meta.get("status") in ACTIVE:
            raise ValueError("Claude 가 아직 고치는 중이에요.")
        if meta.get("status") in ("applied", "discarded"):
            raise ValueError("이미 반영했거나 버린 시안이에요.")
        self.run(name, request_stem, followup=bool(meta.get("rounds")))
        return meta

    def _prompt(self, name: str, request_stem: str, followup: bool) -> str:
        rel_web = f"tools/design_studio/proposals/{name}/web"
        req = f"tools/design_studio/requests/{request_stem}"
        py = self._python_cmd()
        stamp = (re.match(r"\d{8}-\d{6}", request_stem) or [request_stem])[0]
        check = f"{py} tools/design_studio/snapshot.py {stamp} --web {rel_web} --tag proposal"
        if followup:
            head = (
                f"사용자가 시안을 보고 더 고쳐 달라고 했다. 새 요청: `{req}.md` (정확한 값은 `{req}.json`).\n"
                "이 요청은 시안 화면 위에서 만든 것이라 선택자·규칙·글자는 시안 기준이다. 전 회차 요청과 너의 설명은 이 대화에 있다.\n"
            )
        else:
            head = f"디자인 요청 `{req}.md` (정확한 값은 `{req}.json`) 을 '시안' 으로 만든다.\n"
        return head + f"""
`.claude/skills/design-studio/SKILL.md` 의 'D. 시안 모드' 를 따른다. 핵심만 다시 적으면:
- 고치는 곳은 시안 폴더 `{rel_web}/` 뿐이다. 진짜 `web/` 는 읽기만 한다(쓰기는 막혀 있다). 경로를 `{rel_web}/styles.css` 처럼 적어 고친다.
- 덮어쓰기 CSS 를 붙이지 말고, 시안 폴더의 원래 규칙을 찾아 고친다. 영어 문구는 `{rel_web}/i18n/en.json` 을 직접 고친다.
- applied/ 로 옮기기, 설치 파일, git 은 하지 않는다. 사용자가 시안을 보고 반영 여부를 정한다.
- 확인 사진(되면): `{check}` → `tools/design_studio/requests/shots/{request_stem}/` 의 `*-target.png` 와 `*-proposal.png` 를 비교. 명령이 막히면 건너뛴다.
- 자바스크립트를 고쳤으면 `node --check {rel_web}/app.js`.
- 셸 명령은 위 두 가지만 허락된다. 파일 보기·찾기는 Read·Grep·Glob 으로 한다(cat·sed·ls 는 막힌다).

마지막 답은 사용자 화면에 그대로 보인다. 한국어로 짧게:
1) 댓글 번호별로 한 일 (한 줄씩)
2) 재량으로 더 한 것
3) 못 했거나 일부러 안 한 것과 이유
"""

    def _python_cmd(self) -> str:
        exe = Path(sys.executable)
        try:
            return exe.relative_to(self.proj).as_posix()
        except ValueError:
            return "python"

    def _command(self, name: str, meta: dict, followup: bool) -> list[str]:
        rel_web = f"tools/design_studio/proposals/{name}/web"
        py = self._python_cmd()
        allowed = [
            "Read", "Grep", "Glob",
            f"Edit({rel_web}/**)", f"Write({rel_web}/**)", f"MultiEdit({rel_web}/**)",
            f"Bash({py} tools/design_studio/snapshot.py *)",
            "Bash(python tools/design_studio/snapshot.py *)",
            "Bash(python3 tools/design_studio/snapshot.py *)",
            "Bash(node --check *)",
        ]
        # 진짜 web/ 는 어떤 모드에서도 못 고치게 (deny 가 allow 보다 먼저 본다).
        # '/web/**' 는 작업 폴더(저장소) 기준이다. './web/**' 로 쓰면 깊이와 상관없이 모든 web/ 에 맞아
        # 시안 폴더(proposals/<이름>/web/)까지 막혔다 (2026-10-14 실측: 시안 고치기가 전부 거절됨).
        denied = ["Edit(/web/**)", "Write(/web/**)", "MultiEdit(/web/**)"]
        cmd = ["-p", "--output-format", "stream-json", "--verbose",
               "--permission-mode", "dontAsk", "--max-turns", os.environ.get("STUDIO_MAX_TURNS", "80")]
        if os.environ.get("STUDIO_MODEL"):
            cmd += ["--model", os.environ["STUDIO_MODEL"]]
        if followup:
            cmd += ["--resume", meta["sessionId"]]
        else:
            cmd += ["--session-id", meta["sessionId"]]
        cmd += ["--allowedTools", *allowed, "--disallowedTools", *denied]
        return cmd

    def run(self, name: str, request_stem: str, followup: bool) -> None:
        claude = self.claude_path()
        meta = self.load(name)
        if not claude:
            meta.update(status="failed", error="이 컴퓨터에서 claude 명령을 못 찾았어요. Claude Code 를 설치하거나 STUDIO_CLAUDE 에 경로를 적어 주세요.")
            self.save(meta)
            return
        meta["status"] = "running"
        meta["error"] = ""
        meta["activity"] = (meta.get("activity") or []) + [f"── {len(meta['rounds']) + 1}회차 시작: {request_stem}"]
        meta["rounds"].append({"request": request_stem, "startedAt": now_iso(), "status": "running"})
        meta["updatedAt"] = now_iso()
        self.save(meta)

        try:
            proc = spawn(self._command(name, meta, followup), self._prompt(name, request_stem, followup), self.proj, self.proxy_env)
        except OSError as exc:
            # 띄우지도 못했으면 '만드는 중' 으로 남기지 않는다 (남기면 화면이 계속 돌고 '다시 시키기' 도 막힌다)
            meta["status"] = "failed"
            meta["error"] = f"claude 를 실행하지 못했어요 ({exc.strerror or exc}). Claude Code 설치나 STUDIO_CLAUDE 경로를 확인해 주세요."
            meta["rounds"][-1].update(status="failed", finishedAt=now_iso())
            self.save(meta)
            return
        with self.lock:
            self.procs[name] = proc
        threading.Thread(target=self._pump, args=(name, proc), daemon=True).start()

    def _pump(self, name: str, proc: subprocess.Popen) -> None:
        result: dict = {}
        tail: list[str] = []
        for raw in proc.stdout:
            line = raw.strip()
            if not line:
                continue
            try:
                ev = json.loads(line)
            except json.JSONDecodeError:
                tail = (tail + [line[:200]])[-5:]
                continue
            notes = self._describe(ev)
            if ev.get("type") == "result":
                result = ev
            if notes:
                with self.lock:
                    meta = self.load(name)
                    meta["activity"] = ((meta.get("activity") or []) + notes)[-200:]
                    meta["updatedAt"] = now_iso()
                    self.save(meta)
        proc.wait()
        with self.lock:
            self.procs.pop(name, None)
            meta = self.load(name)
            rnd = meta["rounds"][-1]
            rnd["finishedAt"] = now_iso()
            cost = float(result.get("total_cost_usd") or 0)
            rnd["cost"] = cost
            meta["cost"] = round(float(meta.get("cost") or 0) + cost, 4)
            if meta.get("status") == "cancelled":
                rnd["status"] = "cancelled"
            elif result and not result.get("is_error") and result.get("subtype") == "success":
                rnd["status"] = "ready"
                rnd["result"] = str(result.get("result") or "").strip()
                meta["status"] = "ready"
            else:
                rnd["status"] = "failed"
                reason = result.get("subtype") or f"끝남 코드 {proc.returncode}"
                if reason == "error_max_turns":
                    reason = "정해 둔 횟수 안에 끝내지 못했어요"
                rnd["result"] = str(result.get("result") or "").strip()
                meta["status"] = "failed"
                meta["error"] = f"Claude 작업이 실패했어요 ({reason}). " + (" / ".join(tail[-2:]) if tail and not result else "")
            meta["updatedAt"] = now_iso()
            self.save(meta)

    @staticmethod
    def _describe(ev: dict) -> list[str]:
        """stream-json 한 줄 → 화면에 보일 짧은 진행 기록."""
        kind = ev.get("type")
        out = []
        if kind == "assistant":
            for part in (ev.get("message") or {}).get("content") or []:
                if part.get("type") == "text" and part.get("text", "").strip():
                    out.append("💬 " + part["text"].strip().replace("\n", " ")[:160])
                elif part.get("type") == "tool_use":
                    name, inp = part.get("name", ""), part.get("input") or {}
                    target = inp.get("file_path") or inp.get("path") or inp.get("pattern") or inp.get("command") or ""
                    target = str(target).replace("\\", "/")
                    if "/proposals/" in target:
                        target = target.split("/web/", 1)[-1]
                    label = {"Read": "읽기", "Edit": "고치기", "MultiEdit": "고치기", "Write": "쓰기",
                             "Grep": "찾기", "Glob": "찾기", "Bash": "확인"}.get(name, name)
                    out.append(f"• {label} {target[:120]}")
        elif kind == "user":
            for part in (ev.get("message") or {}).get("content") or []:
                if isinstance(part, dict) and part.get("type") == "tool_result" and part.get("is_error"):
                    text = part.get("content")
                    if isinstance(text, list):
                        text = " ".join(str(x.get("text", "")) for x in text if isinstance(x, dict))
                    out.append("⚠ " + str(text).replace("\n", " ")[:160])
        elif kind == "system" and ev.get("subtype") == "permission_denied":
            out.append("⛔ 막힘: " + json.dumps(ev, ensure_ascii=False)[:160])
        return out

    def cancel(self, name: str) -> None:
        with self.lock:
            proc = self.procs.get(name)
            meta = self.load(name)
            if meta and meta.get("status") in ACTIVE:
                meta["status"] = "cancelled"
                meta["error"] = "멈췄어요. '더 고쳐 줘' 로 이어서 시킬 수 있어요."
                self.save(meta)
        if proc and proc.poll() is None:
            proc.terminate()

    # ---------- 반영·버리기 ----------
    def apply(self, name: str) -> dict:
        meta = self.load(name)
        if not meta:
            raise ValueError("그런 시안이 없어요.")
        if meta.get("status") != "ready":
            raise ValueError("다 된 시안만 반영할 수 있어요.")
        d = self.dir(name)
        backup = d / "before-apply"
        report = {"applied": [], "merged": [], "conflicts": [], "unchanged": [], "at": now_iso()}
        for item in self.changed_files(name):
            rel = item["file"]
            base_f, mine_f, real_f = d / "base" / rel, d / "web" / rel, self.web_root / rel
            base, mine = _read(base_f), _read(mine_f)
            real = _read(real_f) if real_f.exists() else None
            if real == mine:
                report["unchanged"].append(rel)
                continue
            if real is not None:
                (backup / rel).parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(real_f, backup / rel)
            if real is None or real == base:
                real_f.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(mine_f, real_f)
                report["applied"].append(rel)
                continue
            # 시안을 만든 뒤 진짜 web/ 도 바뀌었다 → 양쪽 변경을 합친다 (git merge-file: 저장소가 아니어도 파일 셋으로 된다)
            merged = self._merge(real_f, base_f, mine_f)
            if merged is None:
                report["conflicts"].append(rel)
            else:
                real_f.write_text(merged, encoding="utf-8")
                report["merged"].append(rel)
        meta["applyReport"] = report
        if not report["conflicts"]:
            meta["status"] = "applied"
            self._close_requests(meta, report)
        meta["updatedAt"] = now_iso()
        self.save(meta)
        return report

    @staticmethod
    def _merge(real: Path, base: Path, mine: Path) -> str | None:
        git = shutil.which("git")
        if not git:
            return None
        res = subprocess.run([git, "merge-file", "-p", str(real), str(base), str(mine)],
                             capture_output=True, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        if res.returncode != 0:  # 0 = 충돌 없음, 양수 = 충돌 수, 음수 = 오류
            return None
        return res.stdout.decode("utf-8")

    def _close_requests(self, meta: dict, report: dict) -> None:
        """반영한 요청 저장본에 결과를 덧붙이고 applied/ 로 옮긴다 (지우지 않는다)."""
        done = self.requests_dir / "applied"
        done.mkdir(parents=True, exist_ok=True)
        for rnd in meta.get("rounds") or []:
            stem = rnd.get("request")
            md = self.requests_dir / f"{stem}.md"
            if md.exists():
                with md.open("a", encoding="utf-8") as fh:
                    fh.write(f"\n\n## 반영 결과 ({report['at']}, 시안 {meta['name']})\n\n")
                    fh.write((rnd.get("result") or "(설명 없음)") + "\n\n")
                    fh.write(f"- 바뀐 파일: {', '.join(report['applied'] + report['merged']) or '-'}\n")
            for ext in (".md", ".json"):
                src = self.requests_dir / f"{stem}{ext}"
                if src.exists():
                    os.replace(src, done / src.name)

    def discard(self, name: str) -> None:
        meta = self.load(name)
        if not meta:
            raise ValueError("그런 시안이 없어요.")
        if meta.get("status") in ACTIVE:
            self.cancel(name)
        meta = self.load(name)
        meta["status"] = "discarded"
        meta["updatedAt"] = now_iso()
        self.save(meta)
        # 지우지 않고 옆으로 치운다 (다시 보고 싶을 수 있다)
        trash = self.root / "_discarded"
        trash.mkdir(parents=True, exist_ok=True)
        os.replace(self.dir(name), trash / f"{name}-{int(time.time())}")
