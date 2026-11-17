# Daling 앱 규칙 (디자인 스튜디오용)

DGIST 학생용 Windows 데스크톱 앱(pywebview). 화면은 프레임워크 없는 `web/index.html`·`web/app.js`·`web/styles.css`, 서버는 `web_ui.py`.

## 디자인
- 크림 바탕 + 달구 파랑 강조(`--accent #3e6bb9`, 2026-10-14 테라코타에서 바꿈). 글꼴은 고딕 한 벌(웹폰트·명조 없음). 색은 토큰(`--accent`, `--surface`, `--text-soft` …)을 쓴다. 새 색이 꼭 필요할 때만 hex.
- 화면 문구는 짧은 한국어, 사람 말로. 둥근 카드(`--radius`), 옅은 그림자(`--shadow`). 지나친 장식·그라데이션은 피한다.

## 테마 (styles.css 맨 위 블록)
- 고르는 테마는 자동·기본·다크 셋(app.js `THEMES`). 자동은 Windows 설정에 따라 기본 또는 다크로 칠한다.
- 기본=`:root`, 다크=`[data-theme="dark"]`. 저장본의 '테마' 열에 적힌 테마만 고친다.
- 화이트(`light`)·남색(`navy`)·그래파이트는 목록에서 뺐고 색만 남아 있다. 새로 고치지 않는다.
- 새 색 토큰을 만들면 기본·다크 모두 값을 정한다. 다크에 따로 덮은 규칙(`[data-theme="dark"] .x`)이 있으면 함께 맞춘다.

## 화면 코드
- 화면 키: dashboard, deadlines, calendar, courses, files, emails, storage, settings. 화면 이동은 `switchView`.
- 새 화면 부분은 `RENDER_PARTS` 에 서명과 함께 넣어 값이 안 바뀌면 다시 그리지 않게 한다.
- 전역 `[hidden] { display: none !important; }` — 숨길 때는 `el.hidden`.
- 확인 창은 `uiConfirm`/`appDialog`, 알림은 `showToast`, 오류 문구는 `humanError`.
- 위임 리스너가 많다. 단추 동작은 id·class·`data-act` 로 grep 해 처리기를 찾는다.
- 목록을 고치는 기능은 드래그가 기본, 단 **주간 시간표는 버튼(편집 창) 방식 유지**(드래그 넣지 않음).
- 사이드바 `.nav-item` 순서는 `index.html`, 그려지는 목록 순서는 `app.js`. 첫 실행 소개(`TOUR_STEPS`)가 그 순서·선택자에 기대면 함께 고친다.

## 글자
- 화면 문구를 바꾸면 영어 화면도 맞춘다: 진짜 반영 때는 `python scripts/i18n_extract.py` 로 `web/i18n/en.json` 을 채우고(빠진 것 0), 시안에서는 시안 폴더의 `i18n/en.json` 을 직접 고친다.
- 사용자 자료(메일·과목명)는 번역하지 않는다.

## 반영한 뒤 (시안 모드에서는 하지 않는다)
- `node --check web/app.js`, 파이썬을 고쳤으면 `py_compile`.
- `web/` 를 고친 것은 설치 파일을 다시 만들어야 사용자 앱에 들어간다(`packaging\build_installer.ps1 -Install`). 사용자에게 물어보고 한다.
- 커밋은 사용자가 요청할 때만.
