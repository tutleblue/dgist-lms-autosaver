"""Windows 창의 기본 제목 줄을 없애고 앱 상단 바가 그 역할을 하게 한다 (Spotify 처럼).

사용자가 "Daling 이라고 뜨는 회색 제목 줄 말고 상단 바를 쓰자" 고 해서 넣었다.

- pywebview 의 frameless=True 는 WinForms 테두리를 통째로 없애(FormBorderStyle.None) 창 크기 조절·
  화면 가장자리 스냅·그림자·최대화 애니메이션이 모두 사라진다. 그래서 테두리는 그대로 두고
  WM_NCCALCSIZE 에서 제목 줄 높이만 클라이언트 영역으로 돌려준다 (Windows Terminal 과 같은 방법).
  좌우·아래 크기 조절, Aero 스냅, 둥근 모서리·그림자는 운영체제가 계속 그려 준다.
- 창 끌기는 WebView2 의 non-client region 기능(CSS `app-region: drag`)을 켜서 처리한다. 진짜 제목 줄처럼
  끌기·두 번 눌러 최대화·화면 끝 스냅이 된다. 자바스크립트로 창을 옮기면 끊기고 스냅이 안 된다.
- 최소화·최대화·닫기 단추는 화면(web)에 그리고, 누르면 /api/window 로 여기 함수를 부른다.
"""

from __future__ import annotations

import ctypes
import os
import threading
import time
from ctypes import wintypes

ENABLED = False  # 제목 줄을 실제로 없앴는지 (화면이 단추를 그릴지 정한다)
_hwnd = 0
_old_proc = None
_new_proc = None  # ctypes 콜백은 참조를 잡아 두지 않으면 GC 되어 창이 죽는다

WM_NCCALCSIZE = 0x0083
WM_SYSCOMMAND = 0x0112
SC_MINIMIZE, SC_MAXIMIZE, SC_RESTORE, SC_CLOSE = 0xF020, 0xF030, 0xF120, 0xF060
GWLP_WNDPROC = -4
SWP_FRAMECHANGED, SWP_NOMOVE, SWP_NOSIZE, SWP_NOZORDER, SWP_NOACTIVATE = 0x20, 0x2, 0x1, 0x4, 0x10
SM_CYFRAME, SM_CXPADDEDBORDER = 33, 92
WM_SIZE, SIZE_RESTORED, SIZE_MAXIMIZED = 0x0005, 0, 2
WM_FIX_SIZE = 0x8000 + 0x2A  # WM_APP + 42: 복원 뒤 크기 바로잡기
_normal_size = None  # 최대화 직전 (너비, 높이)
_was_max = False


class WINDOWPLACEMENT(ctypes.Structure):
    _fields_ = [("length", wintypes.UINT), ("flags", wintypes.UINT), ("showCmd", wintypes.UINT),
                ("ptMinPosition", wintypes.POINT), ("ptMaxPosition", wintypes.POINT),
                ("rcNormalPosition", wintypes.RECT)]

if os.name == "nt":
    _user32 = ctypes.windll.user32
    LRESULT = ctypes.c_ssize_t
    WNDPROC = ctypes.WINFUNCTYPE(LRESULT, wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM)
    _user32.CallWindowProcW.restype = LRESULT
    _user32.CallWindowProcW.argtypes = [ctypes.c_void_p, wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM]
    _user32.SetWindowLongPtrW.restype = ctypes.c_void_p
    _user32.SetWindowLongPtrW.argtypes = [wintypes.HWND, ctypes.c_int, ctypes.c_void_p]
    _user32.IsZoomed.argtypes = [wintypes.HWND]
    _user32.PostMessageW.argtypes = [wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM]
    _user32.GetDpiForWindow.argtypes = [wintypes.HWND]
    _user32.FindWindowExW.restype = wintypes.HWND
    _user32.FindWindowExW.argtypes = [wintypes.HWND, wintypes.HWND, wintypes.LPCWSTR, wintypes.LPCWSTR]
    _user32.GetClassNameW.argtypes = [wintypes.HWND, wintypes.LPWSTR, ctypes.c_int]
    _user32.GetWindowThreadProcessId.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.DWORD)]


def _frame_y() -> int:
    """최대화했을 때 화면 밖으로 밀려나는 위쪽 테두리 두께 (DPI 반영)."""
    try:
        dpi = _user32.GetDpiForWindow(_hwnd) or 96
        get = _user32.GetSystemMetricsForDpi
        return get(SM_CYFRAME, dpi) + get(SM_CXPADDEDBORDER, dpi)
    except Exception:
        return _user32.GetSystemMetrics(SM_CYFRAME) + _user32.GetSystemMetrics(SM_CXPADDEDBORDER)


def _wndproc(hwnd, msg, wparam, lparam):
    global _normal_size, _was_max
    # 최대화했다 되돌리면 WinForms 가 (없앤) 제목 줄 높이를 다시 더해 창이 29px씩 길어졌다(실측 820→849→878).
    # 최대화 직전 크기를 기억했다가, 되돌린 직후 크기만 맞춘다. 위치는 건드리지 않는다(제목 줄을 끌어 복원할 때 창이 튀지 않게).
    if msg == WM_SIZE:
        if wparam == SIZE_MAXIMIZED and not _was_max:
            wp = WINDOWPLACEMENT()
            wp.length = ctypes.sizeof(wp)
            if _user32.GetWindowPlacement(hwnd, ctypes.byref(wp)):
                rc = wp.rcNormalPosition
                _normal_size = (rc.right - rc.left, rc.bottom - rc.top)
            _was_max = True
        elif wparam == SIZE_RESTORED and _was_max:
            _was_max = False
            _user32.PostMessageW(hwnd, WM_FIX_SIZE, 0, 0)
    elif msg == WM_FIX_SIZE:
        if _normal_size and not _user32.IsZoomed(hwnd):
            r = wintypes.RECT()
            _user32.GetWindowRect(hwnd, ctypes.byref(r))
            w, h = _normal_size
            if (r.right - r.left, r.bottom - r.top) != (w, h):
                _user32.SetWindowPos(hwnd, 0, 0, 0, w, h, SWP_NOMOVE | SWP_NOZORDER | SWP_NOACTIVATE)
        return 0
    if msg == WM_NCCALCSIZE and wparam:
        # 첫 RECT 가 '창 전체' → 기본 처리 후 '클라이언트' 로 바뀐다. 위쪽만 원래대로 돌려 제목 줄을 없앤다.
        rect = ctypes.cast(lparam, ctypes.POINTER(wintypes.RECT)).contents
        top = rect.top
        result = _user32.CallWindowProcW(_old_proc, hwnd, msg, wparam, lparam)
        # 최대화 때는 창이 화면보다 테두리만큼 커서, 그만큼 내려 줘야 위가 잘리지 않는다
        rect.top = top + (_frame_y() if _user32.IsZoomed(hwnd) else 0)
        return result
    return _user32.CallWindowProcW(_old_proc, hwnd, msg, wparam, lparam)


def find_app_window(title: str, pid: int | None = None) -> int:
    """제목이 같은 최상위 창 가운데 Daling(WinForms) 창만 고른다. pid 를 주면 그 프로세스 창만.

    FindWindowW(None, "Daling") 하나로 찾으면 탐색기의 작업 표시줄 대리 창
    (explorer.exe, Windows.Internal.Shell.TabProxyWindow, 제목 "Daling")이 먼저 잡힐 때가 있다.
    그 창에 창 처리기를 걸다 실패해 제목 줄이 다시 회색으로 돌아왔다(2026-10-15 실측, Store 판 설치 뒤).
    """
    after = None
    cls = ctypes.create_unicode_buffer(256)
    owner = wintypes.DWORD()
    for _ in range(64):
        hwnd = _user32.FindWindowExW(None, after, None, title)
        if not hwnd:
            return 0
        after = hwnd
        _user32.GetClassNameW(hwnd, cls, 256)
        if not cls.value.startswith("WindowsForms10"):
            continue
        if pid is not None:
            _user32.GetWindowThreadProcessId(hwnd, ctypes.byref(owner))
            if owner.value != pid:
                continue
        return hwnd
    return 0


def _find_window(title: str, timeout: float) -> int:
    deadline = time.time() + timeout
    pid = os.getpid()
    while time.time() < deadline:
        hwnd = find_app_window(title, pid)
        if hwnd:
            return hwnd
        time.sleep(0.1)
    return 0


def install(title: str, timeout: float = 15.0) -> bool:
    """창이 뜨면 제목 줄을 없앤다. 실패하면 기본 제목 줄 그대로 둔다 (ENABLED=False → 화면도 원래대로)."""
    global _hwnd, _old_proc, _new_proc, ENABLED
    if os.name != "nt" or ENABLED:
        return ENABLED
    try:
        hwnd = _find_window(title, timeout)
        if not hwnd:
            return False
        _hwnd = hwnd
        _new_proc = WNDPROC(_wndproc)
        _old_proc = _user32.SetWindowLongPtrW(hwnd, GWLP_WNDPROC, ctypes.cast(_new_proc, ctypes.c_void_p))
        if not _old_proc:
            return False
        ENABLED = True
        # 테두리를 다시 계산하게 해서 바로 반영
        _user32.SetWindowPos(hwnd, 0, 0, 0, 0, 0,
                             SWP_FRAMECHANGED | SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_NOACTIVATE)
        return True
    except Exception:
        return False


def install_async(title: str) -> None:
    threading.Thread(target=install, args=(title,), daemon=True).start()


def enable_webview_drag_regions() -> None:
    """WebView2 가 CSS `app-region: drag` 를 진짜 제목 줄처럼 다루게 한다.

    이 설정은 '다음 이동부터' 적용되므로 pywebview 가 첫 페이지를 열기 전에 켜야 한다.
    그래서 pywebview 의 준비 완료 처리 앞에 끼워 넣는다.
    """
    if os.name != "nt":
        return
    try:
        from webview.platforms import edgechromium
    except Exception:
        return
    original = edgechromium.EdgeChrome.on_webview_ready
    if getattr(original, "_daling_patched", False):
        return

    def on_webview_ready(self, sender, args):
        try:
            if args.IsSuccess:
                sender.CoreWebView2.Settings.IsNonClientRegionSupportEnabled = True
        except Exception:
            pass  # 오래된 WebView2 런타임: 끌기가 안 될 뿐 앱은 그대로 뜬다
        return original(self, sender, args)

    on_webview_ready._daling_patched = True
    edgechromium.EdgeChrome.on_webview_ready = on_webview_ready


def state() -> dict:
    return {"custom": ENABLED, "maximized": bool(ENABLED and _user32.IsZoomed(_hwnd))}


def command(action: str) -> dict:
    if not ENABLED:
        return state()
    if action == "minimize":
        _user32.PostMessageW(_hwnd, WM_SYSCOMMAND, SC_MINIMIZE, 0)
    elif action == "maximize":
        _user32.PostMessageW(_hwnd, WM_SYSCOMMAND, SC_RESTORE if _user32.IsZoomed(_hwnd) else SC_MAXIMIZE, 0)
    elif action == "close":
        # 제목 줄 X 와 같은 길: pywebview 의 닫기 처리(서버 정리 등)를 그대로 탄다
        _user32.PostMessageW(_hwnd, WM_SYSCOMMAND, SC_CLOSE, 0)
    st = state()
    if action == "maximize":
        st["maximized"] = not st["maximized"]  # 메시지는 비동기라 아직 안 바뀌었다
    return st


def focus_existing(title: str) -> bool:
    """이미 떠 있는 Daling 창을 앞으로 가져온다. 찾으면 True.

    예전엔 두 번째로 켜면 같은 서버에 창을 하나 더 열었다. 그 창은 제목 줄을 못 없앤 채(같은 제목의 첫 창을
    찾아 버려서) 회색 제목 줄과 앱의 창 단추가 겹쳐 보였고, 그 창 단추는 첫 창을 닫았다(2026-10-14 실측).
    """
    if os.name != "nt":
        return False
    try:
        hwnd = find_app_window(title)
        if not hwnd:
            return False
        if _user32.IsIconic(hwnd):
            _user32.ShowWindow(hwnd, 9)  # SW_RESTORE
        _user32.SetForegroundWindow(hwnd)
        return True
    except Exception:
        return False
