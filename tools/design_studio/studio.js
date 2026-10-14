/* 디자인 스튜디오 — 진짜 화면(app.js) 위에 얹는 편집 도구.
   화면을 직접 만져 보고(색·크기·간격·위치·글자) 영역마다 댓글을 달아 저장하면,
   Claude Code 가 저장본(tools/design_studio/requests/*.md·json)을 읽어 실제 코드에 옮긴다.

   지키는 것
   - 앱 화면 코드는 한 줄도 건드리지 않는다. 바꾼 모양은 맨 뒤에 붙인 <style> 한 장(덮어쓰기 규칙)으로만 보여 준다.
     그래서 앱이 목록을 다시 그려도 모양 변경은 그대로 남고, 저장본에 '그대로 붙일 수 있는 CSS' 가 함께 나간다.
   - 도구 화면은 Shadow DOM 안에 둔다. 앱의 전역 스타일([hidden]·button 등)과 서로 섞이지 않게.
   - 고르기·댓글 모드에서는 앱이 누르기를 받지 않는다(동기화 단추를 눌러도 아무 일 없음). Alt 를 누른 채 누르면 앱이 그대로 받는다. */
(() => {
  "use strict";
  const INFO = window.__STUDIO__ || {};
  const DRAFT_KEY = "daling-studio-draft-v1";
  const PARAMS = new URLSearchParams(location.search);

  // '지금 열려 있음·골라짐' 같은 상태 이름표는 모양 범위를 정할 때 빼야 같은 모양을 모두 잡는다
  const STATE_CLS = /^(active|open|opened|selected|current|is-|has-|show|shown|visible|collapsed|expanded|dragging|drag-|drop-|loading|focus|hover|today|now)/;
  const VIEW_LABEL = {
    dashboard: "대시보드", deadlines: "마감", calendar: "캘린더", courses: "과목", files: "자료",
    emails: "메일함", storage: "서랍", settings: "설정",
  };
  const THEMES = [
    { key: "claude", label: "기본" }, { key: "light", label: "화이트" },
    { key: "navy", label: "남색" }, { key: "dark", label: "다크" },
  ];
  const TOKEN_GROUPS = [
    ["바탕", [["--bg", "화면 바탕"], ["--bg-deep", "깊은 바탕"], ["--surface", "카드"], ["--surface-soft", "옅은 카드"]]],
    ["선", [["--border", "선"], ["--border-strong", "진한 선"]]],
    ["글자", [["--text", "글자"], ["--text-soft", "흐린 글자"], ["--text-faint", "더 흐린 글자"]]],
    ["강조", [["--accent", "강조"], ["--accent-strong", "진한 강조"], ["--accent-soft", "옅은 강조"]]],
    ["상태", [
      ["--green", "초록"], ["--green-soft", "옅은 초록"], ["--amber", "노랑"], ["--amber-soft", "옅은 노랑"],
      ["--red", "빨강"], ["--red-soft", "옅은 빨강"], ["--blue", "파랑"], ["--blue-soft", "옅은 파랑"],
      ["--violet", "보라"], ["--violet-soft", "옅은 보라"],
    ]],
    ["로고", [["--bp-bg", "로고 바탕"], ["--bp-body", "로고 몸통"], ["--bp-hi", "로고 밝은 곳"], ["--bp-line", "로고 선"]]],
  ];
  const SIZE_TOKENS = [["--radius", "큰 모서리", 0, 32], ["--radius-sm", "작은 모서리", 0, 24]];
  const SWATCH_TOKENS = ["--accent", "--accent-strong", "--accent-soft", "--text", "--text-soft", "--surface",
    "--surface-soft", "--bg", "--border"];
  const ACCENT_PRESETS = [
    ["코랄", "#c0674a"], ["주황", "#d9822b"], ["빨강", "#c2413b"], ["분홍", "#c94f7c"], ["보라", "#7651c2"],
    ["남색", "#3e63a6"], ["파랑", "#2f7bd8"], ["청록", "#2c8c8c"], ["초록", "#4f7a55"], ["먹색", "#3a3a38"],
  ];
  const SHADOWS = [
    ["그대로", ""], ["없음", "none"], ["약하게", "0 1px 2px rgba(0,0,0,.06)"], ["앱 기본", "var(--shadow)"],
    ["강하게", "0 14px 34px -12px rgba(0,0,0,.30)"],
  ];
  const KINDS = [["fix", "고쳐 줘"], ["idea", "아이디어"], ["keep", "좋아요·유지"], ["question", "질문"]];

  /* ---------- 상태 ---------- */
  let seq = 1;
  const uid = (p) => `${p}${Date.now().toString(36)}${(seq++).toString(36)}`;
  const newVariant = (name, changes = []) => ({ id: uid("v"), name, changes });
  const S = {
    mode: "browse",
    variants: [newVariant("조합 A")],
    active: 0,
    comments: [],
    title: "",
    note: "",
    freedom: "refine",
    tab: "palette",
    hover: null,
    sel: null, // { el, path }
    scope: null, // 고른 요소에 쓸 선택자
    undo: [],
    redo: [],
    editKey: null,
    editing: null, // 글자 고치는 중인 요소
    side: "right",
    collapsed: false,
    clean: PARAMS.get("clean") === "1",
    savedAs: "",
  };
  const cur = () => S.variants[S.active];

  /* ---------- 작은 도구 ---------- */
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const themeKey = () => document.documentElement.dataset.theme || "claude";
  const themeLabel = (k) => (THEMES.find((t) => t.key === k) || { label: k }).label;
  const viewKey = () => {
    try { return (typeof state !== "undefined" && state.view) || "dashboard"; } catch { return "dashboard"; }
  };
  const viewLabel = (v) => VIEW_LABEL[v] || v;
  const rootVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const px = (v) => Math.round(parseFloat(v) || 0);

  const colorCtx = document.createElement("canvas").getContext("2d");
  function toHex(color) {
    if (!color) return "#000000";
    colorCtx.fillStyle = "#000000";
    colorCtx.fillStyle = color;
    const v = colorCtx.fillStyle; // '#rrggbb' 또는 'rgba(r, g, b, a)'
    if (v.startsWith("#")) return v;
    const m = v.match(/[\d.]+/g) || [0, 0, 0];
    return "#" + m.slice(0, 3).map((n) => Math.round(+n).toString(16).padStart(2, "0")).join("");
  }
  const isClear = (c) => /^transparent$|rgba\([^)]*,\s*0\)$/.test(String(c).trim());
  function hexToHsl(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h /= 6;
    }
    return [h, s, l];
  }
  function hslToHex(h, s, l) {
    l = Math.min(1, Math.max(0, l));
    const f = (n) => {
      const k = (n + h * 12) % 12;
      const a = s * Math.min(l, 1 - l);
      return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }
  function mix(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch = (p, sh) => (p >> sh) & 255;
    return "#" + [16, 8, 0].map((sh) => Math.round(ch(pa, sh) * (1 - t) + ch(pb, sh) * t).toString(16).padStart(2, "0")).join("");
  }

  /* ---------- 요소 이름 붙이기 ---------- */
  function goodClasses(el) {
    return [...el.classList].filter((c) => !STATE_CLS.test(c) && !c.startsWith("__studio"));
  }
  function cssPath(el) {
    if (el.id) return `#${CSS.escape(el.id)}`;
    const parts = [];
    for (let n = el; n && n.nodeType === 1 && n !== document.documentElement; n = n.parentElement) {
      if (n !== el && n.id) { parts.unshift(`#${CSS.escape(n.id)}`); break; }
      let s = n.tagName.toLowerCase();
      const c = goodClasses(n)[0];
      if (c) s += `.${CSS.escape(c)}`;
      const p = n.parentElement;
      if (p && n !== document.body) {
        const same = [...p.children].filter((x) => x.tagName === n.tagName);
        if (same.length > 1) s += `:nth-of-type(${same.indexOf(n) + 1})`;
      }
      parts.unshift(s);
      if (n === document.body) break;
    }
    return parts.join(" > ");
  }
  function nearestNamed(el) {
    for (let n = el, i = 0; n && n !== document.body && i < 4; n = n.parentElement, i++) {
      if (n.id) return `#${CSS.escape(n.id)}`;
      const c = goodClasses(n)[0];
      if (c) return `.${CSS.escape(c)}`;
    }
    return "";
  }
  const countOf = (sel) => {
    try { return document.querySelectorAll(sel).length; } catch { return 0; }
  };
  function scopeOptions(el) {
    const out = [];
    const push = (sel, label) => {
      if (!sel || out.some((o) => o.sel === sel)) return;
      const n = countOf(sel);
      if (n) out.push({ sel, n, label });
    };
    const cls = goodClasses(el);
    const tag = el.tagName.toLowerCase();
    if (cls.length) {
      const full = "." + cls.map((c) => CSS.escape(c)).join(".");
      push(full, "같은 모양 모두");
      if (cls.length > 1) push(`.${CSS.escape(cls[0])}`, "더 넓게");
      const p = el.parentElement && nearestNamed(el.parentElement);
      if (p) push(`${p} ${full}`, "이 묶음 안에서만");
    } else {
      const p = el.parentElement && nearestNamed(el.parentElement);
      if (p) push(`${p} ${tag}`, "같은 묶음의 같은 태그");
    }
    if (el.id) push(`#${CSS.escape(el.id)}`, "이 요소(id)");
    push(cssPath(el), "이 요소만");
    return out;
  }

  let RULES = null;
  const UNIVERSAL = /^\s*(\*|\*?::?[\w-]+(\([^)]*\))?|html|body|:root)\s*$/;
  function cssRules() {
    if (RULES) return RULES;
    RULES = [];
    const walk = (rules, media) => {
      for (const r of rules) {
        if (r.selectorText) RULES.push({ sel: r.selectorText, media });
        else if (r.cssRules) walk(r.cssRules, r.conditionText || (r.media && r.media.mediaText) || media);
      }
    };
    for (const sh of document.styleSheets) {
      if (!sh.href || !/\/styles\.css/.test(sh.href)) continue;
      try { walk(sh.cssRules, ""); } catch { /* 다른 출처 스타일시트는 못 읽는다 */ }
    }
    return RULES;
  }
  function matchedRules(el) {
    const out = [];
    for (const r of cssRules()) {
      if (r.sel.split(",").every((part) => UNIVERSAL.test(part))) continue;
      let ok = false;
      try { ok = el.matches(r.sel); } catch { ok = false; }
      if (!ok) continue;
      const text = r.media ? `${r.sel}  (@media ${r.media})` : r.sel;
      if (!out.includes(text)) out.push(text);
    }
    return out.slice(-8);
  }
  function textOf(el) {
    const t = el.innerText || el.value || el.getAttribute("aria-label") || el.title || el.alt || "";
    return String(t).trim().replace(/\s+/g, " ").slice(0, 80);
  }
  function shortLabel(el) {
    const c = goodClasses(el).slice(0, 2).map((x) => "." + x).join("");
    return el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + c;
  }
  function describe(el, scope) {
    const r = el.getBoundingClientRect();
    return {
      selector: scope || (scopeOptions(el)[0] || {}).sel || cssPath(el),
      path: cssPath(el),
      label: shortLabel(el),
      text: textOf(el),
      rules: matchedRules(el),
      view: viewKey(),
      size: `${Math.round(r.width)}×${Math.round(r.height)}`,
    };
  }
  function resolve(target, cached) {
    if (cached && cached.isConnected) return cached;
    if (!target) return null;
    try {
      const el = document.querySelector(target.path);
      if (el && el !== ovHost) return el;
    } catch { /* 선택자가 이제 안 맞을 수 있다 */ }
    return null;
  }

  /* ---------- 바꾼 것 적용 ---------- */
  const overrideStyle = document.createElement("style");
  overrideStyle.id = "__studio-overrides";
  document.head.appendChild(overrideStyle);

  function themeSelector(theme) {
    return theme === "claude" ? ":root:not([data-theme])" : `:root[data-theme="${theme}"]`;
  }
  function compileCss(changes) {
    const tokens = new Map();
    const styles = new Map();
    for (const c of changes) {
      if (c.type === "token") {
        if (!tokens.has(c.theme)) tokens.set(c.theme, new Map());
        tokens.get(c.theme).set(c.name, c.to);
      } else if (c.type === "style") {
        if (!styles.has(c.selector)) styles.set(c.selector, new Map());
        const m = styles.get(c.selector);
        m.delete(c.prop); // 마지막에 바꾼 것이 뒤에 오게
        m.set(c.prop, c.to);
      }
    }
    const blocks = [];
    for (const [theme, m] of tokens) {
      blocks.push(`${themeSelector(theme)} {\n${[...m].map(([k, v]) => `  ${k}: ${v};`).join("\n")}\n}`);
    }
    for (const [sel, m] of styles) {
      blocks.push(`${sel} {\n${[...m].map(([k, v]) => `  ${k}: ${v};`).join("\n")}\n}`);
    }
    return blocks.join("\n\n");
  }
  function applyCss() {
    // 화면에서는 !important 로 덮어 보여 준다 (원래 규칙이 더 구체적이어도 이기게). 저장본 CSS 에는 붙이지 않는다.
    overrideStyle.textContent = compileCss(cur().changes).replace(/;\n/g, " !important;\n");
    scheduleDraw();
  }

  function applyDom(c) {
    const el = resolve(c.target, c._el);
    if (!el) return false;
    c._el = el;
    if (c.type === "text") {
      if (c._html == null) c._html = el.innerHTML;
      if (c._live) {
        c._live = false; // 방금 화면에서 고친 그대로라 다시 넣지 않는다
        return true;
      }
      // 아이콘(<span><svg>)이 든 단추는 innerText 를 통째로 바꾸면 아이콘이 사라진다. 글자 조각이 하나면 그것만 바꾼다.
      const texts = [];
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) if (walker.currentNode.data.trim()) texts.push(walker.currentNode);
      if (texts.length === 1) texts[0].data = c.to;
      else el.innerText = c.to;
    } else if (c.type === "move") {
      const ref = resolve(c.ref, c._ref);
      if (!ref || ref.parentElement !== el.parentElement) return false;
      c._ref = ref;
      if (!c._home) c._home = { parent: el.parentElement, next: el.nextSibling };
      ref.parentElement.insertBefore(el, c.where === "before" ? ref : ref.nextSibling);
    }
    return true;
  }
  function revertDom(c) {
    const el = c._el;
    if (!el || !el.isConnected) return;
    if (c.type === "text" && c._html != null) el.innerHTML = c._html;
    if (c.type === "move" && c._home && c._home.parent.isConnected) {
      const next = c._home.next && c._home.next.parentNode === c._home.parent ? c._home.next : null;
      c._home.parent.insertBefore(el, next);
    }
  }
  const isDom = (c) => c.type === "text" || c.type === "move";

  function commit(change, { coalesce = false } = {}) {
    const list = cur().changes;
    // 끌고 있는 동안(같은 편집 묶음)에 같은 자리를 바꾼 줄이 있으면 그 줄의 값만 고친다
    const same = coalesce && S.editKey && list.find((c) => c._k === S.editKey && c.type === change.type &&
      c.selector === change.selector && c.prop === change.prop && c.name === change.name && c.theme === change.theme);
    if (same) {
      same.to = change.to;
    } else {
      change.id = uid("c");
      change._k = S.editKey;
      change.createdAt = new Date().toISOString();
      list.push(change);
      S.undo.push({ op: "add", vid: cur().id, change, group: S.group });
      S.redo = [];
    }
    if (isDom(change)) applyDom(change);
    applyCss();
    saveDraftSoon();
    renderPanelSoon();
  }
  function removeChange(id) {
    const list = cur().changes;
    const i = list.findIndex((c) => c.id === id);
    if (i < 0) return;
    const [c] = list.splice(i, 1);
    if (isDom(c)) revertDom(c);
    S.undo.push({ op: "remove", vid: cur().id, change: c, index: i });
    S.redo = [];
    applyCss();
    saveDraftSoon();
    renderPanel();
  }
  function undoRedo(from, to) {
    const step = from.pop();
    if (!step) return toast(from === S.undo ? "되돌릴 것이 없어요" : "다시 할 것이 없어요");
    undoOne(step, from, to);
    while (step.group && from.length && from[from.length - 1].group === step.group) undoOne(from.pop(), from, to);
    S.editKey = null;
    applyCss();
    saveDraftSoon();
    renderPanel();
  }
  function undoOne(step, from, to) {
    const vi = S.variants.findIndex((v) => v.id === step.vid);
    if (vi < 0) return;
    if (vi !== S.active) switchVariant(vi);
    const list = cur().changes;
    const adding = (from === S.undo) === (step.op === "remove");
    if (adding) {
      list.splice(step.index ?? list.length, 0, step.change);
      if (isDom(step.change)) applyDom(step.change);
    } else {
      const i = list.indexOf(step.change);
      if (i >= 0) {
        step.index = i;
        list.splice(i, 1);
      }
      if (isDom(step.change)) revertDom(step.change);
    }
    to.push(step);
  }
  const undo = () => undoRedo(S.undo, S.redo);
  const redo = () => undoRedo(S.redo, S.undo);

  function switchVariant(i) {
    if (i === S.active || !S.variants[i]) return;
    [...cur().changes].reverse().filter(isDom).forEach(revertDom);
    S.active = i;
    cur().changes.filter(isDom).forEach(applyDom);
    S.editKey = null;
    applyCss();
    saveDraftSoon(false);
    render();
  }

  /* ---------- 값 바꾸기 ---------- */
  function setStyle(prop, value) {
    if (!S.sel) return;
    const el = S.sel.el;
    // 같은 곳을 두 번째 만질 때는 이미 덮어쓴 값이 보인다. '원래' 값은 처음 바꿀 때 것을 이어 쓴다.
    const prev = cur().changes.find((c) => c.type === "style" && c.selector === S.scope && c.prop === prop);
    commit(
      { type: "style", selector: S.scope, prop, from: prev ? prev.from : getComputedStyle(el).getPropertyValue(prop).trim(), to: value,
        target: describe(el, S.scope), count: countOf(S.scope) },
      { coalesce: true },
    );
  }
  function resetStyle(prop) {
    const list = cur().changes.filter((c) => c.type === "style" && c.selector === S.scope && c.prop === prop);
    list.forEach((c) => removeChange(c.id));
  }
  function setToken(name, value) {
    const theme = themeKey();
    const prev = cur().changes.find((c) => c.type === "token" && c.theme === theme && c.name === name);
    commit({ type: "token", theme, name, from: prev ? prev.from : rootVar(name), to: value }, { coalesce: true });
  }
  function setAccent(hex) {
    const theme = themeKey();
    const dark = theme === "dark";
    const [h, s, l] = hexToHsl(hex);
    const surface = toHex(rootVar("--surface") || "#ffffff");
    // 세 줄을 한 묶음으로: 직접 고르기 창을 끄는 동안에는 같은 세 줄만 고치고, 되돌리기는 한 번에
    const base = S.editKey || uid("k");
    S.group = base;
    S.editKey = base;
    setToken("--accent", hex);
    setToken("--accent-strong", hslToHex(h, s, dark ? l + 0.14 : l - 0.13));
    setToken("--accent-soft", mix(hex, surface, dark ? 0.78 : 0.87));
    S.editKey = base;
    S.group = null;
  }

  /* ---------- 도구 화면 (Shadow DOM 두 장) ----------
     앱은 바깥 틀(/ 의 shell) 안의 iframe 에서 돈다. 패널을 옆에 붙이면 iframe 이 실제로 좁아져서,
     앱이 그 너비에 맞는 진짜 배치(미디어 쿼리 포함)로 그려진다. 예전처럼 body 에 여백만 주면
     1440px 배치가 1086px 에 욱여넣어져 실제 앱에서는 절대 안 나오는 화면을 보고 고치게 됐다.
       - 겹쳐 그리기(고른 상자·핀·옮기기 손잡이): 앱 문서 안 (좌표가 앱과 같다)
       - 막대·패널·댓글 창·저장 창: 바깥 틀 문서 안 (iframe 이 좁아져도 그대로)
     바깥 틀 없이 열리면(?clean=1 사진 찍기) 둘 다 앱 문서에 둔다. */
  const TOP = (() => {
    try {
      return window.parent !== window && window.parent.__STUDIO_SHELL__ ? window.parent : window;
    } catch {
      return window;
    }
  })();
  const IN_SHELL = TOP !== window;
  const ovHost = document.createElement("div");
  ovHost.id = "__daling-studio-ov";
  const ovRoot = ovHost.attachShadow({ mode: "open" });
  const host = TOP.document.createElement("div");
  host.id = "__daling-studio";
  const root = host.attachShadow({ mode: "open" });
  // 앱 좌표 → 바깥 틀 좌표 (패널을 왼쪽에 붙이면 iframe 이 오른쪽으로 밀린다)
  const toTop = (x, y) => {
    if (!IN_SHELL || !window.frameElement) return { x, y };
    const r = window.frameElement.getBoundingClientRect();
    return { x: x + r.left, y: y + r.top };
  };
  ovRoot.innerHTML = `
    <style>${STUDIO_CSS()}</style>
    <div class="ov" part="overlay">
      <div class="hover" hidden><span class="tag"></span></div>
      <div class="selbox" hidden>
        <span class="tag"></span>
        <button class="grip" title="끌어서 순서 바꾸기">⠿ 옮기기</button>
        <span class="resize" title="끌어서 크기 바꾸기"></span>
      </div>
      <div class="dropline" hidden></div>
      <div class="drag-rect" hidden></div>
      <div class="pins"></div>
    </div>`;
  root.innerHTML = `
    <style>${STUDIO_CSS()}</style>
    <div class="bar"></div>
    <aside class="panel"></aside>
    <div class="pop" hidden></div>
    <div class="modal" hidden></div>
    <div class="toast" hidden></div>`;
  const $ = (sel) => root.querySelector(sel);
  const $o = (sel) => ovRoot.querySelector(sel);
  const ov = { hover: $o(".hover"), sel: $o(".selbox"), drop: $o(".dropline"), rect: $o(".drag-rect"), pins: $o(".pins") };

  function render() {
    renderBar();
    renderPanel();
    scheduleDraw();
  }

  function renderBar() {
    const bar = $(".bar");
    bar.hidden = S.clean;
    const mode = (k, label, key, icon) =>
      `<button class="mode ${S.mode === k ? "on" : ""}" data-mode="${k}" title="${label} (${key})"><b>${icon}</b>${label}<kbd>${key}</kbd></button>`;
    bar.innerHTML = `
      <div class="grp">
        ${mode("browse", "둘러보기", "V", "☞")}
        ${mode("select", "고르기", "S", "⬚")}
        ${mode("comment", "댓글", "C", "✎")}
      </div>
      <div class="grp">
        <button class="icon" data-act="undo" title="되돌리기 (Ctrl+Z)">↶</button>
        <button class="icon" data-act="redo" title="다시 하기 (Ctrl+Shift+Z)">↷</button>
      </div>
      <div class="grp variants" title="조합마다 따로 바꿔 보고 숫자 키(1~9)로 오가며 비교해요">
        ${S.variants.map((v, i) => `<button class="vpill ${i === S.active ? "on" : ""}" data-variant="${i}" title="${esc(v.name)} · 바꾼 것 ${v.changes.length}">${esc(v.name.replace(/^조합\s*/, "")) || i + 1}</button>`).join("")}
        <button class="icon" data-act="variant-dup" title="지금 조합을 복사해 새 조합 만들기">＋</button>
      </div>
      <div class="grp">
        <button class="save" data-act="save">저장해서 Claude에게</button>
        <button class="icon" data-act="toggle-panel" title="패널 접기/펴기">${S.collapsed ? "◧" : "◨"}</button>
      </div>
      <div class="hint">${esc(hintText())}</div>`;
  }
  function hintText() {
    if (S.mode === "select") return "누르면 골라져요 · 두 번 누르면 글자 고치기 · ↑ 바깥 상자 · Alt+누르기는 앱이 그대로 받아요";
    if (S.mode === "comment") return "누르면 그 자리에, 끌면 그 영역에 댓글 · Alt+누르기는 앱이 그대로 받아요";
    return `앱처럼 눌러서 화면을 옮겨 다녀요 · ${INFO.mode === "real" ? "내 데이터(읽기만)" : "연습용 가짜 데이터"} · 실제로는 아무것도 보내지 않아요`;
  }

  /* ----- 오른쪽 패널 ----- */
  let panelTimer = 0;
  function renderPanelSoon() {
    clearTimeout(panelTimer);
    panelTimer = setTimeout(() => {
      // 색 고르는 창을 끌고 있는 동안 패널을 다시 그리면 그 창이 닫힌다. 바뀐 개수만 고친다.
      const active = root.activeElement;
      if (active && active.matches("input, select, textarea")) return refreshCounts();
      renderPanel();
    }, 160);
  }
  function refreshCounts() {
    root.querySelectorAll("[data-count]").forEach((n) => {
      n.textContent = String(cur().changes.length);
    });
    renderBar();
  }
  function renderPanel() {
    const panel = $(".panel");
    panel.hidden = S.clean || S.collapsed;
    panel.classList.toggle("left", S.side === "left");
    const dock = IN_SHELL && !panel.hidden && TOP.innerWidth >= 1000;
    TOP.document.documentElement.classList.toggle("dock-right", dock && S.side === "right");
    TOP.document.documentElement.classList.toggle("dock-left", dock && S.side === "left");
    $(".bar").classList.toggle("dock-right", dock && S.side === "right");
    $(".bar").classList.toggle("dock-left", dock && S.side === "left");
    const tab = (k, label, n) => `<button class="tab ${S.tab === k ? "on" : ""}" data-tab="${k}">${label}${n != null ? ` <i>${n}</i>` : ""}</button>`;
    panel.innerHTML = `
      <header>
        <div class="brand">디자인 스튜디오 <small>${INFO.mode === "real" ? "내 데이터 · 읽기만" : "연습용"} · v${esc(INFO.version || "")}</small></div>
        <button class="icon" data-act="swap-side" title="패널을 반대쪽으로">⇄</button>
      </header>
      <nav>${tab("palette", "색·테마")}${tab("element", "요소")}${tab("comments", "댓글", S.comments.length)}${tab("changes", "바뀐 것", cur().changes.length)}</nav>
      <div class="body">${panelBody()}</div>`;
    if (S.tab === "changes") fillSaved();
  }
  function panelBody() {
    if (S.tab === "palette") return paletteHtml();
    if (S.tab === "element") return elementHtml();
    if (S.tab === "comments") return commentsHtml();
    return changesHtml();
  }

  function paletteHtml() {
    const theme = themeKey();
    const changed = new Map(cur().changes.filter((c) => c.type === "token" && c.theme === theme).map((c) => [c.name, c]));
    const row = ([name, label]) => {
      const v = rootVar(name);
      return `<label class="tok ${changed.has(name) ? "changed" : ""}">
        <input type="color" data-token="${name}" value="${toHex(v)}">
        <span class="tname">${label}<code>${name}</code></span>
        <span class="tval">${esc(v)}</span>
        ${changed.has(name) ? `<button class="mini" data-token-reset="${name}" title="원래대로">↺</button>` : ""}
      </label>`;
    };
    return `
      <section>
        <h4>테마 <small>지금 보는 테마에 따로 적혀요</small></h4>
        <div class="seg">${THEMES.map((t) => `<button data-theme-set="${t.key}" class="${theme === t.key ? "on" : ""}">${t.label}</button>`).join("")}</div>
      </section>
      <section>
        <h4>강조색 빠른 조합 <small>진한·옅은 강조도 함께 맞춰요</small></h4>
        <div class="presets">
          ${ACCENT_PRESETS.map(([n, c]) => `<button class="sw" style="--c:${c}" data-accent="${c}" title="${n} ${c}"></button>`).join("")}
          <label class="sw custom" title="직접 고르기"><input type="color" data-accent-pick value="${toHex(rootVar("--accent"))}">＋</label>
        </div>
      </section>
      ${TOKEN_GROUPS.map(([g, rows]) => `<section><h4>${g}</h4>${rows.map(row).join("")}</section>`).join("")}
      <section>
        <h4>모양</h4>
        ${SIZE_TOKENS.map(([name, label, min, max]) => {
          const v = px(rootVar(name));
          return `<div class="ctl"><span>${label} <code>${name}</code></span>
            <input type="range" min="${min}" max="${max}" value="${v}" data-token-px="${name}"><output>${v}px</output>
            ${changed.has(name) ? `<button class="mini" data-token-reset="${name}">↺</button>` : ""}</div>`;
        }).join("")}
      </section>`;
  }

  function elementHtml() {
    if (!S.sel || !S.sel.el.isConnected) {
      return `<div class="empty">
        <p><b>고르기(S)</b>로 바꾸고 싶은 곳을 누르세요.</p>
        <p>글자 색·크기, 배경, 모서리, 간격, 크기를 바로 바꿔 볼 수 있어요. 고른 상자 왼쪽 위 <b>⠿ 옮기기</b>를 끌면 순서가 바뀌고, 오른쪽 아래 모서리를 끌면 크기가 바뀌어요.</p>
        <button class="primary" data-mode="select">고르기 시작</button></div>`;
    }
    const el = S.sel.el;
    const cs = getComputedStyle(el);
    const opts = scopeOptions(el);
    if (!opts.some((o) => o.sel === S.scope)) S.scope = (opts[0] || {}).sel;
    const crumbs = [];
    for (let n = el, i = 0; n && n !== document.body && i < 6; n = n.parentElement, i++) crumbs.unshift(n);
    const mine = cur().changes.filter((c) => c.type === "style" && c.selector === S.scope);
    const has = (p) => mine.some((c) => c.prop === p);
    const reset = (p) => (has(p) ? `<button class="mini" data-style-reset="${p}" title="원래대로">↺</button>` : "");
    const color = (prop, label) => `
      <div class="ctl color ${has(prop) ? "changed" : ""}"><span>${label}${isClear(cs.getPropertyValue(prop)) ? "<code>투명</code>" : ""}</span>
        <input type="color" data-style="${prop}" value="${toHex(cs.getPropertyValue(prop))}" class="${isClear(cs.getPropertyValue(prop)) ? "clear" : ""}">
        <span class="chips">${SWATCH_TOKENS.slice(0, 9).map((t) => `<button class="chip" style="--c:var(${t})" data-style-val="${prop}|var(${t})" title="var(${t})"></button>`).join("")}</span>
        ${reset(prop)}</div>`;
    const range = (prop, label, min, max, step = 1, unit = "px") => {
      const raw = cs.getPropertyValue(prop);
      const v = unit === "px" ? px(raw) : +parseFloat(raw || "1").toFixed(2);
      return `<div class="ctl ${has(prop) ? "changed" : ""}"><span>${label}</span>
        <input type="range" min="${min}" max="${max}" step="${step}" value="${v}" data-style-range="${prop}" data-unit="${unit}"><output>${v}${unit}</output>${reset(prop)}</div>`;
    };
    const select = (prop, label, items) => {
      const v = cs.getPropertyValue(prop).trim();
      return `<div class="ctl ${has(prop) ? "changed" : ""}"><span>${label}</span>
        <select data-style-select="${prop}">${items.map(([l, val]) => `<option value="${esc(val)}" ${val === v ? "selected" : ""}>${l}</option>`).join("")}</select>${reset(prop)}</div>`;
    };
    const isFlex = /flex|grid/.test(cs.display);
    const n = mine.length;
    return `
      <div class="crumbs">${crumbs.map((c, i) => `<button data-crumb="${crumbs.length - 1 - i}" class="${c === el ? "on" : ""}">${esc(shortLabel(c))}</button>`).join("<i>›</i>")}</div>
      <div class="selinfo"><b>${esc(shortLabel(el))}</b> <span>${Math.round(el.getBoundingClientRect().width)}×${Math.round(el.getBoundingClientRect().height)}</span>
        ${textOf(el) ? `<div class="txt">“${esc(textOf(el).slice(0, 60))}”</div>` : ""}</div>
      <section>
        <h4>어디까지 바꿀까요</h4>
        <select class="wide" data-scope>${opts.map((o) => `<option value="${esc(o.sel)}" ${o.sel === S.scope ? "selected" : ""}>${esc(o.label)} · ${o.n}개 — ${esc(o.sel.length > 46 ? o.sel.slice(0, 46) + "…" : o.sel)}</option>`).join("")}</select>
        <details class="rules"><summary>styles.css 에서 걸린 규칙 ${matchedRules(el).length}개</summary><code>${matchedRules(el).map(esc).join("<br>")}</code></details>
      </section>
      <section><h4>글자</h4>
        ${color("color", "색")}
        ${range("font-size", "크기", 8, 48)}
        ${select("font-weight", "굵기", [["보통 400", "400"], ["중간 500", "500"], ["약간 굵게 600", "600"], ["굵게 700", "700"], ["아주 굵게 800", "800"]])}
        ${select("text-align", "정렬", [["왼쪽", "left"], ["가운데", "center"], ["오른쪽", "right"], ["처음(기본)", "start"]])}
        ${range("letter-spacing", "자간", -2, 4, 0.1)}
        ${range("line-height", "줄 간격", 10, 40)}
      </section>
      <section><h4>상자</h4>
        ${color("background-color", "배경")}
        ${color("border-color", "테두리 색")}
        ${range("border-width", "테두리 굵기", 0, 6)}
        ${range("border-radius", "모서리", 0, 40)}
        ${select("box-shadow", "그림자", SHADOWS.map(([l, v]) => [l, v]))}
        ${range("opacity", "불투명도", 0, 1, 0.05, "")}
      </section>
      <section><h4>간격·크기</h4>
        ${range("padding-block", "안쪽 위아래", 0, 48)}
        ${range("padding-inline", "안쪽 좌우", 0, 48)}
        ${range("margin-block", "바깥 위아래", 0, 48)}
        ${isFlex ? range("gap", "칸 사이", 0, 48) : ""}
        <div class="ctl size"><span>너비·높이</span>
          <input type="number" data-size="width" placeholder="자동" value="${has("width") ? px(cs.width) : ""}">×
          <input type="number" data-size="height" placeholder="자동" value="${has("height") ? px(cs.height) : ""}">px
          ${reset("width")}${has("height") ? `<button class="mini" data-style-reset="height">↺</button>` : ""}</div>
      </section>
      <section class="acts">
        <button data-act="move-prev">↑ 앞으로</button>
        <button data-act="move-next">↓ 뒤로</button>
        <button data-act="hide">${has("display") ? "다시 보이기" : "숨기기"}</button>
        <button data-act="edit-text">글자 고치기</button>
        <button data-act="comment-here">여기에 댓글</button>
      </section>
      ${n ? `<p class="small">이 범위에 바꾼 것 ${n}개 · 같은 모양 ${countOf(S.scope)}곳에 함께 보여요</p>` : ""}`;
  }

  function commentsHtml() {
    if (!S.comments.length) {
      return `<div class="empty"><p><b>댓글(C)</b>을 켜고 화면을 누르면 그 자리에, 끌면 그 영역에 댓글을 달아요.</p>
        <p>"여기 너무 빽빽해", "이 버튼은 위로" 처럼 말로 적어도 Claude 가 어느 요소인지 정확히 알아요.</p>
        <button class="primary" data-mode="comment">댓글 달기 시작</button></div>`;
    }
    return S.comments.map((c) => `
      <div class="cmt ${c.done ? "done" : ""}">
        <div class="chead"><span class="num">${c.n}</span><span class="kind k-${c.kind}">${esc(kindLabel(c.kind))}</span>
          <span class="where">${esc(viewLabel(c.anchor.view))} · ${esc(c.anchor.label)}${c.region ? " · 영역" : ""}</span></div>
        <div class="ctext">${esc(c.text)}</div>
        <div class="cacts"><button data-cmt-go="${c.id}">보기</button><button data-cmt-edit="${c.id}">고치기</button><button data-cmt-del="${c.id}">지우기</button></div>
      </div>`).join("");
  }
  const kindLabel = (k) => (KINDS.find((x) => x[0] === k) || KINDS[0])[1];

  function changesHtml() {
    const v = cur();
    const line = (c) => {
      let what = "";
      if (c.type === "token") what = `<b>${esc(c.name)}</b> <small>${esc(themeLabel(c.theme))} 테마</small>`;
      if (c.type === "style") what = `<b>${esc(c.prop)}</b> <small>${esc(c.selector)} · ${c.count || "?"}곳</small>`;
      if (c.type === "text") what = `<b>글자</b> <small>${esc(c.target.label)}</small>`;
      if (c.type === "move") what = `<b>순서</b> <small>${esc(c.target.label)} → ${esc(c.ref.label)} ${c.where === "before" ? "앞" : "뒤"}</small>`;
      const val = c.type === "move" ? "" : `<span class="from">${esc(String(c.from).slice(0, 40))}</span> → <span class="to">${esc(String(c.to).slice(0, 40))}</span>`;
      const sw = /^#|^rgb|^var\(/.test(c.to) && c.type !== "text" ? `<i class="dot" style="--c:${esc(c.to)}"></i>` : "";
      return `<div class="chg">${sw}<div><div>${what}</div><div class="vals">${val}</div></div><button class="mini" data-chg-del="${c.id}" title="이것만 빼기">✕</button></div>`;
    };
    return `
      <section>
        <h4>조합 <small>조합마다 따로 바꿔 보고 아래 단추·숫자 키로 비교해요</small></h4>
        <div class="vrow"><input class="wide" data-variant-name value="${esc(v.name)}">
          <button data-act="variant-dup" title="복사해서 새 조합">복사</button>
          <button data-act="variant-new" title="아무것도 안 바꾼 새 조합">새로</button>
          ${S.variants.length > 1 ? `<button data-act="variant-del" title="이 조합 지우기">지우기</button>` : ""}</div>
      </section>
      <section><h4>바뀐 것 <i data-count>${v.changes.length}</i></h4>
        ${v.changes.length ? v.changes.map(line).join("") : `<p class="small">아직 없어요. 색·테마 탭이나 고르기로 바꿔 보세요.</p>`}
        ${v.changes.length ? `<button class="danger" data-act="variant-clear">이 조합 모두 비우기</button>` : ""}
      </section>
      <section><h4>저장본 불러오기</h4><div class="saved" data-saved>불러오는 중…</div></section>`;
  }
  async function fillSaved() {
    const box = root.querySelector("[data-saved]");
    if (!box) return;
    try {
      const res = await fetch("/__studio/requests").then((r) => r.json());
      box.innerHTML = res.items.length
        ? res.items.slice(0, 12).map((it) => `<button class="srow" data-load="${esc(it.name)}">
            <b>${esc(it.title || it.name)}</b><small>${esc(it.name.slice(0, 15))} · 댓글 ${it.comments} · 바꾼 것 ${it.changes}${it.applied ? " · 반영됨" : ""}</small></button>`).join("")
        : `<p class="small">아직 저장한 것이 없어요.</p>`;
    } catch {
      box.textContent = "목록을 못 불러왔어요.";
    }
  }

  /* ---------- 겹쳐 그리기 (골라진 상자·댓글 핀) ---------- */
  let drawQueued = false;
  function scheduleDraw() {
    if (drawQueued) return;
    drawQueued = true;
    requestAnimationFrame(() => {
      drawQueued = false;
      draw();
    });
  }
  function place(node, r) {
    node.style.transform = `translate(${r.left}px, ${r.top}px)`;
    node.style.width = `${r.width}px`;
    node.style.height = `${r.height}px`;
  }
  function draw() {
    const showHover = S.mode !== "browse" && S.hover && S.hover.isConnected && !S.dragging && S.hover !== (S.sel && S.sel.el);
    ov.hover.hidden = !showHover;
    if (showHover) {
      const r = S.hover.getBoundingClientRect();
      place(ov.hover, r);
      ov.hover.querySelector(".tag").textContent = `${shortLabel(S.hover)}  ${Math.round(r.width)}×${Math.round(r.height)}`;
    }
    if (S.sel && !S.sel.el.isConnected) {
      // 앱이 그 부분을 다시 그렸다. 같은 자리의 새 요소를 다시 잡는다.
      const again = resolve({ path: S.sel.path });
      if (again) S.sel.el = again;
    }
    const showSel = S.mode === "select" && S.sel && S.sel.el.isConnected && !S.clean;
    ov.sel.hidden = !showSel;
    if (showSel) {
      const r = S.sel.el.getBoundingClientRect();
      place(ov.sel, r);
      ov.sel.querySelector(".tag").textContent = `${shortLabel(S.sel.el)}  ${Math.round(r.width)}×${Math.round(r.height)}`;
    }
    drawPins();
  }
  function drawPins() {
    const view = viewKey();
    const html = [];
    if (!S.clean || PARAMS.get("pins") === "1") {
      for (const c of S.comments) {
        const el = resolve(c.anchor, c._el);
        c._el = el;
        if (!el || c.anchor.view !== view) continue;
        const r = el.getBoundingClientRect();
        if (!r.width && !r.height) continue;
        if (c.region) {
          const x = r.left + c.region.x * r.width, y = r.top + c.region.y * r.height;
          html.push(`<div class="region ${c.done ? "done" : ""}" style="transform:translate(${x}px,${y}px);width:${c.region.w * r.width}px;height:${c.region.h * r.height}px"></div>`);
          html.push(`<button class="pin ${c.done ? "done" : ""}" data-pin="${c.id}" style="transform:translate(${x - 11}px,${y - 11}px)">${c.n}</button>`);
        } else {
          const x = r.left + c.at.x * r.width, y = r.top + c.at.y * r.height;
          html.push(`<button class="pin ${c.done ? "done" : ""}" data-pin="${c.id}" style="transform:translate(${x - 11}px,${y - 22}px)">${c.n}</button>`);
        }
      }
    }
    const next = html.join("");
    if (ov.pins.innerHTML !== next) ov.pins.innerHTML = next;
  }
  window.addEventListener("scroll", scheduleDraw, true);
  window.addEventListener("resize", () => {
    renderPanel();
    scheduleDraw();
  });
  setInterval(scheduleDraw, 400); // 앱이 화면을 다시 그리거나 화면을 옮긴 것을 따라간다

  /* ---------- 고르기·댓글: 앱 대신 누르기를 받는다 ---------- */
  const fromStudio = (e) => {
    const path = e.composedPath();
    return path.includes(host) || path.includes(ovHost);
  };
  function appTarget(e) {
    let t = e.target;
    if (!(t instanceof Element) || t === document.documentElement) return null;
    if (t.closest("svg") && t.closest("svg").parentElement) t = t.closest("svg").parentElement; // 아이콘 안쪽 선 대신 아이콘 통째로
    return t;
  }
  let pressStart = null;
  function onPointerEvent(e) {
    if (S.mode === "browse" || fromStudio(e) || e.altKey) return;
    if (S.editing && S.editing.contains(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    if (S.editing) finishTextEdit(true);
    const t = appTarget(e);
    if (!t) return;
    if (S.mode === "select") {
      if (e.type === "click") selectEl(t);
      if (e.type === "dblclick") startTextEdit(t);
    } else if (S.mode === "comment") {
      if (e.type === "pointerdown") pressStart = { x: e.clientX, y: e.clientY, t };
      if (e.type === "pointerup" && pressStart) {
        const dx = e.clientX - pressStart.x, dy = e.clientY - pressStart.y;
        const start = pressStart;
        pressStart = null;
        ov.rect.hidden = true;
        if (Math.hypot(dx, dy) > 8) startRegionComment(start, e);
        else startPointComment(start.t, e.clientX, e.clientY);
      }
    }
  }
  ["pointerdown", "pointerup", "mousedown", "mouseup", "click", "dblclick", "contextmenu", "auxclick", "submit"].forEach((t) =>
    window.addEventListener(t, onPointerEvent, true));
  window.addEventListener("pointermove", (e) => {
    if (S.mode === "browse" || fromStudio(e)) return;
    if (pressStart && S.mode === "comment") {
      const x = Math.min(pressStart.x, e.clientX), y = Math.min(pressStart.y, e.clientY);
      const w = Math.abs(e.clientX - pressStart.x), h = Math.abs(e.clientY - pressStart.y);
      if (w + h > 8) {
        ov.rect.hidden = false;
        place(ov.rect, { left: x, top: y, width: w, height: h });
      }
    }
    const t = appTarget(e);
    if (t !== S.hover) {
      S.hover = t;
      scheduleDraw();
    }
  }, true);

  function selectEl(el) {
    S.sel = { el, path: cssPath(el) };
    S.scope = (scopeOptions(el)[0] || {}).sel;
    S.tab = "element";
    S.editKey = null;
    S.collapsed = false;
    render();
  }
  function setMode(m) {
    if (S.editing) finishTextEdit(true);
    S.mode = m;
    S.hover = null;
    document.documentElement.classList.toggle("__studio-picking", m !== "browse");
    if (m === "comment" && S.tab !== "comments") S.tab = "comments";
    render();
  }

  /* ----- 글자 고치기 ----- */
  function startTextEdit(el) {
    if (!el || el === document.body) return;
    if (!S.sel || S.sel.el !== el) selectEl(el);
    S.editing = el;
    el._studioBefore = { text: el.innerText, html: el.innerHTML, target: describe(el, cssPath(el)) };
    el.contentEditable = "true";
    el.classList.add("__studio-editing");
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    const s = getSelection();
    s.removeAllRanges();
    s.addRange(range);
    toast("글자를 고치고 Enter(줄바꿈은 Shift+Enter), 그만두려면 Esc");
  }
  function finishTextEdit(keep) {
    const el = S.editing;
    if (!el) return;
    S.editing = null;
    el.contentEditable = "false";
    el.removeAttribute("contenteditable");
    el.classList.remove("__studio-editing");
    const before = el._studioBefore;
    delete el._studioBefore;
    if (!keep) {
      el.innerHTML = before.html;
      return;
    }
    const after = el.innerText;
    if (after.trim() === before.text.trim()) return;
    S.editKey = null;
    commit({ type: "text", target: before.target, from: before.text, to: after, _el: el, _html: before.html, _live: true });
  }

  /* ----- 옮기기 (⠿ 끌기) ----- */
  function siblingsOf(el) {
    return [...el.parentElement.children].filter((x) => x !== el && !x.hidden && x.getClientRects().length);
  }
  function rowAxis(parent) {
    const cs = getComputedStyle(parent);
    if (cs.display.includes("flex")) return cs.flexDirection.startsWith("row");
    return cs.display.includes("grid") && cs.gridTemplateColumns.split(" ").length > 1;
  }
  function moveTo(el, ref, where) {
    const from = [...el.parentElement.children].indexOf(el);
    const c = { type: "move", target: describe(el, cssPath(el)), ref: describe(ref, cssPath(ref)), where,
      parent: describe(el.parentElement, cssPath(el.parentElement)), fromIndex: from, _el: el, _ref: ref };
    S.editKey = null;
    commit(c);
    c.toIndex = [...el.parentElement.children].indexOf(el);
    // 저장본의 target.path 는 '옮기기 전' 자리 그대로 둔다(다시 열 때 그 자리에서 찾아 옮긴다). 고른 표시만 새 자리로.
    S.sel.path = cssPath(el);
    saveDraftSoon();
  }
  function nudge(dir) {
    if (!S.sel) return;
    const el = S.sel.el;
    const sib = dir < 0 ? el.previousElementSibling : el.nextElementSibling;
    if (!sib) return toast(dir < 0 ? "맨 앞이에요" : "맨 뒤예요");
    moveTo(el, sib, dir < 0 ? "before" : "after");
  }
  $o(".grip").addEventListener("pointerdown", (e) => {
    if (!S.sel) return;
    e.preventDefault();
    const el = S.sel.el;
    const parent = el.parentElement;
    const row = rowAxis(parent);
    const sibs = siblingsOf(el);
    if (!sibs.length) return toast("함께 옮길 형제 요소가 없어요. 바깥 상자(↑)를 골라 보세요.");
    S.dragging = true;
    el.classList.add("__studio-dragging");
    const grip = e.currentTarget;
    grip.setPointerCapture(e.pointerId);
    let drop = null;
    const move = (ev) => {
      let best = null;
      for (const s of sibs) {
        const r = s.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const d = Math.hypot(ev.clientX - cx, ev.clientY - cy);
        if (!best || d < best.d) best = { s, r, d, after: row ? ev.clientX > cx : ev.clientY > cy };
      }
      drop = best;
      const r = best.r;
      ov.drop.hidden = false;
      if (row) place(ov.drop, { left: (best.after ? r.right : r.left) - 2, top: r.top, width: 4, height: r.height });
      else place(ov.drop, { left: r.left, top: (best.after ? r.bottom : r.top) - 2, width: r.width, height: 4 });
    };
    const up = () => {
      grip.removeEventListener("pointermove", move);
      grip.removeEventListener("pointerup", up);
      ov.drop.hidden = true;
      S.dragging = false;
      el.classList.remove("__studio-dragging");
      if (drop) moveTo(el, drop.s, drop.after ? "after" : "before");
      scheduleDraw();
    };
    grip.addEventListener("pointermove", move);
    grip.addEventListener("pointerup", up);
  });

  /* ----- 크기 (모서리 끌기) ----- */
  $o(".resize").addEventListener("pointerdown", (e) => {
    if (!S.sel) return;
    e.preventDefault();
    const el = S.sel.el;
    const r0 = el.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY;
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    S.editKey = uid("k");
    const wKey = S.editKey, hKey = uid("k");
    const move = (ev) => {
      // 너비만 바꾸려면 Shift, 높이만 바꾸려면 Ctrl 을 누른 채 끈다
      if (!ev.ctrlKey) {
        S.editKey = wKey;
        setStyle("width", `${Math.max(16, Math.round(r0.width + ev.clientX - sx))}px`);
      }
      if (!ev.shiftKey) {
        S.editKey = hKey;
        setStyle("height", `${Math.max(12, Math.round(r0.height + ev.clientY - sy))}px`);
      }
    };
    const up = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", up);
      S.editKey = null;
      renderPanel();
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", up);
  });

  /* ----- 댓글 ----- */
  function containerOf(x, y, w, h) {
    // 영역을 통째로 품는 가장 작은 요소에 붙인다. 그래야 그 부분이 스크롤돼도 댓글이 따라간다.
    let el = document.elementFromPoint(x + w / 2, y + h / 2);
    while (el && el !== document.body) {
      const r = el.getBoundingClientRect();
      if (r.left <= x + 1 && r.top <= y + 1 && r.right >= x + w - 1 && r.bottom >= y + h - 1 && el !== ovHost) return el;
      el = el.parentElement;
    }
    return document.querySelector(".app-shell") || document.body;
  }
  function insideOf(anchor, x, y, w, h) {
    // 영역 안에 든 요소 이름 몇 개 (Claude 가 어디인지 알아보게)
    const out = [];
    anchor.querySelectorAll("*").forEach((n) => {
      if (out.length >= 8) return;
      const r = n.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) return;
      if (r.left >= x - 2 && r.top >= y - 2 && r.right <= x + w + 2 && r.bottom <= y + h + 2) {
        if (out.some((o) => o.el.contains(n))) return;
        out.push({ el: n, label: shortLabel(n), text: textOf(n).slice(0, 40) });
      }
    });
    return out.map(({ label, text }) => ({ label, text }));
  }
  function startPointComment(el, x, y) {
    const r = el.getBoundingClientRect();
    openCommentPop({
      anchor: describe(el), _el: el,
      at: { x: r.width ? (x - r.left) / r.width : 0, y: r.height ? (y - r.top) / r.height : 0 },
    }, x, y);
  }
  function startRegionComment(start, e) {
    const x = Math.min(start.x, e.clientX), y = Math.min(start.y, e.clientY);
    const w = Math.abs(e.clientX - start.x), h = Math.abs(e.clientY - start.y);
    const anchor = containerOf(x, y, w, h);
    const r = anchor.getBoundingClientRect();
    openCommentPop({
      anchor: describe(anchor, cssPath(anchor)), _el: anchor,
      region: { x: (x - r.left) / r.width, y: (y - r.top) / r.height, w: w / r.width, h: h / r.height },
      regionPx: { w: Math.round(w), h: Math.round(h) },
      inside: insideOf(anchor, x, y, w, h),
    }, x + w, y);
  }
  let popDraft = null;
  function openCommentPop(draft, x, y) {
    popDraft = draft;
    const pop = $(".pop");
    const editing = !!draft.id;
    pop.innerHTML = `
      <div class="phead">${editing ? `${draft.n}번 댓글 고치기` : "댓글"} <small>${esc(viewLabel(draft.anchor.view))} · ${esc(draft.anchor.label)}</small></div>
      <div class="kinds">${KINDS.map(([k, l]) => `<button data-kind="${k}" class="${(draft.kind || "fix") === k ? "on" : ""}">${l}</button>`).join("")}</div>
      <textarea rows="4" placeholder="무엇을 어떻게 바꾸면 좋을까요? (예: 여기 글자가 너무 작아, 카드 사이를 넓게)">${esc(draft.text || "")}</textarea>
      <div class="pacts">${editing ? `<label class="chk"><input type="checkbox" data-done ${draft.done ? "checked" : ""}> 해결됨</label>` : ""}
        <span class="sp"></span><button data-pop="cancel">그만두기</button><button class="primary" data-pop="ok">달기 (Ctrl+Enter)</button></div>`;
    pop.hidden = false;
    ({ x, y } = toTop(x, y));
    const W = TOP.innerWidth, H = TOP.innerHeight;
    const pw = 320, ph = 230;
    pop.style.left = `${Math.max(8, Math.min(W - pw - 8, x + 12))}px`;
    pop.style.top = `${Math.max(8, Math.min(H - ph - 8, y - 20))}px`;
    pop.querySelector("textarea").focus();
  }
  function closePop(save) {
    const pop = $(".pop");
    if (save && popDraft) {
      const text = pop.querySelector("textarea").value.trim();
      const kind = (pop.querySelector("[data-kind].on") || {}).dataset?.kind || "fix";
      const done = !!pop.querySelector("[data-done]")?.checked;
      if (!text) return toast("댓글 내용을 적어 주세요");
      if (popDraft.id) {
        Object.assign(S.comments.find((c) => c.id === popDraft.id), { text, kind, done });
      } else {
        const n = S.comments.reduce((m, c) => Math.max(m, c.n), 0) + 1;
        S.comments.push({ ...popDraft, id: uid("m"), n, text, kind, done: false, theme: themeKey(), variant: cur().name, createdAt: new Date().toISOString() });
      }
      saveDraftSoon();
    }
    popDraft = null;
    pop.hidden = true;
    render();
  }

  /* ---------- 저장 ---------- */
  const clean = (o) => JSON.parse(JSON.stringify(o, (k, v) => (k.startsWith("_") ? undefined : v)));
  function snapshot() {
    return clean({
      kind: "daling-design-studio",
      schema: 1,
      title: S.title,
      note: S.note,
      freedom: S.freedom,
      app: { version: INFO.version, data: INFO.mode },
      // 앱이 실제로 그려진 크기 (패널을 붙이면 iframe 이 좁아져 이 값도 줄어든다 — 그 너비의 진짜 배치다)
      viewport: { w: innerWidth, h: innerHeight, dpr: devicePixelRatio },
      theme: themeKey(),
      view: viewKey(),
      chosen: S.active,
      variants: S.variants.map((v) => ({ ...v, css: compileCss(v.changes) })),
      comments: S.comments,
    });
  }
  function markdown(data) {
    const L = [];
    const v = data.variants[data.chosen];
    L.push(`# 디자인 요청: ${data.title || "(제목 없음)"}`, "");
    L.push(`- 저장: ${new Date().toLocaleString("ko-KR")} · 앱 v${data.app.version} · ${data.app.data === "real" ? "내 데이터" : "연습용 데이터"}`);
    L.push(`- 창 크기 ${data.viewport.w}×${data.viewport.h} · 테마 ${themeLabel(data.theme)} · 마지막 화면 ${viewLabel(data.view)}`);
    L.push(`- 고른 조합: **${v.name}** (조합 ${data.variants.length}개)`);
    L.push(`- 재량: ${data.freedom === "exact" ? "적은 그대로만 옮겨 주세요" : "뜻을 살려 더 다듬어도 좋아요 (어울리게 조정·주변 정리 허용)"}`);
    L.push(`- 원본 데이터: \`${"tools/design_studio/requests/<이 파일 이름>.json"}\``, "");
    if (data.note) L.push("## 전체 메모", "", data.note, "");
    if (data.comments.length) {
      L.push(`## 댓글 ${data.comments.length}개`, "");
      for (const c of data.comments) {
        L.push(`${c.n}. **[${kindLabel(c.kind)}]** ${c.text}${c.done ? " _(해결됨)_" : ""}`);
        L.push(`   - 화면: ${viewLabel(c.anchor.view)} · 요소 \`${c.anchor.label}\`${c.anchor.text ? ` “${c.anchor.text.slice(0, 50)}”` : ""} · ${c.anchor.size}`);
        L.push(`   - 선택자: \`${c.anchor.path}\` (같은 모양: \`${c.anchor.selector}\`)`);
        if (c.region) L.push(`   - 영역: 그 요소 안 약 ${c.regionPx.w}×${c.regionPx.h}px. 안에 든 것: ${c.inside.map((i) => `\`${i.label}\`${i.text ? ` “${i.text}”` : ""}`).join(", ") || "-"}`);
        if (c.anchor.rules.length) L.push(`   - styles.css 규칙: ${c.anchor.rules.map((r) => `\`${r}\``).join(", ")}`);
        if (c.variant !== v.name) L.push(`   - (조합 '${c.variant}'를 보며 단 댓글)`);
      }
      L.push("");
    }
    const section = (variant, chosen) => {
      const ch = variant.changes;
      L.push(`## ${chosen ? "고른 조합" : "다른 조합"}: ${variant.name} — 바꾼 것 ${ch.length}개`, "");
      if (!ch.length) return L.push("(바꾼 것 없음)", "");
      const tokens = ch.filter((c) => c.type === "token");
      if (tokens.length) {
        L.push("### 색·모양 토큰", "", "| 테마 | 토큰 | 원래 | 새 값 |", "|---|---|---|---|");
        const last = new Map();
        tokens.forEach((c) => last.set(`${c.theme}|${c.name}`, c));
        last.forEach((c) => L.push(`| ${themeLabel(c.theme)} | \`${c.name}\` | \`${c.from}\` | \`${c.to}\` |`));
        L.push("");
      }
      const styles = ch.filter((c) => c.type === "style");
      if (styles.length) {
        L.push("### 요소 모양", "");
        const last = new Map();
        styles.forEach((c) => last.set(`${c.selector}|${c.prop}`, c));
        last.forEach((c) => {
          L.push(`- \`${c.selector}\` (${c.count}곳 · 예: ${viewLabel(c.target.view)}의 \`${c.target.label}\`${c.target.text ? ` “${c.target.text.slice(0, 40)}”` : ""}) — **${c.prop}**: \`${c.from}\` → \`${c.to}\``);
          if (c.target.rules.length) L.push(`  - 지금 걸린 규칙: ${c.target.rules.slice(-4).map((r) => `\`${r}\``).join(", ")}`);
        });
        L.push("");
      }
      const texts = ch.filter((c) => c.type === "text");
      if (texts.length) {
        L.push("### 글자", "");
        texts.forEach((c) => L.push(`- ${viewLabel(c.target.view)} \`${c.target.path}\`: “${c.from.trim()}” → “${c.to.trim()}”`));
        L.push("");
      }
      const moves = ch.filter((c) => c.type === "move");
      if (moves.length) {
        L.push("### 순서·위치", "");
        moves.forEach((c) => L.push(`- ${viewLabel(c.target.view)} \`${c.parent.label}\` 안에서 \`${c.target.label}\`${c.target.text ? ` “${c.target.text.slice(0, 30)}”` : ""} 을(를) \`${c.ref.label}\`${c.ref.text ? ` “${c.ref.text.slice(0, 30)}”` : ""} ${c.where === "before" ? "앞" : "뒤"}으로 (${c.fromIndex + 1}번째 → ${(c.toIndex ?? 0) + 1}번째)`));
        L.push("");
      }
      if (variant.css) L.push("### 화면에서 쓴 CSS (덮어쓰기 규칙 — 그대로 붙이지 말고 원래 규칙을 고치는 데 참고)", "", "```css", variant.css, "```", "");
    };
    section(v, true);
    data.variants.forEach((x, i) => i !== data.chosen && x.changes.length && section(x, false));
    return L.join("\n");
  }
  function openSaveModal() {
    if (S.editing) finishTextEdit(true);
    const m = $(".modal");
    const total = S.variants.reduce((n, v) => n + v.changes.length, 0);
    m.innerHTML = `<div class="card">
      <h3>저장해서 Claude 에게 넘기기</h3>
      <p class="small">댓글 ${S.comments.length}개 · 바꾼 것 ${total}개 (조합 ${S.variants.length}개)</p>
      <label>한 줄 제목<input data-f="title" value="${esc(S.title)}" placeholder="예: 대시보드 카드 정리, 강조색 남색으로"></label>
      <label>전체 메모<textarea data-f="note" rows="3" placeholder="전체적으로 바라는 느낌이 있으면 적어 주세요">${esc(S.note)}</textarea></label>
      <label>반영할 조합<select data-f="chosen">${S.variants.map((v, i) => `<option value="${i}" ${i === S.active ? "selected" : ""}>${esc(v.name)} · 바꾼 것 ${v.changes.length}</option>`).join("")}</select></label>
      <div class="seg two">
        <button data-freedom="refine" class="${S.freedom === "refine" ? "on" : ""}">뜻을 살려 더 다듬어 줘</button>
        <button data-freedom="exact" class="${S.freedom === "exact" ? "on" : ""}">적은 그대로만</button>
      </div>
      <div class="macts"><button data-modal="close">닫기</button><button class="primary" data-modal="save">저장</button></div>
      <div class="result" hidden></div></div>`;
    m.hidden = false;
    m.querySelector("[data-f=title]").focus();
  }
  async function doSave() {
    const m = $(".modal");
    S.title = m.querySelector("[data-f=title]").value.trim();
    S.note = m.querySelector("[data-f=note]").value.trim();
    const chosen = +m.querySelector("[data-f=chosen]").value;
    if (chosen !== S.active) switchVariant(chosen);
    const data = snapshot();
    const md = markdown(data);
    const out = m.querySelector(".result");
    out.hidden = false;
    try {
      const res = await fetch("/__studio/save", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data, markdown: md }),
      }).then((r) => r.json());
      if (!res.ok) throw new Error(res.message || "저장하지 못했어요");
      S.savedAs = res.name;
      S.dirty = false;
      clearTimeout(draftTimer);
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* 없어도 된다 */ }
      const say = `디자인 스튜디오 저장본 ${res.name} 반영해 줘`;
      out.innerHTML = `<p>저장했어요: <code>tools/design_studio/requests/${esc(res.name)}.md</code></p>
        <p>Claude Code 에 이렇게 말하세요:</p><div class="say"><code>${esc(say)}</code><button data-copy="${esc(say)}">복사</button></div>
        <p class="small">웹(claude.ai)에서 쓰면 파일이 안 보이니 아래 '내용 복사'로 붙여 넣으세요.</p>
        <button data-copy-md>내용 복사 (마크다운)</button>`;
      out._md = md;
    } catch (err) {
      out.innerHTML = `<p>서버에 저장하지 못했어요 (${esc(err.message)}). 내용을 복사해 Claude 에게 붙여 넣으세요.</p><button data-copy-md>내용 복사 (마크다운)</button>`;
      out._md = md;
    }
  }
  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast("복사했어요");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      toast("복사했어요");
    }
  }

  /* ---------- 불러오기·임시 저장 ---------- */
  function hydrate(data) {
    [...cur().changes].reverse().filter(isDom).forEach(revertDom);
    S.variants = (data.variants || []).map((v) => ({ id: v.id || uid("v"), name: v.name, changes: v.changes || [] }));
    if (!S.variants.length) S.variants = [newVariant("조합 A")];
    S.active = Math.min(+data.chosen || 0, S.variants.length - 1);
    S.comments = data.comments || [];
    S.title = data.title || "";
    S.note = data.note || "";
    S.freedom = data.freedom || "refine";
    S.undo = [];
    S.redo = [];
    cur().changes.filter(isDom).forEach(applyDom);
    applyCss();
    render();
  }
  /* 브라우저에 남기는 임시본: 저장하기 전에 창을 닫거나 새로 고쳐도 이어 하게.
     저장에 성공하면 지운다 — 남겨 두면 Claude 가 반영한 뒤 다시 열었을 때 같은 변경이 한 번 더 얹힌다
     (사이드바 단추를 두 번 옮기는 식). 저장한 것을 이어 하려면 '저장본 불러오기' 를 쓴다. */
  let draftTimer = 0;
  function saveDraftSoon(changed = true) {
    if (changed) S.dirty = true;
    if (!S.dirty) return;
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(snapshot())); } catch { /* 저장소를 못 쓰면 이어 하기만 안 된다 */ }
    }, 400);
  }
  async function loadSaved(name) {
    const data = await fetch(`/__studio/request?name=${encodeURIComponent(name)}`).then((r) => r.json());
    if (data.ok === false) return toast(data.message || "못 불러왔어요");
    hydrate(data);
    S.dirty = false; // 저장본 그대로다. 손대기 전까지는 임시본을 만들지 않는다
    if (data.theme && typeof applyTheme === "function") applyTheme(data.theme, { save: false });
    if (data.view && typeof switchView === "function" && !PARAMS.get("view")) switchView(data.view);
    toast(`불러왔어요: ${data.title || name}`);
  }

  /* ---------- 패널·막대 누르기 ---------- */
  function onStudioClick(e) {
    const b = e.target.closest("button, [data-tab]");
    if (!b) return;
    const d = b.dataset;
    if (d.mode) return setMode(d.mode);
    if (d.tab) {
      S.tab = d.tab;
      renderPanel();
      return;
    }
    if (d.variant) return switchVariant(+d.variant);
    if (d.themeSet) {
      if (typeof applyTheme === "function") applyTheme(d.themeSet, { save: false });
      else if (d.themeSet === "claude") document.documentElement.removeAttribute("data-theme");
      else document.documentElement.dataset.theme = d.themeSet;
      return setTimeout(renderPanel, 30);
    }
    if (d.accent) {
      S.editKey = uid("k");
      return setAccent(d.accent);
    }
    if (d.tokenReset) {
      cur().changes.filter((c) => c.type === "token" && c.theme === themeKey() && c.name === d.tokenReset).forEach((c) => removeChange(c.id));
      return;
    }
    if (d.styleVal) {
      const [prop, val] = d.styleVal.split("|");
      S.editKey = null;
      return setStyle(prop, val);
    }
    if (d.styleReset) return resetStyle(d.styleReset);
    if (d.crumb) {
      let el = S.sel.el;
      for (let i = 0; i < +d.crumb; i++) el = el.parentElement;
      return selectEl(el);
    }
    if (d.chgDel) return removeChange(d.chgDel);
    if (d.cmtGo) {
      const c = S.comments.find((x) => x.id === d.cmtGo);
      if (c.anchor.view !== viewKey() && typeof switchView === "function") switchView(c.anchor.view);
      setTimeout(() => {
        const el = resolve(c.anchor, c._el);
        if (!el) return toast("그 요소가 지금 화면에 없어요");
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        el.classList.add("__studio-flash");
        setTimeout(() => el.classList.remove("__studio-flash"), 1400);
      }, 250);
      return;
    }
    if (d.cmtEdit || d.pin) {
      const c = S.comments.find((x) => x.id === (d.cmtEdit || d.pin));
      const r = b.getBoundingClientRect();
      if (b.getRootNode() === ovRoot) return openCommentPop({ ...c }, r.right, r.top);
      const o = toTop(0, 0);
      return openCommentPop({ ...c }, r.left - o.x - 340, r.top - o.y);
    }
    if (d.cmtDel) {
      S.comments = S.comments.filter((x) => x.id !== d.cmtDel);
      saveDraftSoon();
      return render();
    }
    if (d.kind) {
      b.parentElement.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
      return;
    }
    if (d.pop) return closePop(d.pop === "ok");
    if (d.modal === "close") return ($(".modal").hidden = true);
    if (d.modal === "save") return doSave();
    if (d.freedom) {
      S.freedom = d.freedom;
      b.parentElement.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
      return;
    }
    if (d.copy) return copy(d.copy);
    if (b.hasAttribute("data-copy-md")) return copy(root.querySelector(".result")._md || "");
    if (d.load) return loadSaved(d.load);
    const act = d.act;
    if (act === "undo") return undo();
    if (act === "redo") return redo();
    if (act === "save") return openSaveModal();
    if (act === "toggle-panel") {
      S.collapsed = !S.collapsed;
      return render();
    }
    if (act === "swap-side") {
      S.side = S.side === "right" ? "left" : "right";
      return renderPanel();
    }
    if (act === "variant-dup" || act === "variant-new") {
      const letter = String.fromCharCode(65 + S.variants.length);
      const changes = act === "variant-dup" ? clean(cur().changes) : [];
      S.variants.push(newVariant(`조합 ${letter}`, changes));
      switchVariant(S.variants.length - 1);
      toast(act === "variant-dup" ? `조합 ${letter}: 지금 것을 복사했어요. 여기서 다르게 바꿔 보세요` : `조합 ${letter}: 처음 모습에서 시작해요`);
      return;
    }
    if (act === "variant-del") {
      if (!confirm(`'${cur().name}' 조합을 지울까요?`)) return;
      [...cur().changes].reverse().filter(isDom).forEach(revertDom);
      S.variants.splice(S.active, 1);
      S.active = Math.max(0, S.active - 1);
      cur().changes.filter(isDom).forEach(applyDom);
      applyCss();
      saveDraftSoon();
      return render();
    }
    if (act === "variant-clear") {
      if (!confirm("이 조합에서 바꾼 것을 모두 비울까요? (댓글은 남아요)")) return;
      [...cur().changes].reverse().filter(isDom).forEach(revertDom);
      cur().changes = [];
      applyCss();
      saveDraftSoon();
      return render();
    }
    if (act === "move-prev") return nudge(-1);
    if (act === "move-next") return nudge(1);
    if (act === "hide") {
      S.editKey = null;
      const hidden = cur().changes.some((c) => c.type === "style" && c.selector === S.scope && c.prop === "display");
      return hidden ? resetStyle("display") : setStyle("display", "none");
    }
    if (act === "edit-text") return S.sel && startTextEdit(S.sel.el);
    if (act === "comment-here" && S.sel) {
      const r = S.sel.el.getBoundingClientRect();
      return startPointComment(S.sel.el, r.left + r.width / 2, r.top + Math.min(20, r.height / 2));
    }
  }
  root.addEventListener("click", onStudioClick);
  ovRoot.addEventListener("click", onStudioClick);
  // 조절 막대·색 고르기: 누르기 시작할 때 새 '편집 묶음' 을 연다 (끄는 동안 바뀐 값은 한 줄로 합친다)
  root.addEventListener("pointerdown", (e) => {
    if (e.target.matches("input, select")) S.editKey = uid("k");
  });
  root.addEventListener("focusin", (e) => {
    if (e.target.matches("input, select")) S.editKey = uid("k");
  });
  root.addEventListener("input", (e) => {
    const t = e.target;
    const d = t.dataset;
    if (d.token) return setToken(d.token, t.value);
    if (t.hasAttribute("data-accent-pick")) return setAccent(t.value);
    if (d.tokenPx) {
      t.nextElementSibling.textContent = `${t.value}px`;
      return setToken(d.tokenPx, `${t.value}px`);
    }
    if (d.style) return setStyle(d.style, t.value);
    if (d.styleRange) {
      const val = d.unit ? `${t.value}${d.unit}` : t.value;
      t.nextElementSibling.textContent = val;
      return setStyle(d.styleRange, val);
    }
    if (d.size) return t.value ? setStyle(d.size, `${t.value}px`) : resetStyle(d.size);
    if (t.hasAttribute("data-variant-name")) {
      cur().name = t.value.trim() || cur().name;
      renderBar();
      return saveDraftSoon();
    }
  });
  root.addEventListener("change", (e) => {
    const t = e.target;
    if (t.hasAttribute("data-scope")) {
      S.scope = t.value;
      S.editKey = null;
      return renderPanel();
    }
    if (t.dataset.styleSelect) {
      S.editKey = uid("k");
      if (t.value) setStyle(t.dataset.styleSelect, t.value);
      else resetStyle(t.dataset.styleSelect);
    }
    S.editKey = null;
    // 조절을 마쳤다(색 고르는 창 닫힘·막대 놓음). 이제 '바뀜' 표시를 다시 그려도 된다.
    if (!t.hasAttribute("data-variant-name")) renderPanel();
  });

  /* ---------- 단축키 ---------- */
  function onKey(e) {
    const t = e.composedPath()[0];
    if (S.editing) {
      if (S.editing.contains(e.target)) {
        e.stopPropagation(); // 앱 단축키(검색 Ctrl+K 등)가 글자 입력을 가로채지 않게
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          finishTextEdit(true);
        } else if (e.key === "Escape") {
          e.preventDefault();
          finishTextEdit(false);
        }
      }
      return;
    }
    if (fromStudio(e) && t && t.matches && t.matches("textarea") && e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (!$(".pop").hidden) closePop(true);
      return;
    }
    const typing = t && t.matches && (t.matches("input, textarea, select") || t.isContentEditable);
    if (typing) return;
    const handled = () => {
      e.preventDefault();
      e.stopPropagation();
    };
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === "z") return handled(), e.shiftKey ? redo() : undo();
    if ((e.ctrlKey || e.metaKey) && k === "y") return handled(), redo();
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (k === "escape") {
      if (!$(".pop").hidden) return handled(), closePop(false);
      if (!$(".modal").hidden) return handled(), ($(".modal").hidden = true);
      if (S.sel) {
        S.sel = null;
        return handled(), render();
      }
      if (S.mode !== "browse") return handled(), setMode("browse");
      return;
    }
    if (k === "v") return handled(), setMode("browse");
    if (k === "s") return handled(), setMode("select");
    if (k === "c") return handled(), setMode("comment");
    if (k === "\\") {
      S.clean = !S.clean;
      return handled(), render();
    }
    if (/^[1-9]$/.test(k) && S.variants[+k - 1]) return handled(), switchVariant(+k - 1);
    if (S.mode === "select" && S.sel) {
      if (k === "arrowup" && S.sel.el.parentElement && S.sel.el.parentElement !== document.body) return handled(), selectEl(S.sel.el.parentElement);
      if (k === "arrowdown" && S.sel.el.firstElementChild) return handled(), selectEl(S.sel.el.firstElementChild);
      if (k === "enter") return handled(), startTextEdit(S.sel.el);
    }
  }
  window.addEventListener("keydown", onKey, true);
  if (IN_SHELL) TOP.addEventListener("keydown", onKey, true);

  /* ---------- 알림 ---------- */
  let toastTimer = 0;
  function toast(text) {
    const t = $(".toast");
    t.textContent = text;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.hidden = true), 2600);
  }

  /* ---------- 시작 ---------- */
  document.body.appendChild(ovHost);
  TOP.document.body.appendChild(host);
  if (IN_SHELL) TOP.addEventListener("resize", () => renderPanel());
  render();
  (async () => {
    // 앱이 첫 화면을 다 그린 뒤에 불러와야 글자·순서 변경이 제자리를 찾는다
    for (let i = 0; i < 40 && !document.querySelector(".nav-item.active"); i++) await new Promise((r) => setTimeout(r, 100));
    await new Promise((r) => setTimeout(r, 400));
    const load = PARAMS.get("load");
    if (load) {
      await loadSaved(load);
    } else {
      try {
        const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
        if (draft && (draft.comments?.length || draft.variants?.some((v) => v.changes.length))) {
          hydrate(draft);
          S.dirty = true;
          toast("저장하지 않은 지난 작업을 이어서 열었어요 (바뀐 것 탭에서 비울 수 있어요)");
        }
      } catch { /* 이어 하기만 안 된다 */ }
    }
    if (PARAMS.get("variant")) switchVariant(+PARAMS.get("variant") - 1);
    if (PARAMS.get("theme") && typeof applyTheme === "function") applyTheme(PARAMS.get("theme"), { save: false });
    if (PARAMS.get("view") && typeof switchView === "function") switchView(PARAMS.get("view"));
    render();
  })();

  /* ---------- 도구 화면 스타일 (Shadow DOM 안) ---------- */
  function STUDIO_CSS() {
    return `
      :host { all: initial; }
      * { box-sizing: border-box; }
      [hidden] { display: none !important; }
      button, input, select, textarea { font: inherit; color: inherit; }
      .ov, .bar, .panel, .pop, .modal, .toast {
        font: 12.5px/1.45 -apple-system, "Segoe UI", "Malgun Gothic", "Apple SD Gothic Neo", system-ui, sans-serif;
        --s-bg: #1c1c1f; --s-bg2: #26262b; --s-bg3: #303037; --s-line: #3a3a42; --s-text: #f1f1f4; --s-soft: #a8a8b3;
        --s-acc: #7c5cff; --s-acc2: #a593ff; --s-warn: #ff8a65;
        color: var(--s-text);
      }
      .ov { position: fixed; inset: 0; pointer-events: none; z-index: 2147483000; }
      .hover, .selbox, .dropline, .drag-rect { position: fixed; left: 0; top: 0; }
      .hover { outline: 1.5px solid var(--s-acc); background: rgba(124,92,255,.07); }
      .selbox { outline: 2px solid var(--s-acc); }
      .tag { position: absolute; left: -2px; top: -20px; background: var(--s-acc); color: #fff; padding: 1px 6px; border-radius: 4px 4px 4px 0;
             font: 11px/18px ui-monospace, Consolas, monospace; white-space: nowrap; max-width: 420px; overflow: hidden; text-overflow: ellipsis; }
      .selbox .tag { left: 74px; }
      .grip { pointer-events: auto; position: absolute; left: -2px; top: -22px; height: 20px; border: 0; border-radius: 4px; background: #fff; color: #222;
              font-size: 11px; padding: 0 6px; cursor: grab; box-shadow: 0 1px 4px rgba(0,0,0,.3); }
      .grip:active { cursor: grabbing; }
      .resize { pointer-events: auto; position: absolute; right: -7px; bottom: -7px; width: 14px; height: 14px; background: #fff; border: 2px solid var(--s-acc);
                border-radius: 3px; cursor: nwse-resize; }
      .dropline { background: var(--s-acc); border-radius: 2px; box-shadow: 0 0 0 2px rgba(255,255,255,.8); }
      .drag-rect { border: 1.5px dashed var(--s-warn); background: rgba(255,138,101,.08); }
      .pins { position: fixed; inset: 0; }
      .pin { pointer-events: auto; position: fixed; left: 0; top: 0; width: 22px; height: 22px; border-radius: 11px 11px 11px 2px; border: 2px solid #fff;
             background: var(--s-warn); color: #fff; font-weight: 700; font-size: 11px; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,.3); padding: 0; }
      .pin.done { background: #7d8a7d; }
      .region { position: fixed; left: 0; top: 0; border: 1.5px dashed var(--s-warn); background: rgba(255,138,101,.07); border-radius: 4px; }
      .region.done { border-color: #7d8a7d; background: transparent; }

      .bar { position: fixed; left: 50%; bottom: 14px; transform: translateX(-50%); z-index: 2147483002; display: flex; flex-wrap: wrap; gap: 6px; align-items: center;
             width: max-content;
             justify-content: center; max-width: calc(100vw - 24px); padding: 6px; background: var(--s-bg); border: 1px solid var(--s-line); border-radius: 14px;
             box-shadow: 0 10px 30px rgba(0,0,0,.35); }
      .grp { display: flex; gap: 2px; padding: 2px; background: var(--s-bg2); border-radius: 10px; }
      .bar button { border: 0; background: transparent; padding: 6px 10px; border-radius: 8px; cursor: pointer; color: var(--s-soft); white-space: nowrap; }
      .bar button:hover { background: var(--s-bg3); color: var(--s-text); }
      .bar .mode b { font-weight: 400; margin-right: 5px; }
      .bar kbd { margin-left: 6px; font: 10px ui-monospace, monospace; opacity: .55; }
      .bar .on { background: var(--s-acc) !important; color: #fff !important; }
      .bar .icon { min-width: 30px; padding: 6px 8px; }
      .bar .vpill { min-width: 28px; font-weight: 700; }
      .bar .save { background: var(--s-acc); color: #fff; font-weight: 600; }
      .bar .save:hover { background: var(--s-acc2); }
      .bar.dock-right { left: calc(50% - 177px); max-width: calc(100vw - 378px); }
      .bar.dock-left { left: calc(50% + 177px); max-width: calc(100vw - 378px); }
      /* 안내 글은 막대 너비를 늘리지 않는다 (단추 줄 너비에 맞춰 줄바꿈) */
      .hint { contain: inline-size; flex-basis: 100%; text-align: center; color: var(--s-soft); font-size: 11px; padding: 0 4px 2px; }

      .panel { position: fixed; top: 12px; right: 12px; bottom: 12px; width: 330px; z-index: 2147483001; display: flex; flex-direction: column;
               background: var(--s-bg); border: 1px solid var(--s-line); border-radius: 14px; box-shadow: 0 12px 40px rgba(0,0,0,.4); overflow: hidden; }
      .panel.left { right: auto; left: 12px; }
      @media (max-width: 760px) { .panel { left: 8px; right: 8px; width: auto; top: auto; height: 46vh; bottom: 96px; } }
      header { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px 6px; }
      .brand { font-weight: 700; font-size: 13px; }
      .brand small { display: block; font-weight: 400; color: var(--s-soft); font-size: 11px; }
      nav { display: flex; gap: 2px; padding: 0 8px 8px; border-bottom: 1px solid var(--s-line); }
      .tab { flex: 1; border: 0; background: transparent; color: var(--s-soft); padding: 6px 4px; border-radius: 7px; cursor: pointer; }
      .tab.on { background: var(--s-bg3); color: var(--s-text); font-weight: 600; }
      .tab i, h4 i { font-style: normal; font-size: 10px; background: var(--s-acc); color: #fff; border-radius: 8px; padding: 0 5px; }
      .body { flex: 1; overflow: auto; padding: 4px 12px 16px; }
      section { padding: 10px 0; border-bottom: 1px solid #2c2c33; }
      section:last-child { border-bottom: 0; }
      h4 { margin: 0 0 8px; font-size: 12px; font-weight: 700; }
      h4 small { font-weight: 400; color: var(--s-soft); margin-left: 4px; }
      code { font: 11px ui-monospace, Consolas, monospace; color: var(--s-acc2); }
      .small { color: var(--s-soft); font-size: 11.5px; margin: 6px 0; }
      .empty { padding: 14px 2px; color: var(--s-soft); }
      .empty b { color: var(--s-text); }
      /* :where 로 감싸 우선순위를 0 으로 둔다. 그래야 .tab·.mini 같은 개별 단추 모양이 이긴다. */
      :where(.panel, .pop, .modal) button { cursor: pointer; border: 1px solid var(--s-line); background: var(--s-bg2); border-radius: 7px; padding: 5px 9px; }
      :where(.panel, .pop, .modal) button:hover { border-color: #55555f; }
      button.primary { background: var(--s-acc) !important; border-color: var(--s-acc) !important; color: #fff; font-weight: 600; }
      button.danger { color: var(--s-warn); margin-top: 8px; }
      .icon { border: 0; background: transparent; color: var(--s-soft); cursor: pointer; font-size: 14px; }
      .mini { border: 0; background: transparent; color: var(--s-acc2); cursor: pointer; font-size: 13px; padding: 0 4px; }
      .seg { display: flex; gap: 3px; background: var(--s-bg2); padding: 3px; border-radius: 9px; }
      .seg button { flex: 1; border: 0 !important; background: transparent !important; color: var(--s-soft); padding: 5px 4px !important; border-radius: 7px !important; }
      .seg button.on { background: var(--s-bg3) !important; color: var(--s-text); font-weight: 600; }
      .presets { display: flex; flex-wrap: wrap; gap: 6px; }
      .sw { width: 24px; height: 24px; border-radius: 50%; border: 2px solid #fff3; background: var(--c); cursor: pointer; padding: 0; position: relative;
            display: inline-grid; place-items: center; color: #fff; font-size: 13px; }
      .sw:hover { transform: scale(1.12); }
      .sw.custom { background: conic-gradient(#f66, #fd5, #6d6, #5cf, #a6f, #f66); overflow: hidden; }
      .sw.custom input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
      .tok { display: grid; grid-template-columns: 26px 1fr auto auto; gap: 8px; align-items: center; padding: 3px 4px; border-radius: 7px; }
      .tok.changed, .ctl.changed { background: rgba(124,92,255,.14); }
      .tok input[type=color], .ctl input[type=color] { width: 26px; height: 22px; border: 1px solid var(--s-line); border-radius: 5px; padding: 0; background: none; cursor: pointer; }
      .tname code { display: block; color: var(--s-soft); font-size: 10px; }
      .tval { font: 10.5px ui-monospace, monospace; color: var(--s-soft); }
      .ctl { display: grid; grid-template-columns: 74px 1fr auto auto; gap: 6px; align-items: center; padding: 3px 4px; border-radius: 7px; min-height: 30px; }
      .ctl.color { grid-template-columns: 74px 26px 1fr auto; }
      .ctl > span:first-child { color: var(--s-soft); }
      .ctl > span code { display: block; font-size: 10px; }
      .ctl input[type=range] { width: 100%; accent-color: var(--s-acc); }
      .ctl output { font: 11px ui-monospace, monospace; color: var(--s-soft); min-width: 40px; text-align: right; }
      .ctl select, select.wide, input.wide, .size input { background: var(--s-bg2); border: 1px solid var(--s-line); border-radius: 6px; padding: 4px 6px; }
      .ctl.size { grid-template-columns: 74px auto auto auto auto auto auto; justify-content: start; }
      .size input { width: 64px; }
      select.wide, input.wide { width: 100%; }
      .chips { display: flex; gap: 3px; overflow: hidden; }
      input.clear { background: repeating-conic-gradient(#888 0 25%, #ccc 0 50%) 0 0 / 8px 8px !important; }
      .chip { width: 14px; height: 14px; border-radius: 4px; border: 1px solid #fff3; background: var(--c); padding: 0; cursor: pointer; }
      .chip:hover { transform: scale(1.25); }
      .crumbs { display: flex; flex-wrap: wrap; gap: 2px; align-items: center; padding: 8px 0 4px; }
      .crumbs button { border: 0 !important; background: transparent; color: var(--s-soft); padding: 2px 4px !important; font: 11px ui-monospace, monospace; border-radius: 4px; }
      .crumbs button.on { background: var(--s-acc) !important; color: #fff; }
      .crumbs i { color: #555; font-style: normal; }
      .selinfo { padding: 4px 0 8px; }
      .selinfo b { font: 600 12px ui-monospace, monospace; }
      .selinfo span { color: var(--s-soft); margin-left: 6px; }
      .selinfo .txt { color: var(--s-soft); margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .rules { margin-top: 6px; color: var(--s-soft); }
      .rules code { display: block; margin-top: 4px; line-height: 1.6; word-break: break-all; }
      .acts { display: flex; flex-wrap: wrap; gap: 5px; }
      .cmt { padding: 9px 4px; border-bottom: 1px solid #2c2c33; }
      .cmt.done { opacity: .55; }
      .chead { display: flex; gap: 6px; align-items: center; }
      .num { width: 20px; height: 20px; border-radius: 10px; background: var(--s-warn); color: #fff; font-weight: 700; display: grid; place-items: center; font-size: 11px; flex: none; }
      .kind { font-size: 10.5px; padding: 1px 6px; border-radius: 6px; background: var(--s-bg3); }
      .k-fix { color: #ffb199; } .k-idea { color: #ffd479; } .k-keep { color: #9be3a8; } .k-question { color: #9cc8ff; }
      .where { color: var(--s-soft); font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .ctext { margin: 6px 0; white-space: pre-wrap; }
      .cacts { display: flex; gap: 4px; }
      .cacts button { padding: 2px 8px !important; font-size: 11px; }
      .chg { display: grid; grid-template-columns: auto 1fr auto; gap: 8px; align-items: center; padding: 6px 2px; border-bottom: 1px solid #2c2c33; }
      .chg small { color: var(--s-soft); word-break: break-all; }
      .vals { font: 11px ui-monospace, monospace; color: var(--s-soft); word-break: break-all; }
      .vals .to { color: var(--s-text); }
      .dot { width: 14px; height: 14px; border-radius: 4px; background: var(--c); border: 1px solid #fff3; display: inline-block; }
      .vrow { display: flex; gap: 4px; }
      .saved { display: grid; gap: 4px; }
      .srow { text-align: left; display: grid; }
      .srow small { color: var(--s-soft); }

      .pop { position: fixed; z-index: 2147483003; width: 320px; background: var(--s-bg); border: 1px solid var(--s-line); border-radius: 12px; padding: 10px;
             box-shadow: 0 12px 40px rgba(0,0,0,.45); }
      .phead { font-weight: 700; margin-bottom: 8px; }
      .phead small { font-weight: 400; color: var(--s-soft); margin-left: 4px; }
      .kinds { display: flex; gap: 4px; margin-bottom: 8px; }
      .kinds button { padding: 3px 8px !important; font-size: 11.5px; }
      .kinds button.on { background: var(--s-warn) !important; border-color: var(--s-warn) !important; color: #fff; }
      textarea, .modal input { width: 100%; background: var(--s-bg2); border: 1px solid var(--s-line); border-radius: 8px; padding: 7px 8px; resize: vertical; }
      textarea:focus, input:focus, select:focus { outline: 2px solid var(--s-acc); outline-offset: -1px; }
      .pacts, .macts { display: flex; gap: 6px; align-items: center; margin-top: 8px; }
      .sp { flex: 1; }
      .chk { display: flex; gap: 4px; align-items: center; color: var(--s-soft); }
      .modal { position: fixed; inset: 0; z-index: 2147483004; background: rgba(0,0,0,.45); display: grid; place-items: center; }
      .modal .card { width: min(460px, calc(100vw - 32px)); background: var(--s-bg); border: 1px solid var(--s-line); border-radius: 14px; padding: 18px; display: grid; gap: 10px; }
      .modal h3 { margin: 0; font-size: 15px; }
      .modal label { display: grid; gap: 4px; color: var(--s-soft); }
      .modal select { background: var(--s-bg2); border: 1px solid var(--s-line); border-radius: 8px; padding: 6px; }
      .seg.two button { padding: 7px !important; }
      .macts { justify-content: flex-end; }
      .result { border-top: 1px solid var(--s-line); padding-top: 10px; }
      .result p { margin: 4px 0; }
      .say { display: flex; gap: 6px; align-items: center; background: var(--s-bg2); border-radius: 8px; padding: 6px 8px; margin: 4px 0; }
      .say code { flex: 1; color: var(--s-text); font-size: 12px; }
      .toast { position: fixed; left: 50%; bottom: 96px; transform: translateX(-50%); z-index: 2147483005; background: #fff; color: #1c1c1f; padding: 8px 14px;
               border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,.3); max-width: calc(100vw - 32px); }
    `;
  }
})();
