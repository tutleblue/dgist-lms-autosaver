"""GitHub 릴리스로 앱을 업데이트한다.

설치형 앱(EXE)의 파이썬 코드는 실행 파일 안에 묶여 있어서, 예전처럼 저장소의 .py 파일을
받아 덮어써서는 바뀌지 않는다. 그래서 새 버전은 GitHub 릴리스에 설치 파일(setup.exe)로 올리고,
앱은 그것을 받아 조용히 설치한 뒤 다시 켠다.

  1) api.github.com/repos/<저장소>/releases/latest 에서 최신 릴리스(태그 v1.2.3)를 읽는다
  2) 첨부된 bungeoppang-<버전>-win-x64-setup.exe 를 내려받는다
  3) GitHub 이 붙여 주는 SHA-256(자산 digest) 과 맞는지 확인한다 — 안 맞거나 값이 없으면 설치하지 않는다
  4) 설치 파일을 /SILENT 로 실행하고 앱은 스스로 끈다. 설치가 끝나면 설치 프로그램이 앱을 다시 켠다(/RELAUNCH=1)

맥(Daling.app)도 2)·3) 까지 같고, 4) 는 앱에 묶은 install.sh(docs/install.sh 와 같은 파일)가 한다:
앱이 꺼지기를 기다려 받은 DMG 의 Daling.app 으로 바꿔 끼우고 다시 켠다 (_start_mac_install).
리눅스는 1) 만 하고 daling-<버전>-linux-x86_64.AppImage 를 찾아 브라우저로 연다 (.github/workflows/linux.yml 이 만든다).

예전 방식(저장소 main 의 VERSION 과 비교)은 저장소가 1.8.6 에 멈춰 있어 늘 '최신' 으로 나왔다(2026-09-28).
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import threading
import urllib.error
import urllib.request
from urllib.parse import urlparse
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent

# 배포자 GitHub 저장소 (공개)
REPO = "tutleblue/dgist-lms-autosaver"
LATEST_RELEASE_API = f"https://api.github.com/repos/{REPO}/releases/latest"
ASSET_PATTERN = re.compile(r"^bungeoppang-[\d.]+-win-x64-setup\.exe$")
# 맥 빌드(.github/workflows/mac.yml)가 만드는 DMG. M칩(arm64)·인텔(x86_64) 따로다 (인텔은 2026-10-21~).
# 제 칩 것만 본다 — 인텔 맥에 M칩 판을 깔면 열리지 않는다.
MAC_ASSET_PATTERNS = {
    "arm64": re.compile(r"^daling-[\d.]+-mac-arm64\.dmg$"),
    "x86_64": re.compile(r"^daling-[\d.]+-mac-x86_64\.dmg$"),
}
# 맥은 앱이 직접 받아 바꾼다 (2026-10-15). 예전에는 브라우저로 DMG 주소만 열었는데, 브라우저가 받은 파일에 붙이는
# 격리 표시(com.apple.quarantine) 때문에 업데이트할 때마다 Gatekeeper 가 다시 막았다(ad-hoc 서명, 공증 없음 →
# '그래도 열기' 를 또 눌러야 했다). 앱이 urllib 로 받은 파일에는 격리 표시가 붙지 않는다(Info.plist 에
# LSFileQuarantineEnabled 가 없고 샌드박스도 아님). 진짜인지는 Windows 와 같이 GitHub digest(SHA-256)로 확인한다.
# 켜 둔 채 바꾸면 서명이 어긋나므로, 바꿔 끼우기는 앱이 꺼진 뒤 install.sh 가 한다.
MAC_INSTALLER = PROJECT_ROOT / "install.sh"  # packaging/mac/daling-mac.spec 이 docs/install.sh 를 넣는다
MAC_MANUAL_NOTE = "맥에서는 새 DMG 를 내려받아 Daling 을 응용 프로그램 폴더에 다시 끌어다 놓으면 바뀌어요"
MAC_MISSING_NOTE = "맥용 새 버전 파일이 아직 올라오지 않았어요"
# 리눅스 빌드(.github/workflows/linux.yml)가 만드는 AppImage. 리눅스 앱도 스스로 덮어쓰지 않는다:
# AppImage 는 켜 둔 동안 읽기 전용으로 마운트돼 있고, tar.gz 로 깐 사람은 ~/.local/opt 에 있어 어느 쪽을 바꿀지 앱이 모른다.
LINUX_ASSET_PATTERN = re.compile(r"^daling-[\d.]+-linux-x86_64\.AppImage$")
LINUX_MANUAL_NOTE = "리눅스에서는 새 AppImage 를 내려받아 실행 권한을 주고, Daling 을 끈 뒤 예전 파일과 바꾸면 돼요"
# tar.gz·한 줄 설치(~/.local/opt/daling)로 깐 사람에게 AppImage 를 권하면 둘이 생긴다. 같은 명령을 다시 돌리면 바뀐다
LINUX_SCRIPT_NOTE = "Daling 을 끈 뒤 터미널에서 curl -fsSL https://gudaling.dev/install.sh | sh 를 다시 실행하면 새 버전으로 바뀌어요"
LINUX_MISSING_NOTE = "리눅스용 새 버전 파일이 아직 올라오지 않았어요"
# Microsoft Store 판(MSIX, packaging/msix): 새 버전은 Store 가 받아 바꾼다. 여기서 GitHub 설치 파일을 돌리면
# Store 판과 따로 노는 두 번째 Daling(Inno 설치본)이 깔린다. 그래서 GitHub 에 묻지도, 받지도 않는다.
STORE_NOTE = "Microsoft Store가 새 버전을 알아서 설치해요"
_last_manual_url = ""


def _store_edition() -> bool:
    try:
        import runtime_config

        return runtime_config.is_msix()
    except Exception:
        return False


def _mac_self_install() -> bool:
    """맥에서 묶은 앱이고 install.sh 가 들어 있으면 앱이 직접 바꿔 끼운다."""
    return sys.platform == "darwin" and bool(getattr(sys, "frozen", False)) and MAC_INSTALLER.is_file()


def _manual_platform() -> bool:
    """스스로 설치하지 않고 내려받을 곳만 열어 주는 운영체제 (리눅스, 소스로 돌리는 맥)."""
    return sys.platform.startswith("linux") or (sys.platform == "darwin" and not _mac_self_install())


def _manual_note() -> str:
    if sys.platform == "darwin":
        return MAC_MANUAL_NOTE
    # AppImage 런타임은 APPIMAGE 에 그 파일 경로를 넣어 준다
    return LINUX_MANUAL_NOTE if os.environ.get("APPIMAGE") else LINUX_SCRIPT_NOTE
# 설치 파일만 받는다. 다른 호스트로 넘어가는 주소는 쓰지 않는다 (GitHub 이 저장소를 옮기는 곳은 이 둘)
ALLOWED_DOWNLOAD_HOSTS = ("github.com", "objects.githubusercontent.com", "release-assets.githubusercontent.com")
VERSION_FILE = PROJECT_ROOT / "VERSION"
USER_AGENT = "Bungeoppang-Updater"


def local_version() -> str:
    try:
        return VERSION_FILE.read_text(encoding="utf-8").strip() or "0.0.0"
    except OSError:
        return "0.0.0"


def _ver_tuple(v: str) -> tuple[int, ...]:
    nums = [int(x) for x in re.findall(r"\d+", v)[:3]]
    while len(nums) < 3:
        nums.append(0)
    return tuple(nums)


def _get_json(url: str) -> dict:
    req = urllib.request.Request(
        url, headers={"User-Agent": USER_AGENT, "Accept": "application/vnd.github+json"}
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _mac_arch() -> str:
    """이 맥의 칩: arm64(M칩) 또는 x86_64(인텔). docs/install.sh 의 mac_arch 와 같은 규칙.

    인텔 판을 M칩 맥에서 로제타로 돌리는 중이어도(platform.machine() 이 x86_64) M칩이면 arm64 — 다음 업데이트로
    제 칩 판에 옮겨 간다. hw.optional.arm64 는 인텔 맥에는 아예 없다(sysctl 이 실패).
    """
    try:
        out = subprocess.run(["/usr/sbin/sysctl", "-n", "hw.optional.arm64"],
                             capture_output=True, text=True, timeout=5)
        if out.stdout.strip() == "1":
            return "arm64"
    except (OSError, subprocess.SubprocessError):
        pass
    return "arm64" if os.uname().machine == "arm64" else "x86_64"


def _pick_asset(release: dict) -> dict | None:
    # 맥은 이 칩용 DMG 만 본다. 릴리스에 DMG 가 없으면 '새 버전 없음' 으로 보인다 (깔 수 없는 것을 권하지 않게).
    # 리눅스도 같은 까닭으로 리눅스용 AppImage 만 본다.
    if sys.platform == "darwin":
        pattern = MAC_ASSET_PATTERNS[_mac_arch()]
    elif sys.platform.startswith("linux"):
        pattern = LINUX_ASSET_PATTERN
    else:
        pattern = ASSET_PATTERN
    for asset in release.get("assets") or []:
        if pattern.match(str(asset.get("name", ""))):
            return asset
    return None


def _allowed_host(url: str) -> bool:
    host = urlparse(url).hostname or ""
    return any(host == h or host.endswith("." + h) for h in ALLOWED_DOWNLOAD_HOSTS)


def _asset_sha256(release: dict, asset: dict) -> str:
    """GitHub 이 자산마다 계산해 주는 digest("sha256:…"). 없으면 릴리스 본문의 'SHA256: …' 줄."""
    digest = str(asset.get("digest") or "")
    if digest.lower().startswith("sha256:"):
        return digest.split(":", 1)[1].strip().lower()
    body = str(release.get("body") or "")
    m = re.search(r"SHA-?256\s*[:=]\s*([0-9a-fA-F]{64})", body)
    return m.group(1).lower() if m else ""


def _release_notes(body: str) -> list[str]:
    """릴리스 본문에서 '- ' 로 시작하는 줄만 짧게 뽑는다 (화면에 몇 줄 보여 주려고)."""
    lines = []
    for raw in str(body or "").splitlines():
        line = raw.strip()
        if line.startswith(("- ", "* ")):
            lines.append(line[2:].strip())
    return lines[:8]


def check_update() -> dict:
    global _last_manual_url
    current = local_version()
    if _store_edition():
        # 화면(app.js checkForUpdate)은 store 면 '새 버전' 알약·'지금 업데이트' 를 띄우지 않고 이 안내만 보인다
        return {"ok": True, "current": current, "latest": current, "updateAvailable": False,
                "store": True, "canInstall": False, "message": STORE_NOTE, "repo": REPO}
    try:
        release = _get_json(LATEST_RELEASE_API)
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            return {"ok": True, "current": current, "latest": current, "updateAvailable": False,
                    "message": "아직 올라온 릴리스가 없습니다.", "repo": REPO}
        if exc.code == 403:
            return {"ok": False, "current": current, "message": "GitHub 확인 한도에 걸렸습니다. 잠시 뒤 다시 확인해 주세요."}
        return {"ok": False, "current": current, "message": f"업데이트 확인 실패: HTTP {exc.code}"}
    except Exception as exc:
        return {"ok": False, "current": current, "message": f"업데이트 확인 실패: {exc}"}

    latest = str(release.get("tag_name") or "").lstrip("vV") or current
    asset = _pick_asset(release)
    available = _ver_tuple(latest) > _ver_tuple(current) and asset is not None
    result = {
        "ok": True,
        "current": current,
        "latest": latest,
        "updateAvailable": available,
        "title": release.get("name") or f"v{latest}",
        "notes": _release_notes(release.get("body", "")),
        "publishedAt": release.get("published_at"),
        "size": (asset or {}).get("size"),
        "canInstall": (bool(getattr(sys, "frozen", False)) and os.name == "nt") or _mac_self_install(),
        "repo": REPO,
    }
    if _manual_platform():
        # 화면(app.js checkForUpdate)은 manualUrl 이 있으면 '지금 업데이트' 를 눌렀을 때 설치 대신 이 주소를 연다
        url =str((asset or {}).get("browser_download_url") or release.get("html_url") or "")
        _last_manual_url = url if available and _allowed_host(url) else ""
        result["manualUrl"] = _last_manual_url
        result["manualNote"] = _manual_note()
    return result


def open_manual_download() -> dict:
    """리눅스(와 소스로 돌리는 맥): 최신 AppImage·DMG 를 기본 브라우저로 연다. 주소는 마지막 확인 결과에서 꺼낸다."""
    if not _manual_platform():
        return {"ok": False, "message": "설치형 앱에서만 자동으로 업데이트해요"}
    if sys.platform.startswith("linux") and not os.environ.get("APPIMAGE") and getattr(sys, "frozen", False):
        # tar.gz·한 줄 설치판: AppImage 를 받게 하지 않고 같은 명령을 다시 돌리라고만 한다 (LINUX_SCRIPT_NOTE)
        return {"ok": True, "message": LINUX_SCRIPT_NOTE}
    url = _last_manual_url or str(check_update().get("manualUrl") or "")
    if not url:
        return {"ok": False, "message": MAC_MISSING_NOTE if sys.platform == "darwin" else LINUX_MISSING_NOTE}
    if not _allowed_host(url):
        return {"ok": False, "message": f"허용되지 않은 다운로드 주소입니다: {urlparse(url).hostname}"}
    import webbrowser

    # 리눅스 묶음에서는 app.py 가 webbrowser 를 원래 환경의 xdg-open 으로 돌려 둔다 (linux_support.register_system_browser)
    opened = webbrowser.open(url)
    return {"ok": True, "url": url, "opened": opened, "message": _manual_note()}


# 내려받기·설치 진행 (화면이 물어 볼 수 있게)
_job_lock = threading.Lock()
_job: dict = {"running": False, "stage": "", "done": 0, "total": 0, "message": "", "ok": None}


def get_update_job() -> dict:
    with _job_lock:
        return dict(_job)


def _set_job(**values) -> None:
    with _job_lock:
        _job.update(values)


def _download(url: str, dest: Path, total: int) -> str:
    """dest 에 받으면서 SHA-256 을 같이 계산해 돌려준다."""
    host = urlparse(url).hostname or ""
    if not any(host == h or host.endswith("." + h) for h in ALLOWED_DOWNLOAD_HOSTS):
        raise RuntimeError(f"허용되지 않은 다운로드 주소입니다: {host}")
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/octet-stream"})
    sha = hashlib.sha256()
    done = 0
    with urllib.request.urlopen(req, timeout=30) as resp, open(dest, "wb") as out:
        final_host = urlparse(resp.geturl()).hostname or ""
        if not any(final_host == h or final_host.endswith("." + h) for h in ALLOWED_DOWNLOAD_HOSTS):
            raise RuntimeError(f"허용되지 않은 다운로드 주소로 넘어갔습니다: {final_host}")
        while True:
            chunk = resp.read(1024 * 256)
            if not chunk:
                break
            out.write(chunk)
            sha.update(chunk)
            done += len(chunk)
            _set_job(done=done, total=total)
    return sha.hexdigest()


def update_marker_path() -> Path:
    try:
        from runtime_config import AUTOSAVER_DATA_ROOT

        return Path(AUTOSAVER_DATA_ROOT) / "update_done.json"
    except Exception:
        return Path(tempfile.gettempdir()) / "bungeoppang-update" / "update_done.json"


def _write_update_marker(old: str, new: str) -> None:
    try:
        path = update_marker_path()
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps({"from": old, "to": new}, ensure_ascii=False), encoding="utf-8")
    except OSError:
        pass


def _run_update(on_ready_to_exit) -> None:
    try:
        _set_job(stage="확인", message="새 버전을 확인하는 중")
        release = _get_json(LATEST_RELEASE_API)
        latest = str(release.get("tag_name") or "").lstrip("vV")
        if _ver_tuple(latest) <= _ver_tuple(local_version()):
            raise RuntimeError(f"이미 최신입니다 (v{local_version()}).")
        asset = _pick_asset(release)
        if not asset:
            raise RuntimeError("릴리스에 설치 파일이 없습니다.")
        expected = _asset_sha256(release, asset)
        if not expected:
            # 확인할 값이 없으면 받은 파일이 진짜인지 알 수 없다. 설치하지 않는다.
            raise RuntimeError("설치 파일의 확인값(SHA-256)이 없어 설치하지 않았습니다.")

        folder = Path(tempfile.gettempdir()) / "bungeoppang-update"
        folder.mkdir(parents=True, exist_ok=True)
        dest = folder / asset["name"]
        _set_job(stage="내려받기", message="새 버전을 내려받는 중", total=int(asset.get("size") or 0))
        actual = _download(asset["browser_download_url"], dest, int(asset.get("size") or 0))
        _set_job(stage="검사", message="받은 파일이 진짜인지 확인하는 중")
        if actual != expected:
            dest.unlink(missing_ok=True)
            raise RuntimeError("받은 파일이 원본과 달라 설치하지 않았습니다. 다시 시도해 주세요.")

        _set_job(stage="설치", message="설치를 시작합니다. 잠시 뒤 앱이 다시 켜집니다.")
        if sys.platform == "darwin":
            _start_mac_install(dest)
            # 다시 켜진 앱이 '업데이트를 마쳤어요' 를 보여 줄 수 있게 적어 둔다 (web_ui.get_whats_new)
            _write_update_marker(local_version(), latest)
        else:
            _write_update_marker(local_version(), latest)
            # 설치 프로그램이 켜져 있는 앱을 닫고(CloseApplications) 파일을 바꾼 뒤 다시 켠다(/RELAUNCH=1).
            # 진행은 앱 안 업데이트 카드가 보여 주므로 설치 창은 띄우지 않는다(/VERYSILENT).
            # 앱과 따로 살아야 하므로 새 프로세스 묶음으로 띄운다.
            flags = 0
            if os.name == "nt":
                flags = subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP
            subprocess.Popen(
                [str(dest), "/VERYSILENT", "/SUPPRESSMSGBOXES", "/NORESTART", "/CLOSEAPPLICATIONS", "/RELAUNCH=1"],
                close_fds=True,
                creationflags=flags,
            )
        _set_job(running=False, ok=True, stage="설치")
        if on_ready_to_exit:
            on_ready_to_exit()
    except Exception as exc:
        _set_job(running=False, ok=False, stage="실패", message=str(exc))


def _mac_bundle() -> Path | None:
    """지금 돌고 있는 Daling.app (…/Daling.app/Contents/MacOS/Daling → …/Daling.app)."""
    for parent in Path(sys.executable).resolve().parents:
        if parent.suffix == ".app":
            return parent
    return None


def _mac_dest(bundle: Path | None) -> str:
    """새 판을 놓을 폴더. 사용자가 둔 자리를 지키되, 쓸 수 없거나 임시 자리면 install.sh 기본값(빈 값)."""
    if not bundle:
        return ""
    folder = str(bundle.parent)
    # DMG 를 연 채로 켰거나(/Volumes, 읽기 전용) 옮기지 않고 켜서 macOS 가 임시 자리로 옮겨 띄운(AppTranslocation) 앱
    if folder.startswith("/Volumes/") or "/AppTranslocation/" in folder:
        return ""
    return folder if os.access(folder, os.W_OK) else ""


def _mac_locked_folder() -> str:
    """앱이 놓인 폴더에 이 계정이 쓸 수 없으면 그 폴더. 아니면 빈 값.

    관리자가 아닌 계정에서 /Applications/Daling.app 을 업데이트하면 install.sh 가 ~/Applications 에 새 판을
    따로 깔았다. 독·런치패드는 계속 옛 판을 열고, 옛 판은 같은 업데이트를 또 권했다. 받기 전에 멈춘다.
    """
    bundle = _mac_bundle()
    if not bundle:
        return ""
    folder = str(bundle.parent)
    if folder.startswith("/Volumes/") or "/AppTranslocation/" in folder:
        return ""  # 임시 자리: install.sh 가 알맞은 자리를 고른다
    return "" if os.access(folder, os.W_OK) else folder


def mac_install_log_path() -> Path:
    try:
        from runtime_config import AUTOSAVER_DATA_ROOT

        return Path(AUTOSAVER_DATA_ROOT) / "update-mac.log"
    except Exception:
        return Path(tempfile.gettempdir()) / "bungeoppang-update" / "update-mac.log"


def _start_mac_install(dmg: Path) -> None:
    """확인한 DMG 로 바꿔 끼우는 install.sh 를 앱과 따로 띄운다. 앱이 꺼지면(on_ready_to_exit) 일을 시작한다."""
    # 바꿔 끼우는 동안 앱 묶음 안의 파일을 읽지 않게 밖으로 꺼내 둔다
    script = dmg.parent / "install.sh"
    script.write_bytes(MAC_INSTALLER.read_bytes())
    env = {k: v for k, v in os.environ.items() if not k.startswith(("_PYI", "_MEI", "DYLD_"))}
    env.update(
        DALING_DMG=str(dmg),  # install.sh 는 다시 받지 않고 이 파일을 쓴다 (SHA-256 은 여기서 확인함)
        DALING_DEST=_mac_dest(_mac_bundle()),
        DALING_UPDATE="1",  # 앱이 스스로 꺼지는 중이니 먼저 기다린다
        LANG=env.get("LANG") or "ko_KR.UTF-8",
    )
    log_path = mac_install_log_path()
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with open(log_path, "ab") as log:
        subprocess.Popen(
            ["/bin/sh", str(script)],
            stdin=subprocess.DEVNULL,
            stdout=log,
            stderr=subprocess.STDOUT,
            env=env,
            close_fds=True,
            start_new_session=True,  # 앱이 꺼져도 살아 있게
        )


def apply_update(on_ready_to_exit=None) -> dict:
    """설치형 앱: 최신 설치 파일을 받아 확인한 뒤 설치를 시작한다(뒤에서 돈다)."""
    if _store_edition():
        return {"ok": False, "store": True, "message": STORE_NOTE}
    if _manual_platform():
        # 리눅스(와 소스로 돌리는 맥)는 설치 파일을 돌리지 않는다. 화면은 open_manual_download 를 부른다.
        return {"ok": False, "manual": True, "message": _manual_note()}
    if not ((getattr(sys, "frozen", False) and os.name == "nt") or _mac_self_install()):
        return {"ok": False, "message": "소스로 실행 중이면 git pull 로 받아 주세요. 설치형 앱에서만 자동 업데이트합니다."}
    if sys.platform == "darwin":
        locked = _mac_locked_folder()
        if locked:
            return {
                "ok": False,
                "message": f"{locked} 에 쓸 권한이 없어 업데이트할 수 없어요. 관리자 계정에서 업데이트하거나 새 DMG 로 설치해 주세요.",
            }
    with _job_lock:
        if _job["running"]:
            return {"ok": False, "busy": True, "message": "이미 업데이트하는 중입니다."}
        _job.update(running=True, stage="확인", done=0, total=0, message="", ok=None)
    threading.Thread(target=_run_update, args=(on_ready_to_exit,), name="app-update", daemon=True).start()
    return {"ok": True, "started": True, "message": "새 버전을 내려받는 중입니다."}


if __name__ == "__main__":
    print(check_update())
