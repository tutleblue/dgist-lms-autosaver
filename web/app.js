const icons = {
  alert: '<svg viewBox="0 0 24 24"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  book: '<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z"/></svg>',
  calendar: '<svg viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="m20 6-11 11-5-5"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  cloud: '<svg viewBox="0 0 24 24"><path d="M17.5 19H7a5 5 0 1 1 .9-9.9A7 7 0 0 1 21 12.5 3.5 3.5 0 0 1 17.5 19Z"/></svg>',
  download: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>',
  edit: '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  reply: '<svg viewBox="0 0 24 24"><path d="M9 17l-5-5 5-5"/><path d="M4 12h11a5 5 0 0 1 5 5v1"/></svg>',
  // 뒤로가기: 답장 아이콘과 헷갈리지 않도록 단순 화살표를 따로 둔다
  arrowLeft: '<svg viewBox="0 0 24 24"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>',
  chevronDown: '<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
  chevronUp: '<svg viewBox="0 0 24 24"><path d="m18 15-6-6-6 6"/></svg>',
  // 전체 답장: 답장 화살표에 갈래를 하나 더 둔다
  replyAll: '<svg viewBox="0 0 24 24"><path d="m7 17-5-5 5-5"/><path d="m12 17-5-5 5-5"/><path d="M22 18v-1a5 5 0 0 0-5-5h-5"/></svg>',
  forward: '<svg viewBox="0 0 24 24"><path d="m15 17 5-5-5-5"/><path d="M20 12H9a5 5 0 0 0-5 5v1"/></svg>',
  more: '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>',
  printer: '<svg viewBox="0 0 24 24"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>',
  send: '<svg viewBox="0 0 24 24"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4Z"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>',
  paperclip: '<svg viewBox="0 0 24 24"><path d="m21.4 11.1-8.5 8.5a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8"/></svg>',
  mailAllRead: '<svg viewBox="0 0 24 24"><path d="m16 12 2 2 4-4"/><path d="M21 10.5V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h9"/><path d="m3 7 9 6 4-2.7"/></svg>',
  grid: '<svg viewBox="0 0 24 24"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/></svg>',
  list: '<svg viewBox="0 0 24 24"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>',
  eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
  file: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>',
  mail: '<svg viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
  // 문의·제보 단추: 편지 모양이면 접은 사이드바에서 메일함과 헷갈렸다 → 말풍선
  feedback: '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M13 8H7"/><path d="M17 12H7"/></svg>',
  moon: '<svg viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>',
  sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.3 17.7-1.4 1.4"/><path d="m19.1 4.9-1.4 1.4"/></svg>',
  sparkle: '<svg viewBox="0 0 24 24"><path d="M12 3v3"/><path d="M12 18v3"/><path d="M3 12h3"/><path d="M18 12h3"/><path d="m5.6 5.6 2.1 2.1"/><path d="m16.3 16.3 2.1 2.1"/><path d="m5.6 18.4 2.1-2.1"/><path d="m16.3 7.7 2.1-2.1"/></svg>',
  folder: '<svg viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg>',
  help: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 1 1 5.6 1.5c-.6.9-1.7 1.3-2.2 2.1-.3.4-.5.8-.5 1.4"/><path d="M12 17h.01"/></svg>',
  layout: '<svg viewBox="0 0 24 24"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  settings: '<svg viewBox="0 0 24 24"><path d="M12.2 2h-.4a2 2 0 0 0-2 1.7l-.1.7a2 2 0 0 1-2.9 1.2l-.6-.4a2 2 0 0 0-2.6.3l-.2.3a2 2 0 0 0-.3 2.6l.4.6a2 2 0 0 1-1.2 2.9l-.7.1A2 2 0 0 0 2 13.8v.4a2 2 0 0 0 1.7 2l.7.1a2 2 0 0 1 1.2 2.9l-.4.6a2 2 0 0 0 .3 2.6l.3.2a2 2 0 0 0 2.6.3l.6-.4a2 2 0 0 1 2.9 1.2l.1.7a2 2 0 0 0 2 1.7h.4a2 2 0 0 0 2-1.7l.1-.7a2 2 0 0 1 2.9-1.2l.6.4a2 2 0 0 0 2.6-.3l.2-.3a2 2 0 0 0 .3-2.6l-.4-.6a2 2 0 0 1 1.2-2.9l.7-.1a2 2 0 0 0 1.7-2v-.4a2 2 0 0 0-1.7-2l-.7-.1a2 2 0 0 1-1.2-2.9l.4-.6a2 2 0 0 0-.3-2.6l-.3-.2a2 2 0 0 0-2.6-.3l-.6.4a2 2 0 0 1-2.9-1.2l-.1-.7A2 2 0 0 0 12.2 2Z"/><circle cx="12" cy="12" r="3"/></svg>',
  sync: '<svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 0 0-15.5-6.2L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 15.5 6.2L21 16"/><path d="M16 16h5v5"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  menu: '<svg viewBox="0 0 24 24"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>',
  undo: '<svg viewBox="0 0 24 24"><path d="M3 7v6h6"/><path d="M3 13a9 9 0 1 0 3-7.7L3 8"/></svg>',
  user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  monitor: '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>',
  key: '<svg viewBox="0 0 24 24"><circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.8-9.8"/><path d="m16 7 3 3"/><path d="m18.5 4.5 2 2"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.8l6.5-.9Z"/></svg>',
  moonStar: '<svg viewBox="0 0 24 24"><path d="M18 5h4"/><path d="M20 3v4"/><path d="M21.5 13.5A9 9 0 1 1 10.5 2.5a7 7 0 0 0 11 11Z"/></svg>',
  box: '<svg viewBox="0 0 24 24"><path d="M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"/><path d="M2 4h20v4H2z"/><path d="M10 12h4"/></svg>',
  // FGLP 학교 상세의 바깥 링크 (홈페이지 · 지도 · 새 창)
  globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
  map: '<svg viewBox="0 0 24 24"><path d="M14.1 5.55a2 2 0 0 0 1.8 0l3.66-1.83A1 1 0 0 1 21 4.62v12.76a1 1 0 0 1-.55.9l-4.55 2.27a2 2 0 0 1-1.8 0l-4.2-2.1a2 2 0 0 0-1.8 0l-3.66 1.83A1 1 0 0 1 3 19.38V6.62a1 1 0 0 1 .55-.9L8.1 3.45a2 2 0 0 1 1.8 0z"/><path d="M15 5.76v15"/><path d="M9 3.24v15"/></svg>',
  external: '<svg viewBox="0 0 24 24"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>',
};

const state = {
  status: null,
  files: [],
  deadlines: { items: [], events: [], updatedAt: null },
  selection: { courses: {}, hidden: [] },
  courseEditMode: false,
  config: null,
  task: null,
  query: "",
  course: "",
  fileStatus: "",
  deadlineCourse: "",
  deadlineStatus: "",
  view: "dashboard",
  selectedFiles: new Set(),
  lastPickIndex: null,
  emails: { emails: [], briefing: "", interests: "", contacts: [], updatedAt: null },
  emailFilter: "",
  emailQuery: "",
  emailSort: "newest",
  emailView: "list",
  // 별표한 메일 id. 폴더 '중요'가 이걸 본다.
  mailStars: null,
  // 받은 편지함 아래 분류를 펴 둘지. 지난번에 접어 뒀으면 그대로 연다.
  mailCatsOpen: (() => {
    try {
      return localStorage.getItem("autosaver-mail-cats-open") !== "false";
    } catch (error) {
      return true;
    }
  })(),
  emailFolder: "inbox",
  emailTab: "primary",
  mailSelected: new Set(),
  emailQuick: "",
  replyContext: null,
  attachments: [],
  interestTags: new Set(),
  calMonth: null, // {y, m}
  calSelected: null,
  myEvents: [],
  academic: [],
  notices: [],
  shuttle: [],
  shuttleGroup: "",
  academicUnderOnly: true,
  fileMode: "folder",
  openFolders: {},
  shelves: [],
  showHolidays: true,
  timetable: [],
  ttShowSat: false,
};

const $ = (selector) => document.querySelector(selector);

/* 체험 모드(demo_mode.py): 서버가 첫 화면에 <html data-demo="1"> 를 달아 준다.
   켜고 끌 때마다 화면을 새로 띄우므로(setDemo) 한 번 읽어 상수로 둔다. */
const DEMO_ON = document.documentElement.dataset.demo === "1";

/* ===== 아이콘 =====
   아이콘마다 <svg>와 <path>를 통째로 새로 만들어 넣었더니, 자료 300줄이
   있는 화면에서 아이콘만 노드 2,600개를 차지했다. 모양은 문서 맨 위
   <symbol>에 한 번만 두고, 쓸 때는 <use>로 가리키게 한다. */
let iconSpriteReady = false;

function ensureIconSprite() {
  if (iconSpriteReady) return;
  iconSpriteReady = true;
  const symbols = Object.entries(icons)
    .map(([name, svg]) => {
      const view = (svg.match(/viewBox="([^"]+)"/) || [])[1] || "0 0 24 24";
      const inner = svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
      return `<symbol id="ic-${name}" viewBox="${view}">${inner}</symbol>`;
    })
    .join("");
  const holder = document.createElement("div");
  holder.setAttribute("aria-hidden", "true");
  holder.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
  holder.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg">${symbols}</svg>`;
  document.body.prepend(holder);
}

function installIcons(root = document) {
  ensureIconSprite();
  root.querySelectorAll("[data-icon]").forEach((node) => {
    const name = node.dataset.icon;
    if (!icons[name]) {
      node.innerHTML = "";
      return;
    }
    // 이미 같은 아이콘이면 손대지 않는다 (다시 그릴 때 헛일을 줄인다)
    if (node.dataset.iconDrawn === name) return;
    node.dataset.iconDrawn = name;
    node.innerHTML = `<svg><use href="#ic-${name}"></use></svg>`;
  });
}

/* 목록처럼 한 번에 수백 개를 그릴 때는 아이콘을 처음부터 HTML 에 넣는다.
   installIcons 가 나중에 하나씩 innerHTML 을 바꾸는 후처리(536개에 30ms)를 건너뛴다. */
function iconHtml(name, extraClass = "") {
  ensureIconSprite();
  if (!icons[name]) return `<span class="icon ${extraClass}"></span>`;
  return `<span class="icon ${extraClass}" data-icon="${name}" data-icon-drawn="${name}"><svg><use href="#ic-${name}"></use></svg></span>`;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "요청에 실패했습니다.");
  }
  return data;
}

/* ===== 맥 판 =====
   같은 화면을 맥(WKWebView)에서도 띄운다. 단축키 처리는 원래 ctrlKey·metaKey 를 함께 받으므로, 안내 문구만
   맥 관례대로 ⌘ 로 바꿔 보여 준다. 번역표(en.json)는 'Ctrl+' 로 적혀 있으니 번역(tr)을 먼저 하고 그 결과에 입힌다.
   뒤로·앞으로는 맥에서 ⌘[ / ⌘] (사파리와 같음). 맥의 Option+←/→ 는 글자 칸에서 단어 단위 이동이라 가로채면 안 된다. */
const IS_MAC = /Mac/.test(navigator.platform || "") || /Mac OS X/.test(navigator.userAgent || "");

/* 맥 앱 창(pywebview·WKWebView)은 window.open 을 무시한다 — 링크를 '눌렀을 때' 만 바깥 브라우저로 넘긴다
   (2026-10-21 맥·리눅스 점검: 강의자료 열기·강의계획서·.eml 저장이 맥에서 아무 반응이 없었다).
   앱 서버의 파일 길은 서버가 기본 브라우저로 열고, 바깥 주소는 /api/open-url 로. Windows·리눅스·개발 브라우저는 그대로. */
const IN_MAC_APP = () => IS_MAC && Boolean(window.pywebview);
// 맥 파일 고르기는 한글 이름을 풀어 쓴 자모(NFD)로 준다 — 그대로 첨부하면 받는 쪽에서 'ㅎㅏㄴ' 처럼 갈라져 보인다
const nfcName = (name) => String(name || "").normalize("NFC");
function openOutside(url) {
  if (!IN_MAC_APP()) {
    window.open(url, "_blank");
    return;
  }
  const route = String(url).startsWith("/") ? "/api/open-app-url" : "/api/open-url";
  const body = route === "/api/open-app-url" ? { path: url } : { url };
  api(route, { method: "POST", body: JSON.stringify(body) }).catch((error) => showToast(humanError(error)));
}

/** 'Ctrl+K'·'Ctrl K'(검색창 kbd) → 맥에서는 '⌘K', 'Alt+←/→' → '⌘[ / ⌘]'. 다른 운영체제는 그대로 */
function keyLabel(text) {
  const s = String(text ?? "");
  if (!IS_MAC) return s;
  return s.replace(/Alt\+←\/→/g, "⌘[ / ⌘]").replace(/Alt\+←/g, "⌘[").replace(/Alt\+→/g, "⌘]").replace(/Ctrl[+ ](?=\S)/g, "⌘");
}

/** index.html 에 적힌 단축키 안내(버튼 풍선 도움말·<kbd>)를 맥 기호로. 번역이 끝난 뒤 한 번 부른다 */
function macKeyLabels(root) {
  if (!IS_MAC || !root) return;
  const has = (v) => /Ctrl[+ ]|Alt\+/.test(v);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (has(n.nodeValue)) n.nodeValue = keyLabel(n.nodeValue);
  }
  root.querySelectorAll("[title], [aria-label], [data-hint]").forEach((el) => {
    ["title", "aria-label", "data-hint"].forEach((name) => {
      const v = el.getAttribute(name);
      if (v && has(v)) el.setAttribute(name, keyLabel(v));
    });
  });
}

/* ===== 영어 화면 (i18n) =====
   외국인 학생도 쓸 수 있게 화면을 영어로 보여 준다.
   문구가 app.js·index.html·web_ui.py 에 1,100개 넘게 흩어져 있어 하나하나 바꾸지 않고,
   화면에 그려진 글자를 번역표(web/i18n/en.json)로 바꿔 보여 준다.
     - 표에 정확히 있는 문구만 바꾼다. 메일 제목·과목명·파일명 같은 자료는 그대로 둔다.
     - '{0}개 골랐어요' 처럼 숫자·이름이 끼는 문구는 틀로 맞춘다({0} 자리는 그대로 옮긴다).
     - 새로 그려지는 글자는 MutationObserver 가 따라가며 바꾼다. 글자를 바꾸면 한글이 없어지므로 다시 걸리지 않는다.
   빠진 문구 찾기: python scripts/i18n_extract.py */
const I18N = { lang: "ko", exact: new Map(), patterns: [], observer: null };
/* 학사일정 낱말표: web/i18n/en.json 의 "_academic" 한 곳에만 둔다(i18nCompile 이 채운다). 예전엔 app.js 와
   en.json 에 같은 낱말이 따로 있어 한쪽만 고치면 어긋났다(리뷰 지적). 버튼용 짧은 번역('등록'→'Add')과는 뜻이 달라 따로 둔다. */
let ACAD_TERMS = [];
const HANGUL_RE = /[가-힣]/;
const I18N_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const I18N_DATE_MAP = { "(월)": "(Mon)", "(화)": "(Tue)", "(수)": "(Wed)", "(목)": "(Thu)", "(금)": "(Fri)", "(토)": "(Sat)", "(일)": "(Sun)" };
const I18N_DATE_RE = /\((월|화|수|목|금|토|일)\)/g;
const I18N_ATTRS = ["placeholder", "title", "aria-label", "data-hint", "alt"];

function i18nCompile(table) {
  I18N.exact.clear();
  I18N.patterns = [];
  const esc = (s) => s.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
  const academic = table && typeof table._academic === "object" ? table._academic : {};
  // 긴 낱말부터 바꾼다 ('수강신청 변경' 을 '수강신청' 보다 먼저)
  ACAD_TERMS = Object.entries(academic)
    .filter(([, en]) => typeof en === "string" && en)
    .sort((a, b) => b[0].length - a[0].length);
  Object.entries(table || {}).forEach(([ko, en]) => {
    if (typeof en !== "string" || !en) return;
    if (/\{\d+\}/.test(ko)) {
      // '{0}' '{0} · {1}' 처럼 한글이 없는 틀은 모든 문장을 잡아먹는다 (실제로 그랬다). 건너뛴다.
      if (!HANGUL_RE.test(ko.replace(/\{\d+\}/g, ""))) return;
      const parts = ko.split(/(\{\d+\})/);
      const order = [];
      const source = parts
        .map((part) => {
          const m = part.match(/^\{(\d+)\}$/);
          if (!m) return esc(part).replace(/\\\{/g, "{").replace(/[{}]/g, "\\$&");
          order.push(Number(m[1]));
          return "([\\s\\S]*?)";
        })
        .join("");
      const fixed = (ko.replace(/\{\d+\}/g, "").match(/[가-힣]/g) || []).length;
      // 고정 한글이 두 글자 이하인 틀('{0}개', '{0} 시작')은 사용자 글(메일 제목 등)에도 걸리기 쉽다.
      // 이런 틀은 빈자리 글자까지 모두 영어가 될 때만 쓴다 (weak).
      I18N.patterns.push({ re: new RegExp(`^${source}$`), en, order, weight: ko.replace(/\{\d+\}/g, "").length, weak: fixed <= 2 });
    } else {
      I18N.exact.set(ko, en);
    }
  });
  // 글자가 많이 고정된 틀부터 (짧은 틀이 긴 문구를 먼저 삼키지 않게)
  I18N.patterns.sort((a, b) => b.weight - a.weight);
}

/* ===== 학사일정 이름 (영어 화면) =====
   학사일정은 학교 데이터라 번역표에 없어서, 영어 화면에서도 '대학 및 대학원 중간시험' 이 그대로 나왔다(2026-10-12).
   해마다 연도·학기만 바뀌므로 통째 문장 대신 낱말을 옮겨 이어 붙인다. 다 옮겨서 한글이 하나도 안 남을 때만 쓰므로
   메일 제목 같은 사용자 글은 건드리지 않는다. */
const ACAD_ORDINAL = (n) => `${n}${["th", "st", "nd", "rd"][(n % 100 > 10 && n % 100 < 14) || n % 10 > 3 ? 0 : n % 10]}`;

function acadTitleEn(text) {
  let s = String(text || "").trim();
  if (!/[가-힣]/.test(s)) return null;
  let tail = "";
  s = s.replace(/\s+(D-\d+|진행 중)$/, (_, d) => { tail = d === "진행 중" ? " (now)" : ` ${d}`; return ""; });
  let grad = false;
  s = s.replace(/^대학 및 대학원\s*/, "");
  if (/^대학원\s+/.test(s)) { grad = true; s = s.replace(/^대학원\s+/, ""); }
  s = s.replace(/^대학\s+/, "");
  let year = "";
  s = s.replace(/(\d{4})학년도\s*/, (_, y) => { year = y; return ""; });
  let term = "";
  s = s.replace(/(여름|겨울)\s*계절학기\s*/, (_, w) => { term = `${w === "여름" ? "Summer" : "Winter"} session`; return ""; });
  s = s.replace(/(^|\s)([12])학기\s*/, (_, a, n) => { term = n === "1" ? "Spring" : "Fall"; return a; });
  s = s.replace(/\('(\d{2})\.(\d{1,2})월 졸업생\)/, (_, y, m) => ` (${I18N_MONTHS[Number(m) - 1]} '${y} grads)`);
  s = s.replace(/수업일수\s*(\d)\/4선/, (_, n) => `${n}/4 of semester`);
  // 공공데이터 학사일정의 구간 이름 (2026-10): '수업일수(1/4이후 ~ 2/4)', '수업일수(개강일 ~ 1/4)'
  s = s.replace(/수업일수\s*\(\s*개강일\s*~\s*(\d)\/4\s*\)/, (_, b) => `semester: start – ${b}/4`);
  s = s.replace(/수업일수\s*\(\s*(\d)\/4\s*이후\s*~\s*(\d)\/4\s*\)/, (_, a, b) => `semester: ${a}/4 – ${b}/4`);
  s = s.replace(/(\d+)주년\s*/, (_, n) => `${ACAD_ORDINAL(Number(n))} `);
  // '대체공휴일(한글날)': 괄호 안 공휴일 이름은 번역표(신정·추석…)에서 찾는다
  s = s.replace(/대체공휴일\(([^)]+)\)/, (_, h) => `substitute holiday (${I18N.exact.get(h) || h})`);
  for (const [ko, en] of ACAD_TERMS) s = s.split(ko).join(en);
  s = s.replace(/\s+/g, " ").trim();
  if (!s || /[가-힣]/.test(s)) return null;
  const head = [grad ? "Grad:" : "", term ? `${term}${year ? ` ${year}` : ""}` : year ? `AY${year}` : ""].filter(Boolean).join(" ");
  const out = `${head ? `${head} ` : ""}${s}`;
  return out.charAt(0).toUpperCase() + out.slice(1) + tail;
}

/* ===== 과목명 (영어 화면) =====
   LMS 과목명에는 학교 공식 영어 이름이 함께 있다: '일반화학Ⅱ (General Chemistry II )_02[ 2026_2학기 ]'.
   시간표(내가 적은 '일반화학Ⅱ')·과목 카드처럼 한국어 이름이 그대로 보이는 곳을 영어 화면에서는 이 이름으로 바꾼다.
   'Ⅱ' 와 'II', 띄어쓰기 차이는 NFKC 로 맞춘다. 이름이 통째로 같을 때만 바꾼다. */
const COURSE_EN = new Map();
const courseNameKey = (s) => String(s || "").normalize("NFKC").replace(/\s+/g, "").toLowerCase();

function learnCourseNames(names) {
  let added = 0;
  (names || []).forEach((name) => {
    const m = String(name || "").match(/^(.+?)\s*\((.+?)\s*\)\s*_\d+\s*\[/);
    if (!m || !/[가-힣]/.test(m[1]) || /[가-힣]/.test(m[2])) return;
    const key = courseNameKey(m[1]);
    // 'General PhysicsⅡ' → 'General Physics II'
    const en = m[2].replace(/([A-Za-z])([Ⅰ-Ⅻ])/g, "$1 $2").normalize("NFKC").replace(/\s+/g, " ").trim();
    if (COURSE_EN.get(key) !== en) {
      COURSE_EN.set(key, en);
      added += 1;
    }
  });
  // 영어 화면인데 이미 그려 둔 한국어 과목명이 있으면 다시 옮긴다
  if (added && I18N.lang === "en" && document.body) i18nTranslateTree(document.body);
}

function tr(text, depth = 0) {
  if (I18N.lang !== "en" || text == null) return text;
  const s = String(text);
  if (!HANGUL_RE.test(s) || depth > 2) return s;
  const core = s.replace(/\s+/g, " ").trim();
  let out = I18N.exact.get(core);
  if (out == null) {
    for (const p of I18N.patterns) {
      const m = core.match(p.re);
      if (!m) continue;
      const groups = p.order.map((_, at) => tr(m[at + 1], depth + 1));
      if (p.weak && groups.some((g) => HANGUL_RE.test(g))) continue;
      // 빈자리가 ' · ' 로 이어진 여러 마디를 삼켰으면 이 틀이 아니다 → 아래에서 마디별로 옮긴다
      if (groups.some((g) => HANGUL_RE.test(g) && / [·—|] /.test(g))) continue;
      // '{0:class|classes}' 는 {0} 이 1 이면 앞말, 아니면 뒷말. 한국어 '{0}개' 하나가 영어에선 단수·복수 둘이라
      // 대시보드에 '1 classes left today' 가 나왔다(2026-10-15 Store 스크린샷).
      out = p.en.replace(/\{(\d+)(?::([^{}|]*)\|([^{}]*))?\}/g, (_, i, one, many) => {
        const at = p.order.indexOf(Number(i));
        const value = at < 0 ? "" : groups[at];
        if (one == null) return value;
        return /^\s*1\s*$/.test(value) ? one : many;
      });
      break;
    }
  }
  // 과목명 → LMS 공식 영어 이름
  if (out == null && COURSE_EN.size) out = COURSE_EN.get(courseNameKey(core)) ?? null;
  // 학사일정·공휴일 이름 (낱말을 다 옮길 수 있을 때만)
  if (out == null) out = acadTitleEn(core);
  // '오늘은 남은 수업이 없어요 · 안 읽은 메일 25통' 처럼 여러 문구를 이어 붙인 줄은 마디마다 옮긴다
  if (out == null && depth === 0 && / [·—|] /.test(core)) {
    const parts = core.split(/( [·—|] )/);
    const moved = parts.map((part, i) => (i % 2 ? part : tr(part, depth + 1)));
    if (moved.some((part, i) => part !== parts[i])) out = moved.join("");
  }
  // 날짜·시각 조각('9/7 (월) 23:59', '오후 4:18', '2026년 9월')은 규칙으로 바꾼다.
  // 다 바꿔서 한글이 하나도 안 남을 때만 쓴다 (메일 제목 같은 글은 건드리지 않게)
  if (out == null && depth === 0) {
    const moved = core.replace(I18N_DATE_RE, (m) => I18N_DATE_MAP[m] || m)
      .replace(/(오전|오후) (\d{1,2}):(\d{2})/g, (_, ap, h, mm) => `${h}:${mm} ${ap === "오전" ? "AM" : "PM"}`)
      .replace(/(\d{4})년 (\d{1,2})월/g, (_, y, mo) => `${I18N_MONTHS[Number(mo) - 1] || mo} ${y}`);
    if (moved !== core && !HANGUL_RE.test(moved)) out = moved;
  }
  if (out == null) return s;
  const lead = s.match(/^\s*/)[0];
  const trail = s.match(/\s*$/)[0];
  return lead + out + trail;
}

function i18nSkip(node) {
  const el = node.nodeType === 1 ? node : node.parentElement;
  return !el || !!el.closest("script, style, textarea, [contenteditable], [data-no-i18n]");
}

function i18nTranslateTree(root) {
  if (I18N.lang !== "en" || !root) return;
  if (root.nodeType === 3) {
    if (!i18nSkip(root)) {
      const next = tr(root.nodeValue);
      if (next !== root.nodeValue) root.nodeValue = next;
    }
    return;
  }
  if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!HANGUL_RE.test(n.nodeValue) || i18nSkip(n)) continue;
    const next = tr(n.nodeValue);
    if (next !== n.nodeValue) n.nodeValue = next;
  }
  const els = root.nodeType === 1 ? [root, ...root.querySelectorAll("*")] : [...root.querySelectorAll("*")];
  els.forEach((el) => {
    I18N_ATTRS.forEach((name) => {
      const v = el.getAttribute(name);
      if (v && HANGUL_RE.test(v) && !i18nSkip(el)) {
        const next = tr(v);
        if (next !== v) el.setAttribute(name, next);
      }
    });
    // 입력칸에 미리 들어간 값(버튼 input 등)
    if (el.tagName === "INPUT" && (el.type === "button" || el.type === "submit") && HANGUL_RE.test(el.value)) {
      el.value = tr(el.value);
    }
  });
}

function i18nStartObserver() {
  if (I18N.observer || !document.body) return;
  I18N.observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === "characterData") i18nTranslateTree(m.target);
      else if (m.type === "attributes") {
        // 표에 없는 한글(과목명 등)을 같은 값으로 다시 쓰면 그 쓰기가 또 감지돼 끝없이 돈다 (실제로 화면이 멈췄다)
        const v = m.target.getAttribute(m.attributeName);
        if (v && HANGUL_RE.test(v) && !i18nSkip(m.target)) {
          const next = tr(v);
          if (next !== v) m.target.setAttribute(m.attributeName, next);
        }
      } else m.addedNodes.forEach((n) => i18nTranslateTree(n));
    }
  });
  I18N.observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: I18N_ATTRS,
  });
}

/** 저장된 언어 → 없으면 시스템 언어 (한국어가 아니면 영어). 번역이 끝나면 맥 단축키 기호를 입힌다 */
async function initLanguage(pref) {
  await loadLanguage(pref);
  macKeyLabels(document.body);
}

async function loadLanguage(pref) {
  const lang = pref === "ko" || pref === "en" ? pref : /^ko/i.test(navigator.language || "") ? "ko" : "en";
  I18N.lang = lang;
  document.documentElement.lang = lang;
  if (lang !== "en") return;
  try {
    const res = await fetch("/i18n/en.json", { cache: "no-store" });
    i18nCompile(await res.json());
  } catch (error) {
    I18N.lang = "ko";
    document.documentElement.lang = "ko";
    return;
  }
  document.title = tr(document.title);
  i18nTranslateTree(document.body);
  i18nStartObserver();
}

// 알림창·확인창도 같은 표로 바꾼다 (문구가 여러 줄이면 줄마다)
(function wrapDialogs() {
  const trLines = (msg) => String(msg ?? "").split("\n").map((line) => tr(line)).join("\n");
  const confirm0 = window.confirm.bind(window);
  const alert0 = window.alert.bind(window);
  const prompt0 = window.prompt.bind(window);
  window.confirm = (msg) => confirm0(trLines(msg));
  window.alert = (msg) => alert0(trLines(msg));
  window.prompt = (msg, def) => prompt0(trLines(msg), def);
})();

function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("visible"), 2600);
}

/* ===== 오류를 사람 말로 =====
   'Cannot set properties of null (setting disabled)' 같은 말은 쓰는 사람에게
   아무 뜻이 없다. 무슨 일이 났는지 한 줄로 알려 주고, 자세한 내용은
   실행 로그에만 남긴다. */
function humanError(err) {
  const raw = String((err && err.message) || err || "");

  const table = [
    [/Failed to fetch|NetworkError|ERR_CONNECTION/i, "앱과 연결이 끊겼어요. 앱을 다시 켜 주세요."],
    [/이미 실행 중/, "앞 작업이 아직 돌고 있어요. 끝나면 다시 눌러 주세요."],
    [/401|인증|Unauthorized/i, "로그인 정보가 맞지 않아요. 설정에서 다시 확인해 주세요."],
    [/timed? ?out|시간 초과/i, "시간이 너무 오래 걸려 멈췄어요. 잠시 뒤 다시 해 주세요."],
    [/JSON|Unexpected token/i, "받아 온 내용을 읽지 못했어요. 다시 시도해 주세요."],
    // 화면 요소를 못 찾은 경우 (대개 앱을 새로 받은 뒤 옛 화면이 남아 있을 때)
    [/Cannot (read|set) propert(y|ies)/i, "화면을 그리다 문제가 생겼어요. 앱을 다시 켜면 대개 해결됩니다."],
    [/is not a function/i, "앱 파일이 서로 안 맞아요. 앱을 다시 켜 주세요."],
  ];
  for (const [re, msg] of table) {
    if (re.test(raw)) return msg;
  }
  return "문제가 생겼어요. 앱을 다시 켜 보고, 계속되면 설정 → 실행 로그를 확인해 주세요.";
}

/** 예기치 못한 오류를 한 번만, 사람 말로 알린다 */
function reportError(err, where) {
  const detail = `${where || "알 수 없는 곳"}: ${(err && err.stack) || err}`;
  console.error(detail);
  // 자세한 내용은 실행 로그 상자에만 남긴다
  try {
    const box = $("#logBox");
    if (box) {
      const line = document.createElement("div");
      line.className = "log-line log-error";
      line.textContent = detail.slice(0, 400);
      box.prepend(line);
    }
  } catch (e) {
    /* 로그를 못 남겨도 알림은 띄운다 */
  }
  const msg = humanError(err);
  // 같은 말을 연달아 띄우지 않는다
  if (reportError.last === msg && Date.now() - (reportError.at || 0) < 8000) return;
  reportError.last = msg;
  reportError.at = Date.now();
  showToast(msg);
}

window.addEventListener("error", (event) => {
  reportError(event.error || event.message, `${(event.filename || "").split("/").pop()}:${event.lineno}`);
});
window.addEventListener("unhandledrejection", (event) => {
  // 화면 전환 애니메이션 중에 다른 메뉴를 빨리 누르면 브라우저가 앞 전환을 건너뛰며 AbortError 를 낸다.
  // 화면은 제대로 바뀌므로 오류가 아니다. 예전엔 '문제가 생겼어요' 알림이 떴다.
  // 창이 가려졌거나 최소화된 사이에 전환이 시작되면 'InvalidStateError: Transition was aborted' 도 난다(실측). 같은 경우다.
  const reason = event.reason;
  if (reason && (reason.name === "AbortError" || (reason.name === "InvalidStateError" && /transition/i.test(reason.message || "")))) {
    event.preventDefault();
    return;
  }
  reportError(event.reason, "요청 처리 중");
});

function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function shortText(value, max = 46) {
  const text = String(value || "");
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function statusLabel(status) {
  if (status === "local") return "로컬 저장";
  if (status === "missing") return "누락";
  return "샘플";
}

/* ===== 뷰 전환 ===== */
/* 화면 전환은 View Transitions API로 감싼다.
   예전 화면이 즉시 사라지고 새 화면이 튀어나오는 대신,
   둘이 겹쳐서 부드럽게 이어진다. 미지원 브라우저는 그냥 바로 바뀐다. */
let lastViewTransition = null;

function switchView(view) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // 창이 가려져 있으면 화면을 그릴 필요가 없으니 전환 효과도 건너뛴다
  const canAnimate =
    !!document.startViewTransition && !reduce && !document.hidden && state.view !== view;
  if (!canAnimate) {
    applyView(view);
    return;
  }

  /* 전환 콜백은 브라우저가 화면을 캡처할 준비가 됐을 때 불린다.
     창이 가려지거나 바쁘면 늦게 오거나 아예 안 와서 화면이 안 바뀐다.
     그래서 조금 기다렸는데도 안 불리면 그냥 직접 바꾼다. */
  let done = false;
  const apply = () => {
    if (done) return;
    done = true;
    applyView(view);
  };
  // 메일함을 오갈 때는 사이드바 폭·상단 막대가 함께 바뀌어 움직임이 크다. 빠르고(0.15초) 움직임 없는 전환으로.
  const mailSwitch = [state.view, view].some((v) => v === "emails" || v === "compose");
  document.documentElement.classList.toggle("vt-quick", mailSwitch);
  const transition = document.startViewTransition(apply);
  lastViewTransition = transition; // 소개(showTourStep)가 돌던 전환을 끝낼 수 있게
  transition.finished.finally(() => document.documentElement.classList.remove("vt-quick"));
  transition.finished.catch(() => {});
  transition.updateCallbackDone.catch(() => {});
  window.setTimeout(apply, 150);
}

/* ===== 화면마다 다른 새로고침 =====
   예전에는 상단 버튼 하나가 '마감 + 메일'을 통째로 돌리고, 공지·셔틀·메일은
   각 화면 안에 따로 새로고침 버튼이 있었다. 어디를 눌러야 지금 보고 있는 것이
   갱신되는지 알기 어려웠다.
   이제 상단 버튼 하나가 지금 화면에 맞춰 이름과 하는 일을 바꾼다.
   (설정에서 매일 도는 자동 동기화는 그대로 전체를 훑는다) */
const VIEW_REFRESH = {
  dashboard: { label: "전체 새로고침", hint: "마감·일정과 메일을 함께 다시 가져옵니다." },
  deadlines: { label: "마감 새로고침", hint: "LMS에서 과제 마감일을 다시 가져옵니다." },
  calendar: { label: "일정 새로고침", hint: "학사일정과 과제 마감을 다시 가져옵니다." },
  courses: { label: "강의 새로고침", hint: "개설강좌 목록을 다시 가져옵니다." },
  files: { label: "자료 새로고침", hint: "LMS 강의자료를 다시 받아 Drive에 정리합니다." },
  emails: { label: "메일 새로고침", hint: "학교 메일함을 다시 가져옵니다." },
  compose: { label: "메일 새로고침", hint: "학교 메일함을 다시 가져옵니다." },
  storage: { label: "창고 새로고침", hint: "저장된 자료 목록을 다시 셉니다." },
  settings: { label: "상태 새로고침", hint: "연결 상태를 다시 확인합니다." },
};

function updateRefreshButton(view) {
  const button = $("#refreshAllButton");
  if (!button) return;
  // 메일함에는 '3분 전 업데이트' 가 붙은 제 새로고침이 있다. 같은 일을 하는 버튼을 둘 두지 않는다.
  button.hidden = view === "emails" || view === "compose";
  const spec = VIEW_REFRESH[view] || VIEW_REFRESH.dashboard;
  const icon = button.querySelector(".icon");
  button.textContent = "";
  if (icon) button.appendChild(icon);
  button.appendChild(document.createTextNode(spec.label));
  button.title = spec.hint;
  renderLastSync();
}

/* ===== 마지막 동기화 시각 =====
   자동으로 가져오는 게 기본이라, 화면마다 '언제 가져왔는지'만 보여 준다.
   새로고침 버튼은 지금 당장 다시 가져오고 싶을 때 누른다. */
const VIEW_SYNC_KINDS = {
  dashboard: ["deadlines", "emails"],
  deadlines: ["deadlines"],
  calendar: ["deadlines"],
  files: ["sync"],
  storage: ["sync"],
  emails: ["emails"],
  compose: ["emails"],
  settings: ["sync", "deadlines", "emails"],
};
const SYNC_KIND_LABEL = { sync: "자료", deadlines: "마감", emails: "메일" };

/* 앞 작업이 실제로 끝날 때까지 기다린다.
   startRun 은 '시작해 달라' 고 부탁만 하고 바로 돌아오므로, 결과를 보려면 기다려야 한다.
   예전에는 이 함수가 버튼 묶는 함수 안에만 있어서, 밖에 있는 runViewRefresh 가 부르면
   'waitForTask is not defined' 로 멈췄다(작업은 돌지만 화면이 안 바뀌었다). */
async function waitForTask(maxMs = 180000, lane = "main") {
  const until = Date.now() + maxMs;
  while (Date.now() < until) {
    // 메일은 2초 남짓이면 끝난다. 0.9초마다 물으면 끝난 뒤 최대 0.9초를 그냥 기다렸다
    await new Promise((r) => window.setTimeout(r, lane === "mail" ? 300 : 900));
    try {
      const task = await api("/api/task");
      // 메일은 따로 도는 칸이라 메일만 기다린다 (자료 동기화가 끝나길 기다리지 않는다)
      if (!(lane === "mail" ? task.mail?.running : task.running)) return true;
    } catch (error) {
      return false;
    }
  }
  return false;
}

function agoText(iso) {
  if (!iso) return "아직 안 함";
  const when = new Date(String(iso));
  if (Number.isNaN(when.getTime())) return "아직 안 함";
  const minutes = Math.max(0, Math.round((Date.now() - when.getTime()) / 60000));
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

function renderLastSync() {
  const node = $("#lastSync");
  if (!node) return;
  const kinds = VIEW_SYNC_KINDS[state.view] || [];
  const stamps = state.health?.lastSuccess || {};
  if (!kinds.length) {
    node.hidden = true;
    return;
  }
  const parts = kinds.map((kind) => `${SYNC_KIND_LABEL[kind]} ${agoText(stamps[kind])}`);
  // '자동 · 마감 30분 전' 은 무엇이 30분 전인지 알기 어려웠다
  const text = `마지막 확인 · ${parts.join(" · ")}`;
  if (node.textContent !== text) node.textContent = text;
  node.title = kinds
    .map((kind) => `${SYNC_KIND_LABEL[kind]}: ${stamps[kind] ? String(stamps[kind]).replace("T", " ") : "아직 안 함"}`)
    .join("\n");
  node.hidden = false;
}

async function runViewRefresh(view) {
  // 체험 중에는 아무것도 새로 받지 않는다. 그대로 두면 공지·셔틀이 '새로 받았어요' 라고 알렸다
  if (DEMO_ON) {
    showToast("체험 중에는 쓸 수 없어요. 체험을 끝내고 계정을 넣으면 돼요.");
    return;
  }
  switch (view) {
    case "emails":
    case "compose":
      await startRun("/api/refresh-emails", "메일 가져오는 중");
      await waitForTask(180000, "mail");
      break;
    case "deadlines":
      await startRun("/api/refresh-deadlines", "마감 가져오는 중");
      await waitForTask();
      break;
    case "calendar":
      await startRun("/api/refresh-deadlines", "일정 가져오는 중");
      await waitForTask();
      await loadAcademic(true);
      break;
    case "courses":
      await loadCatalog(true);
      break;
    case "files":
      // 자료는 LMS에서 새로 받아 Drive까지 정리하는 전체 동기화가 맞다
      // 직접 누른 새로고침은 빠짐없이 (전체 검사). 3시간마다 도는 자동은 빠른 검사.
      await startRun("/api/run", "자료 가져오는 중", { confirm: true, mode: "full" });
      await waitForTask();
      break;
    case "storage":
      await loadShelves(true);
      break;
    default:
      // 메일은 따로 돌 수 있으니 함께 시작하고 둘 다 기다린다
      await startRun("/api/refresh-deadlines", "마감·일정 가져오는 중");
      await startRun("/api/refresh-emails", "메일 가져오는 중");
      await Promise.all([waitForTask(), waitForTask(180000, "mail")]);
  }
  await refreshAll();
}

function applyView(view) {
  state.view = view;
  updateRefreshButton(view);
  // 메일 쓰기는 메일함(view-emails) 셸을 공유하되 작성 pane을 연다
  const isCompose = view === "compose";
  const shellView = isCompose ? "emails" : view;
  document.querySelectorAll(".view").forEach((node) => {
    node.hidden = node.id !== `view-${shellView}`;
  });
  if (view === "settings") {
    populateSettings();
    renderStorage();
    loadMailMe(true);
  }
  if (view === "emails") {
    showMailPane("list");
  }
  if (isCompose) {
    if (!state.config?.schoolEmail) {
      showToast("설정 → 학교 이메일에서 계정을 먼저 입력해 주세요.");
      openSettings();
      return;
    }
    openCompose();
    restoreDraftIfAny();
  }
  document.querySelectorAll(".nav-item[data-view]").forEach((item) => {
    // 메일 쓰기는 메일함 셸을 쓰므로 메일함 메뉴를 켠 채로 둔다
    item.classList.toggle("active", item.dataset.view === shellView);
  });
  // 휴대폰 탭바에서는 강의·창고·설정이 '더보기' 안에 있다. 그 화면이면 '더보기'를 켠다.
  $("#navMore")?.classList.toggle(
    "active",
    Boolean(document.querySelector(`.nav-item[data-more][data-view="${shellView}"]`)),
  );
  closeMoreSheet();
  // 메일함은 Gmail식 집중 모드: 사이드바 축소 + 우측 로그 레일 숨김
  document.querySelector(".app-shell").classList.toggle("mail-focus", shellView === "emails");
  placeMailSearch();
  // 사이드바 폭이 바뀐 뒤에 재야 알약이 엉뚱한 크기로 남지 않는다.
  // 폭 변화는 애니메이션이라 ResizeObserver가 그동안 계속 맞춰 준다.
  moveNavPill();
  // 이 화면에 필요한 것만 그린다 (안 보이는 화면은 그리지 않으므로,
  // 화면을 바꿀 때 여기서 채워 줘야 한다)
  renderCurrentView();
  navPush();
  // 그 화면에 처음 왔으면 달구가 짧게 소개한다 (tour 는 아래에서 만들어진다. 켜지는 중이면 건너뜀)
  try {
    maybeViewIntro(view);
  } catch (error) {
    /* 아직 소개 준비 전 */
  }
}

/* ===== 마감일 헬퍼 ===== */
function parseDue(item) {
  if (!item.due) return null;
  const date = new Date(item.due);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isSubmitted(item) {
  return item.myStatus === "Graded" || item.myStatus === "NeedsGrading";
}

function dayDiff(date) {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDue = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((startDue - startToday) / 86400000);
}

function ddayInfo(item) {
  const due = parseDue(item);
  if (!due) return { label: "기한 없음", cls: "normal" };
  const overdue = due.getTime() < Date.now();
  const diff = dayDiff(due);
  if (isSubmitted(item)) {
    return { label: "완료", cls: "done" };
  }
  if (overdue) {
    return { label: "지남", cls: "urgent" };
  }
  if (diff <= 0) return { label: "D-DAY", cls: "urgent" };
  if (diff <= 3) return { label: `D-${diff}`, cls: "soon" };
  return { label: `D-${diff}`, cls: "normal" };
}

function submitBadge(item) {
  if (item.myStatus === "Graded") {
    const score = item.myScore != null ? ` · ${item.myScore}점` : "";
    return `<span class="submit-badge graded">채점 완료${escapeHtml(score)}</span>`;
  }
  if (item.myStatus === "NeedsGrading") {
    return '<span class="submit-badge submitted">제출됨 · 채점 대기</span>';
  }
  const due = parseDue(item);
  if (due && due.getTime() < Date.now()) {
    return '<span class="submit-badge missing">미제출 · 마감 지남</span>';
  }
  return '<span class="submit-badge unknown">미제출</span>';
}

function formatDue(date) {
  if (!date) return "기한 없음";
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${month}/${day} (${weekday}) ${hours}:${minutes}`;
}

/* 마감 항목에는 서버가 주는 id가 없어 과목+제목+기한으로 키를 만든다 */
function deadlineKey(item) {
  return [item.courseLabel || item.course || "", item.name || "", item.due || ""].join("|");
}

function deadlineRow(item, removable = false) {
  const due = parseDue(item);
  const dday = ddayInfo(item);
  const remove = removable
    ? `<button type="button" class="deadline-remove" data-remove-deadline="${escapeHtml(deadlineKey(item))}" title="목록에서 지우기" aria-label="목록에서 지우기"><span class="icon" data-icon="trash"></span></button>`
    : "";
  // 미제출 과제는 LMS 제출 페이지로 바로 이동
  const submit =
    !removable && item.courseId
      ? `<button type="button" class="deadline-submit" data-submit='${escapeHtml(
          JSON.stringify({ courseId: item.courseId, columnId: item.columnId || "", name: item.name || "" }),
        )}' title="LMS 제출 페이지 열기">제출하러 가기</button>`
      : "";
  return `
    <div class="deadline-row">
      <span class="dday-badge ${dday.cls}">${dday.label}</span>
      <div class="deadline-main">
        <strong title="${escapeHtml(item.name)}">${escapeHtml(shortText(item.name, 56))}</strong>
        <span>${escapeHtml(shortText(item.courseLabel || item.course, 44))}</span>
      </div>
      <div class="deadline-meta">
        <time>${formatDue(due)}</time>
        ${submitBadge(item)}
      </div>
      ${submit}
      ${remove}
    </div>
  `;
}

/* ===== 대시보드 ===== */
function renderUpcoming() {
  const list = $("#upcomingList");
  const now = Date.now();
  const matchesQuery = queryMatcher();
  const upcoming = state.deadlines.items
    .filter((item) => {
      const due = parseDue(item);
      return due && due.getTime() >= now && !isSubmitted(item) && matchesQuery(item);
    })
    .sort((a, b) => new Date(a.due) - new Date(b.due))
    .slice(0, 6);

  if (!upcoming.length) {
    list.innerHTML =
      '<div class="empty-state"><strong>다가오는 미제출 과제가 없습니다 🎉</strong><span>새로고침으로 최신 상태를 확인할 수 있어요.</span></div>';
    return;
  }
  list.innerHTML = upcoming.map(deadlineRow).join("");
}

/* 다가오는 일정: 과제 마감은 바로 위 '다가오는 마감' 에 있으니 빼고, 7일 안의 세미나·학교 행사·학사일정·내 일정·
   LMS 의 마감 아닌 일정(시험 등)을 보인다. 예전엔 LMS 캘린더를 그대로 옮겨 마감과 같은 줄이 두 번 떴다(2026-10-14). */
const EVENT_KIND = {
  event: ["세미나", "violet"],
  school: ["학교 행사", "blue"],
  academic: ["학사일정", "amber"],
  mine: ["내 일정", "green"],
  lms: ["LMS", "coral"],
};
const EVENT_DAYS_AHEAD = 7; // 대시보드 요약줄의 마감 기간(7일)과 맞춘다

function upcomingEventItems() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const until = today.getTime() + EVENT_DAYS_AHEAD * 86400000;
  const norm = (t) => String(t || "").replace(/\s+/g, "").toLowerCase();
  const deadlineNames = (state.deadlines.items || []).map((d) => norm(d.name)).filter((n) => n.length >= 4);
  const isDeadline = (title) => {
    const t = norm(title);
    return deadlineNames.some((n) => t.includes(n) || n.includes(t));
  };
  const items = calendarItems().filter((it) => EVENT_KIND[it.kind]);
  // LMS 캘린더 일정 중 과제 마감과 같은 것은 빼고 남은 것(시험·휴강 공지 등)만
  (state.deadlines.events || []).forEach((ev) => {
    if (!ev.start || isDeadline(ev.title)) return;
    const dt = new Date(ev.start);
    if (Number.isNaN(dt.getTime())) return;
    items.push({ date: dt, title: ev.title, sub: [ev.calendarName, ev.location].filter(Boolean).join(" · "), kind: "lms" });
  });
  // 여러 날 학사일정(시험 기간 등)은 시작일 하나로
  academicShown()
    .forEach((e) => {
      if (!e.end || e.end === e.start) return;
      const dt = new Date(`${e.start}T00:00`);
      if (Number.isNaN(dt.getTime())) return;
      items.push({ date: dt, title: e.title, sub: `${e.start.slice(5).replace("-", "/")} ~ ${e.end.slice(5).replace("-", "/")}`, kind: "academic", allDay: true });
    });
  const seen = new Set();
  return items
    .filter((it) => {
      const t = it.date.getTime();
      return t >= today.getTime() && t < until;
    })
    .sort((a, b) => a.date - b.date)
    .filter((it) => {
      // 여러 날 행사는 날마다 하나씩 들어 있어 첫날만 남긴다
      const key = `${it.kind}|${norm(it.title)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 6);
}

function renderEvents() {
  const box = $("#eventsList");
  if (!box) return;
  const items = upcomingEventItems();
  if (!items.length) {
    box.innerHTML = `<div class="empty-state"><strong>7일 안에 잡힌 행사·일정이 없어요</strong></div>`;
    return;
  }
  const todayKey = new Date().toDateString();
  box.innerHTML = items
    .map((it) => {
      const [label, tone] = EVENT_KIND[it.kind];
      const d = it.date;
      const day = d.toDateString() === todayKey ? "오늘" : `${d.getMonth() + 1}/${d.getDate()} (${NOW_WEEKDAY[d.getDay()]})`;
      const time = it.allDay ? "" : `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
      // 꼬리표와 같은 말('학사일정')·'1/5일째' 는 아래 줄에서 뺀다
      const sub = shortText(String(it.sub || "").replace(/^\d+\/\d+일째( · )?/, "").replace(/^학사일정( · )?/, ""), 56);
      return `
        <button type="button" class="event-row" ${it.mailId ? `data-mailid="${escapeHtml(String(it.mailId))}"` : "data-go-calendar"}>
          <span class="event-date">${escapeHtml(day)}${time ? `<em>${time}</em>` : ""}</span>
          <span class="event-title">
            <span class="event-kind tone-${tone}">${escapeHtml(label)}</span>
            ${escapeHtml(shortText(it.title, 52))}
            ${sub ? `<span class="event-sub">${escapeHtml(sub)}</span>` : ""}
          </span>
        </button>`;
    })
    .join("");
}

$("#eventsList")?.addEventListener("click", (event) => {
  const row = event.target.closest(".event-row");
  if (!row) return;
  const mail = row.dataset.mailid && (state.emails.emails || []).find((m) => String(m.id) === row.dataset.mailid);
  if (mail) {
    switchView("emails");
    window.setTimeout(() => openEmailDetail(mail), 200);
  } else {
    switchView("calendar");
  }
});

/* ===== 과제 마감 뷰 ===== */
function queryMatcher() {
  const query = state.query.trim().toLowerCase();
  if (!query) return () => true;
  return (item) =>
    `${item.name} ${item.course} ${item.courseLabel}`.toLowerCase().includes(query);
}

function renderDeadlineFilters() {
  const select = $("#deadlineCourseFilter");
  const labels = [...new Set(state.deadlines.items.map((i) => i.courseLabel).filter(Boolean))].sort();
  const current = select.value;
  select.innerHTML = '<option value="">전체 과목</option>';
  labels.forEach((label) => {
    const option = document.createElement("option");
    option.value = label;
    option.textContent = shortText(label, 30);
    select.append(option);
  });
  select.value = labels.includes(current) ? current : "";
}

function renderDeadlines() {
  const list = $("#deadlineList");
  const empty = $("#deadlineEmpty");
  const matchesQuery = queryMatcher();
  const now = Date.now();

  const rows = state.deadlines.items
    .filter((item) => {
      if ((state.selection.hiddenDeadlines || []).includes(deadlineKey(item))) return false;
      if (!matchesQuery(item)) return false;
      if (state.deadlineCourse && item.courseLabel !== state.deadlineCourse) return false;
      const due = parseDue(item);
      const overdue = due ? due.getTime() < now : false;
      if (state.deadlineStatus === "open") return !isSubmitted(item) && !overdue;
      if (state.deadlineStatus === "missing") return !isSubmitted(item) && overdue;
      if (state.deadlineStatus === "submitted") return isSubmitted(item);
      return true;
    })
    .sort((a, b) => {
      // 미제출 & 마감 전 → 마감 임박 순 → 지난 항목 → 제출 완료
      const rank = (item) => {
        const due = parseDue(item);
        const overdue = due ? due.getTime() < now : false;
        if (!isSubmitted(item) && !overdue) return 0;
        if (!isSubmitted(item) && overdue) return 1;
        return 2;
      };
      const diff = rank(a) - rank(b);
      if (diff !== 0) return diff;
      return new Date(a.due || 0) - new Date(b.due || 0);
    });

  $("#deadlinesCount").textContent = `${rows.length}건`;
  const updated = state.deadlines.updatedAt;
  $("#deadlinesUpdatedAt").textContent = updated
    ? `마지막 갱신 ${updated.replace("T", " ").slice(0, 16)}`
    : "아직 가져온 마감 정보가 없습니다. 상단의 '새로고침'을 눌러 주세요.";

  // 완료(제출)한 과제와 남은 과제를 나눠서 보여 준다
  const done = rows.filter(isSubmitted);
  const active = rows.filter((item) => !isSubmitted(item));
  const section = (title, items, removable) =>
    items.length
      ? `<div class="deadline-section">
           <div class="deadline-section-head">
             <h3>${title}</h3>
             <span>${items.length}건</span>
             ${removable ? `<button type="button" class="text-button" id="clearDoneDeadlines">완료 항목 모두 지우기</button>` : ""}
           </div>
           ${items.map((it) => deadlineRow(it, removable)).join("")}
         </div>`
      : "";

  list.innerHTML = section("진행 중 · 예정", active, false) + section("완료", done, true);
  installIcons(list);
  empty.hidden = rows.length > 0;

  const save = async (msg) => {
    try {
      await api("/api/selection", { method: "POST", body: JSON.stringify(state.selection) });
      showToast(msg);
      renderDeadlines();
    } catch (error) {
      showToast(error.message);
    }
  };

  // 제출 페이지 열기 (앱이 대신 제출하지는 않음)
  list.querySelectorAll("[data-submit]").forEach((btn) => {
    btn.addEventListener("click", async (event) => {
      event.stopPropagation();
      let info;
      try {
        info = JSON.parse(btn.dataset.submit);
      } catch (error) {
        return;
      }
      try {
        const r = await api("/api/assignment/open", { method: "POST", body: JSON.stringify(info) });
        showToast(
          r.opened
            ? `'${shortText(info.name, 22)}' 제출 페이지를 열었습니다. 파일 업로드와 제출은 LMS에서 직접 해 주세요.`
            : r.message,
        );
        if (!r.opened && r.url) openOutside(r.url);
      } catch (error) {
        showToast(error.message);
      }
    });
  });

  list.querySelectorAll("[data-remove-deadline]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      const key = btn.dataset.removeDeadline;
      state.selection.hiddenDeadlines = [...new Set([...(state.selection.hiddenDeadlines || []), key])];
      save("완료한 과제를 목록에서 지웠습니다.");
    });
  });

  $("#clearDoneDeadlines")?.addEventListener("click", async () => {
    if (!done.length) return;
    if (!(await uiConfirm(`완료한 과제 ${done.length}건을 목록에서 뺄까요?\n새로고침하면 다시 나타납니다.`, { title: "완료한 과제 정리", ok: "빼기" }))) return;
    state.selection.hiddenDeadlines = [
      ...new Set([...(state.selection.hiddenDeadlines || []), ...done.map(deadlineKey)]),
    ];
    save(`완료한 과제 ${done.length}건을 지웠습니다.`);
  });
}

/* ===== 이메일 뷰 (신문식 레이아웃) ===== */
const CATEGORY_ORDER = [
  "답신", "교수님", "수업·LMS", "세미나·행사", "취업·진로", "학생회", "행정·학생팀", "동아리·문화", "계정·알림", "기타",
];

const CATEGORY_COLORS = {
  "답신": "blue",
  "교수님": "coral",
  "학생회": "amber",
  "행정·학생팀": "neutral",
  "세미나·행사": "green",
  "취업·진로": "coral",
  "동아리·문화": "blue",
  "수업·LMS": "amber",
  "계정·알림": "neutral",
  "기타": "neutral",
};

/* 분류 아이콘(이모지)은 없앴다.
   글자만으로도 충분하고, 이모지가 섞이면 화면이 지저분해진다. */
const CATEGORY_ICONS = {};

/* 목록이 400px일 때 '7/22 (수) 19:40'은 74px을 먹는다.
   제목에 줄 자리가 없어져서, 좁은 칸에서는 짧게 쓴다. */
function compactMailDate(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }
  const md = `${date.getMonth() + 1}/${date.getDate()}`;
  return date.getFullYear() === now.getFullYear()
    ? md
    : `${String(date.getFullYear()).slice(2)}.${md}`;
}

function formatEmailDate(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return formatDue(date);
}

/* ===== 메일 검색: 과목으로도 찾기 (2026-10-09) =====
   예전에는 제목·보낸 사람·미리보기에 글자가 그대로 있어야만 찾았고, 지금 보고 있는 폴더·탭 안에서만 찾았다.
   그래서 '일반화학Ⅱ' 로 치면 내가 쓴 '[일반화학II 02분반]' 메일(보낸 편지함)도, 조교가 보낸 답장도 안 나왔다.
   - 비교 전에 띄어쓰기를 빼고 로마 숫자(Ⅱ·II)를 아라비아 숫자로 맞춘다.
   - 검색어가 내 과목 이름(한글·영어)이면 그 과목의 다른 이름과, 그 과목 교수·조교와 주고받은 메일도 찾는다.
   - 검색 중에는 폴더·탭을 가리지 않고 휴지통만 빼고 다 찾는다(renderEmails). */
const ROMAN_DIGITS = { "Ⅰ": "1", "Ⅱ": "2", "Ⅲ": "3", "Ⅳ": "4", "Ⅴ": "5", "ⅰ": "1", "ⅱ": "2", "ⅲ": "3", "ⅳ": "4" };
function searchNorm(text) {
  return String(text || "")
    .replace(/[ⅠⅡⅢⅣⅤⅰⅱⅲⅳ]/g, (ch) => ROMAN_DIGITS[ch])
    .toLowerCase()
    .replace(/\s+/g, "")
    // '일반화학ii' · 'physicsii' → '...2' (한글이나 영어 낱말 바로 뒤의 i·ii·iii·iv 만)
    .replace(/([가-힣]|[a-z]{3,})(iv|iii|ii|i)(?=$|[^a-z])/g, (m, head, roman) => head + { i: "1", ii: "2", iii: "3", iv: "4" }[roman]);
}

/** 내 과목들: 한글 이름·영어 이름·교수·조교 메일 주소 */
function mailCourseIndex() {
  const key = `${(state.courseState?.current || []).length}|${state.courseStaffSig || ""}`;
  if (mailCourseIndex.key === key) return mailCourseIndex.list;
  const byLabel = new Map();
  const add = (label, korean) => {
    if (!label) return null;
    const k = staffKey(label);
    if (!byLabel.has(k)) byLabel.set(k, { names: new Set(), emails: new Set(), label });
    const c = byLabel.get(k);
    c.names.add(searchNorm(label));
    if (korean) c.names.add(searchNorm(korean));
    return c;
  };
  (state.courseState?.current || []).forEach((c) => {
    add(extractCourseLabelJs(c.name), c.name.includes("(") ? c.name.split("(", 1)[0].trim() : "");
  });
  (state.courseStaff || new Map()).forEach(({ label, rows }) => {
    const c = add(label, (rows[0] || {}).title);
    rows.forEach((r) => r.email && c.emails.add(r.email.toLowerCase()));
  });
  // 개설강좌 담당교수 꼬리표: 과목명(한글)이 같으면 그 교수 주소도 그 과목으로 (다른 분반 교수 포함)
  Object.entries(state.coursePeople || {}).forEach(([email, hits]) => {
    hits.forEach((h) => {
      byLabel.forEach((c) => {
        if (c.names.has(searchNorm(h.title))) c.emails.add(email);
      });
    });
  });
  const list = [...byLabel.values()].map((c) => ({ ...c, names: [...c.names].filter((n) => n.length >= 2) }));
  mailCourseIndex.key = key;
  mailCourseIndex.list = list;
  return list;
}

function emailMatchesQuery(mail) {
  const raw = `${state.query} ${state.emailQuery || ""}`.trim();
  if (!raw) return true;
  const haystack = searchNorm(
    `${mail.subject} ${mail.summary || ""} ${mail.fromName} ${mail.fromEmail} ${mail.toName || ""} ${mail.toEmail || ""} ${mail.snippet} ${mail.category}`,
  );
  const whole = searchNorm(raw);
  if (haystack.includes(whole)) return true;
  // 과목 이름으로 찾기: 검색어가 과목 이름의 일부면 그 과목의 다른 이름·교수·조교 메일까지
  if (whole.length >= 2) {
    const courses = mailCourseIndex().filter((c) => c.names.some((n) => n.includes(whole)));
    if (courses.length) {
      const people = [mail.fromEmail, mail.toEmail, ...(mail.to || []), ...(mail.cc || [])]
        .map((e) => String(e?.email || e || "").toLowerCase())
        .filter(Boolean);
      if (courses.some((c) => c.names.some((n) => haystack.includes(n)) || people.some((e) => c.emails.has(e)))) return true;
    }
  }
  return raw.split(/\s+/).every((word) => haystack.includes(searchNorm(word)));
}

function isPastEvent(mail) {
  if (!mail.eventDate) return false;
  const date = new Date(mail.eventDate);
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
}

const INFO_ORDER = ["일시", "마감", "장소", "연사", "주최", "대상"];
const INFO_ICONS = { "일시": "🕐", "마감": "⏳", "장소": "📍", "연사": "🎤", "주최": "🏛", "대상": "👥" };

function infoChips(mail, max = 4) {
  const info = mail.info || {};
  const keys = INFO_ORDER.filter((key) => info[key]).slice(0, max);
  if (!keys.length) return "";
  return `
    <div class="info-chips">
      ${keys
        .map(
          (key) => `<span class="info-chip"><b>${INFO_ICONS[key] || ""} ${escapeHtml(key)}</b>${escapeHtml(info[key])}</span>`,
        )
        .join("")}
    </div>
  `;
}

function newsCard(mail, featured = false) {
  const color = CATEGORY_COLORS[mail.category] || "neutral";
  const headline = mail.summary || mail.subject;
  const showSubject = Boolean(mail.summary) && mail.summary !== mail.subject;
  return `
    <article class="news-card ${featured ? "featured" : ""} ${mail.unread ? "unread" : ""}" data-mail-id="${mail.id}" draggable="true">
      <div class="news-card-top">
        <input type="checkbox" class="mail-pick" aria-label="선택" />
        <span class="category-chip ${color}">${escapeHtml(mail.category || "기타")}</span>
        ${mail.unread ? '<span class="unread-dot" title="안 읽은 메일"></span>' : ""}
        <span class="card-actions">
          <button type="button" class="mail-act" data-act="read" title="${mail.unread ? "읽음 표시" : "안읽음 표시"}">
            <span class="icon" data-icon="${mail.unread ? "check" : "mail"}"></span>
          </button>
          <button type="button" class="mail-act danger" data-act="delete" title="삭제">
            <span class="icon" data-icon="trash"></span>
          </button>
        </span>
      </div>
      <strong class="news-headline">${escapeHtml(headline)}</strong>
      ${showSubject ? `<span class="news-subject" title="${escapeHtml(mail.subject)}">${escapeHtml(shortText(mail.subject, featured ? 80 : 56))}</span>` : ""}
      <p class="email-snippet">${escapeHtml(shortText(mail.snippet, featured ? 200 : 110))}</p>
      <div class="news-card-foot">
        <span class="news-card-sender">${escapeHtml(shortText(mail.fromName || mail.fromEmail, 26))} · ${formatEmailDate(mail.date)}</span>
      </div>
    </article>
  `;
}

/* ===== 메일 본문 그리기 =====
   예전에는 서버가 HTML을 평문으로 눌러 보내서 표·이미지·서식이 다 날아갔다.
   이제 원본 HTML을 함께 받아, 스크립트를 막은 iframe 안에 넣어 그린다.
   바깥에서 불러오는 그림은 '읽었는지' 추적에 쓰이므로 처음엔 막아 둔다. */
function mailFrameDoc(html, showImages) {
  /* 그림을 막았더니 그림만으로 된 안내 메일이 통째로 빈 화면이 됐다.
     내가 받은 메일을 내가 보는 것이니 기본은 '보여 준다'.
     대신 referrer 는 넘기지 않아 어디서 열었는지는 알려 주지 않는다. */
  const blocker = showImages
    ? ""
    : `<style>img[src^="http"],img[src^="//"]{display:none !important}</style>`;
  const cs = getComputedStyle(document.documentElement);
  const font = cs.getPropertyValue("--font-sans").trim() || "'Segoe UI', 'Malgun Gothic', -apple-system, 'Apple SD Gothic Neo', sans-serif";
  // 밝은 테마: 본문을 투명하게 해 읽기 화면 배경 위에 그대로 앉힌다.
  //   예전에는 --surface(흰색)를 칠해서 크림색 앱 안에 흰 메모장이 떠 있는 것처럼 보였다.
  // 어두운 테마: 메일은 대부분 검은 글자를 박아 두어 어두운 바탕에서 안 읽힌다.
  //   그래서 은은한 종이 카드 위에 올린다.
  const onPaper = mailOnPaper();
  const text = onPaper ? "#1f1e1d" : cs.getPropertyValue("--text").trim() || "#222";
  const bg = onPaper ? mailPaperColor() : "transparent";
  // 본문 안의 그림은 /api/mail-image 로 온다. srcdoc 안에서도 그 주소를 찾게
  // 기준 주소를 박아 준다 (없으면 about:srcdoc 기준이라 그림이 다 깨진다).
  return `<!doctype html><html><head><meta charset="utf-8">
    <meta name="referrer" content="no-referrer">
    <base href="${location.origin}/" target="_blank">
    <style>
      html{background:transparent}
      body{margin:0;padding:${onPaper ? "22px 26px" : "2px 0"};font-family:${font};
           font-size:15px;line-height:1.75;color:${text};background:${bg};word-break:break-word}
      img,table{max-width:100% !important;height:auto}
      table{border-collapse:collapse}
      a{color:${cs.getPropertyValue("--accent-strong").trim() || "#c60"}}
      ::-webkit-scrollbar{width:8px;height:8px;background:transparent}
      ::-webkit-scrollbar-button{display:none}
      ::-webkit-scrollbar-thumb{background:rgba(128,128,128,.35);border:2px solid transparent;background-clip:padding-box;border-radius:999px}
    </style>${blocker}</head><body>${html}</body></html>`;
}

function sizeMailFrame(frame) {
  try {
    const doc = frame.contentDocument;
    const fit = () => {
      // 주간소식처럼 긴 메일은 본문만 12,000px 이 넘는다.
      // 6,000px 로 묶어 두었더니 절반이 잘려 나갔다.
      const h = doc.body.scrollHeight;
      frame.style.height = `${Math.min(Math.max(h + 16, 120), 40000)}px`;
    };
    fit();
    // 그림은 늦게 온다. 하나 실릴 때마다 높이를 다시 잡아 준다.
    doc.querySelectorAll("img").forEach((img) => {
      if (img.complete) return;
      img.addEventListener("load", fit, { once: true });
      img.addEventListener("error", fit, { once: true });
    });
    window.setTimeout(fit, 900);
  } catch (error) {
    frame.style.height = "420px";
  }
}

/* 본문 받아오기.
   목록 응답에는 본문이 빠져 있다(그것까지 실으면 980KB 를 12초마다 주고받는다).
   메일을 연 순간 그 한 통만 받아 와 객체에 붙여 둔다. 두 번째부터는 바로 뜬다. */
async function ensureMailBody(mail) {
  if (!mail || mail.bodyLoaded) return mail;

  // 목록은 12초마다 새로 받아 오면서 메일 객체를 통째로 갈아끼운다.
  // 객체에만 본문을 붙여 두면 그때마다 캐시가 날아가 같은 메일을 계속 다시 받는다.
  // id 로 따로 보관해 두면 목록이 바뀌어도 살아남는다.
  if (!state.mailBodies) state.mailBodies = {};
  const cached = state.mailBodies[mail.id];
  if (cached) {
    mail.body = cached.body;
    mail.bodyHtml = cached.bodyHtml;
    mail.bodyLoaded = true;
    return mail;
  }

  try {
    const full = await api(`/api/email-body?id=${encodeURIComponent(mail.id)}`);
    mail.body = full.body || "";
    mail.bodyHtml = full.bodyHtml || "";
  } catch (error) {
    // 못 받아도 목록의 미리보기(snippet)로 보여 준다
    mail.body = mail.body || "";
    mail.bodyHtml = mail.bodyHtml || "";
  }
  mail.bodyLoaded = true;
  state.mailBodies[mail.id] = { body: mail.body, bodyHtml: mail.bodyHtml };
  return mail;
}

async function renderMailBody(mail) {
  const plain = $("#readBody");
  const frame = $("#readHtml");
  const bar = $("#readImgBar");

  // '지금 열려 있는 메일'을 먼저 정해 둬야, 본문을 받아오는 사이에
  // 다른 메일로 옮겨 갔는지 판단할 수 있다.
  state.readMail = mail;
  state.readShowImages = false;

  if (!mail.bodyLoaded) {
    // 받아오는 동안 빈 화면 대신 미리보기라도 보여 준다
    if (frame) frame.hidden = true;
    if (bar) bar.hidden = true;
    plain.hidden = false;
    plain.textContent = mail.snippet || "본문을 불러오는 중...";
    await ensureMailBody(mail);
    // 그 사이 다른 메일을 눌렀으면 이 결과는 버린다
    if (!state.readMail || state.readMail.id !== mail.id) return;
  }

  const html = mail.bodyHtml || "";

  // 읽기 영역 폭을 본문 종류에 맞춘다.
  // 평문은 글줄이 길면 읽기 힘들어 68ch 로 묶는 게 맞지만,
  // HTML 메일은 표·이미지로 짜인 제 레이아웃이 있어서 같이 묶으면
  // 가운데만 좁게 눌리고 좌우가 텅 빈다(창을 키우지 않으면 특히 심하다).
  const doc = document.querySelector(".read-doc");
  if (doc) doc.classList.toggle("wide", Boolean(html));

  if (!html) {
    // 평문 메일은 그대로
    if (frame) frame.hidden = true;
    if (bar) bar.hidden = true;
    plain.hidden = false;
    plain.textContent = mail.body || mail.snippet || "(본문을 불러오지 못했습니다)";
    return;
  }

  plain.hidden = true;
  frame.hidden = false;
  state.readShowImages = true;
  frame.classList.toggle("on-paper", mailOnPaper());
  frame.srcdoc = mailFrameDoc(html, true);
  frame.onload = () => {
    blendMailBackground(frame);
    bindMailLinks(frame);
    sizeMailFrame(frame);
  };
  if (bar) bar.hidden = true;
}

function openEmailDetail(mail) {
  const color = CATEGORY_COLORS[mail.category] || "neutral";
  const chip = $("#readCategory");
  chip.className = `category-chip ${color}`;
  chip.textContent = mail.category || "기타";
  $("#readSubject").textContent = mail.subject;
  const date = mail.date ? formatEmailDate(mail.date) : "";
  // 보낸·임시보관 메일은 보낸 사람이 늘 '나' 라, 받는 사람을 보인다 (2026-10-15 '누구한테 보냈는지 안 보인다')
  const outgoing = (mail.folder === "sent" || mail.folder === "draft") && (mail.toName || mail.toEmail);
  const sender = outgoing ? mail.toName || mail.toEmail : mail.fromName || mail.fromEmail || "";
  const senderAddr = outgoing ? mail.toEmail || "" : mail.fromEmail || "";
  $("#readSender").textContent = outgoing ? `받는 사람 · ${sender}` : sender;
  // 이름이 곧 주소면 두 번 쓰지 않는다
  $("#readAddress").textContent = sender === senderAddr ? "" : senderAddr;
  // 이번 학기에 무슨 과목 몇 분반을 맡은 분인지 (개설강좌 담당교수 + 내 과목 조교)
  {
    const box = $("#readAddress");
    const tag = mail.folder === "sent" ? "" : coursePersonTagHtml(mail.fromEmail);
    if (tag) box.insertAdjacentHTML("beforeend", tag);
  }
  $("#readDate").textContent = date;
  const avatar = $("#readAvatar");
  avatar.textContent = (sender.trim()[0] || "?").toUpperCase();

  const summary = $("#readSummary");
  if (mail.summary && mail.summary !== mail.subject) {
    summary.textContent = mail.summary;
    summary.hidden = false;
  } else {
    summary.hidden = true;
  }

  renderMailBody(mail);
  state.replyContext = mail;
  // 읽음/안읽음 토글 아이콘
  const markBtn = $("#readMarkButton");
  markBtn.querySelector(".icon").dataset.icon = mail.unread ? "check" : "mail";
  markBtn.title = mail.unread ? "읽음 표시" : "안읽음 표시";
  installIcons(markBtn);

  showMailPane("read");
  $("#mailReadPane").querySelector(".mail-read-scroll").scrollTop = 0;

  // 열람 시 자동 읽음 처리
  if (mail.unread) {
    setEmailRead(mail, true, { silent: true });
  }
}

/* ===== 메일 읽음/삭제 액션 ===== */
async function setEmailRead(mail, seen, { silent = false } = {}) {
  // 로컬 상태 즉시 반영
  const target = state.emails.emails.find((m) => m.id === mail.id);
  if (target) target.unread = !seen;
  renderEmails();
  // 막 휴지통으로 옮긴 메일은 서버 휴지통 번호를 아직 모른다. 서버에는 보내지 않는다
  // (원래 번호로 보내면 휴지통에서 같은 번호인 다른 메일의 읽음 표시가 바뀌었다).
  if (mail.pendingTrash || mail.uid === null || mail.uid === undefined) return;
  try {
    await api("/api/mark-read", {
      method: "POST",
      body: JSON.stringify({ uid: mail.uid, folder: mail.folder, seen }),
    });
    if (!silent) showToast(seen ? "읽음으로 표시했습니다." : "안읽음으로 표시했습니다.");
  } catch (error) {
    if (!silent) showToast(error.message);
  }
}

async function deleteEmail(mail) {
  /* 받은 편지함에서 지우면 휴지통으로 간다 (되돌릴 수 있다).
     휴지통에서 지우면 영영 사라지므로 반드시 한 번 더 묻는다. */
  if (mail.pendingTrash) {
    // 막 휴지통으로 옮긴 메일은 서버 휴지통 안 번호를 아직 모른다(이 서버는 옮긴 번호를 알려 주지 않음).
    showToast("방금 휴지통으로 옮긴 메일이에요. 메일을 다시 받은 뒤(잠시 뒤) 해 주세요.");
    return;
  }
  const inTrash = mail.folder === "trash";
  if (inTrash) {
    const ok = await uiConfirm(
      `'${shortText(mail.subject || "(제목 없음)", 40)}'\n\n휴지통에서 지우면 되살릴 수 없어요.`,
      { title: "영구 삭제", danger: true, ok: "영구 삭제" },
    );
    if (!ok) return;
  }

  const before = state.emails.emails;
  state.emails.emails = before.filter((m) => m.id !== mail.id);
  renderEmails();
  try {
    const res = await api("/api/delete-email", {
      method: "POST",
      body: JSON.stringify({ uid: mail.uid, folder: mail.folder, permanent: inTrash }),
    });
    if (!res.ok) {
      // 서버가 한 번 더 확인을 요구한 경우 — 목록을 되돌린다
      state.emails.emails = before;
      renderEmails();
      showToast(res.message || "지우지 못했습니다.");
      return;
    }
    showToast(res.message || (inTrash ? "완전히 지웠습니다." : "휴지통으로 옮겼습니다."));
    if (!inTrash) {
      // 휴지통에 바로 보이게. 예전에는 목록에서 빼기만 해서 '휴지통으로 안 옮겨진다'고 보였다.
      state.emails.emails = [
        ...state.emails.emails,
        // uid 는 비운다: 원래 메일함 번호로 휴지통에 무언가를 하면 엉뚱한 메일이 바뀐다
        { ...mail, folder: "trash", id: `trash:pending-${mail.folder}-${mail.uid}`, uid: null, pendingTrash: true },
      ];
      renderEmails();
    }
  } catch (error) {
    state.emails.emails = before;
    renderEmails();
    showToast(error.message);
  }
}

/** 휴지통에 있는 메일을 받은 편지함으로 되돌린다 */
async function restoreEmail(mail) {
  if (mail.pendingTrash) {
    // 막 휴지통으로 옮긴 메일은 서버 휴지통 안 번호를 아직 모른다(이 서버는 옮긴 번호를 알려 주지 않음).
    showToast("방금 휴지통으로 옮긴 메일이에요. 메일을 다시 받은 뒤(잠시 뒤) 해 주세요.");
    return;
  }
  const before = state.emails.emails;
  state.emails.emails = before.filter((m) => m.id !== mail.id);
  renderEmails();
  try {
    const res = await api("/api/restore-email", {
      method: "POST",
      body: JSON.stringify({ uid: mail.uid, folder: mail.folder }),
    });
    showToast(res.message || "받은 편지함으로 되돌렸습니다.");
  } catch (error) {
    state.emails.emails = before;
    renderEmails();
    showToast(error.message);
  }
}

async function markAllRead() {
  state.emails.emails.forEach((m) => {
    if (m.folder === state.emailFolder || (state.emailFolder !== "sent" && state.emailFolder !== "promo" && m.folder === "inbox")) {
      m.unread = false;
    }
  });
  renderEmails();
  try {
    const data = await api("/api/mark-all-read", {
      method: "POST",
      body: JSON.stringify({ folder: state.emailFolder === "promo" || state.emailFolder === "sent" ? state.emailFolder : "inbox" }),
    });
    showToast(data.message || "모두 읽음으로 표시했습니다.");
  } catch (error) {
    showToast(error.message);
  }
}

/* ===== 인앱 작성 화면 ===== */
function openCompose({ to = "", cc = "", bcc = "", subject = "", body = "", inReplyTo = "", references = "", title = "새 메일" } = {}) {
  const form = $("#composeForm");
  form.elements.to.value = to;
  form.elements.cc.value = cc;
  form.elements.bcc.value = bcc;
  form.elements.subject.value = subject;
  form.elements.body.value = body;
  form.dataset.inReplyTo = inReplyTo;
  form.dataset.references = references;
  form.dataset.draftId = "";
  // 참조 줄은 늘 보이고, 숨은참조만 접었다 편다
  const bccField = $("#bccField");
  if (bccField) bccField.hidden = !bcc;
  const toggle = $("#htmlModeToggle");
  if (toggle) {
    toggle.checked = false;
    toggle.dispatchEvent(new Event("change"));
  }
  // 본문은 서식 영역에도 넣어 준다 (답장 인용문이 보이도록)
  setComposeBody(body ? escapeHtml(body).replace(/\n/g, "<br>") : "");
  const important = $("#markImportant");
  if (important) important.checked = false;
  const separately = $("#sendSeparately");
  if (separately) separately.checked = false;
  state.attachments = [];
  renderAttachments();
  const account = state.config?.schoolEmail || "";
  $("#composeFrom").textContent = account ? `보내는 사람: ${account}` : "설정에서 학교 이메일을 먼저 입력해 주세요.";
  showMailPane("compose");
  resetMailFlow();
  form.elements[to ? "subject" : "to"].focus();
}

/** '←' 목록으로: 쓰던 내용은 바로 저장해 두고 닫는다 */
function closeCompose() {
  // 손댄 게 있을 때만 (답장 창을 열기만 하고 닫으면 저장하지 않는다)
  if (state.mailPane === "compose" && autosave.dirty && composeHasContent()) {
    window.clearTimeout(autosave.server);
    saveDraftToServer({ auto: true });
  }
  state.attachments = [];
  showMailPane("list");
}

/** 휴지통(작성 취소): 쓰던 내용과 자동 저장본을 함께 버린다 */
async function discardCompose() {
  const form = $("#composeForm");
  if (composeHasContent()) {
    const ok = await uiConfirm("쓰던 메일을 버릴까요? 자동 저장한 것도 함께 지워요.", {
      title: "작성 취소",
      danger: true,
      ok: "버리기",
    });
    if (!ok) return;
  }
  const id = form?.dataset.draftId;
  clearAutosave();
  if (id) {
    api("/api/mail/discard-draft", { method: "POST", body: JSON.stringify({ draftId: id }) }).catch(() => {});
    form.dataset.draftId = "";
  }
  state.attachments = [];
  showMailPane("list");
}

/* 작성 중인 내용이 있는지 (폴더 이동 시 실수로 날리는 것 방지) */
function composeHasContent() {
  const form = $("#composeForm");
  if (!form) return false;
  const filled = ["to", "cc", "bcc", "subject", "body"].some(
    (name) => (form.elements[name]?.value || "").trim() !== "",
  );
  return filled || (state.attachments || []).length > 0;
}

/* 첨부는 웹메일처럼 표로 보여 준다 (파일명 · 출처 · 용량 · 지우기) */
const ATTACH_LIMIT = 10 * 1024 * 1024; // 학교 메일 기준 10MB

function renderAttachments() {
  if (typeof scheduleAutosave === "function") scheduleAutosave();
  const wrap = $("#composeAttachments");
  const atts = state.attachments || [];
  wrap.innerHTML = atts
    .map(
      (a, i) => `
      <div class="attach-row">
        <span class="ar-name" title="${escapeHtml(a.filename)}">
          <span class="icon" data-icon="paperclip"></span>
          ${escapeHtml(a.filename)}
        </span>
        <span class="ar-from">${escapeHtml(a.source || "내 PC")}</span>
        <span class="ar-size">${formatBytes(a.size)}</span>
        <button type="button" class="attach-remove" data-idx="${i}" aria-label="제거">✕</button>
      </div>`,
    )
    .join("");
  installIcons(wrap);

  const hint = $("#dropzoneHint");
  if (hint) hint.hidden = atts.length > 0;

  const total = atts.reduce((s, a) => s + a.size, 0);
  const note = $("#attachNote");
  if (note) {
    note.textContent = `${formatBytes(total)} / ${formatBytes(ATTACH_LIMIT)}`;
    // 학교 메일 한도를 넘으면 눈에 띄게
    note.classList.toggle("over", total > ATTACH_LIMIT);
  }
}

function formatBytes(n) {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)}KB`;
  return `${(n / 1024 / 1024).toFixed(1)}MB`;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ===== 작성창: 첨부칸에 끌어다 놓기 =====
   '내 자료'(강의자료 목록) 패널은 없앴다. 사용자가 Drive 창으로 고르는 쪽을 원했다.
   강의자료는 모두 Drive 에도 있으니 Drive 창에서 찾으면 된다. */
function bindComposeFiles() {
  const zone = $("#composeDropzone");
  if (!zone) return;
  // 운영체제(탐색기)에서 끌어온 파일을 받는다
  const over = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    zone.classList.add("drag-over");
  };
  zone.addEventListener("dragover", over);
  zone.addEventListener("dragenter", over);
  zone.addEventListener("dragleave", (event) => {
    if (!zone.contains(event.relatedTarget)) zone.classList.remove("drag-over");
  });
  zone.addEventListener("drop", async (event) => {
    event.preventDefault();
    zone.classList.remove("drag-over");
    const files = [...(event.dataTransfer.files || [])];
    for (const file of files) {
      const content = await fileToBase64(file);
      state.attachments.push({ filename: nfcName(file.name), size: file.size, content });
    }
    if (files.length) {
      renderAttachments();
      showToast(`${files.length}개 파일을 첨부했습니다.`);
    }
  });
}


/* 조직도에서 사람 찾기.
   받은 메일에서 뽑은 연락처만으로는 한 번도 메일을 주고받지 않은
   교수·학생을 찾을 수 없다. (그게 DGIST 웹메일과 가장 큰 차이였다) */
const dirCache = new Map();

async function lookupDirectory(term) {
  const q = (term || "").trim();
  if (q.length < 2) return [];
  if (dirCache.has(q)) return dirCache.get(q);
  try {
    const res = await api(`/api/directory?q=${encodeURIComponent(q)}`);
    const people = res.results || [];
    dirCache.set(q, people);
    return people;
  } catch (error) {
    return [];
  }
}

/* ===== 주소 자동완성 (DGIST 연락처) =====
   DGIST 메일은 보내는 이름을 '김호정/연구원/바이오메디컬연구부', '이지현/에너지공학과 (학생)'
   처럼 '이름/소속' 으로 붙여 보낸다. 웹메일 자동완성처럼 소속까지 보여 주려고 이걸 쪼갠다. */
function splitAffiliation(display) {
  const text = String(display || "").trim();
  const cut = text.indexOf("/");
  if (cut <= 0) return { name: text, org: "" };
  return { name: text.slice(0, cut).trim(), org: text.slice(cut + 1).trim() };
}

/** 조직도 한 사람의 소속 줄: 웹메일과 같은 '직위/부서' 또는 '부서(신분)' */
function directoryOrg(p) {
  if (p.org) return p.org;
  const dept = String(p.dept || "").trim();
  const title = String(p.title || "").trim();
  const role = String(p.role || "").trim();
  if (title && dept) return `${title}/${dept}`;
  // 조직도 부서 이름에 이미 '(학생)' 이 붙어 있다 (전기전자컴퓨터공학과(학생)). 신분을 또 붙이지 않는다.
  if (dept.includes("(") || !role || role === "특별계정") return dept || title;
  return `${dept || title}(${role})`;
}

/** 주고받은 메일의 보낸이·받는이 전부에서 연락처를 모은다 (보낸편지함만 보던 것보다 넓게) */
function mailContacts() {
  const emails = state.emails.emails || [];
  const key = `${state.emails.updatedAt}|${emails.length}|${(state.emails.contacts || []).length}|${state.courseStaffSig || ""}|${I18N.lang}`;
  if (mailContacts.key === key) return mailContacts.list;
  const byEmail = new Map();
  const put = (display, addr, count = 1) => {
    const email = String(addr || "").trim().toLowerCase();
    if (!email.includes("@")) return;
    let { name, org } = splitAffiliation(display);
    // 웹메일이 이름 자리에 주소를 적어 보낸 메일이 있다('dgun_189@dgist.ac.kr/기초학부 (학생)').
    // 그걸 이름으로 쓰면 자동완성이 '주소/소속 <주소>' 로 나온다. 이름이 아닌 것으로 친다.
    if (String(name || "").includes("@")) name = "";
    const had = byEmail.get(email);
    if (!had) {
      byEmail.set(email, { email, name: name || "", org, count });
      return;
    }
    had.count += count;
    if (!had.name && name) had.name = name;
    if (!had.org && org) had.org = org; // 소속이 적힌 이름을 한 번이라도 보면 그걸 쓴다
  };
  (state.emails.contacts || []).forEach((c) => put(c.name, c.email, c.count || 1));
  // LMS 교수·조교: 메일을 주고받은 적 없어도 찾히게 넣고, '일반물리Ⅱ 조교' 꼬리표를 단다
  staffContacts().forEach((s) => {
    put(s.name, s.email, 0);
    const had = byEmail.get(s.email.toLowerCase());
    if (had) {
      had.tag = had.tag ? `${had.tag}, ${s.tag}` : s.tag;
      had.alias = [had.alias, s.alias].filter(Boolean).join(" ");
    }
  });
  emails.forEach((m) => {
    put(m.fromName, m.fromEmail, 0);
    put(m.toName, m.toEmail, 0);
  });
  mailContacts.key = key;
  mailContacts.list = [...byEmail.values()];
  return mailContacts.list;
}

function contactMatches(term) {
  const q = term.trim();
  if (!q) return [];
  const hits = mailContacts()
    .map((c) => {
      // '물리 조교' 처럼 띄어 쓴 여러 낱말은 낱말마다 어딘가에 맞아야 한다
      const words = q.split(/\s+/).filter(Boolean);
      const fields = [c.name, c.email.split("@")[0], c.org, c.email, c.tag, c.alias];
      const s = words.length > 1
        ? Math.min(...words.map((w) => matchScore(w, ...fields)))
        : matchScore(q, ...fields);
      return { c, s };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || (b.c.count || 0) - (a.c.count || 0))
    .map((x) => x.c);
  // dgist 도메인 자동 완성 후보 추가 (아이디만 입력 시)
  if (/^[a-z0-9._-]+$/i.test(term.trim()) && !term.includes("@")) {
    const guess = `${term.trim()}@dgist.ac.kr`;
    if (!hits.some((c) => c.email === guess)) {
      hits.push({ email: guess, name: "DGIST 메일", count: 0, guess: true });
    }
  }
  return hits.slice(0, 6);
}

/* ===== 받는 사람 칩 =====
   웹메일처럼 한 사람씩 '"이름/소속" <주소>' 칩으로 보인다. (예전엔 쉼표로 이은 글자 한 줄)
   서버로 보내는 값은 숨긴 원래 입력칸(name=to/cc/bcc)에 '"이름" <주소>, …' 로 둔다.
   코드 여러 곳(답장·주소찾기·임시저장 불러오기)이 그 칸의 value 를 직접 넣으므로,
   value 를 넣는 순간 칩을 다시 그리도록 그 칸의 value 를 가로챈다. */
const RCPT = { to: [], cc: [], bcc: [] };
const RCPT_EMAIL = /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]+$/;

/** '"이름" <a@b>, c@d; 이름2 <e@f>' → [{name, email}] (따옴표·꺾쇠 안의 쉼표는 자르지 않는다) */
function parseRecipients(text) {
  const parts = [];
  let cur = "";
  let quote = false;
  let angle = false;
  for (const ch of String(text || "")) {
    if (ch === '"') quote = !quote;
    else if (ch === "<") angle = true;
    else if (ch === ">") angle = false;
    if ((ch === "," || ch === ";") && !quote && !angle) {
      parts.push(cur);
      cur = "";
    } else cur += ch;
  }
  parts.push(cur);
  const out = [];
  for (const raw of parts) {
    const s = raw.trim();
    if (!s) continue;
    const m = s.match(/^"?([^"<]*?)"?\s*<([^>]+)>$/);
    const email = (m ? m[2] : s).trim();
    const name = (m ? m[1] : "").trim();
    if (email.includes("@")) out.push({ name, email });
  }
  return out;
}

function formatRecipient(r) {
  const name = String(r.name || "").replace(/"/g, "'");
  return name ? `"${name}" <${r.email}>` : r.email;
}

function setupRecipientChips() {
  const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
  document.querySelectorAll('#composeForm input[data-ac="1"]').forEach((input) => {
    const field = input.name;
    const body = input.closest(".cfield-body");
    if (!body || input.dataset.chips) return;
    input.dataset.chips = "1";
    const placeholder = input.placeholder;
    input.type = "hidden";
    input.removeAttribute("required");

    const box = document.createElement("div");
    box.className = "rcpt-box";
    box.innerHTML = `<span class="rcpt-chips"></span><input class="rcpt-entry" type="text" autocomplete="off"
      data-field="${field}" aria-label="${escapeHtml(placeholder)}" placeholder="${escapeHtml(placeholder.replace("여러 명은 쉼표로", "이름 또는 주소"))}" />`;
    body.insertBefore(box, body.firstChild);
    const chips = box.querySelector(".rcpt-chips");
    const entry = box.querySelector(".rcpt-entry");

    let syncing = false;
    const write = () => {
      syncing = true;
      desc.set.call(input, RCPT[field].map(formatRecipient).join(", "));
      syncing = false;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    };
    const paint = () => {
      chips.innerHTML = RCPT[field]
        .map(
          (r, i) => `<span class="rcpt-chip${RCPT_EMAIL.test(r.email) ? "" : " bad"}" data-i="${i}" title="${escapeHtml(r.email)}">
            ${r.name ? `<b>${escapeHtml(r.name)}</b>` : ""}<span class="rcpt-mail">${escapeHtml(r.name ? `<${r.email}>` : r.email)}</span>
            <button type="button" class="rcpt-x" data-x="${i}" aria-label="${escapeHtml(r.email)} 빼기">${iconHtml("x")}</button>
          </span>`,
        )
        .join("");
      entry.placeholder = RCPT[field].length ? "" : placeholder.replace("여러 명은 쉼표로", "이름 또는 주소");
    };
    // 코드에서 value 를 넣으면 칩을 다시 만든다
    Object.defineProperty(input, "value", {
      configurable: true,
      get() {
        return desc.get.call(input);
      },
      set(v) {
        desc.set.call(input, v);
        if (syncing) return;
        RCPT[field] = parseRecipients(v);
        paint();
      },
    });

    const add = (list) => {
      const have = new Set(RCPT[field].map((r) => r.email.toLowerCase()));
      list.forEach((r) => {
        if (String(r.name || "").includes("@")) r.name = "";
        if (!have.has(r.email.toLowerCase())) {
          RCPT[field].push(r);
          have.add(r.email.toLowerCase());
          if (!r.name) fillNameFromDirectory(r);
        }
      });
      write();
      paint();
    };
    // 주소만 쳐서 만든 칩도 조직도에 있으면 '이름/소속' 을 붙인다 (자동완성으로 고른 것과 같은 모양)
    const fillNameFromDirectory = (r) => {
      lookupDirectory(r.email)
        .then((people) => {
          const p = (people || []).find((x) => String(x.email || "").toLowerCase() === r.email.toLowerCase());
          if (!p?.name || !RCPT[field].includes(r) || r.name) return;
          const org = directoryOrg(p);
          r.name = org ? `${p.name}/${org}` : p.name;
          write();
          paint();
        })
        .catch(() => {});
    };
    // 입력칸에 친 글자가 주소 모양이면 칩으로 만든다
    const commit = () => {
      const list = parseRecipients(entry.value);
      if (!list.length) return false;
      add(list);
      entry.value = "";
      return true;
    };
    box.rcptAdd = (r) => add([r]);

    box.addEventListener("click", (event) => {
      const x = event.target.closest("[data-x]");
      if (x) {
        RCPT[field].splice(Number(x.dataset.x), 1);
        write();
        paint();
        entry.focus();
        return;
      }
      if (!event.target.closest(".rcpt-chip")) entry.focus();
    });
    // 칩을 두 번 누르면 고칠 수 있게 글자로 되돌린다
    box.addEventListener("dblclick", (event) => {
      const chip = event.target.closest(".rcpt-chip");
      if (!chip) return;
      const [r] = RCPT[field].splice(Number(chip.dataset.i), 1);
      write();
      paint();
      entry.value = formatRecipient(r);
      entry.focus();
    });
    entry.addEventListener("keydown", (event) => {
      const menuOpen = !document.getElementById(`ac-${field}`)?.hidden;
      if ((event.key === "," || event.key === ";") && commit()) event.preventDefault();
      else if ((event.key === "Enter" || event.key === "Tab") && !menuOpen && entry.value.trim()) {
        if (commit()) event.preventDefault();
      } else if (event.key === "Backspace" && !entry.value && RCPT[field].length) {
        RCPT[field].pop();
        write();
        paint();
      }
    });
    entry.addEventListener("paste", () => window.setTimeout(() => {
      if (/[,;]/.test(entry.value) || RCPT_EMAIL.test(entry.value.trim())) commit();
    }, 0));
    entry.addEventListener("blur", () => window.setTimeout(() => {
      if (document.activeElement !== entry) commit();
    }, 200));
    paint();
  });
}

function setupAutocomplete() {
  setupRecipientChips();
  document.querySelectorAll("#composeForm .rcpt-entry").forEach((input) => {
    const field = input.dataset.field;
    const menu = document.getElementById(`ac-${field}`);
    const box = input.closest(".rcpt-box");
    if (!menu || !box) return;
    let active = -1;

    const closeMenu = () => {
      menu.hidden = true;
      menu.innerHTML = "";
      active = -1;
    };

    const applyChoice = (item) => {
      box.rcptAdd({ name: item.dataset.name || "", email: item.dataset.email });
      input.value = "";
      closeMenu();
      input.focus();
    };

    const paint = (matches) => {
      if (!matches.length) return closeMenu();
      const q = input.value.trim();
      menu.innerHTML = matches
        .map((c, i) => {
          const org = c.guess ? "" : directoryOrg(c);
          const label = `${c.name || ""}${org ? `/${org}` : ""}`;
          const tag = c.tag || staffTagFor(c.email);
          return `
          <button type="button" class="ac-item ${i === active ? "active" : ""}" data-email="${escapeHtml(c.email)}"
            data-name="${escapeHtml(c.name ? label : "")}" title="${escapeHtml(`${label} <${c.email}>${tag ? ` · ${tag}` : ""}`)}">
            <span class="ac-name">${acMark(c.name || c.email, q)}</span>${
              org ? `<span class="ac-org">/${acMark(org, q)}</span>` : ""
            }${tag ? `<span class="ac-tag">${acMark(tag, q)}</span>` : ""}<span class="ac-email">&lt;${acMark(c.email, q)}&gt;${c.guess ? '<span class="ac-guess"> · 추정</span>' : ""}</span>
          </button>`;
        })
        .join("");
      menu.hidden = false;
    };

    const showMenu = () => {
      const text = input.value.trim();
      if (!text) return closeMenu();
      // 주고받은 연락처를 먼저 그려서 바로 반응하게 하고, 조직도 결과가 오면 이어 붙인다.
      paint(contactMatches(text));
      lookupDirectory(text).then((people) => {
        if (input.value.trim() !== text) return; // 입력이 그새 바뀌었으면 버린다
        const dirEmails = new Set(people.map((p) => p.email));
        // 조직도에 실제 이름이 있으면 '추정' 항목은 버린다
        const local = contactMatches(text).filter((c) => !(c.guess && dirEmails.has(c.email)));
        const dirByEmail = new Map(people.map((p) => [p.email, p]));
        // 조직도에 있는 사람이면 이름·소속은 늘 조직도 것을 쓴다.
        // (이름으로 찾든 주소로 찾든 '홍길동/기초학부(학생)' 처럼 같은 모양으로 나오게)
        local.forEach((c) => {
          const p = dirByEmail.get(c.email);
          if (p) Object.assign(c, { name: p.name || c.name, org: directoryOrg(p), guess: false });
        });
        const seen = new Set(local.map((c) => c.email));
        paint([...local, ...people.filter((p) => !seen.has(p.email))].slice(0, 8));
      });
    };

    input.addEventListener("input", () => {
      active = -1;
      showMenu();
    });
    input.addEventListener("keydown", (event) => {
      const items = [...menu.querySelectorAll(".ac-item")];
      if (menu.hidden || !items.length) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        active = (active + 1) % items.length;
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        active = (active - 1 + items.length) % items.length;
      } else if ((event.key === "Enter" || event.key === "Tab") && (active >= 0 || items.length === 1)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        applyChoice(items[Math.max(active, 0)]);
        return;
      } else if (event.key === "Escape") {
        closeMenu();
        return;
      } else {
        return;
      }
      items.forEach((it, i) => it.classList.toggle("active", i === active));
    });
    menu.addEventListener("mousedown", (event) => {
      const item = event.target.closest(".ac-item");
      if (item) {
        event.preventDefault();
        applyChoice(item);
      }
    });
    input.addEventListener("blur", () => setTimeout(closeMenu, 150));
  });
}

/* ===== 메일 쓰기: 서식 편집 · 주소찾기 · 임시저장 =====
   웹메일 작성 화면과 같은 구성으로 맞췄다.
   보안메일·편지지·표편집은 우리 쪽에서 보낼 방법이 없어 넣지 않았다. */

/** 지금 본문이 서식(HTML) 모드인지 */
function composeIsRich() {
  return !$("#htmlModeToggle")?.checked;
}

/** 서식 칸의 HTML. 메일 쓰기 흐름의 회색 글씨([data-ghost])는 미리보기라 저장·보내기에 절대 섞이지 않게 뗀다 */
function richHtml(rich) {
  const html = rich?.innerHTML || "";
  return html.includes("data-ghost") ? html.replace(/<span[^>]*data-ghost[^>]*>[\s\S]*?<\/span>/g, "") : html;
}

/** 어느 칸에 쓰든 본문 내용을 가져온다 */
function composeBody() {
  const rich = $("#composeRich");
  const area = document.querySelector('#composeForm [name="body"]');
  return composeIsRich() ? richHtml(rich) : area?.value || "";
}

function setComposeBody(html) {
  const rich = $("#composeRich");
  const area = document.querySelector('#composeForm [name="body"]');
  if (rich) rich.innerHTML = html || "";
  if (area) area.value = html || "";
}

/* --- 서식 도구 --- */
function bindRichToolbar() {
  const rich = $("#composeRich");
  const area = document.querySelector('#composeForm [name="body"]');
  const toolbar = $("#rtToolbar");
  if (!rich || !toolbar) return;

  const run = (cmd, arg) => {
    rich.focus();
    try {
      document.execCommand(cmd, false, arg);
    } catch (error) {
      /* 브라우저가 막으면 조용히 넘어간다 */
    }
  };

  toolbar.addEventListener("click", async (event) => {
    const btn = event.target.closest("[data-cmd]");
    if (!btn) return;
    event.preventDefault();
    const cmd = btn.dataset.cmd;
    if (cmd === "createLink" || cmd === "insertImage") {
      // 입력 창이 뜨면 본문에서 고른 글자가 풀린다. 기억했다가 되살린 뒤 적용한다.
      const sel = window.getSelection();
      const range = sel && sel.rangeCount && rich.contains(sel.anchorNode) ? sel.getRangeAt(0).cloneRange() : null;
      const url = await uiPrompt(
        cmd === "createLink" ? "연결할 주소를 넣어 주세요." : "넣을 사진의 주소(URL)를 넣어 주세요.",
        "https://",
        { title: cmd === "createLink" ? "링크 넣기" : "사진 넣기", icon: cmd === "createLink" ? "forward" : "file", ok: "넣기" },
      );
      if (!url || url === "https://") return;
      rich.focus();
      if (range) {
        const s = window.getSelection();
        s.removeAllRanges();
        s.addRange(range);
      }
      run(cmd, url);
      return;
    }
    run(cmd, btn.dataset.arg);
  });

  $("#rtFontSize")?.addEventListener("change", (event) => run("fontSize", event.target.value));
  $("#rtColor")?.addEventListener("input", (event) => run("foreColor", event.target.value));

  // 서명 넣기 (설정의 학교 이메일 기준)
  $("#insertSignature")?.addEventListener("click", () => {
    const me = state.config?.schoolEmail || "";
    const sign = `<br><br>--<br>${escapeHtml(state.config?.senderName || me.split("@")[0] || "")}<br>${escapeHtml(me)}`;
    if (composeIsRich()) {
      rich.focus();
      run("insertHTML", sign);
    } else if (area) {
      area.value += `\n\n--\n${me}`;
    }
  });

  // HTML 모드 전환: 두 칸의 내용을 서로 옮겨 준다
  $("#htmlModeToggle")?.addEventListener("change", (event) => {
    const html = event.target.checked;
    if (html) {
      if (area) area.value = richHtml(rich);
    } else {
      rich.innerHTML = area?.value || "";
    }
    rich.hidden = html;
    if (area) area.hidden = !html;
    toolbar.classList.toggle("disabled", html);
  });

  // 서식 모드에서 타이핑하면 textarea에도 반영 (전송은 textarea를 안 봐도 되지만 안전하게)
  rich.addEventListener("input", () => {
    if (area && composeIsRich()) area.value = richHtml(rich);
  });
}

/* --- 주소찾기 --- */
/** 주소찾기에서 고른 사람 → '"이름/소속" <주소>' (웹메일 받는 사람 칩과 같은 모양) */
function pickerRecipient(p) {
  const org = p.dept ? shortText(p.dept, 30) : "";
  return formatRecipient({ name: p.name ? `${p.name}${org ? `/${org}` : ""}` : "", email: p.email });
}

function openAddressPicker(targetName) {
  const dialog = $("#addressPicker");
  if (!dialog) return;
  dialog.dataset.target = targetName;
  $("#addressPickerInput").value = "";
  $("#addressPickerList").innerHTML =
    '<p class="picker-empty">이름 · 이메일 · 부서로 찾아보세요.</p>';
  dialog.showModal();
  $("#addressPickerInput").focus();
}

function bindAddressPicker() {
  const dialog = $("#addressPicker");
  if (!dialog) return;
  const list = $("#addressPickerList");
  const chosen = new Set();

  const draw = (people) => {
    list.innerHTML = people.length
      ? people
          .map(
            (p) => `
        <label class="picker-row">
          <input type="checkbox" value="${escapeHtml(pickerRecipient(p))}" ${chosen.has(pickerRecipient(p)) ? "checked" : ""} />
          <span class="picker-main">
            <strong>${escapeHtml(p.name || p.email)}</strong>
            <span>${escapeHtml(p.email)}${p.dept ? " · " + escapeHtml(shortText(p.dept, 22)) : ""}</span>
          </span>
          ${p.role ? `<em class="picker-role">${escapeHtml(p.role)}</em>` : ""}
        </label>`,
          )
          .join("")
      : '<p class="picker-empty">찾는 사람이 없습니다.</p>';
  };

  let timer = null;
  $("#addressPickerInput")?.addEventListener("input", (event) => {
    const q = event.target.value.trim();
    window.clearTimeout(timer);
    if (q.length < 2) {
      list.innerHTML = '<p class="picker-empty">두 글자 이상 넣어 주세요.</p>';
      return;
    }
    timer = window.setTimeout(async () => {
      try {
        const res = await api(`/api/directory?q=${encodeURIComponent(q)}&limit=40`);
        draw(res.results || []);
      } catch (error) {
        list.innerHTML = '<p class="picker-empty">조직도를 불러오지 못했습니다.</p>';
      }
    }, 200);
  });

  list?.addEventListener("change", (event) => {
    const box = event.target.closest("input[type=checkbox]");
    if (!box) return;
    if (box.checked) chosen.add(box.value);
    else chosen.delete(box.value);
    $("#pickerCount").textContent = chosen.size ? `${chosen.size}명 선택` : "";
  });

  $("#addressPickerAdd")?.addEventListener("click", () => {
    const target = dialog.dataset.target || "to";
    const input = document.querySelector(`#composeForm [name="${target}"]`);
    if (input && chosen.size) {
      const before = input.value.trim();
      const joined = [...chosen].join(", ");
      input.value = before ? `${before.replace(/,\s*$/, "")}, ${joined}, ` : `${joined}, `;
    }
    chosen.clear();
    $("#pickerCount").textContent = "";
    dialog.close();
  });

  $("#addressPickerClose")?.addEventListener("click", () => {
    chosen.clear();
    $("#pickerCount").textContent = "";
    dialog.close();
  });

  // 각 줄의 '주소찾기' 버튼
  document.querySelectorAll("[data-find]").forEach((btn) => {
    btn.addEventListener("click", () => openAddressPicker(btn.dataset.find));
  });
}

/* --- 임시저장 · 미리보기 --- */
const DRAFT_KEY = DEMO_ON ? "autosaver-demo-mail-draft" : "autosaver-mail-draft";

function collectDraft() {
  const form = $("#composeForm");
  if (!form) return null;
  return {
    to: form.elements.to?.value || "",
    cc: form.elements.cc?.value || "",
    bcc: form.elements.bcc?.value || "",
    subject: form.elements.subject?.value || "",
    body: composeBody(),
    // 서식 모드는 innerHTML, HTML 모드는 직접 쓴 HTML.
    // 어느 쪽이든 본문은 HTML이다. (예전에 여기가 뒤집혀 미리보기에 태그가 그대로 보였다)
    html: true,
    savedAt: new Date().toISOString(),
  };
}

/* ===== 메일 자동 저장 =====
   쓰는 동안 잠깐 멈추면 이 컴퓨터에(1.5초), 조금 더 지나면 서버 '임시 보관함'에(15초) 저장한다.
   - 서버에는 같은 메일을 번호(draftId)로 묶어 넣어, 예전 판은 서버가 지운 표시로 정리한다.
   - 내용이 그대로면 서버에 다시 넣지 않는다(서명 비교).
   - 자동 저장에는 첨부가 3MB 를 넘으면 첨부를 빼고 넣는다(15초마다 수 MB 를 올리지 않게).
     '임시저장' 단추는 첨부까지 모두 넣는다.
   - 앱을 껐다 켜면 '메일 쓰기' 를 열 때 이어서 쓸지 묻는다(restoreDraftIfAny). */
const AUTOSAVE_LOCAL_MS = 1500;
const AUTOSAVE_SERVER_MS = 15000;
const AUTOSAVE_ATTACH_MAX = 3 * 1024 * 1024;
const autosave = { local: 0, server: 0, lastSig: "", busy: false, pending: false, dirty: false };

function ensureDraftId() {
  const form = $("#composeForm");
  if (!form.dataset.draftId) {
    form.dataset.draftId = `bp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
  return form.dataset.draftId;
}

function draftSignature(d) {
  return JSON.stringify([d.to, d.cc, d.bcc, d.subject, d.body, (state.attachments || []).map((a) => `${a.filename}:${a.size}`)]);
}

function draftNote(text) {
  const note = $("#draftNote");
  if (note) note.textContent = text;
}

function hhmm(date = new Date()) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function saveLocalDraft() {
  if (!composeHasContent()) return;
  const d = collectDraft();
  if (!d) return;
  d.draftId = ensureDraftId();
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  } catch (error) {
    /* 저장소가 막혀 있으면 서버 쪽만 쓴다 */
  }
}

async function saveDraftToServer({ auto }) {
  if (!composeHasContent()) return;
  const d = collectDraft();
  if (!d) return;
  const sig = draftSignature(d);
  if (auto && sig === autosave.lastSig) return;
  if (autosave.busy) {
    autosave.pending = true; // 저장 중에 또 바뀌면 끝난 뒤 한 번 더
    return;
  }
  autosave.busy = true;
  saveLocalDraft();
  const atts = state.attachments || [];
  const attBytes = atts.reduce((n, a) => n + Number(a.size || 0), 0);
  const withAtts = !auto || attBytes <= AUTOSAVE_ATTACH_MAX;
  draftNote(auto ? "자동 저장 중…" : "저장하는 중…");
  try {
    await api("/api/mail/save-draft", {
      method: "POST",
      body: JSON.stringify({
        ...d,
        draftId: ensureDraftId(),
        attachments: withAtts ? atts.map((a) => ({ filename: a.filename, content: a.content })) : [],
      }),
    });
    autosave.lastSig = sig;
    autosave.dirty = false;
    draftNote(
      `${auto ? "자동 저장됨" : "임시 보관함에 저장됨"} ${hhmm()}${withAtts || !atts.length ? "" : " · 첨부 제외"}`,
    );
  } catch (error) {
    // 자동 저장 실패는 조용히 알리고(이 컴퓨터에는 남아 있다), 직접 누른 저장만 알림을 띄운다
    draftNote(auto ? "서버 자동 저장 실패 · 이 컴퓨터에는 저장됨" : "");
    if (!auto) showToast(error.message);
  } finally {
    autosave.busy = false;
    if (autosave.pending) {
      autosave.pending = false;
      scheduleAutosave();
    }
  }
}

function scheduleAutosave() {
  if (state.mailPane !== "compose" || !composeHasContent()) return;
  autosave.dirty = true;
  window.clearTimeout(autosave.local);
  window.clearTimeout(autosave.server);
  autosave.local = window.setTimeout(saveLocalDraft, AUTOSAVE_LOCAL_MS);
  autosave.server = window.setTimeout(() => saveDraftToServer({ auto: true }), AUTOSAVE_SERVER_MS);
}

/** 보냈거나 버렸을 때: 예약된 저장을 멈추고 이 컴퓨터 저장본을 지운다 */
function clearAutosave() {
  window.clearTimeout(autosave.local);
  window.clearTimeout(autosave.server);
  autosave.lastSig = "";
  autosave.pending = false;
  autosave.dirty = false;
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (error) {
    /* 무시 */
  }
  draftNote("");
}

function bindAutosave() {
  const form = $("#composeForm");
  if (!form) return;
  // 제목·본문·받는 사람 칩(숨은 칸에 input 을 쏜다)·HTML 칸 모두 여기로 올라온다
  form.addEventListener("input", scheduleAutosave);
  // 앱을 닫을 때 서버에는 못 넣어도 이 컴퓨터에는 남긴다
  window.addEventListener("beforeunload", () => {
    if (state.mailPane === "compose") saveLocalDraft();
  });
}

function bindComposeExtras() {
  // 임시저장 단추: 첨부까지 모두 지금 서버 임시 보관함에 (자동 저장은 아래 scheduleAutosave)
  $("#saveDraftButton")?.addEventListener("click", async (event) => {
    const btn = event.currentTarget;
    btn.disabled = true;
    try {
      await saveDraftToServer({ auto: false });
    } finally {
      btn.disabled = false;
    }
  });

  $("#previewMailButton")?.addEventListener("click", () => {
    const draft = collectDraft();
    if (!draft) return;
    const box = $("#mailPreview");
    if (!box) return;
    $("#previewSubject").textContent = draft.subject || "(제목 없음)";
    $("#previewTo").textContent = [draft.to, draft.cc && `참조 ${draft.cc}`].filter(Boolean).join(" · ");
    // 미리보기는 그대로 보여 줘야 하므로 HTML을 넣는다.
    // 사용자가 방금 자기 손으로 쓴 내용이라 외부에서 온 값이 아니다.
    $("#previewBody").innerHTML = draft.html ? draft.body : escapeHtml(draft.body).replace(/\n/g, "<br>");
    box.showModal();
  });
  $("#previewClose")?.addEventListener("click", () => $("#mailPreview")?.close());

  // 첨부 전체 삭제
  $("#attachClearButton")?.addEventListener("click", () => {
    state.attachments = [];
    renderAttachments();
  });
}

/** 임시저장한 내용이 있으면 물어보고 되살린다 */
async function restoreDraftIfAny() {
  let draft = null;
  try {
    draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
  } catch (error) {
    draft = null;
  }
  if (!draft || !(draft.to || draft.subject || draft.body)) return false;
  const when = draft.savedAt ? formatEmailDate(draft.savedAt) : "";
  if (!(await uiConfirm(`쓰다 만 메일이 있어요${when ? ` (${when} 자동 저장)` : ""}. 이어서 쓸까요?`, { title: "쓰던 메일", ok: "이어서 쓰기", cancel: "새로 쓰기", icon: "edit" }))) {
    // 새로 쓰기: 이 컴퓨터 저장본만 지운다. 서버 임시 보관함 것은 그대로 둔다(거기서 열 수 있다).
    localStorage.removeItem(DRAFT_KEY);
    return false;
  }
  const form = $("#composeForm");
  // 같은 번호로 이어서 저장해야 서버 임시 보관함에 같은 메일이 여러 벌 생기지 않는다
  if (draft.draftId) form.dataset.draftId = draft.draftId;
  if (form.elements.to) form.elements.to.value = draft.to;
  if (form.elements.cc) form.elements.cc.value = draft.cc;
  if (form.elements.bcc) form.elements.bcc.value = draft.bcc;
  if (form.elements.subject) form.elements.subject.value = draft.subject;
  const toggle = $("#htmlModeToggle");
  if (toggle) {
    toggle.checked = Boolean(draft.html);
    toggle.dispatchEvent(new Event("change"));
  }
  setComposeBody(draft.body);
  resetMailFlow();
  autosave.lastSig = draftSignature(collectDraft());
  draftNote(when ? `${when}에 저장한 내용` : "");
  return true;
}


/* ===== 읽기창에서 쓰는 동작들 =====
   삼성 이메일의 아래 줄(답장·전체답장·전달·삭제)과 ⋮ 메뉴를 같은 구성으로 맞췄다. */

/* 지금 보이는 목록에서 이전/다음 메일로 옮긴다 */
function stepMail(delta) {
  const mail = state.replyContext;
  if (!mail) return;
  const list = state.visibleMails || [];
  const at = list.findIndex((m) => m.id === mail.id);
  if (at < 0) return;
  const next = list[at + delta];
  if (!next) {
    showToast(delta > 0 ? "마지막 메일입니다." : "첫 메일입니다.");
    return;
  }
  openEmailDetail(next);
}

/* 별표를 서버 플래그로 붙인다. 이 앱에만 기억하면 폰에서는 안 보인다. */
async function toggleStarOnServer(mail) {
  if (!mail) return;
  const next = !mail.starred;
  mail.starred = next; // 눌린 느낌이 바로 나게 먼저 바꾼다
  renderEmails();
  try {
    await api("/api/mail/star", {
      method: "POST",
      body: JSON.stringify({ uid: mail.uid, folder: mail.folder, starred: next }),
    });
    showToast(next ? "별표를 붙였습니다." : "별표를 뗐습니다.");
  } catch (error) {
    mail.starred = !next; // 실패하면 되돌린다
    renderEmails();
    showToast(error.message);
  }
}

/* 전달: 원문을 인용해 새 메일로 */
async function forwardCurrentEmail() {
  const mail = state.replyContext;
  if (!mail) return;
  await ensureMailBody(mail);
  const subject = /^\s*fwd?\s*:/i.test(mail.subject) ? mail.subject : `Fwd: ${mail.subject}`;
  const when = mail.date ? formatEmailDate(mail.date) : "";
  const header =
    `\n\n---------- 전달된 메일 ----------\n` +
    `보낸사람: ${mail.fromName || ""} <${mail.fromEmail || ""}>\n` +
    `날짜: ${when}\n제목: ${mail.subject || ""}\n\n`;
  openCompose({ to: "", subject, body: header + (mail.body || mail.snippet || "") });
}

/* ⋮ 메뉴 항목 처리 */
async function runMailMore(action, mail) {
  if (!mail) return;
  switch (action) {
    // '읽지 않음으로 표시' 는 위쪽 '읽음/안읽음' 버튼과 같은 일이라 메뉴에서 뺐다

    case "print": {
      // 화면에 보이는 그대로 인쇄한다
      await ensureMailBody(mail);
      // 맥 앱 창은 새 창을 열지 못한다 → 숨은 틀에 그려서 인쇄한다
      let frame = null;
      const win = IN_MAC_APP()
        ? ((frame = Object.assign(document.createElement("iframe"), { style: "position:fixed;width:0;height:0;border:0" })),
          document.body.appendChild(frame),
          frame.contentWindow)
        : window.open("", "_blank");
      if (!win) return showToast("팝업이 막혀 인쇄창을 열지 못했습니다.");
      const safe = mail.bodyHtml
        ? mail.bodyHtml
        : `<pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(mail.body || "")}</pre>`;
      win.document.write(
        `<!doctype html><meta charset="utf-8"><title>${escapeHtml(mail.subject || "메일")}</title>` +
          `<body style="font-family:system-ui,'Malgun Gothic','Apple SD Gothic Neo',sans-serif;padding:24px">` +
          `<h2>${escapeHtml(mail.subject || "")}</h2>` +
          `<p style="color:#666">${escapeHtml(mail.fromName || "")} &lt;${escapeHtml(mail.fromEmail || "")}&gt; · ${escapeHtml(mail.date || "")}</p><hr>${safe}</body>`,
      );
      win.document.close();
      win.focus();
      win.print();
      if (frame) window.setTimeout(() => frame.remove(), 60000);
      break;
    }

    case "eml":
      // 서버에서 원본을 받아 .eml 로 저장
      openOutside(`/api/mail/eml?uid=${encodeURIComponent(mail.uid)}&folder=${encodeURIComponent(mail.folder)}`);
      break;

    case "move": {
      const folders = await loadMailFolderChoices();
      if (!folders.length) return showToast("옮길 폴더를 찾지 못했습니다.");
      const idx = await uiChoose("어느 편지함으로 옮길까요?", folders.map((f) => ({ label: f.name, icon: "folder" })));
      if (idx === null) return;
      try {
        await api("/api/mail/move", {
          method: "POST",
          body: JSON.stringify({ uid: mail.uid, folder: mail.folder, target: folders[idx].raw }),
        });
        showToast(`'${folders[idx].name}'(으)로 옮겼습니다.`);
        showMailPane("list");
        await refreshAll();
      } catch (error) {
        showToast(error.message);
      }
      break;
    }

    case "event": {
      // 메일 제목을 그대로 일정으로 (날짜는 메일 받은 날)
      const day = (mail.date || "").slice(0, 10);
      try {
        await api("/api/my-events/save", {
          method: "POST",
          body: JSON.stringify({ title: mail.subject || "메일 일정", date: day, memo: mail.snippet || "" }),
        });
        showToast("일정에 추가했습니다.");
        await refreshAll();
      } catch (error) {
        showToast(error.message);
      }
      break;
    }

    case "snooze": {
      const choice = await uiChoose(
        "언제 다시 알려 드릴까요?",
        [
          { label: "30분 뒤", icon: "clock" },
          { label: "1시간 뒤", icon: "clock" },
          { label: "3시간 뒤", icon: "clock" },
          { label: "내일 이맘때", icon: "clock" },
        ],
        { message: "앱이 켜져 있는 동안만 알려 드려요." },
      );
      if (choice === null) return;
      const mins = [30, 60, 180, 1440][choice];
      // 앱이 켜져 있는 동안만 동작한다 (브라우저 타이머)
      showToast(`${mins}분 뒤에 다시 알려드릴게요.`);
      window.setTimeout(() => {
        showToast(`[다시 알림] ${shortText(mail.subject || "메일", 30)}`);
      }, mins * 60 * 1000);
      break;
    }

    case "translate":
      await translateCurrentMail(mail);
      break;

    case "reminder":
      await composeReminder(mail.id);
      break;
  }
}

/* 메일을 한국어로 번역해 본문 위에 붙인다.
   번역은 서버가 맡는다(로컬 Ollama 우선, 없으면 Gemini 키).
   10초쯤 걸릴 수 있어 진행 표시를 띄운다. */
async function translateCurrentMail(mail) {
  await ensureMailBody(mail);
  const box = $("#readSummary");
  if (box) {
    box.hidden = false;
    box.textContent = "한국어로 옮기는 중… (처음엔 시간이 걸립니다)";
  }
  try {
    const res = await api("/api/mail/translate", {
      method: "POST",
      body: JSON.stringify({ id: mail.id }),
    });
    if (box) box.textContent = res.text || "(번역 결과가 비었습니다)";
    if (res.engine) showToast(`번역 완료 (${res.engine})`);
  } catch (error) {
    if (box) box.textContent = "";
    if (box) box.hidden = true;
    showToast(error.message);
  }
}

/* 옮길 수 있는 폴더 목록 (한 번 받아 두고 재사용) */
async function loadMailFolderChoices() {
  if (state.mailFolderChoices) return state.mailFolderChoices;
  try {
    const res = await api("/api/mail/folders");
    state.mailFolderChoices = (res.folders || []).filter((f) => f.raw);
  } catch (error) {
    state.mailFolderChoices = [];
  }
  return state.mailFolderChoices;
}

/* 리마인드 메일: 서버가 만든 초안을 작성창에 올린다 (보내기는 사용자가) */
async function composeReminder(id) {
  try {
    const res = await api("/api/mail/reminder", {
      method: "POST",
      body: JSON.stringify({ id }),
    });
    const draft = res.draft || {};
    openCompose({ to: draft.to, subject: draft.subject, body: draft.body });
    showToast("리마인드 초안을 띄웠습니다. 내용을 확인하고 보내세요.");
  } catch (error) {
    showToast(error.message);
  }
}

async function replyToCurrentEmail(all = false) {
  const mail = state.replyContext;
  if (!mail) return;
  // 목록에서 바로 답장하면 본문이 아직 안 와 있을 수 있다 (인용이 비면 곤란하다)
  await ensureMailBody(mail);
  const subject = /^\s*re\s*:/i.test(mail.subject) ? mail.subject : `Re: ${mail.subject}`;
  const when = mail.date ? formatEmailDate(mail.date) : "";
  const quoted = (mail.body || mail.snippet || "")
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
  const body = `\n\n----- 원본 메일 (${escapeHtml(mail.fromName || mail.fromEmail)}${when ? ", " + when : ""}) -----\n${quoted}`;

  // 전체 답장: 원래 받는 사람들도 참조에 넣는다. 단 내 주소는 뺀다.
  let cc = "";
  if (all) {
    const me = (state.config?.schoolEmail || "").toLowerCase();
    cc = String(mail.toEmail || "")
      .split(/[,;]+/)
      .map((a) => a.trim())
      .filter((a) => a && a.toLowerCase() !== me && a.toLowerCase() !== (mail.fromEmail || "").toLowerCase())
      .join(", ");
  }

  openCompose({
    to: mail.fromEmail,
    cc,
    subject,
    body,
    inReplyTo: mail.messageId || "",
    references: mail.messageId || "",
    title: all ? "전체 답장" : "답장",
  });
}

/* 왼쪽은 '메일함'만 둔다.
   관심메일·LMS공지는 폴더가 아니라 위쪽 분류 탭으로 옮겼다. (Gmail식) */
// 메일을 받아 줄 수 있는 폴더 (전체 메일처럼 '진짜 폴더가 아닌 것' 은 뺀다)
const MAIL_DROP_KEYS = new Set(["inbox", "starred", "promo", "trash"]);

const MAIL_FOLDERS = [
  { key: "inbox", label: "받은 편지함", icon: "mail" },
  { key: "starred", label: "중요", icon: "star" },
  { key: "sent", label: "보낸 편지함", icon: "send" },
  { key: "draft", label: "임시보관함", icon: "edit" },
  { key: "promo", label: "프로모션", icon: "folder" },
  { key: "trash", label: "휴지통", icon: "trash" },
  { key: "all", label: "전체 메일", icon: "list" },
];

/* 위쪽 분류 탭. 받은 편지함 안에서 갈라 본다.
   별표를 탭으로도 갈랐더니, 별을 누른 메일이 기본 탭에서 사라져 버렸다.
   지메일처럼 별표는 '중요' 폴더에만 모으고 받은 편지함에는 그대로 둔다. */
const MAIL_TABS = [
  { key: "primary", label: "기본", icon: "mail" },
  { key: "lms", label: "LMS·공지", icon: "book" },
];

/* 왼쪽 위 빠른 필터 (네이버의 안읽음/중요/첨부) */
const MAIL_QUICK = [
  { key: "unread", label: "안읽음", icon: "alert" },
  { key: "starred", label: "중요", icon: "sparkle" },
  { key: "attach", label: "첨부", icon: "paperclip" },
];

// 폴더별 메일 필터 (검색·카테고리칩과 별개)
function mailInFolder(mail, folder) {
  switch (folder) {
    case "inbox":
      return mail.folder === "inbox";
    case "sent":
      return mail.folder === "sent";
    case "promo":
      return mail.folder === "promo";
    case "unread":
      return mail.folder === "inbox" && mail.unread;
    case "starred":
      return isStarredMail(mail);
    case "lms":
      return isLmsMail(mail);
    case "draft":
      return mail.folder === "draft";
    case "trash":
      return mail.folder === "trash";
    case "all":
      // 지운 메일과 임시 보관 중인 글까지 '전체'에 섞으면 헷갈린다.
      // 지메일도 전체보관함에서 휴지통·스팸은 빼고 보여 준다.
      return mail.folder !== "trash" && mail.folder !== "spam" && mail.folder !== "draft";
    default:
      return true;
  }
}

/* ===== 분류 탭 =====
   받은 편지함을 기본 / 관심 메일 / LMS·공지로 가른다.
   Gmail 탭처럼 각 탭에 몇 통인지와 최근 제목을 같이 보여 준다. */
function isLmsMail(mail) {
  if (mail.category === "수업·LMS") return true;
  return /lms|blackboard|공지|학사|academic/i.test(
    `${mail.fromEmail} ${mail.fromName} ${mail.subject}`,
  );
}

/* ===== 별표 =====
   예전에는 점수(score)가 6점 넘으면 저절로 '중요'가 됐다. 내가 고른 것이
   아니라 예측이라 믿기 어려웠다. 이제는 눌러서 직접 찍는다.
   서버에 메일 깃발을 저장하는 자리가 없어 이 컴퓨터에 적어 둔다. */
const STAR_STORE = DEMO_ON ? "autosaver-demo-mail-stars" : "autosaver-mail-stars";

function loadStars() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STAR_STORE) || "[]"));
  } catch (error) {
    return new Set();
  }
}

function saveStars() {
  try {
    localStorage.setItem(STAR_STORE, JSON.stringify([...(state.mailStars || [])]));
  } catch (error) {
    /* 저장 못 해도 이번 실행에는 반영된다 */
  }
}

function isStarredMail(mail) {
  return (state.mailStars || new Set()).has(String(mail.id));
}

function toggleStar(id) {
  const key = String(id);
  const stars = state.mailStars || (state.mailStars = new Set());
  if (stars.has(key)) stars.delete(key);
  else stars.add(key);
  saveStars();
}

function mailInTab(mail, tab) {
  if (tab === "lms") return isLmsMail(mail);
  // 기본: LMS·공지로 빠지지 않은 나머지 (별표는 여기서 빼지 않는다)
  return !isLmsMail(mail);
}

function renderMailTabs(folderMails) {
  const wrap = $("#mailTabs");
  if (!wrap) return;
  // 받은 편지함에서만 탭으로 가른다
  const useTabs = state.emailFolder === "inbox";
  wrap.hidden = !useTabs;
  if (!useTabs) return;
  // 빠른 필터가 켜져 있으면 탭 구분은 잠시 쉰다
  wrap.classList.toggle("muted", Boolean(state.emailQuick || state.emailFilter));

  wrap.innerHTML = MAIL_TABS.map((tabDef) => {
    const mails = folderMails.filter((m) => mailInTab(m, tabDef.key));
    const unread = mails.filter((m) => m.unread).length;
    const latest = mails[0];
    return `
      <button type="button" role="tab" class="mail-tab ${state.emailTab === tabDef.key ? "active" : ""}"
              data-tab="${tabDef.key}" aria-selected="${state.emailTab === tabDef.key}">
        <span class="icon" data-icon="${tabDef.icon}"></span>
        <span class="mail-tab-main">
          <span class="mail-tab-title">
            ${escapeHtml(tabDef.label)}
            ${unread ? `<em class="mail-tab-badge">새 메일 ${unread}개</em>` : ""}
          </span>
          <span class="mail-tab-peek">${
            latest ? escapeHtml(shortText(`${latest.fromName || latest.fromEmail} — ${latest.subject}`, 46)) : "메일 없음"
          }</span>
        </span>
      </button>`;
  }).join("");
  installIcons(wrap);
}

function renderMailQuick(emails) {
  const wrap = $("#mailQuick");
  if (!wrap) return;
  const counts = {
    unread: emails.filter((m) => m.unread).length,
    starred: emails.filter(isStarredMail).length,
    attach: emails.filter((m) => m.hasAttachment || (m.attachments || []).length).length,
  };
  wrap.innerHTML = MAIL_QUICK.map(
    (q) => `
      <button type="button" class="mail-quick-item ${state.emailQuick === q.key ? "active" : ""}" data-quick="${q.key}">
        <strong>${counts[q.key] || 0}</strong>
        <span class="icon" data-icon="${q.icon}"></span>
        <span>${escapeHtml(q.label)}</span>
      </button>`,
  ).join("");
  installIcons(wrap);
}


function folderCount(emails, folder) {
  const hidePast = Boolean(state.config?.hidePastEmails) && folder === "inbox";
  return emails.filter((m) => mailInFolder(m, folder) && !(hidePast && isPastEvent(m))).length;
}

function renderMailFolders(emails) {
  const nav = $("#mailFolders");
  if (!nav) return;

  // 받은 편지함 안의 분류(교수님·학생회 …)를 폴더 아래에 이어 붙인다.
  // 예전에는 목록 위에 칩 줄로 떠 있어서 자리를 먹었다.
  // 목록은 '지난 일정 숨김'을 적용해 보여 주므로, 개수도 같은 기준으로 세야
  // '세미나·행사 12'를 눌렀는데 4통만 나오는 일이 없다.
  const hidePastHere = Boolean(state.config?.hidePastEmails);
  const inbox = emails.filter(
    (m) => mailInFolder(m, "inbox") && !(hidePastHere && isPastEvent(m)),
  );
  const cats = CATEGORY_ORDER.map((c) => ({
    key: c,
    count: inbox.filter((m) => m.category === c).length,
  })).filter((c) => c.count > 0);

  // 분류는 받은 편지함의 하위 폴더다. 접었다 펼 수 있게 한 겹 안으로 넣는다.
  const catsOpen = state.mailCatsOpen !== false;

  nav.innerHTML = MAIL_FOLDERS.map((f) => {
    const count = folderCount(emails, f.key);
    const unreadInFolder = emails.filter((m) => mailInFolder(m, f.key) && m.unread).length;
    const isInbox = f.key === "inbox";
    const hasKids = isInbox && cats.length > 0;
    return `
      <div class="mail-folder-row">
        ${
          hasKids
            ? `<button type="button" class="mail-folder-caret ${catsOpen ? "open" : ""}" data-cats-toggle
                 aria-label="분류 접기/펴기" aria-expanded="${catsOpen}">
                 <span class="icon" data-icon="chevronDown"></span>
               </button>`
            : `<span class="mail-folder-caret empty"></span>`
        }
        <button type="button" class="mail-folder ${state.emailFolder === f.key ? "active" : ""}" data-folder="${f.key}"
          ${MAIL_DROP_KEYS.has(f.key) ? 'data-drop="1"' : ""}>
          <span class="icon" data-icon="${f.icon}"></span>
          <span class="mf-label">${f.label}</span>
          ${unreadInFolder ? `<span class="mf-count">${unreadInFolder}</span>` : count ? `<span class="mf-count muted">${count}</span>` : ""}
        </button>
      </div>
      ${
        hasKids
          ? `<div class="mail-subfolders ${catsOpen ? "" : "closed"}">
             <div class="mail-subfolders-inner">
               ${cats
                 .map(
                   (c) => `
                 <button type="button" class="mail-folder mail-cat ${state.emailFilter === c.key ? "active" : ""}" data-cat="${escapeHtml(c.key)}">
                   <span class="mf-label">${escapeHtml(c.key)}</span>
                   <span class="mf-count muted">${c.count}</span>
                 </button>`,
                 )
                 .join("")}
             </div>
             </div>`
          : ""
      }
    `;
  }).join("");
  installIcons(nav);
  const current = MAIL_FOLDERS.find((f) => f.key === state.emailFolder);
  const title = $("#mailFolderTitle");
  if (title) {
    const unread = emails.filter((m) => mailInFolder(m, state.emailFolder) && m.unread).length;
    const total = folderCount(emails, state.emailFolder);
    title.firstChild.nodeValue = `${current ? current.label : "메일함"} `;
    const count = $("#mailFolderCount");
    if (count) count.textContent = total ? `${unread} / ${total}` : "";
    // 좁은 칸에서는 제목을 숨기므로, 어느 폴더를 뒤지는지 검색칸이 알려 준다
    const search = $("#emailSearchInput");
    if (search) search.placeholder = `${current ? current.label : "메일"}에서 검색`;
  }
}


/* 선택 상태를 화면에 반영한다 (체크 표시 + 개수) */
function syncMailSelection() {
  const chosen = state.mailSelected || new Set();
  document.querySelectorAll("[data-mail-id]").forEach((el) => {
    const on = chosen.has(el.dataset.mailId);
    el.classList.toggle("picked", on);
    const box = el.querySelector(".mail-pick");
    if (box) box.checked = on;
  });
  const label = $("#mailSelectedCount");
  if (label) label.textContent = chosen.size ? `${chosen.size}통 선택` : "";
  // 작업 막대는 고른 게 있을 때만. 평소에는 자리를 차지하지 않는다.
  // 고른 게 있으면 목록 머리줄이 작업 줄(읽음·안읽음·답장·전달·삭제)로 바뀐다
  document.querySelector(".mail-header-row")?.classList.toggle("picking", chosen.size > 0);
  const total = document.querySelectorAll("#newsGrid [data-mail-id]").length;
  [$("#mailSelectAll"), $("#mailPickAll")].forEach((all) => {
    if (!all) return;
    all.checked = total > 0 && chosen.size === total;
    all.indeterminate = chosen.size > 0 && chosen.size < total;
  });
}


function renderEmails() {
  const data = state.emails;
  const emails = data.emails || [];

  renderMailFolders(emails);

  // 현재 폴더의 메일만 (지난 일정 숨김 설정은 받은편지함에서만 적용)
  const hidePast = Boolean(state.config?.hidePastEmails) && state.emailFolder === "inbox";
  // 검색 중에는 폴더·탭을 가리지 않는다(휴지통만 뺀다). 받은 편지함에서 찾으면 내가 보낸 메일이 안 나왔다.
  const searchingText = Boolean(state.emailQuery?.trim());
  let folderPool = searchingText
    ? emails.filter((mail) => mail.folder !== "trash")
    : emails.filter((mail) => mailInFolder(mail, state.emailFolder) && !(hidePast && isPastEvent(mail)));
  const isInboxLike = state.emailFolder === "inbox" && !searchingText;

  // 왼쪽 개수와 탭 개수는 '지금 보고 있는 메일함' 기준이어야 한다.
  // 전체 메일로 세면 '중요 7'인데 눌러 보니 2통인 식으로 어긋난다.
  renderMailQuick(folderPool);

  // 기본 / LMS·공지 탭은 없앴다(2026-10-14, 사용자: '이거 없애줘'). 받은 편지함은 모든 메일을 보이고,
  // LMS 메일만 보려면 왼쪽 '수업·LMS' 분류를 누른다. 탭이 남아 있으면 기본 탭이 LMS 메일을 숨기므로 거르기도 뺐다.
  const tabs = $("#mailTabs");
  if (tabs && !tabs.hidden) tabs.hidden = true;

  // 왼쪽 빠른 필터
  if (state.emailQuick === "unread") folderPool = folderPool.filter((m) => m.unread);
  else if (state.emailQuick === "starred") folderPool = folderPool.filter(isStarredMail);
  else if (state.emailQuick === "attach")
    folderPool = folderPool.filter((m) => m.hasAttachment || (m.attachments || []).length);

  const unreadInFolder = folderPool.filter((m) => m.unread).length;
  $("#emailsUpdatedAt").textContent = data.updatedAt
    ? `${folderPool.length}통${unreadInFolder ? ` · 안읽음 ${unreadInFolder}` : ""}`
    : "아직 가져온 메일이 없습니다. '새로고침'을 눌러 주세요.";
  // "모두 읽음" 버튼: 받은편지함에 안읽음 있을 때만
  $("#markAllReadButton").hidden = !(isInboxLike && unreadInFolder > 0);

  // 브리핑('오늘 워크숍 있어요' + 할 일)과 분류 칩 줄은 없앴다.
  // 분류는 왼쪽 폴더 목록에서 고른다.

  // 필터/검색 적용
  const searching = Boolean(state.emailFilter) || Boolean(state.query.trim()) || Boolean(state.emailQuery?.trim());
  const visible = folderPool.filter((mail) => {
    if (!emailMatchesQuery(mail)) return false;
    if (state.emailFilter === "unread") return mail.unread;
    if (state.emailFilter) return (mail.category || "기타") === state.emailFilter;
    return true;
  });

  // 정렬
  const sorted = sortEmails(visible, state.emailSort);
  // 읽기창의 이전/다음이 '지금 보이는 순서' 를 따라가야 한다
  state.visibleMails = sorted;

  // 메인 뉴스: 받은편지함 기본(최신순 & 필터 없음)일 때만 상위 관심 3건을 크게
  let featured = [];
  if (isInboxLike && !searching && state.emailSort === "newest" && state.emailView === "grid") {
    featured = visible
      .filter((mail) => (mail.score || 0) >= 5)
      .sort((a, b) => (b.score || 0) - (a.score || 0) || new Date(b.date) - new Date(a.date))
      .slice(0, 3);
  }
  const featuredIds = new Set(featured.map((mail) => mail.id));
  $("#newsFeatured").innerHTML = featured.length
    ? `
      <div class="featured-main">${newsCard(featured[0], true)}</div>
      <div class="featured-side">${featured.slice(1).map((mail) => newsCard(mail)).join("")}</div>
    `
    : "";

  const rest = sorted.filter((mail) => !featuredIds.has(mail.id));
  const grid = $("#newsGrid");
  grid.classList.toggle("list-mode", state.emailView === "list");
  grid.innerHTML =
    state.emailView === "list"
      ? emailListHtml(rest)
      : rest.map((mail) => newsCard(mail)).join("");
  installIcons(grid);
  installIcons($("#newsFeatured"));
  // 다시 그렸으니 선택 표시를 맞춰 준다
  syncMailSelection();
  syncReadingRow();
  $("#emailEmpty").hidden = visible.length > 0;

  const badge = $("#emailBadge");
  const count = emails.filter((mail) => (mail.score || 0) >= 6 && mail.unread).length;
  badge.textContent = count;
  badge.hidden = !count;

  // 대시보드 '새 메일' 카드
  const unread = emails.filter((m) => m.folder === "inbox" && m.unread).length;
  const num = $("#metricNewMail");
  if (num) num.textContent = unread;
  const note = $("#metricNewMailNote");
  if (note) note.textContent = unread ? "안 읽은 메일" : "모두 읽었습니다";
}

function sortEmails(list, mode) {
  const arr = [...list];
  const byDateDesc = (a, b) => new Date(b.date || 0) - new Date(a.date || 0);
  switch (mode) {
    case "oldest":
      return arr.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
    case "sender":
      return arr.sort(
        (a, b) => (a.fromName || a.fromEmail || "").localeCompare(b.fromName || b.fromEmail || "", "ko") || byDateDesc(a, b),
      );
    case "subject":
      return arr.sort((a, b) => (a.subject || "").localeCompare(b.subject || "", "ko"));
    case "score":
      return arr.sort((a, b) => (b.score || 0) - (a.score || 0) || byDateDesc(a, b));
    case "newest":
    default:
      // 순수 최신순. 안읽음을 위로 올리면 '오늘/어제' 묶음이 뒤죽박죽이 된다.
      // 안 읽은 메일은 파란 점과 굵은 글씨로 구분된다.
      return arr.sort(byDateDesc);
  }
}

/* ===== 목록의 날짜 =====
   삼성 이메일처럼 '오늘 / 어제 / 9월 5일 금요일' 로 묶고,
   오늘 온 것은 시각(오전 10:32), 지난 것은 날짜(9월 7일)를 적는다. */
function mailDayStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function mailDayKey(iso) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "none" : String(mailDayStart(date));
}

function mailDayLabel(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "날짜 없음";
  const days = Math.round((mailDayStart(new Date()) - mailDayStart(date)) / 86400000);
  if (days === 0) return "오늘";
  if (days === 1) return "어제";
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
  const year = date.getFullYear() === new Date().getFullYear() ? "" : `${date.getFullYear()}년 `;
  return `${year}${date.getMonth() + 1}월 ${date.getDate()}일 ${weekday}요일`;
}

function mailListTime(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  if (mailDayStart(date) === mailDayStart(now)) {
    const hour = date.getHours();
    return `${hour < 12 ? "오전" : "오후"} ${hour % 12 || 12}:${String(date.getMinutes()).padStart(2, "0")}`;
  }
  const year = date.getFullYear() === now.getFullYear() ? "" : `${String(date.getFullYear()).slice(2)}. `;
  return `${year}${date.getMonth() + 1}월 ${date.getDate()}일`;
}

const MAIL_FOLDER_TAG = {
  inbox: "받은 메일함",
  sent: "보낸 메일함",
  draft: "임시보관함",
  trash: "휴지통",
  promo: "광고",
  spam: "스팸",
};

/** 날짜 머리글을 끼워 넣은 목록 (최신순일 때만 묶는다) */
function emailListHtml(rows) {
  if (state.emailSort !== "newest") return rows.map((mail) => emailListRow(mail)).join("");
  let out = "";
  let day = "";
  for (const mail of rows) {
    const key = mailDayKey(mail.date);
    if (key !== day) {
      day = key;
      out += `<div class="mail-day">${escapeHtml(mailDayLabel(mail.date))}</div>`;
    }
    out += emailListRow(mail);
  }
  return out;
}

function emailListRow(mail) {
  const title = mail.summary || mail.subject;
  const starred = isStarredMail(mail);
  const hasFiles = Boolean(mail.hasAttachment || (mail.attachments || []).length);
  return `
    <div class="email-list-row ${mail.unread ? "unread" : ""}" data-mail-id="${mail.id}" draggable="true">
      <input type="checkbox" class="mail-pick" aria-label="선택" />
      <span class="list-unread">${mail.unread ? '<span class="unread-dot"></span>' : ""}</span>
      <div class="list-main">
        <div class="list-head">
          <span class="list-folder-tag">${escapeHtml(MAIL_FOLDER_TAG[mail.folder] || "메일")}</span>
          <span class="list-from">${
            (mail.folder === "sent" || mail.folder === "draft") && (mail.toName || mail.toEmail)
              ? `→ ${escapeHtml(shortText(mail.toName || mail.toEmail, 22))}`
              : escapeHtml(shortText(mail.fromName || mail.fromEmail, 24))
          }</span>
          ${mail.folder === "sent" || mail.folder === "draft" ? "" : coursePersonTagHtml(mail.fromEmail)}
          <span class="list-when">
            ${hasFiles ? iconHtml("paperclip", "list-clip") : ""}
            <time class="list-date" datetime="${escapeHtml(mail.date || "")}"
              title="${escapeHtml(formatEmailDate(mail.date))}">${escapeHtml(mailListTime(mail.date))}</time>
          </span>
        </div>
        <div class="list-title" title="${escapeHtml(title || "")}">${escapeHtml(shortText(title, 90))}</div>
        <div class="list-foot">
          <span class="list-snippet">${escapeHtml(shortText(mail.snippet, 110))}</span>
          <button type="button" class="list-star ${starred ? "on" : ""}" data-star
            aria-label="${starred ? "중요 해제" : "중요 표시"}"
            title="${starred ? "중요 해제" : "중요 표시"}">${iconHtml("star")}</button>
        </div>
      </div>
      <span class="list-actions">
        ${
          mail.folder === "trash"
            ? `<button type="button" class="mail-act" data-act="restore" title="받은 편지함으로 되돌리기">
                 ${iconHtml("undo")}
               </button>`
            : `<button type="button" class="mail-act" data-act="read" title="${mail.unread ? "읽음 표시" : "안읽음 표시"}">
                 ${iconHtml(mail.unread ? "check" : "mail")}
               </button>`
        }
        <button type="button" class="mail-act danger" data-act="delete"
          title="${mail.folder === "trash" ? "완전히 지우기" : "휴지통으로"}">
          ${iconHtml("trash")}
        </button>
      </span>
    </div>
  `;
}

/* ===== 강의 뷰 ===== */
/* '일반화학Ⅰ (General chemistryⅠ )_03[ 2026_1학기 ]' → 'General chemistryⅠ'.
   서버의 extract_course_label 과 같은 규칙 — 자료의 courseLabel 과 맞아야
   같은 과목으로 합쳐진다. */
function extractCourseLabelJs(value) {
  const text = String(value || "").trim();
  if (text.includes("(") && text.includes(")")) {
    const inside = text.split("(", 2)[1].split(")", 1)[0].trim();
    if (inside) return inside;
  }
  return (text.includes("[") ? text.split("[", 1)[0].trim() : text) || "기타";
}

function courseSummaries() {
  const map = new Map();
  // 수강 중인 과목을 먼저 전부 깔아 둔다.
  // 자료·마감에서만 과목을 만들면, LMS 에 자료를 안 올리는 과목
  // (학술 글쓰기처럼)이 화면에서 통째로 사라진다 — 실제로 3과목이 그랬다.
  (state.courseState?.current || []).forEach((c) => {
    const label = extractCourseLabelJs(c.name);
    if (label && !map.has(label)) {
      map.set(label, {
        label, korean: c.name.includes("(") ? c.name.split("(", 1)[0].trim() : "",
        files: 0, deadlines: 0, next: null,
        levelLabel: "", termLabel: "", syllabus: null,
      });
    }
  });
  const ensure = (label) => {
    if (!map.has(label)) {
      map.set(label, {
        label, korean: "", files: 0, deadlines: 0, next: null,
        // 몇 학년 무슨 학기 과정인지, 그리고 강의계획서
        levelLabel: "", termLabel: "", syllabus: null,
      });
    }
    return map.get(label);
  };

  state.files.forEach((file) => {
    const entry = ensure(file.courseLabel || "기타");
    entry.files += 1;
    if (!entry.korean && file.course && file.course.includes("(")) {
      entry.korean = file.course.split("(", 1)[0].trim();
    }
    if (!entry.levelLabel && file.levelLabel) entry.levelLabel = file.levelLabel;
    if (!entry.termLabel && file.termLabel) entry.termLabel = file.termLabel;
    // 강의계획서가 여러 개면 가장 최근에 받은 것
    if (file.isSyllabus) {
      if (!entry.syllabus || (file.savedAt || "") > (entry.syllabus.savedAt || "")) {
        entry.syllabus = file;
      }
    }
  });

  const now = Date.now();
  state.deadlines.items.forEach((item) => {
    const entry = ensure(item.courseLabel || "기타");
    entry.deadlines += 1;
    if (!entry.korean && item.course && item.course.includes("(")) {
      entry.korean = item.course.split("(", 1)[0].trim();
    }
    const due = parseDue(item);
    if (due && due.getTime() >= now && !isSubmitted(item)) {
      if (!entry.next || due < entry.next.due) {
        entry.next = { due, name: item.name };
      }
    }
  });

  (state.status?.courses || []).forEach((label) => ensure(label));
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
}

/* 카드에 '2학년 · 2026학년도 2학기' 처럼 과정 표시 */
function courseMetaLine(course) {
  const parts = [course.levelLabel, course.termLabel].filter(Boolean);
  if (!parts.length) return "";
  // 마디마다 따로 옮긴다: 이어 붙인 줄을 통째로 옮기면 '{0} {1}학기' 틀이 앞마디까지 삼켜
  // 영어 화면에 'Year 1 AY2026 · 2 term' 처럼 나왔다(2026-10-14)
  return `<div class="course-meta">${parts.map((part) => escapeHtml(tr(part))).join(" · ")}</div>`;
}

/* 강의계획서가 자료에 들어와 있으면 카드 아래에서 바로 열 수 있게 한다.
   자료를 받아 둔 경우에만 보인다(없는 링크를 눌러 빈 화면이 뜨면 더 답답하다). */
function syllabusLink(course) {
  const file = course.syllabus;
  if (!file || file.status !== "local") return "";
  return `
    <button type="button" class="course-syllabus" data-syllabus="${escapeHtml(file.localName)}"
            title="${escapeHtml(file.name)}">
      <span class="icon" data-icon="file"></span>
      강의계획서 보기
    </button>`;
}

function renderCourses() {
  if (state.courseAnn === null) loadCourseAnn();
  else renderCourseAnn();
  // 공지사항 탭을 보는 중이면 과목 카드는 그리지 않는다 (탭을 바꿀 때 setCourseTab 이 다시 부른다)
  if (state.courseTab === "ann") return;
  const grid = $("#courseGrid");
  const empty = $("#courseEmpty");
  const query = state.query.trim().toLowerCase();
  const hidden = state.selection.hidden || [];
  const summaries = courseSummaries().filter(
    (course) =>
      !hidden.includes(course.label) &&
      (!query ||
        course.label.toLowerCase().includes(query) ||
        course.korean.toLowerCase().includes(query)),
  );

  // 편집 모드: 카드 흔들림 + 제거 버튼
  grid.classList.toggle("editing", !!state.courseEditMode);
  const editLabel = $("#courseEditLabel");
  if (editLabel) editLabel.textContent = state.courseEditMode ? "완료" : "편집";
  $("#courseEditButton")?.setAttribute("aria-pressed", String(!!state.courseEditMode));
  const restoreBtn = $("#restoreCoursesButton");
  if (restoreBtn) {
    restoreBtn.hidden = hidden.length === 0;
    restoreBtn.textContent = `숨긴 과목 ${hidden.length}개 복원`;
  }

  empty.hidden = summaries.length > 0;
  grid.innerHTML = summaries
    .map((course) => {
      const enabled = state.selection.courses[course.label] !== false;
      const removeBtn = state.courseEditMode
        ? `<button type="button" class="course-remove" data-remove="${escapeHtml(course.label)}" aria-label="과목 제거" title="목록에서 제거">✕</button>`
        : "";
      const nextLine = course.next
        ? `다음 마감 <b>${formatDue(course.next.due)}</b> · ${escapeHtml(shortText(course.next.name, 30))}`
        : "다가오는 미제출 마감 없음";
      // 영어 화면에서는 한글 이름이 LMS 영어 이름으로 바뀌어 제목과 같은 줄이 두 번 보였다 → 같으면 뺀다
      const showKorean = course.korean && !(I18N.lang === "en" && courseNameKey(tr(course.korean)) === courseNameKey(course.label));
      return `
        <article class="course-card ${enabled ? "" : "off"}">
          ${removeBtn}
          <div class="course-card-top">
            <h3>
              ${escapeHtml(shortText(course.label, 40))}
              ${showKorean ? `<span class="course-korean">${escapeHtml(shortText(course.korean, 36))}</span>` : ""}
            </h3>
            <label class="toggle" title="Drive 자동 업로드 포함 여부">
              <input type="checkbox" data-course="${escapeHtml(course.label)}" ${enabled ? "checked" : ""} />
              <span class="track"></span>
            </label>
          </div>
          <div class="course-stats">
            <span>자료 <b>${course.files}</b></span>
            <span>과제 <b>${course.deadlines}</b></span>
            <span>${enabled ? "업로드 포함" : "업로드 제외"}</span>
          </div>
          <div class="course-next">${nextLine}</div>
          ${courseMetaLine(course)}
          ${courseStaffLine(course)}
          ${syllabusLink(course)}
        </article>
      `;
    })
    .join("");

  // 강의계획서 바로 열기
  grid.querySelectorAll("[data-syllabus]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      openOutside(`/api/file?name=${encodeURIComponent(btn.dataset.syllabus)}`);
    });
  });

  grid.querySelectorAll("input[data-course]").forEach((input) => {
    input.addEventListener("change", async (event) => {
      const label = event.target.dataset.course;
      state.selection.courses[label] = event.target.checked;
      try {
        await api("/api/selection", {
          method: "POST",
          body: JSON.stringify(state.selection),
        });
        showToast(
          event.target.checked
            ? `'${shortText(label, 24)}' 과목을 업로드에 포함합니다.`
            : `'${shortText(label, 24)}' 과목을 업로드에서 제외합니다.`,
        );
        renderCourses();
      } catch (error) {
        showToast(error.message);
      }
    });
  });

  // 편집 모드에서 과목 제거 (자료는 지우지 않고 목록에서만 숨김)
  grid.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", async (event) => {
      event.stopPropagation();
      const label = btn.dataset.remove;
      const ok = await uiConfirm(
        `'${shortText(label, 30)}' 과목을 목록에서 뺄까요?\n받아 둔 자료는 그대로이고, '숨긴 과목 되돌리기'로 다시 넣을 수 있어요.`,
        { title: "과목 빼기", ok: "빼기" },
      );
      if (!ok) return;
      state.selection.hidden = [...new Set([...(state.selection.hidden || []), label])];
      try {
        await api("/api/selection", { method: "POST", body: JSON.stringify(state.selection) });
        showToast(`'${shortText(label, 24)}' 과목을 목록에서 제거했습니다.`);
        renderCourses();
      } catch (error) {
        showToast(error.message);
      }
    });
  });
}

/* ===== 상태/메트릭 ===== */
function renderCourseChangeBanner() {
  const banner = $("#courseChangeBanner");
  if (!banner) return;
  const change = state.status?.courseChange || {};
  if (!change.pending) {
    banner.hidden = true;
    return;
  }
  const added = change.added || [];
  const removed = change.removed || [];
  const parts = [];
  if (added.length) parts.push(`새로 추가된 과목 ${added.length}개: ${added.map((c) => shortText(c.name, 24)).join(", ")}`);
  if (removed.length) parts.push(`사라진 과목 ${removed.length}개: ${removed.map((c) => shortText(c.name, 24)).join(", ")}`);
  $("#courseChangeDetail").textContent = parts.join(" / ");
  banner.hidden = false;
}

function renderStatus() {
  const status = state.status;
  if (!status) return;

  renderCourseChangeBanner();

  const ready = Object.values(status.requiredConfig || {}).every(Boolean);
  const oauth = status.googleOAuth || {};
  const isSharedSite = status.mode === "multi-user";
  const deadlineInfo = status.deadlines || {};

  $("#metricFiles").textContent = status.counts.files;
  $("#metricCourses").textContent = status.counts.courses;

  $("#metricFilesNote").textContent = status.counts.files ? "관리 중인 파일" : "자료 없음";
  $("#metricCoursesNote").textContent = status.counts.missing
    ? `누락 ${status.counts.missing}건 포함`
    : "분류된 과목";


  $("#metricDeadlines").textContent = deadlineInfo.upcoming7d ?? 0;
  $("#metricDeadlinesNote").textContent = deadlineInfo.overdueUnsubmitted
    ? `지난 미제출 ${deadlineInfo.overdueUnsubmitted}건`
    : "7일 이내 미제출";

  const badge = $("#deadlineBadge");
  const badgeCount = deadlineInfo.upcoming7d ?? 0;
  badge.textContent = badgeCount;
  badge.hidden = !badgeCount;

  renderStatusCard();

  renderGoogleSection();

  // 상단에서 없앤 버튼이라 없을 수 있다
  const openDownloadsButton = $("#openDownloadsButton");
  if (openDownloadsButton) {
    openDownloadsButton.disabled = isSharedSite;
    openDownloadsButton.title = isSharedSite
      ? "공유 웹사이트 모드에서는 서버 폴더를 직접 열 수 없습니다."
      : "다운로드 폴더를 엽니다.";
  }
}

/* ===== 설정: 구글 계정 섹션 ===== */
function renderGoogleSection() {
  const oauth = state.status?.googleOAuth || {};
  // 구글 로그인 준비물(credentials.json)을 사용자에게 달라고 하지 않는다. 맥·리눅스 판은 준비물이 안 묶여
  // 'API 를 발급해 파일을 넣으라' 는 칸과 도움말이 떴다(2026-10-21 사용자: API 키를 요구하는 설정은 지워 달라).
  // 준비물이 없는 판에서는 '아직 쓸 수 없어요' 로만 알리고 단추를 끈다.
  const drop = $("#credDrop");
  if (drop) drop.hidden = true;
  const statusText = $("#googleStatusText");
  const loginButton = $("#googleLoginButton");
  const disconnectButton = $("#disconnectGoogleButton");
  if (!statusText || !loginButton) return;

  if (oauth.tokenUsable) {
    setAccountPill("#googlePill", "ok", "연결됨");
    statusText.textContent = oauth.calendarGranted ? "드라이브 · 캘린더" : "드라이브";
    loginButton.textContent = "다시 로그인";
    loginButton.classList.remove("primary");
  } else {
    const ready = Boolean(oauth.credentialsExists);
    setAccountPill("#googlePill", "need", ready ? "연결 안 됨" : "준비 중");
    statusText.textContent = ready ? "" : "이 판에서는 아직 쓸 수 없어요";
    loginButton.textContent = "Google로 로그인";
    loginButton.classList.toggle("primary", ready);
  }
  loginButton.disabled = !oauth.credentialsExists && !oauth.tokenUsable;
  disconnectButton.hidden = !oauth.tokenExists;
  renderAccountPills();
  renderSaveDestinations();
}

function setAccountPill(selector, kind, text) {
  const el = $(selector);
  if (!el) return;
  el.textContent = text;
  el.dataset.kind = kind;
}

/* LMS·메일은 '저장됨' 여부만 안다(비밀번호를 화면으로 돌려주지 않는다). */
function renderAccountPills() {
  const c = state.config || {};
  setAccountPill("#lmsAccountPill", c.lmsId && c.hasLmsPassword ? "ok" : "need", c.lmsId && c.hasLmsPassword ? "저장됨" : "입력 필요");
  const mailOk = c.schoolEmail && c.hasSchoolEmailPassword;
  setAccountPill("#mailAccountPill", mailOk ? "ok" : "need", mailOk ? "저장됨" : "입력 필요");
}

/* ===== 파일 저장 ===== */
async function saveFilesToComputer(localNames) {
  const names = Array.isArray(localNames) ? localNames : [localNames];
  if (!names.length) return;
  if (state.status?.mode === "multi-user") {
    names.slice(0, 10).forEach((name) => {
      openOutside(`/api/file?name=${encodeURIComponent(name)}`);
    });
    if (names.length > 10) showToast("브라우저 모드에서는 한 번에 10개까지 다운로드됩니다.");
    return;
  }
  try {
    const data = await api("/api/save-local", {
      method: "POST",
      body: JSON.stringify({ names }),
    });
    showToast(data.message || "다운로드 폴더에 저장했습니다.");
    state.selectedFiles.clear();
    renderFiles();
  } catch (error) {
    showToast(error.message);
  }
}

/* 고른 자료를 한꺼번에 처리한다.
   폴더 헤더 체크박스로 과목 전체를 고른 뒤 그대로 이어서 쓸 수 있다.
   Drive 업로드나 삼성 노트는 파일 수만큼 시간이 걸리므로 진행 표시를 띄운다. */
async function runBulkFileAction(action, label) {
  const names = [...state.selectedFiles];
  if (!names.length) return;

  const buttons = [...document.querySelectorAll(".bulk-action, #bulkSaveButton")];
  buttons.forEach((b) => (b.disabled = true));
  showToast(`${label}… (${names.length}개)`);
  try {
    const res = await api("/api/files/bulk", {
      method: "POST",
      body: JSON.stringify({ action, names }),
    });
    showToast(res.message || "끝났습니다.");
    state.selectedFiles.clear();
    // 삼성 노트는 뒤에서 돈다. 버튼은 바로 풀고 진행만 위에 조용히 보여 준다.
    if (res.started) watchNotesJob();
    await refreshAll();
  } catch (error) {
    showToast(error.message);
  } finally {
    buttons.forEach((b) => (b.disabled = false));
    updateBulkSaveButton();
  }
}

/* ===== 삼성 노트 넣기 진행 =====
   서버가 뒤에서 넣는 동안 위쪽 진행 막대에만 'n/전체' 를 보여 준다.
   삼성 노트 창은 서버 쪽에서 투명하게 붙잡아 두어 화면에 뜨지 않는다. */
async function watchNotesJob() {
  if (state.notesJobWatching) return;
  state.notesJobWatching = true;
  try {
    for (;;) {
      let job;
      try {
        job = await api("/api/samsung-notes/job");
      } catch (error) {
        break;
      }
      state.notesJob = job;
      if (!job.running) {
        if (job.result) {
          finishTopProgress(job.result.ok === false ? "삼성 노트 넣기 실패" : "삼성 노트 넣기 완료");
          showToast(job.message || "삼성 노트에 넣었습니다.");
        } else {
          hideTopProgress();
        }
        break;
      }
      const total = Math.max(job.total || 0, 1);
      // 파일 하나가 끝나야 숫자가 오르므로, 진행 중인 파일은 반쯤 찬 것으로 친다
      const pct = Math.min(96, ((job.done + (job.current ? 0.5 : 0)) / total) * 100);
      showTopProgress(`삼성 노트 ${Math.min(job.done + 1, total)}/${total}`, Math.max(pct, 4));
      await new Promise((resolve) => window.setTimeout(resolve, 700));
    }
  } finally {
    state.notesJobWatching = false;
  }
}

/* 자료를 목록에서만 뺀다. 받아 둔 파일과 Drive 사본은 그대로 둔다.
   되돌리기는 '숨긴 자료 복원'으로. */
async function dropFileFromList(localName) {
  if (!localName) return;
  if (!Array.isArray(state.selection.hiddenFiles)) state.selection.hiddenFiles = [];
  if (state.selection.hiddenFiles.includes(localName)) return;
  state.selection.hiddenFiles.push(localName);
  state.selectedFiles.delete(localName);
  try {
    await api("/api/selection", { method: "POST", body: JSON.stringify(state.selection) });
    showToast("목록에서 뺐습니다. 파일은 그대로 있습니다.");
    await refreshAll();
  } catch (error) {
    showToast(error.message);
  }
}

async function restoreHiddenFiles() {
  state.selection.hiddenFiles = [];
  try {
    await api("/api/selection", { method: "POST", body: JSON.stringify(state.selection) });
    showToast("숨긴 자료를 모두 되돌렸습니다.");
    await refreshAll();
  } catch (error) {
    showToast(error.message);
  }
}

function updateBulkSaveButton() {
  const count = state.selectedFiles.size;
  // 고른 게 있을 때만 '할 일' 막대를 보인다 (평소엔 꺼진 버튼 네 개가 자리만 차지했다)
  const bar = $("#fileSelectBar");
  if (bar) bar.hidden = count === 0;
  const counter = $("#fileSelectCount");
  if (counter) counter.textContent = String(count);
  $("#bulkSaveButton").disabled = count === 0;
  document.querySelectorAll(".bulk-action").forEach((el) => {
    el.disabled = count === 0;
  });
  // 삼성 노트는 그 앱이 깔린 PC 에서만 의미가 있다
  const notes = $("#bulkNotesButton");
  if (notes) notes.hidden = !state.samsungNotes;
  const organize = $("#organizeNotesButton");
  if (organize) organize.hidden = !state.samsungNotes;

  const restore = $("#restoreFilesButton");
  if (restore) {
    const hiddenCount = (state.selection?.hiddenFiles || []).length;
    restore.hidden = hiddenCount === 0;
    const label = $("#restoreFilesLabel");
    if (label) label.textContent = `숨긴 자료 ${hiddenCount}개 되돌리기`;
  }
}

/** 고른 자료를 모두 푼다 (체크 표시까지) */
function clearFileSelection() {
  state.selectedFiles.clear();
  document.querySelectorAll("#view-files input[type=checkbox]:checked").forEach((box) => {
    box.checked = false;
    box.indeterminate = false;
  });
  updateBulkSaveButton();
}

/* 자료 ⋯ 메뉴: 누르면 열고, 바깥을 누르거나 Esc 면 닫는다 */
function setFilesMenu(open) {
  const menu = $("#filesMoreMenu");
  const button = $("#filesMoreButton");
  if (!menu || !button) return;
  menu.hidden = !open;
  button.setAttribute("aria-expanded", String(open));
}

/* ===== 자료 뷰 ===== */
function renderCourseFilter() {
  const select = $("#courseFilter");
  const courses = [...new Set(state.files.map((file) => file.courseLabel).filter(Boolean))].sort();
  const current = select.value;
  select.innerHTML = '<option value="">모든 과목</option>';
  courses.forEach((course) => {
    const option = document.createElement("option");
    option.value = course;
    option.textContent = shortText(course, 28);
    select.append(option);
  });
  select.value = courses.includes(current) ? current : "";
}

function filteredFiles() {
  const query = state.query.trim().toLowerCase();
  return state.files.filter((file) => {
    // file.course에 한국어 과목명이 포함되어 '프로그래밍', '생명과학개론' 같은 검색도 가능
    const haystack = `${file.name} ${file.course} ${file.courseLabel} ${file.folder} ${file.type}`.toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    const matchesCourse = !state.course || file.courseLabel === state.course;
    const matchesStatus = !state.fileStatus || file.status === state.fileStatus;
    return matchesQuery && matchesCourse && matchesStatus;
  });
}

/* ===== 자료함: 과목별 폴더 보기 ===== */
function renderFolderView(rows) {
  const wrap = $("#folderView");
  if (!wrap) return;
  const groups = new Map();
  rows.forEach((file) => {
    const key = file.courseLabel || file.course || "기타";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(file);
  });

  const sorted = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
  // 접힌 폴더의 파일 줄은 펼칠 때 그린다.
  // 예전에는 268개 파일 × 아이콘 4개를 전부 미리 그려서(대부분 접힌 채로),
  // 폴더 보기를 열거나 체크 하나 바꿀 때마다 80ms 가 들었다.
  state.folderRows = new Map(sorted);
  // 과목마다 LMS 와 같은 폴더 나무 (1주차 > Lecture 1 > 파일)
  state.folderTrees = new Map(sorted.map(([course, files]) => [course, buildFolderTree(files)]));
  wrap.innerHTML = sorted.length
    ? sorted
        .map(([course, files]) => {
          const open = !!state.openFolders[course];
          const localCount = files.filter((f) => f.status === "local").length;
          const savable = files.filter((f) => f.status === "local");
          const allPicked =
            savable.length > 0 && savable.every((f) => state.selectedFiles.has(f.localName));
          const somePicked = savable.some((f) => state.selectedFiles.has(f.localName));
          // 폴더가 어느 학년·학기 과정인지 (자료에서 뽑아 둔 값)
          const meta = [files[0]?.levelLabel, files[0]?.termLabel].filter(Boolean).join(" · ");
          return `
            <section class="folder-card ${open ? "open" : ""}" data-folder="${escapeHtml(course)}">
              <div class="folder-head-row">
                <label class="folder-pickall" title="이 과목 자료 전체 선택">
                  <input type="checkbox" data-pickfolder="${escapeHtml(course)}"
                    ${allPicked ? "checked" : ""} ${savable.length ? "" : "disabled"} />
                </label>
                <button type="button" class="folder-head" aria-expanded="${open}">
                  <span class="folder-icon">${iconHtml("folder")}</span>
                  <span class="folder-title">
                    <strong title="${escapeHtml(course)}">${escapeHtml(shortText(course, 40))}</strong>
                    <span>${files.length}개 · 저장됨 ${localCount}개${
                      somePicked && !allPicked ? " · 일부 선택" : ""
                    }${meta ? ` · ${escapeHtml(meta)}` : ""}</span>
                  </span>
                  <span class="folder-chevron" aria-hidden="true">›</span>
                </button>
              </div>
              <div class="folder-files">
                <div class="folder-files-inner" ${open ? "" : 'data-lazy="1"'}>
                ${open ? folderTreeHtml(course, state.folderTrees.get(course), 0) : ""}
                </div>
              </div>
            </section>`;
        })
        .join("")
    : "";
  markPartialPicks(wrap);
}

/* ===== LMS 폴더 나무 =====
   LMS 에는 강의자료가 '1주차 > Lecture 1 > 파일' 처럼 폴더 안에 정리되어 있다.
   예전에는 과목 아래에 파일을 한 줄로 늘어놓기만 해서 어느 주차 자료인지 알 수 없었다.
   이제 동기화 때 기록한 폴더 경로로 나무를 세우고, LMS 에 올라온 순서를 따른다.
   순서를 모르는 파일(예전에 받은 것)은 이름을 사람이 읽는 순서로 놓는다
   ('10주차' 가 '2주차' 앞에 오지 않게). */
const FOLDER_KEY_SEP = "\u241F";
const koNatural = new Intl.Collator("ko", { numeric: true, sensitivity: "base" });

function compareLmsOrder(a, b) {
  const hasA = Array.isArray(a) && a.length;
  const hasB = Array.isArray(b) && b.length;
  if (hasA && hasB) {
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i += 1) {
      if (a[i] !== b[i]) return a[i] - b[i];
    }
    return a.length - b.length;
  }
  if (hasA) return -1;
  if (hasB) return 1;
  return 0;
}

function buildFolderTree(files) {
  const makeNode = (name, path) => ({ name, path, folders: new Map(), files: [], order: null, all: [] });
  const root = makeNode("", []);
  for (const file of files) {
    let node = root;
    node.all.push(file);
    const parts = Array.isArray(file.folderPath) ? file.folderPath.filter(Boolean) : [];
    for (const part of parts) {
      if (!node.folders.has(part)) node.folders.set(part, makeNode(part, [...node.path, part]));
      node = node.folders.get(part);
      node.all.push(file);
      if (file.lmsOrder && (!node.order || compareLmsOrder(file.lmsOrder, node.order) < 0)) {
        node.order = file.lmsOrder;
      }
    }
    node.files.push(file);
  }
  return root;
}

function findFolderNode(course, path) {
  let node = state.folderTrees?.get(course);
  for (const part of path) {
    node = node?.folders.get(part);
  }
  return node || null;
}

function folderKey(course, path) {
  return [course, ...path].join(FOLDER_KEY_SEP);
}

function folderTreeHtml(course, node, depth) {
  if (!node) return "";
  // 폴더와 파일을 LMS 에 놓인 순서대로 섞어 놓는다.
  // (LMS 에서 맨 위에 있는 강의계획서가 폴더들 뒤로 밀리지 않게)
  // 순서를 모르는 것끼리는 폴더를 먼저, 그다음 이름순.
  const items = [
    ...[...node.folders.values()].map((child) => ({ kind: 0, order: child.order, name: child.name, child })),
    ...node.files.map((file) => ({ kind: 1, order: file.lmsOrder, name: file.name, file })),
  ];
  items.sort(
    (a, b) => compareLmsOrder(a.order, b.order) || a.kind - b.kind || koNatural.compare(a.name, b.name),
  );
  return items
    .map((item) => (item.child ? subfolderHtml(course, item.child, depth) : folderFileHtml(item.file)))
    .join("");
}

function subfolderHtml(course, node, depth) {
  const key = folderKey(course, node.path);
  const open = !!state.openFolders[key];
  const savable = node.all.filter((f) => f.status === "local");
  const picked = savable.filter((f) => state.selectedFiles.has(f.localName)).length;
  const allPicked = savable.length > 0 && picked === savable.length;
  return `
    <div class="subfolder ${open ? "open" : ""}" data-subfolder="${escapeHtml(key)}" style="--depth:${depth}">
      <div class="subfolder-row">
        <input type="checkbox" class="subfolder-pick" data-pickpath="${escapeHtml(key)}"
          ${allPicked ? "checked" : ""} ${picked && !allPicked ? 'data-partial="1"' : ""}
          ${savable.length ? "" : "disabled"} aria-label="이 폴더 자료 전체 선택" />
        <button type="button" class="subfolder-head" aria-expanded="${open}">
          <span class="folder-chevron" aria-hidden="true">›</span>
          ${iconHtml("folder", "subfolder-icon")}
          <span class="subfolder-name" title="${escapeHtml(node.name)}">${escapeHtml(node.name)}</span>
          <span class="subfolder-count">${node.all.length}</span>
        </button>
      </div>
      <div class="subfolder-body" ${open ? "" : 'data-lazy="1"'}>
        ${open ? folderTreeHtml(course, node, depth + 1) : ""}
      </div>
    </div>`;
}

/** 일부만 고른 폴더는 체크 상자를 반쯤 찬 모양으로 */
function markPartialPicks(root) {
  root.querySelectorAll('[data-partial="1"]').forEach((box) => {
    box.indeterminate = true;
  });
}

/** 접혀 있던 하위 폴더를 펼칠 때 그 안을 그린다 */
function fillLazySubfolder(element) {
  const body = element.querySelector(":scope > .subfolder-body[data-lazy]");
  if (!body) return;
  const [course, ...path] = element.dataset.subfolder.split(FOLDER_KEY_SEP);
  const depth = Number(element.style.getPropertyValue("--depth") || 0) + 1;
  body.innerHTML = folderTreeHtml(course, findFolderNode(course, path), depth);
  delete body.dataset.lazy;
  markPartialPicks(body);
}

function folderFileHtml(file) {
  return `
    <div class="folder-file">
      <input type="checkbox" class="folder-file-pick" data-pick="${escapeHtml(file.localName)}"
        ${state.selectedFiles.has(file.localName) ? "checked" : ""}
        ${file.status === "local" ? "" : "disabled"} aria-label="선택" />
      <span class="file-type-icon">${iconHtml("file")}</span>
      <span class="folder-file-name" title="${escapeHtml(file.name)}">${escapeHtml(shortText(file.name, 42))}</span>
      ${file.isSyllabus ? '<span class="syllabus-tag">강의계획서</span>' : ""}
      <span class="status-badge ${file.status}">${statusLabel(file.status)}</span>
      <button class="save-file-button" data-open-file="${escapeHtml(file.localName)}"
        ${file.status === "local" ? "" : "disabled"} title="열기">
        ${iconHtml("file")}열기
      </button>
      <button class="save-file-button" data-save="${escapeHtml(file.localName)}"
        ${file.status === "local" ? "" : "disabled"} title="내 컴퓨터에 저장">
        ${iconHtml("download")}저장
      </button>
      ${
        state.samsungNotes && file.status === "local" && /\.pdf$/i.test(file.name)
          ? `<button class="save-file-button notes" data-to-notes="${escapeHtml(file.localName)}"
               title="삼성 노트로 보내기 (PDF만 가능)">노트로</button>`
          : ""
      }
      <button class="save-file-button danger" data-drop-file="${escapeHtml(file.localName)}"
        ${file.status === "local" ? "" : "disabled"} title="목록에서 빼기">
        ${iconHtml("trash")}
      </button>
    </div>`;
}

/** 접혀 있던 폴더를 펼칠 때 그 폴더의 파일 줄을 그린다 */
function fillLazyFolder(card) {
  const inner = card.querySelector(".folder-files-inner[data-lazy]");
  if (!inner) return;
  const course = card.dataset.folder;
  inner.innerHTML = folderTreeHtml(course, state.folderTrees?.get(course), 0);
  delete inner.dataset.lazy;
  markPartialPicks(inner);
}

function applyFileMode() {
  const mode = state.fileMode;
  const set = (el, show) => {
    if (el) el.hidden = !show;
  };
  set($("#folderView"), mode === "folder");
  set($("#shelfView"), mode === "shelf");
  set($("#fileTableWrap"), mode === "list");
  document.querySelectorAll("[data-filemode]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filemode === mode);
  });
  if (mode === "shelf") renderShelves();
}

/* ===== 내 폴더 (자유 편집) ===== */
/* 삼성 노트가 깔린 PC 에서만 '노트로' 버튼을 보여 준다.
   없는 사람에게 눌러도 안 되는 버튼을 보이는 것보다 낫다.
   설치 여부는 잘 안 바뀌므로 켤 때 한 번만 확인한다. */
async function loadSamsungNotes() {
  try {
    const res = await api("/api/samsung-notes/status");
    state.samsungNotes = Boolean(res.available);
  } catch (error) {
    state.samsungNotes = false;
  }
}

/* 삼성 노트에 들어간 강의자료를 과목 이름 폴더로 옮긴다.
   삼성 노트가 켜져 있으면 앱이 제 메모리 값으로 덮어써서 정리가 되돌아간다.
   그래서 켜져 있으면 먼저 닫아 달라고 알린다. */
async function organizeSamsungNotes() {
  const button = $("#organizeNotesButton");
  if (button) button.disabled = true;
  try {
    const res = await api("/api/samsung-notes/organize", { method: "POST", body: "{}" });
    showToast(res.message || "정리했습니다.");
  } catch (error) {
    showToast(error.message);
  } finally {
    if (button) button.disabled = false;
  }
}

/* 받아 둔 자료를 '학기 / 과목' 폴더로 옮긴다 */
async function organizeFiles() {
  const button = $("#organizeFilesButton");
  if (button) button.disabled = true;
  try {
    const res = await api("/api/organize-files", { method: "POST", body: "{}" });
    showToast(res.message || "정리했습니다.");
    await refreshAll();
  } catch (error) {
    showToast(error.message);
  } finally {
    if (button) button.disabled = false;
  }
}

async function loadShelves() {
  try {
    const data = await api("/api/shelves");
    state.shelves = data.shelves || [];
  } catch (error) {
    state.shelves = [];
  }
}

async function persistShelves() {
  try {
    await api("/api/shelves/save", {
      method: "POST",
      body: JSON.stringify({ shelves: state.shelves }),
    });
  } catch (error) {
    showToast(error.message);
  }
}

function renderShelves() {
  const list = $("#shelfList");
  const pool = $("#shelfPool");
  if (!list || !pool) return;
  const shelves = state.shelves || [];
  const byName = new Map((state.files || []).map((f) => [f.localName, f]));
  const claimed = new Set(shelves.flatMap((s) => s.files));

  list.innerHTML = shelves.length
    ? shelves
        .map(
          (s) => `
      <section class="shelf-card" data-shelf="${escapeHtml(s.id)}">
        <div class="shelf-head">
          <span class="folder-icon"><span class="icon" data-icon="folder"></span></span>
          <input class="shelf-name" value="${escapeHtml(s.name)}" data-rename="${escapeHtml(s.id)}"
                 aria-label="폴더 이름" />
          <span class="shelf-count">${s.files.length}개</span>
          <button type="button" class="shelf-delete" data-del-shelf="${escapeHtml(s.id)}" title="폴더 삭제">✕</button>
        </div>
        <div class="shelf-drop" data-drop="${escapeHtml(s.id)}">
          ${
            s.files.length
              ? s.files
                  .map((name) => {
                    const f = byName.get(name);
                    return `<span class="shelf-chip" draggable="true" data-file="${escapeHtml(name)}" data-from="${escapeHtml(s.id)}">
                      ${escapeHtml(shortText(f?.name || name, 26))}
                      <button type="button" class="shelf-chip-x" data-out="${escapeHtml(name)}" data-shelf-id="${escapeHtml(s.id)}">✕</button>
                    </span>`;
                  })
                  .join("")
              : `<span class="shelf-empty">여기로 파일을 끌어다 놓으세요</span>`
          }
        </div>
      </section>`,
        )
        .join("")
    : `<p class="section-note">아직 만든 폴더가 없습니다. ‘폴더 만들기’로 시작해 보세요.</p>`;

  const unclaimed = (state.files || []).filter((f) => !claimed.has(f.localName)).slice(0, 120);
  pool.innerHTML = unclaimed.length
    ? unclaimed
        .map(
          (f) => `
      <span class="shelf-chip pool" draggable="true" data-file="${escapeHtml(f.localName)}" title="${escapeHtml(f.name)}">
        ${escapeHtml(shortText(f.name, 26))}
        <em>${escapeHtml(shortText(f.courseLabel || "", 14))}</em>
      </span>`,
        )
        .join("")
    : `<p class="section-note">모든 자료가 폴더에 담겨 있습니다.</p>`;

  installIcons(list);
}

function bindShelves() {
  const view = $("#shelfView");
  if (!view) return;

  $("#addShelfButton").addEventListener("click", async () => {
    const name = await uiPrompt("새 폴더 이름을 정해 주세요.", "새 폴더", { title: "폴더 만들기", icon: "folder", ok: "만들기" });
    if (name === null) return;
    state.shelves = [
      ...(state.shelves || []),
      { id: `shelf-${Date.now().toString(36)}`, name: name.trim() || "새 폴더", files: [], courses: [] },
    ];
    await persistShelves();
    renderShelves();
  });

  // 학기별 자동 정리
  $("#autoShelfButton").addEventListener("click", async () => {
    const groups = new Map();
    (state.files || []).forEach((f) => {
      const m = /\[\s*(\d{4})[_\s-]*(\d)\s*학기/.exec(f.course || "");
      const key = m ? `${m[1]}-${m[2]}학기` : null;
      if (!key) return;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(f.localName);
    });
    if (!groups.size) {
      showToast("학기 정보를 가진 자료가 없습니다.");
      return;
    }
    if (!(await uiConfirm(`학기 ${groups.size}개로 폴더를 만듭니다. 기존 폴더는 그대로 둡니다.`, { title: "학기별 폴더 만들기", icon: "folder", ok: "만들기" }))) return;
    const existing = new Set((state.shelves || []).map((s) => s.name));
    const added = [...groups.entries()]
      .filter(([name]) => !existing.has(name))
      .map(([name, files]) => ({
        id: `shelf-${name.replace(/\W/g, "")}-${Date.now().toString(36)}`,
        name,
        files,
        courses: [],
      }));
    if (!added.length) {
      showToast("이미 학기 폴더가 있습니다.");
      return;
    }
    state.shelves = [...(state.shelves || []), ...added];
    await persistShelves();
    renderShelves();
    showToast(`학기 폴더 ${added.length}개를 만들었습니다.`);
  });

  // 이름 변경
  view.addEventListener("change", async (event) => {
    const input = event.target.closest("[data-rename]");
    if (!input) return;
    const shelf = state.shelves.find((s) => s.id === input.dataset.rename);
    if (!shelf) return;
    shelf.name = input.value.trim() || "새 폴더";
    await persistShelves();
  });

  // 삭제 / 개별 빼기
  view.addEventListener("click", async (event) => {
    const del = event.target.closest("[data-del-shelf]");
    if (del) {
      const shelf = state.shelves.find((s) => s.id === del.dataset.delShelf);
      if (!shelf) return;
      if (!(await uiConfirm(`'${shelf.name}' 폴더를 지울까요?\n안에 담은 자료 파일은 지워지지 않아요.`, { title: "폴더 지우기", danger: true, ok: "지우기" }))) return;
      state.shelves = state.shelves.filter((s) => s.id !== del.dataset.delShelf);
      await persistShelves();
      renderShelves();
      return;
    }
    const out = event.target.closest("[data-out]");
    if (out) {
      const shelf = state.shelves.find((s) => s.id === out.dataset.shelfId);
      if (!shelf) return;
      shelf.files = shelf.files.filter((f) => f !== out.dataset.out);
      await persistShelves();
      renderShelves();
    }
  });

  // 끌어다 넣기
  view.addEventListener("dragstart", (event) => {
    const chip = event.target.closest(".shelf-chip");
    if (!chip) return;
    event.dataTransfer.setData("text/x-shelf-file", chip.dataset.file);
    event.dataTransfer.setData("text/x-shelf-from", chip.dataset.from || "");
    event.dataTransfer.effectAllowed = "move";
    chip.classList.add("dragging");
  });
  view.addEventListener("dragend", (event) => {
    event.target.closest(".shelf-chip")?.classList.remove("dragging");
  });
  view.addEventListener("dragover", (event) => {
    const zone = event.target.closest("[data-drop]");
    if (!zone) return;
    event.preventDefault();
    zone.classList.add("drag-over");
  });
  view.addEventListener("dragleave", (event) => {
    const zone = event.target.closest("[data-drop]");
    if (zone && !zone.contains(event.relatedTarget)) zone.classList.remove("drag-over");
  });
  view.addEventListener("drop", async (event) => {
    const zone = event.target.closest("[data-drop]");
    if (!zone) return;
    event.preventDefault();
    zone.classList.remove("drag-over");
    const file = event.dataTransfer.getData("text/x-shelf-file");
    const from = event.dataTransfer.getData("text/x-shelf-from");
    if (!file) return;
    const target = state.shelves.find((s) => s.id === zone.dataset.drop);
    if (!target || target.files.includes(file)) return;
    if (from) {
      const src = state.shelves.find((s) => s.id === from);
      if (src) src.files = src.files.filter((f) => f !== file);
    }
    target.files.push(file);
    await persistShelves();
    renderShelves();
  });
}

function renderFiles() {
  // 앞 150개만 그리던 제한이 과목을 통째로 숨겼다.
  // 자료가 277개인데 정렬이 과목 이름순이라, M 으로 시작하는
  // Multivariable Calculus(258번째~)는 화면에 아예 안 나왔다.
  // 폴더 보기는 과목별로 묶기만 하므로 전부 그려도 가볍다.
  // 표(리스트) 보기만 성능 때문에 처음엔 400줄까지 그린다. 예전엔 그 뒤를 말없이 버려서
  // 자료가 400개를 넘으면(지금 약 360개) 뒤쪽 자료가 표에서 그냥 사라졌다.
  // 이제 남은 수를 알리고 '나머지 N개 더 보기' 로 전부 그린다.
  const FILE_TABLE_FIRST = 400;
  const all = filteredFiles();
  const table = $("#filesTable");
  const empty = $("#emptyState");
  const mode = state.fileMode || "list";
  const rows = mode === "list" && !state.fileTableAll ? all.slice(0, FILE_TABLE_FIRST) : all;
  const hiddenRows = all.length - rows.length;
  if (mode === "folder" || mode === "shelf") {
    // 폴더 보기에도 선택이 있으므로, 리스트 보기와 똑같이
    // 화면에 없는 파일은 선택에서 빼고 일괄 작업 버튼 상태를 맞춘다.
    // (예전에는 여기서 바로 빠져나가 버튼이 계속 꺼져 있었다)
    const shown = new Set(rows.filter((f) => f.status === "local").map((f) => f.localName));
    [...state.selectedFiles].forEach((name) => {
      if (!shown.has(name)) state.selectedFiles.delete(name);
    });
    renderFolderView(rows);
    table.innerHTML = "";
    applyFileMode();
    if (empty) empty.hidden = rows.length > 0;
    updateBulkSaveButton();
    return;
  }
  applyFileMode();

  // 화면에 없는 파일은 선택에서 제거
  const visible = new Set(rows.filter((f) => f.status === "local").map((f) => f.localName));
  [...state.selectedFiles].forEach((name) => {
    if (!visible.has(name)) state.selectedFiles.delete(name);
  });

  table.innerHTML = rows
    .map(
      (file) => `
        <tr>
          <td class="check-col">
            <input type="checkbox" data-pick="${escapeHtml(file.localName)}"
              ${state.selectedFiles.has(file.localName) ? "checked" : ""}
              ${file.status === "local" ? "" : "disabled"}
              aria-label="파일 선택" />
          </td>
          <td>
            <div class="file-name">
              <span class="file-type-icon">${iconHtml("file")}</span>
              <span title="${escapeHtml(file.name)}">${escapeHtml(shortText(file.name, 54))}</span>
            </div>
          </td>
          <td title="${escapeHtml(file.course)}">${escapeHtml(shortText(file.courseLabel, 34))}</td>
          <td class="cell-muted">${escapeHtml(shortText(file.folder || "강의 자료", 34))}</td>
          <td class="cell-muted">${escapeHtml(file.type)}</td>
          <td><span class="status-badge ${file.status}">${statusLabel(file.status)}</span></td>
          <td>
            <button class="save-file-button" data-save="${escapeHtml(file.localName)}"
              ${file.status === "local" ? "" : "disabled"}
              title="${file.status === "local" ? "내 컴퓨터 다운로드 폴더에 저장" : "로컬에 없는 파일입니다. 먼저 동기화해 주세요."}">
              ${iconHtml("download")}저장
            </button>
          </td>
        </tr>
      `,
    )
    .join("") +
    (hiddenRows > 0
      ? `<tr class="file-more-row"><td colspan="7">
           <button type="button" class="button compact ghost" data-file-more>나머지 ${hiddenRows}개 더 보기</button>
         </td></tr>`
      : "");

  empty.hidden = rows.length > 0;
  bindFileTableOnce(table);
  updateBulkSaveButton();
  syncSelectAllState();
}

/* 표의 클릭은 표 하나에 한 번만 건다.
   예전에는 줄마다 리스너 3개(저장·체크·행)를 새로 달아서 268줄이면 800개였다. */
function bindFileTableOnce(table) {
  if (table.dataset.bound) return;
  table.dataset.bound = "1";

  const pickables = () => [...table.querySelectorAll("[data-pick]:not([disabled])")];
  const setPicked = (checkbox, picked) => {
    checkbox.checked = picked;
    if (picked) state.selectedFiles.add(checkbox.dataset.pick);
    else state.selectedFiles.delete(checkbox.dataset.pick);
  };

  table.addEventListener("click", (event) => {
    // 처음 400줄 뒤의 '나머지 N개 더 보기': 이번 실행 동안은 표를 전부 그린다
    if (event.target.closest("[data-file-more]")) {
      state.fileTableAll = true;
      renderFiles();
      return;
    }
    const saveBtn = event.target.closest("[data-save]");
    if (saveBtn) {
      if (!saveBtn.disabled) saveFilesToComputer(saveBtn.dataset.save);
      return;
    }
    const checkbox = event.target.closest("[data-pick]");
    if (checkbox) {
      if (checkbox.disabled) return;
      const list = pickables();
      const index = list.indexOf(checkbox);
      const picked = checkbox.checked; // 클릭 후 상태
      // Shift+클릭: 직전 클릭 위치부터 범위 선택 / 해제
      if (event.shiftKey && state.lastPickIndex !== null && state.lastPickIndex !== index) {
        const [from, to] = [Math.min(state.lastPickIndex, index), Math.max(state.lastPickIndex, index)];
        for (let i = from; i <= to; i += 1) setPicked(list[i], picked);
      } else {
        setPicked(checkbox, picked);
      }
      state.lastPickIndex = index;
      updateBulkSaveButton();
      syncSelectAllState();
      return;
    }
    // Ctrl/Cmd+클릭(행 아무 곳): 해당 행 선택 토글
    if (!(event.ctrlKey || event.metaKey)) return;
    const row = event.target.closest("tr");
    const box = row?.querySelector("[data-pick]:not([disabled])");
    if (!box) return;
    event.preventDefault();
    setPicked(box, !box.checked);
    state.lastPickIndex = pickables().indexOf(box);
    updateBulkSaveButton();
    syncSelectAllState();
  });
}

function syncSelectAllState() {
  const selectAll = $("#selectAllFiles");
  if (!selectAll) return;
  const pickable = [...document.querySelectorAll('#filesTable [data-pick]:not([disabled])')];
  selectAll.checked = pickable.length > 0 && pickable.every((box) => box.checked);
}

/* ===== 작업/로그 ===== */
/* ===== 작업 진행 단계 추정 =====
   백엔드가 퍼센트를 주지 않으므로, 실행 로그의 단계 문구를 뒤에서부터 훑어
   "지금 무엇을 하는 중인지"와 대략의 진행률을 사람 말로 보여 준다. */
const TASK_STAGES = [
  { re: /모든 작업 완료|작업이 종료/, label: "마무리하는 중", pct: 96 },
  { re: /Drive 동기화 시작|Drive 과목 폴더/, label: "구글 드라이브에 올리는 중", pct: 82 },
  { re: /Gemini 분류 완료/, label: "메일 분류를 마치는 중", pct: 78 },
  { re: /과제 마감일/, label: "과제 마감일 정리하는 중", pct: 66 },
  { re: /다운로드 완료/, label: "강의자료 받는 중", pct: 52 },
  { re: /강의 확인 중/, label: "과목별 자료 확인하는 중", pct: 38 },
  { re: /강의 목록 수집/, label: "강의 목록 불러오는 중", pct: 24 },
  { re: /로그인 완료/, label: "로그인 완료", pct: 14 },
];

function taskProgress(task) {
  const logs = task.logs || [];
  const kindLabel = { emails: "메일을 읽는 중", deadlines: "마감을 확인하는 중", verify: "설정을 점검하는 중" };
  let stage = { label: kindLabel[task.kind] || "준비하는 중", pct: 8 };
  for (let i = logs.length - 1; i >= 0 && stage.pct === 8; i -= 1) {
    const hit = TASK_STAGES.find((s) => s.re.test(logs[i]));
    if (hit) stage = hit;
  }
  const files = logs.filter((l) => /다운로드 완료/.test(l)).length;
  const courses = logs.filter((l) => /강의 확인 중/.test(l)).length;
  const detail = [
    courses ? `과목 ${courses}개` : "",
    files ? `자료 ${files}개` : "",
  ].filter(Boolean).join(" · ");
  return { ...stage, detail };
}

/* 위쪽 떠 있는 진행 막대. 사용자가 시킨 일만 보여 준다.
   자동 마감·메일 확인까지 띄우니 '메일만 가져오는데 왜 유난이냐' 는 말을 들었다. 자동 작업은 설정의 실행 기록에만 남는다.
   작업은 두 칸(본 칸 = 자료·마감, 메일 칸)에서 따로 돌 수 있다(web_ui.task_key). 막대를 띄운 칸을
   state.taskBar 에 기억해 그 칸이 끝나면 '완료' 를 보여 주고, 삼성 노트·내 컴퓨터 저장 막대는 건드리지 않는다. */
function renderTaskBar(task, labels) {
  if (state.notesJob?.running) return; // 삼성 노트를 넣는 중이면 그쪽이 막대를 쓴다
  const lanes = { main: task, mail: task.mail || {} };
  const labelOf = (t) => labels[t.kind] || "작업";
  const pick = ["main", "mail"]
    .filter((k) => lanes[k].running && !lanes[k].auto)
    .sort((a, b) => String(lanes[b].startedAt || "").localeCompare(String(lanes[a].startedAt || "")))[0];
  if (pick) {
    const p = taskProgress(lanes[pick]);
    const other = pick === "main" ? lanes.mail : lanes.main;
    const more = other.running && !other.auto ? ` 외 1개` : "";
    showTopProgress(`${labelOf(lanes[pick])}${more} · ${p.label}`, p.pct);
    state.taskBar = pick;
    return;
  }
  if (task.running && task.auto && task.queued) {
    // 자동 작업이 끝나기를 기다리는 동안엔 시킨 일만 '곧 시작' 으로
    showTopProgress(`${labels[task.queued.kind] || "작업"} · 곧 시작해요`, 4);
    state.taskBar = "main";
    return;
  }
  if (state.taskBar) {
    const done = lanes[state.taskBar];
    state.taskBar = null;
    if (!done.auto && done.returnCode !== null && done.returnCode !== undefined) {
      finishTopProgress(done.returnCode === 0 ? `${labelOf(done)} 완료` : `${labelOf(done)} 실패`);
    } else {
      hideTopProgress();
    }
  }
}

function renderTask(task) {
  state.task = task;
  const logBox = $("#logBox");
  const logs = task.logs || [];
  const labels = {
    sync: "동기화",
    verify: "검증",
    deadlines: "마감·일정 새로고침",
    emails: "메일 새로고침",
    "google-oauth": "Google OAuth",
  };
  // 5분 주기 자동 확인이면 그렇게 보이게 한다.
  // 안 그러면 자료 동기화 직후에 도는 자동 메일 확인이
  // '내가 안 시킨 이메일 동기화' 처럼 보인다.
  const taskLabel = (task.auto ? "자동 " : "") + (labels[task.kind] || "작업");
  /* 이 버튼들은 화면마다 있을 수도, 없을 수도 있다.
     ('마감 새로고침'은 없앴고 '지금 동기화'는 자료 화면으로 옮겼다) */
  const runButton = $("#runButton");
  // 메일 칸이 직접 시킨 것이거나 30초 넘게 돌면(서버가 응답을 안 줄 때) 멈출 수 있게 한다.
  // 5분마다 도는 자동 확인은 금방 끝나니 그때마다 버튼이 깜빡이지 않게 뺀다.
  const mailLong = Boolean(task.mail?.running) &&
    (!task.mail.auto || Date.now() - new Date(task.mail.startedAt || Date.now()).getTime() > 30000);
  const busy = Boolean(task.running) || mailLong;
  const refreshButton = $("#refreshAllButton");
  // 메일은 따로 도는 칸이라, 메일함에서는 메일 작업만 보고 버튼을 막는다
  const mailView = ["emails", "compose"].includes(state.view);
  if (refreshButton) refreshButton.disabled = mailView ? Boolean(task.mail?.running) : busy;
  /* 동기화 시작은 위쪽 '자료 새로고침' 하나로 모았다. 이 버튼은 돌고 있는 작업을
     멈추는 용도로만 남기고, 놀고 있을 때는 감춘다 (같은 일 하는 버튼을 둘 두지 않으려고). */
  if (runButton) {
    runButton.hidden = !busy;
    if (busy) {
      runButton.innerHTML = '<span class="icon" data-icon="x"></span>작업 중지';
      runButton.classList.add("danger");
      runButton.classList.remove("primary");
      installIcons(runButton);
    }
  }

  // 진행 표시: 실행 중에는 단계 문구 + 막대, 끝나면 결과 한 줄 (설정의 실행 기록 칸)
  const progressWrap = $("#taskProgress");
  if (task.running) {
    const p = taskProgress(task);
    $("#taskSummary").textContent = `${taskLabel} 진행 중`;
    $("#taskStageLabel").textContent = p.label;
    $("#taskStageDetail").textContent = p.detail;
    $("#taskProgressFill").style.width = `${p.pct}%`;
    progressWrap.hidden = false;
  } else {
    progressWrap.hidden = true;
    $("#taskSummary").textContent =
      task.returnCode === null
        ? "대기 중"
        : task.returnCode === 0
          ? `${taskLabel} 완료`
          : `${taskLabel} 실패 (코드 ${task.returnCode})`;
  }
  renderTaskBar(task, labels);
  if (!logs.length) {
    logBox.innerHTML = '<div class="log-line">아직 실행 로그가 없습니다.</div>';
    return;
  }

  logBox.innerHTML = logs
    .slice(-80)
    .map((line) => `<div class="log-line">${escapeHtml(line)}</div>`)
    .join("");
  logBox.scrollTop = logBox.scrollHeight;
}

/* ===== 데이터 로드 ===== */
/* 3.5초마다 화면 전체를 다시 그리면 목록이 통째로 새로 만들어지면서
   버벅이고, 커서를 올려 둔 것이나 스크롤 위치도 날아간다.
   그래서 (1) 값이 실제로 바뀐 부분만 그리고,
   (2) 지금 보고 있는 화면만 그린다. */
/* 무엇이 바뀌었는지 재는 '표식'.
   목록 전체를 JSON으로 만들어 비교하면(메일은 100KB가 넘는다)
   비교하느라 더 느려진다. 개수와 갱신시각처럼 싼 값만 쓴다. */
const sig = (...parts) => parts.join("|");
const listSig = (arr) => (Array.isArray(arr) ? `${arr.length}:${arr[arr.length - 1]?.id || ""}` : "0");

const RENDER_PARTS = [
  { key: "status", render: renderStatus,
    of: (s) => sig(s.status?.lastRun, s.status?.running, listSig(s.status?.courses)) },
  { key: "upcoming", views: ["dashboard"], render: renderUpcoming,
    of: (s) => sig(s.deadlines?.updatedAt, (s.deadlines?.items || []).length, (s.selection?.hiddenDeadlines || []).length) },
  { key: "events", views: ["dashboard"], render: renderEvents,
    of: (s) => sig(s.emails?.updatedAt, (s.myEvents || []).length, s.deadlines?.updatedAt, (s.academic || []).length,
      (s.schoolEvents || []).length, s.academicUnderOnly, new Date().toDateString()) },
  { key: "deadlineFilters", views: ["deadlines"], render: renderDeadlineFilters,
    of: (s) => sig(s.deadlines?.updatedAt, (s.deadlines?.items || []).length) },
  { key: "deadlines", views: ["deadlines"], render: renderDeadlines,
    of: (s) => sig(s.deadlines?.updatedAt, (s.deadlines?.items || []).length,
      (s.selection?.hiddenDeadlines || []).length, s.search, s.deadlineCourse, s.deadlineStatus) },
  { key: "emails", views: ["emails", "compose"], render: renderEmails,
    of: (s) => sig(s.emails?.updatedAt, (s.emails?.emails || []).length, s.emailView, s.emailFolder, s.emailSort, s.search) },
  { key: "calendar", views: ["calendar"], render: renderCalendar,
    of: (s) => sig(s.deadlines?.updatedAt, (s.myEvents || []).length, (s.academic || []).length, (s.schoolEvents || []).length,
      s.academicUnderOnly, s.calMonth, s.showHolidays, s.emails?.updatedAt,
      (s.emails?.emails || []).filter((m) => m.calendar).length) },
  { key: "courses", views: ["courses"], render: renderCourses,
    of: (s) => sig(listSig(s.status?.courses), JSON.stringify(s.selection?.courses || {}).length,
      (s.files || []).length, s.courseEditMode) },
  { key: "courseFilter", views: ["files"], render: renderCourseFilter,
    of: (s) => sig((s.files || []).length) },
  { key: "files", views: ["files"], render: renderFiles,
    of: (s) => sig((s.files || []).length, s.search, s.fileView, s.fileCourse, s.fileStatus) },
  { key: "health", render: renderHealth,
    of: (s) => sig(s.health?.warning, s.health?.consecutiveFailures, JSON.stringify(s.health?.lastSuccess || {})) },
  { key: "quicklinks", views: ["dashboard"], render: renderQuicklinks, of: (s) => sig(s.quicklinksAll) },
  { key: "shuttle", views: ["storage"], render: renderShuttle,
    of: (s) => sig((s.shuttle || []).length, s.shuttleGroup) },
  { key: "fglp", views: ["storage"], render: renderFglp, of: () => "1" },
  { key: "timetable", views: ["dashboard"], render: renderTimetable,
    of: (s) => sig(listSig(s.timetable), s.ttShowSat) },
  { key: "demo", render: renderDemoPill,
    of: (s) => sig(s.status?.demo?.available, s.status?.requiredConfig?.lms) },
];

const renderSigns = new Map();

function renderAll(force = false) {
  // 끌어 옮기는 중에는 다시 그리지 않는다. 그리면 잡고 있던 것이 끊긴다.
  if (!force && document.body.classList.contains("dash-dragging-now")) return;

  let changed = false;
  for (const part of RENDER_PARTS) {
    // 지금 안 보는 화면은 값만 기억해 두고, 그 화면으로 갈 때 그린다
    const visible = !part.views || part.views.includes(state.view);
    let sign;
    try {
      sign = String(part.of(state));
    } catch (error) {
      sign = String(Math.random());
    }
    const stale = renderSigns.get(part.key) !== sign;
    if (!force && !stale && renderedViews.has(part.key)) continue;
    if (!visible) {
      // 값이 바뀐 건 기록하되, 그리지는 않는다
      if (stale) renderedViews.delete(part.key);
      continue;
    }
    renderSigns.set(part.key, sign);
    renderedViews.add(part.key);
    part.render();
    changed = true;
  }
  if (changed) invalidateMetricPeek();
  // 접어 둔 블록의 요약 줄도 값이 바뀌면 갱신한다
  if (state.dashFold) applyFold();
}

// 그려 둔 적이 있는 부분 (화면을 바꿔 처음 보일 때는 반드시 한 번 그린다)
const renderedViews = new Set();

/** 화면을 바꿨을 때, 그 화면에 필요한 것을 그린다 */
function renderCurrentView() {
  RENDER_PARTS.forEach((part) => {
    if (part.views && part.views.includes(state.view)) renderedViews.delete(part.key);
  });
  renderAll();
}

/* ===== 캘린더 화면 ===== */

/* ===== 반복·여러 날 일정 펼치기 =====
   저장은 규칙 한 줄("매주", "9/1~9/5")로 하고, 달력에 그릴 때만 날짜로 편다.
   규칙을 날짜마다 복사해 저장하면 나중에 고칠 때 전부 손봐야 한다. */
const DAY_MS = 86400000;

function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseYmd(s) {
  const [y, m, d] = String(s || "").split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** 한 일정이 실제로 걸치는 날짜들. 너무 많이 펴지 않게 상한을 둔다. */
function expandEvent(ev, limit = 400) {
  const start = parseYmd(ev.date);
  if (!start) return [];

  // 여러 날짜에 걸치면 그 사이를 모두 채운다
  const spanEnd = parseYmd(ev.endDate);
  const spanDays =
    spanEnd && spanEnd > start ? Math.min(Math.round((spanEnd - start) / DAY_MS), 366) : 0;

  const repeat = ev.repeat || "";
  if (!repeat) {
    return Array.from({ length: spanDays + 1 }, (_, i) => ymd(new Date(start.getTime() + i * DAY_MS)));
  }

  // 반복 끝. 안 적었으면 1년.
  const until = parseYmd(ev.repeatUntil) || new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());
  const dates = [];
  let cur = new Date(start);
  let guard = 0;
  while (cur <= until && dates.length < limit && guard < 1000) {
    guard += 1;
    for (let i = 0; i <= spanDays; i += 1) {
      dates.push(ymd(new Date(cur.getTime() + i * DAY_MS)));
    }
    if (repeat === "daily") cur = new Date(cur.getTime() + DAY_MS);
    else if (repeat === "weekly") cur = new Date(cur.getTime() + 7 * DAY_MS);
    else if (repeat === "biweekly") cur = new Date(cur.getTime() + 14 * DAY_MS);
    else if (repeat === "monthly") cur = new Date(cur.getFullYear(), cur.getMonth() + 1, cur.getDate());
    else if (repeat === "yearly") cur = new Date(cur.getFullYear() + 1, cur.getMonth(), cur.getDate());
    else break;
  }
  return dates;
}

const REPEAT_LABEL = {
  daily: "매일",
  weekly: "매주",
  biweekly: "2주마다",
  monthly: "매월",
  yearly: "매년",
};

/* 메일 제목을 캘린더 칸에 맞게: 앞 꼬리표([총학생회] <장소 수정>)와 ' / 영어 제목' 을 뗀다 */
function mailEventTitle(subject) {
  let text = String(subject || "").split(" / ")[0];
  text = text.replace(/^\s*(re|fw|fwd)\s*:\s*/i, "");
  for (let i = 0; i < 3; i += 1) text = text.replace(/^\s*(\[[^\]]*\]|<[^>]*>|\([^)]*\))\s*/, "");
  return text.trim() || String(subject || "");
}

/* 달력 칸에 들어갈 짧은 이름.
   실제 제목이 "4:30PM Sep 15, PHCH Fall Seminar…" / "Fall 2026 New Biology Seminar (Sep.15…" 처럼
   날짜·시간으로 시작해 칸에 "4:30P…" 만 보였다. 날짜·연도·"개최 안내"를 떼고,
   영어 제목이거나 남는 게 "세미나"뿐이면 [학과] 꼬리표를 이름으로 쓴다. */
const EVENT_WORD_RE = /세미나|특강|축제|행사|제$|설명회|워크숍|콜로키움|포럼|seminar|colloquium|lecture|festival|forum|workshop/i;
function eventShortTitle(subject) {
  const raw = String(subject || "").replace(/^\s*(re|fw|fwd)\s*:\s*/i, "");
  let s = raw.split(/\s\/\s/)[0];
  let tag = "";
  for (let i = 0; i < 4; i += 1) {
    const m = s.match(/^\s*(\[[^\]]*\]|<[^>]*>|＜[^＞>]*[＞>]|\([^)]*\))\s*/);
    if (!m) break;
    const inner = m[1].slice(1, -1).trim();
    // [수강생 모집 중; #무료세미나…] 같은 광고 꼬리표는 이름으로 안 쓴다
    if (!tag && m[1][0] === "[" && inner.length <= 24 && !/[#;]/.test(inner)) tag = inner.split("_").pop().trim();
    s = s.slice(m[0].length);
  }
  const english = !/[가-힣]/.test(s);
  let t = s
    .replace(/^\d{1,2}(:\d{2})?\s*[AP]M\s+[A-Za-z]{3,9}\.?\s*\d{1,2},?\s*/i, "")
    .replace(/\b(Fall|Spring|Summer|Winter)\s+20\d\d\s*/i, "")
    .replace(/20\d\d(학년도|년)?\s*/g, "")
    .replace(/(가을|봄|여름|겨울)학기\s*/g, "")
    .replace(/DGIST\s*/g, "")
    .replace(/제\s?\d+\s?(회|차)\s*/g, "")
    .replace(/Dept\.\s*of\s*/i, "")
    .replace(/_/g, " ");
  t = t.split(/\s[-–—]\s|[(（＜<「]|,\s|\s및\s/)[0];
  t = t.replace(/\s*(종합\s*)?(개최\s*|참가\s*신청\s*|진행\s*)?안내\s*$/, "").replace(/\s*(행사\s*)?진행$/, "").trim();
  if (tag) {
    // 영어 꼬리표 [Seminar] [BS Colloquium] 도 그 자체가 행사 이름이다. 한글만 봐서 'Seminar 세미나' 가 됐다(2026-10-15).
    // 덧붙이는 말도 꼬리표 말을 따른다: [PHCH] → 'PHCH Seminar', [물리학과] → '물리학과 세미나'
    const tagIsEvent = /세미나|특강|행사/.test(tag)
      || /\b(seminar|colloquium|lecture|talk|symposium|workshop|forum|conference)s?\b/i.test(tag);
    const suffix = /seminar|세미나/i.test(raw) ? (/[가-힣]/.test(tag) ? " 세미나" : " Seminar") : "";
    const tagLabel = tagIsEvent ? tag : `${tag}${suffix}`;
    if (english || !t || !EVENT_WORD_RE.test(t)) return tagLabel;
    if (/^(특별)?(세미나|특강|행사)$/.test(t)) return `${tag} ${t}`;
  }
  return t || mailEventTitle(subject);
}

/** 세미나 메일에서 뽑은 연사·발표 제목 (서버 email_reader.guess_seminar_info). 장소는 아래 줄(sub)에 들어간다. */
function seminarInfoHtml(s) {
  const row = (label, value) =>
    value ? `<span class="sem-row"><b>${escapeHtml(label)}</b>${escapeHtml(value)}</span>` : "";
  return `<span class="sem-info">${row("연사", s.speaker)}${row("발표", s.title)}</span>`;
}

function calendarItems() {
  // 과제 마감 + 메일 이벤트(eventDate) 합치기
  const items = [];
  (state.deadlines.items || []).forEach((d) => {
    const due = parseDue(d);
    if (!due) return;
    items.push({
      date: due,
      title: d.name,
      sub: d.courseLabel || d.course,
      kind: isSubmitted(d) ? "done" : "deadline",
    });
  });
  // 메일로 온 행사: 관심 분야 세미나와 학교 전체 행사(달빛제 등)만. 서버가 calendar 로 골라 준다.
  (state.emails.emails || []).forEach((m) => {
    if (!m.eventDate || m.calendar === false) return;
    const dt = new Date(m.eventDate);
    if (Number.isNaN(dt.getTime())) return;
    // 학교 전체 행사(달빛제)와 관심 세미나는 색을 나눈다. 둘 다 '메일 일정' 한 색이라 마감과도 헷갈렸다.
    // '세미나 · 관심: 세미나' 처럼 겹치면 관심 단어는 뺀다
    const hits = (m.interestHits || []).filter((w) => !/^(세미나|seminar)$/i.test(w));
    const why = hits.length && !m.schoolEvent ? `관심: ${hits.join(", ")}` : "";
    // 여러 날 행사(eventEnd, 예: '10월 14일부터 20일까지')는 걸치는 날마다 하나씩 (최대 2주)
    // 본문에 날짜를 하나하나 적었으면(eventDays) 그 날만: 주말을 쉬는 일정을 토·일까지 칠하지 않는다
    let multiTotal = 0;
    if (m.eventEnd) {
      const last = new Date(`${m.eventEnd}T00:00`);
      const day0 = new Date(dt);
      day0.setHours(0, 0, 0, 0);
      const span = Math.round((last - day0) / 86400000) + 1;
      const offsets = (m.eventDays || []).length
        ? m.eventDays.map((s) => Math.round((new Date(`${s}T00:00`) - day0) / 86400000))
        : Array.from({ length: Math.min(span, 15) }, (_, i) => i);
      const total = offsets.length;
      multiTotal = total;
      offsets.forEach((offset, k) => {
        if (offset <= 0 || offset > 14) return;
        const d = new Date(dt);
        d.setDate(d.getDate() + offset);
        const n = k;
        items.push({
          date: d,
          title: m.summary || eventShortTitle(m.subject),
          full: String(m.subject || "").replace(/^\s*(re|fw|fwd)\s*:\s*/i, "").split(" / ")[0].trim(),
          sub: [`${n + 1}/${total}일째`, m.seminar?.place, m.fromName || m.fromEmail].filter(Boolean).join(" · "),
          kind: m.schoolEvent ? "school" : "event",
          seminar: m.seminar && (m.seminar.speaker || m.seminar.title) ? m.seminar : null,
          mailId: m.id,
          allDay: !String(m.eventDate).includes("T"),
        });
      });
    }
    items.push({
      date: dt,
      title: m.summary || eventShortTitle(m.subject),
      full: String(m.subject || "").replace(/^\s*(re|fw|fwd)\s*:\s*/i, "").split(" / ")[0].trim(),
      sub: [multiTotal > 1 ? `1/${multiTotal}일째` : "", m.seminar?.place, why, m.fromName || m.fromEmail].filter(Boolean).join(" · "),
      kind: m.schoolEvent ? "school" : "event",
      seminar: m.seminar && (m.seminar.speaker || m.seminar.title) ? m.seminar : null,
      mailId: m.id,
      allDay: !String(m.eventDate).includes("T"),
    });
  });
  // 학교 공식 행사(공공데이터 API). 여러 날이면 날마다 하나씩.
  (state.schoolEvents || []).forEach((ev) => {
    if (!ev.start) return;
    const start = new Date(`${ev.start}T00:00`);
    const end = new Date(`${ev.end || ev.start}T00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
    for (let d = new Date(start), n = 0; d <= end && n < 14; d.setDate(d.getDate() + 1), n += 1) {
      const day = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
      items.push({
        date: new Date(`${day}T${ev.time || "00:00"}`),
        title: ev.title,
        full: ev.title,
        sub: [ev.place, ev.host].filter(Boolean).join(" · "),
        kind: "school",
        allDay: !ev.time,
      });
    }
  });
  // 내가 직접 추가한 일정. 반복·여러 날이면 걸치는 날마다 하나씩 놓는다.
  (state.myEvents || []).forEach((e) => {
    expandEvent(e).forEach((day) => {
      const dt = new Date(`${day}T${e.time || "00:00"}`);
      if (Number.isNaN(dt.getTime())) return;
      const marks = [];
      if (e.repeat) marks.push(REPEAT_LABEL[e.repeat] || "반복");
      if (e.location) marks.push(e.location);
      items.push({
        date: dt,
        title: e.title,
        sub: marks.join(" · ") || e.note || "",
        kind: "mine",
        eventId: e.id,
        allDay: !e.time,
        repeat: e.repeat || "",
      });
    });
  });
  // 학교 학사일정 (수강신청·성적확인 같은 것)
  // 하루짜리만 칸 안의 칩으로 넣는다.
  // 여러 날에 걸친 것은 calendarSpans()가 이어진 막대로 그린다.
  academicShown()
    .forEach((e) => {
      const start = new Date(`${e.start}T00:00`);
      if (Number.isNaN(start.getTime())) return;
      if ((e.end || e.start) !== e.start) return;
      items.push({
        date: start,
        title: e.title,
        sub: e.kind === "공통" ? "학사일정" : `학사일정 · ${e.kind}`,
        kind: "academic",
        allDay: true,
      });
    });
  return items;
}

function renderCalendar() {
  const grid = $("#calendarGrid");
  if (!grid) return;
  if (!state.calMonth) {
    const now = new Date();
    state.calMonth = { y: now.getFullYear(), m: now.getMonth() };
  }
  const { y, m } = state.calMonth;
  $("#calendarTitle").textContent = `${y}년 ${m + 1}월`;

  const items = calendarItems();
  const byDay = {};
  items.forEach((it) => {
    if (it.date.getFullYear() === y && it.date.getMonth() === m) {
      const d = it.date.getDate();
      (byDay[d] = byDay[d] || []).push(it);
    }
  });

  const first = new Date(y, m, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const today = new Date();
  const isToday = (d) => today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;

  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  let html = weekdays
    .map((w, i) => `<div class="cal-weekday ${i === 0 ? "sun" : i === 6 ? "sat" : ""}">${w}</div>`)
    .join("");
  for (let i = 0; i < startDow; i += 1) html += `<div class="cal-cell empty"></div>`;

  // 여러 날에 걸친 학사일정을 이어진 막대로
  const { segments, laneCount } = calendarSpans(y, m, startDow, daysInMonth);
  const spansByDay = new Map();
  segments.forEach((seg) => {
    const list = spansByDay.get(seg.day) || [];
    list.push(seg);
    spansByDay.set(seg.day, list);
  });
  // 삼성 캘린더처럼 칸 안에 일정 제목을 간략히 표시 (넘치면 +N)
  const MAX_CHIPS = 3;
  for (let d = 1; d <= daysInMonth; d += 1) {
    const dayItems = byDay[d] || [];
    const chips = dayItems
      .slice(0, MAX_CHIPS)
      .map(
        (it) =>
          `<span class="cal-chip cal-${it.kind}" title="${escapeHtml(it.full || it.title || "")}">${escapeHtml(
            // 보라색이 곧 '세미나'라 칸에서는 꼬리를 떼고 학과 이름이 더 보이게 한다
            shortText((it.kind === "event" && (it.title || "").replace(/\s+(세미나|seminar)$/i, "")) || it.title || "", 14),
          )}</span>`,
      )
      .join("");
    const more =
      dayItems.length > MAX_CHIPS ? `<span class="cal-more">+${dayItems.length - MAX_CHIPS}</span>` : "";
    const dow = new Date(y, m, d).getDay();
    const holiday = state.showHolidays ? holidayName(y, m + 1, d) : null;
    // 일요일·공휴일은 빨강, 토요일은 파랑
    const dayTone = holiday || dow === 0 ? "sun" : dow === 6 ? "sat" : "";
    const week = Math.floor((startDow + d - 1) / 7);
    const lanes = laneCount.get(week) || 0;
    const bars = (spansByDay.get(d) || [])
      .map(
        (seg) => `
        <span class="cal-span kind-${escapeHtml(seg.kind || "공통")}${seg.openStart ? " open-start" : ""}${seg.openEnd ? " open-end" : ""}"
              style="--span:${seg.length}; --lane:${seg.lane}"
              title="${escapeHtml(seg.title)} (${escapeHtml(seg.start)} ~ ${escapeHtml(seg.end)})">
          ${escapeHtml(seg.title)}
        </span>`,
      )
      .join("");
    html += `
      <div class="cal-cell ${isToday(d) ? "today" : ""} ${state.calSelected === d ? "selected" : ""} ${dayTone}" data-day="${d}" style="--lanes:${lanes}">
        <span class="cal-daynum">${d}</span>
        ${holiday ? `<span class="cal-holiday" title="${escapeHtml(holiday)}">${escapeHtml(shortText(holiday, 7))}</span>` : ""}
        ${bars}
        <span class="cal-chips">${chips}${more}</span>
      </div>`;
  }
  grid.innerHTML = html;
  installIcons(grid);

  // 선택된 날짜(없으면 오늘 또는 첫 일정일) 상세 목록
  renderCalendarDayList(byDay);
}

/* ===== 여러 날에 걸친 일정을 막대로 잇기 =====
   날마다 같은 제목을 반복해 찍으면 달력이 지저분하다.
   다른 캘린더들처럼 시작일부터 종료일까지 하나의 막대로 잇는다.
   달력은 7칸 그리드라, 주가 바뀌는 지점에서 막대를 끊어 이어 붙인다. */
/* 달력·대시보드에 보일 학사일정만 고른다 (2026-10-14 사용자: '쓸데없는 일정은 걸러 줘').
   - 학생이 할 일이 없는 행정 기간은 뺀다: 사진변경신청·학적기본정정·강의계획서작성·성적입력·미완성적처리.
     사진변경신청기간은 거의 한 해 내내 걸쳐 달력 맨 위를 늘 차지했다.
   - '수업일수(2/4이후 ~ 3/4)' 같은 구간 막대는 빼고, 하루짜리 '수업일수 2/4선' 같은 날짜 표시만 남긴다.
   - 대학·대학원(·공통)에 같은 이름·같은 날짜로 두 번 실린 것은 하나로. */
const ACADEMIC_NOISE = /(사진\s*변경|학적\s*기본\s*정정|강의\s*계획서\s*작성|성적\s*입력|미완성적)/;
function academicShown() {
  const seen = new Set();
  return (state.academic || []).filter((e) => {
    if (state.academicUnderOnly && e.kind === "대학원") return false;
    const title = String(e.title || "");
    if (ACADEMIC_NOISE.test(title)) return false;
    const span = (e.end || e.start) !== e.start;
    if (span && /^수업일수\s*\(/.test(title)) return false;
    const key = `${title.replace(/\s+/g, "")}|${e.start}|${e.end || e.start}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).filter((e, i, list) => {
    // 같은 날짜에 같은 일을 다른 이름으로 두 번 싣는다('대학 및 대학원 중간시험' = '중간고사기간',
    // '2학기 강의평가' = '강의평가기간'). 주제가 같으면 이름이 짧은 쪽 하나만 남긴다.
    const t = academicTopic(e.title);
    if (!t) return true;
    const end = e.end || e.start;
    return !list.some((o, j) => {
      if (j === i || o.start !== e.start || (o.end || o.start) !== end || academicTopic(o.title) !== t) return false;
      const a = String(e.title).length, b = String(o.title).length;
      return b < a || (b === a && j < i);
    });
  });
}
// 순서가 중요하다: '수강신청 변경' 은 수강신청보다 수강변경으로 먼저 잡아야 한다
const ACADEMIC_TOPICS = [
  ["exam", /시험|고사/],
  ["eval", /강의\s*평가/],
  ["change", /수강\s*(신청\s*)?변경/],
  ["enroll", /수강\s*신청/],
  ["ap", /공동\s*AP/i],
  ["drop", /수강\s*포기/],
  ["grade", /성적\s*확인/],
  ["grad", /졸업\s*신청/],
  ["return", /복학/],
];
function academicTopic(title) {
  const hit = ACADEMIC_TOPICS.find(([, re]) => re.test(String(title || "")));
  return hit ? hit[0] : "";
}

function calendarSpans(year, month, startDow, daysInMonth) {
  const events = academicShown()
    .filter((e) => (e.end || e.start) !== e.start);

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month, daysInMonth);
  const segments = [];

  events.forEach((e) => {
    const s = new Date(`${e.start}T00:00`);
    const t2 = new Date(`${e.end}T00:00`);
    if (Number.isNaN(s.getTime()) || Number.isNaN(t2.getTime())) return;
    // 이번 달에 걸치는 부분만
    const from = s < monthStart ? monthStart : s;
    const to = t2 > monthEnd ? monthEnd : t2;
    if (from > to) return;

    let day = from.getDate();
    const lastDay = to.getDate();
    while (day <= lastDay) {
      const idx = startDow + day - 1;
      const week = Math.floor(idx / 7);
      const col = idx % 7;
      // 이 주에서 몇 칸까지 이어지는지
      const room = 7 - col;
      const length = Math.min(room, lastDay - day + 1);
      segments.push({
        week,
        col,
        day,
        length,
        title: e.title,
        kind: e.kind,
        // 잘려서 이어지는 쪽은 모서리를 각지게 해 '계속됨'을 보인다
        openStart: day > from.getDate() || s < monthStart,
        openEnd: day + length - 1 < lastDay || t2 > monthEnd,
        start: e.start,
        end: e.end,
      });
      day += length;
    }
  });

  // 같은 주에서 겹치지 않도록 층(lane)을 나눈다
  const lanesByWeek = new Map();
  segments.sort((a, b) => a.week - b.week || a.col - b.col || b.length - a.length);
  segments.forEach((seg) => {
    const used = lanesByWeek.get(seg.week) || [];
    let lane = 0;
    while (
      used.some(
        (u) => u.lane === lane && seg.col < u.col + u.length && u.col < seg.col + seg.length,
      )
    ) {
      lane += 1;
    }
    seg.lane = lane;
    used.push(seg);
    lanesByWeek.set(seg.week, used);
  });

  const laneCount = new Map();
  lanesByWeek.forEach((list, week) => {
    laneCount.set(week, Math.max(...list.map((s) => s.lane)) + 1);
  });
  return { segments, laneCount };
}


function pad2(n) {
  return String(n).padStart(2, "0");
}

/* ===== 대한민국 공휴일 =====
   양력 고정 공휴일은 매년 같지만, 설날·추석·부처님오신날은 음력이라
   해마다 날짜가 달라 연도별 표로 관리한다. */
const FIXED_HOLIDAYS = {
  "1-1": "신정",
  "3-1": "삼일절",
  "5-5": "어린이날",
  "6-6": "현충일",
  "8-15": "광복절",
  "10-3": "개천절",
  "10-9": "한글날",
  "12-25": "성탄절",
};

const LUNAR_HOLIDAYS = {
  2025: {
    "1-28": "설날 연휴", "1-29": "설날", "1-30": "설날 연휴",
    "5-5": "부처님오신날",
    "10-5": "추석 연휴", "10-6": "추석", "10-7": "추석 연휴",
  },
  // 대체공휴일도 여기 적는다: 고정 공휴일이 일요일(어린이날·성탄절 등은 토요일도)과 겹치면
  // 다음 평일이 쉬는 날이다. 규칙으로 계산하지 않고 해마다 적어 두는 편이 틀릴 일이 적다.
  2026: {
    "2-16": "설날 연휴", "2-17": "설날", "2-18": "설날 연휴",
    "3-2": "대체공휴일(삼일절)",
    "5-24": "부처님오신날", "5-25": "대체공휴일(부처님오신날)",
    "6-3": "지방선거일",
    "8-17": "대체공휴일(광복절)",
    "9-24": "추석 연휴", "9-25": "추석", "9-26": "추석 연휴",
    "10-5": "대체공휴일(개천절)",
  },
  2027: {
    "2-5": "설날 연휴", "2-6": "설날", "2-7": "설날 연휴", "2-8": "대체공휴일(설날)",
    "5-13": "부처님오신날",
    "8-16": "대체공휴일(광복절)",
    "9-14": "추석 연휴", "9-15": "추석", "9-16": "추석 연휴",
    "10-4": "대체공휴일(개천절)",
    "10-11": "대체공휴일(한글날)",
    "12-27": "대체공휴일(성탄절)",
  },
};

function holidayName(year, month, day) {
  const key = `${month}-${day}`;
  return LUNAR_HOLIDAYS[year]?.[key] || FIXED_HOLIDAYS[key] || null;
}

/* 명절·기념일 인사. 대시보드 인사말과 사이드바 나우바가 함께 쓴다.
   공휴일이 아니어도 챙길 만한 날(12월 31일 등)은 여기서만 인사한다. */
const SPECIAL_DAY_LINES = [
  [/^설날$/, "새해 복 많이 받으세요", "가족과 따뜻한 설 보내요"],
  [/설날/, "즐거운 설 연휴 보내세요", "푹 쉬고 든든히 먹어요"],
  [/^추석$/, "풍성한 한가위 보내세요", "보름달처럼 넉넉한 하루 되세요"],
  [/추석/, "즐거운 추석 연휴 보내세요", "푹 쉬고 맛있는 거 많이 먹어요"],
  [/신정/, "새해 복 많이 받으세요", "올해도 잘 부탁해요"],
  [/성탄절/, "메리 크리스마스", "따뜻한 성탄절 보내요"],
  [/어린이날/, "즐거운 어린이날이에요", "오늘은 마음껏 쉬어요"],
  [/부처님오신날/, "평온한 부처님오신날 보내세요", "쉬어 가는 하루예요"],
  [/한글날/, "한글날이에요", "오늘은 수업 없이 쉬어요"],
  [/삼일절|광복절/, "뜻깊은 하루 보내세요", "오늘은 쉬는 날이에요"],
];

/** 오늘이 공휴일이거나 특별한 날이면 { holiday, title, sub } (아니면 null) */
function specialDay(at = new Date()) {
  const y = at.getFullYear();
  const m = at.getMonth() + 1;
  const d = at.getDate();
  const holiday = holidayName(y, m, d);
  if (!holiday) {
    if (m === 12 && d === 31) return { holiday: null, title: "올 한 해 수고 많았어요", sub: "좋은 마무리 해요" };
    return null;
  }
  const hit = SPECIAL_DAY_LINES.find(([re]) => re.test(holiday));
  return {
    holiday,
    title: hit ? hit[1] : "쉬는 날이에요",
    sub: hit ? hit[2] : "오늘은 수업이 없어요",
  };
}

/* ===== 시험 기간 응원 =====
   '시험기간인데 따뜻한 글귀도 없네' 라는 말을 듣고 넣었다. 학사일정의 중간·기말 시험(학부)을 기준으로
   일주일 전 · 시험 중 · 끝난 뒤 이틀 동안 한 줄씩 건넨다. 문장은 하루 동안 그대로(날짜로 고른다).
   나우바 아래 줄에 짧게 쓴다. 대시보드 인사 아래에도 한 줄 넣었다가 '굳이 거기엔 없어도 된다' 고 해서 뺐다. */
const EXAM_CHEERS = {
  before: [
    "차근차근 하면 충분해요",
    "오늘 한 만큼이 쌓여요",
    "잠은 꼭 챙겨 자요",
    "물 한 잔 마시고 가요",
    "할 수 있어요, 진짜로",
  ],
  during: [
    "오늘도 할 수 있어요",
    "끝까지 응원해요",
    "밥 꼭 챙겨 먹어요",
    "한 과목씩, 천천히",
    "거의 다 왔어요",
  ],
  last: ["마지막 날이에요"],
  after: [
    "시험 끝! 고생했어요",
    "수고했어요, 정말로",
  ],
};

/* 나우바를 펼치면 달구가 건네는 말. 나우바 아래 줄과 겹치지 않는 것만 둔다.
   달구를 누르면 폴짝 뛰며 다음 말로 바뀐다. */
const EXAM_DALGU = {
  before: { poses: ["study", "book", "read"], talk: [
    "25분 공부하고 5분 쉬기, 같이 해요",
    "모르는 건 표시만 해 두고 넘어가요",
    "어제 본 걸 5분만 다시 훑어봐요",
    "책상 정리하면 머리도 정리돼요",
    "붕어빵 하나 먹고 다시 해요",
  ] },
  during: { poses: ["fight", "thumbs", "wink"], talk: [
    "시험장 가기 전에 화장실 꼭 들러요",
    "학생증 챙겼죠?",
    "첫 문제가 어려우면 뒤에서부터 풀어도 돼요",
    "끝난 과목은 답 맞춰 보지 말고 쉬어요",
    "달구가 붕어빵 데워 놓을게요",
  ] },
  last: { poses: ["fight", "run"], talk: [
    "마지막 한 과목, 달구도 같이 달려요",
    "끝나면 하고 싶은 거 하나 정해 둬요",
    "오늘은 일찍 자요. 내일은 늦잠 자도 돼요",
  ] },
  after: { poses: ["yay", "lounge", "munch", "laugh"], talk: [
    "오늘은 알람 끄고 자요",
    "붕어빵 파티해요!",
    "보고 싶던 거 몰아 보기 어때요",
    "고생한 나한테 칭찬 한마디 해 줘요",
  ] },
};

/** 지금이 시험 기간 언저리면 { phase, name, days, short, start, end, pose, talk } (아니면 null) */
function examSeason(at = new Date()) {
  const today = new Date(at);
  today.setHours(0, 0, 0, 0);
  const DAY = 86400000;
  for (const e of state.academic || []) {
    if (e.kind === "대학원" || ddayTier(e.title) !== 0) continue;
    const start = new Date(`${e.start}T00:00`);
    const end = new Date(`${e.end || e.start}T00:00`);
    if (Number.isNaN(start.getTime())) continue;
    const name = /기말|학기말/.test(e.title) ? "기말고사" : "중간고사";
    const untilStart = Math.round((start - today) / DAY);
    const sinceEnd = Math.round((today - end) / DAY);
    let phase = null;
    if (untilStart >= 1 && untilStart <= 7) phase = "before";
    else if (untilStart <= 0 && sinceEnd < 0) phase = "during";
    else if (sinceEnd === 0) phase = start.getTime() === end.getTime() ? "during" : "last";
    else if (sinceEnd >= 1 && sinceEnd <= 2) phase = "after";
    if (!phase) continue;
    const lines = EXAM_CHEERS[phase];
    const seed = today.getFullYear() * 400 + today.getMonth() * 32 + today.getDate();
    const short = lines[seed % lines.length];
    const dalgu = EXAM_DALGU[phase];
    return {
      phase, name, days: untilStart, short, start, end,
      pose: dalgu.poses[seed % dalgu.poses.length],
      talk: dalgu.talk,
      talkAt: seed % dalgu.talk.length,
    };
  }
  return null;
}

/* ===== 날짜 상세 (셀을 누르면 아래로 펼쳐짐) ===== */
/* 캘린더 상세에서 메일 일정을 누르면 메일함으로 넘어가지 않고 그 칸을 펼쳐 본문 글을 보여 준다.
   세미나 시간·장소만 확인하려는데 화면이 메일함으로 바뀌면 달력으로 돌아오기가 번거로웠다. */
function mailPlainText(mail) {
  let text = String(mail.body || "").trim();
  if (text.length < 20 && mail.bodyHtml) {
    // HTML만 있는 메일: 블록 끝마다 줄바꿈을 넣고 글자만 뽑는다
    const doc = new DOMParser().parseFromString(mail.bodyHtml, "text/html");
    doc.querySelectorAll("script,style,head").forEach((el) => el.remove());
    doc.querySelectorAll("br").forEach((el) => el.replaceWith("\n"));
    doc.querySelectorAll("p,div,tr,li,h1,h2,h3,h4,h5,h6,table,blockquote").forEach((el) => el.append("\n"));
    doc.querySelectorAll("td,th").forEach((el) => el.append("  "));
    text = doc.body?.textContent || "";
  }
  return (
    text
      .replace(/\r/g, "")
      .split("\n")
      .map((line) => line.replace(/[ \t\u00a0]+/g, " ").trim())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim() || mail.snippet || "본문이 비어 있어요."
  );
}

function linkifyText(text) {
  // 먼저 이스케이프하고 주소만 링크로 감싼다 (본문 HTML은 쓰지 않는다)
  return escapeHtml(text).replace(
    /https?:\/\/[^\s<>"')\]]+/g,
    (url) => `<a href="${url}" data-open-link="${url}">${url}</a>`,
  );
}

async function toggleDayMail(item) {
  const box = $("#dayDetailBody");
  const wasOpen = item.classList.contains("open");
  // 한 번에 하나만 펼친다
  box.querySelectorAll(".day-item.open").forEach((el) => el.classList.remove("open"));
  // 본문을 읽는 동안은 오른쪽 패널을 넓힌다 (좁은 패널에서는 한 줄에 열 글자 남짓이라 읽기 힘들었다)
  $("#calendarStage")?.classList.toggle("reading", !wasOpen);
  if (wasOpen) return;

  const mail = state.emails.emails.find((m) => String(m.id) === item.dataset.mailid);
  if (!mail) return;
  let body = item.querySelector(".day-item-body");
  if (!body) {
    item.insertAdjacentHTML(
      "beforeend",
      `<div class="day-item-body"><div class="day-item-body-inner">
         <div class="day-mail-meta"></div>
         <div class="day-mail-text"><span class="day-mail-loading">본문을 불러오는 중…</span></div>
         <button type="button" class="day-mail-open">메일함에서 열기</button>
       </div></div>`,
    );
    body = item.querySelector(".day-item-body");
  }
  void body.offsetHeight; // 닫힌 상태를 확정해야 펼치는 애니메이션이 재생된다
  item.classList.add("open");
  window.setTimeout(() => item.scrollIntoView({ block: "nearest", behavior: "smooth" }), 180);

  if (body.dataset.loaded) return;
  await ensureMailBody(mail);
  body.dataset.loaded = "1";
  body.querySelector(".day-mail-meta").textContent = [
    mail.fromName || mail.fromEmail,
    mail.date ? String(mail.date).slice(0, 16).replace("T", " ") : "",
  ]
    .filter(Boolean)
    .join(" · ");
  body.querySelector(".day-mail-text").innerHTML = linkifyText(mailPlainText(mail));
}

function openDayDetail(day) {
  const panel = $("#dayDetail");
  if (!panel) return;
  const { y, m } = state.calMonth;
  const items = calendarItems()
    .filter(
      (it) =>
        it.date.getFullYear() === y && it.date.getMonth() === m && it.date.getDate() === day,
    )
    .sort((a, b) => a.date - b.date);

  const KIND_LABEL = { deadline: "과제 마감", done: "제출 완료", event: "세미나", school: "학교 행사", mine: "내 일정" };
  $("#dayDetailTitle").textContent = `${m + 1}월 ${day}일 (${["일", "월", "화", "수", "목", "금", "토"][new Date(y, m, day).getDay()]})`;
  $("#dayDetailCount").textContent = items.length ? `${items.length}건` : "일정 없음";

  $("#dayDetailBody").innerHTML = items.length
    ? items
        .map((it) => {
          const time = it.allDay
            ? "종일"
            : `${pad2(it.date.getHours())}:${pad2(it.date.getMinutes())}`;
          const actions = it.eventId
            ? `<button type="button" class="day-item-edit" data-edit-event="${escapeHtml(it.eventId)}" title="수정">
                 <span class="icon" data-icon="edit"></span>
               </button>`
            : "";
          return `
            <div class="day-item kind-${it.kind}" ${it.mailId ? `data-mailid="${escapeHtml(String(it.mailId))}"` : ""}>
              <span class="day-item-time">${time}</span>
              <span class="dot cal-${it.kind}"></span>
              <div class="day-item-main">
                <strong>${escapeHtml(it.title || "")}</strong>
                ${it.seminar ? seminarInfoHtml(it.seminar) : it.full && it.full !== it.title ? `<em>${escapeHtml(it.full)}</em>` : ""}
                <span>${escapeHtml(KIND_LABEL[it.kind] || "")}${it.sub ? " · " + escapeHtml(it.sub) : ""}</span>
              </div>
              ${actions}
            </div>`;
        })
        .join("")
    : `<p class="cal-empty">이 날에는 일정이 없습니다. ‘이 날에 추가’로 만들어 보세요.</p>`;

  installIcons($("#dayDetailBody"));
  // 패널을 먼저 보이게 한 뒤 리플로우를 강제하면 시작 상태가 확정되어
  // 곧바로 클래스를 켜도 트랜지션이 재생된다.
  // (requestAnimationFrame은 백그라운드 탭에서 안 돌아 패널이 안 열릴 수 있어 쓰지 않는다)
  panel.hidden = false;
  const stage = $("#calendarStage");
  if (stage) {
    window.clearTimeout(state._dayDetailTimer);
    void panel.offsetWidth;
    stage.classList.remove("reading");
    stage.classList.add("detail-open");
  }
}

function closeDayDetail() {
  const stage = $("#calendarStage");
  const panel = $("#dayDetail");
  closeEventEditor();
  if (!stage || !panel) return;
  stage.classList.remove("detail-open", "reading");
  // 접히는 애니메이션이 끝난 뒤에 숨긴다
  window.clearTimeout(state._dayDetailTimer);
  state._dayDetailTimer = window.setTimeout(() => {
    if (!stage.classList.contains("detail-open")) panel.hidden = true;
  }, 430);
}

/* ===== 일정 편집 ===== */
function openEventEditor(event = null) {
  const panel = $("#eventEditor");
  const form = $("#eventForm");
  if (!panel || !form) return;
  const today = new Date();
  const { y, m } = state.calMonth || { y: today.getFullYear(), m: today.getMonth() };
  form.elements.id.value = event?.id || "";
  form.elements.title.value = event?.title || "";
  form.elements.date.value =
    event?.date || `${y}-${pad2(m + 1)}-${pad2(state.calSelected || today.getDate())}`;
  fillTimePicks(form);
  setTimePick(form, "time", event?.time || "");
  setTimePick(form, "endTime", event?.endTime || "");
  form.elements.endDate.value = event?.endDate || "";
  form.elements.repeat.value = event?.repeat || "";
  form.elements.repeatUntil.value = event?.repeatUntil || "";
  form.elements.location.value = event?.location || "";
  // 반복을 고르지 않았으면 '반복 끝'을 물어볼 이유가 없다
  const untilField = $("#repeatUntilField");
  if (untilField) untilField.hidden = !form.elements.repeat.value;
  const results = $("#placeResults");
  if (results) {
    results.hidden = true;
    results.innerHTML = "";
  }

  if (!form.dataset.timeBound) {
    form.dataset.timeBound = "1";
    form.addEventListener("change", (ev) => {
      const sel = ev.target.closest(".tp-hour, .tp-min");
      if (sel) syncTimePick(form, sel.name.replace(/(Hour|Min)$/, ""));
      if (ev.target.name === "repeat") {
        const uf = $("#repeatUntilField");
        if (uf) uf.hidden = !ev.target.value;
      }
    });
  }
  form.elements.note.value = event?.note || "";
  // 제목칸이 머리글을 겸한다. 비어 있으면 '새 일정'이라고 흐리게 보인다.
  {
    const ti = $("#eventEditor")?.querySelector('[name="title"]');
    if (ti) ti.placeholder = event?.id ? "일정 제목" : "새 일정";
  }
  $("#eventDeleteButton").hidden = !event?.id;
  // 편집 칸은 창 가운데 대화 상자(좁은 창에서는 아래에서 올라오는 시트)로 연다.
  //   예전에는 날짜 상세 패널 아래에 붙어 있어서, 창이 화면보다 길거나(작업표시줄 뒤) 그날 일정이 많으면
  //   '저장' 버튼이 화면 밖에 있었다 → 사용자 눈에는 '일정 추가가 안 된다'(2026-10-09 설치본 실측).
  //   상세 패널은 transform 이 걸려 있어 fixed 가 창 기준이 안 되므로 body 로 옮긴다.
  if (panel.parentElement !== document.body) {
    document.body.appendChild(panel);
    panel.classList.add("as-dialog");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
  }
  let backdrop = $("#eventEditorBackdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "eventEditorBackdrop";
    backdrop.className = "event-editor-backdrop";
    backdrop.addEventListener("click", closeEventEditor);
    document.body.appendChild(backdrop);
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && !$("#eventEditor")?.hidden) {
        ev.preventDefault();
        closeEventEditor();
      }
    });
  }
  backdrop.hidden = false;
  panel.hidden = false;
  panel.scrollTop = 0;
  panel.classList.remove("opening");
  void panel.offsetWidth;
  panel.classList.add("opening");
  form.elements.title.focus({ preventScroll: true });
}

function closeEventEditor() {
  const panel = $("#eventEditor");
  const backdrop = $("#eventEditorBackdrop");
  if (backdrop) backdrop.hidden = true;
  if (panel) {
    panel.hidden = true;
    panel.classList.remove("opening");
  }
}

function renderCalendarDayList(byDay) {
  const wrap = $("#calendarDayList");
  const day = state.calSelected;
  if (!day || !byDay[day]) {
    // 이번 달 전체 일정 요약
    const all = Object.entries(byDay)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .flatMap(([d, arr]) => arr.map((it) => ({ ...it, d })));
    wrap.innerHTML = all.length
      ? `<h3>이번 달 일정 ${all.length}건</h3>` +
        all
          .map(
            (it) => `
        <div class="cal-item" ${it.mailId ? `data-mailid="${it.mailId}"` : ""}>
          <span class="cal-item-date">${it.date.getMonth() + 1}/${it.date.getDate()} ${String(it.date.getHours()).padStart(2, "0")}:${String(it.date.getMinutes()).padStart(2, "0")}</span>
          <span class="dot cal-${it.kind}"></span>
          <div class="cal-item-main"><strong>${escapeHtml(it.title)}</strong><span>${escapeHtml([it.seminar?.speaker, it.sub].filter(Boolean).join(" · "))}</span></div>
        </div>`,
          )
          .join("")
      : `<p class="cal-empty">이번 달 일정이 없습니다.</p>`;
    return;
  }
  const arr = byDay[day].sort((a, b) => a.date - b.date);
  wrap.innerHTML =
    `<h3>${state.calMonth.m + 1}월 ${day}일 · ${arr.length}건</h3>` +
    arr
      .map(
        (it) => `
      <div class="cal-item" ${it.mailId ? `data-mailid="${it.mailId}"` : ""}>
        <span class="cal-item-date">${String(it.date.getHours()).padStart(2, "0")}:${String(it.date.getMinutes()).padStart(2, "0")}</span>
        <span class="dot cal-${it.kind}"></span>
        <div class="cal-item-main"><strong>${escapeHtml(it.title)}</strong><span>${escapeHtml([it.seminar?.speaker, it.sub].filter(Boolean).join(" · "))}</span></div>
      </div>`,
      )
      .join("");
}

async function refreshAll() {
  refreshAll.full = Date.now();
  try {
    const [status, files, task, deadlines, selection, emails, config, myEvents, timetable, courseState, health, courseStaff] = await Promise.all([
      api("/api/status"),
      api("/api/files"),
      api("/api/task"),
      api("/api/deadlines"),
      api("/api/selection"),
      api("/api/emails"),
      api("/api/config"),
      api("/api/my-events").catch(() => ({ events: [] })),
      api("/api/timetable").catch(() => ({ entries: [] })),
      // 수강 과목 목록 (자료가 없는 과목도 강의 화면에 떠야 한다)
      api("/api/course-state").catch(() => ({ current: [] })),
      // 마지막 동기화 시각 (자동 가져오기가 기본이라, 언제 했는지 보여 준다)
      api("/api/health").catch(() => null),
      // 과목별 교수·조교 (LMS 코스 사용자 + 조직도 이메일)
      api("/api/course-staff").catch(() => ({ courses: {} })),
    ]);
    if (health) {
      state.health = health;
      state._healthSig = JSON.stringify(health.lastSuccess || {});
    }
    state.offline = false;
    renderLastSync();
    renderMailRefreshAgo();
    state.myEvents = myEvents.events || [];
    state.courseState = courseState || { current: [] };
    setCourseStaff(courseStaff?.courses || {}, courseStaff?.past || {}, courseStaff?.people || {});
    // 학사일정은 하루 한 번만 받아오면 되므로 첫 로드 때만 요청한다
    loadAcademic();
    state.timetable = timetable.entries || [];
    loadShelves();
    if (state.samsungNotes === undefined) loadSamsungNotes();
    state.status = status;
    state.files = files.files || [];
    state.deadlines = deadlines;
    // 영어 화면의 과목명: 이번 학기·마감·자료에 나온 LMS 과목 전체 이름에서 공식 영어 이름을 익힌다
    learnCourseNames([
      ...(state.courseState.current || []).map((c) => c.name),
      ...(state.deadlines?.items || []).map((d) => d.course),
      ...state.files.map((f) => f.course),
    ]);
    state.selection = selection.courses ? selection : { courses: {} };
    if (!Array.isArray(state.selection.hidden)) state.selection.hidden = [];
    if (!Array.isArray(state.selection.hiddenDeadlines)) state.selection.hiddenDeadlines = [];
    if (!Array.isArray(state.selection.hiddenFiles)) state.selection.hiddenFiles = [];
    state.emails = emails.emails ? emails : { emails: [], briefing: "", interests: "", updatedAt: null };
    state.config = config;
    renderAll();
    // 인사말의 이름과 '오늘 남은 수업·마감·메일' 한 줄은 자료가 들어온 뒤에 맞춘다
    setHeroGreeting();
    // 대시보드 '새 메일' 카드. 예전에는 메일함을 그릴 때만 셌어서 대시보드에서는 0 으로 멈춰 있었다.
    const unreadInbox = (state.emails.emails || []).filter((m) => m.folder === "inbox" && m.unread).length;
    const newMail = $("#metricNewMail");
    if (newMail) newMail.textContent = unreadInbox;
    const newMailNote = $("#metricNewMailNote");
    if (newMailNote) newMailNote.textContent = unreadInbox ? "안 읽은 메일" : "모두 읽었습니다";
    renderTask(task);
    state._taskRunning = Boolean(task.running || task.mail?.running); // 메일 칸이 끝났을 때도 다시 받는다
    if (state.courseAnn !== null) loadCourseAnn();
  } catch (error) {
    // 앱 서버가 잠깐 없을 때(재설치·재시작) 12초마다 같은 오류를 띄우지 않는다.
    // 화면의 자료는 그대로 두고 연결이 돌아오면 다시 받는다.
    if (!state.offline) showToast(humanError(error));
    if (/fetch|network|connection/i.test(String(error?.message))) state.offline = true;
  }
}

/* 가벼운 확인: 작업 상태와 '마지막 동기화 시각' 두 개만 묻는다.
   예전에는 12초마다(작업 중엔 2초마다) 자료 184KB·메일 94KB 를 포함한 11개를 다시 받고
   화면을 다시 그렸다. 동기화가 도는 5분 동안 150번 × 11개라 앱이 버벅였다.
   이제 무언가 끝났을 때(시각이 바뀌거나 작업이 멈췄을 때)만 전부 다시 받는다. */
async function pollLight() {
  try {
    const [task, health] = await Promise.all([api("/api/task"), api("/api/health").catch(() => null)]);
    if (state.offline) {
      state.offline = false;
      showToast("앱과 다시 연결됐어요.");
      return refreshAll();
    }
    const wasRunning = state._taskRunning;
    state._taskRunning = Boolean(task.running || task.mail?.running); // 메일 칸이 끝났을 때도 다시 받는다
    if (health) state.health = health;
    renderTask(task);
    renderLastSync();
    renderStatusCard(task);
    const sig = JSON.stringify(health?.lastSuccess || {});
    const since = Date.now() - (refreshAll.full || 0);
    const changed = health && sig !== state._healthSig;
    const finished = wasRunning && !state._taskRunning;
    // 작업 중에는 새로 받은 파일이 조금씩 보이도록 20초마다, 평소에는 90초마다 한 번은 전부 받는다
    if (changed || finished || since > (task.running ? 20000 : 90000)) return refreshAll();
  } catch (error) {
    if (!state.offline) {
      state.offline = true;
      showToast(humanError(error));
    }
  }
}

async function loadConfig() {
  state.config = await api("/api/config");
  const form = $("#configForm");
  Object.entries(state.config).forEach(([key, value]) => {
    const input = form.elements[key];
    if (input && !key.startsWith("has")) input.value = value || "";
  });
}

async function startRun(path, label, payload = {}) {
  try {
    const data = await api(path, { method: "POST", body: JSON.stringify(payload) });
    showToast(data.message || `${label} 시작`);
    await refreshAll();
  } catch (error) {
    showToast(error.message);
  }
}

/* ===== 관심사 선택 (설정) ===== */
const TRACK_OPTIONS = [
  "물리학", "화학", "생명과학", "뇌과학", "컴퓨터·AI", "전기·전자",
  "로봇·기계", "신소재", "에너지공학", "의생명공학", "뉴바이올로지", "수학·데이터",
];
const ACTIVITY_OPTIONS = [
  "대학원·연구", "취업·인턴", "창업", "장학금", "교환학생·해외",
  "세미나·특강", "공모전·대회", "학생회·자치", "동아리", "음악·공연", "운동·스포츠", "봉사",
];

function renderInterestChips() {
  const render = (options) =>
    options
      .map(
        (tag) => `
          <button type="button" class="interest-chip ${state.interestTags.has(tag) ? "active" : ""}"
            data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>
        `,
      )
      .join("");
  $("#trackChips").innerHTML = render(TRACK_OPTIONS);
  $("#activityChips").innerHTML = render(ACTIVITY_OPTIONS);
}

function bindInterestChips() {
  const toggle = (event) => {
    const chip = event.target.closest("[data-tag]");
    if (!chip) return;
    const tag = chip.dataset.tag;
    if (state.interestTags.has(tag)) {
      state.interestTags.delete(tag);
    } else {
      state.interestTags.add(tag);
    }
    renderInterestChips();
  };
  $("#trackChips").addEventListener("click", toggle);
  $("#activityChips").addEventListener("click", toggle);
}

function renderSecretBadges() {
  const config = state.config || {};
  // 시간표 캡처 읽기는 Gemini 키가 있어야 된다. 키 넣는 칸을 없앴으니(2026-10-21) 이미 저장된 키가 있을 때만 단추를 보인다.
  {
    const el = $("#timetableImportImage");
    if (el) el.hidden = !config.hasGeminiKey;
  }
  {
    const el = $("#emailPwSavedBadge");
    if (el) el.hidden = !config.hasEmailPassword;
  }
  // 학교 메일은 계정 줄의 '저장됨' 알약이 대신한다
  renderAccountPills();
}

function openSettings() {
  switchView("settings");
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === "settings");
  });
}

async function populateSettings() {
  try {
    await loadConfig();
  } catch (error) {
    showToast(error.message);
  }
  const form = $("#configForm");
  // 없앤 칸(Gemini 키·메일 알림)을 건드리면 터진다. 있는 것만 비운다.
  ["lmsPassword", "schoolEmailPassword"].forEach((name) => {
    if (form.elements[name]) form.elements[name].value = "";
  });
  state.interestTags = new Set(state.config?.interestTags || []);
  form.elements.interestsCustom.value = state.config?.interestsCustom || "";
  form.elements.hidePastEmails.checked = Boolean(state.config?.hidePastEmails);
  if (form.elements.notifyDeadlines) form.elements.notifyDeadlines.checked = state.config?.notifyDeadlines !== false;
  if (form.elements.notifyNewFiles) form.elements.notifyNewFiles.checked = state.config?.notifyNewFiles !== false;
  // 구글 캘린더 동기화 (체크박스라 value 대입으로는 반영되지 않음)
  form.elements.gcalSyncEnabled.checked = Boolean(state.config?.gcalSyncEnabled);
  form.elements.gcalCalendarName.value = state.config?.gcalCalendarName || "DGIST 메일 일정";
  // 자동 가져오기 주기 (선택지에 없는 값이면 가장 가까운 것으로)
  [
    ["autoEmailMinutes", 5],
    ["autoDeadlineMinutes", 60],
    ["autoSyncMinutes", 180],
    ["mailKeepDays", 21],
    ["mailKeepMax", 60],
  ].forEach(([name, fallback]) => {
    const select = form.elements[name];
    if (!select) return;
    const want = Number(state.config?.[name] ?? fallback);
    const options = Array.from(select.options).map((o) => Number(o.value));
    const nearest = options.includes(want)
      ? want
      : options.reduce((best, v) => (Math.abs(v - want) < Math.abs(best - want) ? v : best), options[0]);
    select.value = String(nearest);
  });
  // 강의자료 저장: 드라이브 / 내 컴퓨터 스위치
  const localMode = state.config?.autoLocalSave || "off";
  $("#localSaveToggle").checked = localMode !== "off";
  const scopeValue = state.config?.saveScope === "all" ? "all" : "current";
  const scope = form.querySelector(`input[name=localSaveScope][value="${scopeValue}"]`);
  if (scope) scope.checked = true;
  const layoutValue = state.config?.folderLayout === "flat" ? "flat" : "lms";
  const layoutInput = form.querySelector(`input[name=folderLayout][value="${layoutValue}"]`);
  if (layoutInput) layoutInput.checked = true;
  form.elements.localSavePath.value = state.config?.localSavePath || "";
  const folderText = $("#localSaveFolderText");
  if (folderText && state.config?.localSaveFolder) {
    folderText.textContent = friendlyPath(state.config.localSaveFolder);
    folderText.parentElement.title = state.config.localSaveFolder;
  }
  form.elements.driveUpload.checked = state.config?.driveUpload !== false;
  $("#driveFolderText").textContent = state.config?.driveFolderName || "AutoSaver";
  // 클라우드 카드는 저장을 누르기 전까지 초안으로만 바꾼다
  state.cloudDraft = Object.fromEntries(
    (state.config?.clouds || []).map((c) => [c.key, { on: Boolean(c.on), path: c.picked ? c.root : "" }]),
  );
  renderSaveDestinations();
  syncLocalSaveButton();
  renderGcalStatus();
  renderInterestChips();
  renderSecretBadges();
  renderGoogleSection();
  // 앱 버전 표시 (업데이트 확인 전 현재 버전만)
  api("/api/update/check")
    .then((d) => {
      $("#appVersion").textContent = `v${d.current || "?"}`;
    })
    .catch(() => {});
}

/* ===== 메일 pane 전환 (목록/읽기/작성) ===== */
/* 넓으면 목록과 본문이 나란히 선다. 그때는 목록을 숨기면 안 된다.
   (CSS 로 되살려 놓긴 했지만 hidden 이 걸린 채 보이는 건 화면낭독기에 거짓말이 된다) */
function mailTwoPane() {
  const el = $("#view-emails");
  return !!el && el.clientWidth >= 1320;
}

function showMailPane(pane) {
  state.mailPane = pane;
  // 메일을 쓸 때는 폴더·목록이 필요 없다. 그 자리를 작성 칸에 준다 (목록으로 돌아오면 원래대로)
  $("#mailApp")?.classList.toggle("composing", pane === "compose");
  $("#mailListPane").hidden = mailTwoPane() ? false : pane !== "list";
  $("#mailReadPane").hidden = pane !== "read";
  $("#mailComposePane").hidden = pane !== "compose";
  syncReadingRow();
  navPush();
}

/** 지금 읽고 있는 메일을 목록에서도 짚어 준다 */
function syncReadingRow() {
  const id = state.mailPane === "read" ? state.replyContext?.id : null;
  document.querySelectorAll("[data-mail-id]").forEach((el) => {
    el.classList.toggle("reading", !!id && el.dataset.mailId === String(id));
  });
}

/* ===== 이벤트 바인딩 ===== */
function bindEvents() {
  // 별표는 이 컴퓨터에 적어 둔다. 화면을 그리기 전에 읽어야 한다.
  state.mailStars = loadStars();

  /* 검색: 글자 하나마다 화면 다섯 개를 통째로 다시 그렸다 (한 글자에 170ms).
     잠깐 기다렸다가, 지금 보고 있는 화면만 그린다. 다른 화면은 열 때 그린다. */
  const SEARCH_PARTS = ["upcoming", "deadlines", "emails", "courses", "files", "courseFilter"];
  let searchTimer = 0;
  // Ctrl+K 로 어디서든 검색창으로 (검색창 오른쪽에 적어 둔 단축키)
  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "k") {
      event.preventDefault();
      $("#searchInput")?.focus();
      $("#searchInput")?.select();
    }
  });
  bindSearchPop();

  // 메일 새로고침은 상단 버튼 하나로 통일했다 (화면에 맞춰 이름이 바뀐다)

  $("#emailSearchInput").addEventListener("input", (event) => {
    state.emailQuery = event.target.value;
    renderEmails();
  });

  $("#emailFilterChips")?.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-filter]");
    if (!chip) return;
    state.emailFilter = chip.dataset.filter;
    renderEmails();
  });

  // 캘린더
  $("#calPrevButton").addEventListener("click", () => {
    const { y, m } = state.calMonth;
    state.calMonth = m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 };
    state.calSelected = null;
    renderCalendar();
  });
  $("#calNextButton").addEventListener("click", () => {
    const { y, m } = state.calMonth;
    state.calMonth = m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 };
    state.calSelected = null;
    renderCalendar();
  });
  $("#calTodayButton").addEventListener("click", () => {
    const now = new Date();
    state.calMonth = { y: now.getFullYear(), m: now.getMonth() };
    state.calSelected = now.getDate();
    renderCalendar();
  });
  $("#calendarGrid").addEventListener("click", (event) => {
    const cell = event.target.closest(".cal-cell[data-day]");
    if (!cell) return;
    const day = Number(cell.dataset.day);
    const closing = state.calSelected === day;
    state.calSelected = closing ? null : day;
    if (!closing) {
      // 누른 칸이 '쫙' 커지는 느낌
      cell.classList.add("popping");
      cell.addEventListener("animationend", () => cell.classList.remove("popping"), { once: true });
    }
    renderCalendar();
    if (!closing) openDayDetail(day);
    else closeDayDetail();
  });
  $("#dayDetailClose").addEventListener("click", () => {
    state.calSelected = null;
    closeDayDetail();
    renderCalendar();
  });
  // '일정 추가' 버튼은 없앴다. 날짜를 눌러 그 날 상세에서 추가한다.
  $("#addEventButton")?.addEventListener("click", () => openEventEditor());
  // 공휴일 표시 on/off (선택은 브라우저에 기억)
  const holidayBox = $("#holidayToggle");
  if (holidayBox) {
    try {
      state.showHolidays = localStorage.getItem("autosaver-holidays") !== "0";
    } catch (error) {
      /* 무시 */
    }
    holidayBox.checked = state.showHolidays;
    holidayBox.addEventListener("change", () => {
      state.showHolidays = holidayBox.checked;
      try {
        localStorage.setItem("autosaver-holidays", state.showHolidays ? "1" : "0");
      } catch (error) {
        /* 무시 */
      }
      renderCalendar();
    });
  }
  $("#dayAddEventButton").addEventListener("click", () => {
    const { y, m } = state.calMonth;
    const d = state.calSelected || new Date().getDate();
    openEventEditor({ date: `${y}-${pad2(m + 1)}-${pad2(d)}` });
  });
  $("#eventEditorClose").addEventListener("click", closeEventEditor);
  $("#dayDetailBody").addEventListener("click", (event) => {
    const editBtn = event.target.closest("[data-edit-event]");
    if (editBtn) {
      const ev = (state.myEvents || []).find((e) => e.id === editBtn.dataset.editEvent);
      if (ev) openEventEditor(ev);
      return;
    }
    const mailItem = event.target.closest("[data-mailid]");
    if (!mailItem) return;
    const link = event.target.closest("[data-open-link]");
    if (link) {
      event.preventDefault();
      api("/api/mail/open-link", { method: "POST", body: JSON.stringify({ url: link.dataset.openLink }) })
        .then((res) => showToast(res.opened ? `브라우저에서 열었어요 · ${res.host}` : "링크를 열지 못했어요."))
        .catch((error) => showToast(humanError(error)));
      return;
    }
    if (event.target.closest(".day-mail-open")) {
      const mail = state.emails.emails.find((m) => String(m.id) === mailItem.dataset.mailid);
      if (mail) {
        switchView("emails");
        window.setTimeout(() => openEmailDetail(mail), 200); // 전환이 끝난 뒤에 열어야 창이 목록으로 안 돌아간다
      }
      return;
    }
    // 펼친 본문 안을 누르거나 글을 고르는 중이면 접지 않는다
    if (event.target.closest(".day-item-body") || String(window.getSelection?.() || "")) return;
    toggleDayMail(mailItem);
  });
  /* 장소 찾기.
     구글 지도를 화면에 띄우려면 OAuth 가 아니라 결제가 연결된 지도 API 키가
     따로 있어야 한다. 캘린더용 자격증명으로는 안 된다. 그래서 좌표는 키가
     필요 없는 OpenStreetMap 에서 찾고, '지도 열기'만 구글 지도로 보낸다. */
  $("#placeSearchButton")?.addEventListener("click", async () => {
    const form = $("#eventForm");
    const box = $("#placeResults");
    const q = form.elements.location.value.trim();
    if (!box) return;
    if (q.length < 2) {
      showToast("장소를 두 글자 이상 적어 주세요.");
      return;
    }
    box.hidden = false;
    box.innerHTML = `<p class="place-empty">찾는 중…</p>`;
    try {
      const data = await api(`/api/place-search?q=${encodeURIComponent(q)}`);
      const places = data.places || [];
      box.innerHTML = places.length
        ? places
            .map(
              (pl, i) => `
          <button type="button" class="place-item" data-place="${i}">
            <strong>${escapeHtml(pl.name)}</strong>
            <span>${escapeHtml(shortText(pl.address, 60))}</span>
          </button>`,
            )
            .join("")
        : `<p class="place-empty">찾지 못했습니다. 이름을 그대로 써도 됩니다.</p>`;
      state.placeHits = places;
    } catch (error) {
      box.innerHTML = `<p class="place-empty">검색하지 못했습니다: ${escapeHtml(error.message || "")}</p>`;
    }
  });

  $("#placeResults")?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-place]");
    if (!btn) return;
    const pl = (state.placeHits || [])[Number(btn.dataset.place)];
    if (!pl) return;
    const form = $("#eventForm");
    form.elements.location.value = pl.name;
    $("#placeResults").hidden = true;
    showToast(`장소를 '${pl.name}'로 정했습니다.`);
  });

  $("#eventForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      await api("/api/my-events/save", { method: "POST", body: JSON.stringify(payload) });
      showToast(payload.id ? "일정을 수정했습니다." : "일정을 추가했습니다.");
      closeEventEditor();
      await refreshAll();
      if (state.calSelected) openDayDetail(state.calSelected);
    } catch (error) {
      showToast(error.message);
    }
  });
  $("#eventDeleteButton").addEventListener("click", async () => {
    const id = $("#eventForm").elements.id.value;
    if (!id) return;
    if (!(await uiConfirm("이 일정을 지울까요?", { title: "일정 지우기", danger: true, ok: "지우기" }))) return;
    try {
      await api("/api/my-events/delete", { method: "POST", body: JSON.stringify({ id }) });
      showToast("일정을 삭제했습니다.");
      closeEventEditor();
      await refreshAll();
      if (state.calSelected) openDayDetail(state.calSelected);
    } catch (error) {
      showToast(error.message);
    }
  });
  $("#calendarDayList").addEventListener("click", (event) => {
    const item = event.target.closest("[data-mailid]");
    if (!item) return;
    const mail = state.emails.emails.find((m) => String(m.id) === item.dataset.mailid);
    if (mail) {
      switchView("emails");
      window.setTimeout(() => openEmailDetail(mail), 200);
    }
  });
  $("#gcalConnectButton")?.addEventListener("click", async () => {
    if (state.status?.mode === "multi-user") {
      window.open("/api/deadlines.ics", "_blank");
      return;
    }
    try {
      const data = await api("/api/export-ics", { method: "POST", body: "{}" });
      showToast((data.message || "캘린더 파일을 저장했습니다.") + " 구글 캘린더 → 가져오기로 등록하세요.");
    } catch (error) {
      showToast(error.message);
    }
  });

  // 좁은 화면에서 폴더 레일은 서랍이 된다
  const setRail = (open) => {
    const app = $("#mailApp");
    if (!app) return;
    app.classList.toggle("rail-open", open);
    const scrim = $("#mailScrim");
    if (scrim) scrim.hidden = !open;
    $("#mailRailToggle")?.setAttribute("aria-expanded", String(open));
  };
  $("#mailRailToggle")?.addEventListener("click", () => {
    const app = $("#mailApp");
    if (app?.classList.contains("rail-folded") && !mailRailIsStrip()) {
      setMailRailFolded(false, true);
      return;
    }
    setRail(!app?.classList.contains("rail-open"));
  });
  $("#mailScrim")?.addEventListener("click", () => setRail(false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setRail(false);
  });
  // 두 칸 ↔ 한 칸이 바뀌면 목록을 다시 세운다
  window.addEventListener("resize", () => {
    if (state.mailPane) showMailPane(state.mailPane);
  });

  // 넓어지면 레일이 원래 자리로 돌아온다. 열린 상태가 남아 있으면 안 된다.
  matchMedia("(max-width: 760px)").addEventListener("change", (event) => {
    if (!event.matches) setRail(false);
  });

  // 폴더 네비게이션
  $("#mailFolders").addEventListener("click", async (event) => {
    // 받은 편지함 앞의 꺾쇠 = 분류 접기/펴기. 폴더를 옮기지는 않는다.
    if (event.target.closest("[data-cats-toggle]")) {
      state.mailCatsOpen = state.mailCatsOpen === false;
      try {
        localStorage.setItem("autosaver-mail-cats-open", String(state.mailCatsOpen));
      } catch (error) {
        /* 저장 못 해도 이번 실행에는 반영된다 */
      }
      renderEmails();
      return;
    }
    // 서랍에서 골랐으면 고르는 즉시 닫는다
    if (event.target.closest("[data-cat], [data-folder]")) setRail(false);
    // 분류(교수님·학생회 …)를 누르면 받은 편지함 안에서 걸러 본다
    const cat = event.target.closest("[data-cat]");
    if (cat) {
      state.emailFilter = state.emailFilter === cat.dataset.cat ? "" : cat.dataset.cat;
      state.emailFolder = "inbox";
      state.mailSelected = new Set();
      switchView("emails");
      renderEmails();
      return;
    }
    const btn = event.target.closest("[data-folder]");
    if (!btn) return;
    // 작성 중이던 내용이 있으면 확인 후 이동
    if (
      state.mailPane === "compose" &&
      composeHasContent() &&
      !(await uiConfirm("쓰던 메일이 있어요. 저장하지 않고 이동할까요?", { title: "쓰던 메일", ok: "이동", icon: "edit" }))
    ) {
      return;
    }
    state.emailFolder = btn.dataset.folder;
    state.emailFilter = "";
    state.emailTab = "primary";
    state.emailQuick = "";
    state.mailSelected = new Set();
    state.attachments = [];
    // 작성/읽기 pane에 가려지지 않도록 목록으로 복귀 + 사이드바 활성 항목 동기화
    switchView("emails");
    $("#mailScroll")?.scrollTo?.(0, 0);
    renderEmails();
  });



  // 작업 막대의 '선택 해제'
  $("#mailClearPick")?.addEventListener("click", () => {
    state.mailSelected = new Set();
    syncMailSelection();
  });

  // 분류 탭 (기본 / 관심 메일 / LMS·공지)
  $("#mailTabs")?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-tab]");
    if (!btn) return;
    state.emailTab = btn.dataset.tab;
    state.mailSelected = new Set();
    $("#mailScroll")?.scrollTo?.(0, 0);
    renderEmails();
  });

  // 왼쪽 빠른 필터 (안읽음 / 중요 / 첨부) — 다시 누르면 해제
  $("#mailQuick")?.addEventListener("click", (event) => {
    // 서랍에서 골랐으면 고르는 즉시 닫는다
    if (event.target.closest("[data-quick]")) setRail(false);
    const btn = event.target.closest("[data-quick]");
    if (!btn) return;
    state.emailQuick = state.emailQuick === btn.dataset.quick ? "" : btn.dataset.quick;
    state.mailSelected = new Set();
    renderEmails();
  });

  // 내게 쓰기
  $("#selfMailButton")?.addEventListener("click", () => {
    switchView("compose");
    window.setTimeout(() => {
      const to = document.querySelector('#composeForm input[name="to"]');
      if (to && state.config?.schoolEmail) to.value = `${state.config.schoolEmail}, `;
    }, 300);
  });

  // 전체 선택
  /* ===== 여러 통 한꺼번에 고르기 =====
     '전체 선택'이 작업 막대 안에 있었는데, 그 막대는 뭔가 고른 뒤에야
     나타난다. 하나도 안 골랐을 땐 전체 선택에 닿을 수가 없었다.
     목록 머리에 늘 보이는 것을 하나 둔다. */
  const pickAll = (on) => {
    state.mailSelected = new Set();
    if (on) {
      document
        .querySelectorAll("#newsGrid [data-mail-id]")
        .forEach((el) => state.mailSelected.add(el.dataset.mailId));
    }
    syncMailSelection();
  };
  $("#mailPickAll")?.addEventListener("change", (event) => pickAll(event.currentTarget.checked));

  /* 눌러서 쭉 끌면 지나간 메일이 한꺼번에 골라진다.
     그냥 누르면 메일이 열려야 하므로, 6px 넘게 움직였을 때만 고르기로 친다. */
  const grid = $("#newsGrid");
  if (grid) {
    let drag = null;
    const rowsNow = () => [...grid.querySelectorAll("[data-mail-id]")];
    const rowAt = (y) =>
      rowsNow().find((el) => {
        const b = el.getBoundingClientRect();
        return y >= b.top && y <= b.bottom;
      });

    grid.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      // 별표·버튼·체크박스를 누른 것은 끌기가 아니다
      if (event.target.closest("[data-star], [data-act], .mail-pick")) return;
      const row = event.target.closest("[data-mail-id]");
      if (!row) return;
      const rows = rowsNow();
      drag = {
        startIdx: rows.indexOf(row),
        y0: event.clientY,
        moved: false,
        base: new Set(state.mailSelected || []),
      };
    });

    grid.addEventListener("pointermove", (event) => {
      if (!drag) return;
      if (!drag.moved) {
        if (Math.abs(event.clientY - drag.y0) < 6) return;
        drag.moved = true;
        // 끄는 동안 글자가 파랗게 잡히면 지저분하다
        grid.classList.add("drag-picking");
      }
      const row = rowAt(event.clientY);
      if (!row) return;
      const rows = rowsNow();
      const a = Math.min(drag.startIdx, rows.indexOf(row));
      const b = Math.max(drag.startIdx, rows.indexOf(row));
      const next = new Set(drag.base);
      for (let i = a; i <= b; i += 1) next.add(rows[i].dataset.mailId);
      state.mailSelected = next;
      syncMailSelection();
    });

    const endDrag = () => {
      if (!drag) return;
      const wasDragging = drag.moved;
      drag = null;
      grid.classList.remove("drag-picking");
      // 끌기로 골랐으면 뒤따라오는 click 으로 메일이 열리면 안 된다
      if (wasDragging) {
        grid.addEventListener("click", (e) => e.stopPropagation(), {
          capture: true,
          once: true,
        });
      }
    };
    grid.addEventListener("pointerup", endDrag);
    grid.addEventListener("pointercancel", endDrag);
    window.addEventListener("blur", endDrag);

    // Shift+클릭으로도 사이를 통째로 (익숙한 방식)
    grid.addEventListener("click", (event) => {
      if (!event.shiftKey) return;
      const row = event.target.closest("[data-mail-id]");
      if (!row) return;
      event.preventDefault();
      event.stopPropagation();
      const rows = rowsNow();
      const idx = rows.indexOf(row);
      const last = state.lastPickIdx ?? idx;
      const next = new Set(state.mailSelected || []);
      for (let i = Math.min(last, idx); i <= Math.max(last, idx); i += 1) {
        next.add(rows[i].dataset.mailId);
      }
      state.mailSelected = next;
      state.lastPickIdx = idx;
      syncMailSelection();
    }, true);
  }

  $("#mailSelectAll")?.addEventListener("change", (event) => {
    const on = event.currentTarget.checked;
    state.mailSelected = new Set();
    if (on) {
      document.querySelectorAll("[data-mail-id]").forEach((el) => state.mailSelected.add(el.dataset.mailId));
    }
    syncMailSelection();
  });

  // 선택한 메일에 대한 작업
  $("#mailActions")?.addEventListener("click", async (event) => {
    const btn = event.target.closest("[data-bulk]");
    if (!btn) return;
    const ids = [...(state.mailSelected || [])];
    if (!ids.length) {
      showToast("먼저 메일을 선택해 주세요.");
      return;
    }
    const mails = (state.emails.emails || []).filter((m) => ids.includes(String(m.id)));
    const kind = btn.dataset.bulk;

    if (kind === "reply" || kind === "forward") {
      if (mails.length > 1) {
        showToast("답장·전달은 한 통씩만 됩니다.");
        return;
      }
      openMail(mails[0]);
      window.setTimeout(() => replyToCurrentEmail(), 250);
      return;
    }
    if (kind === "delete") {
      if (!(await uiConfirm(`고른 메일 ${mails.length}통을 지울까요?`, { title: "메일 지우기", danger: true, ok: "지우기" }))) return;
    }
    // 이미 있는 한 통짜리 처리를 그대로 쓴다 (엔드포인트를 새로 만들지 않는다)
    try {
      for (const mail of mails) {
        // setEmailRead(mail, seen): seen=true 가 '읽음'
        if (kind === "read") await setEmailRead(mail, true, { silent: true });
        else if (kind === "unread") await setEmailRead(mail, false, { silent: true });
        else if (kind === "delete") await deleteEmail(mail);
      }
      state.mailSelected = new Set();
      renderEmails();
      showToast(
        kind === "delete" ? `${mails.length}통을 삭제했습니다.` : `${mails.length}통을 처리했습니다.`,
      );
    } catch (error) {
      showToast(error.message || "처리하지 못했습니다.");
    }
  });

  // 카드/리스트 클릭 → 읽음/삭제 액션 또는 전문 보기
  const handleMailClick = (event) => {
    const item = event.target.closest(".news-card, .email-list-row");
    if (!item) return;
    // 별표는 '중요 표시'지 '열기'가 아니다
    if (event.target.closest("[data-star]")) {
      event.stopPropagation();
      toggleStar(item.dataset.mailId);
      renderEmails();
      return;
    }
    // 체크박스는 '선택'이지 '열기'가 아니다
    if (event.target.closest(".mail-pick")) {
      const id = item.dataset.mailId;
      state.lastPickIdx = [...document.querySelectorAll("#newsGrid [data-mail-id]")].indexOf(item);
      state.mailSelected = state.mailSelected || new Set();
      if (state.mailSelected.has(id)) state.mailSelected.delete(id);
      else state.mailSelected.add(id);
      syncMailSelection();
      return;
    }
    const mail = state.emails.emails.find((m) => String(m.id) === item.dataset.mailId);
    if (!mail) return;
    const actBtn = event.target.closest("[data-act]");
    if (actBtn) {
      event.stopPropagation();
      if (actBtn.dataset.act === "read") {
        setEmailRead(mail, mail.unread); // 안읽음이면 읽음으로, 읽음이면 안읽음으로
      } else if (actBtn.dataset.act === "restore") {
        restoreEmail(mail);
      } else if (actBtn.dataset.act === "delete") {
        deleteEmail(mail);
      }
      return;
    }
    openEmailDetail(mail);
  };
  $("#newsGrid").addEventListener("click", handleMailClick);
  $("#newsFeatured").addEventListener("click", handleMailClick);
  $("#markAllReadButton").addEventListener("click", markAllRead);

  // 읽기 pane 버튼
  $("#readBackButton").addEventListener("click", () => showMailPane("list"));
  $("#readReplyButton").addEventListener("click", replyToCurrentEmail);
  $("#readMarkButton").addEventListener("click", () => {
    const mail = state.replyContext;
    if (mail) {
      setEmailRead(mail, mail.unread);
      showMailPane("list");
    }
  });
  $("#readDeleteButton").addEventListener("click", async () => {
    const mail = state.replyContext;
    if (mail && (await uiConfirm("이 메일을 지울까요?", { title: "메일 지우기", danger: true, ok: "지우기" }))) {
      deleteEmail(mail);
      showMailPane("list");
    }
  });

  // 이전 / 다음 메일
  $("#readPrevButton")?.addEventListener("click", () => stepMail(-1));
  $("#readNextButton")?.addEventListener("click", () => stepMail(1));

  // 별표 (서버 \Flagged 로 붙어 폰·웹메일에도 보인다)
  $("#readStarButton")?.addEventListener("click", () => toggleStarOnServer(state.replyContext));

  $("#readReplyAllButton")?.addEventListener("click", () => replyToCurrentEmail(true));
  $("#readForwardButton")?.addEventListener("click", forwardCurrentEmail);

  // 더보기 메뉴
  const moreBtn = $("#readMoreButton");
  const moreMenu = $("#readMoreMenu");
  moreBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    const open = moreMenu.hidden;
    moreMenu.hidden = !open;
    moreBtn.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", () => {
    if (moreMenu && !moreMenu.hidden) {
      moreMenu.hidden = true;
      moreBtn?.setAttribute("aria-expanded", "false");
    }
  });
  moreMenu?.addEventListener("click", async (event) => {
    const item = event.target.closest("[data-more]");
    if (!item) return;
    moreMenu.hidden = true;
    moreBtn?.setAttribute("aria-expanded", "false");
    await runMailMore(item.dataset.more, state.replyContext);
  });

  // 정렬 / 보기 방식
  $("#emailSortSelect").addEventListener("change", (event) => {
    state.emailSort = event.target.value;
    renderEmails();
  });
  document.querySelectorAll(".view-toggle-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.emailView = btn.dataset.viewmode;
      document.querySelectorAll(".view-toggle-btn").forEach((b) => b.classList.toggle("active", b === btn));
      renderEmails();
    });
  });

  // 메일 쓰기 / 발송
  $("#composeButton").addEventListener("click", () => switchView("compose"));
  $("#closeComposeDialog").addEventListener("click", closeCompose);
  $("#cancelComposeButton").addEventListener("click", discardCompose);
  // 참조 줄은 늘 보이므로, ＋는 숨은참조만 여닫는다
  $("#toggleCcBcc").addEventListener("click", () => {
    const bcc = $("#bccField");
    if (!bcc) return;
    bcc.hidden = !bcc.hidden;
    if (!bcc.hidden) $("#composeForm").elements.bcc.focus();
  });

  // 첨부파일
  $("#attachButton").addEventListener("click", () => $("#attachInput").click());
  $("#attachInput").addEventListener("change", async (event) => {
    const files = [...event.target.files];
    for (const file of files) {
      if (file.size > 20 * 1024 * 1024) {
        showToast(`${file.name}은(는) 20MB를 넘어 제외됐습니다.`);
        continue;
      }
      const content = await fileToBase64(file);
      state.attachments.push({ filename: nfcName(file.name), size: file.size, content });
    }
    event.target.value = "";
    renderAttachments();
  });
  $("#composeAttachments").addEventListener("click", (event) => {
    const rm = event.target.closest(".attach-remove");
    if (rm) {
      state.attachments.splice(Number(rm.dataset.idx), 1);
      renderAttachments();
    }
  });

  // Google Drive에서 첨부 가져오기
  $("#driveImportButton").addEventListener("click", importFromDrive);

  setupAutocomplete();
  bindAutosave();
  $("#composeForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    let subject = form.elements.subject.value;
    // '중요'를 켜면 제목 앞에 표시를 붙인다 (웹메일도 같은 방식)
    if ($("#markImportant")?.checked && !/^\[중요\]/.test(subject)) {
      subject = `[중요] ${subject}`;
    }

    const payload = {
      to: form.elements.to.value.trim(),
      cc: form.elements.cc.value.trim(),
      bcc: form.elements.bcc.value.trim(),
      subject,
      // 서식 모드면 편집 영역, HTML 모드면 textarea에서 가져온다
      body: composeBody(),
      html: composeIsRich() || $("#htmlModeToggle").checked,
      inReplyTo: form.dataset.inReplyTo || "",
      references: form.dataset.references || "",
      attachments: (state.attachments || []).map((a) => ({ filename: a.filename, content: a.content })),
      draftId: form.dataset.draftId || "",
    };
    if (!payload.to) {
      showToast("받는 사람 주소를 입력해 주세요.");
      return;
    }

    // '개별' — 한 명씩 따로 보내 서로의 주소가 안 보이게 한다
    const separately = Boolean($("#sendSeparately")?.checked);
    const targets = separately ? parseRecipients(payload.to).map(formatRecipient) : [payload.to];
    if (separately && targets.length > 1) {
      if (!(await uiConfirm(`${targets.length}명에게 한 통씩 따로 보냅니다.`, { title: "따로 보내기", icon: "send", ok: "보내기" }))) return;
    }

    const sendBtn = $("#sendMailButton");
    sendBtn.disabled = true;
    try {
      let sent = 0;
      const warnings = [];
      for (const one of targets) {
        // 개별 발송에서는 참조·숨은참조를 첫 통에만 넣는다
        const body = separately
          ? { ...payload, to: one, cc: sent === 0 ? payload.cc : "", bcc: sent === 0 ? payload.bcc : "" }
          : payload;
        const res = await api("/api/send-email", { method: "POST", body: JSON.stringify(body) });
        if (res.refused?.length) warnings.push(`거절된 주소: ${res.refused.join(", ")}`);
        if (res.savedToSent === false) warnings.push("보낸 편지함에 사본을 못 남겼어요");
        sent += 1;
      }
      showToast(
        (sent > 1 ? `${sent}명에게 각각 보냈습니다.` : "메일을 보냈습니다.") +
          (warnings.length ? ` (${[...new Set(warnings)].join(" · ")})` : ""),
      );
      // 보낸 편지함에 방금 보낸 메일이 보이게 바로 받아 온다
      window.setTimeout(() => refreshMailNow?.(), 800);
      clearAutosave();
      form.dataset.draftId = ""; // 서버 임시저장본은 보내면서 서버가 정리했다
      state.attachments = [];
      showMailPane("list");
    } catch (error) {
      showToast(error.message);
    } finally {
      sendBtn.disabled = false;
    }
  });

  // 과목 변경 확인
  $("#acknowledgeCoursesButton").addEventListener("click", async () => {
    try {
      await api("/api/acknowledge-courses", { method: "POST", body: "{}" });
      showToast("과목 변경을 확인했습니다.");
      await refreshAll();
    } catch (error) {
      showToast(error.message);
    }
  });
  $("#courseChangeSyncButton").addEventListener("click", async () => {
    const confirmed = await uiConfirm("바뀐 과목의 자료를 처음부터 다시 확인합니다.", { title: "전체 동기화", icon: "sync", ok: "시작" });
    if (confirmed) startRun("/api/run", "전체 동기화", { confirm: true, mode: "full" });
  });

  $("#pickFolderButton").addEventListener("click", async () => {
    try {
      const data = await api("/api/pick-folder", { method: "POST", body: "{}" });
      if (data.path) {
        $("#configForm").elements.localSavePath.value = data.path;
        $("#localSaveFolderText").textContent = friendlyPath(data.path);
        $("#localSaveFolderText").parentElement.title = data.path;
        showToast("폴더를 골랐습니다. 설정 저장을 누르면 적용됩니다.");
      } else {
        showToast(data.message || "폴더 선택이 취소되었습니다.");
      }
    } catch (error) {
      showToast(error.message);
    }
  });

  $("#courseFilter").addEventListener("change", (event) => {
    state.course = event.target.value;
    renderFiles();
  });

  $("#statusFilter").addEventListener("change", (event) => {
    state.fileStatus = event.target.value;
    renderFiles();
  });

  $("#deadlineCourseFilter").addEventListener("change", (event) => {
    state.deadlineCourse = event.target.value;
    renderDeadlines();
  });

  $("#deadlineStatusFilter").addEventListener("change", (event) => {
    state.deadlineStatus = event.target.value;
    renderDeadlines();
  });

  // 이제는 '작업 중지' 전용이다 (시작은 위쪽 '자료 새로고침')
  $("#runButton")?.addEventListener("click", () => {
    if (state.task?.running || state.task?.mail?.running) startRun("/api/stop", "중지");
  });

  $("#selectAllFiles").addEventListener("change", (event) => {
    const pickable = document.querySelectorAll('#filesTable [data-pick]:not([disabled])');
    pickable.forEach((box) => {
      box.checked = event.target.checked;
      if (box.checked) {
        state.selectedFiles.add(box.dataset.pick);
      } else {
        state.selectedFiles.delete(box.dataset.pick);
      }
    });
    updateBulkSaveButton();
  });

  $("#restoreFilesButton")?.addEventListener("click", () => {
    setFilesMenu(false);
    restoreHiddenFiles();
  });
  $("#organizeNotesButton")?.addEventListener("click", () => {
    setFilesMenu(false);
    organizeSamsungNotes();
  });
  $("#organizeFilesButton")?.addEventListener("click", () => {
    setFilesMenu(false);
    organizeFiles();
  });
  $("#filesMoreButton")?.addEventListener("click", (event) => {
    event.stopPropagation();
    setFilesMenu($("#filesMoreMenu").hidden);
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".files-more")) setFilesMenu(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setFilesMenu(false);
  });
  $("#clearFileSelection")?.addEventListener("click", clearFileSelection);

  $("#bulkSaveButton").addEventListener("click", () => {
    const names = [...state.selectedFiles];
    if (!names.length) return;
    saveFilesToComputer(names);
  });

  $("#bulkDriveButton")?.addEventListener("click", () => runBulkFileAction("drive", "Drive에 올리는 중"));
  $("#bulkNotesButton")?.addEventListener("click", () => runBulkFileAction("notes", "삼성 노트로 보내는 중"));
  $("#bulkHideButton")?.addEventListener("click", async () => {
    const count = state.selectedFiles.size;
    if (!count) return;
    if (!(await uiConfirm(`고른 자료 ${count}개를 목록에서 뺄까요?\n파일과 Drive 사본은 그대로 남아요.`, { title: "목록에서 빼기", ok: "빼기" }))) return;
    runBulkFileAction("hide", "목록에서 빼는 중");
  });

  $("#fullSyncButton")?.addEventListener("click", async () => {
    const confirmed = await uiConfirm("모든 과목의 자료를 처음부터 다시 확인합니다. 몇 분 걸려요.", {
      title: "전체 다시 확인",
      icon: "sync",
      ok: "시작",
    });
    if (confirmed) {
      startRun("/api/run", "전체 동기화", { confirm: true, mode: "full" });
    }
  });

  // '검증' 버튼은 없앴다. 설정 > 앱 > '전체 다시 확인'이 같은 걱정을 해결한다.
  /* LMS 마감·일정과 메일을 잇달아 가져온다.
     startRun 은 '시작해 달라'고 부탁만 하고 바로 돌아온다. 그래서 곧장
     두 번째를 부르면 서버가 '이미 실행 중'이라며 409를 돌려준다.
     앞 작업이 실제로 끝날 때까지 기다렸다가 다음을 보낸다. */
  // waitForTask 는 전역 함수다 (runViewRefresh·메일함 새로고침도 쓴다)

  $("#refreshAllButton")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    if (button.dataset.busy === "1") return;
    button.dataset.busy = "1";
    splashFromButton(button);
    try {
      await runViewRefresh(state.view);
    } finally {
      button.dataset.busy = "";
    }
  });

  $("#googleLoginButton").addEventListener("click", () => {
    const oauth = state.status?.googleOAuth || {};
    if (!oauth.credentialsExists) {
      showToast("이 판에서는 아직 Google 연결을 쓸 수 없어요.");
      return;
    }
    api("/api/google/connect", {
      method: "POST",
      body: JSON.stringify({ openBrowser: true }),
    })
      .then((data) => {
        if (data.openedInBrowser) {
          showToast("브라우저가 열렸습니다. 구글 계정으로 로그인해 주세요.");
          return;
        }
        if (data.authUrl) {
          if (state.status?.mode === "multi-user") {
            window.location.href = data.authUrl;
          } else {
            window.open(data.authUrl, "_blank");
            showToast("새 창에서 구글 계정으로 로그인해 주세요.");
          }
          return;
        }
        showToast(data.message || "구글 로그인을 시작합니다.");
      })
      .catch((error) => showToast(error.message));
  });

  $("#disconnectGoogleButton").addEventListener("click", async () => {
    const confirmed = await uiConfirm("이 컴퓨터에 저장된 구글 로그인을 지웁니다. Drive·캘린더 연동이 멈춰요.", {
      title: "구글 연결 해제",
      danger: true,
      ok: "해제",
    });
    if (confirmed) {
      startRun("/api/google/disconnect", "구글 로그인 해제");
    }
  });


  $("#openSettingsFromRail")?.addEventListener("click", openSettings);

  bindComposeFiles();
  bindMetricPeek();
  bindTimetable();
  bindBackup();
  bindShelves();
  bindQuicklinks();

  // 동기화 실패 배너
  $("#healthRetryButton")?.addEventListener("click", async () => {
    splashFromButton($("#healthRetryButton"));
    // 실패한 작업을 다시 한다. 예전엔 늘 자료 동기화만 돌려서, 메일 로그인이 막혔다는 경고는 눌러도 그대로였다
    // (메일은 다시 해 보지도 않았다 — 2026-10-21 맥 사용자 신고). 서버가 거절해 쉬는 중이어도 직접 누르면 다시 해 본다.
    const h = state.health || {};
    const kinds = new Set([...Object.keys(h.authFailed || {}), h.lastFailure?.kind].filter(Boolean));
    if (!kinds.size) kinds.add("sync");
    if (kinds.has("emails")) await startRun("/api/refresh-emails", "메일 다시 가져오기");
    if (kinds.has("deadlines")) await startRun("/api/refresh-deadlines", "마감 다시 가져오기");
    if (kinds.has("sync")) await startRun("/api/run", "빠른 동기화", { confirm: true, mode: "fast" });
    await Promise.all([
      kinds.has("emails") ? waitForTask(180000, "mail") : null,
      kinds.has("deadlines") || kinds.has("sync") ? waitForTask() : null,
    ]);
    state.health = null; // 결과를 다시 받아 경고를 새로 그린다
    await refreshAll();
  });
  $("#healthSettingsButton")?.addEventListener("click", openSettings);

  // 자료함: 폴더/리스트 전환
  document.querySelectorAll("[data-filemode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.fileMode = btn.dataset.filemode;
      // 보기 방식을 바꾸면 그쪽을 이제 그려야 한다
      renderFiles();
    });
  });

  // 폴더 펼치기/접기 + 폴더 안에서 저장
  // 폴더 보기: 한 건 선택 / 과목 전체 선택
  $("#folderView")?.addEventListener("change", (event) => {
    const one = event.target.closest("[data-pick]");
    if (one) {
      if (one.checked) state.selectedFiles.add(one.dataset.pick);
      else state.selectedFiles.delete(one.dataset.pick);
      renderFiles();
      return;
    }
    const pathBox = event.target.closest("[data-pickpath]");
    if (pathBox) {
      const [course, ...path] = pathBox.dataset.pickpath.split(FOLDER_KEY_SEP);
      const node = findFolderNode(course, path);
      (node?.all || [])
        .filter((f) => f.status === "local")
        .forEach((f) => {
          if (pathBox.checked) state.selectedFiles.add(f.localName);
          else state.selectedFiles.delete(f.localName);
        });
      renderFiles();
      return;
    }
    const all = event.target.closest("[data-pickfolder]");
    if (all) {
      const course = all.dataset.pickfolder;
      filteredFiles()
        .filter((f) => (f.courseLabel || f.course || "기타") === course && f.status === "local")
        .forEach((f) => {
          if (all.checked) state.selectedFiles.add(f.localName);
          else state.selectedFiles.delete(f.localName);
        });
      renderFiles();
    }
  });

  $("#folderView")?.addEventListener("click", async (event) => {
    // 체크박스는 change 에서 처리하므로 접기/펴기로 넘기지 않는다
    if (event.target.closest("input[type=checkbox]")) return;

    const openBtn = event.target.closest("[data-open-file]");
    if (openBtn && !openBtn.disabled) {
      openOutside(`/api/file?name=${encodeURIComponent(openBtn.dataset.openFile)}`);
      return;
    }
    const notesBtn = event.target.closest("[data-to-notes]");
    if (notesBtn) {
      notesBtn.disabled = true;
      try {
        const res = await api("/api/samsung-notes/send", {
          method: "POST",
          body: JSON.stringify({ name: notesBtn.dataset.toNotes }),
        });
        showToast(res.message || "삼성 노트로 보냈습니다.");
        if (res.started) watchNotesJob();
      } catch (error) {
        showToast(error.message);
      } finally {
        notesBtn.disabled = false;
      }
      return;
    }
    const dropBtn = event.target.closest("[data-drop-file]");
    if (dropBtn && !dropBtn.disabled) {
      // 실제 파일은 두고 목록에서만 뺀다 (되돌리기 쉽도록)
      await dropFileFromList(dropBtn.dataset.dropFile);
      return;
    }
    const saveBtn = event.target.closest("[data-save]");
    if (saveBtn && !saveBtn.disabled) {
      saveFilesToComputer(saveBtn.dataset.save);
      return;
    }
    const subHead = event.target.closest(".subfolder-head");
    if (subHead) {
      const element = subHead.closest(".subfolder");
      const key = element.dataset.subfolder;
      state.openFolders[key] = !state.openFolders[key];
      if (state.openFolders[key]) fillLazySubfolder(element);
      element.classList.toggle("open", state.openFolders[key]);
      subHead.setAttribute("aria-expanded", String(!!state.openFolders[key]));
      return;
    }
    const head = event.target.closest(".folder-head");
    if (head) {
      const card = head.closest(".folder-card");
      const key = card.dataset.folder;
      state.openFolders[key] = !state.openFolders[key];
      // 펼칠 때 비로소 파일 줄을 그린다 (접힌 폴더는 빈 채로 둔다)
      if (state.openFolders[key]) fillLazyFolder(card);
      card.classList.toggle("open", state.openFolders[key]);
      head.setAttribute("aria-expanded", String(!!state.openFolders[key]));
    }
  });

  // 구글 캘린더 지금 동기화
  $("#gcalSyncNowButton")?.addEventListener("click", async (event) => {
    const btn = event.currentTarget;
    btn.disabled = true;
    renderGcalStatus("동기화 중…");
    try {
      const data = await api("/api/gcal/sync", { method: "POST", body: JSON.stringify({}) });
      showToast(`'${data.calendar}' 캘린더에 반영했습니다. ${data.message || ""}`.trim());
      renderGcalStatus(`마지막 동기화: ${data.message || "완료"}`);
    } catch (error) {
      showToast(error.message);
      renderGcalStatus(error.message);
    } finally {
      btn.disabled = false;
    }
  });

  // 과목 편집 모드 토글 / 숨긴 과목 복원
  $("#courseEditButton")?.addEventListener("click", () => {
    state.courseEditMode = !state.courseEditMode;
    renderCourses();
  });
  $("#restoreCoursesButton")?.addEventListener("click", async () => {
    const count = (state.selection.hidden || []).length;
    if (!count) return;
    state.selection.hidden = [];
    try {
      await api("/api/selection", { method: "POST", body: JSON.stringify(state.selection) });
      showToast(`숨긴 과목 ${count}개를 복원했습니다.`);
      renderCourses();
    } catch (error) {
      showToast(error.message);
    }
  });

  // 카드가 넘어가듯 다음 테마로
  $("#themeFlip")?.addEventListener("click", () => {
    const order = THEMES.map((x) => x.key);
    const next = order[(order.indexOf(currentTheme()) + 1) % order.length];
    flipTheme(next);
  });

  $("#exportIcsButton").addEventListener("click", async () => {
    if (!state.deadlines.items.length) {
      showToast("내보낼 마감 정보가 없습니다. 먼저 '새로고침'을 실행해 주세요.");
      return;
    }
    if (state.status?.mode === "multi-user") {
      window.open("/api/deadlines.ics", "_blank");
      return;
    }
    try {
      const data = await api("/api/export-ics", { method: "POST", body: "{}" });
      showToast(data.message || "캘린더 파일을 저장했습니다.");
    } catch (error) {
      showToast(error.message);
    }
  });

  /* 다른 컴퓨터에서 처음 켰을 때 구글 준비물을 넣는 자리.
     파일을 앱에 같이 넣어 돌리지 않으므로, 쓰는 사람이 한 번만 넣으면 된다. */
  $("#credPickButton")?.addEventListener("click", () => $("#credFileInput")?.click());
  $("#credHelpButton")?.addEventListener("click", () => $("#googleHelpDialog")?.showModal());
  $("#credFileInput")?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const res = await api("/api/google/credentials", {
        method: "POST",
        body: JSON.stringify({ json: text }),
      });
      showToast(res.message || "넣었습니다.");
      await refreshAll();
      renderGoogleSection();
    } catch (error) {
      showToast(error.message || "파일을 읽지 못했어요.");
    } finally {
      event.target.value = "";
    }
  });

  $("#googleHelpButton")?.addEventListener("click", () => $("#googleHelpDialog")?.showModal());
  $("#closeGoogleHelpButton").addEventListener("click", () => $("#googleHelpDialog").close());

  $("#openDownloadsButton")?.addEventListener("click", async () => {
    try {
      await api("/api/open-downloads", { method: "POST", body: "{}" });
      showToast("다운로드 폴더를 열었습니다.");
    } catch (error) {
      showToast(error.message);
    }
  });

  // 앱 업데이트는 아래 '새 버전' 부분 (checkForUpdate / startAppUpdate)

  $("#configForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    payload.interestTags = [...state.interestTags];
    payload.hidePastEmails = event.currentTarget.elements.hidePastEmails.checked;
    payload.notifyDeadlines = event.currentTarget.elements.notifyDeadlines?.checked !== false;
    payload.notifyNewFiles = event.currentTarget.elements.notifyNewFiles?.checked !== false;
    payload.gcalSyncEnabled = event.currentTarget.elements.gcalSyncEnabled.checked;
    payload.driveUpload = event.currentTarget.elements.driveUpload.checked;
    Object.assign(payload, savePlacePayload());
    delete payload.localSaveScope;
    const wasLocalSave = state.config?.autoLocalSave || "off";
    try {
      await api("/api/config", { method: "POST", body: JSON.stringify(payload) });
      showToast("설정을 저장했습니다.");
      // 저장 위치를 새로 켰으면 다음 동기화까지 기다리지 않고 지금 한 번 맞춘다
      const cloudsBefore = (state.config?.clouds || []).filter((c) => c.on).map((c) => c.key).join();
      const cloudsNow = Object.entries(payload.clouds || {}).filter(([, v]) => v.on).map(([k]) => k).join();
      const newlyOn =
        (payload.autoLocalSave !== "off" && payload.autoLocalSave !== wasLocalSave) ||
        (cloudsNow && cloudsNow !== cloudsBefore);
      if (newlyOn) runLocalSaveNow({ alreadySaved: true });
      await refreshAll();
      switchView("dashboard");
    } catch (error) {
      showToast(error.message);
    }
  });

  document.querySelectorAll(".nav-item[data-view]").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });
  bindMoreSheet();

  document.querySelectorAll("[data-goto]").forEach((node) => {
    node.addEventListener("click", () => switchView(node.dataset.goto));
  });
}

/* ===== 테마 =====
   누를 때마다 이 차례대로 넘어간다. */
// '자동' 은 Windows 의 밝게/어둡게 설정을 따른다 (밝으면 기본, 어두우면 다크). 처음 쓰는 사람의 기본값.
// 테마는 자동·기본·다크 셋만 (2026-10-15 사용자: '테마가 너무 많다, 예전 기본과 다크만').
// 화이트·남색·그래파이트(밝음/어두움)는 목록에서 뺐다. 색 정의는 styles.css 에 남아 있어 다시 넣을 수 있다.
// 예전에 뺀 테마를 저장해 둔 사람은 applyTheme 이 목록에 없다고 보고 '자동' 으로 돌린다.
const THEMES = [
  { key: "auto", label: "자동", icon: "monitor" },
  { key: "claude", label: "기본", icon: "sparkle" },
  { key: "dark", label: "다크", icon: "moon" },
];

const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

/** 고른 테마(auto 포함) → 실제로 칠할 테마 */
function resolveTheme(choice) {
  if (choice === "auto") return systemDark.matches ? "dark" : "claude";
  return choice;
}

function applyTheme(choice, { save = true } = {}) {
  if (!THEMES.some((t) => t.key === choice)) choice = "auto";
  state.themeChoice = choice;
  const theme = resolveTheme(choice);
  // claude 기본은 :root라 data-theme를 비움
  if (theme === "claude") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.dataset.theme = theme;
  }
  try {
    localStorage.setItem("autosaver-theme-v2", choice);
  } catch (error) {
    /* localStorage 사용 불가 환경 무시 */
  }
  paintThemeCard(choice);
  // 앱 창의 저장소는 끌 때마다 지워진다. 데이터 폴더에 적어야 다음에 켤 때도 그대로다.
  if (save) api("/api/ui-prefs", { method: "POST", body: JSON.stringify({ theme: choice }) }).catch(() => {});
}

function paintThemeCard(choice) {
  const meta = THEMES.find((x) => x.key === choice) || THEMES[0];
  const card = $("#themeCard");
  const name = $("#themeName");
  if (card) {
    card.innerHTML = `<span class="icon" data-icon="${meta.icon}"></span>`;
    installIcons(card);
  }
  if (name) name.textContent = meta.label;
  const flip = $("#themeFlip");
  if (flip) {
    flip.title =
      choice === "auto"
        ? `기기 설정을 따라요 · 지금 ${systemDark.matches ? "어두운" : "밝은"} 화면 (누르면 다음 테마)`
        : `${meta.label} 테마 (누르면 다음 테마)`;
  }
}

// Windows 에서 밝게/어둡게를 바꾸면 켜 둔 채로도 바로 따라간다.
// change 이벤트가 오지 않는 경우가 있어서(실측: 값은 바뀌었는데 이벤트 0번) 창으로 돌아올 때와 3초마다도 본다.
let lastSystemDark = systemDark.matches;
function followSystemTheme() {
  if (systemDark.matches === lastSystemDark) return;
  lastSystemDark = systemDark.matches;
  if (state.themeChoice === "auto") applyTheme("auto", { save: false });
}
systemDark.addEventListener?.("change", followSystemTheme);
window.addEventListener("focus", followSystemTheme);
window.setInterval(followSystemTheme, 3000);

/** 카드를 반 바퀴 돌리고, 뒤집힌 순간에 내용을 갈아 끼운다 */
function flipTheme(next) {
  const card = $("#themeCard");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!card || reduce) {
    applyTheme(next);
    return;
  }
  card.classList.add("flipping");
  // 90도에서 앞뒤가 바뀐다. 그때 갈아 끼워야 뒤집히는 것처럼 보인다.
  window.setTimeout(() => applyTheme(next), 150);
  window.setTimeout(() => card.classList.remove("flipping"), 320);
}

function currentTheme() {
  return state.themeChoice || "auto";
}

function initTheme() {
  // 먼저 가진 값으로 바로 칠해 깜박임을 줄이고, 데이터 폴더에 적힌 값이 오면 그걸로 맞춘다
  let saved = "auto";
  try {
    // 예전 키(autosaver-theme)는 고르지 않아도 켤 때마다 '기본' 이 적혀 있어서 사용자의 선택이라 볼 수 없다
    saved = localStorage.getItem("autosaver-theme-v2") || "auto";
  } catch (error) {
    /* 무시 */
  }
  applyTheme(saved, { save: false });
  api("/api/ui-prefs")
    .then((prefs) => {
      if (prefs?.theme && prefs.theme !== state.themeChoice) applyTheme(prefs.theme, { save: false });
      initLanguage(prefs?.lang);
      paintLanguageChoice(prefs?.lang);
    })
    .catch(() => initLanguage(null));
}

/* ===== 학교 사이트 바로가기 =====
   주소는 DGIST 공식 홈페이지에 실제로 걸려 있는 링크에서 확인한 것들이다. */
const BOARD_BASE = "https://stuecm.dgist.ac.kr/s/potal_board";
const STUD = "https://stud.dgist.ac.kr";
const DGIST = "https://www.dgist.ac.kr";

const SCHOOL_LINKS = [
  // --- 자주 쓰는 것 ---
  { g: "자주", name: "LMS", desc: "강의·과제", url: "https://lms.dgist.ac.kr", icon: "book", primary: true },
  { g: "자주", name: "학생 포탈", desc: "수강·성적·증명", url: "https://my.dgist.ac.kr", icon: "layout", primary: true },
  { g: "자주", name: "웹메일", desc: "학교 메일", url: "https://mail.dgist.ac.kr", icon: "mail", primary: true },
  { g: "자주", name: "전자도서관", desc: "자료 검색·열람실", url: "https://library.dgist.ac.kr", icon: "book", primary: true },
  { g: "자주", name: "비슬빌리지", desc: "생활관 신청·공지", url: "https://dorm.dgist.ac.kr", icon: "folder", primary: true },
  { g: "자주", name: "공식 홈페이지", desc: "공지·소식", url: DGIST, icon: "layout", primary: true },

  // --- 학사 (포탈에서 확인한 실제 주소) ---
  { g: "학사", name: "학사일정", desc: "연간 학사 일정", url: `${DGIST}/prog/schafsSchdul/kor/sub05_01_01/list.do`, icon: "calendar" },
  { g: "학사", name: "수강과목조회", desc: "이번 학기 수강 내역", url: `${STUD}/ucr/ucrqTlsnInq/index.do`, icon: "book" },
  { g: "학사", name: "학기 성적조회", desc: "이번 학기 성적", url: `${STUD}/ugd/ugdqMrksInq/index.do`, icon: "layout" },
  { g: "학사", name: "전체 성적조회", desc: "누적 성적·평점", url: `${STUD}/ugd/ugdqMrksTotInq/index.do`, icon: "layout" },
  { g: "학사", name: "졸업 시뮬레이션", desc: "졸업 요건 확인", url: `${STUD}/ugt/ugtrSimuHis/index.do`, icon: "sparkle" },
  { g: "학사", name: "장학금 지급현황", desc: "수혜 내역", url: `${STUD}/uss/ussqScafeeInq/index.do`, icon: "grid" },
  { g: "학사", name: "학적변동 신청", desc: "휴학·복학", url: `${STUD}/usr/usreSchgAplyStud/index.do`, icon: "edit" },
  { g: "학사", name: "개인정보 관리", desc: "주소·연락처", url: `${STUD}/usr/usreShregBodyCorr/index.do`, icon: "settings" },
  { g: "학사", name: "증명서 발급", desc: "재학·성적증명", url: "https://certi.dgist.ac.kr/icerti", icon: "file" },
  { g: "학사", name: "개설과목 조회", desc: "시간표 짜기", url: "https://welcome.dgist.ac.kr/ucs/ucsqProfRespSbjtInq/index.do", icon: "search" },

  // --- 게시판 (포탈 게시판 코드는 실제 페이지에서 확인) ---
  { g: "게시판", name: "학생게시판", desc: "최신 게시물", url: `${BOARD_BASE}/_0031/listBbs.do`, icon: "grid" },
  { g: "게시판", name: "학사공지", desc: "학사팀 공지", url: `${BOARD_BASE}/_0014/listBbs.do`, icon: "alert" },
  { g: "게시판", name: "학생지원", desc: "학생지원팀", url: `${BOARD_BASE}/_0004/listBbs.do`, icon: "help" },
  { g: "게시판", name: "기초학부 바로바로", desc: "기초학부 안내", url: `${BOARD_BASE}/_0010/listBbs.do`, icon: "book" },
  { g: "게시판", name: "식단표", desc: "학식 메뉴", url: `${BOARD_BASE}/_0008/listBbs.do`, icon: "grid" },
  { g: "게시판", name: "장학 안내", desc: "장학 공지", url: `${BOARD_BASE}/_0161/listBbs.do`, icon: "sparkle" },
  { g: "게시판", name: "진로 지원", desc: "채용·인턴", url: `${BOARD_BASE}/_0162/listBbs.do`, icon: "edit" },
  { g: "게시판", name: "글로벌 프로그램", desc: "교환·해외", url: `${BOARD_BASE}/_0160/listBbs.do`, icon: "layout" },
  { g: "게시판", name: "전문연/병무", desc: "병역 안내", url: `${BOARD_BASE}/_0163/listBbs.do`, icon: "alert" },
  { g: "게시판", name: "세미나 공지", desc: "학술 세미나", url: `${BOARD_BASE}/_0002/listBbs.do`, icon: "calendar" },
  { g: "게시판", name: "학생단체", desc: "동아리·학생회", url: `${BOARD_BASE}/_0168/listBbs.do`, icon: "grid" },
  { g: "게시판", name: "전화번호부", desc: "부서 연락처", url: `${BOARD_BASE}/_0007/listBbs.do`, icon: "help" },

  // --- 안내 문서 ---
  { g: "안내", name: "학사안내", desc: "교육과정·수강신청", url: `${DGIST}/kor/sub05_01_02_01.do`, icon: "book" },
  { g: "안내", name: "학적안내", desc: "휴학·복학 규정", url: `${DGIST}/kor/sub05_01_03_01.do`, icon: "file" },
  { g: "안내", name: "장학안내", desc: "장학 제도", url: `${DGIST}/kor/sub05_01_04_01.do`, icon: "sparkle" },
  { g: "안내", name: "병무안내", desc: "병역 제도", url: `${DGIST}/kor/sub05_01_07_01.do`, icon: "alert" },

  // --- 기타 ---
  { g: "기타", name: "통합인증", desc: "계정·비밀번호", url: "https://auth.dgist.ac.kr", icon: "settings" },
  { g: "기타", name: "EASY IT", desc: "전산 문의·요청", url: "https://easyit.dgist.ac.kr", icon: "help" },
  { g: "기타", name: "OFFICE 365", desc: "학교 계정 오피스", url: "https://www.office.com", icon: "grid" },
  { g: "기타", name: "저작도구", desc: "commons", url: "https://commons.dgist.ac.kr", icon: "edit" },
  { g: "기타", name: "T-market", desc: "교내 장터", url: "https://tmarket.dgist.ac.kr", icon: "grid" },
  { g: "기타", name: "인권교육연수원", desc: "법정의무교육", url: "https://dgist.ac.kr/humanrights/", icon: "help" },
  { g: "기타", name: "DGIST Scholar", desc: "연구 성과", url: "https://scholar.dgist.ac.kr", icon: "sparkle" },
  { g: "기타", name: "안전보안관리", desc: "실험실 안전", url: "https://safety.dgist.ac.kr", icon: "alert" },
  { g: "기타", name: "전자연구노트", desc: "연구 기록", url: "https://ern.dgist.ac.kr", icon: "file" },
  { g: "기타", name: "산학협력단", desc: "과제·협력", url: `${DGIST}/ouic/index.do`, icon: "layout" },
  { g: "기타", name: "지식재산관리", desc: "DIPS", url: "https://dips.dgist.ac.kr", icon: "file" },
  { g: "기타", name: "연구인프라(D-HUB)", desc: "장비 예약", url: "https://dhub.dgist.ac.kr", icon: "grid" },
  { g: "기타", name: "DGIST 아카이브", desc: "기록물", url: "https://archives.dgist.ac.kr", icon: "folder" },
  { g: "기타", name: "수강통계", desc: "졸업생 수강 통계", url: "https://portal.dgist.ac.kr/sta/staMain/index.do", icon: "layout" },
  { g: "기타", name: "교직원 포탈", desc: "임직원용", url: "https://portal.dgist.ac.kr", icon: "layout" },
];

function renderQuicklinks() {
  const wrap = $("#quicklinks");
  if (!wrap) return;
  const showAll = !!state.showAllLinks;
  const items = showAll ? SCHOOL_LINKS : SCHOOL_LINKS.filter((l) => l.primary);

  const card = (l) => `
      <a class="quicklink" href="${escapeHtml(l.url)}" target="_blank" rel="noreferrer"
         data-link="${escapeHtml(l.url)}" title="${escapeHtml(l.url)}">
        <span class="quicklink-icon"><span class="icon" data-icon="${l.icon}"></span></span>
        <span class="quicklink-text">
          <strong>${escapeHtml(l.name)}</strong>
          <span>${escapeHtml(l.desc)}</span>
        </span>
      </a>`;

  if (showAll) {
    // 수가 많아 묶지 않으면 찾기 어렵다
    const order = ["자주", "학사", "게시판", "안내", "기타"];
    wrap.innerHTML = order
      .map((g) => {
        const rows = SCHOOL_LINKS.filter((l) => l.g === g);
        if (!rows.length) return "";
        return `<div class="quicklink-group"><h3>${escapeHtml(g)}</h3>
          <div class="quicklink-grid">${rows.map(card).join("")}</div></div>`;
      })
      .join("");
    installIcons(wrap);
    const t2 = $("#toggleQuicklinks");
    if (t2) t2.textContent = "자주 쓰는 것만";
    return;
  }

  wrap.innerHTML = items
    .map(
      (l) => `
      <a class="quicklink" href="${escapeHtml(l.url)}" target="_blank" rel="noreferrer"
         data-link="${escapeHtml(l.url)}" title="${escapeHtml(l.url)}">
        <span class="quicklink-icon"><span class="icon" data-icon="${l.icon}"></span></span>
        <span class="quicklink-text">
          <strong>${escapeHtml(l.name)}</strong>
          <span>${escapeHtml(l.desc)}</span>
        </span>
      </a>`,
    )
    .join("");
  installIcons(wrap);

  const toggle = $("#toggleQuicklinks");
  if (toggle) toggle.textContent = showAll ? "자주 쓰는 것만" : "전체 보기";
}

function bindQuicklinks() {
  $("#toggleQuicklinks")?.addEventListener("click", () => {
    state.showAllLinks = !state.showAllLinks;
    try {
      localStorage.setItem("autosaver-links-all", state.showAllLinks ? "1" : "0");
    } catch (error) {
      /* 무시 */
    }
    renderQuicklinks();
  });

  // 데스크톱 앱(WebView)에서는 새 창 대신 기본 브라우저로 열어 준다
  $("#quicklinks")?.addEventListener("click", (event) => {
    const link = event.target.closest("[data-link]");
    if (!link) return;
    event.preventDefault();
    const url = link.dataset.link;
    api("/api/open-url", { method: "POST", body: JSON.stringify({ url }) }).catch(() => {
      window.open(url, "_blank", "noreferrer");
    });
  });

  try {
    state.showAllLinks = localStorage.getItem("autosaver-links-all") === "1";
  } catch (error) {
    /* 무시 */
  }
}

/* ===== 저장 공간 ===== */
async function renderStorage() {
  const box = $("#storageBox");
  if (!box) return;
  try {
    const s = await api("/api/storage");
    state.storage = s;
    const disk = s.disk || {};
    const shared = s.sharedFolder
      ? `<p class="storage-warn">개인 폴더(<code>${escapeHtml(s.downloadPath)}</code>)에 받고 있어요. 앱이 받은 자료만 정리합니다.</p>`
      : "";

    // 앱 크기 / 강의자료 / 내 컴퓨터 사본을 한 막대에 나눠 보인다.
    // 막대 길이는 셋의 합 기준 (디스크 전체 기준이면 1TB 에 1GB 라 안 보인다).
    const app = s.app || { bytes: 0, human: "0 B", parts: [] };
    const local = s.localSave || {};
    const segs = [
      { key: "app", label: "앱", bytes: app.bytes, human: app.human,
        detail: app.parts.map((p) => `${p.label} ${p.human}`).join(" · ") },
      { key: "files", label: "강의자료", bytes: s.appBytes, human: s.appHuman,
        detail: `${s.appFileCount}개 · 앱 보관함` },
    ];
    if (local.enabled) {
      segs.push({ key: "local", label: "내 컴퓨터 사본", bytes: local.bytes, human: local.human,
        detail: `${local.count}개 · ${local.path}` });
    }
    const cloud = s.cloudSave || {};
    if (cloud.parts?.length) {
      // 클라우드 폴더도 파일을 받아 두는 동안은 이 PC 공간을 쓴다 (요청 시 다운로드를 켜면 줄어든다)
      segs.push({ key: "cloud", label: "클라우드 폴더", bytes: cloud.bytes, human: cloud.human,
        detail: cloud.parts.map((p) => `${p.label} ${p.human}`).join(" · ") });
    }
    const sum = segs.reduce((n, x) => n + (x.bytes || 0), 0) || 1;
    // Windows 는 Edge 로 로그인한다. 그 전에 받아 둔 헤드리스 셸(약 270MB)은 안 쓰여 휴지통으로 보낼 수 있게 한다.
    const oldBrowser = app.parts.find((p) => p.key === "browser" && p.unused);
    const free = $("#diskFreeText");
    if (free) {
      free.textContent = disk.freeHuman ? `디스크 여유 ${disk.freeHuman}` : "";
      free.classList.toggle("low", Boolean(disk.low));
    }

    box.innerHTML = `
      <div class="st-bar" aria-hidden="true">
        ${segs
          .map((x) => `<span class="st-bar-seg ${x.key}" style="flex-grow:${Math.max(x.bytes / sum, 0.015)}"></span>`)
          .join("")}
      </div>
      <div class="st-legend">
        ${segs
          .map(
            (x) => `
          <div class="st-legend-item">
            <span class="st-dot ${x.key}"></span>
            <div>
              <strong>${x.label} <b>${x.human}</b></strong>
              <span title="${escapeHtml(x.detail)}">${escapeHtml(x.detail)}</span>
            </div>
          </div>`,
          )
          .join("")}
      </div>
      ${
        oldBrowser
          ? `<div class="st-oldbrowser">
              <div>
                <strong>예전에 받은 LMS 브라우저 <b>${oldBrowser.human}</b></strong>
                <span>지금은 Microsoft Edge로 로그인해서 쓰지 않아요</span>
              </div>
              <button class="button compact" id="trashOldBrowserButton" type="button">휴지통으로 보내기</button>
            </div>`
          : ""
      }
      ${disk.low ? `<p class="storage-warn">디스크 여유 공간이 부족합니다. 지난 학기 자료를 정리해 보세요.</p>` : ""}
      ${shared}
      <details class="st-clean">
        <summary>강의자료 정리하기 <span>지난 학기 자료를 지워 공간을 비웁니다</span></summary>
      ${
        s.semesters.length
          ? `<div class="storage-group">
              <h4>학기별</h4>
              ${s.semesters
                .map(
                  (x) => `
                <div class="storage-row">
                  <label>
                    <input type="checkbox" data-sem="${escapeHtml(x.name)}" />
                    <span>${escapeHtml(x.name)}</span>
                  </label>
                  <span class="storage-size">${x.human} · ${x.count}개</span>
                </div>`,
                )
                .join("")}
            </div>`
          : `<p class="section-note">아직 분류된 강의자료가 없습니다.</p>`
      }
      ${
        s.courses.length
          ? `<details class="storage-details">
               <summary>과목별로 보기 (${s.courses.length}개)</summary>
               ${s.courses
                 .map(
                   (x) => `
                 <div class="storage-row">
                   <label>
                     <input type="checkbox" data-course-storage="${escapeHtml(x.name)}" />
                     <span title="${escapeHtml(x.name)}">${escapeHtml(shortText(x.name, 34))}</span>
                   </label>
                   <span class="storage-size">${x.human} · ${x.count}개</span>
                 </div>`,
                 )
                 .join("")}
             </details>`
          : ""
      }
      ${
        s.unknown.count
          ? `<p class="section-note storage-personal">
               그 밖의 파일 ${s.unknown.count}개(${s.unknown.human})
               <button type="button" class="hint" data-hint="앱이 받은 게 아닌 파일이라 정리 대상에서 뺐습니다. 지우지 않습니다.">?</button>
             </p>`
          : ""
      }
      <p class="st-clean-note">앱 보관함에서만 지움 · Drive·내 컴퓨터 사본은 남음 · 지난 학기 자료는 다시 못 받을 수 있음</p>
      <div class="storage-actions">
        <button class="button compact danger" id="cleanupStorageButton" type="button" disabled>선택 항목 정리</button>
      </div>
      </details>`;

    const sync = () => {
      const picked = box.querySelectorAll("input[type=checkbox]:checked").length;
      const btn = $("#cleanupStorageButton");
      // 저장 공간 칸을 다시 그리는 사이에 불릴 수 있다
      if (!btn) return;
      btn.disabled = picked === 0;
      btn.textContent = picked ? `선택한 ${picked}개 정리` : "선택 항목 정리";
    };
    box.querySelectorAll("input[type=checkbox]").forEach((c) => c.addEventListener("change", sync));

    $("#trashOldBrowserButton")?.addEventListener("click", async (event) => {
      if (
        !(await uiConfirm(
          `예전에 받은 LMS 로그인 브라우저(${oldBrowser.human})를 휴지통으로 보냅니다.\n\n` +
            "지금은 Microsoft Edge로 로그인해서 필요 없어요. Edge가 안 되는 날엔 앱이 다시 받아요.",
          { title: "안 쓰는 브라우저 정리", ok: "휴지통으로" },
        ))
      )
        return;
      event.target.disabled = true;
      try {
        const r = await api("/api/storage/trash-browser", { method: "POST", body: "{}" });
        showToast(r.message);
      } catch (error) {
        showToast(error.message);
      }
      renderStorage();
    });

    $("#cleanupStorageButton")?.addEventListener("click", async () => {
      const semesters = [...box.querySelectorAll("[data-sem]:checked")].map((c) => c.dataset.sem);
      const courses = [...box.querySelectorAll("[data-course-storage]:checked")].map(
        (c) => c.dataset.courseStorage,
      );
      const names = [...semesters, ...courses];
      if (!names.length) return;
      // 한 문자열로 둔다. tr() 은 공백을 한 칸으로 줄인 문장 전체를 번역표와 맞추는데, 둘로 나눠 두면
      // 앞쪽 틀의 {0} 이 뒷문장까지 삼켜 영어 화면에 한국어 반쪽이 남았다.
      // 이름은 목록에 보이는 것과 같게 하나씩 옮긴다(한국어 화면에서는 그대로).
      const list = names.map((n) => tr(n)).join(", ");
      if (
        !(await uiConfirm(
          `다음 강의자료를 앱 보관함에서 지웁니다.\n${list}\n\n직접 넣은 파일과 드라이브·내 컴퓨터 사본은 그대로예요. 지난 학기 자료는 LMS에서 다시 받지 못할 수 있어요.`,
          { title: "강의자료 정리", danger: true, ok: "지우기" },
        ))
      )
        return;
      try {
        const r = await api("/api/storage/cleanup", {
          method: "POST",
          body: JSON.stringify({ semesters, courses }),
        });
        showToast(r.message);
        renderStorage();
      } catch (error) {
        showToast(error.message);
      }
    });
  } catch (error) {
    box.innerHTML = `<p class="section-note">저장 공간 정보를 불러오지 못했습니다: ${escapeHtml(error.message)}</p>`;
  }
}

/* ===== 동기화 상태 (조용한 실패 방지) ===== */
async function renderHealth() {
  const banner = $("#healthBanner");
  if (!banner) return;
  try {
    // refreshAll 이 이미 받아 두었으면 그걸 쓴다 (12초마다 또 부르지 않게)
    const h = state.health || (await api("/api/health"));
    state.health = h;
    if (!h.warning) {
      banner.hidden = true;
      return;
    }
    // 실패한 작업의 마지막 성공을 보여 준다. 예전엔 모든 작업 중 가장 최근 것이라, 메일이 막혔는데
    // 마감 확인 시각(15:32)이 '마지막 성공' 으로 나와 메일은 멀쩡한 것처럼 보였다.
    const failKind = Object.keys(h.authFailed || {})[0] || h.lastFailure?.kind;
    const last = failKind && h.lastSuccess?.[failKind]
      ? h.lastSuccess[failKind]
      : Object.values(h.lastSuccess || {}).sort().pop();
    $("#healthTitle").textContent =
      h.consecutiveFailures >= 2 ? "동기화가 계속 실패하고 있어요" : "한동안 동기화가 되지 않았어요";
    $("#healthDetail").textContent =
      h.warning + (last ? ` (마지막 성공: ${String(last).replace("T", " ")})` : "");
    banner.hidden = false;
  } catch (error) {
    banner.hidden = true;
  }
}

/* ===== 설정 백업 ===== */
function bindBackup() {
  $("#exportSettingsButton")?.addEventListener("click", async () => {
    const withSecrets = $("#backupSecrets")?.checked;
    if (
      withSecrets &&
      !(await uiConfirm("비밀번호가 그대로 담긴 파일이 만들어져요. 다른 사람에게 주지 마세요.", {
        title: "비밀번호 포함 내보내기",
        icon: "alert",
        ok: "내보내기",
      }))
    )
      return;
    try {
      const data = await api(`/api/config/export?secrets=${withSecrets ? 1 : 0}`);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `Daling-설정-${stamp}${withSecrets ? "-비밀번호포함" : ""}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("설정을 내보냈습니다.");
    } catch (error) {
      showToast(error.message);
    }
  });

  $("#importSettingsButton")?.addEventListener("click", () => $("#importSettingsInput")?.click());
  $("#importSettingsInput")?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!(await uiConfirm("백업 파일의 내용으로 지금 설정을 덮어씁니다.", { title: "설정 불러오기", icon: "download", ok: "덮어쓰기" }))) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const r = await api("/api/config/import", { method: "POST", body: JSON.stringify({ data }) });
      showToast(r.message);
      await refreshAll();
      populateSettings();
    } catch (error) {
      showToast(error.message || "백업 파일을 읽을 수 없습니다.");
    }
  });
}

/* ===== 주간 시간표 (에브리타임 방식) ===== */
const TT_DAYS = ["월", "화", "수", "목", "금", "토"];
// 12가지. 6가지일 때는 7과목째부터 반드시 겹쳤다. 순서는 styles.css 의 .tone-* 와 같다.
const TT_COLORS = ["coral", "blue", "green", "amber", "violet", "teal", "rose", "olive", "indigo", "plum", "sky", "brown"];
const TT_START_HOUR = 9;   // 표의 시작 시각
const TT_END_HOUR = 21;    // 표의 끝 시각

function ttMinutes(hhmm) {
  const [h, m] = String(hhmm || "0:0").split(":").map(Number);
  return h * 60 + (m || 0);
}

/* 시간표 요약: 과목 수와 총 학점.
   한 과목이 주 2~3회면 칸도 그만큼 생기므로, 학점은 과목 단위로 한 번만 센다.
   (과목번호가 있으면 그걸로, 없으면 이름으로 묶는다) */
function ttCourseKey(entry) {
  return (entry.courseNo || "").trim() || (entry.title || "").trim();
}

function ttTotalCredit(entries) {
  const seen = new Map();
  (entries || []).forEach((e) => {
    const key = ttCourseKey(e);
    if (key && !seen.has(key)) seen.set(key, parseFloat(e.credit) || 0);
  });
  let total = 0;
  seen.forEach((v) => {
    total += v;
  });
  return { courses: seen.size, credit: total };
}

function ttSummaryText(entries) {
  const { courses, credit } = ttTotalCredit(entries);
  const parts = [`${courses}과목`];
  if (credit > 0) {
    // 1.0 학점짜리 실험이 섞이므로 소수 첫째 자리까지, 정수면 깔끔하게
    parts.push(`${Number.isInteger(credit) ? credit : credit.toFixed(1)}학점`);
  }
  return parts.join(" · ");
}

function renderTimetable() {
  const grid = $("#timetable");
  if (!grid) return;
  // 과목끼리 같은 색이 있으면 그릴 때마다 정리한다.
  // 예전에는 앱을 켤 때 한 번만 해서, 가져오기로 과목이 들어오면 겹친 채로 남았다.
  const recolored = normalizeTtColors();
  if (recolored.length) saveTtColors(recolored);
  const entries = state.timetable || [];
  const showSat = state.ttShowSat || entries.some((e) => Number(e.day) === 5);
  const dayCount = showSat ? 6 : 5;
  const satBox = $("#timetableSat");
  if (satBox) satBox.checked = showSat;

  // 등록된 수업에 맞춰 표의 시간 범위를 자동 조절
  let startHour = TT_START_HOUR;
  let endHour = TT_END_HOUR;
  entries.forEach((e) => {
    startHour = Math.min(startHour, Math.floor(ttMinutes(e.start) / 60));
    endHour = Math.max(endHour, Math.ceil(ttMinutes(e.end) / 60));
  });
  const totalMin = (endHour - startHour) * 60;
  const pxPerMin = 0.9;

  grid.style.setProperty("--tt-days", String(dayCount));
  grid.style.setProperty("--tt-height", `${totalMin * pxPerMin}px`);
  // 미리보기가 같은 좌표계를 쓰도록 남겨 둔다
  grid.dataset.startHour = String(startHour);
  grid.dataset.pxPerMin = String(pxPerMin);

  const hourRows = [];
  for (let h = startHour; h < endHour; h += 1) {
    hourRows.push(
      `<div class="tt-hour" style="top:${(h - startHour) * 60 * pxPerMin}px">
         <span>${h}</span>
       </div>`,
    );
  }

  const cols = [];
  for (let d = 0; d < dayCount; d += 1) {
    const blocks = entries
      .filter((e) => Number(e.day) === d)
      .map((e) => {
        const top = (ttMinutes(e.start) - startHour * 60) * pxPerMin;
        const height = Math.max(22, (ttMinutes(e.end) - ttMinutes(e.start)) * pxPerMin);
        return `
          <button type="button" class="tt-block tone-${escapeHtml(e.color || "coral")}"
                  style="top:${top}px;height:${height}px" data-tt="${escapeHtml(e.id)}"
                  title="${escapeHtml(e.title)}${e.credit ? " · " + escapeHtml(e.credit) + "학점" : ""}${e.professor ? " · " + escapeHtml(e.professor) : ""}${e.room ? " · " + escapeHtml(e.room) : ""}">
            <strong>${escapeHtml(e.title)}</strong>
            ${e.room ? `<span>${escapeHtml(shortText(e.room, 14))}</span>` : ""}
            <em>${escapeHtml(e.start)}~${escapeHtml(e.end)}</em>
            ${e.professor ? `<small class="tt-prof">${escapeHtml(e.professor)}</small>` : ""}
          </button>`;
      })
      .join("");
    cols.push(`<div class="tt-col" data-day="${d}">${blocks}</div>`);
  }

  grid.innerHTML = `
    <div class="tt-head">
      <div class="tt-corner"></div>
      ${TT_DAYS.slice(0, dayCount).map((n, i) => `<div class="tt-dayname ${i === 5 ? "sat" : ""}">${n}</div>`).join("")}
    </div>
    <div class="tt-body" style="height:${totalMin * pxPerMin}px">
      <div class="tt-hours">${hourRows.join("")}</div>
      <div class="tt-cols">${cols.join("")}</div>
    </div>`;

  // 커서를 올려 둔 과목이 있으면 그 자리에 미리보기를 얹는다
  renderTtPreview();

  const hint = $("#timetableHint");
  if (hint) {
    hint.textContent = entries.length
      ? ttSummaryText(entries) // 사용법 안내는 뺐다: 흐린 부가 설명은 꼭 필요한 것만 (2026-10-14)
      : "빈 칸을 누르면 과목을 넣을 수 있어요.";
  }
}

/* ===== 개설과목 미리보기 =====
   목록의 과목에 커서를 올리면 시간표 위에 '들어갈 자리'를 흐리게 보여 준다.
   이미 있는 수업과 겹치면 그 수업을 빨갛게 표시해, 넣으면 대체된다는 걸 알린다. */
/* 시간표 색 고르기.
   전에는 (개수 % 색개수)라서, 과목을 지웠다 넣으면 같은 색이 겹쳤다.
   에타처럼 '지금 안 쓰는 색'을 먼저 준다.
   같은 과목(이름이 같은 여러 요일)은 같은 색을 유지한다. */
/* 이미 저장된 시간표에서 서로 다른 과목이 같은 색을 쓰고 있으면 다시 칠한다.
   (색 고르는 규칙을 고치기 전에 넣은 과목들이 겹쳐 있다) */
function normalizeTtColors() {
  const entries = state.timetable || [];
  if (!entries.length) return [];

  // 같은 과목(과목번호, 없으면 이름)은 요일이 달라도 한 색. 서로 다른 과목은 반드시 다른 색.
  const courses = [];
  const seen = new Set();
  entries.forEach((e) => {
    const key = ttCourseKey(e);
    if (!seen.has(key)) {
      seen.add(key);
      courses.push(key);
    }
  });

  const assigned = new Map();
  const used = new Map(); // 색 → 쓰는 과목 수
  const take = (color) => used.set(color, (used.get(color) || 0) + 1);
  // 1) 이미 가진 색이 다른 과목과 안 겹치면 그대로 둔다 (사용자가 고른 색을 존중)
  courses.forEach((key) => {
    const current = entries.find((e) => ttCourseKey(e) === key && TT_COLORS.includes(e.color))?.color;
    if (current && !used.has(current)) {
      assigned.set(key, current);
      take(current);
    }
  });
  // 2) 겹쳤거나 색이 없는 과목은 아직 안 쓴 색부터, 다 쓰였으면 가장 적게 쓰인 색
  courses.forEach((key) => {
    if (assigned.has(key)) return;
    const free = TT_COLORS.find((c) => !used.has(c));
    const next = free || [...TT_COLORS].sort((a, b) => (used.get(a) || 0) - (used.get(b) || 0))[0];
    assigned.set(key, next);
    take(next);
  });

  const changed = [];
  entries.forEach((e) => {
    const want = assigned.get(ttCourseKey(e));
    if (want && e.color !== want) {
      e.color = want;
      changed.push(e);
    }
  });
  return changed;
}


/** 다시 칠한 칸만 서버에 남긴다 (여러 번 겹쳐 부르지 않게 한 번에 하나씩) */
async function saveTtColors(changed) {
  saveTtColors.queue = [...(saveTtColors.queue || []), ...changed];
  if (saveTtColors.busy) return;
  saveTtColors.busy = true;
  try {
    while (saveTtColors.queue.length) {
      const e = saveTtColors.queue.shift();
      await api("/api/timetable/save", { method: "POST", body: JSON.stringify(e) });
    }
  } catch (error) {
    /* 색 저장에 실패해도 화면에는 반영돼 있고, 다음에 그릴 때 다시 맞춘다 */
    saveTtColors.queue = [];
  } finally {
    saveTtColors.busy = false;
  }
}


function pickTtColor(title, courseNo = "") {
  const entries = state.timetable || [];
  const key = ttCourseKey({ title, courseNo });
  // 같은 과목이 이미 있으면 그 색을 그대로
  const same = entries.find((e) => ttCourseKey(e) === key);
  if (same && TT_COLORS.includes(same.color)) return same.color;

  // 다른 과목이 쓰는 색은 피한다
  const used = new Map();
  entries.forEach((e) => {
    if (ttCourseKey(e) === key) return;
    used.set(e.color, (used.get(e.color) || 0) + 1);
  });
  const free = TT_COLORS.find((c) => !used.has(c));
  if (free) return free;
  return [...TT_COLORS].sort((a, b) => (used.get(a) || 0) - (used.get(b) || 0))[0];
}


function ttOverlaps(slot, entry) {
  if (Number(entry.day) !== Number(slot.day)) return false;
  // 끝시각과 시작시각이 같은 건 겹친 게 아니다
  return ttMinutes(slot.start) < ttMinutes(entry.end) && ttMinutes(entry.start) < ttMinutes(slot.end);
}

/** 새로 넣을 슬롯들과 겹치는 기존 수업.
    한 과목이 요일별로 쪼개져 있으면(화 1교시 + 목 2교시) 반쪽만 지워져
    이름만 남은 유령 수업이 생겼다. 겹친 것과 같은 과목은 통째로 묶어 돌려준다. */
function ttConflicts(slots) {
  const all = state.timetable || [];
  const direct = all.filter((e) => slots.some((s) => ttOverlaps(s, e)));
  if (!direct.length) return direct;
  const titles = new Set(
    direct.map((e) => (e.title || "").trim()).filter(Boolean),
  );
  const hit = new Set(direct.map((e) => e.id));
  return all.filter((e) => hit.has(e.id) || titles.has((e.title || "").trim()));
}

function renderTtPreview() {
  const grid = $("#timetable");
  const course = state.ttPreview;
  if (!grid) return;
  grid.querySelectorAll(".tt-ghost").forEach((el) => el.remove());
  grid.querySelectorAll(".tt-block.will-replace").forEach((el) => el.classList.remove("will-replace"));
  if (!course) return;

  const startHour = Number(grid.dataset.startHour || 9);
  const pxPerMin = Number(grid.dataset.pxPerMin || 0.9);

  const clash = new Set(ttConflicts(course.slots).map((e) => e.id));
  clash.forEach((id) => {
    grid.querySelector(`[data-tt="${CSS.escape(id)}"]`)?.classList.add("will-replace");
  });

  course.slots.forEach((s) => {
    const col = grid.querySelector(`.tt-col[data-day="${s.day}"]`);
    if (!col) return;
    const top = (ttMinutes(s.start) - startHour * 60) * pxPerMin;
    const height = Math.max(22, (ttMinutes(s.end) - ttMinutes(s.start)) * pxPerMin);
    const ghost = document.createElement("div");
    ghost.className = `tt-ghost tone-${course.color || "coral"}${clash.size ? " clash" : ""}`;
    ghost.style.top = `${top}px`;
    ghost.style.height = `${height}px`;
    ghost.innerHTML = `<strong>${escapeHtml(shortText(course.title, 16))}</strong>
      <em>${escapeHtml(s.start)}~${escapeHtml(s.end)}</em>`;
    col.appendChild(ghost);
  });

  const hint = $("#timetableHint");
  if (hint) {
    hint.textContent = clash.size
      ? `'${shortText(course.title, 16)}' 넣으면 겹치는 수업 ${clash.size}칸이 통째로 빠집니다.`
      : `'${shortText(course.title, 16)}'이(가) 여기에 들어갑니다.`;
  }
}

function setTtPreview(course) {
  if (state.ttPreview === course) return;
  state.ttPreview = course;
  renderTtPreview();
  if (!course) renderTimetable();
}


/* ===== 24시간제 시간 고르개 =====
   <input type="time">은 브라우저 로캘을 따라 '오전/오후'로 뜨고, 이를 끄는
   표준 방법이 없다. 강의 시간은 24시간제로 읽는 게 익숙해서 직접 만든다.
   숨은 input(name=start/end)에 "HH:MM"을 넣어 두므로 저장 쪽은 그대로다. */
const TT_MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function fillTimePicks(form) {
  // data-allow-empty 는 '비우면 종일'인 칸. 빈 선택지를 하나 더 준다.
  const blank = (sel) => (sel.hasAttribute("data-allow-empty") ? `<option value="">—</option>` : "");
  form.querySelectorAll(".tp-hour").forEach((sel) => {
    if (sel.options.length) return;
    sel.innerHTML =
      blank(sel) +
      Array.from({ length: 24 }, (_, h) => {
        const v = String(h).padStart(2, "0");
        return `<option value="${v}">${v}</option>`;
      }).join("");
  });
  form.querySelectorAll(".tp-min").forEach((sel) => {
    if (sel.options.length) return;
    sel.innerHTML =
      blank(sel) +
      TT_MINUTES.map((m) => {
        const v = String(m).padStart(2, "0");
        return `<option value="${v}">${v}</option>`;
      }).join("");
  });
}

/** "16:30" → 시·분 칸에 흩뿌린다 */
function setTimePick(form, name, value) {
  const hour = form.elements[`${name}Hour`];
  const min = form.elements[`${name}Min`];
  // 종일 일정처럼 시간이 없을 수도 있다
  if (!value && hour?.hasAttribute("data-allow-empty")) {
    hour.value = "";
    if (min) min.value = "";
    const hidden0 = form.elements[name];
    if (hidden0) hidden0.value = "";
    return;
  }
  const [h, m] = String(value || "09:00").split(":");
  if (hour) hour.value = String(Number(h) || 0).padStart(2, "0");
  if (min) {
    // 5분 단위로 내림. 목록에 없는 값이면 칸이 비어 버린다.
    const mm = Math.floor((Number(m) || 0) / 5) * 5;
    min.value = String(mm).padStart(2, "0");
  }
  syncTimePick(form, name);
}

/** 시·분 칸 → 숨은 input */
function syncTimePick(form, name) {
  const hour = form.elements[`${name}Hour`];
  const min = form.elements[`${name}Min`];
  const hidden = form.elements[name];
  if (!hour || !min || !hidden) return;
  if (!hour.value) {
    // 시를 비우면 종일. 분도 같이 비운다.
    min.value = "";
    hidden.value = "";
    return;
  }
  if (!min.value) min.value = "00";
  hidden.value = `${hour.value}:${min.value}`;
}

function openTtEditor(entry = null, preset = {}) {
  const panel = $("#ttEditor");
  const form = $("#ttForm");
  if (!panel || !form) return;
  form.elements.id.value = entry?.id || "";
  form.elements.title.value = entry?.title || "";
  form.elements.day.value = String(entry?.day ?? preset.day ?? 0);
  fillTimePicks(form);
  setTimePick(form, "start", entry?.start || preset.start || "09:00");
  setTimePick(form, "end", entry?.end || preset.end || "10:30");
  form.elements.room.value = entry?.room || "";
  form.elements.color.value = entry?.color || pickTtColor(entry?.title || "", entry?.courseNo || "");
  $("#ttEditorTitle").textContent = entry?.id ? "과목 수정" : "과목 추가";
  $("#ttDeleteButton").hidden = !entry?.id;

  // 시·분을 고칠 때마다 숨은 칸을 맞춘다 (한 번만 건다)
  if (!form.dataset.timeBound) {
    form.dataset.timeBound = "1";
    form.addEventListener("change", (event) => {
      const sel = event.target.closest(".tp-hour, .tp-min");
      if (!sel) return;
      const name = sel.name.replace(/(Hour|Min)$/, "");
      syncTimePick(form, name);
      // 시작이 끝을 넘어서면 끝을 한 시간 뒤로 밀어 준다
      if (name === "start") {
        const s = form.elements.start.value;
        const e = form.elements.end.value;
        if (s && e && s >= e) {
          const [h, m] = s.split(":").map(Number);
          setTimePick(form, "end", `${String((h + 1) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
        }
      }
    });
  }

  // 색 고르기
  const wrap = $("#ttColors");
  wrap.innerHTML = TT_COLORS.map(
    (c) => `<button type="button" class="tt-color tone-${c} ${c === form.elements.color.value ? "on" : ""}" data-color="${c}" aria-label="${c}"></button>`,
  ).join("");

  // 과목명 자동완성 (수강 중인 과목)
  const list = $("#courseNameList");
  if (list) {
    list.innerHTML = courseSummaries()
      .map((c) => `<option value="${escapeHtml(c.label)}"></option>`)
      .join("");
  }

  // 편집창은 이제 오른쪽 패널 안의 '고치기' 장이다.
  // 패널이 닫혀 있으면 열고, 검색 장에서 고치기 장으로 넘긴다.
  panel.hidden = false;
  showTtSide("edit");
  form.elements.title.focus();
}

/** 오른쪽 패널을 '과목 찾기'(search) / '칸 고치기'(edit) 로 넘긴다 */
function showTtSide(page) {
  const wrap = $("#catalogPanel");
  const side = $("#ttSide");
  if (!wrap || !side) return;
  wrap.hidden = false;
  side.dataset.page = page;
}

function closeTtEditor() {
  const panel = $("#ttEditor");
  if (panel) panel.hidden = true;
  // 고치기를 닫으면 검색 장으로 돌아간다 (패널 자체는 열어 둔다)
  showTtSide("search");
}

function bindTimetable() {
  const grid = $("#timetable");
  if (!grid) return;

  grid.addEventListener("click", (event) => {
    const block = event.target.closest("[data-tt]");
    if (block) {
      const entry = (state.timetable || []).find((e) => e.id === block.dataset.tt);
      if (entry) openTtEditor(entry);
      return;
    }
    // 빈 칸을 누르면 그 요일·시각으로 새로 추가
    const col = event.target.closest(".tt-col");
    if (!col) return;
    const rect = col.getBoundingClientRect();
    const pxPerMin = 0.9;
    let startHour = TT_START_HOUR;
    (state.timetable || []).forEach((e) => {
      startHour = Math.min(startHour, Math.floor(ttMinutes(e.start) / 60));
    });
    const minutes = Math.floor((event.clientY - rect.top) / pxPerMin / 30) * 30 + startHour * 60;
    const pad = (n) => String(n).padStart(2, "0");
    const fmt = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
    openTtEditor(null, { day: Number(col.dataset.day), start: fmt(minutes), end: fmt(minutes + 90) });
  });

  $("#ttEditorClose")?.addEventListener("click", closeTtEditor);
  $("#ttColors")?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-color]");
    if (!btn) return;
    $("#ttForm").elements.color.value = btn.dataset.color;
    $("#ttColors").querySelectorAll(".tt-color").forEach((b) => b.classList.toggle("on", b === btn));
  });

  $("#timetableSat")?.addEventListener("change", (event) => {
    state.ttShowSat = event.target.checked;
    renderTimetable();
  });

  $("#ttForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const res = await api("/api/timetable/save", { method: "POST", body: JSON.stringify(payload) });
      state.timetable = res.entries || [];
      showToast(payload.id ? "시간표를 수정했습니다." : "시간표에 추가했습니다.");
      closeTtEditor();
      renderTimetable();
    } catch (error) {
      showToast(error.message);
    }
  });

  $("#ttDeleteButton")?.addEventListener("click", async () => {
    const id = $("#ttForm").elements.id.value;
    if (!id || !(await uiConfirm("이 수업을 시간표에서 지울까요?", { title: "수업 지우기", danger: true, ok: "지우기" }))) return;
    try {
      const res = await api("/api/timetable/delete", { method: "POST", body: JSON.stringify({ id }) });
      state.timetable = res.entries || [];
      showToast("시간표에서 지웠습니다.");
      closeTtEditor();
      renderTimetable();
    } catch (error) {
      showToast(error.message);
    }
  });

  // 시간표 캡처 이미지로 가져오기
  $("#timetableImportImage")?.addEventListener("click", () => $("#timetableImageInput").click());
  $("#timetableImageInput")?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      showToast("이미지를 읽는 중… (10초쯤 걸려요)");
      const image = await fileToBase64(file);
      const res = await api("/api/timetable/import-image", {
        method: "POST",
        body: JSON.stringify({ image, mime: file.type || "image/png" }),
      });
      let replace = false;
      if ((state.timetable || []).length > 0) {
        const how = await uiButtons(
          `${res.count}개 수업을 찾았어요. 지금 시간표를 어떻게 할까요?`,
          [
            { label: "이어서 추가", value: "append" },
            { label: "지우고 새로 넣기", value: "replace", primary: true },
          ],
          { title: "시간표 가져오기", icon: "calendar" },
        );
        if (how === null) return;
        replace = how === "replace";
      }
      const saved = await api("/api/timetable/bulk", {
        method: "POST",
        body: JSON.stringify({ entries: res.entries, replace }),
      });
      state.timetable = saved.entries || [];
      renderTimetable();
      showToast(`${saved.saved}개 수업을 넣었습니다. 시간이 어긋나면 눌러서 고쳐 주세요.`);
    } catch (error) {
      showToast(error.message);
    }
  });

  // DGIST 개설과목에서 찾아 넣기
  $("#timetableFromCatalog")?.addEventListener("click", async () => {
    const panel = $("#catalogPanel");
    panel.hidden = false;
    showTtSide("search");
    // 학기 목록을 아직 안 채웠으면 채운다
    const termSel = $("#catalogTerm");
    if (termSel && !termSel.options.length) {
      try {
        const t = await api("/api/course-terms");
        termSel.innerHTML = t.terms.map((x) => `<option value="${x.value}">${escapeHtml(x.label)}</option>`).join("");
        termSel.value = t.current;
        // 학사일정으로 알아낸 지금 학기가 있으면 그쪽을 우선한다
        applySemester();
      } catch (error) {
        /* 목록을 못 가져와도 검색은 기본 학기로 동작 */
      }
    }
    await loadCatalog();
    $("#catalogSearch").focus();
  });

  const reload = () => {
    state.catalog = null;
    loadCatalog();
  };
  $("#catalogTerm")?.addEventListener("change", (event) => {
    // 직접 고른 뒤에는 학기 자동 맞춤이 되돌리지 않게 한다
    event.currentTarget.dataset.userPicked = "1";
    reload();
  });
  $("#catalogLevel")?.addEventListener("change", reload);

  $("#catalogClose")?.addEventListener("click", () => {
    $("#catalogPanel").hidden = true;
    setTtPreview(null);
  });

  // 과목에 커서를 올리면 시간표에 들어갈 자리를 미리 보여 준다
  const list = $("#catalogList");
  // 커서를 스치고 지나갈 때마다 깜빡이지 않게 조금 기다렸다 보여 준다
  let hoverTimer = null;
  list?.addEventListener("pointerover", (event) => {
    const row = event.target.closest("[data-course-index]");
    if (!row) return;
    const course = (state.catalog || [])[Number(row.dataset.courseIndex)];
    if (!course || !course.slots.length) return;
    window.clearTimeout(hoverTimer);
    hoverTimer = window.setTimeout(() => {
      setTtPreview({ ...course, color: pickTtColor(course.title, course.courseNo || "") });
    }, 220);
  });
  list?.addEventListener("pointerleave", () => {
    window.clearTimeout(hoverTimer);
    setTtPreview(null);
  });
  $("#catalogSearch")?.addEventListener("input", renderCatalog);
  $("#catalogList")?.addEventListener("click", async (event) => {
    const btn = event.target.closest("[data-add-course]");
    if (!btn) return;
    const course = (state.catalog || [])[Number(btn.dataset.addCourse)];
    if (!course || !course.slots.length) return;
    const entries = course.slots.map((s) => ({
      title: course.title,
      day: s.day,
      start: s.start,
      end: s.end,
      room: s.room,
      color: pickTtColor(course.title, course.courseNo || ""),
      // 학점·과목번호·교수도 같이 넘긴다. 안 넘기면 시간표에서 몇 학점인지 알 수 없다.
      credit: course.credit || "",
      courseNo: course.courseNo || "",
      professor: course.professor || "",
    }));
    // 시간이 겹치는 기존 수업은 새 것으로 대체한다
    const clash = ttConflicts(course.slots);
    try {
      for (const old of clash) {
        await api("/api/timetable/delete", {
          method: "POST",
          body: JSON.stringify({ id: old.id }),
        });
      }
      const saved = await api("/api/timetable/bulk", {
        method: "POST",
        body: JSON.stringify({ entries }),
      });
      state.timetable = saved.entries || [];
      setTtPreview(null);
      renderTimetable();
      showToast(
        clash.length
          ? `'${shortText(course.title, 18)}' 추가 · 겹치던 수업 ${clash.length}칸을 통째로 뺐습니다.`
          : `'${shortText(course.title, 20)}' 추가했습니다.`,
      );
    } catch (error) {
      showToast(error.message);
    }
  });
}

async function loadCatalog(force = false) {
  const term = $("#catalogTerm")?.value || "";
  const level = $("#catalogLevel")?.value || "under";
  const key = `${term}|${level}`;
  // force 면 서버 캐시까지 무시하고 새로 받는다 (상단 '강의 새로고침')
  if (!force && state.catalog && state.catalogKey === key) {
    renderCatalog();
    return;
  }
  $("#catalogStatus").textContent = "개설과목을 가져오는 중…";
  $("#catalogList").innerHTML = "";
  try {
    const data = await api(
      `/api/course-catalog?term=${encodeURIComponent(term)}&level=${level}${force ? "&refresh=1" : ""}`,
    );
    state.catalog = data.courses || [];
    state.catalogKey = key;
    $("#catalogStatus").textContent = `${data.withTime}개 과목`;
    renderCatalog();
  } catch (error) {
    $("#catalogStatus").textContent = "";
    $("#catalogList").innerHTML = `<p class="catalog-empty">${escapeHtml(error.message)}</p>`;
  }
}

/** 검색 대상 문자열. 한 번 만들어 두고 다시 쓴다. */
function catalogHaystack(c) {
  if (c._hay === undefined) {
    c._hay = [c.title, c.titleEn, c.professor, c.professorEn, c.courseNo, c.dept, c.classification]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }
  return c._hay;
}

function renderCatalog() {
  const list = $("#catalogList");
  if (!list) return;
  const q = ($("#catalogSearch")?.value || "").trim().toLowerCase();
  const rows = (state.catalog || [])
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => c.slots.length)
    // 한국어로 치든 영어로 치든 걸리게 한다.
    // (사이트가 기본 영어라 과목명을 두 언어로 함께 받아 둔다)
    .filter(({ c }) => !q || catalogHaystack(c).includes(q))
    .slice(0, 40);

  list.innerHTML = rows.length
    ? rows
        .map(
          ({ c, i }) => `
      <div class="catalog-row" data-course-index="${i}">
        <div class="catalog-main">
          <strong title="${escapeHtml(c.title)}">${escapeHtml(shortText(c.title, 38))}</strong>
          <span>${escapeHtml(c.courseNo)}${c.professor ? " · " + escapeHtml(shortText(c.professor, 18)) : ""}${c.credit ? " · " + escapeHtml(c.credit) + "학점" : ""}</span>
          ${c.titleEn ? `<u title="${escapeHtml(c.titleEn)}">${escapeHtml(shortText(c.titleEn, 38))}</u>` : ""}
          <em>${c.slots.map((s) => `${"월화수목금토"[s.day]} ${s.start}~${s.end}`).join(", ")}</em>
        </div>
        <button type="button" class="catalog-add" data-add-course="${i}">＋</button>
      </div>`,
        )
        .join("")
    : `<p class="catalog-empty">${q ? "검색 결과가 없습니다." : "시간 정보가 있는 과목이 없습니다."}</p>`;
}

/* ===== 대시보드: 카드에 커서를 올리면 오른쪽에 상세가 뜬다 ===== */
function peekRows(kind) {
  const now = Date.now();
  if (kind === "deadlines") {
    const rows = (state.deadlines.items || [])
      .filter((d) => !isSubmitted(d))
      .map((d) => ({ d, due: parseDue(d) }))
      .filter((x) => x.due && x.due.getTime() >= now)
      .sort((a, b) => a.due - b.due)
      .slice(0, 8)
      .map(({ d, due }) => {
        const dd = ddayInfo(d);
        return {
          title: d.name,
          sub: d.courseLabel || d.course,
          tag: dd.label,
          tone: dd.cls,
          extra: formatDue(due),
        };
      });
    return { title: "다가오는 마감", empty: "다가오는 마감이 없습니다.", rows };
  }

  if (kind === "files") {
    const rows = (state.files || [])
      .filter((f) => f.savedAt)
      .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))
      .slice(0, 8)
      .map((f) => ({
        title: f.name,
        sub: f.courseLabel,
        tag: f.type,
        tone: "normal",
        extra: formatDue(new Date(f.savedAt)),
      }));
    return { title: "최근 받은 자료", empty: "아직 받은 자료가 없습니다. 동기화해 주세요.", rows };
  }

  if (kind === "courses") {
    const hidden = state.selection.hidden || [];
    const rows = courseSummaries()
      .filter((c) => !hidden.includes(c.label))
      .sort((a, b) => b.files - a.files)
      .slice(0, 8)
      .map((c) => ({
        title: c.label,
        sub: c.korean || (c.next ? `다음 마감 ${formatDue(c.next.due)}` : "진행 중"),
        tag: `${c.files}개`,
        tone: "normal",
        extra: c.deadlines ? `과제 ${c.deadlines}` : "",
      }));
    return { title: "수강 중인 강의", empty: "표시할 강의가 없습니다.", rows };
  }

  if (kind === "newmail") {
    // 제목과 보낸 사람만. 자세한 건 메일함에서 본다.
    const rows = (state.emails.emails || [])
      .filter((m) => m.folder === "inbox" && m.unread)
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 8)
      .map((m) => ({
        title: m.subject || m.summary || "(제목 없음)",
        sub: m.fromName || m.fromEmail,
        tag: compactMailDate(m.date),
        tone: "normal",
      }));
    return { title: "안 읽은 메일", empty: "새로 온 메일이 없습니다.", rows };
  }
  return { title: "", empty: "", rows: [] };
}

function showMetricPeek(kind) {
  const card = document.querySelector(`[data-peek="${kind}"]`);
  const body = card?.querySelector(`[data-inline="${kind}"]`);
  if (!card || !body) return;
  if (body.dataset.filled !== "1") {
    const data = peekRows(kind);
    const rows = data.rows.length
      ? data.rows
          .map(
            (r) => `
      <div class="peek-row">
        <div class="peek-main">
          <strong title="${escapeHtml(r.title || "")}">${escapeHtml(shortText(r.title || "", 24))}</strong>
          <span>${escapeHtml(shortText(r.sub || "", 20))}</span>
        </div>
        <div class="peek-side">
          <span class="peek-tag ${r.tone}">${escapeHtml(r.tag || "")}</span>
        </div>
      </div>`,
          )
          .join("")
      : `<p class="peek-empty">${escapeHtml(data.empty)}</p>`;
    body.innerHTML = `
      <div class="metric-inline-head">
        <strong>${escapeHtml(data.title)}</strong>
        ${data.rows.length ? `<span>${data.rows.length}건</span>` : ""}
      </div>
      <div class="metric-inline-list">${rows}</div>`;
    body.dataset.filled = "1";
  }
  document.querySelector("#metricsStage")?.classList.add("peek-open");
}

function hideMetricPeek() {
  document.querySelector("#metricsStage")?.classList.remove("peek-open");
}

function bindMetricPeek() {
  const stage = document.querySelector("#metricsStage");
  if (!stage) return;
  stage.querySelectorAll("[data-peek]").forEach((card) => {
    const open = () => {
      window.clearTimeout(state._peekLeave);
      showMetricPeek(card.dataset.peek);
    };
    card.addEventListener("mouseenter", open);
    card.addEventListener("focusin", open);
    card.addEventListener("mouseleave", () => {
      state._peekLeave = window.setTimeout(hideMetricPeek, 180);
    });
  });
}

/* 데이터가 바뀌면 카드 안 목록을 다시 만들게 표시 */
function invalidateMetricPeek() {
  document.querySelectorAll("[data-inline]").forEach((el) => (el.dataset.filled = ""));
}

/* ===== 상단 진행 표시 =====
   동기화/새로고침 버튼을 누르면 물방울이 튀어나와 상단 진행 칩으로 빨려 들어간다. */
function splashFromButton(button) {
  if (!button || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const target = $("#topProgress");
  if (!target) return;
  const from = button.getBoundingClientRect();
  // 칩이 아직 숨겨져 있으면 버튼 왼쪽을 목적지로 삼는다
  const to = target.hidden ? { left: from.left - 150, top: from.top, width: 40, height: from.height } : target.getBoundingClientRect();

  const drop = document.createElement("span");
  drop.className = "progress-droplet";
  drop.style.left = `${from.left + from.width / 2}px`;
  drop.style.top = `${from.top + from.height / 2}px`;
  document.body.appendChild(drop);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const anim = drop.animate(
    [
      { transform: "translate(-50%, -50%) scale(0.35)", opacity: 0.95, offset: 0 },
      { transform: `translate(calc(-50% + ${dx * 0.45}px), calc(-50% + ${dy - 16}px)) scale(1.25)`, opacity: 1, offset: 0.55 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.2)`, opacity: 0, offset: 1 },
    ],
    { duration: 620, easing: "cubic-bezier(0.34, 1.2, 0.4, 1)" },
  );
  // 백그라운드 탭 등으로 애니메이션이 끝나지 않아도 반드시 정리되도록 이중 안전장치
  const cleanup = () => drop.remove();
  anim.addEventListener("finish", cleanup);
  anim.addEventListener("cancel", cleanup);
  window.setTimeout(cleanup, 1200);
}

function showTopProgress(label, pct) {
  const wrap = $("#topProgress");
  if (!wrap) return;
  const first = wrap.hidden;
  wrap.hidden = false;
  wrap.classList.remove("done");
  if (first) {
    wrap.classList.remove("pop");
    void wrap.offsetWidth;
    wrap.classList.add("pop");
  }
  $("#topProgressLabel").textContent = label;
  $("#topProgressFill").style.width = `${pct}%`;
  $("#topProgressPct").textContent = `${Math.round(pct)}%`;
}

function finishTopProgress(label) {
  const wrap = $("#topProgress");
  if (!wrap || wrap.hidden) return;
  $("#topProgressLabel").textContent = label;
  $("#topProgressFill").style.width = "100%";
  $("#topProgressPct").textContent = "100%";
  wrap.classList.add("done");
  window.clearTimeout(state._topProgressTimer);
  state._topProgressTimer = window.setTimeout(hideTopProgress, 2200);
}

function hideTopProgress() {
  const wrap = $("#topProgress");
  if (!wrap) return;
  wrap.hidden = true;
  wrap.classList.remove("pop", "done");
}

/* ===== 구글 캘린더 동기화 상태 ===== */
function renderGcalStatus(message) {
  const el = $("#gcalStatusText");
  if (!el) return;
  if (message) {
    el.textContent = message;
    return;
  }
  const oauth = state.status?.googleOAuth || {};
  if (!oauth.tokenExists) {
    el.textContent = "먼저 위에서 구글 계정을 연결해 주세요.";
  } else if (!oauth.calendarGranted) {
    el.textContent = "캘린더 권한이 없습니다. 구글 계정을 다시 연결하면 권한이 추가됩니다.";
  } else {
    // 문제가 없으면 아무것도 쓰지 않는다 (설명은 제목 옆 ? 에 있다)
    el.textContent = "";
  }
}

/* ===== 실행 로그 레일 접기/펼치기 ===== */
function applyRailCollapsed(collapsed) {
  const workspace = document.querySelector(".workspace");
  if (!workspace) return;
  workspace.classList.toggle("rail-collapsed", collapsed);
  const toggle = $("#railToggle");
  if (toggle) {
    toggle.setAttribute("aria-expanded", String(!collapsed));
    toggle.title = collapsed ? "실행 로그 펼치기" : "실행 로그 접기";
  }
  try {
    localStorage.setItem("autosaver-rail-collapsed", collapsed ? "1" : "0");
  } catch (error) {
    /* localStorage 사용 불가 환경 무시 */
  }
}

function initRail() {
  let collapsed = false;
  try {
    // 실행 로그는 평소에 볼 일이 적어 접어 두는 것을 기본으로
    const saved = localStorage.getItem("autosaver-rail-collapsed");
    collapsed = saved === null ? true : saved === "1";
  } catch (error) {
    /* 무시 */
  }
  applyRailCollapsed(collapsed);
  $("#railToggle")?.addEventListener("click", () => {
    const now = document.querySelector(".workspace")?.classList.contains("rail-collapsed");
    applyRailCollapsed(!now);
  });
}

/* ===== 인사말 =====
   이모지를 붙인 '좋은 저녁이에요 🌆' 는 가벼워 보였다. 차분한 명조체 한 줄에
   이름을 부르고, 그 아래 오늘 챙길 것을 한 줄로 적는다. 문장은 하루 동안 바뀌지 않게
   날짜로 고른다(화면이 다시 그려질 때마다 인사가 바뀌면 어수선하다). */
function heroSummary() {
  const now = new Date();
  const dayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const holiday = specialDay(now)?.holiday;
  const leftClasses = holiday
    ? 0
    : (state.timetable || []).filter((e) => Number(e.day) === dayIndex && ttMinutes(e.end) > minutes).length;
  const weekMs = 7 * 86400000;
  const dueSoon = (state.deadlines?.items || []).filter((d) => {
    if (isSubmitted(d)) return false;
    const due = parseDue(d);
    return due && due.getTime() >= now.getTime() && due.getTime() - now.getTime() <= weekMs;
  }).length;
  const unread = (state.emails?.emails || []).filter((m) => m.folder === "inbox" && m.unread).length;
  const parts = [];
  parts.push(
    holiday ? `오늘은 ${holiday}, 수업 없어요` : leftClasses ? `오늘 남은 수업 ${leftClasses}개` : "오늘은 남은 수업이 없어요",
  );
  if (dueSoon) parts.push(`7일 안 마감 ${dueSoon}개`);
  if (unread) parts.push(`안 읽은 메일 ${unread}통`);
  return parts.join(" · ");
}

function setHeroGreeting() {
  // '오후도 차분하게, 유준 님' 같은 인사는 오글거린다는 말을 들었다. 날짜만 담백하게 쓴다.
  // 쉬는 날에는 그 이름을 붙인다 (예: 10월 5일 월요일 · 추석).
  const now = new Date();
  const holiday = specialDay(now)?.holiday;
  const text = `${now.getMonth() + 1}월 ${now.getDate()}일 ${NOW_WEEKDAY[now.getDay()]}요일${holiday ? ` · ${holiday}` : ""}`;
  const node = $("#heroText");
  if (node && node.textContent !== text) node.textContent = text;
  const sub = $("#heroSub");
  if (sub) {
    const line = heroSummary();
    if (sub.textContent !== line) sub.textContent = line;
  }
}

/* ===== 나우바 =====
   사이드바 위쪽에서 지금 시각과 '무슨 수업 중인지'를 보여준다.
   애플 라이브 액티비티처럼, 지금 필요한 한 줄만 남긴다. */
const NOW_WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

/** 오늘이 시간표의 몇 번째 요일인지 (0=월 … 6=일) */
function nowDayIndex(d) {
  return d.getDay() === 0 ? 6 : d.getDay() - 1;
}

function nowRemainText(min) {
  if (min < 1) return "곧 끝나요";
  if (min < 60) return `${min}분 남음`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}시간 ${m}분 남음` : `${h}시간 남음`;
}

function nowUntilText(min) {
  if (min < 1) return "곧 시작";
  if (min < 60) return `${min}분 뒤`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}시간 ${m}분 뒤` : `${h}시간 뒤`;
}

/** 지금 상태를 계산한다. 렌더와 분리해 두어야 검증하기 쉽다. */
function nowStatus(at, entries, semester) {
  const day = nowDayIndex(at);
  const minutes = at.getHours() * 60 + at.getMinutes();
  const today = (entries || [])
    .filter((e) => Number(e.day) === day)
    .sort((a, b) => ttMinutes(a.start) - ttMinutes(b.start));

  const nextUp = today.find((e) => ttMinutes(e.start) > minutes);
  const detail = {
    today,
    next: nextUp,
    left: today.filter((e) => ttMinutes(e.end) > minutes).length,
  };

  /* 학기가 시작하지 않았거나 끝났으면 방학이다.
     이때는 시간표가 있어도 수업이 없으므로 먼저 걸러 낸다. */
  if (semester && semester.label && semester.state !== "during") {
    if (semester.state === "before") {
      return {
        detail,
        state: "vacation",
        title: "방학",
        sub:
          semester.daysUntil === 0
            ? `${semester.label} 오늘 개강`
            : `${semester.label} 개강 D-${semester.daysUntil}`,
      };
    }
    return { detail, state: "vacation", title: "방학", sub: `${semester.label} 종료` };
  }

  // 공휴일에는 시간표가 있어도 수업이 없다. 예전엔 추석 연휴에도 '수업 중'이라고 떴다.
  const special = specialDay(at);
  if (special?.holiday) {
    return { detail: { today: [], left: 0 }, state: "holiday", title: special.holiday, sub: "수업 없는 날" };
  }

  if (!entries || !entries.length) {
    return { state: "empty", title: "시간표가 비어 있어요", sub: "대시보드에서 추가할 수 있어요" };
  }
  // 토요일에 수업이 있으면 주말로 치지 않는다.
  if (day === 6 || (day === 5 && !today.length)) {
    return { state: "weekend", title: "주말", sub: "" };
  }

  const live = today.find((e) => minutes >= ttMinutes(e.start) && minutes < ttMinutes(e.end));
  if (live) {
    const start = ttMinutes(live.start);
    const end = ttMinutes(live.end);
    return {
      detail,
      now: live,
      state: "class",
      tone: live.color || "coral",
      title: live.title,
      sub: [live.room, nowRemainText(end - minutes)].filter(Boolean).join(" · "),
      progress: Math.min(1, Math.max(0, (minutes - start) / Math.max(1, end - start))),
    };
  }

  const next = today.find((e) => ttMinutes(e.start) > minutes);
  if (next) {
    const gap = ttMinutes(next.start) - minutes;
    if (gap <= 30) {
      return {
        detail,
        state: "soon",
        tone: next.color || "coral",
        title: next.title,
        sub: [nowUntilText(gap), next.room].filter(Boolean).join(" · "),
      };
    }
    // 아직 첫 수업 전이면 '공강'이 아니라 '수업 전'이다.
    const started = minutes >= ttMinutes(today[0].start);
    return {
      detail,
      state: started ? "gap" : "before",
      title: started ? "공강" : "수업 전",
      sub: `${next.start} ${shortText(next.title, 10)}`,
    };
  }

  // '고생했어요·여유로운 하루·푹 쉬어요' 같은 덧붙임 말은 뺐다. 사용자가 '없어도 된다' 고 했다(2026-10-14).
  if (today.length) return { detail, state: "done", title: "오늘 수업 끝", sub: "" };
  return { detail, state: "free", title: "오늘 수업 없음", sub: "" };
}

/* 휴대폰에서는 사이드바가 아래쪽 탭바로 바뀌고 로고 자리가 사라진다.
   나우바는 계속 보여야 하므로 상단바로 옮겨 준다. */
// 1100px 이하에서는 사이드바가 아이콘 레일(76px)로 접혀 시계가 들어갈 자리가 없다 (styles.css 끝 '좁은 창' 절)
const NOW_MOBILE = window.matchMedia("(max-width: 1100px)");

function placeNowBar() {
  const bar = $("#nowBar");
  const topbar = document.querySelector(".topbar");
  const brand = document.querySelector(".brand");
  if (!bar || !topbar || !brand) return;
  const target = NOW_MOBILE.matches ? topbar : brand;
  if (bar.parentElement !== target) {
    target.insertBefore(bar, NOW_MOBILE.matches ? topbar.firstChild : null);
  }
  bar.classList.toggle("nowbar-compact", NOW_MOBILE.matches);
  if (NOW_MOBILE.matches && bar.classList.contains("nowbar-open")) {
    bar.classList.remove("nowbar-open");
    $("#nowToggle")?.setAttribute("aria-expanded", "false");
  }
}

/** 펼쳤을 때 보이는 세부 내용. 접혀 있으면 그리지 않는다. */
function renderNowDetail(info, at) {
  const box = $("#nowDetailBody");
  if (!box) return;
  const d = info.detail;
  const rows = [];

  if (info.now) {
    rows.push(nowDetailRow("지금", info.now, `${info.now.start} – ${info.now.end}`, info.tone));
  }
  if (d?.next) {
    const gap = ttMinutes(d.next.start) - (at.getHours() * 60 + at.getMinutes());
    rows.push(nowDetailRow("다음", d.next, `${d.next.start} · ${nowUntilText(gap)}`, d.next.color));
  }
  if (!rows.length) {
    // 예전엔 info.sub 를 그대로 다시 적어 바로 위 줄과 같은 말이 두 번 보였다.
    const exam = examSeason(at);
    if (exam) rows.push(nowDalguCard(exam));
    else {
      const special = specialDay(at);
      rows.push(`<p class="nowbar-detail-empty">${escapeHtml(special?.holiday ? special.sub : "오늘은 예정된 수업이 없어요")}</p>`);
    }
  }
  if (d?.today?.length) {
    rows.push(
      `<div class="nowbar-detail-foot">오늘 ${d.today.length}개 · 남은 수업 ${d.left}개</div>`,
    );
  }

  const html = rows.join("");
  if (box.dataset.html !== html) {
    box.dataset.html = html;
    box.innerHTML = html;
  }
}

/** 시험 기간에 나우바를 펼치면: 달구 + 남은 날 + 달구가 하는 말 */
function nowDalguCard(exam) {
  const fmt = (d) => `${d.getMonth() + 1}.${d.getDate()}`;
  // 좁은 사이드바라 같은 달이면 '10.12~16' 처럼 줄인다
  const range = exam.start.getTime() === exam.end.getTime()
    ? fmt(exam.start)
    : `${fmt(exam.start)}~${exam.start.getMonth() === exam.end.getMonth() ? exam.end.getDate() : fmt(exam.end)}`;
  const head =
    exam.phase === "before" ? `${exam.name} D-${exam.days}`
      : exam.phase === "after" ? `${exam.name} 끝`
        : exam.phase === "last" ? `${exam.name} 마지막 날` : `${exam.name} 중`;
  const i = (state.dalguTalk ?? exam.talkAt) % exam.talk.length;
  return `
    <div class="now-dalgu" data-phase="${exam.phase}">
      <button type="button" class="now-dalgu-pet" data-dalgu-pet aria-label="달구 쓰다듬기">
        <img src="/img/dalgu/${exam.pose}.png" alt="" draggable="false" />
      </button>
      <div class="now-dalgu-text">
        <em>${escapeHtml(head)} · ${escapeHtml(range)}</em>
        <span class="now-dalgu-bubble">${escapeHtml(exam.talk[i])}</span>
      </div>
    </div>`;
}

function nowDetailRow(label, entry, when, tone) {
  return `
    <div class="nowbar-detail-row">
      <span class="nowbar-detail-bar tone-${escapeHtml(tone || "coral")}"></span>
      <div class="nowbar-detail-main">
        <em>${escapeHtml(label)}</em>
        <strong title="${escapeHtml(entry.title || "")}">${escapeHtml(entry.title || "")}</strong>
        <span>${escapeHtml([when, entry.room].filter(Boolean).join(" · "))}</span>
      </div>
    </div>`;
}

/* ===== 휴대폰 '더보기' 시트 =====
   아래 탭바에 여덟 개를 다 넣으면 글자가 잘리고 옆으로 밀려 마지막 메뉴가 화면 밖에 있었다(375px 실측).
   자주 쓰는 다섯 개만 탭으로 두고, data-more 메뉴와 문의·업데이트는 아래에서 올라오는 시트에 모은다.
   안드로이드판을 만들 때도 같은 구조를 쓴다. */
function bindMoreSheet() {
  const button = $("#navMore");
  if (!button || button.dataset.bound) return;
  button.dataset.bound = "1";
  button.addEventListener("click", () => {
    if ($("#moreSheet") && !$("#moreSheet").hidden) closeMoreSheet();
    else openMoreSheet();
  });
}

function openMoreSheet() {
  let sheet = $("#moreSheet");
  if (!sheet) {
    sheet = document.createElement("div");
    sheet.id = "moreSheet";
    sheet.className = "more-sheet";
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-label", "더보기");
    document.body.appendChild(sheet);
    const backdrop = document.createElement("div");
    backdrop.id = "moreSheetBackdrop";
    backdrop.className = "more-sheet-backdrop";
    backdrop.addEventListener("click", closeMoreSheet);
    document.body.appendChild(backdrop);
    sheet.addEventListener("click", (event) => {
      const item = event.target.closest("[data-sheet-view], [data-sheet-click]");
      if (!item) return;
      closeMoreSheet();
      if (item.dataset.sheetView) switchView(item.dataset.sheetView);
      else $(`#${item.dataset.sheetClick}`)?.click();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !$("#moreSheet")?.hidden) closeMoreSheet();
    });
  }
  const views = [...document.querySelectorAll(".nav-item[data-more][data-view]")].map((item) => ({
    view: item.dataset.view,
    icon: item.querySelector(".icon")?.dataset.icon || "grid",
    label: item.textContent.trim(),
    on: item.classList.contains("active"),
  }));
  const extras = [
    { id: "feedbackButton", icon: "feedback", label: "Feedback" },
    { id: "whatsNewButton", icon: "sparkle", label: "업데이트 내용" },
  ].filter((x) => $(`#${x.id}`));
  sheet.innerHTML = `
    <div class="more-sheet-grip" aria-hidden="true"></div>
    <div class="more-sheet-grid">
      ${views
        .map(
          (v) => `<button type="button" class="more-sheet-item${v.on ? " on" : ""}" data-sheet-view="${v.view}">
            ${iconHtml(v.icon)}<span>${escapeHtml(v.label)}</span></button>`,
        )
        .join("")}
    </div>
    <div class="more-sheet-list">
      ${extras
        .map(
          (x) => `<button type="button" class="more-sheet-row" data-sheet-click="${x.id}">
            ${iconHtml(x.icon)}<span>${escapeHtml(x.label)}</span></button>`,
        )
        .join("")}
    </div>`;
  sheet.hidden = false;
  $("#moreSheetBackdrop").hidden = false;
  $("#navMore")?.setAttribute("aria-expanded", "true");
}

function closeMoreSheet() {
  const sheet = $("#moreSheet");
  if (!sheet || sheet.hidden) return;
  sheet.hidden = true;
  $("#moreSheetBackdrop").hidden = true;
  $("#navMore")?.setAttribute("aria-expanded", "false");
}

/* 메뉴 활성 표시를 항목마다 새로 그리지 않고, 알약 하나를 옮긴다.
   그래야 메뉴 사이 이동이 끊기지 않고 이어져 보인다. */
function moveNavPill() {
  const pill = $("#navPill");
  // 휴대폰에서는 '더보기' 안의 메뉴가 숨어 있으므로 보이는 것 중에서 고른다
  const active = [...document.querySelectorAll(".nav-item.active")].find((el) => el.offsetParent !== null);
  if (!pill) return;
  if (!active) {
    pill.style.opacity = "0";
    return;
  }
  const list = pill.parentElement;
  const a = active.getBoundingClientRect();
  const l = list.getBoundingClientRect();
  if (!a.height) {
    pill.style.opacity = "0";
    return;
  }
  pill.style.opacity = "1";
  pill.style.width = `${a.width}px`;
  pill.style.height = `${a.height}px`;
  pill.style.transform = `translate(${a.left - l.left}px, ${a.top - l.top}px)`;
}


/* ===== 학사일정 D-day =====
   놓치면 큰 것만 골라 대시보드 맨 위에 크게 띄운다. */
/* D-day 로 크게 띄울 학사일정. 학부생에게 중요한 순서로 무리를 나눈다.
   예전 목록에는 '시험' 이 없어서, 중간시험이 코앞인데 두 달 뒤 계절학기 수강신청이 떴다. */
const DDAY_TIERS = [
  ["중간시험", "기말시험", "학기말 시험", "중간고사", "기말고사"],
  ["수강신청", "수강신청 변경", "수강포기", "수강취소", "수강 철회"],
  ["등록", "성적확인", "복학신청", "휴학", "학위수여", "졸업신청", "계절학기"],
];
const DDAY_KEYWORDS = DDAY_TIERS.flat();

/** 0 = 시험, 1 = 정규 수강신청·변경·포기, 2 = 그 밖에 챙길 것, -1 = 해당 없음 */
function ddayTier(title) {
  const text = String(title || "");
  if (DDAY_TIERS[0].some((k) => text.includes(k))) return 0;
  // 계절학기 수강신청은 정규 학기보다 덜 급하다
  if (!text.includes("계절") && DDAY_TIERS[1].some((k) => text.includes(k))) return 1;
  if (DDAY_TIERS[2].some((k) => text.includes(k)) || DDAY_TIERS[1].some((k) => text.includes(k))) return 2;
  return -1;
}

/* 학사일정·공지 불러오기.
   학교 홈페이지가 자주 연결을 끊어서, 한 번 실패했다고 그 세션 내내
   포기해 버리면 화면이 계속 비어 있게 된다. 그래서 성공했을 때만
   '다 됐다'고 표시하고, 실패하면 1분 뒤에 다시 시도한다. */
/* ===== 대시보드 편집 =====
   어떤 것을 어떤 순서로 볼지 화면에서 바로 바꾼다.
   순서는 DOM 순서를 직접 바꿔서 적용하므로, 각 패널 코드는 건드릴 필요가 없다. */
const DASH_STORE = "autosaver-dashboard-layout-v2";
const DASH_STORE_V1 = "autosaver-dashboard-layout";

/* 넓은 화면에서 목록형 블록까지 한 줄을 통째로 쓰면 오른쪽이 텅 빈다.
   글이 몇 줄뿐인 블록은 처음부터 반 폭으로 둘씩 붙여 놓는다.
   (시간표·셔틀 노선도·요약 카드는 가로가 필요해서 한 줄 전체) */
const DASH_DEFAULT_SIZE = {
  dday: "full",
  metrics: "full",
  timetable: "full",
  upcoming: "half",
  events: "half",
  notices: "half",
  links: "half",
  shuttle: "full",
};
const dashDefaultSize = (key) => (DASH_DEFAULT_SIZE[key] === "half" ? "half" : "full");

function dashBlocks() {
  return [...document.querySelectorAll("#view-dashboard [data-block]")];
}

/** 저장된 배치를 읽는다. 새로 생긴 블록은 뒤에 붙는다. */
function loadDashLayout() {
  let saved = [];
  let migrating = false;
  try {
    const raw = localStorage.getItem(DASH_STORE);
    if (raw) {
      saved = JSON.parse(raw);
    } else {
      // 예전 저장본은 전부 "full"이라 새 기본 반 폭이 묻힌다.
      // 순서와 숨김 여부만 물려받고 폭은 새로 정한다.
      saved = JSON.parse(localStorage.getItem(DASH_STORE_V1) || "[]");
      migrating = saved.length > 0;
    }
  } catch (error) {
    saved = [];
  }
  const present = dashBlocks().map((el) => el.dataset.block);
  // 처음 쓸 때의 기본 순서. 급한 것부터 위로.
  const DEFAULT_ORDER = [
    "dday",      // 진행 중 / D-day
    "metrics",   // 임박한 마감 · 전체 자료 같은 요약 카드
    "timetable", // 주간 시간표
    "upcoming",  // 다가오는 마감
    "events",    // 다가오는 일정
    "notices",   // 학교 공지
    "links",     // 학교 사이트 바로가기
    "shuttle",   // 셔틀버스
  ];
  present.sort((a, b) => {
    const ia = DEFAULT_ORDER.indexOf(a);
    const ib = DEFAULT_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  const known = new Set();
  const layout = [];
  for (const row of Array.isArray(saved) ? saved : []) {
    if (row && present.includes(row.key) && !known.has(row.key)) {
      known.add(row.key);
      // size: "full"(한 줄 전체) 또는 "half"(반 폭). 반 폭끼리는 나란히 붙는다.
      layout.push({
        key: row.key,
        off: !!row.off,
        size: migrating ? dashDefaultSize(row.key) : row.size === "half" ? "half" : "full",
      });
    }
  }
  // 저장된 적 없는(새로 추가된) 블록은 켠 채로 뒤에 붙인다
  for (const key of present) {
    if (!known.has(key)) layout.push({ key, off: false, size: dashDefaultSize(key) });
  }
  return layout;
}

function saveDashLayout() {
  try {
    localStorage.setItem(DASH_STORE, JSON.stringify(state.dashLayout || []));
  } catch (error) {
    /* 저장 못 해도 이번 실행에는 반영된다 */
  }
}

function applyDashLayout() {
  const view = $("#view-dashboard");
  if (!view) return;
  const byKey = new Map(dashBlocks().map((el) => [el.dataset.block, el]));
  (state.dashLayout || []).forEach((row) => {
    const el = byKey.get(row.key);
    if (!el) return;
    // 순서대로 다시 붙이면 그 순서가 된다
    view.appendChild(el);
    el.classList.toggle("dash-off", !!row.off);
    el.classList.toggle("dash-half", row.size === "half");
  });
  renderDashEditor();
}

/** 편집 모드일 때 각 블록 위에 붙는 조작 줄 */
function renderDashEditor() {
  const editing = !!state.dashEditing;
  $("#view-dashboard")?.classList.toggle("dash-editing", editing);
  const label = $("#dashEditLabel");
  if (label) label.textContent = editing ? "편집 끝내기" : "화면 편집";

  const layout = state.dashLayout || [];
  dashBlocks().forEach((el) => {
    let bar = el.querySelector(":scope > .dash-bar");
    if (!editing) {
      bar?.remove();
      return;
    }
    const idx = layout.findIndex((r) => r.key === el.dataset.block);
    const off = !!layout[idx]?.off;
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "dash-bar";
      el.prepend(bar);
    }
    bar.innerHTML = `
      <span class="dash-grip" title="끌어서 순서 바꾸기">⋮⋮</span>
      <span class="dash-name">${escapeHtml(el.dataset.blockLabel || el.dataset.block)}</span>
      <button type="button" class="dash-btn" data-dash-up title="위로">↑</button>
      <button type="button" class="dash-btn" data-dash-down title="아래로">↓</button>
      <button type="button" class="dash-btn" data-dash-size title="반 폭으로 나누기 / 한 줄 전체로">${
        layout[idx]?.size === "half" ? "반폭" : "전체"
      }</button>
      <button type="button" class="dash-btn ${off ? "" : "on"}" data-dash-toggle title="${off ? "보이기" : "숨기기"}">${off ? "숨김" : "보임"}</button>`;
  });
}

function moveDashBlock(key, delta) {
  const layout = state.dashLayout || [];
  const from = layout.findIndex((r) => r.key === key);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= layout.length) return;
  const [row] = layout.splice(from, 1);
  layout.splice(to, 0, row);
  saveDashLayout();
  applyDashLayout();
}

/* 조직도 파일 넣기 (JSON 또는 CSV).
   웹메일 조직도는 포탈 SSO로만 열려서 앱이 직접 못 가져온다.
   한 번 받아 둔 목록을 넣어 두면 그 안에서 찾는다. */
function parseDirectoryFile(text, name) {
  text = String(text || "").replace(/^\ufeff/, "");
  if (name.toLowerCase().endsWith(".json")) {
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : data.people || data.entries || [];
  }
  // CSV. 따옴표 안의 쉼표는 나누지 않는다.
  const splitCsv = (line) => {
    const out = [];
    let cur = "";
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') {
        if (quoted && line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else quoted = !quoted;
      } else if ((ch === "," || ch === "\t") && !quoted) {
        out.push(cur.trim());
        cur = "";
      } else cur += ch;
    }
    out.push(cur.trim());
    return out;
  };
  const rows = text.split(/\r?\n/).filter((l) => l.trim()).map(splitCsv);
  // 머리줄이 있으면 이름으로 칸을 찾는다. 없으면 '이름,이메일,부서,직위,신분' 순서로 본다.
  const head = rows[0] || [];
  const find = (re, fallback) => {
    const i = head.findIndex((h) => re.test(h));
    return i >= 0 ? i : fallback;
  };
  const hasHead = !head.some((h) => h.includes("@"));
  const col = {
    name: find(/이름|성명|name/i, 0),
    email: find(/메일|e-?mail/i, 1),
    dept: find(/부서|소속|학과|dept|department/i, 2),
    title: find(/직위|직급|직책|title|position/i, 3),
    role: find(/신분|구분|role|type/i, 4),
  };
  return rows
    .slice(hasHead ? 1 : 0)
    .map((c) => ({
      name: c[col.name] || "",
      email: (c[col.email] || "").replace(/^.*<([^>]+)>.*$/, "$1"),
      dept: c[col.dept] || "",
      title: c[col.title] || "",
      role: c[col.role] || "",
    }))
    .filter((p) => p.email.includes("@"));
}

/** 엑셀에서 저장한 CSV 는 대개 EUC-KR 이다. UTF-8 로 안 읽히면 EUC-KR 로 다시 읽는다. */
async function readTextSmart(file) {
  const buf = await file.arrayBuffer();
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch (error) {
    return new TextDecoder("euc-kr").decode(buf);
  }
}



function bindDirectory() {
  const button = $("#directoryImportButton");
  const input = $("#directoryFileInput");
  if (!button || !input) return;

  const refreshCount = async () => {
    try {
      const res = await api("/api/directory?q=");
      const status = $("#directoryStatus");
      // 넣은 조직도가 없으면 설치 파일에 든 교원만 있다 (web_ui.directory_people)
      if (status) status.textContent = res.imported ? `${res.total}명 등록됨` : res.total ? `교수 ${res.total}명` : "아직 없음";
    } catch (error) {
      /* 무시 */
    }
  };
  refreshCount();

  button.addEventListener("click", () => input.click());
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const people = parseDirectoryFile(await readTextSmart(file), file.name);
      const res = await api("/api/directory/import", {
        method: "POST",
        body: JSON.stringify({ people }),
      });
      showToast(`조직도 ${res.count}명을 넣었습니다.`);
      dirCache.clear();
      refreshCount();
    } catch (error) {
      showToast(error.message || "조직도 파일을 읽지 못했습니다.");
    } finally {
      input.value = "";
    }
  });
}


/* ===== 대시보드 접기 =====
   블록이 늘어나니 한 화면에 다 안 들어온다.
   접어도 '한 줄 요약'은 남겨서, 펴지 않아도 상태를 알 수 있게 한다. */
const FOLD_STORE = "autosaver-dashboard-fold";

/** 접었을 때 보여 줄 한 줄. 블록마다 가장 중요한 것 하나만. */
function dashPeek(key) {
  const now = Date.now();
  switch (key) {
    case "dday": {
      const num = $("#ddayNum")?.textContent || "";
      const title = $("#ddayTitle")?.textContent || "";
      return title ? `${num} · ${title}` : "";
    }
    case "shuttle": {
      const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
      const next = (state.shuttle || [])
        .filter((r) => r.depart)
        .map((r) => {
          const [h, m] = r.depart.split(":").map(Number);
          return { r, min: h * 60 + (m || 0) };
        })
        .filter((x) => x.min >= nowMin)
        .sort((a, b) => a.min - b.min)[0];
      return next ? `다음 차 ${next.r.depart} ${next.r.name}` : "오늘 남은 차 없음";
    }
    case "notices": {
      const list = state.notices || [];
      return list.length ? `${list[0].board} · ${shortText(list[0].title, 22)}` : "";
    }
    case "links":
      return "학교 사이트 바로가기";
    case "metrics": {
      const d = (state.deadlines?.items || []).length;
      const f = (state.files || []).length;
      return `마감 ${d} · 자료 ${f}`;
    }
    case "timetable": {
      const info = state.semester;
      const live = nowStatus(new Date(), state.timetable, state.semester);
      return live?.title ? `${live.title}${live.sub ? ` · ${shortText(live.sub, 18)}` : ""}` : "";
    }
    case "upcoming": {
      const next = (state.deadlines?.items || [])
        .filter((d) => !isSubmitted(d))
        .map((d) => ({ d, due: parseDue(d) }))
        .filter((x) => x.due && x.due.getTime() >= now)
        .sort((a, b) => a.due - b.due)[0];
      if (!next) return "임박한 마감 없음";
      const days = Math.ceil((next.due - now) / 86400000);
      return `D-${Math.max(0, days)} ${shortText(next.d.name, 20)}`;
    }
    case "events": {
      const n = document.querySelectorAll("#eventsList > *").length;
      return n ? `${n}건` : "예정된 일정 없음";
    }
    default:
      return "";
  }
}

/* 처음 쓸 때 접혀 있을 블록.
   공지·바로가기·셔틀은 급하지 않고 자리를 많이 먹어서 접어 둔다.
   (셔틀 노선도는 혼자 850px를 쓴다) */
const FOLD_DEFAULT = { notices: true, links: true, shuttle: true };

function loadFold() {
  try {
    const saved = localStorage.getItem(FOLD_STORE);
    if (saved === null) return { ...FOLD_DEFAULT };
    // 저장본에 없는 블록은 기본값을 따른다. 나중에 기본을 바꿔도 반영되게.
    // 직접 펴 둔 블록은 저장본에 false 로 남아 있어 그대로 유지된다.
    return { ...FOLD_DEFAULT, ...(JSON.parse(saved) || {}) };
  } catch (error) {
    return { ...FOLD_DEFAULT };
  }
}

function saveFold() {
  try {
    localStorage.setItem(FOLD_STORE, JSON.stringify(state.dashFold || {}));
  } catch (error) {
    /* 저장 못 해도 이번 실행에는 반영된다 */
  }
}

/** 각 블록에 접기 버튼과 요약 줄을 달아 준다 (한 번만) */
function setupFold() {
  state.dashFold = state.dashFold || loadFold();

  dashBlocks().forEach((el) => {
    const key = el.dataset.block;
    // 알림 배너(D-day)는 원래 한 줄짜리라 접을 게 없다
    if (key === "dday") return;

    let head = el.querySelector(":scope > .panel-header");
    if (!head) return;

    // 본문을 한 겹으로 싼다. 0fr→1fr 로 접으려면 자식이 하나여야 한다.
    if (!el.querySelector(":scope > .fold-wrap")) {
      const wrap = document.createElement("div");
      wrap.className = "fold-wrap";
      const body = document.createElement("div");
      body.className = "fold-body";
      // panel-header 뒤의 모든 것을 옮긴다
      let node = head.nextSibling;
      while (node) {
        const next = node.nextSibling;
        body.appendChild(node);
        node = next;
      }
      wrap.appendChild(body);
      el.appendChild(wrap);
    }

    // 접기 버튼
    if (!head.querySelector(".fold-toggle")) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "fold-toggle";
      btn.setAttribute("aria-label", "접기/펴기");
      btn.innerHTML = '<span class="icon" data-icon="chevronDown"></span>';
      head.appendChild(btn);
      installIcons(head);
    }

    // 요약 줄 (접었을 때만 보인다)
    if (!head.querySelector(".fold-peek")) {
      const peek = document.createElement("span");
      peek.className = "fold-peek";
      head.insertBefore(peek, head.querySelector(".fold-toggle"));
    }
  });

  applyFold();
}

function applyFold() {
  const fold = state.dashFold || {};
  dashBlocks().forEach((el) => {
    const key = el.dataset.block;
    const closed = Boolean(fold[key]);
    el.classList.toggle("folded", closed);
    const btn = el.querySelector(".fold-toggle");
    if (btn) btn.setAttribute("aria-expanded", String(!closed));
    const peek = el.querySelector(".fold-peek");
    if (peek) peek.textContent = closed ? dashPeek(key) : "";
  });
}

function bindFold() {
  const view = $("#view-dashboard");
  if (!view) return;

  view.addEventListener("click", (event) => {
    const btn = event.target.closest(".fold-toggle");
    if (!btn) return;
    // 편집 중에는 순서 바꾸기가 우선이라 접기를 막는다
    if (state.dashEditing) return;
    const el = btn.closest("[data-block]");
    if (!el) return;
    const key = el.dataset.block;
    state.dashFold = state.dashFold || {};
    state.dashFold[key] = !state.dashFold[key];
    saveFold();
    applyFold();
  });

  // 모두 접기 / 모두 펴기
  $("#dashFoldAll")?.addEventListener("click", () => {
    const keys = dashBlocks().map((el) => el.dataset.block).filter((k) => k !== "dday");
    const anyOpen = keys.some((k) => !state.dashFold?.[k]);
    state.dashFold = {};
    if (anyOpen) keys.forEach((k) => (state.dashFold[k] = true));
    saveFold();
    applyFold();
    $("#dashFoldAllLabel").textContent = anyOpen ? "모두 펴기" : "모두 접기";
  });
}


function bindDashEditor() {
  state.dashLayout = loadDashLayout();
  applyDashLayout();
  setupFold();

  $("#dashEditToggle")?.addEventListener("click", (event) => {
    state.dashEditing = !state.dashEditing;
    // 편집 중인지 버튼 자체로도 보이게
    event.currentTarget.classList.toggle("on", state.dashEditing);
    renderDashEditor();
  });

  const view = $("#view-dashboard");
  if (!view) return;

  view.addEventListener("click", (event) => {
    const button = event.target.closest("[data-dash-up], [data-dash-down], [data-dash-toggle], [data-dash-size]");
    if (!button) return;
    // 편집 중에는 패널 안의 원래 버튼이 눌리지 않게 한다
    event.preventDefault();
    event.stopPropagation();
    const block = button.closest("[data-block]");
    const key = block?.dataset.block;
    if (!key) return;
    if (button.hasAttribute("data-dash-up")) return moveDashBlock(key, -1);
    if (button.hasAttribute("data-dash-down")) return moveDashBlock(key, 1);
    if (button.hasAttribute("data-dash-size")) {
      const row = (state.dashLayout || []).find((r) => r.key === key);
      if (row) {
        row.size = row.size === "half" ? "full" : "half";
        saveDashLayout();
        applyDashLayout();
      }
      return;
    }
    const row = (state.dashLayout || []).find((r) => r.key === key);
    if (row) {
      row.off = !row.off;
      saveDashLayout();
      applyDashLayout();
    }
  });

  bindDashDrag(view);
}

/* 손가락(마우스)을 그대로 따라오는 끌어 옮기기.
   HTML5 dragstart는 고스트 이미지가 따로 떠서 뚝뚝 끊겨 보인다.
   포인터 이벤트로 직접 옮기고, 자리를 내주는 카드들은 FLIP으로 부드럽게 민다. */
function bindDashDrag(view) {
  let drag = null;

  const rectsOf = () => new Map(dashBlocks().map((el) => [el.dataset.block, el.getBoundingClientRect()]));

  /* 순서가 바뀐 뒤, 카드들이 '원래 있던 자리에서 새 자리로' 미끄러지게 한다.
     requestAnimationFrame으로 두 프레임에 걸쳐 하면 창이 가려졌을 때
     콜백이 안 와서 카드가 어긋난 채 멈춘다. 애니메이션 API로 한 번에 건다. */
  const flip = (before) => {
    dashBlocks().forEach((el) => {
      if (drag && el === drag.el) return;
      const was = before.get(el.dataset.block);
      if (!was) return;
      const dy = was.top - el.getBoundingClientRect().top;
      if (!dy) return;
      el.animate(
        [{ transform: `translateY(${dy}px)` }, { transform: "translateY(0)" }],
        { duration: 260, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
    });
  };

  /* 변형이 걸린 상태의 위치를 되읽으면 값이 누적돼 튄다.
     (창이 가려져 레이아웃이 갱신되지 않으면 오차가 계속 더해진다)
     그래서 변형을 잠깐 지우고 '원래 자리'를 잰다. */
  const naturalTop = (el) => {
    const keep = el.style.transform;
    el.style.transform = "";
    const top = el.getBoundingClientRect().top;
    el.style.transform = keep;
    return top;
  };

  view.addEventListener("pointerdown", (event) => {
    if (!state.dashEditing || event.button !== 0) return;
    // 조작 줄의 버튼을 누른 것은 드래그가 아니다
    if (event.target.closest("button")) return;
    const el = event.target.closest("[data-block]");
    if (!el) return;

    const rect = el.getBoundingClientRect();
    drag = {
      el,
      key: el.dataset.block,
      grabY: event.clientY,
      startTop: rect.top,
      baseTop: rect.top,
      height: rect.height,
      offset: 0,
      moved: false,
    };
    el.setPointerCapture(event.pointerId);
  });

  view.addEventListener("pointermove", (event) => {
    if (!drag) return;
    if (!drag.moved) {
      // 살짝 눌린 것만으로 끌리지 않게
      if (Math.abs(event.clientY - drag.grabY) < 4) return;
      drag.moved = true;
      drag.el.classList.add("dash-lift");
      document.body.classList.add("dash-dragging-now");
    }
    event.preventDefault();

    // 보이는 위치 = 제자리(baseTop) + offset. 손을 따라가도록 offset을 정한다.
    drag.offset = event.clientY - drag.grabY + (drag.startTop - drag.baseTop);
    drag.el.style.transform = `translateY(${drag.offset}px) scale(1.015)`;

    /* 자리 바꾸기는 '바로 옆 카드와 한 칸씩'만 한다.
       중심이 어느 카드 영역에 들어왔는지로 판단하면, 카드 높이가 제각각일 때
       한 번에 여러 칸이 건너뛰며 왔다 갔다 한다. */
    const center = drag.baseTop + drag.offset + drag.height / 2;
    const layout = state.dashLayout || [];
    const from = layout.findIndex((r) => r.key === drag.key);
    if (from < 0) return;

    const nodeOf = (key) => dashBlocks().find((el) => el.dataset.block === key);
    // 높이가 0인 것(숨겨져 안 보이는 카드)은 건너뛴다
    const neighbour = (step) => {
      for (let i = from + step; i >= 0 && i < layout.length; i += step) {
        const node = nodeOf(layout[i].key);
        if (node && node.getBoundingClientRect().height > 4) return { i, node };
      }
      return null;
    };

    let to = -1;
    const up = neighbour(-1);
    const down = neighbour(1);
    if (up) {
      const r = up.node.getBoundingClientRect();
      if (center < r.top + r.height / 2) to = up.i;
    }
    if (to < 0 && down) {
      const r = down.node.getBoundingClientRect();
      if (center > r.top + r.height / 2) to = down.i;
    }
    if (to < 0) return;

    const before = rectsOf();
    const [row] = layout.splice(from, 1);
    layout.splice(to, 0, row);
    // DOM 순서만 바꾼다 (조작 줄을 다시 그리면 끌던 것이 끊긴다)
    const nodes = new Map(dashBlocks().map((el) => [el.dataset.block, el]));
    layout.forEach((r) => {
      const node = nodes.get(r.key);
      if (node) view.appendChild(node);
    });
    flip(before);
    // 자리가 바뀌었으니 '제자리'를 다시 재고, 손 위치는 그대로 유지한다
    drag.baseTop = naturalTop(drag.el);
    drag.offset = event.clientY - drag.grabY + (drag.startTop - drag.baseTop);
    drag.el.style.transform = `translateY(${drag.offset}px) scale(1.015)`;
  });

  const finish = (event) => {
    if (!drag) return;
    const el = drag.el;
    const wasMoved = drag.moved;
    if (wasMoved) {
      // 손을 놓으면 제자리로 미끄러져 들어간다.
      // 먼저 인라인 transform을 지워 '제자리'로 만들고, 그 차이를 애니메이션으로 메운다.
      const from = el.style.transform;
      el.style.transform = "";
      el.classList.remove("dash-lift");
      el.animate(
        [{ transform: from }, { transform: "none" }],
        { duration: 240, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
      document.body.classList.remove("dash-dragging-now");
      saveDashLayout();
      renderDashEditor();
    }
    try {
      el.releasePointerCapture(event.pointerId);
    } catch (error) {
      /* 이미 놓였으면 무시 */
    }
    drag = null;
  };

  view.addEventListener("pointerup", finish);
  view.addEventListener("pointercancel", finish);
}


/* 학교 행사/세미나 게시판(공공데이터 API, 서버가 6시간 캐시). 달빛제·헌혈캠페인·학위수여식처럼
   학교가 공식으로 올린 행사라 메일에서 날짜를 짐작한 것보다 정확하다. 같은 행사 메일은 서버가 캘린더에서 뺀다. */
function loadSchoolEvents(force = false) {
  api(`/api/school-events${force ? "?force=1" : ""}`)
    .then((res) => {
      const items = Array.isArray(res.items) ? res.items : [];
      if (!items.length && (state.schoolEvents || []).length) return;
      state.schoolEvents = items;
      if (state.view === "calendar") renderCalendar();
    })
    .catch(() => {});
}

function loadAcademic(force = false) {
  if (force) {
    // 상단 '일정 새로고침'이 부르는 경우: 캐시 판단을 건너뛴다
    state.academicLoaded = false;
    state.academicTriedAt = 0;
  }
  if (state.academicLoaded) return;
  const now = Date.now();
  if (state.academicTriedAt && now - state.academicTriedAt < 60000) return;
  state.academicTriedAt = now;

  loadNotices(force);
  loadShuttle(force);
  loadSchoolEvents(force);
  api(`/api/academic-calendar${force ? "?refresh=1" : ""}`)
    .then((res) => {
      // 서버가 200으로 {ok:false}를 줄 수 있다. 이때 성공으로 치면 안 된다.
      if (!res.ok || !(res.events || []).length) return;
      state.academicLoaded = true;
      state.academic = res.events;
      state.semester = res.semester || {};
      applySemester();
      renderDday();
      if (state.view === "calendar") renderCalendar();
    })
    .catch(() => {
      /* 다음 시도 때 다시 받는다 */
    });
}


/* ===== 학기에 맞춰 시간표를 움직인다 =====
   학사일정의 개강·종강 날짜로 지금 몇 학기인지 알아내
   개설과목 기본 학기를 맞추고, 시간표에 지금 몇 주차인지 띄운다. */
function applySemester() {
  const sem = state.semester;
  const badge = $("#timetableSemester");
  if (!sem || !sem.label) {
    if (badge) badge.hidden = true;
    return;
  }

  if (badge) {
    badge.hidden = false;
    if (sem.state === "during") {
      badge.textContent = `${sem.label} · ${sem.week}주차`;
      badge.dataset.state = "during";
    } else if (sem.state === "before") {
      badge.textContent = `${sem.label} 개강 D-${sem.daysUntil}`;
      badge.dataset.state = "before";
    } else {
      badge.textContent = `${sem.label} 종료`;
      badge.dataset.state = "after";
    }
  }

  // 개설과목 학기를 지금 학기로 맞춘다 (사용자가 직접 고른 뒤에는 두지 않는다)
  const select = $("#catalogTerm");
  if (select && sem.code && !select.dataset.userPicked) {
    const has = [...select.options].some((o) => o.value === sem.code);
    if (has && select.value !== sem.code) {
      select.value = sem.code;
      if (!$("#catalogPanel")?.hidden) loadCatalog();
    }
  }
}


/* ===== 셔틀버스 노선도 =====
   점(정류장)과 선으로 잇고, 이름은 점 위에 시각은 점 아래에 둔다.
   시각이 없는 곳('성서IC경유')은 작은 빈 점으로 표시한다. */
function renderShuttle() {
  const list = $("#shuttleList");
  const picker = $("#shuttleGroup");
  if (!list) return;

  const routes = state.shuttle || [];
  if (!routes.length) {
    list.innerHTML = '<p class="shuttle-empty">시간표를 불러오는 중이에요.</p>';
    return;
  }

  // 갈래 고르개 (출근버스 / 퇴근버스 / 순환 …)
  const groups = [...new Set(routes.map((r) => r.group))];
  if (picker && picker.options.length !== groups.length) {
    picker.innerHTML = groups.map((g) => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join("");
    if (!state.shuttleGroup || !groups.includes(state.shuttleGroup)) state.shuttleGroup = groups[0];
    picker.value = state.shuttleGroup;
  }

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const toMin = (t) => {
    const [h, m] = String(t || "0:0").split(":").map(Number);
    return h * 60 + (m || 0);
  };

  // 언제 학교 홈페이지에서 확인한 시간표인지 (못 받았으면 예전 것이라고 알린다)
  const hint = $("#shuttleHint");
  if (hint) {
    const meta = state.shuttleMeta || {};
    const when = meta.fetchedAt ? new Date(meta.fetchedAt) : null;
    const day = when && !Number.isNaN(when.getTime()) ? `${when.getMonth() + 1}월 ${when.getDate()}일` : "";
    hint.textContent = meta.demo
      ? "체험용 예시 시간표예요"
      : meta.stale
      ? `학교 홈페이지에서 새 시간표를 못 받아 ${day || "예전"} 시간표를 보여 줍니다`
      : `학교 홈페이지 기준${day ? ` · ${day} 확인` : ""}`;
    hint.classList.toggle("stale", Boolean(meta.stale));
  }

  const shown = routes.filter((r) => r.group === state.shuttleGroup);
  list.innerHTML = shown
    .map((route) => {
      const departMin = route.depart ? toMin(route.depart) : null;
      // 아직 안 지난 차는 눈에 띄게
      const upcoming = departMin !== null && departMin >= nowMin;
      const dots = route.stops
        .map((s, i) => {
          const last = i === route.stops.length - 1;
          return `
        <div class="bus-stop ${s.via ? "via" : ""} ${i === 0 ? "first" : ""} ${last ? "last" : ""}">
          <span class="bus-name" title="${escapeHtml(s.name)}">${escapeHtml(shortText(s.name, 9))}</span>
          <span class="bus-dot"></span>
          <span class="bus-time">${escapeHtml(s.time || "")}</span>
        </div>`;
        })
        .join("");
      return `
      <article class="bus-route ${upcoming ? "upcoming" : "passed"}">
        <div class="bus-head">
          <strong>${escapeHtml(route.name)}</strong>
          ${route.depart ? `<span class="bus-when">${escapeHtml(route.depart)} 출발</span>` : ""}
          ${upcoming ? '<em class="bus-flag">곧 출발</em>' : ""}
          ${route.note ? `<span class="bus-note">${escapeHtml(route.note)}</span>` : ""}
        </div>
        <div class="bus-line">${dots}</div>
        ${route.extra ? `<p class="bus-extra">${escapeHtml(shortText(route.extra, 70))}</p>` : ""}
      </article>`;
    })
    .join("");
}

function loadShuttle(refresh) {
  return api(`/api/shuttle${refresh ? "?refresh=1" : ""}`)
    .then((res) => {
      if (!res.routes || !res.routes.length) return;
      state.shuttle = res.routes;
      state.shuttleMeta = { fetchedAt: res.fetchedAt || "", stale: Boolean(res.stale), demo: Boolean(res.demo) };
      renderShuttle();
      if (refresh) showToast(`버스 노선 ${res.routes.length}개를 새로 받았어요.`);
    })
    .catch(() => {
      /* 학교 홈페이지가 응답하지 않아도 앱은 그대로 쓴다 */
    });
}

function bindShuttle() {
  $("#shuttleGroup")?.addEventListener("change", (event) => {
    state.shuttleGroup = event.target.value;
    renderShuttle();
  });
}


function renderDday() {
  // 학사일정이 늦게 오면 시험 기간 응원도 그때 붙는다
  setHeroGreeting();
  const box = $("#ddayBanner");
  if (!box) return;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 대학원만의 일정은 뺀다 (학부생 앱이다). 끝나지 않은 것만.
  const upcoming = (state.academic || [])
    .filter((e) => e.kind !== "대학원")
    .map((e) => ({ e, tier: ddayTier(e.title), start: new Date(`${e.start}T00:00`), end: new Date(`${e.end || e.start}T00:00`) }))
    .filter((x) => x.tier >= 0 && !Number.isNaN(x.start.getTime()) && x.end >= today)
    .sort((a, b) => a.start - b.start);
  // 석 달 안에 시험이나 정규 수강신청이 있으면 그것이 먼저. 없으면 가장 가까운 것.
  const soon = new Date(today.getTime() + 90 * 86400000);
  const next = upcoming.find((x) => x.tier <= 1 && x.start <= soon) || upcoming[0];

  if (!next) {
    box.hidden = true;
    return;
  }
  const days = Math.round((next.start - today) / 86400000);
  const running = days <= 0;
  box.hidden = false;
  box.dataset.soon = String(!running && days <= 7);
  $("#ddayNum").textContent = running ? "진행 중" : `D-${days}`;
  $("#ddayTitle").textContent = next.e.title;
  const fmt = (d) => `${d.getMonth() + 1}.${d.getDate()}`;
  $("#ddayWhen").textContent =
    next.e.start === next.e.end
      ? fmt(next.start)
      : `${fmt(next.start)} ~ ${fmt(next.end)}`;
  // 그다음에 챙길 것 두 개를 작게
  const later = upcoming
    .filter((x) => x !== next && x.tier <= 2)
    .sort((a, b) => a.tier - b.tier || a.start - b.start)
    .slice(0, 2)
    .sort((a, b) => a.start - b.start)
    .map((x) => {
      const d = Math.round((x.start - today) / 86400000);
      const name = x.e.title.replace(/^대학 및 대학원\s*|^대학\s+/, "");
      return `${name} ${d <= 0 ? "진행 중" : `D-${d}`}`;
    });
  const nextBox = $("#ddayNext");
  if (nextBox) nextBox.textContent = later.length ? `다음 · ${later.join(" · ")}` : "";
}

/* ===== 학교 공지 ===== */
function renderNotices() {
  const list = $("#noticeList");
  if (!list) return;
  const items = (state.notices || []).slice(0, 10);
  if (!items.length) {
    list.innerHTML = `<p class="notice-empty">공지를 불러오는 중이에요.</p>`;
    return;
  }
  const row = (n) => `
        <span class="notice-board">${escapeHtml(n.board)}</span>
        <span class="notice-title" title="${escapeHtml(n.title)}">${escapeHtml(n.title)}</span>
        <span class="notice-date">${escapeHtml(n.date)}</span>`;
  list.innerHTML = items
    .map((n) =>
      n.url
        ? `<a class="notice-row" href="${escapeHtml(n.url)}" data-link="${escapeHtml(n.url)}" target="_blank" rel="noreferrer">${row(n)}</a>`
        : `<div class="notice-row">${row(n)}</div>`,
    )
    .join("");
}

function loadNotices(refresh) {
  return api(`/api/notices${refresh ? "?refresh=1" : ""}`)
    .then((res) => {
      if (!res.ok && !(res.items || []).length) {
        if (refresh) showToast(res.message || "공지를 받지 못했어요.");
        return;
      }
      state.notices = res.items || [];
      renderNotices();
      if (refresh) showToast(`공지 ${state.notices.length}건을 새로 받았어요.`);
    })
    .catch(() => {
      /* 학교 홈페이지가 응답하지 않아도 앱은 그대로 쓴다 */
    });
}

function bindAcademic() {

  const underOnly = $("#academicUnderOnly");
  if (underOnly) {
    try {
      // 학부생 기준이라 처음엔 켜 둔다. 한 번 끄면 그 선택을 기억한다.
      const saved = localStorage.getItem("autosaver-academic-under");
      state.academicUnderOnly = saved === null ? true : saved === "1";
    } catch (error) {
      state.academicUnderOnly = true;
    }
    underOnly.checked = !!state.academicUnderOnly;
    underOnly.addEventListener("change", () => {
      state.academicUnderOnly = underOnly.checked;
      try {
        localStorage.setItem("autosaver-academic-under", underOnly.checked ? "1" : "0");
      } catch (error) {
        /* 무시 */
      }
      renderCalendar();
      renderDday();
    });
  }

  $("#syncAcademicButton")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      const res = await api("/api/gcal/sync-academic", {
        method: "POST",
        body: JSON.stringify({ undergraduateOnly: !!state.academicUnderOnly }),
      });
      showToast(res.ok ? `'${res.calendar}'에 ${res.message}` : res.message || "동기화하지 못했어요.");
    } catch (error) {
      showToast(error.message || "동기화하지 못했어요.");
    } finally {
      button.disabled = false;
    }
  });
}


function bindNowBar() {
  const bar = $("#nowBar");
  const toggle = $("#nowToggle");
  if (!bar || !toggle) return;
  toggle.addEventListener("click", () => {
    // 상단 바의 작은 시계는 누르면 초가 옆으로 펼쳐진다(세부 내용 상자는 열지 않는다).
    // 상자까지 열면 상단 바가 화면 반을 덮었다(2026-10-14 사용자 스크린샷).
    if (bar.classList.contains("nowbar-compact")) {
      const open = !bar.classList.contains("show-sec");
      bar.classList.toggle("show-sec", open);
      toggle.setAttribute("aria-expanded", String(open));
      return;
    }
    const open = !bar.classList.contains("nowbar-open");
    bar.classList.toggle("nowbar-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    if (open) renderNowBar();
  });
}

document.addEventListener("click", (event) => {
  const pet = event.target.closest?.("[data-dalgu-pet]");
  if (!pet) return;
  event.stopPropagation();
  const exam = examSeason();
  if (!exam) return;
  state.dalguTalk = ((state.dalguTalk ?? exam.talkAt) + 1) % exam.talk.length;
  const card = pet.closest(".now-dalgu");
  const bubble = card?.querySelector(".now-dalgu-bubble");
  if (bubble) bubble.textContent = exam.talk[state.dalguTalk];
  // renderNowDetail 이 1초마다 같은 HTML 인지 비교하므로 기억해 둔 HTML 을 지워 다음 틱에 새 말이 유지되게 한다
  const box = $("#nowDetailBody");
  if (box) delete box.dataset.html;
  card?.classList.remove("hop");
  void card?.offsetWidth;
  card?.classList.add("hop");
});

function renderNowBar() {
  const bar = $("#nowBar");
  if (!bar) return;
  // matchMedia change 이벤트가 항상 오는 건 아니라, 매 틱마다 자리를 확인한다.
  // 이미 제자리면 DOM을 건드리지 않으므로 비용이 없다.
  placeNowBar();
  const at = new Date();

  const hh = String(at.getHours()).padStart(2, "0");
  const mm = String(at.getMinutes()).padStart(2, "0");
  const time = $("#nowTime");
  // 초는 별도 <i>라, 분이 바뀔 때만 앞부분을 다시 쓴다.
  if (time && time.firstChild && time.firstChild.nodeValue !== `${hh}:${mm}`) {
    time.firstChild.nodeValue = `${hh}:${mm}`;
  }
  const sec = $("#nowSec");
  const ss = `:${String(at.getSeconds()).padStart(2, "0")}`;
  if (sec && sec.textContent !== ss) sec.textContent = ss;
  const date = $("#nowDate");
  const dateText = `${at.getMonth() + 1}월 ${at.getDate()}일 ${NOW_WEEKDAY[at.getDay()]}`;
  if (date && date.textContent !== dateText) date.textContent = dateText;

  // 자정을 넘기면 날짜에 기대는 것(D-day·인사·캘린더 '오늘'·마감 남은 날)을 다시 그린다.
  // 밤 10시에 켜 둔 앱이 다음 날 시험 첫날에도 'D-1' 을 띄우고 있었다(2026-10-12). D-day 는 학사일정을
  // 불러올 때만 그리고, 다른 부분은 값이 그대로면 다시 그리지 않기 때문이다.
  const dayKey = `${at.getFullYear()}-${at.getMonth()}-${at.getDate()}`;
  if (state.dayKey && state.dayKey !== dayKey) {
    state.dayKey = dayKey;
    renderSigns.clear();
    renderedViews.clear();
    renderDday();
    renderAll(true);
  }
  state.dayKey = dayKey;
  const info = nowStatus(at, state.timetable, state.semester);
  // 시험 기간 응원 한 줄('밥 꼭 챙겨 먹어요')로 아래 줄을 바꾸던 것은 뺐다. 사용자가 '없어도 된다' 고 했다(2026-10-14).
  if (bar.dataset.state !== info.state) bar.dataset.state = info.state;
  bar.dataset.tone = info.tone || "";

  const title = $("#nowTitle");
  if (title && title.textContent !== info.title) {
    title.textContent = info.title;
    title.title = info.title;
  }
  const sub = $("#nowSub");
  if (sub && sub.textContent !== (info.sub || "")) sub.textContent = info.sub || "";

  if (bar.classList.contains("nowbar-open")) renderNowDetail(info, at);

  const track = $("#nowTrack");
  const fill = $("#nowFill");
  if (track && fill) {
    const show = typeof info.progress === "number";
    if (track.hidden === show) track.hidden = !show;
    if (show) fill.style.width = `${Math.round(info.progress * 100)}%`;
  }
}

installIcons();
// 버전 글자(숨은 칸)만 채우는 GitHub 확인이라 첫 화면 요청들과 연결을 다투지 않게 3초 뒤로 미룬다 (켤 때 빨리 뜨게, 2026-10-15)
window.setTimeout(() => {
  api("/api/update/check").then(r=>{const e=$("#aboutVersion"); if(e) e.textContent=`버전 ${r.current||"?"}`;}).catch(()=>{});
}, 3000);
bindEvents();
bindInterestChips();
initTheme();
initRail();
setHeroGreeting();
bindNowBar();
bindShuttle();
bindFold();
bindRichToolbar();
bindAddressPicker();
bindComposeExtras();
bindAcademic();
bindDirectory();
bindDashEditor();
bindFglp();
renderNowBar();
moveNavPill();
window.addEventListener("resize", moveNavPill);
// 사이드바가 접히고 펴지는 동안에도 알약이 따라붙게 한다
const navList = document.querySelector(".nav-list");
if (navList && window.ResizeObserver) new ResizeObserver(moveNavPill).observe(navList);
// 시계라 1초마다. 상태 계산은 가볍고, 값이 그대로면 DOM을 건드리지 않는다.
window.setInterval(renderNowBar, 1000);
// 첫 새로고침이 끝나 첫 화면이 다 찼으면 서버에 알린다 → 켤 때 걸린 시간이 boot_times.json 에 남는다
refreshAll().then(() => api("/api/boot-done", { method: "POST", body: "{}" })).catch(() => {});
loadWhatsNew();
maybeStartTour();
api("/api/samsung-notes/job")
  .then((job) => {
    if (job.running) watchNotesJob();
  })
  .catch(() => {});
/* 예전에는 3.5초마다 9개를 요청하고 화면을 통째로 다시 그렸다.
   창을 보고 있지 않으면 쉬고, 주기도 늘렸다.
   작업이 돌고 있을 때만 자주 확인한다. */
window.setInterval(() => {
  if (document.hidden) return;
  const busy = !$("#topProgress")?.hidden;
  const gap = state.offline ? 5000 : busy ? 2000 : 12000;
  if (Date.now() - (pollLight.last || 0) < gap) return;
  pollLight.last = Date.now();
  pollLight();
}, 1000);

// 창으로 돌아오면 바로 한 번 확인한다 (바뀐 게 있으면 전부 받는다)
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    pollLight.last = Date.now();
    pollLight();
  }
});

/* ===== 창고: FGLP 파견 지도 =====
   예전에는 5° 격자로 육지를 손수 찍었는데, 그렇게 만든 점들은 대륙 모양이
   아니라 그냥 점 무늬였다. 진짜 세계지도 그림(정각원통도법, 3840x1920)을
   받아 두고 그 위에 좌표로 점을 찍는다.
   그림이 정확히 2:1 이라 경도 -180~180, 위도 90~-90 이 그대로 대응된다.
   상용 지도 서비스를 쓰지 않으므로 인터넷 없이도 보인다. */

const WORLD_IMG = "/img/world.png";

/* 대륙별로 들여다보기.
   가운데와 '가로로 몇 도를 보여 줄지'만 정한다. 세로는 화면 비율에서
   저절로 나온다 (그래야 지도가 안 찌그러진다). */
const CONTINENTS = [
  // 전체는 지도를 통째로. cy 를 0 이 아닌 값으로 두면 위도가 ±90 밖으로
  // 나가 위아래에 빈 띠가 생긴다.
  { key: "world", label: "전체", cx: 0, cy: 0, span: 360 },
  { key: "america", label: "아메리카", cx: -96, cy: 39, span: 96 },
  { key: "europe", label: "유럽", cx: 14, cy: 50, span: 64 },
  { key: "asia", label: "아시아", cx: 118, cy: 26, span: 76 },
];

/** 지금 보고 있는 칸 [서경, 남위, 동경, 북위] */
// 학교를 고르면 지도가 그 학교로 다가간다(사용자: '목록에서 고르면 지도도 따라 움직여야지').
// 가로 36도 ≈ 한 나라·지역이 보이는 넓이. 상세를 닫으면 보던 대륙으로 돌아간다.
const FGLP_FOCUS_SPAN = 36;

function fglpBox() {
  const f = state.fglpFocus;
  const c = f
    ? { cx: Math.min(180 - FGLP_FOCUS_SPAN / 2, Math.max(-180 + FGLP_FOCUS_SPAN / 2, f.lon)), cy: f.lat, span: FGLP_FOCUS_SPAN }
    : CONTINENTS.find((x) => x.key === (state.fglpView || "world")) || CONTINENTS[0];
  const map = $("#fglpMap");
  const rect = map ? map.getBoundingClientRect() : { width: 2, height: 1 };
  const ratio = rect.height > 0 ? rect.width / rect.height : 2;
  // 정각원통도법에서는 가로 1도와 세로 1도의 길이가 같다.
  // 그래서 세로로 보이는 각도는 화면 비율만큼 줄어든다.
  const latSpan = c.span / (ratio || 2);
  let s = c.cy - latSpan / 2;
  let n = c.cy + latSpan / 2;
  // 지도 밖(위도 ±90)으로 나가면 그만큼 안으로 밀어 넣는다.
  // 안 그러면 위아래에 지도가 없는 빈 띠가 생긴다.
  if (n > 90) {
    s -= n - 90;
    n = 90;
  }
  if (s < -90) {
    n += -90 - s;
    s = -90;
  }
  return [c.cx - c.span / 2, s, c.cx + c.span / 2, n];
}

/** 위경도 → 세계지도 전체 안에서의 % 좌표.
    핀은 지도 그림과 같은 판(.wm-stage) 위에 붙어 있다. 예전에는 핀을 '보는 칸' 기준으로
    다시 그려서, 대륙을 바꾸면 점은 새 자리에 먼저 뜨고 지도만 0.42초 뒤따라 미끄러졌다
    (사용자: '점이 먼저 생기고 지도가 움직여서 어색'). 이제 판 하나를 옮기니 둘이 함께 간다. */
function projectLatLon(lat, lon) {
  return { x: ((lon + 180) / 360) * 100, y: ((90 - lat) / 180) * 100 };
}

/** 지도 판(그림 + 핀)을 지금 보는 칸에 맞춰 늘리고 옮긴다 */
function placeWorldImg(box) {
  const img = $("#fglpMap")?.querySelector(".wm-stage");
  if (!img) return;
  const [w, s, e, n] = box || fglpBox();
  const wideDeg = e - w;
  const tallDeg = n - s;
  img.style.width = `${(360 / wideDeg) * 100}%`;
  img.style.height = `${(180 / tallDeg) * 100}%`;
  img.style.left = `${(-(w + 180) / wideDeg) * 100}%`;
  img.style.top = `${(-(90 - n) / tallDeg) * 100}%`;
}

function renderFglp() {
  const map = $("#fglpMap");
  if (!map) return;
  if (!map.dataset.drawn) {
    // 3840x1920 그림이라 풀어 놓는 데 300ms 가 든다. 화면을 멈추지 않게 따로 푼다.
    map.innerHTML = `<div class="wm-stage">
        <img class="wm-img" src="${WORLD_IMG}" alt="세계지도" draggable="false" decoding="async" />
        <div class="wm-pins" id="fglpPins"></div>
      </div>`;
    map.dataset.drawn = "1";
    // 큰 그림이 풀리기 전에 점만 빈 바탕에 먼저 뜨지 않게, 그림이 준비되면 판째로 나타난다
    const stage = map.querySelector(".wm-stage");
    const shown = () => stage.classList.add("ready");
    const img = map.querySelector(".wm-img");
    if (img.decode) img.decode().then(shown, shown);
    else img.addEventListener("load", shown, { once: true });
    window.setTimeout(shown, 2500);
    // 창 크기가 바뀌면 보이는 각도도 달라진다
    let timer = 0;
    new ResizeObserver(() => {
      window.clearTimeout(timer);
      // 핀이 지도 판에 붙어 있으니 판만 다시 맞추면 된다. 예전처럼 renderFglpAll 을 부르면
      // 상세를 여는 순간(페이지가 길어져 스크롤 막대가 생기며 지도 폭이 2px 줄어듦) 상세가 도로 닫혔다.
      timer = window.setTimeout(() => placeWorldImg(), 140);
    }).observe(map);
    loadFglp();
    return;
  }
  placeWorldImg();
}

async function loadFglp() {
  try {
    const data = await api("/api/fglp");
    state.fglp = data;
    state.fglpKind = state.fglpKind || "fglp";
    renderFglpAll();
  } catch (error) {
    const list = $("#fglpList");
    if (list) list.innerHTML = `<p class="fglp-empty">불러오지 못했습니다: ${escapeHtml(error.message || "")}</p>`;
  }
}

function fglpSchools() {
  const kind = state.fglpKind || "fglp";
  return (state.fglp?.schools || []).filter((s) => s.kind === kind);
}

function renderFglpAll() {
  const data = state.fglp;
  if (!data) return;
  const kind = state.fglpKind || "fglp";
  const prog = data.program || {};
  const ex = data.exchange || {};
  const isF = kind === "fglp";

  // ① 프로그램 고르기
  const counts = {
    fglp: (data.schools || []).filter((s) => s.kind === "fglp").length,
    exchange: (data.schools || []).filter((s) => s.kind === "exchange").length,
  };
  const tabs = $("#fglpTabs");
  if (tabs) {
    tabs.innerHTML = [
      { key: "fglp", label: "FGLP" },
      { key: "exchange", label: "학점교류" },
    ]
      .map(
        (x) => `<button type="button" class="fglp-tab ${kind === x.key ? "on" : ""}"
          role="tab" aria-selected="${kind === x.key}" data-fglp-kind="${x.key}">
          ${x.label}<em>${counts[x.key]}</em></button>`,
      )
      .join("");
  }

  const hint = $("#fglpHint");
  if (hint) {
    hint.textContent = isF
      ? "여름방학에 해외 대학 정규 수업을 듣고 옵니다"
      : "한 학기~1년 동안 공부하고 학점을 옮겨 옵니다";
  }

  // ② 늘 보이는 공통 사실
  const facts = $("#fglpFacts");
  if (facts) {
    const rows = isF
      ? [
          ["지원 자격", prog.target || "-"],
          ["학점", prog.gpa || "-"],
          ["시기", prog.period || "-"],
          ["지원 내용", prog.support || "-"],
        ]
      : [
          ["기간", "한 학기 ~ 1년"],
          ["지원 내용", ex.support || "-"],
          ["학점", "이수 학점을 DGIST로 옮겨 옵니다"],
          ["규모", ex.scale || "-"],
        ];
    facts.innerHTML = rows
      .map(
        ([k, v]) => `<div class="ff-item"><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd></div>`,
      )
      .join("");
  }

  // ③ 지도 핀 + 학교 목록 (같은 순서, 같은 번호)
  const schools = fglpSchools();
  // 대륙 고르개
  const views = $("#fglpViews");
  if (views) {
    views.innerHTML = CONTINENTS.map(
      (c) => `<button type="button" class="fglp-view ${(state.fglpView || "world") === c.key ? "on" : ""}"
        data-fglp-view="${c.key}">${c.label}</button>`,
    ).join("");
  }

  const pins = $("#fglpPins");
  if (pins) {
    placeWorldImg();
    // 핀은 세계 좌표라 대륙을 바꿔도 다시 그릴 필요가 없다. 탭(FGLP/학점교류)이 바뀔 때만 새로 그리고,
    // 그때는 점이 하나씩 피어나게 한다(--i 로 조금씩 늦게).
    const sig = kind + ":" + schools.length;
    if (pins.dataset.sig !== sig) {
      pins.dataset.sig = sig;
      pins.innerHTML = schools
      .map((s, i) => {
        const pt = projectLatLon(s.lat, s.lon);
        return `<button type="button" class="wm-pin k-${s.kind}" data-fglp="${i}"
          style="left:${pt.x.toFixed(3)}%;top:${pt.y.toFixed(3)}%;--i:${i}"
          title="${escapeHtml(s.name)} · ${escapeHtml(s.country)}">
          <span class="wm-pin-dot"></span>
          <span class="wm-pin-label">${escapeHtml(shortText(s.name, 22))}</span>
        </button>`;
      })
      .join("");
    }
  }

  const list = $("#fglpList");
  if (list) {
    // 나라별로 묶어 두면 지도와 눈이 같이 움직인다
    const byCountry = new Map();
    schools.forEach((s, i) => {
      if (!byCountry.has(s.country)) byCountry.set(s.country, []);
      byCountry.get(s.country).push({ ...s, idx: i });
    });
    list.innerHTML = [...byCountry.entries()]
      .map(
        ([country, arr]) => `
        <div class="fl-group">
          <h4>${escapeHtml(country)} <em>${arr.length}</em></h4>
          ${arr
            .map(
              (s) => `<button type="button" class="fl-row" data-fglp="${s.idx}">
                ${s.photo ? `<img class="fl-thumb" src="${s.photo}" alt="" loading="lazy" />` : `<span class="fl-thumb empty"></span>`}
                <span class="fl-text">
                  <strong>${escapeHtml(s.name)}</strong>
                  ${s.language ? `<span>${escapeHtml(s.language)}</span>` : `<span>${escapeHtml(s.city)}</span>`}
                </span>
              </button>`,
            )
            .join("")}
        </div>`,
      )
      .join("");
  }

  // ④ 단서는 접어 둔다
  const notes = $("#fglpNotes");
  if (notes) {
    notes.innerHTML =
      (data.notes || [])
        .map((n) => `<p class="fglp-note ${n.level}">${escapeHtml(n.text)}</p>`)
        .join("") +
      `<p class="fglp-src">출처: <a href="${data.sourceUrl}" target="_blank" rel="noopener">${escapeHtml(data.sourceLabel || "")}</a>
        · <a href="${data.officialUrl}" target="_blank" rel="noopener">기초학부 페이지</a>
        · 마지막 확인 ${escapeHtml(data.verifiedOn || "")} · 문의 ${escapeHtml(data.contact || "")}</p>`;
  }
  const cc = $("#fglpCaveatCount");
  if (cc) cc.textContent = (data.notes || []).length ? `${data.notes.length}` : "";

  showFglpDetail(null);
}

/** 학교 하나를 짚는다. 목록·지도·상세가 함께 움직인다. */
function showFglpDetail(index) {
  const box = $("#fglpDetail");
  if (!box) return;
  const on = (el) => el.classList.toggle("on", String(index) === el.dataset.fglp);
  document.querySelectorAll("[data-fglp]").forEach(on);

  if (index === null || index === undefined) {
    box.hidden = true;
    box.innerHTML = "";
    if (state.fglpFocus) {
      state.fglpFocus = null;
      placeWorldImg();
    }
    return;
  }
  const s = fglpSchools()[index];
  if (!s) return;
  state.fglpFocus = { lat: s.lat, lon: s.lon };
  placeWorldImg();
  // 목록에서 골랐으면 지도가 화면 밖일 수 있다 → 지도가 보이게
  const map = $("#fglpMap");
  const r = map?.getBoundingClientRect();
  if (r && (r.bottom < 60 || r.top > window.innerHeight - 60)) map.scrollIntoView({ block: "nearest" });
  const prog = state.fglp?.program || {};
  box.hidden = false;
  // 사진은 lazy 로 받지 않는다: 가로로 넘기는 칸 안에서는 다음 장이 끝내 안 불러와졌다(검은 칸). 한 학교 석 장뿐이다.
  const photos = s.photos || [];
  const slides = photos
    .map((p, i) => {
      const by = p.by || tr("위키미디어 커먼스");
      const credit = tr(`사진 ${by} · ${p.license || ""}`);
      return `<figure class="fd-slide">
          <img src="${p.src}" alt="${escapeHtml(s.name)} ${i + 1}" />
          <figcaption><button type="button" class="fd-credit" data-fglp-link="${escapeHtml(p.source || "")}">${escapeHtml(credit)}</button></figcaption>
        </figure>`;
    })
    .join("");
  const where = [s.city, s.country].filter(Boolean).map(escapeHtml).join(", ");
  const local = fglpLocalTime(s.tz);
  const timeHtml = local ? `<p class="fd-time">${escapeHtml(local)}</p>` : "";
  const koHtml = s.koName && s.koName !== s.name ? `<p class="fd-ko">${escapeHtml(s.koName)}</p>` : "";
  // 여러 장이면 옆으로 넘긴다(끌기·트랙패드). 스크롤 막대 대신 ‹ › 단추
  const arrows =
    photos.length > 1
      ? `<button type="button" class="fd-nav prev" data-fglp-slide="-1" aria-label="${tr("이전 사진")}">‹</button>
         <button type="button" class="fd-nav next" data-fglp-slide="1" aria-label="${tr("다음 사진")}">›</button>`
      : "";
  const gallery = photos.length
    ? `<div class="fd-gallery-wrap"><div class="fd-gallery${photos.length > 1 ? " many" : ""}">${slides}</div>${arrows}</div>`
    : "";
  const facts = fglpFacts(s);
  const factsHtml = facts.length ? `<div class="fd-facts">${facts.map((f) => `<span>${escapeHtml(f)}</span>`).join("")}</div>` : "";
  box.innerHTML = `
    ${gallery}
    <div class="fd-head">
      <div>
        <h3>${escapeHtml(s.name)}</h3>
        ${koHtml}
        <p class="fd-where">${where}</p>
        ${timeHtml}
      </div>
      <button type="button" class="icon-button" data-fglp-back aria-label="닫기">
        <span class="icon" data-icon="x"></span>
      </button>
    </div>
    ${factsHtml}
    ${
      s.language
        ? `<dl class="fd-list"><div><dt>어학 기준</dt><dd><b>${escapeHtml(s.language)}</b></dd></div>
           ${s.group ? `<div><dt>구분</dt><dd>${escapeHtml(s.group)} <span class="fd-note">(2027 안내서 분류)</span></dd></div>` : ""}
           <div><dt>학점</dt><dd>${escapeHtml(prog.gpa || "-")}</dd></div></dl>`
        : `<p class="fd-hint">학점교류 대학입니다. 위의 공통 안내를 참고하세요.</p>`
    }
    ${fglpLinksHtml(s)}
    <p class="fd-hint">대학별 정원은 공개 문서에 없습니다. 국제협력팀에 확인하세요.</p>`;
  installIcons(box);
}

/* --- 학교 상세에 덧붙이는 것 (2026-10-21: 홈페이지로 가기 · 사진 여러 장 · 기본 정보) ---
   값은 tools/fetch_uni_info.py 가 위키데이터에서 받아 앱에 넣어 둔 것. 없는 값은 비운다. */
const DGIST_LATLON = [35.7055, 128.4547];

function fglpDistanceKm(lat, lon) {
  const rad = (d) => (d * Math.PI) / 180;
  const [a1, b1] = DGIST_LATLON.map(rad);
  const a2 = rad(lat);
  const b2 = rad(lon);
  const h = Math.sin((a2 - a1) / 2) ** 2 + Math.cos(a1) * Math.cos(a2) * Math.sin((b2 - b1) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/* 시간대의 UTC 와의 차이(분). 그 순간의 벽시계를 Intl 로 읽어 계산하므로 서머타임이 저절로 반영된다. */
function tzOffsetMinutes(tz, when) {
  const parts = {};
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  fmt.formatToParts(when).forEach((p) => {
    parts[p.type] = p.value;
  });
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  return Math.round((asUtc - Math.floor(when.getTime() / 60000) * 60000) / 60000);
}

function fglpLocalTime(tz) {
  if (!tz) return "";
  try {
    const now = new Date();
    const locale = document.documentElement.lang === "en" ? "en-US" : "ko-KR";
    const clock = new Intl.DateTimeFormat(locale, { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(now);
    const diff = (tzOffsetMinutes(tz, now) - tzOffsetMinutes("Asia/Seoul", now)) / 60;
    const abs = Math.abs(diff);
    const hours = abs % 1 ? abs.toFixed(1) : String(abs);
    let gap = tr("한국과 같은 시각");
    if (diff < 0) gap = tr(`한국보다 ${hours}시간 늦음`);
    if (diff > 0) gap = tr(`한국보다 ${hours}시간 빠름`);
    return tr(`현지 ${clock}`) + " (" + gap + ")";
  } catch (error) {
    return "";
  }
}

function fglpFacts(s) {
  const out = [];
  if (s.founded) out.push(tr(`${s.founded}년 설립`));
  (s.kinds || []).forEach((k) => out.push(tr(k)));
  if (s.students) {
    const n = Number(s.students).toLocaleString();
    const year = s.studentsYear;
    out.push(year ? tr(`학생 ${n}명 (${year})`) : tr(`학생 ${n}명`));
  }
  if (Number.isFinite(s.lat) && Number.isFinite(s.lon)) {
    const km = Math.round(fglpDistanceKm(s.lat, s.lon) / 100) * 100;
    const kmText = km.toLocaleString();
    out.push(tr(`DGIST에서 약 ${kmText}km`));
  }
  return out;
}

function fglpLinksHtml(s) {
  // fglp.known_links 와 같은 모양이어야 서버가 열어 준다
  const map = Number.isFinite(s.lat) ? `https://www.openstreetmap.org/?mlat=${s.lat}&mlon=${s.lon}#map=15/${s.lat}/${s.lon}` : "";
  const links = [
    { url: s.website, icon: "globe", label: tr("홈페이지") },
    { url: s.summer, icon: "calendar", label: tr("여름학기 안내") },
    { url: s.wiki, icon: "book", label: tr("위키백과") },
    { url: map, icon: "map", label: tr("지도") },
  ].filter((l) => l.url);
  if (!links.length) return "";
  const btns = links
    .map(
      (l) => `<button type="button" class="fd-link" data-fglp-link="${escapeHtml(l.url)}" title="${escapeHtml(l.url)}">
        <span class="icon" data-icon="${l.icon}"></span><span class="fd-link-text">${escapeHtml(l.label)}</span><span class="icon fd-ext" data-icon="external"></span></button>`,
    )
    .join("");
  return `<div class="fd-links">${btns}</div>`;
}

function bindFglp() {
  // 지도 핀과 목록이 같은 번호를 쓰므로 한 곳에서 받는다
  const pick = (event) => {
    // 학교 홈페이지·여름학기·위키백과·지도·사진 출처: 기본 브라우저로 (서버가 fglp 자료에 있는 주소만 연다)
    const out = event.target.closest("[data-fglp-link]");
    if (out) {
      const url = out.dataset.fglpLink;
      if (url) {
        api("/api/open-url", { method: "POST", body: JSON.stringify({ url }) }).catch((error) => showToast(humanError(error)));
      }
      return;
    }
    const slide = event.target.closest("[data-fglp-slide]");
    if (slide) {
      const strip = slide.parentElement.querySelector(".fd-gallery");
      const step = strip.querySelector(".fd-slide")?.offsetWidth || strip.clientWidth;
      const atEnd = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 4;
      const dir = Number(slide.dataset.fglpSlide);
      // 끝에서 한 번 더 누르면 처음으로. behavior:"smooth" 는 미리보기 WebView 에서 아예 움직이지 않아 바로 옮긴다
      if (dir > 0 && atEnd) strip.scrollLeft = 0;
      else strip.scrollBy({ left: dir * (step + 6) });
      return;
    }
    const back = event.target.closest("[data-fglp-back]");
    if (back) {
      showFglpDetail(null);
      return;
    }
    const hit = event.target.closest("[data-fglp]");
    if (hit) showFglpDetail(Number(hit.dataset.fglp));
  };
  $("#fglpMap")?.addEventListener("click", pick);
  $("#fglpList")?.addEventListener("click", pick);
  $("#fglpDetail")?.addEventListener("click", pick);

  $("#fglpViews")?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-fglp-view]");
    if (!btn) return;
    state.fglpView = btn.dataset.fglpView;
    state.fglpFocus = null;
    // 지도와 핀이 같은 박자로 미끄러진다
    placeWorldImg();
    renderFglpAll();
  });

  $("#fglpTabs")?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-fglp-kind]");
    if (!btn) return;
    state.fglpKind = btn.dataset.fglpKind;
    renderFglpAll();
  });
}


/* ===== 강의자료를 내 컴퓨터에도 자동 저장 =====
   동기화가 끝날 때마다 서버가 알아서 맞춘다(web_ui.autosave_local).
   여기서는 '지금 저장' 버튼과, 처음 켰을 때 한 번 맞추는 일만 한다.
   처음 켜면 수백 개를 복사할 수 있어 서버가 뒤에서 돌리고 진행만 받아 온다. */
/** C:\Users\이름\OneDrive\문서\붕어빵 → 문서\붕어빵, 맥 /Users/이름/Documents/붕어빵 → Documents/붕어빵
    (전체 경로는 title 로 남긴다) */
function friendlyPath(path) {
  return String(path || "")
    .replace(/^[A-Za-z]:\\Users\\[^\\]+\\(?:OneDrive[^\\]*\\)?/i, "")
    .replace(/^\/Users\/[^/]+\/(?:Library\/CloudStorage\/[^/]+\/)?/, "")
    .replace(/^\/home\/[^/]+\//, "");
}

/** 스위치 + 범위(이번 학기/모든 과목)를 서버 값(off/current/all)으로 */
function saveScopeValue() {
  return $("#configForm")?.querySelector("input[name=localSaveScope]:checked")?.value || "current";
}

function folderLayoutValue() {
  return $("#configForm")?.querySelector("input[name=folderLayout]:checked")?.value === "flat" ? "flat" : "lms";
}

function localSaveMode() {
  if (!$("#localSaveToggle")?.checked) return "off";
  return saveScopeValue();
}

/** 켜 둔 클라우드 폴더가 하나라도 있나 (초안 기준) */
function anyCloudOn() {
  return (state.config?.clouds || []).some((c) => {
    const draft = state.cloudDraft?.[c.key];
    const installed = c.installed || Boolean(draft?.path);
    return installed && draft?.on;
  });
}

/* ===== 폴더 정리 방식 설명 (? 를 누르면) =====
   말로만 'LMS 폴더 그대로 / 과목 폴더에 모아서' 라고 하면 무슨 차이인지 알기 어렵다.
   내 자료 중 LMS 폴더가 여러 개인 과목을 골라, 두 방식으로 저장하면 폴더가 어떻게 보이는지 나란히 그린다.
   (자료가 아직 없으면 일반화학Ⅱ 공지 첨부를 예로 든다) */
function layoutExample() {
  const hidden = /^(weekly schedule|ultradocumentbody)$/i;
  const byCourse = new Map();
  (state.files || []).forEach((f) => {
    if (f.status !== "local" || !f.courseLabel) return;
    // 실제 저장 폴더 이름과 같게: 폴더 이름에 못 쓰는 글자(: 등)는 빈칸, 40자까지 (folder_layout.safe_folder)
    const folder = (f.folderPath || [])
      .map((p) => String(p).trim())
      .filter((p) => p && !hidden.test(p))
      // 따옴표는 \x22 로 적는다: 글자 그대로 쓰면 영어 번역 추출기(scripts/i18n_extract.py)가 문자열 경계로 오해한다
      .map((p) => p.replace(/[<>:\x22/\\|?*\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 40).trim());
    const list = byCourse.get(f.courseLabel) || [];
    list.push({ name: String(f.name || ""), folder, year: f.year || 0, term: f.term || 0 });
    byCourse.set(f.courseLabel, list);
  });
  let best = null;
  byCourse.forEach((files, label) => {
    const folders = new Set(files.filter((f) => f.folder.length).map((f) => f.folder.join("/")));
    const score = [Math.max(...files.map((f) => f.year * 10 + f.term)), Math.min(folders.size, 3), files.length];
    if (folders.size >= 2 && (!best || score.join() > best.score.join())) best = { label, files, score };
  });
  if (!best) {
    return {
      course: "일반화학Ⅱ",
      files: [
        { name: "Lecture Material_Chapter 13_BS119.pdf", folder: ["공지사항(Announcements)"] },
        { name: "Lecture Material_Chapter 14_BS119.pdf", folder: ["Chapter 14_Lecture Materials"] },
        { name: "Practice Exercises_BS119_Chapter 15.pdf", folder: ["Practice Exercises Chapter 15"] },
      ],
    };
  }
  // 서로 다른 폴더에서 하나씩, 공지사항 첨부가 있으면 먼저 (LMS 공지에 붙은 파일이 어디로 가는지가 제일 헷갈린다)
  const picked = [];
  const seen = new Set();
  const order = [...best.files].sort((a, b) => /공지|announcement/i.test(b.folder.join()) - /공지|announcement/i.test(a.folder.join()));
  for (const f of order) {
    const key = f.folder.join("/");
    if (!f.folder.length || seen.has(key)) continue;
    seen.add(key);
    picked.push(f);
    if (picked.length === 3) break;
  }
  return { course: courseShortName(best.label), files: picked };
}

function layoutTreeHtml(example, layout) {
  const folderIco = iconHtml("folder");
  const fileIco = iconHtml("file");
  const short = (s, n) => escapeHtml(shortText(s, n));
  const rows = [`<li class="lt-course">${folderIco}<span>${short(example.course, 26)}</span></li>`];
  if (layout === "lms") {
    example.files.forEach((f) => {
      rows.push(`<li class="lt-sub" style="--lv:1">${folderIco}<span>${short(f.folder[f.folder.length - 1], 30)}</span></li>`);
      rows.push(`<li class="lt-file" style="--lv:2">${fileIco}<span>${short(f.name, 34)}</span></li>`);
    });
  } else {
    example.files.forEach((f) => {
      rows.push(`<li class="lt-file" style="--lv:1">${fileIco}<span>${short(f.name, 40)}</span></li>`);
    });
  }
  return `<ul class="lt-tree">${rows.join("")}</ul>`;
}

function renderLayoutHelp() {
  const pop = $("#folderLayoutPop");
  if (!pop) return;
  const now = folderLayoutValue();
  const ex = layoutExample();
  const card = (value, title, caption) => `
    <button type="button" class="lt-card ${now === value ? "on" : ""}" data-layout-pick="${value}" aria-pressed="${now === value}">
      <span class="lt-window"><i></i><i></i><i></i><b>${escapeHtml(title)}</b>${now === value ? '<em class="lt-now">지금 방식</em>' : ""}</span>
      ${layoutTreeHtml(ex, value)}
      <span class="lt-caption">${escapeHtml(caption)}</span>
    </button>`;
  pop.innerHTML = `
    <div class="lt-head">
      <strong>저장하면 폴더가 이렇게 보여요</strong>
      <span>내 자료 '${escapeHtml(shortText(ex.course, 24))}' 로 그렸어요. 눌러서 고를 수 있어요.</span>
      <button type="button" class="icon-button" data-layout-close aria-label="닫기">${iconHtml("x")}</button>
    </div>
    <div class="lt-cards">
      ${card("lms", "LMS 폴더 그대로", "교수님이 LMS에 올린 자리 그대로예요. 공지에 붙은 파일은 '공지사항' 폴더, 주차 자료는 그 주차 폴더에 들어가요.")}
      ${card("flat", "과목 폴더에 모아서", "폴더를 열지 않고 과목 자료를 한눈에 봐요. 파일 이름은 LMS 그대로예요.")}
    </div>
    <ul class="lt-notes">
      <li>${iconHtml("sync")}바꾸면 이미 저장한 파일도 새 모양으로 옮겨요. 다시 받지 않아요.</li>
      <li>${iconHtml("check")}내가 필기한 파일은 그 자리에 그대로 둬요.</li>
      <li>${iconHtml("cloud")}Drive는 다음 동기화 때 옮겨요. 비게 된 Drive 폴더는 남아 있으니 필요 없으면 지워 주세요.</li>
    </ul>`;
}

function toggleLayoutHelp(open) {
  const pop = $("#folderLayoutPop");
  const button = $("#folderLayoutHelp");
  if (!pop) return;
  const show = open ?? pop.hidden;
  if (show) renderLayoutHelp();
  pop.hidden = !show;
  button?.setAttribute("aria-expanded", String(show));
}

/** 설정 저장·지금 맞추기에 함께 보내는 저장 위치 값 */
function savePlacePayload() {
  const form = $("#configForm");
  return {
    driveUpload: Boolean(form?.elements?.driveUpload?.checked),
    autoLocalSave: localSaveMode(),
    saveScope: saveScopeValue(),
    folderLayout: folderLayoutValue(),
    localSavePath: form?.elements?.localSavePath?.value || "",
    clouds: state.cloudDraft || {},
  };
}

function syncLocalSaveButton() {
  const button = $("#localSaveNowButton");
  if (!button) return;
  const off = localSaveMode() === "off" && !anyCloudOn();
  button.disabled = off;
  button.title = off ? "먼저 내 컴퓨터나 클라우드 저장을 켜 주세요" : "켜 둔 저장 위치를 지금 맞춥니다";
  const row = $("#saveScopeRow");
  if (row) row.classList.toggle("muted", off);
}

/* 클라우드 로고: 공식 로고 파일 대신 알아볼 만한 단순한 그림 */
const CLOUD_LOGOS = {
  onedrive:
    '<svg viewBox="0 0 24 24"><path fill="#0364b8" d="M9.8 8.2a5.3 5.3 0 0 1 8.9 2.3 3.9 3.9 0 0 1 1.2 7.6H7.4l2.4-9.9Z"/><path fill="#0078d4" d="M9.6 8.4 7 18.1H5.2a3.7 3.7 0 0 1-.8-7.3 5 5 0 0 1 5.2-2.4Z"/><path fill="#28a8ea" d="M20 11.2a3.5 3.5 0 0 1-.6 6.9H7.4l3.1-5.3a4 4 0 0 1 5-1.6l4.5 0Z"/></svg>',
  dropbox:
    '<svg viewBox="0 0 24 24" fill="#0061ff"><path d="m7 3 5 3.2-5 3.2L2 6.2 7 3Zm10 0 5 3.2-5 3.2-5-3.2L17 3ZM2 12.6l5-3.2 5 3.2-5 3.2-5-3.2Zm15-3.2 5 3.2-5 3.2-5-3.2 5-3.2ZM7 17l5-3.2 5 3.2-5 3.2L7 17Z"/></svg>',
  icloud:
    '<svg viewBox="0 0 24 24"><path fill="#3e9bf0" d="M17.6 18H6.8a4.3 4.3 0 0 1-.6-8.5 5.9 5.9 0 0 1 11.2 1.6 3.5 3.5 0 0 1 .2 6.9Z"/></svg>',
  mybox:
    '<svg viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="5" fill="#03c75a"/><path fill="#fff" d="M8 7h2.6l3.1 4.6V7H16v10h-2.6l-3.1-4.6V17H8V7Z"/></svg>',
};

/* 클라우드 카드: 이 PC 에 그 프로그램이 있으면 스위치, 없으면 흐리게 + '폴더 고르기' */
function renderCloudDests() {
  const grid = $("#cloudDestGrid");
  if (!grid) return;
  const clouds = state.config?.clouds || [];
  const html = clouds
    .map((c) => {
      const draft = state.cloudDraft?.[c.key] || { on: false, path: "" };
      const root = draft.path || c.root;
      const installed = Boolean(root);
      const on = installed && draft.on;
      const where = installed ? `${friendlyPath(root)} › 붕어빵 강의자료` : "이 PC에서 찾지 못했어요";
      return `
        <div class="st-cloud-card${on ? " on" : ""}${installed ? "" : " missing"}" data-cloud="${c.key}">
          <span class="st-cloud-logo" aria-hidden="true">${CLOUD_LOGOS[c.key] || ""}</span>
          <span class="st-cloud-text">
            <strong>${escapeHtml(c.label)}</strong>
            <span title="${escapeHtml(root ? root : "")}">${escapeHtml(on ? "자동 저장 중" : where)}</span>
          </span>
          ${
            installed
              ? `<label class="toggle" title="${escapeHtml(c.label)}에 자동 저장">
                   <input type="checkbox" data-cloud-toggle="${c.key}" ${on ? "checked" : ""} />
                   <span class="track"></span>
                 </label>`
              : `<button type="button" class="button compact ghost" data-cloud-pick="${c.key}">폴더 고르기</button>`
          }
        </div>`;
    })
    .join("");
  if (grid.dataset.html !== html) {
    grid.dataset.html = html;
    grid.innerHTML = html;
  }

  // 내 컴퓨터 저장 폴더가 이미 켜 둔 클라우드 안에 있으면 같은 파일이 두 번 올라간다
  const note = $("#cloudOverlapNote");
  if (note) {
    // 경로 구분자는 Windows 가 '\', 맥이 '/' 라 '/' 로 맞춰 비교한다 (예전엔 '\' 만 봐서 맥에서는 안 떴다)
    const norm = (p) => String(p || "").replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
    const localFolder = norm(state.config?.localSaveFolder);
    const inside = localSaveMode() !== "off"
      ? clouds.find((c) => {
          const root = norm(state.cloudDraft?.[c.key]?.path || c.root);
          return root && state.cloudDraft?.[c.key]?.on && localFolder.startsWith(root + "/");
        })
      : null;
    note.hidden = !inside;
    if (inside) {
      note.textContent = `내 컴퓨터 저장 폴더가 이미 ${inside.label} 안에 있어요. 둘 다 켜면 ${inside.label}에 같은 자료가 두 벌 올라갑니다.`;
    }
  }
}

/* 강의자료 저장 카드: 켜진 곳은 테두리로, 상태는 한 단어로 보인다.
   드라이브를 켜 두었는데 구글 로그인이 안 되어 있으면 바로 아래에 알린다. */
function renderSaveDestinations() {
  const drive = $("#driveUploadToggle");
  const local = $("#localSaveToggle");
  if (!drive || !local) return;
  const oauth = state.status?.googleOAuth || {};
  const googleOk = Boolean(oauth.tokenUsable);
  // 구글 로그인 준비물이 없는 판(맥·리눅스): 켤 수 없게 두고 '준비 중' 으로만 (로그인하라고 조르지 않는다)
  // 상태를 아직 못 받았으면(켜는 중) 판단하지 않는다. 안 그러면 Windows 에서도 잠깐 꺼진 것으로 바꿔 버린다
  const unavailable = Boolean(state.status?.googleOAuth) && !googleOk && !oauth.credentialsExists;
  drive.disabled = unavailable;
  if (unavailable) drive.checked = false; // 켜진 것처럼 보이지 않게 (저장하면 드라이브를 끈 것으로 남는다 — 이 판에서는 맞는 값)
  const driveOn = drive.checked && !unavailable;
  $("#driveDest").classList.toggle("on", driveOn && googleOk);
  $("#driveDest").classList.toggle("blocked", driveOn && !googleOk);
  $("#driveState").textContent = unavailable ? "준비 중" : !driveOn ? "꺼짐" : googleOk ? "자동 저장 중" : "로그인 필요";
  $("#driveWarn").hidden = !(driveOn && !googleOk);

  const mode = localSaveMode();
  $("#localDest").classList.toggle("on", mode !== "off");
  $("#localState").textContent = mode === "off" ? "꺼짐" : "자동 저장 중";
  $("#localSaveMore").hidden = mode === "off";
  renderCloudDests();
}

/* 지금 맞추기: 화면에서 바꾼 저장 위치를 먼저 저장해야 서버가 그곳에 넣는다 */
async function runLocalSaveNow(options = {}) {
  const button = $("#localSaveNowButton");
  if (button) button.disabled = true;
  try {
    if (!options.alreadySaved) {
      await api("/api/config", { method: "POST", body: JSON.stringify(savePlacePayload()) });
    }
    const res = await api("/api/local-autosave/run", { method: "POST", body: "{}" });
    showTopProgress("강의자료를 저장 위치에 넣는 중", 40);
    for (;;) {
      await new Promise((resolve) => window.setTimeout(resolve, 600));
      const job = await api("/api/local-autosave/job");
      if (job.running) continue;
      const result = job.result || {};
      finishTopProgress(result.ok === false ? "저장 실패" : "저장 완료");
      showToast(result.message || res.message || "저장했습니다.");
      break;
    }
    renderStorage();
  } catch (error) {
    hideTopProgress();
    showToast(error.message);
  } finally {
    syncLocalSaveButton();
  }
}

/* 저장 위치 스위치는 누르는 즉시 저장한다.
   예전에는 맨 아래 '설정 저장' 을 눌러야 저장돼서, 안 누르고 나가거나 화면이 다시 그려지면
   (설정 화면을 열 때마다 저장된 값으로 채운다) 켠 스위치가 도로 꺼졌다. config.json 은 9/23 이후 한 번도 안 바뀌어 있었다. */
let savePlaceTimer = 0;
function saveSavePlaceSoon() {
  window.clearTimeout(savePlaceTimer);
  savePlaceTimer = window.setTimeout(async () => {
    const payload = savePlacePayload();
    const wasLocal = state.config?.autoLocalSave || "off";
    const layoutChanged = (state.config?.folderLayout || "lms") !== payload.folderLayout;
    const cloudsBefore = (state.config?.clouds || []).filter((c) => c.on).map((c) => c.key).join();
    try {
      await api("/api/config", { method: "POST", body: JSON.stringify(payload) });
      state.config = await api("/api/config");
      const cloudsNow = (state.config?.clouds || []).filter((c) => c.on).map((c) => c.key).join();
      const localOn = payload.autoLocalSave !== "off";
      if (layoutChanged) {
        // 이미 넣어 둔 파일도 새 모양으로 옮긴다: 내 컴퓨터·클라우드는 지금, Drive 는 다음 동기화 때(작업 프로세스가 올린다)
        const where = payload.folderLayout === "flat" ? "과목 폴더에 모아" : "LMS 폴더대로 나눠";
        showToast(`이제 ${where} 둬요.${payload.driveUpload ? " Drive는 다음 동기화 때 옮겨요." : ""}`);
        if (localOn || cloudsNow) runLocalSaveNow({ alreadySaved: true });
        return;
      }
      showToast(
        payload.autoLocalSave !== wasLocal
          ? localOn ? "내 컴퓨터 저장을 켰어요" : "내 컴퓨터 저장을 껐어요"
          : "저장 위치를 바꿨어요",
      );
      // 새로 켠 곳은 다음 동기화까지 기다리지 않고 지금 한 번 채운다
      if ((localOn && payload.autoLocalSave !== wasLocal) || (cloudsNow && cloudsNow !== cloudsBefore)) {
        runLocalSaveNow({ alreadySaved: true });
      }
    } catch (error) {
      showToast(humanError(error));
    }
  }, 250);
}

(function bindLocalSave() {
  const refresh = () => {
    renderSaveDestinations();
    syncLocalSaveButton();
    saveSavePlaceSoon();
  };
  $("#localSaveToggle")?.addEventListener("change", refresh);
  $("#driveUploadToggle")?.addEventListener("change", refresh);
  $("#saveScopeRow")?.addEventListener("change", refresh);
  $("#folderLayoutRow")?.addEventListener("change", (event) => {
    if (event.target.name !== "folderLayout") return;
    if (!$("#folderLayoutPop").hidden) renderLayoutHelp();
    refresh();
  });
  $("#folderLayoutHelp")?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleLayoutHelp();
  });
  $("#folderLayoutPop")?.addEventListener("click", (event) => {
    event.stopPropagation();
    if (event.target.closest("[data-layout-close]")) return toggleLayoutHelp(false);
    const pick = event.target.closest("[data-layout-pick]")?.dataset.layoutPick;
    if (!pick) return;
    const input = $(`#configForm input[name=folderLayout][value="${pick}"]`);
    if (input && !input.checked) {
      input.checked = true;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
  document.addEventListener("click", (event) => {
    if (!$("#folderLayoutPop")?.hidden && !event.target.closest("#folderLayoutRow")) toggleLayoutHelp(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !$("#folderLayoutPop")?.hidden) toggleLayoutHelp(false);
  });
  $("#cloudDestGrid")?.addEventListener("change", (event) => {
    const key = event.target.dataset?.cloudToggle;
    if (!key) return;
    state.cloudDraft = state.cloudDraft || {};
    state.cloudDraft[key] = { ...(state.cloudDraft[key] || { path: "" }), on: event.target.checked };
    refresh();
  });
  // 프로그램이 없거나 다른 곳에 깔린 클라우드는 동기화 폴더를 직접 고른다
  $("#cloudDestGrid")?.addEventListener("click", async (event) => {
    const key = event.target.closest("[data-cloud-pick]")?.dataset.cloudPick;
    if (!key) return;
    try {
      const data = await api("/api/pick-folder", { method: "POST", body: "{}" });
      if (!data.path) {
        showToast(data.message || "폴더 고르기를 취소했습니다.");
        return;
      }
      state.cloudDraft = state.cloudDraft || {};
      state.cloudDraft[key] = { on: true, path: data.path };
      refresh();
      showToast("폴더를 골랐습니다. 설정 저장을 누르면 적용됩니다.");
    } catch (error) {
      showToast(error.message);
    }
  });
  $("#localSaveNowButton")?.addEventListener("click", () => {
    if (localSaveMode() !== "off" || anyCloudOn()) runLocalSaveNow();
  });
})();


/* ===== 메일 본문을 앱에 어울리게 =====
   밝은 테마에서는 메일 속 순백(#fff) 바탕을 걷어 내 읽기 화면 배경 위에 그린다.
   색을 넣은 칸(표 머리, 강조 상자)은 그대로 둔다. 어두운 테마는 종이 카드 위에 올린다. */
const MAIL_PAPER = "#f7f5ef";
const MAIL_PAPER_GRAPHITE = "#f5f5f7"; // 그래파이트 다크는 크림 대신 중립 종이
function mailPaperColor() {
  return document.documentElement.dataset.theme === "graphite-dark" ? MAIL_PAPER_GRAPHITE : MAIL_PAPER;
}

function mailOnPaper() {
  const theme = document.documentElement.dataset.theme || "";
  // 남색 테마는 밝은 테마가 되었다 (예전엔 어두운 남색 바탕)
  return theme === "dark" || theme === "graphite-dark";
}

function blendMailBackground(frame) {
  try {
    const doc = frame.contentDocument;
    const view = doc?.defaultView;
    if (!doc?.body || !view) return;
    const white = /^rgba?\(\s*255,\s*255,\s*255(?:,\s*1(?:\.0+)?)?\s*\)$/;
    const nodes = doc.body.querySelectorAll("*");
    // 소식지는 요소가 수천 개다. 너무 크면 바깥쪽 틀만 본다.
    const limit = Math.min(nodes.length, 4000);
    for (let i = 0; i < limit; i += 1) {
      const el = nodes[i];
      if (white.test(view.getComputedStyle(el).backgroundColor)) {
        el.style.setProperty("background-color", "transparent", "important");
      }
    }
    if (white.test(view.getComputedStyle(doc.body).backgroundColor)) {
      doc.body.style.setProperty("background-color", mailOnPaper() ? mailPaperColor() : "transparent", "important");
    }
  } catch (error) {
    /* 다른 출처 문서면 건드리지 않는다 */
  }
}

/* ===== 메일함 안 새로고침 =====
   위쪽 새로고침 버튼까지 가지 않아도 메일함에서 바로. 마지막으로 받아 온 때도 여기 적는다. */
function renderMailRefreshAgo() {
  const node = $("#mailRefreshAgo");
  const button = $("#mailRefreshButton");
  if (!node || !button) return;
  const stamp = state.health?.lastSuccess?.emails || state.emails?.updatedAt;
  const text = state.mailRefreshing ? "가져오는 중 · 누르면 멈춤" : stamp ? `${agoText(stamp)} 업데이트` : "아직 안 받음";
  if (node.textContent !== text) node.textContent = text;
  button.classList.toggle("spinning", Boolean(state.mailRefreshing));
  // 가져오는 동안에도 누를 수 있게 둔다: 누르면 메일 가져오기만 멈춘다(서버가 응답을 안 줄 때 빠져나갈 길)
  button.disabled = false;
  // 단추에는 글을 안 붙이므로(상단 바), 가져오는 중이면 '누르면 멈춤' 을 도움말로 알린다
  button.title = state.mailRefreshing
    ? "메일 가져오는 중 · 누르면 멈춤"
    : stamp
      ? `메일 새로고침 (마지막: ${String(stamp).replace("T", " ").slice(0, 16)})`
      : "메일 새로고침";
}

async function refreshMailNow() {
  if (state.mailRefreshing) {
    try {
      const res = await api("/api/stop", { method: "POST", body: JSON.stringify({ lane: "mail" }) });
      showToast(res.message || "메일 가져오기를 멈췄습니다.");
    } catch (error) {
      showToast(humanError(error));
    }
    return;
  }
  state.mailRefreshing = true;
  renderMailRefreshAgo();
  try {
    await startRun("/api/refresh-emails", "메일 가져오는 중");
    await waitForTask(180000, "mail");
  } finally {
    state.mailRefreshing = false;
    await refreshAll();
    renderMailRefreshAgo();
  }
}

$("#mailRefreshButton")?.addEventListener("click", refreshMailNow);
// '3분 전' 이 '4분 전' 으로 넘어가게 가끔 다시 적는다 (값이 같으면 DOM 은 안 건드림)
window.setInterval(renderMailRefreshAgo, 20000);

/* ===== 업데이트 소식 =====
   새 버전이면 왼쪽 아래 '설정' 카드 위에 점 달린 알약이 뜨고, 누르면 바뀐 내용을 보여 준다.
   한 번 보면 조용한 'v1.11.0 업데이트 내용' 링크로 남는다. */
async function loadWhatsNew() {
  try {
    state.whatsNew = await api("/api/whats-new");
  } catch (error) {
    return;
  }
  renderWhatsNewButton();
  if (state.whatsNew?.justUpdated) window.setTimeout(openWhatsNew, 600);
}

// 'a.b.c' 끼리 숫자로 비교. a 가 크면 양수
function compareVersions(a, b) {
  const pa = String(a || "").split(".").map((n) => parseInt(n, 10) || 0);
  const pb = String(b || "").split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  }
  return 0;
}

// 이 판의 업데이트 내용을 아직 안 봤는지. '같지 않음' 으로 보면 설치판·Store 판처럼 판이 다른 Daling 둘이
// 같은 데이터 폴더(whats_new.json)를 쓸 때 서로 '봤음' 을 덮어써 켤 때마다 다시 떴다. 더 새 판을 봤으면 본 것으로 친다.
function whatsNewUnseen(info) {
  return !info?.seen || compareVersions(info.seen, info.version) < 0;
}

function renderWhatsNewButton() {
  const button = $("#whatsNewButton");
  const info = state.whatsNew;
  if (!button || !info?.entries?.length) return;
  // 새 버전일 때만 보인다. 한 번 열어 보면 사라진다
  // (지난 내용은 설정의 '업데이트 내용' 에서 본다. 남겨 두면 사이드바에 글자만 떠 있어 어색했다)
  const fresh = whatsNewUnseen(info);
  button.hidden = !fresh;
  button.classList.toggle("fresh", fresh);
  $("#whatsNewLabel").textContent = `새 업데이트 v${info.version}`;
  button.title = "눌러서 무엇이 바뀌었는지 보기";
}

function whatsNewEntryHtml(entry, latest) {
  const sections = (entry.sections || [])
    .map(
      (section) => `
        <h4>${escapeHtml(section.name || "")}</h4>
        <ul>${(section.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`,
    )
    .join("");
  const head = `
    <span class="wn-version">v${escapeHtml(entry.version || "")}</span>
    <span class="wn-date">${escapeHtml(entry.date || "")}</span>
    <strong class="wn-title">${escapeHtml(entry.title || "")}</strong>`;
  return latest
    ? `<section class="wn-entry latest"><header>${head}</header>${sections}</section>`
    : `<details class="wn-entry"><summary>${head}</summary>${sections}</details>`;
}

async function openWhatsNew() {
  const info = state.whatsNew;
  const dialog = $("#whatsNewDialog");
  if (!info || !dialog) return;
  const just = info.justUpdated;
  const done = just
    ? `<div class="wn-updated">
         <img src="/img/dalgu/yay.png" alt="" />
         <div>
           <strong>업데이트를 마쳤어요</strong>
           <span>v${escapeHtml(just.from || "")} → v${escapeHtml(just.to || info.version)} · 아래에서 바뀐 점을 볼 수 있어요</span>
         </div>
       </div>`
    : "";
  $("#whatsNewBody").innerHTML = done + info.entries.map((entry, i) => whatsNewEntryHtml(entry, i === 0)).join("");
  installIcons(dialog);
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
  if (whatsNewUnseen(info) || info.justUpdated) {
    info.seen = info.version;
    info.justUpdated = null;
    renderWhatsNewButton();
    api("/api/whats-new/seen", { method: "POST", body: JSON.stringify({ version: info.version }) }).catch(() => {});
  }
}

$("#whatsNewButton")?.addEventListener("click", openWhatsNew);
$("#whatsNewClose")?.addEventListener("click", () => $("#whatsNewDialog")?.close());
$("#whatsNewDialog")?.addEventListener("click", (event) => {
  // 바깥(어두운 막)을 누르면 닫는다
  if (event.target === event.currentTarget) event.currentTarget.close();
});


/* 설정 > 앱 > '업데이트 내용' 버튼. 사이드바의 업데이트 소식 창을 그대로 연다. */
$("#settingsWhatsNewButton")?.addEventListener("click", () => {
  if (typeof openWhatsNew === "function") openWhatsNew();
});

/* 설정의 '?' 설명: 마우스를 올리면 보이고, 누르면 켜진 채로 남는다(터치·트랙패드용).
   다른 곳을 누르거나 Esc 를 누르면 닫는다. */
document.addEventListener("click", (event) => {
  const hint = event.target.closest(".hint");
  document.querySelectorAll(".hint.show").forEach((h) => {
    if (h !== hint) h.classList.remove("show");
  });
  if (hint) {
    event.preventDefault();
    placeHint(hint);
    hint.classList.toggle("show");
  }
});

/* 말풍선은 '?' 왼쪽에서 오른쪽으로 280px 까지 펼쳐진다. 오른쪽 칸의 '?'(하루 한 번 꼼꼼히,
   연결된 계정 등)에서는 1280 창에서도 1383px 까지 나가 설정 화면 끝에서 잘렸고, 375 폭에서는
   한 칸짜리 줄에서도 넘쳤다. 보이기 직전에 잘리는 상자(가까운 스크롤 상자) 안으로 당겨 넣는다. */
function placeHint(hint) {
  let left = 0;
  let right = document.documentElement.clientWidth;
  for (let p = hint.parentElement; p && p !== document.body; p = p.parentElement) {
    if (getComputedStyle(p).overflowX === "visible") continue;
    const r = p.getBoundingClientRect();
    left = r.left + p.clientLeft;
    right = left + p.clientWidth;
    break;
  }
  const gap = 8;
  const tip = getComputedStyle(hint, "::after");
  // width·max-width 는 글자 폭이라 좌우 여백(11px 씩)을 따로 더한다 (빼먹으면 22px 넘쳤다)
  const pad = parseFloat(tip.paddingLeft) + parseFloat(tip.paddingRight) || 0;
  const maxW = Math.max(120, Math.min(280, right - left - gap * 2 - pad));
  hint.style.setProperty("--hint-w", `${maxW}px`);
  // 이미 보이는 중이면(마우스·초점) 실제 폭을, 아니면 가장 넓은 폭을 기준으로 잡는다
  const w = (parseFloat(tip.width) || maxW) + pad;
  const origin = hint.getBoundingClientRect().left + hint.clientLeft;
  const x = Math.max(left + gap, Math.min(origin - 10, right - gap - w));
  hint.style.setProperty("--hint-x", `${Math.round(x - origin)}px`);
}
["mouseover", "focusin"].forEach((type) =>
  document.addEventListener(type, (event) => {
    const hint = event.target.closest?.(".hint");
    if (hint) placeHint(hint);
  }),
);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") document.querySelectorAll(".hint.show").forEach((h) => h.classList.remove("show"));
});


/* ===== 메일 본문 링크 =====
   본문은 스크립트를 막은 iframe 안에 있다. 그 안에서 링크를 누르면 새 창을 열려고 하는데
   iframe 보안 설정이 새 창을 막아서, 눌러도 아무 일이 없었다(주간소식의 [학생]·[교직원] 링크).
   메일 앱들이 하는 대로 바깥 브라우저로 넘긴다. 메일 주소(mailto:)는 앱의 메일 쓰기로 연다. */
function bindMailLinks(frame) {
  try {
    const doc = frame.contentDocument;
    if (!doc || doc.dataset?.linksBound === "1") return;
    if (doc.documentElement) doc.documentElement.dataset.linksBound = "1";
    doc.addEventListener("click", async (event) => {
      const link = event.target?.closest?.("a[href]");
      if (!link) return;
      const href = (link.getAttribute("href") || "").trim();
      if (!href || href.startsWith("#")) return;
      event.preventDefault();

      if (/^mailto:/i.test(href)) {
        const [address, query = ""] = href.slice(7).split("?");
        const params = new URLSearchParams(query);
        openCompose({
          to: decodeURIComponent(address || ""),
          subject: params.get("subject") || "",
          body: params.get("body") || "",
          title: "새 메일",
        });
        return;
      }
      if (!/^https?:/i.test(href)) {
        showToast("이 링크는 열 수 없어요.");
        return;
      }
      try {
        const res = await api("/api/mail/open-link", { method: "POST", body: JSON.stringify({ url: href }) });
        showToast(res.opened ? `브라우저에서 열었어요 · ${res.host}` : "링크를 열지 못했어요.");
      } catch (error) {
        showToast(humanError(error));
      }
    });
  } catch (error) {
    /* 다른 출처 문서면 건드리지 않는다 */
  }
}


/* ===== 목록은 드래그로 고친다 =====
   버튼이나 입력창을 거치지 않고, 손으로 옮기는 것이 기본 방식이다.
     - 메일: 목록에서 왼쪽 폴더로 끌어다 놓으면 옮기기·별표·휴지통
     - 시간표: 수업 덩어리를 끌어 요일과 시간을 옮긴다
   (버튼과 메뉴도 그대로 둔다. 키보드만 쓰는 경우와 좁은 화면을 위해서다) */

function mailById(id) {
  return (state.emails?.emails || []).find((m) => m.id === id) || null;
}

function clearMailDropMarks() {
  document.querySelectorAll(".mail-folder.drop-over").forEach((el) => el.classList.remove("drop-over"));
}

async function dropMailsOnFolder(ids, key) {
  const mails = ids.map(mailById).filter(Boolean);
  if (!mails.length) return;
  const label = MAIL_FOLDERS.find((f) => f.key === key)?.label || key;

  if (key === "starred") {
    for (const mail of mails) {
      if (mail.starred) continue;
      mail.starred = true;
      try {
        await api("/api/mail/star", {
          method: "POST",
          body: JSON.stringify({ uid: mail.uid, folder: mail.folder, starred: true }),
        });
      } catch (error) {
        mail.starred = false;
      }
    }
    renderEmails();
    showToast(`${mails.length}통에 별표를 붙였습니다.`);
    return;
  }

  if (key === "trash") {
    const fromTrash = mails.filter((m) => m.folder === "trash");
    if (fromTrash.length) return showToast("이미 휴지통에 있습니다.");
    const before = state.emails.emails;
    state.emails.emails = before.filter((m) => !ids.includes(m.id));
    renderEmails();
    let done = 0;
    for (const mail of mails) {
      try {
        const res = await api("/api/delete-email", {
          method: "POST",
          body: JSON.stringify({ uid: mail.uid, folder: mail.folder, permanent: false }),
        });
        if (res.ok) done += 1;
      } catch (error) {
        /* 아래에서 개수로 알린다 */
      }
    }
    showToast(done ? `${done}통을 휴지통으로 옮겼습니다.` : "옮기지 못했습니다.");
    await refreshAll();
    return;
  }

  if (key === "inbox" && mails.every((m) => m.folder === "trash")) {
    // 휴지통에서 받은 편지함으로 = 되돌리기
    for (const mail of mails) await restoreEmail(mail);
    await refreshAll();
    return;
  }

  const folders = await loadMailFolderChoices();
  const target = folders.find((f) => f.key === key);
  if (!target) return showToast(`'${label}' 폴더를 찾지 못했습니다.`);
  let done = 0;
  for (const mail of mails) {
    if (mail.folder === key) continue;
    try {
      await api("/api/mail/move", {
        method: "POST",
        body: JSON.stringify({ uid: mail.uid, folder: mail.folder, target: target.raw }),
      });
      done += 1;
    } catch (error) {
      /* 아래에서 개수로 알린다 */
    }
  }
  showToast(done ? `${done}통을 '${label}'(으)로 옮겼습니다.` : "옮기지 못했습니다.");
  await refreshAll();
}

function bindMailDrag() {
  const grid = $("#newsGrid");
  const rail = $("#mailFolders");
  if (!grid || !rail) return;

  grid.addEventListener("dragstart", (event) => {
    const row = event.target.closest("[data-mail-id]");
    if (!row) return;
    const id = row.dataset.mailId;
    // 고른 메일 위에서 끌면 고른 것 전부, 아니면 그 한 통만
    const picked = state.mailSelected || new Set();
    const ids = picked.has(id) ? [...picked] : [id];
    state.mailDragIds = ids;
    event.dataTransfer.setData("text/x-mail-ids", ids.join(","));
    event.dataTransfer.effectAllowed = "move";
    document.body.classList.add("mail-dragging");
    row.classList.add("dragging");
  });

  grid.addEventListener("dragend", (event) => {
    event.target.closest?.("[data-mail-id]")?.classList.remove("dragging");
    document.body.classList.remove("mail-dragging");
    state.mailDragIds = null;
    clearMailDropMarks();
  });

  rail.addEventListener("dragover", (event) => {
    const folder = event.target.closest(".mail-folder[data-drop]");
    if (!folder || !state.mailDragIds?.length) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = folder.dataset.folder === "starred" ? "link" : "move";
    clearMailDropMarks();
    folder.classList.add("drop-over");
  });

  rail.addEventListener("dragleave", (event) => {
    event.target.closest(".mail-folder")?.classList.remove("drop-over");
  });

  rail.addEventListener("drop", async (event) => {
    const folder = event.target.closest(".mail-folder[data-drop]");
    if (!folder) return;
    event.preventDefault();
    const ids = (event.dataTransfer.getData("text/x-mail-ids") || "").split(",").filter(Boolean);
    clearMailDropMarks();
    document.body.classList.remove("mail-dragging");
    state.mailDragIds = null;
    if (ids.length) await dropMailsOnFolder(ids, folder.dataset.folder);
  });
}

bindMailDrag();

/* 좁은 메일함에서 폴더 칸은 한 줄 띠(styles.css '좁은 메일함')라 옆으로 넘겨 본다.
   마우스 휠은 위아래로만 굴러서, 띠가 실제로 옆으로 넘칠 때만 휠을 옆 스크롤로 바꿔 준다. */
function bindMailStripWheel() {
  const rail = document.querySelector(".mail-rail");
  if (!rail) return;
  rail.addEventListener(
    "wheel",
    (event) => {
      const strip = getComputedStyle(rail).flexDirection === "row" && rail.scrollWidth > rail.clientWidth + 2;
      if (!strip || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      event.preventDefault();
      rail.scrollLeft += event.deltaY;
    },
    { passive: false },
  );
}
bindMailStripWheel();


/* ===== 첫 실행 소개 (달구 튜토리얼) =====
   처음 켠 사람에게 달구가 메뉴를 하나씩 비춰 주며 무엇을 하는지 알려 준다.
   '건너뛰기' 로 언제든 끝낼 수 있고, 설정의 '앱 소개 다시 보기' 로 다시 볼 수 있다.
   본 기록은 데이터 폴더(tutorial.json)에 적는다 — 앱 창은 브라우저 저장소가 매번 지워진다.

   단계마다: 묶음 이름(chapter), 보여 줄 화면(view), 비출 곳(targets), 달구 포즈(pose), 제목, 설명,
   짧은 기능 목록(tips, 시작 화면은 chips 로 알약 모양), 아래 작은 글(note).
   비출 곳을 못 찾으면 fallback(보통 그 메뉴)을, 그것도 없으면(좁은 화면) 가운데에 카드만 띄운다.
   when 이 있으면 시작할 때 물어서 거짓이면 그 단계를 뺀다(예: 학사일정이 없어 D-day 띠가 숨은 경우).
   처음 12단계는 메뉴 이름만 짚고 지나가서, 메뉴 안의 기능(시간표·공지·보기 방식·저장 위치…)을 몰랐다는
   말을 듣고 화면 안 요소까지 비추도록 늘렸다(2026-10-02).
   그랬더니 27단계로 너무 길었다(2026-10-21 사용자). 이제 처음 켤 때는 핵심(area 없음 = core)만 보여 주고,
   나머지는 area 의 화면에 처음 들어갔을 때 그 화면 것만 짧게 보여 준다(maybeViewIntro). 본 화면은 tutorial.json views. */
const TOUR_STEPS = [
  {
    chapter: "시작",
    pose: "yay",
    title: "안녕! 나는 달구야",
    text: "Daling은 학교생활에 흩어진 것들을 알아서 모아 한 화면에 보여 줘. 꼭 알아야 할 것만 짧게 보여 줄게.",
    tips: ["LMS 강의자료", "과제 마감", "학교 메일", "학사일정", "과목 공지", "셔틀버스"],
    chips: true,
    note: "Space 로 넘기고, Esc 로 언제든 그만둘 수 있어.",
  },
  {
    chapter: "시작",
    view: "settings",
    when: () => !DEMO_ON,
    targets: ["#stAccounts .st-head"],
    fallback: ['.nav-item[data-view="settings"]'],
    pose: "point",
    title: "먼저 계정부터 넣어 줘",
    text: "여기에 넣은 계정으로 내가 대신 가져다줄게. 비밀번호는 암호화해서 네 컴퓨터에만 두고, 어디로도 안 보내.",
    tips: [
      "LMS 계정 → 강의자료·과제 마감·과목 공지",
      "학교 메일 → 메일함, 메일로 온 행사 일정",
      "Google 연결(선택) → Drive·구글 캘린더로 보내기",
      "계정이 없으면 맨 아래 '체험 모드'로 둘러보기",
    ],
  },
  {
    chapter: "매일 보는 곳",
    view: "dashboard",
    targets: ['.nav-item[data-view="dashboard"]'],
    pose: "skip",
    title: "대시보드",
    text: "아침에 여기만 보면 오늘 하루가 정리돼.",
    tips: [
      "오늘 남은 수업 · 7일 안 마감 · 안 읽은 메일",
      "다가오는 마감과 일정, 학교 공지",
      "'화면 편집'으로 블록을 끌어 순서 바꾸기",
    ],
  },
  {
    chapter: "매일 보는 곳",
    view: "dashboard",
    when: () => !$("#ddayBanner")?.hidden,
    targets: ["#ddayBanner"],
    pose: "cheer",
    area: "dashboard",
    title: "시험·수강신청 D-day",
    text: "학사일정에서 놓치면 큰 일정(시험, 수강신청, 성적 확인)을 골라 며칠 남았는지 세어 줘. 그다음 일정 두 개도 아래에 적어 둬.",
  },
  {
    chapter: "매일 보는 곳",
    view: "dashboard",
    targets: [".timetable-panel .panel-header"],
    fallback: ['.nav-item[data-view="dashboard"]'],
    pose: "study",
    area: "dashboard",
    title: "주간 시간표",
    text: "시간표를 한 번 넣어 두면 대시보드·시계·알림이 모두 이걸 기준으로 움직여.",
    tips: [
      "'시간표 편집'에서 개설과목을 찾아 넣기",
      "수업을 누르면 시간·장소를 고칠 수 있어",
      "과목마다 다른 색으로 칠해 줘",
    ],
  },
  {
    chapter: "매일 보는 곳",
    view: "dashboard",
    targets: ["#nowBar"],
    pose: "wink",
    area: "dashboard",
    title: "지금 무슨 수업이지?",
    text: "왼쪽 위 시계는 시간표를 보고 지금 수업과 남은 시간, 다음 수업을 알려 줘. 누르면 자세히 펼쳐져.",
  },
  {
    chapter: "매일 보는 곳",
    view: "dashboard",
    targets: ["#statusCard"],
    pose: "thumbs",
    area: "dashboard",
    title: "잘 돌아가는지는 여기서",
    text: "LMS·메일·Drive 연결 불빛과 다음에 가져올 때를 보여 줘. 문제가 생기면 빨간불이 켜지고, 누르면 고칠 곳으로 데려가.",
  },
  {
    chapter: "공부",
    view: "deadlines",
    targets: ['.nav-item[data-view="deadlines"]'],
    pose: "search",
    area: "deadlines",
    title: "과제 마감",
    text: "LMS에 올라온 과제를 마감 순서대로 모아 둬.",
    tips: [
      "아직 안 낸 과제는 눌러서 바로 제출 페이지로",
      "마감 하루·3시간·1시간 전에 알림",
      "과목·제출 상태로 거르고, 끝난 건 숨기기",
      "캘린더 파일(.ics)로 내보내기",
    ],
  },
  {
    chapter: "공부",
    view: "calendar",
    targets: ['.nav-item[data-view="calendar"]'],
    pose: "read",
    area: "calendar",
    title: "캘린더",
    text: "흩어진 날짜를 달력 하나에 모았어. 색만 봐도 무슨 일정인지 알 수 있어.",
    tips: [
      "과제 마감 · 학사일정 · 공휴일 · 내 일정",
      "달빛제 같은 학교 공식 행사는 노란색으로",
      "메일로 온 세미나도 날짜를 찾아 표시 (같은 행사 재공지는 하나로)",
      "날짜를 누르고 '이 날에 추가'로 내 일정 넣기",
    ],
  },
  {
    chapter: "공부",
    view: "courses",
    targets: ['.nav-item[data-view="courses"]'],
    pose: "book",
    area: "courses",
    title: "강의",
    text: "이번 학기 과목을 카드로 정리해 뒀어.",
    tips: [
      "과목마다 학점과 강의계획서 바로가기",
      "교수·조교를 분반까지 표시 (이번 학기 기준)",
      "이름을 누르면 '[과목 02분반]' 제목으로 바로 메일 쓰기",
      "'편집'으로 안 보는 과목 숨기기",
    ],
  },
  {
    chapter: "공부",
    view: "courses",
    targets: ['.course-tab[data-ctab="ann"]'],
    fallback: ['.nav-item[data-view="courses"]'],
    pose: "reach",
    area: "courses",
    title: "과목 공지사항",
    text: "과목마다 흩어진 LMS 공지를 게시판처럼 모아 봐. 최근 7일 공지는 맨 위에 따로 모이고, 새 공지가 올라오면 알려 줘.",
    tips: [
      "공지를 열고 옆으로 끌거나 ← → 로 다음 공지",
      "취소선·목록 같은 서식도 LMS 그대로",
    ],
  },
  {
    chapter: "공부",
    view: "files",
    targets: ['.nav-item[data-view="files"]'],
    pose: "munch",
    area: "files",
    title: "자료",
    text: "LMS 강의자료를 받아 두고, 새 자료가 올라오면 알려 줘. 여러 개를 골라 한 번에 보낼 수 있어.",
    tips: [
      "내 컴퓨터 문서 폴더에 저장",
      "Google Drive 과목 폴더에 올리기",
      // 삼성 노트는 이 운영체제에만 있다 — 맥·리눅스 소개에서는 뺀다
      ...(IS_MAC || /Linux/.test(navigator.platform || "") ? [] : ["삼성 노트로 바로 넣기 (필기용)"]),
    ],
  },
  {
    chapter: "공부",
    view: "files",
    targets: [".file-mode-tabs"],
    fallback: ['.nav-item[data-view="files"]'],
    pose: "offer",
    area: "files",
    title: "보는 방법은 세 가지",
    text: "자료가 많아도 원하는 방식으로 찾을 수 있어.",
    tips: [
      "과목 폴더: LMS와 똑같이 1주차 › 파일",
      "내 폴더: 시험 범위처럼 직접 만든 폴더에 끌어 담기",
      "전체 목록: Shift·Ctrl 로 여러 개 고르기",
    ],
  },
  {
    chapter: "메일",
    view: "emails",
    targets: ['.nav-item[data-view="emails"]'],
    pose: "stretch",
    area: "emails",
    title: "메일함",
    text: "학교 메일을 앱 안에서 바로 읽고 정리해.",
    tips: [
      "오늘·어제로 묶어 보고, 안읽음·중요·첨부로 거르기",
      "메일을 왼쪽 폴더로 끌어 옮기거나 휴지통으로",
      "⋮ 메뉴: 일정에 추가, 다시 알림, 인쇄",
      "답이 없는 보낸 메일은 ⋮ › 리마인드 메일 쓰기",
    ],
  },
  {
    chapter: "메일",
    view: "emails",
    targets: ["#emailSearchInput"],
    fallback: ['.nav-item[data-view="emails"]'],
    pose: "search",
    area: "emails",
    title: "과목으로 메일 찾기",
    text: "검색칸에 과목 이름만 쳐도 그 과목 메일이 다 나와. 받은 편지함·보낸 편지함·LMS 탭을 한 번에 찾아.",
    tips: [
      "'일반화학2'·'일반화학Ⅱ'·'General Chemistry' 다 같은 과목",
      "그 과목 교수·조교와 주고받은 메일까지",
    ],
  },
  {
    chapter: "메일",
    view: "emails",
    when: () => Object.keys(state.coursePeople || {}).length > 0,
    targets: ["#newsGrid .person-course"],
    fallback: ["#emailSearchInput"],
    pose: "point",
    area: "emails",
    title: "누가 보낸 메일이야?",
    text: "보낸 사람이 이번 학기에 무슨 과목 몇 분반을 맡았는지 이름 옆에 붙여 줘. 내 수업이면 주황색이야.",
    tips: [
      "교수는 학교 개설강좌 전체에서, 조교는 내 과목에서 찾아",
      "마우스를 올리면 맡은 과목·분반이 다 보여",
    ],
  },
  {
    chapter: "메일",
    view: "emails",
    targets: ["#composeButton"],
    fallback: ['.nav-item[data-view="emails"]'],
    pose: "give",
    area: "emails",
    title: "메일 쓰기",
    text: "웹메일을 따로 열 필요 없이 여기서 보내.",
    tips: [
      "'물리 조교'처럼 쳐도 그 과목 교수·조교 주소를 찾아 줘",
      "교수님 메일의 인사·자기소개·서명이 회색으로 떠. Tab 만 누르면 써져",
      "내 PC나 Drive 파일을 첨부",
      "쓰다 멈추면 알아서 임시저장",
    ],
  },
  {
    chapter: "편하게 쓰기",
    view: "storage",
    targets: ['.nav-item[data-view="storage"]'],
    pose: "back",
    area: "storage",
    title: "창고",
    text: "가끔 꼭 필요한 것들을 넣어 뒀어.",
    tips: [
      "셔틀버스 시간표 (출퇴근·원내외 순환·주말)",
      "FGLP 파견 대학 세계지도와 학교별 정보",
    ],
  },
  {
    chapter: "편하게 쓰기",
    view: "dashboard",
    targets: [".nav-arrows", ".search-wrap"],
    pose: "reachup",
    title: "뭐든 여기서 찾아",
    text: "과목·자료·과제·메일·일정·설정을 한 번에 찾고, 고르면 그곳으로 데려다줘.",
    tips: [
      "Ctrl+K 로 바로 검색, 초성(ㅇㅂㅁㄹ)으로도 돼",
      "← → 단추나 Alt+←/→ 로 보던 화면을 오가기",
    ],
  },
  {
    chapter: "편하게 쓰기",
    view: "dashboard",
    targets: ["#lastSync", "#refreshAllButton"],
    pose: "nap",
    title: "나머지는 내가 알아서",
    text: "앱을 켜 두기만 하면 알아서 가져와. 언제 가져왔는지는 여기 적혀 있고, 지금 바로 받고 싶으면 새로고침을 눌러.",
    tips: ["메일 5분 · 과제 마감 1시간 · 강의자료 3시간마다"],
  },
  {
    chapter: "설정",
    view: "settings",
    targets: ["#stStorage .st-head"],
    fallback: ['.nav-item[data-view="settings"]'],
    pose: "sprout",
    area: "settings",
    title: "자료를 어디에 둘까",
    text: "켜 두면 새 강의자료가 올라올 때마다 원하는 곳에 저절로 들어가.",
    tips: [
      "Google Drive에 과목 폴더째 올리기",
      "내 컴퓨터 문서 폴더에 저장",
      "OneDrive·Dropbox·iCloud·네이버 MYBOX 폴더에도",
      "자료가 차지하는 공간을 보고 학기별로 정리",
    ],
  },
  {
    chapter: "설정",
    view: "settings",
    targets: ["#stAuto .st-head"],
    fallback: ['.nav-item[data-view="settings"]'],
    pose: "lounge",
    area: "settings",
    title: "얼마나 자주 가져올까",
    text: "메일·마감·자료를 가져오는 주기와 하루 한 번 전체 확인 시각을 정해. 마감 알림과 새 자료 알림도 여기서 켜고 꺼.",
  },
  {
    chapter: "설정",
    view: "settings",
    targets: ["#langRow"],
    fallback: ['.nav-item[data-view="settings"]'],
    pose: "hello",
    area: "settings",
    title: "English도 돼",
    text: "화면을 영어로 바꿀 수 있어. 유학생 친구에게도 알려 줘. 메일·과목 이름 같은 자료는 원래 글자 그대로 둬.",
  },
  {
    chapter: "설정",
    view: "settings",
    targets: ["#feedbackButton", "#whatsNewButton"],
    pose: "bow",
    area: "settings",
    title: "궁금하거나 고장 나면",
    text: "'Feedback'을 누르면 받는 사람과 서식이 채워진 메일이 열려. 새 버전이 나오면 이 근처에 '새 업데이트'가 떠.",
  },
  {
    chapter: "끝",
    pose: "laugh",
    title: "준비 끝!",
    text: "다른 메뉴는 처음 들어갈 때 내가 짧게 알려 줄게. 처음부터 다시 보려면 설정 맨 아래 '앱 소개 다시 보기'.",
    last: true,
  },
];

const tour = {
  index: 0, active: false, returnView: null, buddy: null, walkTimer: 0, steps: [],
  mode: "core", // "core" = 처음 켤 때, 그 밖에는 화면 이름 (그 화면에 처음 들어갔을 때 소개)
  seen: null, // 소개를 본 화면들 (서버 tutorial.json views, "*" = 전부)
  quietUntil: 0, // 처음 소개를 막 끝내고 돌아간 화면에서 곧바로 또 소개가 뜨지 않게
};

function tourStepsFor(area) {
  return TOUR_STEPS.filter((s) => (s.area || "core") === area).filter((s) => {
    try {
      return !s.when || s.when();
    } catch (error) {
      return false;
    }
  });
}

async function maybeStartTour() {
  let res;
  try {
    res = await api("/api/tutorial");
  } catch (error) {
    return; // 서버가 대답을 못 하면 소개를 억지로 띄우지 않는다
  }
  tour.seen = new Set(res.views || []);
  if (res.done) {
    // 지금 화면(보통 대시보드)의 소개가 남았으면 첫 화면이 다 그려진 뒤에
    window.setTimeout(() => maybeViewIntro(state.view), 900);
    return;
  }
  // 첫 화면이 다 그려진 다음에 띄운다
  window.setTimeout(() => startTour(), 700);
}

/** 이 화면에 처음 들어왔으면 그 화면 소개를 띄운다 (applyView 가 부른다) */
function maybeViewIntro(view) {
  if (!tour.seen || tour.active || tour.seen.has("*") || tour.seen.has(view)) return;
  if (Date.now() < tour.quietUntil || !tourStepsFor(view).length) return;
  // 화면이 바뀌고 자리가 잡힌 뒤에. 그새 다른 화면으로 갔거나 창(대화 상자)이 열려 있으면 다음 기회에
  window.setTimeout(() => {
    if (state.view !== view || tour.active || tour.seen.has(view) || document.querySelector("dialog[open]")) return;
    startTour(view);
  }, 450);
}

function markViewSeen(view) {
  if (!tour.seen) tour.seen = new Set();
  tour.seen.add(view);
  api("/api/tutorial/view", { method: "POST", body: JSON.stringify({ view }) }).catch(() => {});
}

function startTour(area = "core") {
  const root = $("#tour");
  if (!root || tour.active) return;
  const steps = tourStepsFor(area);
  if (!steps.length) return;
  // 그림을 미리 받아 둬서 단계를 넘길 때 달구가 깜빡이지 않게
  [...steps.map((s) => s.pose), ...Object.keys(BUDDY_MOVES)].forEach((pose) => {
    const img = new Image();
    img.src = `/img/dalgu/${pose}.png`;
  });
  tour.buddy = null; // 첫 단계에서는 화면 왼쪽 밖에서 뛰어 들어온다
  tour.mode = area;
  tour.steps = steps;
  // 점은 묶음(chapter)마다 띄어 놓고, 누르면 그 단계로 간다. 한 단계짜리 화면 소개는 점이 필요 없다
  $("#tourDots").innerHTML =
    steps.length < 2
      ? ""
      : steps
          .map((s, i) => {
            const gap = i > 0 && s.chapter !== steps[i - 1].chapter ? " gap" : "";
            return `<span class="tour-dot${gap}" data-step="${i}" title="${escapeHtml(s.title)}"></span>`;
          })
          .join("");
  tour.active = true;
  tour.index = 0;
  tour.returnView = state.view;
  root.hidden = false;
  // 첫 자리는 미끄러져 들어오지 않고 제자리에 바로 나타나게 (단계 사이에서만 움직인다)
  root.classList.add("entering");
  window.setTimeout(() => root.classList.remove("entering"), 400);
  document.body.classList.add("tour-open");
  showTourStep(0);
  $("#tourNext").focus();
}

function finishTour(skipped) {
  const root = $("#tour");
  if (!root || !tour.active) return;
  tour.active = false;
  window.clearTimeout(tour.walkTimer);
  root.hidden = true;
  document.body.classList.remove("tour-open");
  if (tour.mode !== "core") {
    // 화면 소개: 끝까지 봤든 건너뛰었든 다시 띄우지 않는다
    markViewSeen(tour.mode);
    return;
  }
  if (!tour.seen) tour.seen = new Set();
  tour.quietUntil = Date.now() + 2000;
  api("/api/tutorial/done", {
    method: "POST",
    body: JSON.stringify({ skipped: Boolean(skipped), step: tour.index }),
  })
    .then(() => loadWhatsNew())
    .catch(() => {});
  // 마지막 단계에서 끝냈고 아직 계정이 없으면 설정으로 데려간다
  const needsAccount = !state.status?.requiredConfig?.lms;
  if (!skipped && needsAccount) switchView("settings");
  else if (tour.returnView && state.view !== tour.returnView) switchView(tour.returnView);
}

function tourTargetRect(selectors) {
  const rects = (selectors || [])
    .map((sel) => document.querySelector(sel))
    .filter((el) => el && !el.hidden && el.offsetParent !== null)
    .map((el) => el.getBoundingClientRect())
    // 좁은 창에서는 메일함 폴더 칸이 화면 왼쪽 밖으로 밀려 있다. 안 보이는 곳을 비추면 카드도 밖으로 나간다.
    .filter((r) => r.width > 0 && r.height > 0 && r.right > 0 && r.left < window.innerWidth && r.bottom > 0 && r.top < window.innerHeight);
  if (!rects.length) return null;
  const pad = 6;
  const left = Math.min(...rects.map((r) => r.left)) - pad;
  const top = Math.min(...rects.map((r) => r.top)) - pad;
  const right = Math.max(...rects.map((r) => r.right)) + pad;
  const bottom = Math.max(...rects.map((r) => r.bottom)) + pad;
  return { left, top, width: right - left, height: bottom - top, right, bottom };
}

/** 단계가 비출 곳: targets 가 안 보이면 fallback */
function tourStepRect(step) {
  if (!step) return null;
  return tourTargetRect(step.targets) || tourTargetRect(step.fallback);
}

/* 화면 아래쪽에 있는 것(시간표, 설정의 언어 줄)은 비추기 전에 보이는 곳으로 끌어온다.
   부드럽게 굴리면 재는 순간 자리가 아직 움직이는 중이라 바로 옮긴다. */
function tourBringIntoView(step) {
  const el = (step?.targets || [])
    .map((sel) => document.querySelector(sel))
    .find((node) => node && !node.hidden && node.offsetParent !== null);
  if (!el) return;
  const r = el.getBoundingClientRect();
  if (r.top < 60 || r.bottom > window.innerHeight - 40) el.scrollIntoView({ block: "center", behavior: "instant" });
}

/* 비추는 곳 둘레를 네 장(위·아래·왼쪽·오른쪽)으로 덮는다.
   처음에는 box-shadow 를 아주 크게 퍼뜨려 한 장으로 덮었는데, WebView 가 큰 그림자를
   그리지 않는 경우가 있어(실측: 같은 값이 한 번은 그려지고 한 번은 안 그려짐) 화면이 안 어두워졌다.
   평범한 반투명 사각형 네 장은 언제나 그려진다. */
function placeTourDim(rect) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const hole = rect || { left: vw / 2, top: vh / 2, right: vw / 2, bottom: vh / 2, width: 0, height: 0 };
  const boxes = {
    top: { left: 0, top: 0, width: vw, height: Math.max(0, hole.top) },
    bottom: { left: 0, top: hole.bottom, width: vw, height: Math.max(0, vh - hole.bottom) },
    left: { left: 0, top: hole.top, width: Math.max(0, hole.left), height: hole.height },
    right: { left: hole.right, top: hole.top, width: Math.max(0, vw - hole.right), height: hole.height },
  };
  document.querySelectorAll("#tour .tour-dim").forEach((el) => {
    const b = boxes[el.dataset.dim];
    el.style.left = `${b.left}px`;
    el.style.top = `${b.top}px`;
    el.style.width = `${b.width}px`;
    el.style.height = `${b.height}px`;
  });
}

/* ===== 돌아다니는 달구 =====
   예전에는 카드 모서리에 붙박이였다. 이제 단계가 바뀌면 달구가 다음 비출 곳 옆으로 걸어가거나
   (멀면) 뛰어가고, 도착하면 그 단계 포즈로 바뀐다. 자리는 비출 곳 둘레에서 화면 안이면서
   카드와 겹치지 않는 곳을 고른다. 옆모습 그림은 가는 쪽을 보도록 좌우를 뒤집는다. */
const BUDDY_MOVES = { trot: "left", dash: "right" }; // 그림이 원래 보는 쪽
const BUDDY_SIZE = 116;
const BUDDY_HERO_SIZE = 176; // 시작·끝 화면에서는 크게

function buddySpot(rect, card, B = BUDDY_SIZE) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const m = 8;
  const hit = (x, y) =>
    x < card.right + 6 && x + B > card.left - 6 && y < card.bottom + 6 && y + B > card.top - 6;
  const inside = (x, y) => x >= m && y >= m && x + B <= vw - m && y + B <= vh - m;
  let options;
  if (!rect) {
    // 시작·끝 화면: 카드 왼쪽에 크게 서서 말을 건다 (자리가 없으면 오른쪽, 그래도 없으면 카드 위)
    const midY = card.top + (card.bottom - card.top) / 2 - B / 2;
    options = [
      [card.left - B - 4, midY],
      [card.right + 4, midY],
      [card.left + (card.right - card.left) / 2 - B / 2, card.top - B + 10],
    ];
    const ok = options.find(([x, y]) => inside(x, y));
    return ok || [options[2][0], Math.max(m, options[2][1])];
  }
  const cx = rect.left + rect.width / 2 - B / 2;
  const cy = rect.top + rect.height / 2 - B / 2;
  options = [
    [rect.left, rect.bottom + m], // 아래
    [rect.right + m, cy], // 오른쪽
    [cx, rect.bottom + m], // 아래 가운데
    [rect.left - B - m, cy], // 왼쪽
    [rect.left, rect.top - B - m], // 위
    [rect.right + m, rect.bottom + m], // 오른쪽 아래
    // 비출 곳 둘레가 비좁으면(메일함의 좁은 사이드바, 위쪽 막대) 카드 옆에 선다
    [card.right + m, card.top],
    [card.left, card.bottom + m],
    [card.right - B, card.top - B - m],
    [card.left - B - m, card.top],
  ];
  const ok = options.find(([x, y]) => inside(x, y) && !hit(x, y));
  if (ok) return ok;
  const loose = options.find(([x, y]) => inside(x, y));
  return loose || [Math.min(Math.max(m, cx), vw - B - m), Math.min(Math.max(m, cy), vh - B - m)];
}

function setBuddy(pose, face, cls) {
  const box = $("#tourBuddy");
  const img = $("#tourBuddyImg");
  if (!box || !img) return;
  const src = `/img/dalgu/${pose}.png`;
  if (!img.src.endsWith(src)) img.src = src;
  box.style.setProperty("--face", String(face));
  box.classList.remove("walking", "arrived");
  void box.offsetWidth; // 도착 애니메이션을 처음부터 다시
  if (cls) box.classList.add(cls);
}

function placeBuddy(rect, card) {
  const box = $("#tourBuddy");
  if (!box) return;
  const size = rect ? BUDDY_SIZE : BUDDY_HERO_SIZE;
  box.style.setProperty("--b", `${size}px`);
  const [x, y] = buddySpot(rect, card, size);
  const pose = tour.pose || "yay";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const first = !tour.buddy;
  const from = first ? { x: -size - 20, y } : tour.buddy;
  const dx = x - from.x;
  const dist = Math.hypot(dx, y - from.y);
  const moved = first || Math.abs(from.x - x) > 3 || Math.abs(from.y - y) > 3;
  tour.buddy = { x, y };

  if (reduce || (!moved && !tour.walkTimer)) {
    box.style.setProperty("--walk", "0s");
    box.style.left = `${x}px`;
    box.style.top = `${y}px`;
    if (!box.classList.contains("arrived") || !$("#tourBuddyImg").src.endsWith(`/${pose}.png`)) setBuddy(pose, 1, "arrived");
    return;
  }
  // 걷는 중에 자리가 다시 계산되면 목적지만 바꾼다 (걸음은 그대로)
  const running = dist > 360;
  const move = running ? "dash" : "trot";
  const facesRight = BUDDY_MOVES[move] === "right";
  const face = dx === 0 ? 1 : (dx > 0) === facesRight ? 1 : -1;
  const secs = Math.min(1.1, Math.max(0.35, dist / (running ? 900 : 520)));
  if (moved) {
    if (first) {
      // 처음: 화면 왼쪽 밖에서 뛰어 들어온다
      box.style.setProperty("--walk", "0s");
      box.style.left = `${from.x}px`;
      box.style.top = `${from.y}px`;
      void box.offsetWidth;
    }
    setBuddy(move, face, "walking");
    box.style.setProperty("--walk", `${secs}s`);
    box.style.left = `${x}px`;
    box.style.top = `${y}px`;
    window.clearTimeout(tour.walkTimer);
    tour.walkTimer = window.setTimeout(() => {
      tour.walkTimer = 0;
      setBuddy(tour.pose || pose, 1, "arrived");
    }, secs * 1000);
  }
}

function placeTourCard(rect) {
  const card = $("#tourCard");
  const spot = $("#tourSpot");
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  placeTourDim(rect);
  const cw = card.offsetWidth;
  const ch = card.offsetHeight;
  const gap = 18;
  const margin = 12;

  if (!rect) {
    // 비출 곳이 없으면 화면 가운데. 구멍은 가운데 한 점으로 오므려 전체를 어둡게.
    // (0×0 으로 만들면 크롬이 그림자를 아예 안 그려서 화면이 어두워지지 않았다. 1px 로 둔다)
    Object.assign(spot.style, { left: `${vw / 2}px`, top: `${vh / 2}px`, width: "1px", height: "1px" });
    spot.classList.add("none");
    const cx = Math.max(margin, (vw - cw) / 2);
    const cy = Math.max(margin, (vh - ch) / 2);
    card.style.left = `${cx}px`;
    card.style.top = `${cy}px`;
    card.dataset.side = "center";
    placeBuddy(null, { left: cx, top: cy, right: cx + cw, bottom: cy + ch });
    return;
  }

  spot.classList.remove("none");
  Object.assign(spot.style, {
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  });

  // 오른쪽 → 아래 → 왼쪽 → 위 순서로 들어갈 자리를 찾는다
  const clampY = (y) => Math.min(Math.max(margin, y), vh - ch - margin);
  const clampX = (x) => Math.min(Math.max(margin, x), vw - cw - margin);
  const midY = rect.top + rect.height / 2 - ch / 2;
  const midX = rect.left + rect.width / 2 - cw / 2;
  const options = [
    { side: "right", ok: rect.right + gap + cw <= vw - margin, x: rect.right + gap, y: clampY(midY) },
    { side: "bottom", ok: rect.bottom + gap + ch <= vh - margin, x: clampX(midX), y: rect.bottom + gap },
    { side: "left", ok: rect.left - gap - cw >= margin, x: rect.left - gap - cw, y: clampY(midY) },
    { side: "top", ok: rect.top - gap - ch >= margin, x: clampX(midX), y: rect.top - gap - ch },
  ];
  const pick = options.find((o) => o.ok) || { side: "center", x: clampX((vw - cw) / 2), y: clampY((vh - ch) / 2) };
  card.style.left = `${pick.x}px`;
  card.style.top = `${pick.y}px`;
  card.dataset.side = pick.side;
  placeBuddy(rect, { left: pick.x, top: pick.y, right: pick.x + cw, bottom: pick.y + ch });
}

function showTourStep(index) {
  const steps = tour.steps;
  const step = steps[index];
  if (!step) return;
  tour.index = index;
  // 화면 전환 효과가 도는 동안은 그 위에 덮인 그림이 클릭을 다 받아 '다음' 이 안 눌린다. 소개 중에는 바로 끝낸다
  try {
    (document.activeViewTransition || lastViewTransition)?.skipTransition();
  } catch (error) {
    /* 오래된 WebView */
  }
  if (step.view && state.view !== step.view) applyView(step.view);

  tour.pose = step.pose;
  // 비출 곳이 없는 첫·마지막 단계는 카드를 크게 가운데에 (시작 화면)
  const card = $("#tourCard");
  card.classList.toggle("hero", !step.targets);
  $("#tourChapter").textContent = step.chapter || "";
  $("#tourCount").textContent = `${index + 1} / ${steps.length}`;
  $("#tourTitle").textContent = step.title;
  $("#tourText").textContent = keyLabel(tr(step.text));
  const tips = $("#tourTips");
  tips.hidden = !step.tips?.length;
  tips.classList.toggle("chips", Boolean(step.chips));
  tips.replaceChildren(
    ...(step.tips || []).map((tip) => {
      const li = document.createElement("li");
      li.textContent = keyLabel(tr(tip));
      return li;
    }),
  );
  $("#tourNote").hidden = !step.note;
  $("#tourNote").textContent = step.note || "";
  $("#tourPrev").hidden = index === 0;
  const core = tour.mode === "core";
  const lastOne = index === steps.length - 1;
  $("#tourDemo").hidden = !(core && index === 0 && demoInvite());
  $("#tourNext").textContent = step.last
    ? state.status?.requiredConfig?.lms ? "시작하기" : "계정 넣으러 가기"
    : core && index === 0
      ? "둘러보기"
      : lastOne
        ? "알겠어"
        : "다음";
  $("#tourSkip").hidden = Boolean(step.last) || lastOne;
  document.querySelectorAll("#tourDots .tour-dot").forEach((dot, i) => {
    dot.classList.toggle("on", i === index);
    dot.classList.toggle("past", i < index);
  });
  // 글이 바뀌면 살짝 떠오르게 (카드 자리는 transition 으로 따로 움직인다)
  const bubble = card.querySelector(".tour-bubble");
  bubble.classList.remove("swap");
  void bubble.offsetWidth;
  bubble.classList.add("swap");
  // 화면을 바꾼 뒤 자리가 잡히고 나서 비출 곳을 잰다
  window.requestAnimationFrame(() => {
    tourBringIntoView(step);
    placeTourCard(tourStepRect(step));
  });
  window.setTimeout(() => {
    if (tour.steps[tour.index] !== step) return;
    tourBringIntoView(step);
    placeTourCard(tourStepRect(step));
  }, 260);
}

function stepTour(delta) {
  const next = tour.index + delta;
  if (next < 0) return;
  if (next >= tour.steps.length) {
    finishTour(false);
    return;
  }
  showTourStep(next);
}

$("#tourNext")?.addEventListener("click", () => stepTour(1));
$("#tourPrev")?.addEventListener("click", () => stepTour(-1));
$("#tourSkip")?.addEventListener("click", () => finishTour(true));
$("#replayTourButton")?.addEventListener("click", () => {
  // 화면마다의 소개도 다시 뜨게 한다
  tour.seen = new Set();
  api("/api/tutorial/view", { method: "POST", body: JSON.stringify({ reset: true }) }).catch(() => {});
  startTour("core");
});
$("#tourDots")?.addEventListener("click", (event) => {
  const dot = event.target.closest(".tour-dot");
  if (dot && tour.active) showTourStep(Number(dot.dataset.step));
});
document.addEventListener("keydown", (event) => {
  if (!tour.active) return;
  if (event.key === "Escape") {
    event.preventDefault();
    finishTour(true);
  } else if (event.key === "ArrowRight" || event.key === "Enter" || event.key === " " || event.code === "Space") {
    // Space: 포커스가 어디 있든 다음으로. 단추 위의 Space 는 손을 뗄 때 한 번 더 눌려(click) 두 칸 갔다 → keyup 도 막는다
    event.preventDefault();
    if (!event.repeat) stepTour(1);
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    stepTour(-1);
  }
});
document.addEventListener(
  "keyup",
  (event) => {
    if (tour.active && (event.key === " " || event.code === "Space")) event.preventDefault();
  },
  true,
);
window.addEventListener("resize", () => {
  if (tour.active) placeTourCard(tourStepRect(tour.steps[tour.index]));
});

/* ===== 통합 검색 (상단 검색창) =====
   예전 검색창은 '지금 보고 있는 화면의 목록'만 걸렀다. 대시보드에서 치면 아무 일도 안 일어나는 것처럼
   보였고, 글자 하나마다 화면 전체를 다시 그려 느렸다. 이제는 치는 동안 아래에 결과 창을 띄워
   과목·자료·과제·메일·일정·공지·설정을 한꺼번에 찾고, 고르면 바로 그곳으로 간다.
   ↑↓ 로 고르고 Enter, Esc 로 닫는다. 초성(ㅇㅂㅁㄹ)으로도 찾는다. */
const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
function searchKey(text) {
  return String(text || "").toLowerCase().replace(/\s+/g, "");
}
function choseong(text) {
  let out = "";
  for (const ch of String(text || "")) {
    const code = ch.charCodeAt(0) - 0xac00;
    out += code >= 0 && code < 11172 ? CHO[Math.floor(code / 588)] : /\s/.test(ch) ? "" : ch.toLowerCase();
  }
  return out;
}
/** 점수: 앞부분 일치 > 낱말 앞 일치 > 포함 > 초성 일치. 안 맞으면 0 */
function matchScore(query, ...fields) {
  const q = searchKey(query);
  if (!q) return 0;
  const onlyCho = /^[ㄱ-ㅎ]+$/.test(q);
  let best = 0;
  fields.forEach((field, i) => {
    if (!field) return;
    const weight = i === 0 ? 1 : 0.6; // 첫 칸(제목)이 맞을수록 위로
    const raw = String(field).toLowerCase();
    const key = searchKey(field);
    let s = 0;
    if (onlyCho) {
      // 초성은 앞에서부터 맞는 것을 훨씬 위로 ('ㄱㅎㅈ' → 김호정 > 의생명공학전공)
      const cho = choseong(field);
      if (cho.startsWith(q)) s = 70;
      else if (cho.includes(q)) s = 30;
    } else if (key.startsWith(q)) s = 100;
    else if (raw.split(/[\s_\-·:()[\]\/]+/).some((w) => w.startsWith(q))) s = 80;
    else if (key.includes(q)) s = 60;
    best = Math.max(best, s * weight);
  });
  return best;
}

// 맞은 것에만 가산점 (0 에 더하면 안 맞는 것까지 결과에 섞인다)
const bumpScore = (score, extra) => (score ? score + extra : 0);

const SEARCH_GROUPS = [
  ["go", "바로 가기"],
  ["course", "과목"],
  ["file", "자료"],
  ["deadline", "과제"],
  ["mail", "메일"],
  ["event", "일정"],
  ["notice", "공지"],
  ["setting", "설정"],
];
const SEARCH_ICON = {
  ai: "sparkle", go: "layout", course: "book", file: "file", deadline: "clock", mail: "mail",
  event: "calendar", notice: "alert", setting: "settings",
};
const SEARCH_VIEWS = [
  ["dashboard", "대시보드", "홈 첫화면 시간표 셔틀 버스"],
  ["deadlines", "과제 마감", "숙제 과제 제출"],
  ["calendar", "캘린더", "달력 일정 학사일정"],
  ["courses", "강의", "개설강좌 수업 강좌"],
  ["files", "자료", "강의자료 파일 다운로드"],
  ["emails", "메일함", "이메일 편지"],
  ["storage", "창고", "fglp 파견 지도"],
  ["settings", "설정", "환경설정 옵션"],
];

function searchSettings() {
  // 설정 화면의 제목·라벨을 그대로 찾을거리로 쓴다 (새 설정이 생겨도 따로 적을 필요 없게)
  if (searchSettings.cache) return searchSettings.cache;
  const out = [];
  const seen = new Set();
  document.querySelectorAll("#view-settings h2, #view-settings h3, #view-settings label").forEach((el) => {
    // 라벨 안의 입력칸·도움말 글자는 빼고 앞 글자만 이름으로 쓴다
    const clone = el.cloneNode(true);
    clone.querySelectorAll("input, select, textarea, option, small, .hint, .help, button").forEach((x) => x.remove());
    const text = clone.textContent.replace(/\s+/g, " ").trim();
    const title = text.split(/ — | - |\?/)[0].trim().slice(0, 40);
    if (!title || title.length < 2 || seen.has(title)) return;
    seen.add(title);
    out.push({ title, el });
  });
  searchSettings.cache = out;
  return out;
}

function dueText(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const days = Math.ceil((d - Date.now()) / 86400000);
  const when = `${d.getMonth() + 1}/${d.getDate()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  if (days < 0) return `${when} · 지남`;
  return `${when} · ${days === 0 ? "오늘" : `D-${days}`}`;
}

function buildSearchResults(query, opts = {}) {
  const res = [];
  // opts.all: 점수와 상관없이 모든 후보를 모은다 (AI 검색에 넘길 목록)
  const add = (group, score, item) => (opts.all ? res.push({ group, score: 1, ...item }) : score > 0 && res.push({ group, score, ...item }));

  SEARCH_VIEWS.forEach(([view, label, words]) => {
    const s = matchScore(query, label, words);
    add("go", s && s + 5, { title: label, sub: "화면으로 가기", run: () => switchView(view) });
  });
  [
    ["지금 새로고침", "새로고침 동기화 가져오기", () => $("#refreshAllButton")?.click()],
    ["테마 바꾸기", "테마 다크 화이트 남색 색", () => $("#themeFlip")?.click()],
    // 작성 창은 메일함 안의 칸이라 먼저 메일함으로 간 뒤 연다
    ["메일 쓰기", "메일쓰기 보내기 작성 새메일", () => {
      switchView("emails");
      window.setTimeout(() => openCompose({}), 200);
    }],
    ["업데이트 내용", "업데이트 새 버전 변경", () => openWhatsNew()],
    ["처음 소개 다시 보기", "튜토리얼 소개 도움말 달구", () => startTour()],
  ].forEach(([title, words, run]) => add("go", matchScore(query, title, words), { title, sub: "바로 하기", run }));

  // 과목: 이번 학기 수강 과목 + 자료가 있는 과목 + 시간표
  const courses = new Map();
  (state.courseState?.current || []).forEach((c) => courses.set(extractCourseLabelJs(c.name), c.name));
  (state.files || []).forEach((f) => f.courseLabel && !courses.has(f.courseLabel) && courses.set(f.courseLabel, f.course));
  courses.forEach((full, label) => {
    const count = (state.files || []).filter((f) => f.course === full).length;
    const dl = (state.deadlines.items || []).filter((d) => d.course === full && !isSubmitted(d) && parseDue(d) > new Date()).length;
    add("course", matchScore(query, label, full), {
      title: label,
      sub: [count ? `자료 ${count}개` : "", dl ? `남은 과제 ${dl}개` : ""].filter(Boolean).join(" · ") || "과목",
      run: () => {
        switchView("files");
        state.course = full;
        const sel = $("#courseFilter");
        if (sel) sel.value = full;
        renderFiles();
      },
    });
  });
  // 시간표는 요일마다 한 칸씩이라 같은 과목이 여러 번 나온다. 과목 하나로 묶어 요일을 모아 적는다.
  const slots = new Map();
  (state.timetable || []).forEach((t) => {
    const key = t.title || t.courseLabel;
    if (!key) return;
    if (!slots.has(key)) slots.set(key, { t, times: [] });
    slots.get(key).times.push(`${TT_DAYS[t.day] || ""} ${t.start}`); // 시간표 day 는 0=월
  });
  slots.forEach(({ t, times }, key) => {
    add("course", matchScore(query, key, t.courseLabel, t.professor, t.courseNo) * 0.9, {
      title: key,
      sub: `시간표 · ${times.join(", ")}${t.room ? ` · ${t.room}` : ""}${t.professor ? ` · ${t.professor}` : ""}`,
      run: () => switchView("dashboard"),
    });
  });

  (state.files || []).forEach((f) =>
    add("file", matchScore(query, f.name, f.courseLabel, f.folder), {
      title: f.name,
      sub: [f.courseLabel, (f.folderPath || []).join(" › ") || f.folder, f.status === "local" ? "" : "내 컴퓨터에 없음"]
        .filter(Boolean)
        .join(" · "),
      run: () => {
        if (f.status === "local") {
          openOutside(`/api/file?name=${encodeURIComponent(f.localName)}`);
        } else {
          setViewFilter("files", f.name);
        }
      },
    }),
  );

  (state.deadlines.items || []).forEach((d) => {
    const due = parseDue(d);
    add("deadline", bumpScore(matchScore(query, d.name, d.courseLabel || d.course), due && due > new Date() ? 3 : 0), {
      title: d.name,
      sub: [d.courseLabel || extractCourseLabelJs(d.course), due ? dueText(due) : "", isSubmitted(d) ? "제출함" : ""]
        .filter(Boolean)
        .join(" · "),
      run: () => setViewFilter("deadlines", d.name),
    });
  });

  // 같은 제목으로 여러 번 온 공지 메일은 가장 최근 것 하나만
  const seenSubjects = new Set();
  [...(state.emails.emails || [])]
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
    .forEach((m) => {
    if (m.folder === "trash") return;
    const subjectKey = searchKey(m.subject);
    if (seenSubjects.has(subjectKey)) return;
    seenSubjects.add(subjectKey);
    add("mail", matchScore(query, m.subject, m.fromName, m.fromEmail, m.summary) , {
      title: m.subject || "(제목 없음)",
      sub: [m.fromName || m.fromEmail, m.date ? String(m.date).slice(0, 10) : ""].filter(Boolean).join(" · "),
      date: m.date || "",
      // 화면 전환(최대 150ms)이 끝나면서 메일 창을 목록으로 되돌리므로, 전환 뒤에 연다
      run: () => {
        switchView("emails");
        window.setTimeout(() => openEmailDetail(m), 200);
      },
    });
  });

  const openDay = (date) => {
    switchView("calendar");
    state.calMonth = { y: date.getFullYear(), m: date.getMonth() };
    renderedViews.delete("calendar");
    renderAll();
    window.setTimeout(() => openDayDetail(date.getDate()), 200);
  };
  calendarItems()
    .filter((it) => it.kind === "event" || it.kind === "school" || it.kind === "mine")
    .forEach((it) =>
      add("event", matchScore(query, it.title, it.full, it.sub), {
        title: it.title,
        sub: `${it.date.getMonth() + 1}/${it.date.getDate()}${it.allDay ? "" : ` ${pad2(it.date.getHours())}:${pad2(it.date.getMinutes())}`} · ${
          it.kind === "mine" ? "내 일정" : it.kind === "school" ? "학교 행사" : "세미나"
        }`,
        run: () => openDay(it.date),
      }),
    );
  (Array.isArray(state.academic) ? state.academic : []).forEach((a) => {
    const d = new Date(`${a.start}T00:00`);
    if (Number.isNaN(d.getTime())) return;
    add("event", bumpScore(matchScore(query, a.title, a.kind), d > new Date() ? 2 : 0), {
      title: a.title,
      sub: `학사일정 · ${a.start}${a.end && a.end !== a.start ? ` ~ ${a.end}` : ""}`,
      run: () => openDay(d),
    });
  });

  (Array.isArray(state.notices) ? state.notices : []).forEach((n) =>
    add("notice", matchScore(query, n.title, n.writer, n.board), {
      title: n.title,
      sub: [n.board, n.writer, n.date].filter(Boolean).join(" · "),
      run: () => n.url && api("/api/open-url", { method: "POST", body: JSON.stringify({ url: n.url }) }).catch(() => {}),
    }),
  );

  searchSettings().forEach((s) =>
    add("setting", matchScore(query, s.title), {
      title: s.title,
      sub: "설정",
      run: () => {
        switchView("settings");
        window.setTimeout(() => {
          const target = s.el.closest(".settings-card, .card, section, fieldset") || s.el;
          target.scrollIntoView({ block: "center", behavior: "smooth" });
          target.classList.remove("search-flash");
          void target.offsetWidth;
          target.classList.add("search-flash");
          const field =
            (s.el.htmlFor && document.getElementById(s.el.htmlFor)) ||
            s.el.querySelector?.("input, select, textarea") ||
            s.el.nextElementSibling?.matches?.("input, select, textarea") && s.el.nextElementSibling;
          field?.focus?.({ preventScroll: true });
        }, 200);
      },
    }),
  );

  if (opts.all) return res;
  // 무리마다 점수순(같으면 최근 것 먼저)으로 몇 개만
  const LIMIT = { go: 3, course: 4, file: 6, deadline: 4, mail: 5, event: 4, notice: 3, setting: 3 };
  const grouped = SEARCH_GROUPS.map(([key, label]) => {
    const items = res
      .filter((r) => r.group === key)
      .sort((a, b) => b.score - a.score || String(b.date || "").localeCompare(String(a.date || "")));
    return { key, label, total: items.length, items: items.slice(0, LIMIT[key]) };
  }).filter((g) => g.items.length);
  // 가장 잘 맞는 무리를 위로. 과목·바로 가기는 조금 더 앞에 (찾는 게 대개 '그 과목' 이라서)
  const groupBonus = (g) => g.items[0].score + (g.key === "course" || g.key === "go" ? 15 : 0);
  grouped.sort((a, b) => groupBonus(b) - groupBonus(a));
  return withAiSearch(query, grouped);
}

function extractCourseLabelJs(name) {
  // "일반물리Ⅱ (General PhysicsⅡ )_03[ 2026_2학기 ]" → "General PhysicsⅡ" (자료 목록의 courseLabel 과 같게)
  const m = String(name || "").match(/\(([^()]*)\)\s*_\d+/);
  return (m ? m[1] : String(name || "").replace(/_\d+\s*\[.*$/, "")).trim();
}

/** 결과를 고른 뒤 그 화면의 목록을 그 이름으로 걸러 보여 준다 (검색창에 남아 있어 지우면 풀린다) */
function setViewFilter(view, text) {
  switchView(view);
  state.query = text;
  $("#searchInput").value = text;
  SEARCH_PARTS_ALL.forEach((key) => renderedViews.delete(key));
  renderAll();
  closeSearchPop();
}
const SEARCH_PARTS_ALL = ["upcoming", "deadlines", "emails", "courses", "files", "courseFilter"];

let searchFlat = [];
let searchActive = 0;
function renderSearchPop() {
  const pop = $("#searchPop");
  const input = $("#searchInput");
  if (!pop || !input) return;
  const q = input.value.trim();
  if (!q) {
    closeSearchPop();
    return;
  }
  const groups = buildSearchResults(q);
  searchFlat = groups.flatMap((g) => g.items);
  searchActive = Math.min(searchActive, Math.max(0, searchFlat.length - 1));
  let i = -1;
  pop.innerHTML = groups.length
    ? groups
        .map(
          (g) => `
      <div class="sp-group">
        <div class="sp-head">${g.label}${g.total > g.items.length ? `<span>${g.total}개 중 ${g.items.length}개</span>` : ""}</div>
        ${g.items
          .map((it) => {
            i += 1;
            return `<div class="sp-item${i === searchActive ? " active" : ""}" role="option" data-sp="${i}">
              <span class="sp-icon sp-${g.key}">${iconHtml(SEARCH_ICON[g.key])}</span>
              <span class="sp-text"><strong>${highlightMatch(it.title, q)}</strong><em>${escapeHtml(it.sub || "")}</em></span>
            </div>`;
          })
          .join("")}
      </div>`,
        )
        .join("")
    : `<div class="sp-empty">'${escapeHtml(q)}'와 맞는 게 없어요.<br><small>과목 이름, 파일 이름, 메일 제목, 보낸 사람, 행사 이름으로 찾아보세요.</small></div>`;
  pop.hidden = false;
  input.setAttribute("aria-expanded", "true");
}

function highlightMatch(text, q) {
  const raw = String(text || "");
  const idx = raw.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0 || /^[ㄱ-ㅎ]+$/.test(q)) return escapeHtml(raw);
  return `${escapeHtml(raw.slice(0, idx))}<mark>${escapeHtml(raw.slice(idx, idx + q.length))}</mark>${escapeHtml(raw.slice(idx + q.length))}`;
}

function closeSearchPop() {
  const pop = $("#searchPop");
  if (pop) pop.hidden = true;
  $("#searchInput")?.setAttribute("aria-expanded", "false");
}

function runSearchItem(index) {
  const item = searchFlat[index];
  if (!item) return;
  // 'AI 에게 물어보기' 는 창을 닫지 않고 그 자리에서 결과를 기다린다
  if (item.keepOpen) {
    item.run();
    return;
  }
  closeSearchPop();
  $("#searchInput")?.blur();
  try {
    item.run();
  } catch (error) {
    reportError(error, "검색 결과 열기");
  }
}

function bindSearchPop() {
  const input = $("#searchInput");
  const pop = $("#searchPop");
  if (!input || !pop) return;
  let timer = 0;
  input.addEventListener("input", () => {
    searchActive = 0;
    window.clearTimeout(timer);
    timer = window.setTimeout(renderSearchPop, 60);
    // 검색창을 비우면 걸어 둔 목록 거르기도 푼다
    if (!input.value.trim() && state.query) {
      state.query = "";
      SEARCH_PARTS_ALL.forEach((key) => renderedViews.delete(key));
      renderAll();
    }
  });
  input.addEventListener("focus", () => {
    searchSettings.cache = null;
    if (input.value.trim()) renderSearchPop();
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!pop.hidden) closeSearchPop();
      else input.blur();
      return;
    }
    if (pop.hidden && event.key !== "Enter") return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const n = searchFlat.length;
      if (!n) return;
      searchActive = (searchActive + (event.key === "ArrowDown" ? 1 : -1) + n) % n;
      pop.querySelectorAll(".sp-item").forEach((el) => el.classList.toggle("active", Number(el.dataset.sp) === searchActive));
      pop.querySelector(".sp-item.active")?.scrollIntoView({ block: "nearest" });
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (pop.hidden) renderSearchPop();
      runSearchItem(searchActive);
    }
  });
  // mousedown: 입력칸이 blur 로 창을 닫기 전에 고른다
  pop.addEventListener("mousedown", (event) => {
    const item = event.target.closest(".sp-item");
    if (!item) return;
    event.preventDefault();
    runSearchItem(Number(item.dataset.sp));
  });
  pop.addEventListener("mousemove", (event) => {
    const item = event.target.closest(".sp-item");
    if (!item || Number(item.dataset.sp) === searchActive) return;
    searchActive = Number(item.dataset.sp);
    pop.querySelectorAll(".sp-item").forEach((el) => el.classList.toggle("active", el === item));
  });
  input.addEventListener("blur", () => window.setTimeout(closeSearchPop, 120));
}

/** 자동완성에서 친 글자에 밑줄 (웹메일과 같은 표시) */
function acMark(text, q) {
  const raw = String(text || "");
  const needle = String(q || "").trim();
  const idx = needle ? raw.toLowerCase().indexOf(needle.toLowerCase()) : -1;
  if (idx < 0) return escapeHtml(raw);
  return `${escapeHtml(raw.slice(0, idx))}<u>${escapeHtml(raw.slice(idx, idx + needle.length))}</u>${escapeHtml(raw.slice(idx + needle.length))}`;
}

/* ===== 사이드바 상태판 =====
   LMS · 메일 · Drive 가 제대로 도는지 불빛으로, 다음에 무엇을 언제 가져오는지 한 줄로.
   문제가 있으면 그 문제를 맨 위에 쓰고, 누르면 고칠 곳(설정의 계정)으로 간다. */
const STATUS_KIND_LABEL = { emails: "메일", deadlines: "마감", sync: "자료" };
// '다음: 메일 곧' 은 무엇을 하는지 알 수 없었다. 하는 일을 문장으로 적는다.
const STATUS_KIND_DOING = { emails: "새 메일 확인하는 중", deadlines: "과제 마감 확인하는 중", sync: "새 강의자료 받는 중" };
const STATUS_KIND_NEXT = { emails: "새 메일 확인", deadlines: "과제 마감 확인", sync: "새 강의자료 확인" };

// 상태판 제목은 사이드바 폭(약 9자)에 들어가게 짧게 쓴다. "메일 가져오기가 계속 실…" 로 잘렸다(2026-10-14).
// 자세한 사정은 상태판에 올리면 보이는 도움말(tip)에 있다.
function statusLights() {
  const cfg = state.config || {};
  const h = state.health || {};
  const auth = h.authFailed || {};
  const streak = h.failStreak || {};
  const ok = h.lastSuccess || {};
  const oauth = state.status?.googleOAuth || {};
  const since = (k) => (ok[k] ? agoText(ok[k]) : "아직 안 함");

  const lms = !cfg.lmsId || !cfg.hasLmsPassword
    ? { tone: "off", why: "LMS 계정 필요" }
    : auth.sync || auth.deadlines
      ? { tone: "bad", why: "LMS 로그인 실패" }
      : (streak.sync || 0) >= 2 || (streak.deadlines || 0) >= 2
        ? { tone: "warn", why: "LMS 연결 오류" }
        : { tone: "ok", why: "" };
  lms.tip = `LMS · 자료 ${since("sync")} · 마감 ${since("deadlines")}`;

  const mail = !cfg.schoolEmail || !cfg.hasSchoolEmailPassword
    ? { tone: "off", why: "메일 계정 필요" }
    : auth.emails
      ? { tone: "bad", why: "메일 로그인 실패" }
      : (streak.emails || 0) >= 2
        ? { tone: "warn", why: "메일 연결 오류" }
        : { tone: "ok", why: "" };
  mail.tip = `학교 메일 · ${since("emails")}`;

  const drive = cfg.driveUpload === false
    ? { tone: "off", why: "", tip: "Drive · 꺼 둠" }
    : !oauth.tokenUsable && !oauth.credentialsExists
      ? { tone: "off", why: "", tip: "Drive · 이 판에서는 준비 중" }
    : !oauth.tokenUsable
      ? { tone: "bad", why: "구글 로그인 필요", tip: "Drive · 로그인 필요" }
      : { tone: "ok", why: "", tip: "Drive · 연결됨" };

  return { lms, mail, drive };
}

/** 다음 자동 확인: 메일 5분·마감 1시간·자료 3시간 주기와 마지막 성공 시각으로 계산 */
function nextAutoJob() {
  const cfg = state.config || {};
  const h = state.health || {};
  const every = { emails: cfg.autoEmailMinutes, deadlines: cfg.autoDeadlineMinutes, sync: cfg.autoSyncMinutes };
  let best = null;
  Object.entries(every).forEach(([kind, minutes]) => {
    const m = Number(minutes) || 0;
    if (m <= 0 || (h.authFailed || {})[kind]) return;
    const last = h.lastSuccess?.[kind] ? new Date(h.lastSuccess[kind]).getTime() : 0;
    let at = last + m * 60000;
    // 실패한 뒤에는 앱이 쉬었다가 다시 한다 (app.next_due_job 과 같은 셈: 연속 실패마다 두 배, 최대 6시간)
    const fail = h.lastFailure || {};
    const streak = Number((h.failStreak || {})[kind]) || 0;
    if (fail.kind === kind && fail.at) {
      const wait = Math.max(streak ? Math.min(Math.max(5, m) * 2 ** (streak - 1), 360) : 0, Math.max(5, m / 2));
      at = Math.max(at, new Date(fail.at).getTime() + wait * 60000);
    }
    at = Math.max(Date.now(), at);
    if (!best || at < best.at) best = { kind, at };
  });
  return best;
}

function renderStatusCard(task) {
  const card = $("#statusCard");
  if (!card) return;
  const lights = statusLights();
  const order = [lights.mail, lights.lms, lights.drive];
  const problem = order.find((l) => l.tone === "bad") || order.find((l) => l.tone === "off" && l.why) || order.find((l) => l.tone === "warn");
  const tone = problem ? (problem.tone === "warn" ? "warn" : "bad") : "ok";

  const title = DEMO_ON ? "체험 중" : problem ? problem.why : "모두 정상";
  let line;
  const running = task ? task.running : state._taskRunning;
  const kind = task?.kind || state.task?.kind;
  if (DEMO_ON) {
    line = "가짜 데이터 · 가져오기 쉼";
  } else if (running && STATUS_KIND_DOING[kind]) {
    line = STATUS_KIND_DOING[kind];
  } else {
    const next = nextAutoJob();
    if (!next) line = "자동으로 가져오기 꺼짐";
    else {
      const mins = Math.ceil((next.at - Date.now()) / 60000);
      // 앱은 30초마다 차례를 보므로, 시간이 됐으면 1분 안에 시작한다
      const when = mins <= 1 ? "1분 안에" : mins < 60 ? `${mins}분 뒤` : `${pad2(new Date(next.at).getHours())}:${pad2(new Date(next.at).getMinutes())}에`;
      line = `${when} ${STATUS_KIND_NEXT[next.kind]}`;
    }
  }
  const lightHtml = [["LMS", lights.lms], ["메일", lights.mail], ["Drive", lights.drive]]
    .map(([name, l]) => `<i class="sl-${l.tone}" title="${escapeHtml(l.tip || name)}">${name}</i>`)
    .join("");
  const full = state.health?.lastFullSync;
  const tip = [
    lights.lms.tip,
    lights.mail.tip,
    lights.drive.tip,
    `전체 확인 매일 ${state.status?.scheduleTime || "08:00"}${full ? ` (마지막 ${agoText(full)})` : ""}`,
    problem ? "누르면 설정으로 갑니다" : "누르면 자동 가져오기 설정으로 갑니다",
  ].join("\n");

  const sig = `${tone}|${title}|${line}|${lightHtml}|${tip}`;
  if (card.dataset.sig === sig) return;
  card.dataset.sig = sig;
  $("#sidebarStatus").textContent = title;
  $("#sidebarSchedule").textContent = line;
  $("#statusLights").innerHTML = lightHtml;
  const dot = $("#sidebarStatusDot");
  dot.classList.toggle("ready", tone === "ok");
  dot.classList.toggle("warn", tone === "warn");
  dot.classList.toggle("bad", tone === "bad");
  card.title = tip;
  card.dataset.target = problem ? "stAccounts" : "stAuto";
}


/* ===== 체험 모드 =====
   Store 심사(정책 10.3.1 시험 계정)와 처음 깐 사람을 위해 계정 없이 가짜 데이터로 모든 화면을 보여 준다(demo_mode.py).
   켜고 끄는 곳: 상단 바 알약 · 설정 › 연결된 계정 · 첫 실행 소개의 첫 카드. 바꾸면 서버가 데이터 폴더를 바꿔 끼우고
   화면은 새로 띄운다(남아 있던 목록·캐시가 섞이지 않게). 체험 중에는 서버가 바깥 연결을 모두 막는다. */
function demoAvailable() {
  return Boolean(state.status?.demo?.available);
}

/** 계정이 없는 사람에게만 '계정 없이 체험하기' 를 권한다 (계정을 넣은 사람은 설정에서 켤 수 있다) */
function demoInvite() {
  return !DEMO_ON && demoAvailable() && !state.status?.requiredConfig?.lms;
}

function renderDemoPill() {
  const pill = $("#demoPill");
  if (pill) {
    pill.hidden = !(DEMO_ON || demoInvite());
    pill.classList.toggle("on", DEMO_ON);
    $("#demoText").hidden = !DEMO_ON;
    $("#demoPillButton").textContent = DEMO_ON ? "체험 끝내기" : "계정 없이 체험하기";
    $("#demoPillButton").title = DEMO_ON ? "체험을 끝내고 내 데이터로 돌아가요" : "가짜 데이터로 모든 화면을 둘러봐요";
  }
  const row = $("#demoRow");
  if (row) {
    row.hidden = !(DEMO_ON || demoAvailable());
    $("#demoRowText").textContent = DEMO_ON ? "지금 가짜 데이터를 보고 있어요" : "계정 없이 가짜 데이터로 둘러봐요";
    $("#demoRowButton").textContent = DEMO_ON ? "체험 끝내기" : "체험해 보기";
  }
  // 소개는 첫 목록을 받기 전에 뜰 수 있다. 목록(계정 유무)이 오면 첫 카드의 단추를 다시 맞춘다
  if (tour.active) $("#tourDemo").hidden = !(tour.mode === "core" && tour.index === 0 && demoInvite());
}

let demoSwitching = false;
async function setDemo(on) {
  if (demoSwitching) return;
  demoSwitching = true;
  try {
    // 영어 화면이면 가짜 메일·공지도 영어로 만든다
    await api("/api/demo", { method: "POST", body: JSON.stringify({ on, lang: I18N.lang }) });
    showToast(on ? "체험 데이터를 채우는 중이에요" : "내 데이터로 돌아가요");
    window.setTimeout(() => window.location.reload(), 300);
  } catch (error) {
    demoSwitching = false;
    showToast(humanError(error));
  }
}

$("#demoPillButton")?.addEventListener("click", () => setDemo(!DEMO_ON));
$("#demoRowButton")?.addEventListener("click", () => setDemo(!DEMO_ON));
$("#tourDemo")?.addEventListener("click", () => {
  // 소개는 끝낸 것으로 치지 않는다: 체험 화면에서 데이터가 찬 채로 처음부터 다시 보여 준다
  setDemo(true);
});

$("#statusCard")?.addEventListener("click", () => {
  const target = $("#statusCard").dataset.target || "stAuto";
  openSettings();
  window.setTimeout(() => {
    const el = document.getElementById(target);
    if (!el) return;
    el.scrollIntoView({ block: "start", behavior: "smooth" });
    el.classList.remove("search-flash");
    void el.offsetWidth;
    el.classList.add("search-flash");
  }, 220);
});
// '3분 뒤' 가 멈춰 있지 않게 30초마다 다시 쓴다 (값이 같으면 DOM 은 건드리지 않음)
window.setInterval(() => renderStatusCard(), 30000);


/* ===== 새 버전 (GitHub 릴리스) =====
   켤 때 한 번, 그 뒤로는 6시간마다 조용히 확인한다. 새 버전이 있으면 사이드바에 '새 버전 설치'
   알약이 뜨고, 설정 > 앱의 '지금 업데이트' 를 누르면 받아서 확인(SHA-256)한 뒤 조용히 설치하고 다시 켠다. */
async function checkForUpdate(manual = false) {
  const status = $("#updateStatus");
  const apply = $("#applyUpdateButton");
  if (manual && status) status.textContent = "GitHub에서 확인하는 중…";
  let d;
  try {
    d = await api("/api/update/check");
  } catch (error) {
    if (status) status.textContent = humanError ? humanError(error) : error.message;
    return;
  }
  state.update = d;
  if (d.current) $("#appVersion").textContent = `v${d.current}`;
  const ready = Boolean(d.ok && d.updateAvailable);
  if (status) {
    if (!d.ok) status.textContent = d.message || "확인하지 못했어요";
    // Store 판(MSIX): 새 버전은 Microsoft Store 가 깐다. GitHub 은 묻지 않는다 (updater.check_update)
    else if (d.store) status.textContent = `Microsoft Store가 새 버전을 알아서 설치해요 (v${d.current})`;
    else if (ready) status.textContent = `v${d.latest} 이 나왔어요${d.size ? ` · ${Math.round(d.size / 1048576)}MB` : ""}`;
    else status.textContent = `최신 버전이에요 (v${d.current})`;
  }
  if (apply) {
    apply.hidden = !ready;
    // 맥(manualUrl): 스스로 설치하지 않고 새 DMG 를 받을 곳을 연다. 그래서 눌리게 둔다 (updater.check_update)
    apply.disabled = ready && !d.canInstall && !d.manualUrl;
    apply.title = ready && !d.canInstall ? d.manualNote || "설치형 앱에서만 자동으로 업데이트해요" : "";
  }
  const pill = $("#updateReadyButton");
  if (pill) {
    pill.hidden = !ready;
    // '새 업데이트 내용' 알약과 같은 강조(점·색)를 쓴다
    pill.classList.toggle("fresh", ready);
    $("#updateReadyLabel").textContent = ready ? `새 버전 v${d.latest} 설치` : "새 버전 설치";
  }
}

/* 업데이트 카드: 단계(확인 → 내려받기 → 파일 확인 → 설치)를 차례로 켠다 */
const UPDATE_STEPS = ["확인", "내려받기", "검사", "설치"];

function setUpdateStep(stage, { percent = null, failed = false, note = "" } = {}) {
  const dialog = $("#updateDialog");
  if (!dialog) return;
  const at = UPDATE_STEPS.indexOf(stage);
  dialog.querySelectorAll("#updateSteps li").forEach((li, i) => {
    li.classList.toggle("done", !failed ? i < at : i < at);
    li.classList.toggle("active", !failed && i === at);
    li.classList.toggle("failed", failed && i === at);
  });
  const pct = $("#updatePercent");
  if (pct) pct.textContent = stage === "내려받기" && percent != null ? `${percent}%` : "";
  // 막대: 단계마다 몫을 나눠 준다 (받기가 가장 길다)
  const base = { 확인: 4, 내려받기: 8, 검사: 86, 설치: 92 }[stage] ?? 0;
  const width = stage === "내려받기" && percent != null ? 8 + percent * 0.78 : base;
  $("#updateBarFill").style.width = `${failed ? 100 : width}%`;
  dialog.classList.toggle("failed", failed);
  dialog.classList.toggle("working", !failed);
  if (note) $("#updateNote").textContent = note;
  $("#updateActions").hidden = !failed;
  $("#updateBuddy").src = failed ? "/img/dalgu/shy.png" : stage === "설치" ? "/img/dalgu/cheer.png" : "/img/dalgu/run.png";
}

async function startAppUpdate() {
  const d = state.update;
  if (!d?.updateAvailable) return;
  if (d.manualUrl) {
    // 맥: ad-hoc 서명이라 앱이 스스로 덮어쓰지 않는다. 받은 DMG 에서 Daling 을 끌어다 놓는 것은 사람이 한다
    try {
      // ok:false 여도 message 는 서버가 만든 사람 말이라 그대로 보여 준다
      const res = await api("/api/update/open-download", { method: "POST", body: "{}" });
      showToast(res.message || d.manualNote);
    } catch (error) {
      showToast(humanError(error));
    }
    return;
  }
  if (!(await uiConfirm(`v${d.latest}(으)로 업데이트할까요?\n설치하는 동안 앱이 잠깐 꺼졌다가 다시 켜져요.`, { title: "새 버전", icon: "download", ok: "업데이트" }))) return;
  const dialog = $("#updateDialog");
  const apply = $("#applyUpdateButton");
  if (apply) apply.disabled = true;
  $("#updateVersions").textContent = `v${d.current} → v${d.latest}`;
  $("#updateDialogTitle").textContent = "새 버전으로 바꾸는 중";
  setUpdateStep("확인", { note: "잠깐 꺼졌다가 저절로 다시 켜져요. 그대로 두세요." });
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
  try {
    const res = await api("/api/update/apply", { method: "POST", body: "{}" });
    if (!res.ok) throw new Error(res.message || "업데이트를 시작하지 못했어요");
    for (;;) {
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      let job;
      try {
        job = await api("/api/update/job");
      } catch (error) {
        // 설치 프로그램이 앱을 끄면 여기로 온다. 곧 새 버전으로 다시 켜진다.
        setUpdateStep("설치", { note: "설치하는 중이에요. 곧 새 버전으로 다시 켜져요." });
        return;
      }
      if (job.ok === false) throw Object.assign(new Error(job.message || "업데이트하지 못했어요"), { stage: job.stage });
      const percent = job.total ? Math.min(100, Math.round((job.done / job.total) * 100)) : null;
      setUpdateStep(job.stage || "확인", { percent });
      if (!job.running && job.ok) {
        setUpdateStep("설치", { note: "설치하는 중이에요. 곧 새 버전으로 다시 켜져요." });
        return;
      }
    }
  } catch (error) {
    const stage = UPDATE_STEPS.includes(error.stage) ? error.stage : "확인";
    $("#updateDialogTitle").textContent = "업데이트하지 못했어요";
    setUpdateStep(stage === "실패" ? "확인" : stage, { failed: true, note: error.message });
    if (apply) apply.disabled = false;
  }
}

$("#updateDialogClose")?.addEventListener("click", () => $("#updateDialog")?.close());
// 받는 중에 Esc 로 닫히면 진행이 안 보인다. 실패했을 때만 닫을 수 있다.
$("#updateDialog")?.addEventListener("cancel", (event) => {
  if (!$("#updateDialog").classList.contains("failed")) event.preventDefault();
});

$("#checkUpdateButton")?.addEventListener("click", () => checkForUpdate(true));
$("#applyUpdateButton")?.addEventListener("click", startAppUpdate);
$("#updateReadyButton")?.addEventListener("click", () => {
  openSettings(); // 사이드바의 '설정' 도 같이 켜지게
  // 화면 전환 효과가 끝난 뒤에 내려가야 먹는다 (150ms 로는 맨 위에 그대로 있었다)
  window.setTimeout(() => $("#updateRow")?.scrollIntoView({ block: "center" }), 500);
});
window.setTimeout(() => checkForUpdate(false), 4000);
window.setInterval(() => checkForUpdate(false), 6 * 60 * 60 * 1000);

/* 알림 스위치는 누르는 즉시 저장한다 ('설정 저장' 을 안 눌러 도로 꺼지는 일이 없게) */
["notifyDeadlines", "notifyNewFiles"].forEach((name) => {
  $(`#${name}`)?.addEventListener("change", async (event) => {
    const on = event.target.checked;
    try {
      await api("/api/config", { method: "POST", body: JSON.stringify({ [name]: on }) });
      if (state.config) state.config[name] = on;
      showToast(`${name === "notifyDeadlines" ? "마감 알림" : "새 자료·공지 알림"}을 ${on ? "켰어요" : "껐어요"}`);
    } catch (error) {
      event.target.checked = !on;
      showToast(humanError(error));
    }
  });
});


/* ===== 언어 고르기 (설정 > 앱) =====
   영어 ↔ 한국어를 오가면 이미 바꿔 그린 글자를 되돌릴 수 없어서, 저장하고 화면을 다시 불러온다. */
function paintLanguageChoice(pref) {
  const lang = pref === "ko" || pref === "en" ? pref : I18N.lang;
  document.querySelectorAll("input[name=uiLang]").forEach((input) => {
    input.checked = input.value === lang;
  });
}

document.getElementById("langRow")?.addEventListener("change", async (event) => {
  const lang = event.target?.value;
  if (lang !== "ko" && lang !== "en") return;
  try {
    await api("/api/ui-prefs", { method: "POST", body: JSON.stringify({ lang }) });
  } catch (error) {
    showToast(error.message);
    return;
  }
  window.location.reload();
});

/* ===== 강의 › 공지사항 =====
   '과목 | 공지사항' 탭. 공지사항 탭은 과목마다 카드 한 장(최근 4건, 펼치면 전부)을 한눈에 늘어놓는 게시판이다.
   처음 만든 것은 과목 카드 아래에 162건을 한 줄로 늘어놓아 '정돈 안 된 나열식' 이라는 말을 들었다.
   이번 학기 과목만 펼쳐 두고 지난 학기는 접어 둔다. 제목을 누르면 읽기 창(이전·다음 공지로 넘김). */
state.courseAnn = null;
state.courseTab = "courses";
state.annExpanded = new Set();

async function loadCourseAnn() {
  try {
    state.courseAnn = await api("/api/course-announcements");
  } catch (error) {
    state.courseAnn = state.courseAnn || { courses: [] };
  }
  renderCourseAnn();
}

function annDate(iso, long = false) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  if (long) return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0 && d.getDate() === new Date().getDate()) return "오늘";
  if (days <= 1) return "어제";
  if (d.getFullYear() !== new Date().getFullYear()) return `${String(d.getFullYear()).slice(2)}.${d.getMonth() + 1}.${d.getDate()}`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** '일반물리Ⅱ (General PhysicsⅡ )_03[ 2026_2학기 ]' → 20262 (학기 순서값) */
function courseTermKey(course) {
  const m = String(course || "").match(/(\d{4})_(\d)학기/);
  return m ? Number(m[1]) * 10 + Number(m[2]) : 0;
}

const ANN_FRESH_MS = 3 * 86400000;
const annFresh = (a) => a.created && Date.now() - new Date(a.created).getTime() < ANN_FRESH_MS;

function annGroups() {
  const courses = (state.courseAnn?.courses || [])
    .filter((c) => c.items.length)
    .map((c) => ({
      ...c,
      items: [...c.items].sort((a, b) => String(b.created || "").localeCompare(String(a.created || ""))),
      term: courseTermKey(c.course),
    }));
  const latestTerm = Math.max(0, ...courses.map((c) => c.term));
  const byLatest = (a, b) => String(b.items[0]?.created || "").localeCompare(String(a.items[0]?.created || ""));
  return {
    current: courses.filter((c) => c.term === latestTerm).sort(byLatest),
    past: courses.filter((c) => c.term !== latestTerm).sort(byLatest),
  };
}

function annCardHtml(c) {
  const expanded = state.annExpanded.has(c.course);
  const shown = expanded ? c.items : c.items.slice(0, 4);
  const freshCount = c.items.filter(annFresh).length;
  const pill = freshCount ? `<i class="ann-new-pill">새 ${freshCount}</i>` : "";
  const meta = `공지 ${c.items.length} · ${escapeHtml(annDate(c.items[0]?.created))}`;
  return `
    <article class="ann-card ${freshCount ? "has-new" : ""}">
      <header class="ann-card-head">
        <strong title="${escapeHtml(c.course)}">${escapeHtml(c.label)}</strong>
        <span>${pill}${meta}</span>
      </header>
      <ul class="ann-card-list">
        ${shown
          .map(
            (a) => `<li><button type="button" class="ann-line ${annFresh(a) ? "fresh" : ""}" data-ann-open="${escapeHtml(a.id)}" data-ann-course="${escapeHtml(c.course)}">
              <span class="ann-line-date">${escapeHtml(annDate(a.created))}</span>
              <span class="ann-line-title">${escapeHtml(a.title)}</span>
            </button></li>`,
          )
          .join("")}
      </ul>
      ${c.items.length > 4
        ? `<button type="button" class="ann-more" data-ann-more="${escapeHtml(c.course)}">${expanded ? "접기" : `전체 ${c.items.length}개 보기`}</button>`
        : ""}
    </article>`;
}

function renderCourseAnn() {
  const box = $("#courseAnn");
  if (!box) return;
  const { current, past } = annGroups();
  const all = [...current, ...past];
  const recent = current
    .flatMap((c) => c.items.filter((a) => a.created && Date.now() - new Date(a.created).getTime() < 7 * 86400000).map((a) => ({ ...a, c })))
    .sort((a, b) => String(b.created).localeCompare(String(a.created)));

  // 탭 옆 숫자: 최근 3일 새 공지
  const freshTotal = current.reduce((n, c) => n + c.items.filter(annFresh).length, 0);
  const count = $("#annTabCount");
  if (count) {
    count.hidden = !freshTotal;
    count.textContent = freshTotal ? `새 ${freshTotal}` : "";
  }

  const sig = `${state.courseAnn?.updatedAt}|${all.length}|${[...state.annExpanded].join(",")}|${state.courseTab}`;
  if (box.dataset.sig === sig) return;
  box.dataset.sig = sig;

  $("#annRecent").innerHTML = recent.length
    ? `<div class="ann-recent-head"><strong>최근 7일</strong><span>새 공지 ${recent.length}건</span></div>
       <div class="ann-recent-list">${recent
         .slice(0, 6)
         .map(
           (a) => `<button type="button" class="ann-recent-item" data-ann-open="${escapeHtml(a.id)}" data-ann-course="${escapeHtml(a.c.course)}">
             <span class="ann-recent-course">${escapeHtml(shortText(a.c.label, 16))}</span>
             <span class="ann-recent-title">${escapeHtml(a.title)}</span>
             <span class="ann-recent-date">${escapeHtml(annDate(a.created))}</span>
           </button>`,
         )
         .join("")}</div>`
    : `<div class="ann-recent-head"><strong>최근 7일</strong><span>새 공지 없음</span></div>`;
  $("#annBoard").innerHTML = current.length
    ? current.map(annCardHtml).join("")
    : '<p class="ann-empty">이번 학기 공지가 아직 없어요.</p>';
  const pastWrap = $("#annPastWrap");
  pastWrap.hidden = !past.length;
  if (past.length) {
    $("#annPastSummary").textContent = `지난 학기 공지 · ${past.length}과목 ${past.reduce((n, c) => n + c.items.length, 0)}건`;
    $("#annPastBoard").innerHTML = past.map(annCardHtml).join("");
  }
  installIcons(box);
}

function setCourseTab(tab) {
  state.courseTab = tab === "ann" ? "ann" : "courses";
  navPush();
  const ann = state.courseTab === "ann";
  document.querySelectorAll(".course-tab").forEach((b) => b.classList.toggle("on", b.dataset.ctab === state.courseTab));
  $("#courseAnn").hidden = !ann;
  $("#courseGrid").hidden = ann;
  if (ann) $("#courseEmpty").hidden = true;
  const actions = document.querySelector(".course-hero-actions");
  if (actions) actions.hidden = ann; // 편집·복원은 과목 탭에서만
  if (ann) renderCourseAnn();
  else renderCourses();
}

/* 읽기 창 */
/** 공지 본문: 수집 때 취소선을 ~~글~~ 로 남겨 둔다(lms_crawler._announcement_html). 시험 범위에서 뺀 단원 같은 것. */
function annTextHtml(text) {
  return linkifyText(text).replace(/~~([^~\n]+?)~~/g, "<del>$1</del>");
}
let annReading = null; // { course, index }
function openAnn(course, id) {
  const c = (state.courseAnn?.courses || []).find((x) => x.course === course);
  if (!c) return;
  const items = [...c.items].sort((a, b) => String(b.created || "").localeCompare(String(a.created || "")));
  const index = Math.max(0, items.findIndex((a) => a.id === id));
  annReading = { course, items, label: c.label, index };
  paintAnnDialog();
  const dlg = $("#annDialog");
  if (!dlg.open) dlg.showModal();
}
function paintAnnDialog() {
  if (!annReading) return;
  const a = annReading.items[annReading.index];
  $("#annDialogCourse").textContent = annReading.label;
  $("#annDialogTitle").textContent = a.title;
  $("#annDialogDate").textContent = annDate(a.created, true);
  $("#annDialogBody").innerHTML = a.text ? `<div class="ann-text">${annTextHtml(a.text)}</div>` : '<p class="ann-empty">본문이 없는 공지예요.</p>';
  $("#annDialogBody").scrollTop = 0;
  $("#annDialogPos").textContent = `${annReading.index + 1} / ${annReading.items.length}`;
  // 목록이 최신순이라 '이전 공지' 는 더 오래된 것(아래쪽)
  $("#annPrev").disabled = annReading.index >= annReading.items.length - 1;
  $("#annNext").disabled = annReading.index <= 0;
}

document.querySelector(".course-tabs")?.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-ctab]");
  if (tab) setCourseTab(tab.dataset.ctab);
});
$("#courseAnn")?.addEventListener("click", (event) => {
  const open = event.target.closest("[data-ann-open]");
  if (open) {
    openAnn(open.dataset.annCourse, open.dataset.annOpen);
    return;
  }
  const more = event.target.closest("[data-ann-more]");
  if (more) {
    const key = more.dataset.annMore;
    if (state.annExpanded.has(key)) state.annExpanded.delete(key);
    else state.annExpanded.add(key);
    renderCourseAnn();
  }
});
$("#annDialogClose")?.addEventListener("click", () => $("#annDialog").close());
$("#annDialog")?.addEventListener("click", (event) => {
  if (event.target === event.currentTarget) event.currentTarget.close(); // 바깥을 누르면 닫기
  const link = event.target.closest("[data-open-link]");
  if (link) {
    event.preventDefault();
    api("/api/mail/open-link", { method: "POST", body: JSON.stringify({ url: link.dataset.openLink }) })
      .then((res) => showToast(res.opened ? `브라우저에서 열었어요 · ${res.host}` : "링크를 열지 못했어요."))
      .catch((error) => showToast(humanError(error)));
  }
});
/* 옆으로 넘기기. '다음 공지'(오른쪽 단추, 더 최근 것)는 왼쪽으로 밀어서, '이전 공지'는 오른쪽으로 밀어서.
   손가락·펜·마우스 끌기, 트랙패드 가로 쓸기, ←/→ 키가 모두 같은 goAnn 으로 간다. */
const ANN_SLIDE_PX = 56;
function annSlideParts() {
  return [document.querySelector("#annDialog .ann-dialog-titles"), $("#annDialogBody")].filter(Boolean);
}
function annCanGo(step) {
  if (!annReading) return false;
  const next = annReading.index - step; // 목록이 최신순이라 '다음'(step +1)은 index 를 줄인다
  return next >= 0 && next < annReading.items.length;
}
let annSliding = false;
async function goAnn(step, fromDrag = 0) {
  const parts = annSlideParts();
  const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (!annCanGo(step)) {
    // 끝이면 살짝 튕겨서 더 없다는 걸 보여 준다
    if (!calm) parts.forEach((el) => el.animate(
      [{ transform: `translateX(${fromDrag}px)` }, { transform: `translateX(${-step * 14}px)` }, { transform: "translateX(0)" }],
      { duration: 260, easing: "cubic-bezier(.22,1,.36,1)" },
    ));
    return;
  }
  if (annSliding) return;
  annSliding = true;
  const out = -step * ANN_SLIDE_PX;
  try {
    if (!calm) {
      const leaving = parts.map((el) => el.animate(
        [{ transform: `translateX(${fromDrag}px)`, opacity: 1 }, { transform: `translateX(${out}px)`, opacity: 0 }],
        { duration: 140, easing: "ease-in", fill: "forwards" },
      ).finished.catch(() => {}));
      // 창이 가려져 애니메이션이 멈춰도 넘기기가 막히지 않게 오래 기다리지 않는다
      await Promise.race([Promise.all(leaving), new Promise((resolve) => window.setTimeout(resolve, 180))]);
    }
    annReading.index -= step;
    paintAnnDialog();
    if (!calm) {
      parts.forEach((el) => {
        el.getAnimations().forEach((an) => an.cancel());
        el.animate(
          [{ transform: `translateX(${-out}px)`, opacity: 0 }, { transform: "translateX(0)", opacity: 1 }],
          { duration: 220, easing: "cubic-bezier(.22,1,.36,1)" },
        );
      });
    }
  } finally {
    annSliding = false;
  }
}
$("#annPrev")?.addEventListener("click", () => goAnn(-1));
$("#annNext")?.addEventListener("click", () => goAnn(1));
$("#annDialog")?.addEventListener("keydown", (event) => {
  if (event.target.closest?.("input, textarea, select")) return;
  if (event.key === "ArrowRight") goAnn(1);
  else if (event.key === "ArrowLeft") goAnn(-1);
  else return;
  event.preventDefault();
});
// 트랙패드 가로 쓸기: 한 번 쓸면 한 장만 넘어가게 모았다가 넘기고 잠깐 쉰다
{
  let acc = 0;
  let restUntil = 0;
  $("#annDialogBody")?.addEventListener("wheel", (event) => {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    event.preventDefault();
    if (Date.now() < restUntil) return;
    acc += event.deltaX;
    if (Math.abs(acc) > 60) {
      goAnn(acc > 0 ? 1 : -1);
      acc = 0;
      restUntil = Date.now() + 450;
    }
  }, { passive: false });
}
// 끌어서 넘기기: 가로로 더 많이 움직였을 때만 끌기로 보고, 글을 고르는 중이면 끼어들지 않는다
{
  const body = $("#annDialogBody");
  let drag = null;
  body?.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || event.target.closest("a, button")) return;
    drag = { x: event.clientX, y: event.clientY, id: event.pointerId, on: false };
  });
  body?.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.on) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { drag = null; return; } // 세로 = 스크롤
      if (Math.abs(dx) < 12 || String(window.getSelection?.() || "").length > 0 && event.pointerType === "mouse") return;
      drag.on = true;
      window.getSelection?.()?.removeAllRanges();
      body.setPointerCapture(event.pointerId);
      body.classList.add("ann-dragging");
    }
    // 끝 쪽으로는 덜 따라오게(고무줄)
    const step = dx < 0 ? 1 : -1;
    drag.dx = annCanGo(step) ? dx : dx / 3;
    annSlideParts().forEach((el) => { el.style.transform = `translateX(${drag.dx}px)`; });
  });
  const end = (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const { on, dx = 0 } = drag;
    drag = null;
    body.classList.remove("ann-dragging");
    if (!on) return;
    annSlideParts().forEach((el) => { el.style.transform = ""; });
    if (Math.abs(dx) > 70) goAnn(dx < 0 ? 1 : -1, dx);
    else annSlideParts().forEach((el) => el.animate(
      [{ transform: `translateX(${dx}px)` }, { transform: "translateX(0)" }],
      { duration: 200, easing: "cubic-bezier(.22,1,.36,1)" },
    ));
  };
  body?.addEventListener("pointerup", end);
  body?.addEventListener("pointercancel", end);
}

/* ===== 뒤로·앞으로 (크롬처럼) =====
   '누른 화면으로 돌아가는 기능이 없다' 는 말을 듣고 넣었다. 브라우저의 기록(History API)에 화면·연 메일·강의 탭을
   적어 두어, 위쪽 ←/→ 단추뿐 아니라 마우스 옆 버튼과 Alt+←/→ 로도 오간다. 돌아갈 때는 그 상태를 그대로 다시 연다. */
// var: 시작할 때 applyView 가 이 줄보다 먼저 불려도 오류 없이 넘어가게 (const 면 선언 전 접근 오류)
var nav = { idx: 0, max: 0, restoring: false };

function navSnapshot() {
  return {
    view: state.view,
    mail: state.view === "emails" && state.mailPane === "read" ? String(state.replyContext?.id || "") : "",
    ctab: state.view === "courses" ? state.courseTab || "courses" : "",
  };
}
const navKey = (s) => `${s?.view}|${s?.mail}|${s?.ctab}`;

function paintNavButtons() {
  if (!nav) return;
  // 위쪽 막대와 메일함 머리에 같은 단추가 두 벌 있다
  document.querySelectorAll('[data-nav="back"]').forEach((b) => (b.disabled = nav.idx <= 0));
  document.querySelectorAll('[data-nav="forward"]').forEach((b) => (b.disabled = nav.idx >= nav.max));
}

function navPush() {
  if (!nav || nav.restoring || !state.view) return;
  try {
    if (tour.active) return; // 첫 실행 소개가 화면을 바꾸는 것은 기록하지 않는다
  } catch (error) {
    /* 아직 준비 전 */
  }
  const snap = navSnapshot();
  if (navKey(history.state?.nav) === navKey(snap)) return;
  nav.idx += 1;
  nav.max = nav.idx; // 새 곳으로 가면 '앞으로' 기록은 버린다 (크롬과 같다)
  history.pushState({ nav: snap, idx: nav.idx }, "");
  paintNavButtons();
}

function navRestore(snap) {
  nav.restoring = true;
  try {
    if (state.view !== snap.view) applyView(snap.view);
    if (snap.view === "courses" && snap.ctab && state.courseTab !== snap.ctab) setCourseTab(snap.ctab);
    if (snap.view === "emails") {
      const mail = snap.mail && (state.emails.emails || []).find((m) => String(m.id) === snap.mail);
      if (mail) openEmailDetail(mail);
      else showMailPane("list");
    }
  } finally {
    nav.restoring = false;
  }
}

window.addEventListener("popstate", (event) => {
  const snap = event.state?.nav;
  if (!snap) return;
  nav.idx = Number(event.state.idx) || 0;
  navRestore(snap);
  paintNavButtons();
});

document.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-nav]");
  if (!btn || btn.disabled) return;
  if (btn.dataset.nav === "back" && nav.idx > 0) history.back();
  if (btn.dataset.nav === "forward" && nav.idx < nav.max) history.forward();
});
// Alt+←/→ (글 쓰는 중에는 커서 이동이므로 건드리지 않는다). 맥은 ⌘[ / ⌘] — Option+←/→ 는 맥 글자 칸의
// 단어 단위 이동이라, 가로채면 메일을 쓰다가 화면이 넘어간다 (위 '맥 판')
document.addEventListener("keydown", (event) => {
  let dir = 0;
  if (IS_MAC) {
    if (!event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    // 자판 배열과 상관없이 같은 자리의 키 (한글 자판에서도 [ ] 자리)
    if (event.code === "BracketLeft") dir = -1;
    if (event.code === "BracketRight") dir = 1;
  } else {
    if (!event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "ArrowLeft") dir = -1;
    if (event.key === "ArrowRight") dir = 1;
  }
  if (!dir) return;
  event.preventDefault();
  if (dir < 0 && nav.idx > 0) history.back();
  if (dir > 0 && nav.idx < nav.max) history.forward();
});
// 마우스 옆 버튼 (뒤로 = 3, 앞으로 = 4)
document.addEventListener("mouseup", (event) => {
  if (event.button !== 3 && event.button !== 4) return;
  event.preventDefault();
  if (event.button === 3 && nav.idx > 0) history.back();
  if (event.button === 4 && nav.idx < nav.max) history.forward();
});

// 첫 화면을 기록의 시작으로
history.replaceState({ nav: navSnapshot(), idx: 0 }, "");
paintNavButtons();


/* ===== 앱 안 확인·입력 창 =====
   예전에는 window.confirm / prompt 를 썼는데, WebView 가 '127.0.0.1:8765의 메시지' 라는
   회색 시스템 창을 띄워 앱 디자인과 전혀 맞지 않았다. 모두 이 창으로 바꿨다.
   - uiConfirm(메시지, {title, ok, cancel, danger}) → true / false
   - uiPrompt(메시지, 기본값, {title, placeholder, type}) → 문자열 / null
   - uiChoose(제목, [{label, sub}]) → 고른 번호 / null
   - uiButtons(메시지, [{label, value, primary, danger}], {title}) → value / null (Esc·바깥 = null) */
function appDialog({
  title = "",
  message = "",
  ok = "확인",
  cancel = "취소",
  danger = false,
  input = null,
  choices = null,
  buttons = null,
  icon = "",
} = {}) {
  return new Promise((resolve) => {
    const dlg = document.createElement("dialog");
    dlg.className = "app-dialog";
    let result = null;
    const head = title
      ? `<div class="app-dialog-head">
           ${icon ? `<span class="app-dialog-icon${danger ? " danger" : ""}">${iconHtml(icon)}</span>` : ""}
           <h2>${escapeHtml(title)}</h2>
         </div>`
      : "";
    const msg = message ? `<p class="app-dialog-msg">${escapeHtml(message)}</p>` : "";
    const field = input
      ? `<input class="app-dialog-input" type="${escapeHtml(input.type || "text")}"
           value="${escapeHtml(input.value ?? "")}" placeholder="${escapeHtml(input.placeholder || "")}" />`
      : "";
    const list = choices
      ? `<div class="app-dialog-choices">${choices
          .map(
            (c, i) => `<button type="button" class="app-dialog-choice" data-choice="${i}">
               ${c.icon ? iconHtml(c.icon) : ""}
               <span><b>${escapeHtml(c.label)}</b>${c.sub ? `<small>${escapeHtml(c.sub)}</small>` : ""}</span>
             </button>`,
          )
          .join("")}</div>`
      : "";
    const actionButtons = buttons
      ? buttons
          .map(
            (b, i) =>
              `<button type="button" class="button${b.primary ? " primary" : ""}${b.danger ? " danger" : ""}" data-btn="${i}">${escapeHtml(b.label)}</button>`,
          )
          .join("")
      : `${cancel ? `<button type="button" class="button ghost" data-act="cancel">${escapeHtml(cancel)}</button>` : ""}
         ${choices ? "" : `<button type="button" class="button ${danger ? "danger" : "primary"}" data-act="ok">${escapeHtml(ok)}</button>`}`;
    dlg.innerHTML = `${head}${msg}${field}${list}<div class="app-dialog-actions">${actionButtons}</div>`;

    // 'close' 이벤트만 기다리면 창이 화면에 안 그려지는 동안(가려진 창 등) 결과가 늦게/안 온다.
    // 버튼을 누르는 즉시 결과를 넘기고 창을 치운다. Esc 는 cancel 이벤트로 받는다.
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      result = value;
      if (dlg.open) dlg.close();
      dlg.remove();
      resolve(result);
    };
    dlg.addEventListener("cancel", (event) => {
      event.preventDefault();
      finish(null);
    });
    dlg.addEventListener("click", (event) => {
      if (clickedBackdrop(dlg, event)) return finish(null); // 바깥(어두운 막)을 누르면 취소
      const choice = event.target.closest("[data-choice]");
      if (choice) return finish(Number(choice.dataset.choice));
      const b = event.target.closest("[data-btn]");
      if (b) return finish(buttons[Number(b.dataset.btn)].value);
      const act = event.target.closest("[data-act]")?.dataset.act;
      if (act === "cancel") return finish(null);
      if (act === "ok") return finish(input ? dlg.querySelector(".app-dialog-input").value : true);
    });
    dlg.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && input && !event.isComposing) {
        event.preventDefault();
        finish(dlg.querySelector(".app-dialog-input").value);
      }
    });
    dlg.addEventListener("close", () => finish(result));
    document.body.append(dlg);
    dlg.showModal();
    const focus = dlg.querySelector(".app-dialog-input") || dlg.querySelector("[data-act=ok], .button.primary, [data-choice]");
    focus?.focus();
    if (focus?.select && input) focus.select();
  });
}

/* 창 안쪽 여백을 눌러도 event.target 이 dialog 자신이라, 좌표로 '정말 바깥' 인지 본다 */
function clickedBackdrop(dlg, event) {
  if (event.target !== dlg) return false;
  const r = dlg.getBoundingClientRect();
  return event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom;
}

async function uiConfirm(message, opts = {}) {
  const res = await appDialog({
    title: opts.title || "확인",
    icon: opts.icon || (opts.danger ? "trash" : "help"),
    message,
    ok: opts.ok || "확인",
    cancel: opts.cancel ?? "취소",
    danger: Boolean(opts.danger),
  });
  return res === true;
}

async function uiPrompt(message, value = "", opts = {}) {
  const res = await appDialog({
    title: opts.title || "",
    icon: opts.icon || "edit",
    message,
    ok: opts.ok || "확인",
    input: { value, placeholder: opts.placeholder || "", type: opts.type || "text" },
  });
  return res === null ? null : String(res);
}

function uiChoose(title, items, opts = {}) {
  return appDialog({ title, icon: opts.icon || "folder", message: opts.message || "", choices: items, cancel: "취소" });
}

function uiButtons(message, buttons, opts = {}) {
  return appDialog({ title: opts.title || "", icon: opts.icon || "help", message, buttons });
}


/* ===== 메일 첨부: Drive 창 =====
   예전에는 파일 20개를 번호로 늘어놓고 번호를 적게 했다(시스템 입력창).
   이제 Drive 처럼 폴더를 열어 들어가고, 검색하고, 여러 개를 골라 한 번에 붙인다.
   앱 권한(drive.file) 때문에 이 앱이 올린 파일만 보인다 — 강의자료는 전부 여기 있다. */
const DRIVE_FOLDER = "application/vnd.google-apps.folder";
const DRIVE_ATTACH_MAX = 20 * 1024 * 1024; // 서버(/api/drive/get)와 같은 한도

function driveFileIcon(mime) {
  if (mime === DRIVE_FOLDER) return "folder";
  return "file";
}

function driveKind(mime, name) {
  const ext = String(name || "").split(".").pop().toLowerCase();
  if (String(mime).startsWith("application/vnd.google-apps.")) return "구글 문서 → PDF";
  return ext && ext.length <= 5 ? ext.toUpperCase() : "파일";
}

async function openDrivePicker() {
  const dlg = document.createElement("dialog");
  dlg.className = "app-dialog drive-picker";
  dlg.innerHTML = `
    <div class="app-dialog-head">
      <span class="app-dialog-icon drive">
        <svg viewBox="0 0 87.3 78" aria-hidden="true"><path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/><path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/><path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/><path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/><path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/><path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/></svg>
      </span>
      <h2>Drive에서 첨부</h2>
      <button type="button" class="whats-new-close" data-act="cancel" aria-label="닫기">${iconHtml("x")}</button>
    </div>
    <div class="drive-picker-tools">
      <nav class="drive-crumbs" aria-label="폴더 위치"></nav>
      <label class="drive-search">${iconHtml("search")}<input type="search" placeholder="Drive에서 파일 이름 찾기" /></label>
    </div>
    <div class="drive-list" role="listbox" aria-multiselectable="true"></div>
    <div class="app-dialog-actions">
      <span class="drive-picked"></span>
      <button type="button" class="button ghost" data-act="cancel">취소</button>
      <button type="button" class="button primary" data-act="ok" disabled>첨부하기</button>
    </div>`;
  document.body.append(dlg);

  const list = dlg.querySelector(".drive-list");
  const crumbs = dlg.querySelector(".drive-crumbs");
  const search = dlg.querySelector(".drive-search input");
  const okBtn = dlg.querySelector("[data-act=ok]");
  const pickedText = dlg.querySelector(".drive-picked");
  const trail = [{ id: "root", name: "내 드라이브" }];
  const picked = new Map(); // id → {id, name, size, mimeType}
  let seq = 0;

  const syncPicked = () => {
    okBtn.disabled = picked.size === 0;
    okBtn.textContent = picked.size ? `${picked.size}개 첨부하기` : "첨부하기";
    const total = [...picked.values()].reduce((n, f) => n + Number(f.size || 0), 0);
    pickedText.textContent = picked.size ? `고른 파일 ${picked.size}개 · ${formatBytes(total)}` : "";
  };

  const rowHtml = (f) => {
    const folder = f.mimeType === DRIVE_FOLDER;
    const on = picked.has(f.id);
    // 메일 한 통에 붙일 수 있는 크기를 넘는 파일은 처음부터 못 고르게 한다
    const tooBig = !folder && Number(f.size || 0) > DRIVE_ATTACH_MAX;
    return `
      <div class="drive-row${folder ? " folder" : ""}${on ? " on" : ""}${tooBig ? " too-big" : ""}" role="option" aria-selected="${on}"
           aria-disabled="${tooBig}" title="${tooBig ? "20MB가 넘어 메일에 붙일 수 없어요" : ""}"
           data-id="${escapeHtml(f.id)}" tabindex="0">
        ${folder ? "" : `<span class="drive-check">${on ? iconHtml("check") : ""}</span>`}
        <span class="drive-row-icon">${iconHtml(driveFileIcon(f.mimeType))}</span>
        <span class="drive-row-name" title="${escapeHtml(f.name)}">${escapeHtml(f.name)}</span>
        <span class="drive-row-meta">${
          folder
            ? iconHtml("chevronDown")
            : `${escapeHtml(driveKind(f.mimeType, f.name))}${f.size ? ` · ${formatBytes(Number(f.size))}` : ""}${tooBig ? " · 너무 큼" : ""}`
        }</span>
      </div>`;
  };

  let current = { folders: [], files: [] };
  const load = async () => {
    const my = ++seq;
    const q = search.value.trim();
    crumbs.innerHTML = q
      ? `<span class="drive-crumb here">‘${escapeHtml(q)}’ 검색 결과</span>`
      : trail
          .map((c, i) =>
            i === trail.length - 1
              ? `<span class="drive-crumb here">${escapeHtml(c.name)}</span>`
              : `<button type="button" class="drive-crumb" data-crumb="${i}">${escapeHtml(c.name)}</button><span class="drive-crumb-sep">›</span>`,
          )
          .join("");
    list.innerHTML = `<p class="drive-empty">불러오는 중…</p>`;
    try {
      const params = new URLSearchParams(q ? { q } : { parent: trail[trail.length - 1].id });
      const data = await api(`/api/drive/list?${params}`);
      if (my !== seq) return; // 그새 다른 폴더를 열었다
      current = data;
      const rows = [...(data.folders || []), ...(data.files || [])];
      list.innerHTML = rows.length
        ? rows.map(rowHtml).join("")
        : `<p class="drive-empty">${q ? "찾는 파일이 없어요." : "빈 폴더예요."}</p>`;
    } catch (error) {
      if (my !== seq) return;
      list.innerHTML = `<p class="drive-empty">${escapeHtml(
        humanError ? humanError(error.message) : error.message,
      )}<br /><small>설정에서 구글 계정을 연결했는지 확인해 주세요.</small></p>`;
    }
  };

  const toggle = (row) => {
    const id = row.dataset.id;
    const f = [...(current.folders || []), ...(current.files || [])].find((x) => x.id === id);
    if (!f) return;
    if (f.mimeType === DRIVE_FOLDER) {
      search.value = "";
      trail.push({ id: f.id, name: f.name });
      load();
      return;
    }
    if (Number(f.size || 0) > DRIVE_ATTACH_MAX) {
      showToast("20MB가 넘는 파일은 메일에 붙일 수 없어요. Drive 링크로 보내 주세요.");
      return;
    }
    if (picked.has(id)) picked.delete(id);
    else picked.set(id, f);
    row.outerHTML = rowHtml(f);
    syncPicked();
  };

  list.addEventListener("click", (event) => {
    const row = event.target.closest(".drive-row");
    if (row) toggle(row);
  });
  list.addEventListener("keydown", (event) => {
    const row = event.target.closest(".drive-row");
    if (row && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      toggle(row);
    }
  });
  crumbs.addEventListener("click", (event) => {
    const i = event.target.closest("[data-crumb]")?.dataset.crumb;
    if (i === undefined) return;
    trail.splice(Number(i) + 1);
    load();
  });
  let timer = 0;
  search.addEventListener("input", () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(load, 250);
  });

  const chosen = await new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      if (dlg.open) dlg.close();
      dlg.remove();
      resolve(value);
    };
    dlg.addEventListener("click", (event) => {
      if (clickedBackdrop(dlg, event)) return finish(null);
      const act = event.target.closest("[data-act]")?.dataset.act;
      if (act === "cancel") finish(null);
      if (act === "ok" && picked.size) finish([...picked.values()]);
    });
    dlg.addEventListener("cancel", (event) => {
      event.preventDefault();
      finish(null);
    });
    dlg.addEventListener("close", () => finish(null));
    dlg.showModal();
    search.focus();
    load();
  });
  return chosen;
}

async function importFromDrive() {
  const files = await openDrivePicker();
  if (!files?.length) return;
  showTopProgress?.(`Drive에서 ${files.length}개 가져오는 중`, 30);
  let done = 0;
  const failed = [];
  for (const file of files) {
    try {
      const got = await api(`/api/drive/get?id=${encodeURIComponent(file.id)}`);
      state.attachments.push({ filename: got.filename, size: got.size, content: got.content });
      done += 1;
    } catch (error) {
      failed.push(file.name);
    }
  }
  renderAttachments();
  finishTopProgress?.(done ? "Drive 첨부 완료" : "Drive 첨부 실패");
  showToast(
    failed.length
      ? `${done}개 첨부, ${failed.length}개 실패 (${shortText(failed.join(", "), 40)})`
      : `${done}개 파일을 첨부했습니다.`,
  );
}


/* ===== 문의 · 오류 제보 · 아이디어 =====
   만든 사람(FEEDBACK_TO)에게 붕어빵 메일 쓰기로 바로 보낸다.
   종류를 고르면 받는 사람·제목·본문 서식이 채워지고, 앱 정보(버전·운영체제·화면)를 아래에 붙인다.
   오류 제보에는 최근 앱 오류 기록(server_errors.log 마지막 한 건)도 붙인다.
   메일 주소·비밀번호·파일 경로 같은 개인 정보는 붙이지 않는다 — 보내기 전에 사용자가 다 볼 수 있다. */
const FEEDBACK_TO = "tutleblue12@gmail.com";
const FEEDBACK_KINDS = [
  {
    label: "문의",
    sub: "쓰는 방법이 궁금해요",
    icon: "help",
    tag: "문의",
    body: ["■ 궁금한 점", "", "", "■ 어느 화면에서", "(예: 메일함 / 자료 / 시간표 / 설정)", ""],
  },
  {
    label: "오류 제보",
    sub: "잘 안 되거나 이상한 게 있어요",
    icon: "alert",
    tag: "오류 제보",
    body: [
      "■ 무슨 일이 있었나요",
      "",
      "",
      "■ 어떻게 하면 다시 생기나요 (누른 순서대로)",
      "1. ",
      "2. ",
      "3. ",
      "",
      "■ 원래는 어떻게 되길 바랐나요",
      "",
      "",
      "■ 화면을 찍은 사진이 있으면 '내 PC'로 첨부해 주세요",
      "",
    ],
  },
  {
    label: "아이디어",
    sub: "이런 기능이 있으면 좋겠어요",
    icon: "sparkle",
    tag: "아이디어",
    body: ["■ 있었으면 하는 기능", "", "", "■ 어떤 때 쓰고 싶나요", "", "", "■ 참고할 만한 앱이나 화면 (있으면)", ""],
  },
];

async function openFeedback() {
  const pick = await uiChoose(
    "무엇을 보낼까요?",
    FEEDBACK_KINDS.map((k) => ({ label: k.label, sub: k.sub, icon: k.icon })),
    { icon: "mail", message: `만든 사람(${FEEDBACK_TO})에게 메일로 보내요.` },
  );
  if (pick === null) return;
  const kind = FEEDBACK_KINDS[pick];
  if (!state.config?.schoolEmail) {
    showToast("설정 → 학교 계정에서 메일 계정을 먼저 넣어 주세요.");
    openSettings();
    return;
  }

  let info = {};
  try {
    info = await api("/api/diagnostics");
  } catch (error) {
    info = {};
  }
  const now = new Date();
  let themeKey = "";
  try {
    themeKey = localStorage.getItem("autosaver-theme-v2") || "";
  } catch (error) {
    /* 무시 */
  }
  const theme = THEMES.find((t) => t.key === themeKey)?.label;
  const lines = [
    "안녕하세요, Daling을 쓰고 있는 사용자입니다.",
    "",
    ...kind.body,
    "",
    "──────────────",
    "앱 정보 (자동으로 붙었어요. 빼도 괜찮아요)",
    `- 버전: ${info.version || "?"}${info.installed === false ? " (개발판)" : ""}`,
    `- 운영체제: ${info.os || navigator.userAgent}`,
    `- 화면: ${window.screen.width}×${window.screen.height}, 창 ${window.innerWidth}×${window.innerHeight}${theme ? `, 테마 ${theme}` : ""}`,
    `- 보낸 때: ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${hhmm(now)}`,
  ];
  if (kind.tag === "오류 제보") {
    if (info.lastFailure) lines.push(`- 마지막으로 실패한 작업: ${info.lastFailure}`);
    if (info.lastError) lines.push("", "최근 앱 오류 기록:", info.lastError);
  }

  if (state.view !== "emails") {
    switchView("emails");
    // 화면 전환은 늦게(최대 0.15초 뒤) 적용되며 메일함을 '목록' 으로 되돌린다. 그 뒤에 쓰기를 연다.
    for (let i = 0; i < 20 && state.view !== "emails"; i += 1) await new Promise((r) => setTimeout(r, 25));
    await new Promise((r) => setTimeout(r, 30));
  }
  openCompose({ to: FEEDBACK_TO, subject: `[Daling ${kind.tag}] `, body: lines.join("\n") });
  // 제목 뒤에 바로 이어 쓰게
  const subject = $("#composeForm [name=subject]");
  if (subject) {
    subject.focus();
    subject.setSelectionRange(subject.value.length, subject.value.length);
  }
}

$("#feedbackButton")?.addEventListener("click", openFeedback);
$("#settingsFeedbackButton")?.addEventListener("click", openFeedback);


/* ===== 과목별 교수·조교 =====
   LMS 코스 사용자에서 학생을 뺀 사람들(lms_crawler.fetch_course_staff, 1시간마다 마감 확인 때).
   LMS 는 이름만 주므로 이메일은 서버가 조직도에서 찾아 붙인다. 동명이인이라 못 고른 사람은 후보(candidates)를 준다. */
function staffKey(label) {
  return String(label || "").replace(/\s+/g, "").toLowerCase();
}

/* 교수·조교는 그 학기 그 분반에만 맞다(2026-10-09). 서버가 이번 학기 것(courses)과 지난 학기 것(past)을 나눠 주고,
   메일 꼬리표(people.byEmail)는 이번 학기 개설강좌의 담당교수 + 내 과목 조교로만 만든다.
   안 듣는 과목의 조교는 LMS 가 사람 목록을 막아(403) 모은다. */
function setCourseStaff(courses, past = {}, people = {}) {
  const map = new Map();
  Object.entries(courses || {}).forEach(([label, rows]) => map.set(staffKey(label), { label, rows: rows || [] }));
  const pastMap = new Map();
  Object.entries(past || {}).forEach(([label, item]) => pastMap.set(staffKey(label), { label, ...item }));
  state.courseStaff = map;
  state.courseStaffPast = pastMap;
  state.coursePeople = people?.byEmail || {};
  const sig = JSON.stringify([courses, past, people?.byEmail || {}]).length;
  if (state.courseStaffSig !== `${map.size}:${sig}`) {
    state.courseStaffSig = `${map.size}:${sig}`;
    renderedViews?.delete?.("courses");
    renderedViews?.delete?.("emails");
  }
}

/** 강의 카드 이름 → 그 과목의 교수·조교 (이번 학기에 없으면 지난 학기 것을 학기 표시와 함께) */
function staffForCourse(label) {
  return state.courseStaff?.get(staffKey(label))?.rows || state.courseStaffPast?.get(staffKey(label))?.rows || [];
}

function staffTermNote(label) {
  if (state.courseStaff?.get(staffKey(label))) return "";
  return state.courseStaffPast?.get(staffKey(label))?.termLabel || "";
}

/** '03' → '3분반' */
function sectionText(section) {
  const n = String(section || "").replace(/^0+(?=\d)/, "");
  return n ? `${n}분반` : "";
}

/** 꼬리표 한 마디: '일반물리Ⅱ 3분반 교수', 영어 화면은 'General Physics II · Sec. 3 · Professor'.
   한 문자열로 이어 붙여 두면 화면 번역(tr)이 마디를 못 나눠 영어 화면에서도 한국어로 남았다(2026-10-14). */
function staffHitText(course, section, role) {
  if (I18N.lang !== "en") return `${course} ${sectionText(section)} ${role}`.replace(/\s+/g, " ").trim();
  const n = String(section || "").replace(/^0+(?=\d)/, "");
  return [tr(course), n ? `Sec. ${n}` : "", tr(role)].filter(Boolean).join(" · ");
}

/** 메일 보낸 사람 주소 → '일반물리Ⅱ 3분반 교수 · 외 2분반' (이번 학기만). mine: 내가 듣는 과목·분반인지 */
function coursePersonTag(email) {
  const hits = (state.coursePeople || {})[String(email || "").toLowerCase()] || [];
  if (!hits.length) return null;
  const first = hits[0];
  const same = hits.filter((h) => h.title === first.title && h.role === first.role && h !== first);
  const others = hits.filter((h) => h.title !== first.title || h.role !== first.role);
  const text = staffHitText(first.title, first.section, first.role);
  const extra = [];
  if (same.length) extra.push(`외 ${same.length}개 분반`);
  if (others.length) extra.push(`${others.length}과목 더`);
  const full = hits.map((h) => `${staffHitText(h.title, h.section, h.role)}${h.mine ? tr(" (내 수업)") : ""}`).join("\n");
  return { text, extra: extra.join(" · "), mine: Boolean(first.mine), full };
}

function coursePersonTagHtml(email) {
  const tag = coursePersonTag(email);
  if (!tag) return "";
  return `<span class="person-course${tag.mine ? " mine" : ""}" title="${escapeHtml(tag.full)}">${escapeHtml(tag.text)}${
    tag.extra ? `<em>${escapeHtml(tag.extra)}</em>` : ""
  }</span>`;
}

/** 메일 자동완성에 넣을 교수·조교 (이메일을 아는 사람만) */
function staffContacts() {
  const out = [];
  (state.courseStaff || new Map()).forEach(({ label, rows }) => {
    const course = courseShortName(label);
    rows.forEach((s) => {
      // alias: LMS 영어 과목명 + 한글 이름. 어느 쪽으로 쳐도 찾히게 (꼬리표는 화면 언어 하나뿐이라)
      if (s.email) out.push({ name: s.name, email: s.email, tag: staffHitText(course, s.section, s.role), alias: `${label} ${course}` });
    });
  });
  return out;
}

function staffTagFor(email) {
  const e = String(email || "").toLowerCase();
  return staffContacts()
    .filter((s) => s.email.toLowerCase() === e)
    .map((s) => s.tag)
    .join(", ");
}

/** 'General PhysicsⅡ' → '일반물리Ⅱ' (수강 과목의 한글 이름이 있으면 그걸로) */
function courseShortName(label) {
  const hit = (state.courseState?.current || []).find((c) => staffKey(extractCourseLabelJs(c.name)) === staffKey(label));
  const korean = hit && hit.name.includes("(") ? hit.name.split("(", 1)[0].trim() : "";
  return korean || label;
}

function courseStaffLine(course) {
  const rows = staffForCourse(course.label);
  if (!rows.length) return "";
  const person = (s, i) => {
    const can = s.email || (s.candidates || []).length;
    return `<button type="button" class="course-staff-person${s.email ? "" : " unsure"}" data-staff="${escapeHtml(course.label)}"
        data-i="${i}" ${can ? "" : "disabled"}
        title="${escapeHtml(s.email ? `${s.name} <${s.email}> 에게 메일 쓰기` : (s.candidates || []).length ? `동명이인 ${s.candidates.length}명 — 눌러서 고르기` : "조직도에서 이메일을 못 찾았어요")}">
        <em>${escapeHtml(s.role)}${s.section ? ` · ${escapeHtml(sectionText(s.section))}` : ""}</em>${escapeHtml(s.name)}${can ? iconHtml("mail") : ""}</button>`;
  };
  const note = staffTermNote(course.label);
  return `<div class="course-staff">${rows.map(person).join("")}${
    note ? `<span class="course-staff-term" title="교수·조교는 그 학기에만 맞아요">${escapeHtml(note)} 기준</span>` : ""
  }</div>`;
}

/** 강의 카드에서 교수·조교 이름을 누르면 그 사람에게 메일 쓰기 */
async function mailCourseStaff(label, index) {
  const s = staffForCourse(label)[index];
  if (!s) return;
  let email = s.email;
  let dept = s.dept;
  if (!email) {
    const pick = await uiChoose(
      `${s.name} ${s.role}님이 누구일까요?`,
      (s.candidates || []).map((c) => ({ label: s.name, sub: `${c.dept || ""} · ${c.email}`, icon: "user" })),
      { icon: "user", message: "조직도에 이름이 같은 사람이 여럿이라 직접 골라 주세요." },
    );
    if (pick === null) return;
    email = s.candidates[pick].email;
    dept = s.candidates[pick].dept;
  }
  const course = courseShortName(label);
  if (state.view !== "emails") {
    switchView("emails");
    for (let i = 0; i < 20 && state.view !== "emails"; i += 1) await new Promise((r) => setTimeout(r, 25));
    await new Promise((r) => setTimeout(r, 30));
  }
  const sec = sectionText(s.section);
  openCompose({
    to: formatRecipient({ name: `${s.name}/${course} ${sec} ${s.role}`.replace(/\s+/g, " "), email }),
    // 분반까지 적어야 다른 분반 조교·교수와 헷갈리지 않는다 (사용자가 직접 쓰던 제목 꼴: [일반화학II 02분반])
    subject: `[${course}${s.section ? ` ${s.section}분반` : ""}] `,
  });
  const subject = $("#composeForm [name=subject]");
  if (subject) {
    subject.focus();
    subject.setSelectionRange(subject.value.length, subject.value.length);
  }
  void dept;
}

$("#courseGrid")?.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-staff]");
  if (!btn) return;
  event.stopPropagation();
  mailCourseStaff(btn.dataset.staff, Number(btn.dataset.i));
});

/* ===== 메일함 칸 나누기: 끌어서 너비 조절 · 폴더 칸 접기 =====
   '세 칸이 정보량이 너무 많다' 는 말을 듣고 넣었다. 칸 사이 손잡이를 끌어 너비를 바꾸고,
   폴더 칸은 접어 둘 수 있다. 메일을 쓰는 동안은 폴더·목록 칸을 잠시 접는다(showMailPane).
   너비·접힘은 앱 창 저장소가 끌 때마다 지워지므로 ui_prefs.json 에 둔다. */
const MAIL_LAYOUT_DEFAULT = { railW: 232, listW: 380, railFolded: false };
state.mailLayout = { ...MAIL_LAYOUT_DEFAULT };

/** 좁은 메일 영역에서는 폴더 칸이 위쪽 가로 띠로 눕는다 (그때는 너비·접기가 뜻이 없다) */
function mailRailIsStrip() {
  const el = $("#view-emails");
  return !!el && el.clientWidth <= 860;
}

function applyMailLayout() {
  const app = $("#mailApp");
  if (!app) return;
  app.style.setProperty("--mail-rail-w", `${state.mailLayout.railW}px`);
  app.style.setProperty("--mail-list-w", `${state.mailLayout.listW}px`);
  app.classList.toggle("rail-folded", Boolean(state.mailLayout.railFolded));
}

let mailLayoutTimer = 0;
function saveMailLayout() {
  window.clearTimeout(mailLayoutTimer);
  mailLayoutTimer = window.setTimeout(() => {
    api("/api/ui-prefs", { method: "POST", body: JSON.stringify({ mailLayout: state.mailLayout }) }).catch(() => {});
  }, 400);
}

function setMailRailFolded(folded, save) {
  state.mailLayout.railFolded = folded;
  applyMailLayout();
  if (save) saveMailLayout();
}

// 처음 켤 때 저장된 너비를 가져온다
api("/api/ui-prefs")
  .then((prefs) => {
    const l = prefs?.mailLayout || {};
    state.mailLayout = {
      railW: Number(l.railW) || MAIL_LAYOUT_DEFAULT.railW,
      listW: Number(l.listW) || MAIL_LAYOUT_DEFAULT.listW,
      railFolded: Boolean(l.railFolded),
    };
    applyMailLayout();
  })
  .catch(() => applyMailLayout());
applyMailLayout();

$("#mailRailFold")?.addEventListener("click", () => setMailRailFolded(true, true));

// 손잡이 끌기
(function bindMailSplitters() {
  let drag = null;
  document.addEventListener("pointerdown", (event) => {
    const handle = event.target.closest(".mail-split");
    if (!handle || event.button !== 0) return;
    event.preventDefault();
    const which = handle.dataset.split;
    const pane = which === "rail" ? $("#mailRail") : $("#mailListPane");
    drag = { which, left: pane.getBoundingClientRect().left, handle };
    handle.setPointerCapture?.(event.pointerId);
    document.body.classList.add("mail-resizing");
  });
  document.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const width = Math.round(event.clientX - drag.left);
    if (drag.which === "rail") {
      // 맨 왼쪽(120px 아래)까지 끌면 접는다
      if (width < 120) {
        if (!state.mailLayout.railFolded) setMailRailFolded(true, false);
        return;
      }
      state.mailLayout.railFolded = false;
      state.mailLayout.railW = Math.max(160, Math.min(360, width));
    } else {
      const max = Math.max(300, ($("#view-emails")?.clientWidth || 1200) - state.mailLayout.railW - 420);
      state.mailLayout.listW = Math.max(280, Math.min(Math.min(720, max), width));
    }
    applyMailLayout();
  });
  const end = () => {
    if (!drag) return;
    drag = null;
    document.body.classList.remove("mail-resizing");
    saveMailLayout();
  };
  document.addEventListener("pointerup", end);
  document.addEventListener("pointercancel", end);
  // 두 번 누르면 원래 너비로
  document.addEventListener("dblclick", (event) => {
    const handle = event.target.closest(".mail-split");
    if (!handle) return;
    if (handle.dataset.split === "rail") {
      state.mailLayout.railW = MAIL_LAYOUT_DEFAULT.railW;
      state.mailLayout.railFolded = false;
    } else {
      state.mailLayout.listW = MAIL_LAYOUT_DEFAULT.listW;
    }
    applyMailLayout();
    saveMailLayout();
  });
})();

/* ===== 창 제목 줄 = 상단 바 (Spotify 처럼) =====
   설치 앱은 회색 기본 제목 줄을 없앤다(window_chrome.py). 그러면 상단 바 빈 곳을 끌어 창을 옮기고(두 번 누르면 최대화),
   오른쪽 끝 단추로 최소화·최대화·닫기를 한다. 개발 서버(브라우저)에서는 custom=false 라 아무것도 안 바뀐다. */
(function bindWindowChrome() {
  const box = $("#winControls");
  if (!box) return;
  const maxBtn = $("#winMax");
  const paintMax = (maximized) => {
    // Segoe 아이콘: E922 최대화, E923 이전 크기로
    maxBtn.innerHTML = maximized ? "&#xE923;" : "&#xE922;";
    const label = maximized ? tr("이전 크기로") : tr("최대화");
    maxBtn.title = label;
    maxBtn.setAttribute("aria-label", label);
    document.documentElement.classList.toggle("win-maximized", !!maximized);
  };
  // 단추 높이를 상단 바 첫 줄에 맞춘다 (상단 바 높이는 화면 폭마다 다르다)
  const fitHeight = () => {
    const bar = document.querySelector(".topbar");
    const h = bar && bar.offsetHeight ? Math.min(bar.offsetHeight, 64) : 48;
    document.documentElement.style.setProperty("--winctl-h", `${h}px`);
    // 설정 판은 상단 바 아래부터 덮는다(스크롤 막대가 창 끝까지 올라가지 않게)
    if (bar && bar.offsetHeight) document.documentElement.style.setProperty("--topbar-h", `${bar.offsetHeight}px`);
  };
  const refresh = () =>
    api("/api/window")
      .then((st) => paintMax(st.maximized))
      .catch(() => {});
  api("/api/window")
    .then((st) => {
      if (!st || !st.custom) return;
      document.documentElement.classList.add("custom-frame");
      placeMailSearch(); // 메일함에서 켜졌으면 검색창을 상단 바로
      box.hidden = false;
      paintMax(st.maximized);
      fitHeight();
      let timer = 0;
      window.addEventListener("resize", () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          fitHeight();
          refresh();
        }, 120);
      });
      box.addEventListener("click", (event) => {
        const btn = event.target.closest("[data-win]");
        if (!btn) return;
        api("/api/window", { method: "POST", body: JSON.stringify({ action: btn.dataset.win }) })
          .then((st) => paintMax(st.maximized))
          .catch(() => {});
      });
    })
    .catch(() => {});
})();

// 제목 줄 모드에서는 동기화 시각 글을 숨기므로, 같은 글을 새로고침 단추의 풍선 도움말로 옮겨 둔다
(function mirrorLastSync() {
  const src = $("#lastSync");
  const btn = $("#refreshAllButton");
  if (!src || !btn) return;
  const base = btn.title;
  const sync = () => {
    const text = (src.textContent || "").trim();
    btn.title = text ? `${text}\n${base}` : base;
  };
  new MutationObserver(sync).observe(src, { childList: true, characterData: true, subtree: true });
  sync();
})();

/* ===== 실행 로그: 설정에서만 여는 떠 있는 창 =====
   오른쪽에 늘 붙어 있던 '실행 로그' 손잡이는 거추장스럽다고 해서 뺐다(2026-10-14). 로그 상자·진행 표시는 그대로
   쌓이고(#logBox), 설정의 '실행 로그' 단추로 오른쪽에 띄워 본다. 진행은 상단 바 물방울이 보여 준다. */
(function bindLogPanel() {
  const root = document.documentElement;
  const setOpen = (open) => {
    root.classList.toggle("log-open", open);
    if (open) $("#closeLogButton")?.focus();
  };
  $("#openLogButton")?.addEventListener("click", () => setOpen(true));
  $("#closeLogButton")?.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && root.classList.contains("log-open")) setOpen(false);
  });
})();

/* ===== 메일함: 메일 검색창을 상단 바 가운데로 =====
   제목 줄 모드에서 메일함은 전역 검색(메일함 자체 검색과 겹침)·새로고침을 숨겨 상단 바 가운데가 텅 비었다
   ('메일 화면에서는 왜 위가 비어?'). 그 자리에 메일 검색창을 옮겨 놓고, 메일함을 떠나면 제자리로 돌린다.
   요소를 통째로 옮기므로 입력·리스너는 그대로다. 휴대폰 폭(≤760px)은 상단 바가 두 줄이라 옮기지 않는다. */
// 목록 위 줄의 새로고침·검색·정렬·보기 단추를 상단 바로 올린다(사용자: '상단 바로 합쳐서 한 줄을 없애줘').
// 제자리로 돌려놓을 수 있게 처음 자리에 표시(주석 노드)를 남겨 둔다.
const MAIL_TOOL_MARKS = new Map();
function placeMailSearch() {
  const topbar = document.querySelector(".topbar");
  const globalSearch = topbar?.querySelector(".search-wrap:not(.email-search)");
  const row = document.querySelector(".mail-topbar");
  const tools = ["#mailRefreshButton", ".email-search", "#emailSortSelect", ".mail-topbar .view-toggle"]
    .map((sel) => MAIL_TOOL_MARKS.get(sel)?.el || document.querySelector(sel))
    .filter(Boolean);
  if (!topbar || !globalSearch || !row || tools.length < 4) return;
  const sels = ["#mailRefreshButton", ".email-search", "#emailSortSelect", ".mail-topbar .view-toggle"];
  sels.forEach((sel, i) => {
    if (!MAIL_TOOL_MARKS.has(sel)) {
      const mark = document.createComment(`mail-tool ${sel}`);
      tools[i].before(mark);
      MAIL_TOOL_MARKS.set(sel, { el: tools[i], mark });
    }
  });
  const up =
    document.documentElement.classList.contains("custom-frame") &&
    document.querySelector(".app-shell")?.classList.contains("mail-focus") &&
    window.innerWidth > 760;
  let wrap = $("#topbarMail");
  if (up) {
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "topbarMail";
      wrap.className = "topbar-mail";
    }
    if (wrap.parentElement !== topbar) globalSearch.after(wrap);
    // 검색창이 가운데 오도록: 새로고침 · 검색 · 정렬 · 보기
    tools.forEach((el) => {
      if (el.parentElement !== wrap) wrap.append(el);
    });
  } else if (wrap?.parentElement) {
    MAIL_TOOL_MARKS.forEach(({ el, mark }) => mark.after(el));
    wrap.remove();
  }
  tools[1].classList.toggle("in-topbar", up);
  row.classList.toggle("emptied", up);
}
window.addEventListener("resize", () => placeMailSearch());


/* ===== AI 도우미 (ai_cli.py: Claude · Gemini · Codex CLI) =====
   2026-10-15 사용자: 'AI CLI 를 탑재해 번역·자연어 검색·메일 초안을 쓰자. 세 CLI 를 모두 고를 수 있게.
   교수·조교에게 쓰는 메일은 학번·자기소개·과목·분반을 매번 쓰니 미리 받아 두자.'
   - 고른 AI 와 '내 정보' 는 설정의 'AI 도우미' 칸에서 정한다(ai_profile.json).
   - 메일 내용이 고른 AI 회사로 나간다. 그래서 버튼을 눌렀을 때만 돌고, 자동으로는 돌지 않는다. */
state.ai = { status: null, search: null };

async function loadAiStatus(force = false) {
  if (state.ai.status && !force) return state.ai.status;
  try {
    state.ai.status = await api("/api/ai/status");
  } catch (error) {
    state.ai.status = { available: {}, profile: {} };
  }
  paintAiSettings();
  paintAiModelPicker();
  paintAiModelButton();
  return state.ai.status;
}
// 실험실 켜기 스위치는 없앴다(2026-10-20 사용자: '어차피 /ai 쳐서 쓸 거니까, 메일 창에서 만지게').
// AI CLI 가 하나라도 깔려 있으면 /ai·모델 단추가 보인다. 내용은 /ai·단추를 눌렀을 때만 AI 로 간다.
const aiReady = () => Object.values(state.ai.status?.available || {}).some(Boolean);
const aiOn = aiReady;

/* --- 자연어 검색 --- */
function withAiSearch(query, grouped) {
  const out = grouped.slice();
  const s = state.ai.search;
  if (s && s.q === query) {
    let items;
    if (s.loading) items = [{ title: "AI 가 찾는 중…", sub: `${s.engine || "AI"} · 10초쯤 걸려요`, run: () => {}, keepOpen: true }];
    else if (s.error) items = [{ title: s.error, sub: "다시 누르면 다시 물어봐요", run: () => runAiSearch(query), keepOpen: true }];
    else if (!s.items.length) items = [{ title: "AI 도 맞는 걸 못 찾았어요", sub: s.note || "다른 말로 물어보세요", run: () => {}, keepOpen: true }];
    else items = s.items;
    const found = s.note ? "AI 가 찾은 것 · " + s.note : "AI 가 찾은 것";
    out.unshift({ key: "ai", label: s.loading || s.error ? "AI 검색" : found, total: items.length, items });
  }
  if (query.trim().length >= 2 && aiReady() && !(s && s.q === query && (s.loading || s.items?.length))) {
    out.push({
      key: "ai",
      label: "AI 에게 물어보기",
      total: 1,
      items: [{ title: `'${query}' 를 말로 찾기`, sub: "예: 지난주 물리 실험 보고서 양식 · 교수님이 보낸 시험 범위 메일", run: () => runAiSearch(query), keepOpen: true }],
    });
  }
  return out;
}

async function runAiSearch(query) {
  await loadAiStatus();
  if (!aiReady()) {
    showToast("AI CLI(Claude·Gemini·Codex)가 설치되어 있지 않아요. 설정 → AI 도우미를 봐 주세요.");
    return;
  }
  // 화면이 가진 후보를 모두 모아 짧게 줄여 보낸다. id 는 이 목록의 순번이라, 모델이 지어낸 id 는 걸러진다.
  const all = buildSearchResults(query, { all: true }).filter((r) => ["course", "file", "deadline", "mail", "event", "notice"].includes(r.group));
  const index = all.slice(0, 1500).map((r, i) => ({ id: String(i), kind: r.group, title: String(r.title || "").slice(0, 120), sub: String(r.sub || "").slice(0, 80), date: String(r.date || "").slice(0, 10) }));
  state.ai.search = { q: query, loading: true, items: [], engine: providerLabel() };
  renderSearchPop();
  try {
    const res = await api("/api/ai/search", { method: "POST", body: JSON.stringify({ query, index }) });
    const items = (res.ids || []).map((id) => all[Number(id)]).filter(Boolean).map((r) => ({ ...r, sub: r.sub }));
    state.ai.search = { q: query, loading: false, items, note: res.note || "", engine: res.engine };
  } catch (error) {
    state.ai.search = { q: query, loading: false, items: [], error: humanError(error) };
  }
  if ($("#searchInput")?.value.trim() === query) renderSearchPop();
}

/* 지금 쓸 모델: 고른 것 → 없으면 그 CLI(자동이면 설치된 첫 CLI)의 기본 모델 */
function currentAiModel() {
  const st = state.ai.status || {};
  const models = st.models || {};
  const provider = st.profile?.provider || ["claude", "gemini", "codex"].find((k) => models[k]) || "";
  const list = models[provider]?.models || [];
  const id = st.profile?.model && st.profile?.provider === provider ? st.profile.model : models[provider]?.default || "";
  const label = list.find((m) => m.id === id)?.label || id || "AI";
  return { provider, id, label };
}

function paintAiModelPicker() {
  const now = currentAiModel();
  const btnLabel = $("#aiDraftModelName");
  if (btnLabel) btnLabel.textContent = now.label;
  const sel = $("#aiModelSelect");
  if (!sel) return;
  const names = { claude: "Claude", gemini: "Gemini", codex: "Codex" };
  const models = state.ai.status?.models || {};
  sel.innerHTML = Object.entries(models)
    .map(([p, info]) => {
      const opts = (info.models || [])
        .map((m) => {
          const selected = p === now.provider && m.id === now.id ? " selected" : "";
          return `<option value="${p}|${escapeHtml(m.id)}"${selected}>${escapeHtml(m.label)}</option>`;
        })
        .join("");
      return `<optgroup label="${names[p] || p}">${opts}</optgroup>`;
    })
    .join("");
}

function providerLabel() {
  // 단추·안내에는 회사 이름보다 모델 이름(Opus 5.5, GPT-6-Astra …)을 보인다
  return currentAiModel().label;
}

/* --- 설정: 쓸 AI 고르기 + 내 정보 --- */
const AI_PROVIDERS = [
  ["", "자동"],
  ["claude", "Claude"],
  ["gemini", "Gemini"],
  ["codex", "Codex"],
];

function paintAiSettings() {
  const st = state.ai.status;
  if (!st) return;
  const on = aiOn();
  // 메일 쓰기의 모델 단추·/ai 안내는 AI CLI 가 있으면 보인다 (설정 카드가 없어도 칠한다)
  if ($("#aiDraftToggle")) $("#aiDraftToggle").hidden = !on;
  if ($("#mailFlowAiHint")) $("#mailFlowAiHint").hidden = !on;
  if ($("#aiDraftBox")) $("#aiDraftBox").hidden = true; // 채팅식 초안 칸은 쓰지 않는다(2026-10-21)
  const box = $("#aiProviders");
  if (!box) return;
  const chosen = st.profile?.provider || "";
  box.innerHTML = AI_PROVIDERS.map(([key, label]) => {
    const has = key ? Boolean(st.available?.[key]) : aiReady();
    const note = key ? (has ? "설치됨" : "없음") : "설치된 것부터";
    return `<button type="button" class="ai-provider${chosen === key ? " on" : ""}${has ? "" : " missing"}" data-provider="${key}" role="radio" aria-checked="${chosen === key}">
      <strong>${escapeHtml(label)}</strong><span>${escapeHtml(note)}</span></button>`;
  }).join("");
}

async function saveAiProfile(extra = {}) {
  const payload = {
    provider: state.ai.status?.profile?.provider || "",
    model: state.ai.status?.profile?.model || "",
    enabled: state.ai.status?.profile?.enabled || "",
    ...extra,
  };
  const res = await api("/api/ai/profile", { method: "POST", body: JSON.stringify(payload) });
  state.ai.status = { ...(state.ai.status || {}), profile: res.profile };
  paintAiSettings();
  paintAiModelPicker();
  return res.profile;
}

$("#aiProviders")?.addEventListener("click", async (event) => {
  const btn = event.target.closest("[data-provider]");
  if (!btn) return;
  const key = btn.dataset.provider;
  if (key && !state.ai.status?.available?.[key]) {
    showToast(`${btn.querySelector("strong").textContent} CLI 가 이 PC 에 없어요. 먼저 설치하고 터미널에서 한 번 로그인해 주세요.`);
    return;
  }
  try {
    await saveAiProfile({ provider: key, model: "" });
    showToast(key ? `${btn.querySelector("strong").textContent} 를 쓸게요` : "설치된 AI 를 자동으로 고를게요");
  } catch (error) {
    showToast(humanError(error));
  }
});

/* --- 메일 초안 --- */
// 받는 사람 칸의 첫 주소 → 이름·주소, 그 사람이 맡은 과목·분반(내 수업 먼저)
function aiDraftContext() {
  const form = $("#composeForm");
  const toRaw = String(form?.elements.to.value || "");
  const email = (toRaw.match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/) || [""])[0].toLowerCase();
  const name = toRaw.split(/[<,]/)[0].trim().replace(/^"|"$/g, "");
  const hits = (state.coursePeople || {})[email] || [];
  const hit = hits.find((h) => h.mine) || hits[0];
  const plain = document.createElement("div");
  plain.innerHTML = composeBody();
  return {
    to: [name && name !== email ? name : "", email].filter(Boolean).join(" "),
    role: hit?.role || "",
    course: hit?.title || "",
    section: sectionText(hit?.section),
    subject: form?.elements.subject.value || "",
    body: (plain.innerText || "").trim().slice(0, 6000),
    candidates: aiDraftCandidates(),
  };
}

// 받는 사람·참조 후보: 내가 듣는 과목의 교수·조교(주소를 아는 사람)만. AI 는 이 안에서만 고를 수 있다.
function aiDraftCandidates() {
  const out = [];
  const seen = new Set();
  (state.courseStaff || new Map()).forEach(({ label, rows }) => {
    (rows || []).forEach((r) => {
      const email = String(r.email || "").toLowerCase();
      if (!email || seen.has(email)) return;
      const hits = (state.coursePeople || {})[email] || [];
      if (!hits.some((h) => h.mine)) return;
      seen.add(email);
      out.push({ email, name: r.name || "", role: r.role || "", course: courseShortName(label), section: sectionText(r.section) });
    });
  });
  return out.slice(0, 80);
}

function paintAiDraftContext() {
  const ctx = aiDraftContext();
  const p = state.mailMe?.me || {};
  const bits = [];
  if (ctx.course) bits.push(`${ctx.course}${ctx.section ? ` ${ctx.section}` : ""} ${ctx.role}`.trim());
  bits.push(p.studentId || p.name ? `내 정보: ${[p.name, p.studentId].filter(Boolean).join(" · ")}` : "내 정보 없음 (설정 → 메일에 쓰는 내 정보)");
  bits.push(providerLabel());
  const el = $("#aiDraftContext");
  if (el) el.textContent = bits.join(" · ");
}

// 'AI 초안' 칸 대신 모델 고르기 메뉴를 연다 (2026-10-21, 아래 'AI 모델 고르기')
$("#aiDraftToggle")?.addEventListener("click", async () => {
  if (aiMenu.el && !aiMenu.el.hidden) return closeAiMenu();
  await loadAiStatus();
  openAiMenu();
});
$("#composeTo")?.addEventListener("change", () => !$("#aiDraftBox")?.hidden && paintAiDraftContext());

// (예전 '내 소개 넣기' 단추는 메일 쓰기 흐름 — 회색 글씨를 Tab 으로 넣기 — 가 대신한다)

$("#aiDraftRun")?.addEventListener("click", async () => {
  const request = ($("#aiDraftRequest")?.value || "").trim();
  const note = $("#aiDraftNote");
  const btn = $("#aiDraftRun");
  if (!request) {
    if (note) {
      note.hidden = false;
      note.textContent = "무엇을 쓸지 한 줄 적어 주세요.";
    }
    $("#aiDraftRequest")?.focus();
    return;
  }
  await loadAiStatus();
  if (!aiReady()) {
    showToast("AI CLI(Claude·Gemini·Codex)가 설치되어 있지 않아요.");
    return;
  }
  btn.disabled = true;
  if (note) {
    note.hidden = false;
    note.textContent = `${providerLabel()} 가 쓰는 중… 10~20초쯤 걸려요`;
  }
  try {
    const ctx = aiDraftContext();
    const res = await api("/api/ai/draft", { method: "POST", body: JSON.stringify({ request, context: ctx }) });
    const form = $("#composeForm");
    // 제목은 제목 칸에 바로 (사용자: '제목도 바로 제목란에')
    if (res.subject && form) form.elements.subject.value = res.subject;
    // 받는 사람 칸이 비어 있으면 AI 가 고른 사람을 바로 넣는다. 이미 있으면 아래 추천 칩으로만.
    if (form && !form.elements.to.value.trim() && (res.to || []).length) form.elements.to.value = res.to.join(", ");
    // 이미 쓴 글(답장 인용 포함)은 아래에 남기고, 초안을 위에 넣는다
    const old = composeBody();
    setComposeBody(escapeHtml(res.body || "").replace(/\n/g, "<br>") + (old ? `<br><br>${old}` : ""));
    paintAiSuggestions(res, ctx.candidates);
    if (note) note.textContent = `${res.engine || "AI"} 초안이에요 (${res.seconds}초). [ ] 칸과 내용을 확인하고 보내 주세요.`;
  } catch (error) {
    if (note) note.textContent = humanError(error);
  } finally {
    btn.disabled = false;
  }
});

// CLI 가 깔렸는지 미리 한 번 봐 둔다. 첫 화면을 늦추지 않게 몇 초 뒤에 (앱 켜는 시간 2초를 지킨다)
window.setTimeout(() => loadAiStatus(), 4000);


/* --- 받는 사람·참조 추천 칩: 눌러서 바로 넣고, 다시 누르면 뺀다 --- */
function composeAddresses(field) {
  const form = $("#composeForm");
  return String(form?.elements[field].value || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}
function toggleComposeAddress(field, email) {
  const form = $("#composeForm");
  if (!form) return;
  const list = composeAddresses(field);
  const lower = email.toLowerCase();
  const has = list.some((x) => x.toLowerCase().includes(lower));
  const next = has ? list.filter((x) => !x.toLowerCase().includes(lower)) : [...list, email];
  form.elements[field].value = next.join(", ");
  form.elements[field].dispatchEvent(new Event("change"));
}

function paintAiSuggestions(res, candidates) {
  const box = $("#aiDraftSuggest");
  if (!box) return;
  const who = new Map((candidates || []).map((c) => [c.email.toLowerCase(), c]));
  const chip = (field, email) => {
    const c = who.get(email.toLowerCase()) || { name: email };
    const on = composeAddresses(field).some((x) => x.toLowerCase().includes(email.toLowerCase()));
    const desc = [c.course, c.section, c.role].filter(Boolean).join(" ");
    const fieldLabel = field === "to" ? "받는사람" : "참조";
    const descHtml = desc ? `<span>${escapeHtml(desc)}</span>` : "";
    const mark = on ? " ✓" : " +";
    return `<button type="button" class="ai-chip${on ? " on" : ""}" data-field="${field}" data-email="${escapeHtml(email)}" title="${escapeHtml(email)}"><em>${fieldLabel}</em>${escapeHtml(c.name || email)}${descHtml}${mark}</button>`;
  };
  const items = [...(res.to || []).map((e) => chip("to", e)), ...(res.cc || []).map((e) => chip("cc", e))];
  box.hidden = !items.length && !res.why;
  const why = res.why ? `<p class="ai-why">${escapeHtml(res.why)}</p>` : "";
  box.innerHTML = `${why}<div class="ai-chips">${items.join("")}</div>`;
  box.dataset.res = JSON.stringify({ to: res.to || [], cc: res.cc || [], why: res.why || "" });
}

$("#aiDraftSuggest")?.addEventListener("click", (event) => {
  const btn = event.target.closest(".ai-chip");
  if (!btn) return;
  toggleComposeAddress(btn.dataset.field, btn.dataset.email);
  try {
    paintAiSuggestions(JSON.parse($("#aiDraftSuggest").dataset.res || "{}"), aiDraftCandidates());
  } catch (error) {
    /* 다시 그리기만 못 하면 넘어간다 */
  }
});

$("#aiModelSelect")?.addEventListener("change", async (event) => {
  const [provider, model] = String(event.target.value || "").split("|");
  try {
    await saveAiProfile({ provider, model });
    paintAiDraftContext();
    showToast(currentAiModel().label + " 로 쓸게요");
  } catch (error) {
    showToast(humanError(error));
  }
});


/* 실험실 스위치 */
$("#aiEnabled")?.addEventListener("change", async (event) => {
  const on = event.target.checked;
  try {
    await saveAiProfile({ enabled: on ? "1" : "" });
    state.ai.search = null;
    showToast(on ? "AI 도우미를 켰어요 (실험실)" : "AI 도우미를 껐어요");
  } catch (error) {
    event.target.checked = !on;
    showToast(humanError(error));
  }
});


/* ===== 메일 쓰기 흐름 (mail_flow.py) =====
   2026-10-19 사용자: 'AI 초안'을 채팅처럼 받아 붙이기보다 자동완성처럼 — 처음(인사·자기소개)과 끝(감사·서명)은 늘
   비슷하니 다음에 올 글이 회색으로 보이고, 클릭하거나 Tab 을 치면 바로 써지게. AI 는 가운데 용건 다듬기에만.
   - 글 조각은 서버(mail_flow.py)가 받는 사람(교수·조교, 이름이 로마자면 영어)과 LMS 에서 받은 내 이름·학번으로 만든다.
   - 회색 글씨는 본문 안의 contenteditable=false 꼬리표([data-ghost]). 글자를 치기 전·포커스를 잃을 때 떼고,
     저장·보내기는 richHtml() 이 한 번 더 거른다.
   - 빈 줄에서만 보인다(쓰는 중인 문장 뒤에 끼어들지 않게). 이미 쓴 줄을 보고 다음 단계를 고른다:
     인사 → 자기소개 → 'I am writing to'/'다름이 아니라' → (내 용건) → 감사 → 서명. */
state.mailMe = null;
const flow = { data: null, key: "", lang: "", course: 0, muted: false, timer: 0, toTimer: 0, seq: 0, ghost: null };
const FLOW_STAGE = { greeting: 0, intro: 1, leadin: 2, content: 3, closing: 4, signoff: 5 };
const FLOW_TEST_ORDER = ["signoff", "closing", "leadin", "intro", "greeting"];
// 답장·전달에 붙는 원본 메일('----- 원본 메일 …', '>' 인용)부터는 내 글이 아니다
const FLOW_QUOTE = /^\s*(>|-{3,}|_{3,})/;
const FLOW_MARK = "⁣";
const ME_FIELDS = { name: "#meName", nameEn: "#meNameEn", studentId: "#meStudentId", dept: "#meDept" };

async function loadMailMe(force = false) {
  if (state.mailMe && !force) return state.mailMe;
  try {
    state.mailMe = await api("/api/mail/me");
  } catch (error) {
    state.mailMe = null;
  }
  paintMailMe();
  return state.mailMe;
}
const flowOn = () => state.mailMe?.manual?.flow !== "off";

/* --- 설정: 메일에 쓰는 내 정보 --- */
function paintMailMe() {
  const d = state.mailMe;
  if (!d) return;
  Object.entries(ME_FIELDS).forEach(([key, sel]) => {
    const el = $(sel);
    if (!el || document.activeElement === el) return;
    el.value = d.manual?.[key] || "";
    // 비워 두면 쓸 값(LMS·조직도에서 가져온 것)을 흐린 글씨로 보인다
    el.placeholder = d.me?.[key] ? String(d.me[key]) : "";
  });
  const src = $("#meSource");
  if (src) {
    const from = d.auto?.from;
    src.textContent =
      from === "lms" ? "이름·학번은 LMS 에서 가져왔어요. 영문 이름은 추정이라 확인해 주세요." :
      from === "directory" ? "이름은 조직도에서 가져왔어요. 학번은 다음 LMS 동기화 때 채워져요." :
      "LMS 동기화를 한 번 하면 이름·학번이 채워져요.";
  }
  const on = $("#meFlowOn");
  if (on) on.checked = flowOn();
}

$("#meSave")?.addEventListener("click", async () => {
  const payload = {};
  Object.entries(ME_FIELDS).forEach(([key, sel]) => {
    payload[key] = ($(sel)?.value || "").trim();
  });
  try {
    state.mailMe = await api("/api/mail/me", { method: "POST", body: JSON.stringify(payload) });
    paintMailMe();
    flow.data = null; // 다음에 메일을 쓸 때 새 정보로
    showToast("내 정보를 저장했어요");
  } catch (error) {
    showToast(humanError(error));
  }
});
$("#meFlowOn")?.addEventListener("change", async (event) => {
  const on = event.target.checked;
  try {
    state.mailMe = await api("/api/mail/me", { method: "POST", body: JSON.stringify({ flow: on ? "" : "off" }) });
    paintMailMe();
    flow.data = null;
    showToast(on ? "메일 쓸 때 인사·서명을 미리 보여 줄게요" : "인사·서명 미리 보이기를 껐어요");
  } catch (error) {
    event.target.checked = !on;
    showToast(humanError(error));
  }
});

/* --- 받는 사람 → 흐름 조각 --- */
function resetMailFlow() {
  flow.data = null;
  flow.key = "";
  flow.lang = "";
  flow.course = 0;
  flow.muted = false;
  removeGhost();
  // 쓰던 /ai 답은 이 새 메일에 붙이지 않는다
  Object.assign(aiJob, { box: null, typing: false, text: "", prompt: "" });
  aiJob.seq += 1;
  const bar = $("#mailFlowBar");
  if (bar) bar.hidden = true;
  loadMailFlow();
}

async function loadMailFlow(force = false) {
  const form = $("#composeForm");
  if (!form) return;
  await loadMailMe();
  if (!flowOn()) {
    flow.data = null;
    paintFlowBar();
    return;
  }
  const to = String(form.elements.to.value || "").split(",")[0].trim();
  if (flow.key && flow.key.split("|")[0] !== to) flow.course = 0;
  const key = `${to}|${flow.course}`;
  if (!force && flow.data && flow.key === key) return;
  const seq = ++flow.seq;
  try {
    const res = await api("/api/mail/flow", { method: "POST", body: JSON.stringify({ to, courseIndex: flow.course }) });
    if (seq !== flow.seq) return;
    // 받는 사람이 바뀌면 언어도 다시 고른다(외국인 교수님 → 영어). 같은 사람이면 내가 고른 언어를 지킨다
    if (!flow.data || flow.data.to?.email !== res.to?.email || !flow.lang) flow.lang = res.lang || "ko";
    flow.data = res;
    flow.key = key;
  } catch (error) {
    if (seq === flow.seq) flow.data = null;
  }
  paintFlowBar();
  if (document.activeElement === $("#composeRich")) scheduleGhost(0);
}

function courseFlowLabel(c) {
  return [c.title, c.section ? `${c.section}분반` : ""].filter(Boolean).join(" ");
}

function paintFlowBar() {
  const bar = $("#mailFlowBar");
  if (!bar) return;
  const d = flow.data;
  bar.hidden = !d || !flowOn();
  if (bar.hidden) return;
  const to = d.to || {};
  const courses = to.courses || [];
  const role = { professor: "교수님", ta: "조교님" }[to.kind] || "";
  const who = $("#mailFlowWho");
  if (who) {
    const course = courses.length === 1 ? ` · <span data-no-i18n>${escapeHtml(courseFlowLabel(courses[0]))}</span>` : "";
    who.innerHTML = to.name
      ? `<strong data-no-i18n>${escapeHtml(to.name)}</strong>${role ? ` <span>${role}</span>` : ""}${course}`
      : `<span>받는 사람을 넣으면 인사·소개를 맞춰 드려요</span>`;
  }
  const sel = $("#mailFlowCourse");
  if (sel) {
    // 한 교수님이 내 과목 둘을 맡으면 어느 과목인지 고른다
    sel.hidden = courses.length < 2;
    sel.innerHTML = courses
      .map((c, i) => `<option value="${i}"${i === flow.course ? " selected" : ""}>${escapeHtml(courseFlowLabel(c))}</option>`)
      .join("");
  }
  bar.querySelectorAll("[data-flow-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.flowLang === flow.lang)));
  const aiHint = $("#mailFlowAiHint");
  if (aiHint) aiHint.hidden = !aiOn();
}

/* --- 회색 글씨 --- */
// 흐름 회색 글씨("1")와 /ai 안내("hint")만 뗀다. AI 가 쓰는 중인 칸("ai")은 aiJob 이 따로 다룬다
const FLOW_GHOSTS = '[data-ghost="1"], [data-ghost="hint"]';
function removeGhost() {
  $("#composeRich")?.querySelectorAll(FLOW_GHOSTS).forEach((n) => n.remove());
  flow.ghost = null;
}

function scheduleGhost(delay = 120) {
  window.clearTimeout(flow.timer);
  flow.timer = window.setTimeout(refreshGhost, delay);
}

// 범위의 글을 줄바꿈 그대로 읽는다: 화면 밖에 잠깐 붙여 innerText 로. 끝(뒤쪽 범위는 앞)에 표시 글자를 넣는데,
// 끝에 붙은 빈 줄(<div><br></div>)은 innerText 에서 줄바꿈을 만들지 않아 '빈 줄에 있다'를 알 수 없었기 때문이다.
function rangeText(range, markAtEnd) {
  const frag = range.cloneContents();
  frag.querySelectorAll("[data-ghost]").forEach((n) => n.remove());
  const pick = (n) => (markAtEnd ? n.lastChild : n.firstChild);
  let node = frag;
  while (pick(node) && (pick(node).nodeType === 3 || (pick(node).nodeType === 1 && !/^(BR|IMG|HR)$/.test(pick(node).nodeName)))) {
    node = pick(node);
  }
  if (node.nodeType === 3) node.data = markAtEnd ? node.data + FLOW_MARK : FLOW_MARK + node.data;
  else if (markAtEnd) node.appendChild(document.createTextNode(FLOW_MARK));
  else node.insertBefore(document.createTextNode(FLOW_MARK), node.firstChild);
  const box = document.createElement("div");
  box.className = "flow-measure";
  box.style.whiteSpace = getComputedStyle($("#composeRich")).whiteSpace;
  box.appendChild(frag);
  document.body.appendChild(box);
  const text = box.innerText;
  box.remove();
  return text;
}

function flowTests() {
  const tests = {};
  (flow.data?.segments?.[flow.lang] || []).forEach((s) => {
    try {
      tests[s.kind] = new RegExp(s.match, "i");
    } catch (error) {
      /* 서버가 준 꼴이 이 브라우저에서 안 되면 그 단계만 못 알아본다 */
    }
  });
  return tests;
}

// 줄 하나가 어느 단계인지. 앞으로만 간다(용건을 쓴 뒤에 '…입니다.' 로 끝나는 줄을 자기소개로 되돌려 보지 않는다)
function flowKind(line, stage, tests) {
  return FLOW_TEST_ORDER.find((k) => tests[k] && FLOW_STAGE[k] >= stage && tests[k].test(line)) || "content";
}

function nextFlowSegment(lines, afterLines = []) {
  const tests = flowTests();
  let stage = -1;
  for (const raw of lines) {
    const line = raw.replaceAll(FLOW_MARK, "").trim();
    if (!line) continue;
    if (FLOW_QUOTE.test(line)) break;
    stage = Math.max(stage, FLOW_STAGE[flowKind(line, stage, tests)]);
  }
  const seg = (flow.data?.segments?.[flow.lang] || []).find((s) => FLOW_STAGE[s.kind] > stage);
  if (!seg) return null;
  // 커서 뒤에 이미 그 단계(또는 그 앞 단계·용건)의 글이 있으면 제안하지 않는다. 앞쪽만 보고 골라서, 이미 쓴
  // 'Thank you …' 위 빈 줄에 같은 문장을 또 띄웠다(2026-10-19 사용자 화면)
  for (const raw of afterLines) {
    const line = raw.replaceAll(FLOW_MARK, "").trim();
    if (!line) continue;
    if (FLOW_QUOTE.test(line)) break;
    if (FLOW_STAGE[flowKind(line, stage, tests)] <= FLOW_STAGE[seg.kind]) return null;
  }
  return seg;
}

function refreshGhost() {
  const rich = $("#composeRich");
  removeGhost();
  if (!rich || rich.hidden || flow.muted || aiJob.box || document.activeElement !== rich) return;
  const sel = window.getSelection();
  if (!sel?.rangeCount || !sel.isCollapsed) return;
  const caret = sel.getRangeAt(0);
  if (!rich.contains(caret.startContainer)) return;
  const before = document.createRange();
  before.setStart(rich, 0);
  before.setEnd(caret.startContainer, caret.startOffset);
  const after = document.createRange();
  after.setStart(caret.startContainer, caret.startOffset);
  after.setEnd(rich, rich.childNodes.length);
  const lines = rangeText(before, true).split("\n");
  const here = lines.pop().replaceAll(FLOW_MARK, "").trim();
  const afterLines = rangeText(after, false).split("\n");
  const rest = afterLines.shift().replaceAll(FLOW_MARK, "").trim();
  let seg = null;
  if (!rest && findAiPrompt(rich, caret)) {
    // '/ai …' 를 쓰는 중: 줄 끝에 'Ctrl+Enter' 안내를 흐리게 (흐름 미리보기를 꺼도 보인다)
    seg = { kind: "aihint", text: aiReady() ? aiHintText(rich, caret) : tr("  AI CLI(Claude·Gemini·Codex)를 설치하면 /ai 로 이어 쓸 수 있어요") };
    if (!seg.text) return;
  } else {
    if (here || rest || !flow.data || !flowOn()) return; // 흐름 미리보기는 빈 줄에서만
    seg = nextFlowSegment(lines, afterLines);
  }
  if (!seg) return;
  const ghost = document.createElement("span");
  ghost.className = seg.kind === "aihint" ? "flow-ghost ai-hint" : "flow-ghost";
  ghost.dataset.ghost = seg.kind === "aihint" ? "hint" : "1";
  ghost.contentEditable = "false";
  ghost.textContent = seg.text;
  if (seg.kind !== "aihint") {
    // 안내 줄 대신 회색 글씨 바로 옆에 Tab 키를 띄운다 (2026-10-21 사용자: 'Tab 회색 글씨 넣기' 글은 빼고 은유로)
    const key = document.createElement("kbd");
    key.className = "flow-ghost-key";
    key.textContent = "Tab";
    ghost.appendChild(key);
  }
  caret.insertNode(ghost);
  const at = document.createRange();
  at.setStartBefore(ghost);
  at.collapse(true);
  sel.removeAllRanges();
  sel.addRange(at);
  flow.ghost = seg;
}

function acceptGhost() {
  const rich = $("#composeRich");
  const ghost = rich?.querySelector(FLOW_GHOSTS);
  const seg = flow.ghost;
  if (!ghost || !seg) return false;
  if (seg.kind === "aihint") {
    // /ai 안내에서 Tab·클릭 = Ctrl+Enter 와 같다 (안내 글 자체는 넣지 않는다)
    removeGhost();
    runAiContinue();
    return true;
  }
  const at = document.createRange();
  at.setStartBefore(ghost);
  at.collapse(true);
  ghost.remove();
  flow.ghost = null;
  rich.focus();
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(at);
  // execCommand 로 넣어야 되돌리기(Ctrl+Z)와 자동 저장(input 이벤트)이 그대로 된다. 줄바꿈까지 한 번에 넣어야
  // Ctrl+Z 한 번에 통째로 빠진다(실측: 크롬은 insertText 의 \n 을 문단으로 나누고, 되돌리기는 한 단계)
  document.execCommand("insertText", false, seg.text + "\n".repeat(seg.after || 0));
  scheduleGhost(0);
  return true;
}

(() => {
  const rich = $("#composeRich");
  if (!rich) return;
  rich.addEventListener("keydown", (event) => {
    // AI 가 쓰는 중: 기다리는 동안 Esc = 취소(지시 글을 되돌림), 타자 치는 동안 아무 키 = 바로 끝까지 넣고 그 키는 그대로
    if (aiJob.box) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        if (aiJob.typing) finishAiTyping();
        else cancelAiContinue();
        return;
      }
      if (aiJob.typing && !["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(event.key)) finishAiTyping();
    }
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey) && !event.isComposing) {
      const sel = window.getSelection();
      if (sel?.rangeCount && findAiPrompt(rich, sel.getRangeAt(0))) {
        event.preventDefault();
        event.stopPropagation();
        removeGhost();
        runAiContinue();
        return;
      }
    }
    const plainTab = event.key === "Tab" && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey && !event.isComposing;
    if (plainTab && !flow.ghost) {
      // 회색 글씨가 뜨기 전(클릭 직후)에 Tab 을 쳐도 바로 받는다. 안 그러면 포커스가 옆 칸으로 넘어갔다
      flow.muted = false;
      window.clearTimeout(flow.timer);
      refreshGhost();
    }
    if (!flow.ghost) return;
    if (event.isComposing || event.keyCode === 229) {
      removeGhost();
      return;
    }
    if (event.key === "Tab" && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
      event.preventDefault();
      acceptGhost();
      return;
    }
    if (event.key === "Escape") {
      // 다시 글을 칠 때까지 숨긴다
      event.preventDefault();
      event.stopPropagation();
      flow.muted = true;
      removeGhost();
      return;
    }
    if (["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(event.key)) return;
    removeGhost();
  });
  rich.addEventListener("input", (event) => {
    if (event.isComposing) return;
    flow.muted = false;
    scheduleGhost();
  });
  rich.addEventListener("compositionstart", removeGhost);
  rich.addEventListener("compositionend", () => scheduleGhost());
  rich.addEventListener("keyup", (event) => {
    if (!event.isComposing && /^(Arrow|Home|End|Page|Enter|Backspace|Delete)/.test(event.key)) scheduleGhost();
  });
  rich.addEventListener("mouseup", () => scheduleGhost(0));
  rich.addEventListener("focus", () => {
    if (!flow.data) loadMailFlow();
    scheduleGhost(0);
  });
  rich.addEventListener("blur", () => {
    window.clearTimeout(flow.timer);
    removeGhost();
  });
  // 회색 글씨를 누르면 바로 넣는다
  rich.addEventListener("mousedown", (event) => {
    if (aiJob.typing && event.target.closest?.('[data-ghost="ai"]')) {
      event.preventDefault();
      finishAiTyping();
      return;
    }
    if (!event.target.closest?.(FLOW_GHOSTS)) return;
    event.preventDefault();
    acceptGhost();
  });
})();

/* --- /ai: 그 자리에서 AI 가 이어 쓰기 (2026-10-19 사용자) ---
   '/ai' 를 치고 하고 싶은 말(한국어 메모도 됨)을 이어 쓴 뒤 Ctrl+Enter(안내에서 Tab·클릭도) → 지시 글은 지워지고,
   메일 앞뒤 글에 자연스럽게 이어지는 글이 그 자리에 한 글자씩 타자 치듯 나온다.
   - CLI 는 답을 한 번에 주므로(10초 안팎) 기다리는 동안 '쓰는 중' 을 보이고, 받은 뒤 글자를 흘려 보여 준다.
   - 흘리는 동안의 글은 [data-ghost="ai"] 칸이라 저장·보내기에 섞이지 않는다. 다 나오면 execCommand 한 번으로
     진짜 글로 넣어 Ctrl+Z 한 번이면 빠지고, 한 번 더 누르면 지운 지시 글이 돌아온다. */
const aiJob = { box: null, typing: false, text: "", prompt: "", seq: 0 };

// 커서 앞에서 가장 가까운 '/ai' (줄 처음이나 띄어쓰기 뒤) → 그 '/' 부터 커서까지의 범위
function findAiPrompt(rich, caret) {
  if (!rich || !caret || !rich.contains(caret.startContainer)) return null;
  const walker = document.createTreeWalker(rich, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest("[data-ghost]") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (let i = nodes.length - 1; i >= 0; i -= 1) {
    const node = nodes[i];
    if (caret.comparePoint(node, 0) > 0) continue; // 커서 뒤
    const text = node === caret.startContainer ? node.data.slice(0, caret.startOffset) : node.data;
    const re = /(^|[\s ])\/ai(?=[\s ]|$)/gi;
    let at = -1;
    let m;
    while ((m = re.exec(text))) at = m.index + m[1].length;
    if (at < 0) continue;
    const range = document.createRange();
    range.setStart(node, at);
    range.setEnd(caret.startContainer, caret.startOffset);
    return range;
  }
  return null;
}

function aiFlowTo() {
  const to = flow.data?.to || {};
  const courses = to.courses || [];
  const ordered = courses[flow.course] ? [courses[flow.course], ...courses.filter((_, i) => i !== flow.course)] : courses;
  return { ...to, courses: ordered };
}

async function runAiContinue() {
  const rich = $("#composeRich");
  const sel = window.getSelection();
  if (!rich || aiJob.box || !sel?.rangeCount) return;
  const prompt = findAiPrompt(rich, sel.getRangeAt(0));
  if (!prompt) return;
  closeAiModelPop();
  await loadAiStatus();
  if (!aiReady()) {
    showToast("AI CLI(Claude·Gemini·Codex)가 이 컴퓨터에 없어요. 하나를 설치하고 터미널에서 한 번 로그인해 주세요.");
    return;
  }
  removeGhost();
  // '/ai [할 말]' 의 닫는 ']' 가 커서 바로 뒤에 있으면 그것까지 지시 글로 지운다
  if (prompt.endContainer.nodeType === Node.TEXT_NODE && prompt.endContainer.data[prompt.endOffset] === "]") {
    prompt.setEnd(prompt.endContainer, prompt.endOffset + 1);
  }
  const raw = rangeText(prompt, true).replaceAll(FLOW_MARK, "");
  const cmd = parseAiCommand(raw);
  if (cmd.token && !cmd.choice) {
    showToast(`'${cmd.token}' 모델을 못 찾았어요. with 뒤에 모델 이름을 고르세요 (예: opus5.5)`);
    return;
  }
  const instruction = cmd.instruction;
  if (!instruction) {
    showToast("[ ] 안에 무엇을 쓸지 적어 주세요. 예: /ai [10월 20일 기업탐방 때문에 결석, 공결 되는지 여쭤보기]");
    return;
  }
  const beforeRange = document.createRange();
  beforeRange.setStart(rich, 0);
  beforeRange.setEnd(prompt.startContainer, prompt.startOffset);
  const afterRange = document.createRange();
  afterRange.setStart(prompt.endContainer, prompt.endOffset);
  afterRange.setEnd(rich, rich.childNodes.length);
  const before = rangeText(beforeRange, true).replaceAll(FLOW_MARK, "");
  const after = rangeText(afterRange, false).replaceAll(FLOW_MARK, "");
  // 지시 글을 지우고(되돌리기 한 단계) 그 자리에 '쓰는 중' 칸을 둔다
  rich.focus();
  sel.removeAllRanges();
  sel.addRange(prompt);
  document.execCommand("delete");
  const spot = window.getSelection().getRangeAt(0).cloneRange();
  const box = document.createElement("span");
  box.className = "ai-typing waiting";
  box.dataset.ghost = "ai";
  box.contentEditable = "false";
  // 쓰는 동안 그 회사 로고가 움직인다 (Claude 별꽃은 돌며 숨 쉬고, Gemini 는 반짝, OpenAI 는 천천히 돈다)
  const who = cmd.choice || { provider: currentAiModel().provider, label: providerLabel() };
  box.innerHTML = `${aiLogo(who.provider, "busy")}<span>${escapeHtml(tr(`${who.label} 가 쓰는 중`))}</span>`;
  spot.insertNode(box);
  const at = document.createRange();
  at.setStartBefore(box);
  at.collapse(true);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(at);
  const seq = ++aiJob.seq;
  Object.assign(aiJob, { box, typing: false, text: "", prompt: raw.trim() });
  try {
    const res = await api("/api/ai/continue", {
      method: "POST",
      body: JSON.stringify({
        instruction, before: before.slice(-6000), after: after.slice(0, 3000), lang: flow.lang || "ko", flow: { to: aiFlowTo() },
        // '/ai with opus5.5 [ … ]' 로 고른 모델은 이번 한 번만 (평소 모델은 쓰기 창의 모델 단추)
        provider: cmd.choice?.provider || "", model: cmd.choice?.id || "",
      }),
    });
    if (seq !== aiJob.seq || aiJob.box !== box) return; // 그사이 취소됨
    let text = String(res.text || "").trim();
    if (!text) throw new Error("AI 가 빈 답을 줬어요. 다시 눌러 주세요.");
    // 'I am writing to' 처럼 띄어쓰기 없이 끝난 앞 글에 붙일 때는 한 칸 띄운다
    const prev = before.slice(-1);
    if (prev && !/[\s (\[“"']/.test(prev)) text = " " + text;
    aiJob.text = text;
    typeOutAi(seq);
  } catch (error) {
    if (seq !== aiJob.seq) return;
    cancelAiContinue();
    showToast(humanError(error));
  }
}

// 받은 글을 한 글자씩 (짧으면 천천히, 길어도 4초 안에 끝나게)
function typeOutAi(seq) {
  const box = aiJob.box;
  const text = aiJob.text;
  if (!box) return;
  box.classList.remove("waiting");
  box.textContent = "";
  aiJob.typing = true;
  const duration = Math.min(4000, Math.max(700, text.length * 22));
  const started = performance.now();
  const step = (now) => {
    if (seq !== aiJob.seq || aiJob.box !== box || !aiJob.typing) return;
    const n = Math.min(text.length, Math.ceil(((now - started) / duration) * text.length));
    box.textContent = text.slice(0, n);
    if (n >= text.length) finishAiTyping();
    else window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);
  // 창이 뒤에 있으면 그림 틀(rAF)이 멈춘다(실측: 미리보기 창에서 글이 반쯤에서 서 있었다). 시간이 지나면 마저 넣는다
  window.setTimeout(() => {
    if (seq === aiJob.seq && aiJob.box === box) finishAiTyping();
  }, duration + 600);
}

// 흘리던 칸을 진짜 글로 바꾼다 (한 번에 넣어야 Ctrl+Z 한 번으로 빠진다)
function finishAiTyping() {
  const rich = $("#composeRich");
  const box = aiJob.box;
  const text = aiJob.text;
  Object.assign(aiJob, { box: null, typing: false, text: "" });
  aiJob.seq += 1;
  if (!box) return;
  if (!rich?.contains(box) || !text) {
    box.remove();
    return;
  }
  const back = document.activeElement !== rich ? document.activeElement : null;
  const at = document.createRange();
  at.setStartBefore(box);
  at.collapse(true);
  box.remove();
  rich.focus();
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(at);
  document.execCommand("insertText", false, text);
  if (back && back !== document.body) back.focus();
  else scheduleGhost(0);
}

// 기다리다 취소·실패: 지운 지시 글을 그 자리에 되돌린다
function cancelAiContinue() {
  const rich = $("#composeRich");
  const box = aiJob.box;
  const prompt = aiJob.prompt;
  Object.assign(aiJob, { box: null, typing: false, text: "" });
  aiJob.seq += 1;
  if (!box) return;
  if (!rich?.contains(box)) return;
  const at = document.createRange();
  at.setStartBefore(box);
  at.collapse(true);
  box.remove();
  rich.focus();
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(at);
  if (prompt) document.execCommand("insertText", false, prompt);
}

["input", "change"].forEach((type) =>
  $("#composeTo")?.addEventListener(type, () => {
    window.clearTimeout(flow.toTimer);
    flow.toTimer = window.setTimeout(() => loadMailFlow(), type === "change" ? 0 : 500);
  }),
);

// 흐름 줄의 단추는 누르는 동안 본문 포커스를 뺏지 않는다(커서 자리를 지켜야 회색 글씨가 그 자리에 다시 뜬다)
$("#mailFlowBar")?.addEventListener("mousedown", (event) => {
  if (event.target.closest("button")) event.preventDefault();
});
$("#mailFlowBar")?.addEventListener("click", (event) => {
  const b = event.target.closest("[data-flow-lang]");
  if (!b) return;
  flow.lang = b.dataset.flowLang;
  flow.muted = false;
  paintFlowBar();
  scheduleGhost(0);
});
$("#mailFlowCourse")?.addEventListener("change", (event) => {
  flow.course = Number(event.target.value) || 0;
  loadMailFlow(true);
});

window.setTimeout(() => loadMailMe(), 4500);

/* ===== /ai 명령: '/ai [할 말]', '/ai with opus5.5 [할 말]' (2026-10-20 사용자) =====
   '명령어 치듯이 [ ] 안에 쓰게, 모델은 /ai with ____ 로 — 예: /ai with opus5.5'. [ ] 없이 '/ai 할 말' 도 예전처럼 된다.
   with 를 치면 커서 아래에 쓸 수 있는 모델 목록이 뜨고(설치된 CLI 만), 고르면 'opus5.5 []' 가 들어가 [ ] 안에 커서가 선다.
   고른 모델은 이번 한 번만 쓰고, 평소 모델은 쓰기 창 위의 모델 단추에서 바꾼다. */
const aiAlias = (label) => String(label || "").toLowerCase().replace(/\s+/g, "");

function aiModelChoices() {
  const models = state.ai.status?.models || {};
  const out = [];
  Object.entries(models).forEach(([provider, info]) =>
    (info.models || []).forEach((m) => out.push({ provider, id: m.id, label: m.label, alias: aiAlias(m.label) })),
  );
  return out;
}

function resolveAiModel(token) {
  const t = aiAlias(token);
  if (!t) return null;
  const list = aiModelChoices();
  return list.find((c) => c.alias === t || c.id.toLowerCase() === t) || list.find((c) => c.alias.startsWith(t)) || null;
}

// '/ai with opus5.5 [할 말]' → { token: 'opus5.5', choice, instruction: '할 말', bracket: true }
function parseAiCommand(raw) {
  let rest = String(raw || "").replace(/^\s*\/ai/i, "");
  let token = "";
  const w = rest.match(/^\s+with\s+([^\s[\]]+)/i);
  if (w) {
    token = w[1];
    rest = rest.slice(w[0].length);
  }
  const open = rest.indexOf("[");
  let instruction = rest;
  if (open >= 0) {
    const close = rest.lastIndexOf("]");
    instruction = rest.slice(open + 1, close > open ? close : undefined);
  }
  return { token, choice: token ? resolveAiModel(token) : null, instruction: instruction.trim(), bracket: open >= 0 };
}

// 줄 끝 회색 안내: 막 '/ai' 만 쳤으면 쓰는 법, 'with ' 뒤 모델을 고르는 중이면 안내 없이 목록만
function aiHintText(rich, caret) {
  const prompt = findAiPrompt(rich, caret);
  if (!prompt) return "";
  const raw = rangeText(prompt, true).replaceAll(FLOW_MARK, "");
  if (/^\s*\/ai\s+with(\s+[^\s[\]]*)?$/i.test(raw)) return "";
  const cmd = parseAiCommand(raw);
  if (!cmd.bracket && !cmd.instruction && !cmd.token) return keyLabel(tr("  [prompt]  ·  with 모델  ·  Ctrl+Enter"));
  const who = cmd.choice?.label || providerLabel();
  return keyLabel(tr(`  Ctrl+Enter — ${who} 가 이어 써요`));
}

/* --- with 뒤 모델 고르기 목록 --- */
const aiPop = { el: null, items: [], index: 0, partial: "" };

function closeAiModelPop() {
  if (aiPop.el) aiPop.el.hidden = true;
  aiPop.items = [];
}

// 커서가 '/ai with ' 바로 뒤(또는 모델 이름을 치는 중)인가
function aiWithContext() {
  const rich = $("#composeRich");
  const sel = window.getSelection();
  if (!rich || !sel?.rangeCount || !sel.isCollapsed) return null;
  const caret = sel.getRangeAt(0);
  const prompt = findAiPrompt(rich, caret);
  if (!prompt) return null;
  const raw = rangeText(prompt, true).replaceAll(FLOW_MARK, "");
  const m = raw.match(/^\s*\/ai\s+with\s+([^\s[\]]*)$/i);
  return m ? { caret, partial: m[1] } : null;
}

function paintAiModelPop() {
  const ctx = aiWithContext();
  if (ctx && !state.ai.status) {
    loadAiStatus().then(paintAiModelPop); // 처음이면 모델 목록부터 받아 온다
    return;
  }
  if (!ctx || !aiReady()) return closeAiModelPop();
  const want = aiAlias(ctx.partial);
  const items = aiModelChoices().filter((c) => !want || c.alias.includes(want) || c.id.toLowerCase().includes(want));
  if (!items.length) return closeAiModelPop();
  if (!aiPop.el) {
    aiPop.el = document.createElement("div");
    aiPop.el.className = "ai-model-pop";
    aiPop.el.setAttribute("role", "listbox");
    document.body.appendChild(aiPop.el);
    // 누를 때 글 칸의 커서를 잃지 않게 mousedown 에서 고른다
    aiPop.el.addEventListener("mousedown", (event) => {
      const row = event.target.closest("[data-i]");
      if (!row) return;
      event.preventDefault();
      chooseAiModel(Number(row.dataset.i));
    });
  }
  if (aiPop.partial !== ctx.partial) aiPop.index = 0;
  aiPop.partial = ctx.partial;
  aiPop.items = items;
  aiPop.index = Math.min(aiPop.index, items.length - 1);
  const names = { claude: "Claude", gemini: "Gemini", codex: "Codex" };
  aiPop.el.innerHTML =
    items
      .map(
        (c, i) => `<div class="ai-model-opt${i === aiPop.index ? " on" : ""}" data-i="${i}" role="option" aria-selected="${i === aiPop.index}">
          ${aiLogo(c.provider)}<code>${escapeHtml(c.alias)}</code><span>${escapeHtml(c.label)}</span></div>`,
      )
      .join("") + `<div class="ai-model-foot">${escapeHtml(keyLabel(tr("↑↓ 고르기 · Tab 넣기 · 그다음 [ ] 안에 쓰고 Ctrl+Enter")))}</div>`;
  const rect = ctx.caret.getBoundingClientRect();
  const fallback = $("#composeRich").getBoundingClientRect();
  const top = (rect.bottom || fallback.top + 24) + 6;
  const left = Math.min(rect.left || fallback.left, window.innerWidth - 320);
  Object.assign(aiPop.el.style, { top: `${Math.round(top)}px`, left: `${Math.round(Math.max(8, left))}px` });
  aiPop.el.hidden = false;
}

function chooseAiModel(i) {
  const c = aiPop.items[i];
  if (!c) return;
  const rich = $("#composeRich");
  const sel = window.getSelection();
  rich.focus();
  // 치던 모델 이름을 지우고 'opus5.5 []' 를 넣은 뒤 커서를 [ ] 안에 둔다 (되돌리기 한 번에 빠진다)
  for (let k = 0; k < aiPop.partial.length; k += 1) sel.modify("extend", "backward", "character");
  document.execCommand("insertText", false, `${c.alias} []`);
  sel.modify("move", "backward", "character");
  closeAiModelPop();
  scheduleGhost(0);
}

(() => {
  const rich = $("#composeRich");
  if (!rich) return;
  // 목록이 떠 있을 때는 화살표·Tab·Enter·Esc 를 먼저 받는다 (다른 키 처리보다 앞서게 capture)
  rich.addEventListener(
    "keydown",
    (event) => {
      if (!aiPop.items.length || aiPop.el?.hidden || event.isComposing) return;
      const n = aiPop.items.length;
      let handled = true;
      if (event.key === "ArrowDown") aiPop.index = (aiPop.index + 1) % n;
      else if (event.key === "ArrowUp") aiPop.index = (aiPop.index - 1 + n) % n;
      else if (event.key === "Tab" || (event.key === "Enter" && !event.ctrlKey && !event.metaKey)) chooseAiModel(aiPop.index);
      else if (event.key === "Escape") closeAiModelPop();
      else handled = false;
      if (!handled) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (aiPop.items.length && !aiPop.el.hidden) paintAiModelPop();
    },
    true,
  );
  rich.addEventListener("input", () => window.requestAnimationFrame(paintAiModelPop));
  rich.addEventListener("click", () => window.requestAnimationFrame(paintAiModelPop));
  rich.addEventListener("blur", () => window.setTimeout(closeAiModelPop, 120));
})();

/* ===== AI 모델 고르기 (2026-10-21 사용자: '채팅 창처럼 말고 명령어처럼, 모델은 회사 → 세부 모델로 고르게,
   각 회사 실제 로고로 — Claude 는 더 역동적이잖아') =====
   - 'AI 초안' 입력 칸(채팅처럼 한 줄 적고 누르던 것)은 없앴다. AI 는 본문에서 '/ai [할 말]' 로만 부른다.
   - 쓰기 창 위 모델 단추 → 회사 목록(설치됨 초록 점·지금 쓰는 것 ✓) → 옆으로 세부 모델(설명·꼬리표, CLI 기본, 직접 입력).
   - 로고: Simple Icons(CC0)의 Claude·Google Gemini·OpenAI 그림(web/img/ai/). 색·움직임을 주려고 경로를 여기 넣었다.
     AI 가 쓰는 동안 Claude 는 별꽃이 돌며 숨 쉬고, Gemini 는 반짝이고, OpenAI 는 천천히 돈다. */
const AI_LOGO_PATHS = {"claude": "m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z", "gemini": "M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81", "codex": "M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"};
const AI_BRAND = {
  claude: { name: "Claude", cli: "Claude Code" },
  gemini: { name: "Gemini", cli: "Gemini CLI" },
  codex: { name: "ChatGPT", cli: "Codex CLI" },
};
// 세부 모델 설명·꼬리표 (모르는 모델은 이름만)
const AI_MODEL_NOTES = {
  fable: ["가장 뛰어난 최신 모델", "최고 성능", "hot"],
  opus: ["깊은 추론 · 긴 글", "", ""],
  sonnet: ["성능과 속도의 균형", "추천", "pick"],
  haiku: ["가장 빠르고 가벼움", "빠름", "fast"],
  "gemini-3.1-pro-preview": ["최신 · 깊은 추론", "최고 성능", "hot"],
  "gemini-2.5-pro": ["안정적인 깊은 추론", "추천", "pick"],
  "gemini-3.5-flash": ["빠른 최신 모델", "빠름", "fast"],
  "gemini-2.5-flash": ["빠르고 가벼움", "빠름", "fast"],
};

function aiLogo(provider, cls = "") {
  const d = AI_LOGO_PATHS[provider];
  if (!d) return `<span class="ai-logo ${cls}" aria-hidden="true"></span>`;
  return `<svg class="ai-logo ai-logo-${provider} ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
}

const aiMenu = { el: null, provider: "" };

function closeAiMenu() {
  if (aiMenu.el) aiMenu.el.hidden = true;
  $("#aiDraftToggle")?.setAttribute("aria-expanded", "false");
}

function aiModelRow(id, title, note, tag, tone, chosenId) {
  const on = chosenId === id;
  const tagHtml = tag ? `<em class="ai-tag ${tone}">${escapeHtml(tag)}</em>` : "";
  const noteHtml = note ? `<span>${escapeHtml(note)}</span>` : "";
  return `<button type="button" class="ai-model${on ? " on" : ""}" data-model="${escapeHtml(id)}">
      <span class="ai-model-text"><strong>${escapeHtml(title)}${tagHtml}</strong>${noteHtml}</span>
      ${on ? '<span class="ai-check">✓</span>' : ""}</button>`;
}

function paintAiMenu() {
  const st = state.ai.status || {};
  const now = currentAiModel();
  const models = st.models || {};
  const order = ["codex", "gemini", "claude"];
  if (!aiMenu.provider) aiMenu.provider = now.provider || order.find((p) => st.available?.[p]) || "claude";
  const providers = order
    .map((p) => {
      const has = Boolean(st.available?.[p]);
      const current = p === now.provider;
      const brand = AI_BRAND[p];
      const sub = !has ? tr("설치 안 됨") : current ? now.label : brand.cli;
      const mark = current ? '<span class="ai-check">✓</span>' : '<span class="ai-chev">›</span>';
      const cls = `ai-prov${current ? " current" : ""}${p === aiMenu.provider ? " open" : ""}${has ? "" : " missing"}`;
      return `<button type="button" class="${cls}" data-prov="${p}">
        <span class="ai-prov-dot${has ? " on" : ""}"></span>${aiLogo(p)}
        <span class="ai-prov-text"><strong>${escapeHtml(brand.name)}</strong><span>${escapeHtml(sub)}</span></span>${mark}
      </button>`;
    })
    .join("");
  const p = aiMenu.provider;
  const brand = AI_BRAND[p];
  const list = models[p]?.models || [];
  const chosenId = now.provider === p ? st.profile?.model || "" : null;
  let modelRows;
  if (st.available?.[p]) {
    const defaultTitle = tr("기본 ({0} 설정)").replace("{0}", brand.cli);
    const rows = [aiModelRow("", defaultTitle, tr("CLI 에 설정된 기본 모델을 그대로 써요"), "", "", chosenId)];
    list.forEach((m) => {
      const [note, tag, tone] = AI_MODEL_NOTES[m.id] || ["", "", ""];
      const title = p === "claude" && !/^claude/i.test(m.label) ? `Claude ${m.label}` : m.label;
      rows.push(aiModelRow(m.id, title, note ? tr(note) : "", tag ? tr(tag) : "", tone, chosenId));
    });
    const ph = escapeHtml(tr("직접 입력… (예: claude-opus-5-5)"));
    rows.push(`<form class="ai-model-custom" data-custom><input type="text" placeholder="${ph}" maxlength="64" spellcheck="false" /></form>`);
    modelRows = rows.join("");
  } else {
    modelRows = `<p class="ai-model-missing">${escapeHtml(tr("이 컴퓨터에 없어요. 설치하고 터미널에서 한 번 로그인해 주세요."))}</p>`;
  }
  aiMenu.el.innerHTML = `
    <div class="ai-menu-models">
      <div class="ai-menu-head">${aiLogo(p)}<span>${escapeHtml(brand.name)} · ${escapeHtml(brand.cli)}</span></div>
      ${modelRows}
    </div>
    <div class="ai-menu-provs">
      <div class="ai-menu-head"><span>${escapeHtml(tr("AI 모델"))}</span></div>
      ${providers}
      <p class="ai-menu-foot">${escapeHtml(tr("본문에 /ai [prompt] · 한 번만 바꾸려면 /ai with 모델 [prompt]"))}</p>
    </div>`;
}

function openAiMenu() {
  if (!aiMenu.el) {
    aiMenu.el = document.createElement("div");
    aiMenu.el.className = "ai-menu";
    aiMenu.el.hidden = true;
    aiMenu.el.setAttribute("role", "menu");
    document.body.appendChild(aiMenu.el);
    aiMenu.el.addEventListener("mouseover", (event) => {
      const prov = event.target.closest("[data-prov]");
      if (prov && prov.dataset.prov !== aiMenu.provider) {
        aiMenu.provider = prov.dataset.prov;
        paintAiMenu();
      }
    });
    aiMenu.el.addEventListener("click", async (event) => {
      const prov = event.target.closest("[data-prov]");
      if (prov) {
        aiMenu.provider = prov.dataset.prov;
        paintAiMenu();
        return;
      }
      const m = event.target.closest("[data-model]");
      if (m) await pickAiModel(aiMenu.provider, m.dataset.model);
    });
    aiMenu.el.addEventListener("submit", async (event) => {
      event.preventDefault();
      const v = event.target.querySelector("input")?.value.trim() || "";
      if (!/^[A-Za-z0-9._:-]{1,64}$/.test(v)) {
        showToast("모델 이름은 영문·숫자·.-_: 만 64자까지 쓸 수 있어요");
        return;
      }
      await pickAiModel(aiMenu.provider, v);
    });
    document.addEventListener("mousedown", (event) => {
      if (aiMenu.el.hidden) return;
      if (aiMenu.el.contains(event.target) || event.target.closest("#aiDraftToggle")) return;
      closeAiMenu();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !aiMenu.el.hidden) closeAiMenu();
    });
  }
  aiMenu.provider = "";
  paintAiMenu();
  const btn = $("#aiDraftToggle").getBoundingClientRect();
  aiMenu.el.hidden = false;
  const w = aiMenu.el.offsetWidth;
  Object.assign(aiMenu.el.style, {
    top: `${Math.round(btn.bottom + 8)}px`,
    left: `${Math.round(Math.max(8, Math.min(btn.left, window.innerWidth - w - 8)))}px`,
  });
  $("#aiDraftToggle").setAttribute("aria-expanded", "true");
}

async function pickAiModel(provider, model) {
  if (!state.ai.status?.available?.[provider]) {
    showToast(tr("이 컴퓨터에 없어요. 설치하고 터미널에서 한 번 로그인해 주세요."));
    return;
  }
  try {
    await saveAiProfile({ provider, model });
    paintAiModelButton();
    paintAiMenu();
    showToast(`${currentAiModel().label} 로 쓸게요`);
    window.setTimeout(closeAiMenu, 250);
  } catch (error) {
    showToast(humanError(error));
  }
}

// 쓰기 창 위 단추: [로고] 모델 이름 ▾
function paintAiModelButton() {
  const btn = $("#aiDraftToggle");
  if (!btn) return;
  const now = currentAiModel();
  btn.innerHTML = `${aiLogo(now.provider || "claude")}<span id="aiDraftModelName">${escapeHtml(now.label)}</span><span class="ai-btn-chev" aria-hidden="true">▾</span>`;
  btn.title = tr("AI 모델 바꾸기 · 본문에 /ai [prompt]");
  btn.setAttribute("aria-haspopup", "menu");
}

// Gemini 로고의 파랑→보라 그라데이션 (CSS fill:url(#aiGeminiGrad) 가 쓴다)
(() => {
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  defs.setAttribute("width", "0");
  defs.setAttribute("height", "0");
  defs.setAttribute("aria-hidden", "true");
  defs.style.position = "absolute";
  defs.innerHTML = '<defs><linearGradient id="aiGeminiGrad" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#1c7dff"/><stop offset=".55" stop-color="#6e6bf0"/><stop offset="1" stop-color="#c26be8"/></linearGradient></defs>';
  document.body.appendChild(defs);
})();
