"""운영체제 클립보드에 글을 넣는다 (인증번호 자동 복사, 2026-11-17).

화면(WebView)의 navigator.clipboard 는 사용자가 누른 순간에만 되고, 창이 뒤에 있거나 트레이에 있으면
'문서에 초점이 없다' 며 거절한다. 메일이 막 들어온 때는 사용자가 아무것도 누르지 않았으므로
화면 서버 쪽(파이썬)에서 운영체제에 직접 넣는다.

- Windows: user32 클립보드 API (ctypes). 인증번호는 비밀이라 '클립보드 기록(Win+V)·클라우드 클립보드'에는
  남기지 않게 CanIncludeInClipboardHistory / CanUploadToCloudClipboard 를 0 으로 함께 넣는다
  (암호 관리자들이 쓰는 방식, Microsoft 문서의 Clipboard Formats).
- macOS: /usr/bin/pbcopy. Finder 로 켠 앱은 PATH 가 짧아 절대 경로로 부른다.
- 리눅스: wl-copy / xclip / xsel 가운데 있는 것.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
import time


def copy_text(text: str, sensitive: bool = False) -> bool:
    """text 를 클립보드에 넣는다. 됐으면 True. 실패해도 예외를 던지지 않는다."""
    text = str(text or "")
    if not text:
        return False
    try:
        if os.name == "nt":
            return _copy_windows(text, sensitive)
        if sys.platform == "darwin":
            env = {**os.environ, "LANG": os.environ.get("LANG") or "en_US.UTF-8"}
            result = subprocess.run(["/usr/bin/pbcopy"], input=text.encode("utf-8"), env=env, timeout=5)
            return result.returncode == 0
        for command in (["wl-copy"], ["xclip", "-selection", "clipboard"], ["xsel", "--clipboard", "--input"]):
            exe = shutil.which(command[0])
            if not exe:
                continue
            # xclip·wl-copy 는 뒤에 남아 클립보드를 지킨다. 출력을 물고 있으면 기다리다 멈추므로 버린다
            result = subprocess.run(
                [exe, *command[1:]], input=text.encode("utf-8"),
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=5,
            )
            if result.returncode == 0:
                return True
        return False
    except Exception:
        return False


def _copy_windows(text: str, sensitive: bool) -> bool:
    import ctypes
    from ctypes import wintypes

    # ctypes.windll 은 다른 모듈과 함께 쓰는 물건이라 argtypes 를 바꾸지 않게 따로 연다
    user32 = ctypes.WinDLL("user32", use_last_error=True)
    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
    user32.OpenClipboard.argtypes = [wintypes.HWND]
    user32.OpenClipboard.restype = wintypes.BOOL
    user32.EmptyClipboard.restype = wintypes.BOOL
    user32.CloseClipboard.restype = wintypes.BOOL
    user32.SetClipboardData.argtypes = [wintypes.UINT, wintypes.HANDLE]
    user32.SetClipboardData.restype = wintypes.HANDLE
    user32.RegisterClipboardFormatW.argtypes = [wintypes.LPCWSTR]
    user32.RegisterClipboardFormatW.restype = wintypes.UINT
    kernel32.GlobalAlloc.argtypes = [wintypes.UINT, ctypes.c_size_t]
    kernel32.GlobalAlloc.restype = wintypes.HGLOBAL
    kernel32.GlobalLock.argtypes = [wintypes.HGLOBAL]
    kernel32.GlobalLock.restype = ctypes.c_void_p
    kernel32.GlobalUnlock.argtypes = [wintypes.HGLOBAL]
    kernel32.GlobalUnlock.restype = wintypes.BOOL
    kernel32.GlobalFree.argtypes = [wintypes.HGLOBAL]
    kernel32.GlobalFree.restype = wintypes.HGLOBAL
    GMEM_MOVEABLE = 0x0002
    CF_UNICODETEXT = 13

    def put(fmt: int, data: bytes) -> bool:
        handle = kernel32.GlobalAlloc(GMEM_MOVEABLE, len(data))
        if not handle:
            return False
        pointer = kernel32.GlobalLock(handle)
        if not pointer:
            kernel32.GlobalFree(handle)
            return False
        ctypes.memmove(pointer, data, len(data))
        kernel32.GlobalUnlock(handle)
        if not user32.SetClipboardData(fmt, handle):
            kernel32.GlobalFree(handle)  # 넘기지 못했으면 우리가 치운다 (넘겼으면 운영체제 것)
            return False
        return True

    # 다른 프로그램이 잠깐 클립보드를 쥐고 있을 수 있어 몇 번 다시 열어 본다
    for _ in range(10):
        if user32.OpenClipboard(None):
            break
        time.sleep(0.05)
    else:
        return False
    try:
        if not user32.EmptyClipboard():
            return False
        ok = put(CF_UNICODETEXT, (text + "\0").encode("utf-16-le"))
        if ok and sensitive:
            zero = (0).to_bytes(4, "little")  # DWORD 0
            for name in ("CanIncludeInClipboardHistory", "CanUploadToCloudClipboard"):
                fmt = user32.RegisterClipboardFormatW(name)
                if fmt:
                    put(fmt, zero)
        return ok
    finally:
        user32.CloseClipboard()


def read_text() -> str:
    """시험용: 지금 클립보드의 글 (Windows·맥만)."""
    try:
        if os.name == "nt":
            import ctypes
            from ctypes import wintypes

            user32 = ctypes.WinDLL("user32", use_last_error=True)
            kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
            user32.OpenClipboard.argtypes = [wintypes.HWND]
            user32.GetClipboardData.argtypes = [wintypes.UINT]
            user32.GetClipboardData.restype = wintypes.HANDLE
            kernel32.GlobalLock.argtypes = [wintypes.HGLOBAL]
            kernel32.GlobalLock.restype = ctypes.c_void_p
            kernel32.GlobalUnlock.argtypes = [wintypes.HGLOBAL]
            if not user32.OpenClipboard(None):
                return ""
            try:
                handle = user32.GetClipboardData(13)
                if not handle:
                    return ""
                pointer = kernel32.GlobalLock(handle)
                try:
                    return ctypes.wstring_at(pointer) if pointer else ""
                finally:
                    kernel32.GlobalUnlock(handle)
            finally:
                user32.CloseClipboard()
        if sys.platform == "darwin":
            return subprocess.run(["/usr/bin/pbpaste"], capture_output=True, timeout=5).stdout.decode("utf-8", "replace")
    except Exception:
        pass
    return ""
