"""맥 창의 기본 제목 줄을 투명하게 하고 앱 상단 바가 그 역할을 하게 한다 (window_chrome.py 의 맥 판).

사용자가 맥 판 사진을 보여 주며 "윈도우에서 쓰는 거처럼 윗 창 라인을 깔끔하게" 라고 해서 넣었다(2026-10-26).
pywebview(cocoa)는 기본 제목 줄을 그대로 두고 그 바탕을 시스템 창 색으로 칠해서, 다크 모드 맥에서는
밝은 앱 위에 검은 띠와 화면 이름('과제 마감')이 따로 떴다.

- frameless=True 는 신호등(닫기·최소화·확대)까지 숨기고 크기 조절·전체 화면 단추가 사라진다. 그래서 창 틀은 두고
  제목 줄만 투명하게 한 뒤(titlebarAppearsTransparent + FullSizeContentView) 화면이 창 맨 위까지 올라오게 한다.
- 신호등은 운영체제 것을 그대로 쓰고, 상단 바 첫 줄 가운데 높이로 옮긴다(Tauri 의 trafficLightPosition 과 같은 방법).
  AppKit 이 창 크기가 바뀔 때·전체 화면에서 돌아올 때 제자리로 되돌리므로 그때마다 다시 놓는다.
- 창 끌기: WKWebView 는 CSS app-region 을 모른다. 화면(app.js)이 상단 바·왼쪽 메뉴의 '끌 곳' 과 단추 자리를
  사각형으로 재서 /api/window 로 보내고(regions), 마우스를 누른 자리가 끌 곳이면 웹에 넘기지 않고
  performWindowDragWithEvent 로 맥 고유의 창 끌기를 한다(Electron 의 draggable region 과 같은 방법).
  두 번 누르면 시스템 설정(제목 막대를 이중 클릭할 때)대로 확대·최소화한다.
- 이 모듈은 맥에서만 불러온다(AppKit·objc). app.py 가 창을 보이기 직전(before_show, 메인 스레드)에 install 을 부른다.
- DALING_WINDOW_SELFTEST=<폴더> 이면 창이 뜬 뒤 스스로 재서 그 폴더에 결과를 남긴다(.github/workflows/mac-window.yml).
"""

from __future__ import annotations

import json
import os
import threading
import time
from pathlib import Path

import AppKit
import Foundation
import objc
from PyObjCTools import AppHelper

ENABLED = False  # 제목 줄을 실제로 바꿨는지 (화면이 상단 바를 제목 줄로 쓸지 정한다)
_win = None  # NSWindow
_view = None  # pywebview 의 WKWebView (BrowserView.WebKitHost)
_observers: list = []  # 알림 관찰자 (참조를 잡아 두지 않으면 풀린다)
_state = {"maximized": False, "fullscreen": False}

# 화면이 알려 준 끌 곳: (CSS 너비, 끌 곳 사각형들, 끌지 않을 사각형들). 사각형은 [x, y, w, h] (CSS px, 창 왼쪽 위 기준)
_regions = None
# 신호등 자리: (왼쪽 x, 세로 가운데 y) CSS px. 화면이 상단 바 첫 줄을 재서 보낸다
_lights = (20.0, 30.0)
_probe: dict = {}
# 화면이 아직 끌 곳을 못 보냈을 때(페이지를 읽는 중 등) 창을 아예 못 옮기면 안 되므로, 맨 위 이만큼은 끌 수 있게 한다.
# 상단 바 위 여백(8px 이상)이라 단추를 덮지 않는다
FALLBACK_DRAG_PX = 8

_FULLSCREEN = 1 << 14  # NSWindowStyleMaskFullScreen
_FULL_SIZE = 1 << 15  # NSWindowStyleMaskFullSizeContentView
_CONTROL = 1 << 18  # NSEventModifierFlagControl (Control+클릭은 오른쪽 클릭이라 웹에 넘긴다)

_hooked = False
_last_decision = {}  # 자가 점검용: 마지막으로 누른 자리와 판정
_record_only = False  # 자가 점검: 끌기를 실제로 하지 않고 판정만 남긴다(가짜 이벤트로 끌기 반복이 멈추지 않게)


def state() -> dict:
    return {"custom": ENABLED, "mac": True, **_state}


def command(action: str, payload: dict | None = None) -> dict:
    """/api/window: regions(끌 곳 알림) 또는 최소화·확대·닫기(화면에 단추는 없지만 Windows 와 같은 API)."""
    global _regions, _lights, _probe
    if not ENABLED:
        return state()
    if action == "regions" and isinstance(payload, dict):
        try:
            width = float(payload.get("w") or 0)
            drag = [_rect(r) for r in payload.get("drag") or []][:50]
            nodrag = [_rect(r) for r in payload.get("nodrag") or []][:400]
            if width > 0:
                _regions = (width, [r for r in drag if r], [r for r in nodrag if r])
            lx, cy = float(payload.get("lx") or _lights[0]), float(payload.get("cy") or _lights[1])
            if 0 <= lx <= 200 and 8 <= cy <= 120 and (lx, cy) != _lights:
                _lights = (lx, cy)
                AppHelper.callAfter(_place_lights)
            _probe = payload.get("probe") if isinstance(payload.get("probe"), dict) else {}
        except (TypeError, ValueError):
            pass
        return state()
    if _win is not None:
        if action == "minimize":
            AppHelper.callAfter(_win.miniaturize_, None)
        elif action == "maximize":
            AppHelper.callAfter(_win.zoom_, None)
        elif action == "close":
            AppHelper.callAfter(_win.performClose_, None)
    return state()


def _rect(r):
    try:
        x, y, w, h = (float(v) for v in r)
    except (TypeError, ValueError):
        return None
    return (x, y, w, h) if w > 0 and h > 0 else None


def _scale() -> float:
    """CSS px 하나가 몇 포인트인지 (WKWebView 확대가 1 이 아니면 1 이 아니다)."""
    reg = _regions
    if _view is None or not reg or reg[0] <= 0:
        return 1.0
    width = float(_view.bounds().size.width)
    return width / reg[0] if width > 0 else 1.0


def is_drag_point(x: float, y: float) -> bool:
    """CSS 좌표(창 왼쪽 위 기준)가 창을 끄는 자리인지."""
    reg = _regions
    if reg is None:
        return 0 <= y < FALLBACK_DRAG_PX
    inside = lambda r: r[0] <= x < r[0] + r[2] and r[1] <= y < r[1] + r[3]  # noqa: E731
    return any(inside(r) for r in reg[1]) and not any(inside(r) for r in reg[2])


def _css_point(view, event):
    p = view.convertPoint_fromView_(event.locationInWindow(), None)
    height = float(view.bounds().size.height)
    y = float(p.y) if view.isFlipped() else height - float(p.y)
    scale = _scale()
    return float(p.x) / scale, y / scale


def _double_click(win) -> None:
    """제목 막대를 두 번 눌렀을 때: 시스템 설정 › 데스크탑 및 Dock › '윈도우 제목 막대를 이중 클릭할 때' 를 따른다."""
    action = Foundation.NSUserDefaults.standardUserDefaults().stringForKey_("AppleActionOnDoubleClick")
    action = str(action or "Maximize")
    if action == "Minimize":
        win.miniaturize_(None)
    elif action in ("None", "Do Nothing"):
        return
    elif action == "Fill":
        screen = win.screen() or AppKit.NSScreen.mainScreen()
        win.setFrame_display_animate_(screen.visibleFrame(), True, True)
    else:
        win.zoom_(None)


def _handle_mouse_down(view, event) -> bool:
    """끌 곳을 눌렀으면 창을 끌고 True (웹에는 넘기지 않는다)."""
    global _last_decision
    if not ENABLED:
        return False
    win = view.window()
    if win is None or win.styleMask() & _FULLSCREEN or event.modifierFlags() & _CONTROL:
        return False
    x, y = _css_point(view, event)
    drag = is_drag_point(x, y)
    _last_decision = {"x": round(x, 1), "y": round(y, 1), "drag": drag, "clicks": int(event.clickCount())}
    if not drag:
        return False
    if _record_only:
        return True
    if event.clickCount() >= 2:
        _double_click(win)
    else:
        win.performWindowDragWithEvent_(event)
    return True


def _install_mouse_hook(host_cls) -> None:
    """pywebview 의 WKWebView 하위 클래스(WebKitHost)의 mouseDown: 을 바꿔 끼운다.

    하위 클래스를 새로 만들어 BrowserView.WebKitHost 를 바꾸면 pywebview 안의 super(BrowserView.WebKitHost, self)
    가 자기 자신을 가리켜 끝없이 돈다. 그래서 같은 클래스의 메서드만 바꾼다(objc.classAddMethods 는 같은 이름을 덮어쓴다).
    """
    global _hooked
    if _hooked:
        return
    original = getattr(host_cls.mouseDown_, "callable", None)

    def mouseDown_(self, event):
        try:
            if _handle_mouse_down(self, event):
                return
        except Exception:
            pass
        if original is not None:
            original(self, event)
        else:
            objc.super(host_cls, self).mouseDown_(event)

    objc.classAddMethods(host_cls, [objc.selector(mouseDown_, selector=b"mouseDown:", signature=b"v@:@")])
    _hooked = True


def _buttons(win):
    return [win.standardWindowButton_(i) for i in (0, 1, 2)]  # 닫기·최소화·확대


def _place_lights() -> None:
    """신호등을 상단 바 첫 줄 가운데 높이로 옮긴다. 메인 스레드에서만 부른다."""
    win = _win
    if win is None or win.styleMask() & _FULLSCREEN:
        return
    try:
        close, mini, zoom = _buttons(win)
        if close is None or mini is None or zoom is None:
            return
        titlebar = close.superview()
        container = titlebar.superview() if titlebar is not None else None
        if container is None:
            return
        scale = _scale()
        lx, cy = _lights[0] * scale, _lights[1] * scale
        h = float(close.frame().size.height)
        space = float(mini.frame().origin.x - close.frame().origin.x) or 20.0
        band = max(round(cy * 2), h + 4)
        win_h = float(win.frame().size.height)
        cf = container.frame()
        container.setFrame_(((cf.origin.x, win_h - band), (cf.size.width, band)))
        titlebar.setFrame_(((0, 0), (cf.size.width, band)))
        y = (band - h) / 2
        for i, btn in enumerate((close, mini, zoom)):
            btn.setFrameOrigin_((lx + i * space, y))
    except Exception:
        pass


class _TitlebarWatch(Foundation.NSObject):
    """창 모양(라이트·다크)·제목이 바뀌면 AppKit 이 제목 줄을 다시 배치해 신호등이 창 맨 위로 돌아간다
    (CI 실측 2026-10-26: 다크로 바꾸자 신호등 가운데가 30 → 2·-2). 크기 알림은 오지 않아 KVO 로 본다."""

    def observeValueForKeyPath_ofObject_change_context_(self, path, obj, change, context):
        # 배치는 바뀐 직후 다음 차례에 일어나므로 조금 뒤에 한 번 더 놓는다
        AppHelper.callAfter(_place_lights)
        AppHelper.callLater(0.15, _place_lights)


def _refresh_state(_note=None) -> None:
    win = _win
    if win is None:
        return
    _state["fullscreen"] = bool(win.styleMask() & _FULLSCREEN)
    _state["maximized"] = bool(win.isZoomed())
    _place_lights()


def _clear_titlebar_paint(win) -> None:
    """pywebview 가 칠한 제목 줄 바탕(windowBackgroundColor)을 투명하게. 다크 모드에서 검은 띠가 된 것이 이것이다."""
    try:
        view = win.contentView().superview().subviews().lastObject()
        if view is not None and view.respondsToSelector_(b"setBackgroundColor:"):
            view.setBackgroundColor_(AppKit.NSColor.clearColor())
    except Exception:
        pass


def install(window) -> bool:
    """before_show(메인 스레드)에서 부른다. 실패하면 기본 제목 줄을 그대로 둔다.

    인자 이름은 window 여야 한다: pywebview 의 Event 는 인자 이름이 window 일 때만 창을 넘겨준다(webview/event.py).
    """
    global ENABLED, _win, _view
    try:
        from webview.platforms.cocoa import BrowserView

        win = window.native
        inst = BrowserView.instances.get(window.uid)
        if win is None or inst is None:
            return False
        _install_mouse_hook(BrowserView.WebKitHost)
        _clear_titlebar_paint(win)
        win.setTitlebarAppearsTransparent_(True)
        win.setTitleVisibility_(1)  # NSWindowTitleHidden: 화면 이름('과제 마감')을 제목 줄에 쓰지 않는다
        win.setStyleMask_(win.styleMask() | _FULL_SIZE)
        if win.respondsToSelector_(b"setTitlebarSeparatorStyle:"):
            win.setTitlebarSeparatorStyle_(1)  # NSTitlebarSeparatorStyleNone (macOS 11+)
        _win, _view = win, inst.webview
        center = AppKit.NSNotificationCenter.defaultCenter()
        for name in (
            "NSWindowDidResizeNotification",
            "NSWindowDidEndLiveResizeNotification",
            "NSWindowDidEnterFullScreenNotification",
            "NSWindowDidExitFullScreenNotification",
            "NSWindowDidBecomeKeyNotification",
            "NSWindowDidResignKeyNotification",
            "NSWindowDidChangeScreenNotification",
            "NSWindowDidDeminiaturizeNotification",
        ):
            _observers.append(center.addObserverForName_object_queue_usingBlock_(name, win, None, _refresh_state))
        watch = _TitlebarWatch.alloc().init()
        for key in ("effectiveAppearance", "title"):
            win.addObserver_forKeyPath_options_context_(watch, key, 0, None)
        _observers.append(watch)
        ENABLED = True
        _refresh_state()
        out = os.environ.get("DALING_WINDOW_SELFTEST")
        if out:
            threading.Thread(target=_selftest, args=(Path(out),), daemon=True).start()
        return True
    except Exception as exc:
        ENABLED = False
        out = os.environ.get("DALING_WINDOW_SELFTEST")
        if out:
            Path(out).mkdir(parents=True, exist_ok=True)
            (Path(out) / "install-error.txt").write_text(f"{type(exc).__name__}: {exc}", encoding="utf-8")
            (Path(out) / "done").write_text("1")
        return False


# ---------- 자가 점검 (CI 의 맥 러너에서만, DALING_WINDOW_SELFTEST) ----------


def _on_main(fn, timeout: float = 10.0):
    box: dict = {}
    done = threading.Event()

    def run():
        try:
            box["value"] = fn()
        except Exception as exc:  # 점검 결과에 남긴다
            box["error"] = f"{type(exc).__name__}: {exc}"
        done.set()

    AppHelper.callAfter(run)
    done.wait(timeout)
    if "error" in box:
        raise RuntimeError(box["error"])
    return box.get("value")


def _eval_js(script: str, timeout: float = 5.0):
    box: dict = {}
    done = threading.Event()

    def handler(result, error):
        box["value"] = None if error is not None else result
        if error is not None:
            box["error"] = str(error)
        done.set()

    AppHelper.callAfter(lambda: _view.evaluateJavaScript_completionHandler_(script, handler))
    done.wait(timeout)
    return box.get("value")


def _find_point(rects, avoid, step=6.0):
    for r in rects:
        y = r[1] + 4
        while y < r[1] + min(r[3], 140):
            x = r[0] + 4
            while x < r[0] + r[2]:
                if not any(a[0] <= x < a[0] + a[2] and a[1] <= y < a[1] + a[3] for a in avoid):
                    return [round(x, 1), round(y, 1)]
                x += step
            y += step
    return None


def _measure(label: str) -> dict:
    """메인 스레드에서: 창 모양·신호등 자리·눌렀을 때 누가 받는지."""
    win, view = _win, _view
    theme = win.contentView().superview()
    win_h = float(theme.bounds().size.height)
    scale = _scale()
    out: dict = {
        "label": label,
        "macos": str(Foundation.NSProcessInfo.processInfo().operatingSystemVersionString()),
        "window": [float(win.frame().size.width), win_h],
        "styleMaskFullSize": bool(win.styleMask() & _FULL_SIZE),
        "titlebarTransparent": bool(win.titlebarAppearsTransparent()),
        "titleHidden": int(win.titleVisibility()) == 1,
        "fullscreen": bool(win.styleMask() & _FULLSCREEN),
        "scale": scale,
        "lightsWanted": {"x": _lights[0], "cy": _lights[1]},
        "regions": None if _regions is None else {"w": _regions[0], "drag": len(_regions[1]), "nodrag": len(_regions[2])},
        "contentViewIsWebview": bool(win.contentView() is view),
        "webviewFrame": [list(view.frame().origin), list(view.frame().size)],
    }
    lights = []
    for btn in _buttons(win):
        r = btn.convertRect_toView_(btn.bounds(), None)
        top = win_h - float(r.origin.y + r.size.height)
        lights.append({"x": round(float(r.origin.x) / scale, 1), "top": round(top / scale, 1),
                       "w": round(float(r.size.width) / scale, 1), "h": round(float(r.size.height) / scale, 1),
                       "cy": round((top + float(r.size.height) / 2) / scale, 1), "hidden": bool(btn.isHidden())})
    out["lights"] = lights
    probes = {}
    if _regions is not None:
        drag, nodrag = _regions[1], _regions[2]
        probes["topbarEmpty"] = _find_point(drag[:1], nodrag)
        probes["sidebarEmpty"] = _find_point(drag[1:2], nodrag)
    for key in ("button", "search", "nowbar"):
        if isinstance(_probe.get(key), list):
            probes[key] = _probe[key]
    if lights:
        probes["zoomLight"] = [lights[2]["x"] + lights[2]["w"] / 2, lights[2]["cy"]]
    hits = {}
    for name, pt in probes.items():
        if not pt:
            continue
        wp = (pt[0] * scale, win_h - pt[1] * scale)
        hit = theme.hitTest_(wp)
        chain, v = [], hit
        while v is not None and len(chain) < 4:
            chain.append(str(v.className()))
            v = v.superview()
        hits[name] = {"point": pt, "hit": chain, "drag": is_drag_point(*pt),
                      "toWebview": bool(hit is not None and (hit is view or hit.isDescendantOf_(view)))}
    out["hits"] = hits
    return out


def _send_click(pt, clicks=1) -> dict:
    """메인 스레드에서: 가짜 마우스 누름·뗌을 창에 보낸다(창의 실제 경로: 제목 줄 → 웹뷰 → 우리 판정)."""
    global _record_only, _last_decision
    _last_decision = {}  # 우리 판정까지 못 왔으면(제목 줄이 먹었으면) 빈 값으로 남게
    win = _win
    win_h = float(win.contentView().superview().bounds().size.height)
    scale = _scale()
    loc = (pt[0] * scale, win_h - pt[1] * scale)
    num = win.windowNumber()
    ts = AppKit.NSProcessInfo.processInfo().systemUptime()
    kinds = (AppKit.NSEventTypeLeftMouseDown, AppKit.NSEventTypeLeftMouseUp)
    _record_only = True
    try:
        for i, kind in enumerate(kinds):
            ev = AppKit.NSEvent.mouseEventWithType_location_modifierFlags_timestamp_windowNumber_context_eventNumber_clickCount_pressure_(
                kind, loc, 0, ts + i * 0.05, num, None, 0, clicks, 1.0 if i == 0 else 0.0)
            win.sendEvent_(ev)
    finally:
        _record_only = False
    return dict(_last_decision)


def _selftest(out: Path) -> None:
    out.mkdir(parents=True, exist_ok=True)
    log = out / "selftest.log"

    def note(msg):
        with log.open("a", encoding="utf-8") as f:
            f.write(f"{time.strftime('%H:%M:%S')} {msg}\n")

    def write(name, data):
        (out / name).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        note(f"{name} 남김")

    def wait_regions(prev=None, limit=40.0):
        end = time.time() + limit
        while time.time() < end:
            if _regions is not None and _regions is not prev:
                return True
            time.sleep(0.3)
        return False

    try:
        note("시작")
        if not wait_regions():
            note("화면이 끌 곳을 보내지 않음")
        time.sleep(2.0)
        _eval_js("window.__dalingDown=[];document.addEventListener('mousedown',function(e){var b=e.target.closest('button,a,input');"
                 "window.__dalingDown.push(b?(b.id||b.className||b.tagName):'(none)')},true);true")
        wide = _on_main(lambda: _measure("wide"))
        # 웹뷰로 가야 할 자리(단추)를 눌러 실제로 웹이 받는지, 끌 곳을 눌러 웹에 안 가는지
        clicks = {}
        for name in ("button", "search", "topbarEmpty", "sidebarEmpty"):
            pt = (wide.get("hits", {}).get(name) or {}).get("point")
            if pt:
                before = len(_eval_js("window.__dalingDown") or [])
                decision = _on_main(lambda p=pt: _send_click(p))
                time.sleep(0.6)
                seen = _eval_js("window.__dalingDown") or []
                clicks[name] = {"decision": decision, "webGotMouseDown": len(seen) > before,
                                "webTarget": seen[-1] if len(seen) > before else None}
        wide["clicks"] = clicks
        write("wide.json", wide)
        (out / "shot-wide.request").write_text("1")
        time.sleep(3.0)

        # 좁은 창(휴대폰 비율: 메뉴가 아래 탭바로) — 신호등이 상단 바 왼쪽에 오는지
        prev = _regions
        _on_main(lambda: _win.setFrame_display_(((_win.frame().origin.x, _win.frame().origin.y), (700, 800)), True))
        wait_regions(prev, 10)
        time.sleep(1.5)
        write("narrow.json", _on_main(lambda: _measure("narrow")))
        (out / "shot-narrow.request").write_text("1")
        time.sleep(3.0)

        # 다크 모드(사용자 사진의 검은 띠): 창 모양만 어둡게 해서 제목 줄 띠가 남는지
        prev = _regions
        _on_main(lambda: _win.setFrame_display_(((_win.frame().origin.x, _win.frame().origin.y), (1200, 800)), True))
        wait_regions(prev, 10)
        _on_main(lambda: _win.setAppearance_(AppKit.NSAppearance.appearanceNamed_("NSAppearanceNameDarkAqua")))
        time.sleep(1.5)
        write("dark.json", _on_main(lambda: _measure("dark")))
        (out / "shot-dark.request").write_text("1")
        time.sleep(3.0)

        # 실제 마우스(러너가 허락하면): 끌 곳의 화면 좌표와 지금 창 자리를 남기고, 워크플로가 끌어 본 뒤 자리를 다시 잰다
        def screen_info():
            frame = _win.frame()
            top = float(AppKit.NSScreen.screens()[0].frame().size.height)
            d = (_measure("drag").get("hits", {}).get("topbarEmpty") or {}).get("point") or [300, 6]
            scale = _scale()
            win_top = top - float(frame.origin.y + frame.size.height)
            return {"frame": [float(frame.origin.x), win_top, float(frame.size.width), float(frame.size.height)],
                    "dragScreen": [round(float(frame.origin.x) + d[0] * scale), round(win_top + d[1] * scale)]}

        write("drag-ready.json", _on_main(screen_info))
        end = time.time() + 40
        while time.time() < end and not (out / "drag-done.request").exists():
            time.sleep(0.5)
        time.sleep(1.0)
        after = _on_main(screen_info)
        after["lastDecision"] = dict(_last_decision)
        write("drag-after.json", after)
        note("끝")
    except Exception as exc:
        note(f"오류: {type(exc).__name__}: {exc}")
    (out / "done").write_text("1")
