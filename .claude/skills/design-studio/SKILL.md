---
name: design-studio
description: Daling(붕어빵) 디자인 스튜디오 — 앱과 똑같이 생긴 연습용 복제 앱을 띄워 사용자가 화면을 직접 만지고(색·테마·크기·간격·순서·글자) 영역마다 댓글을 달게 하고, 저장한 '디자인 요청'을 읽어 실제 앱 코드(web/styles.css·index.html·app.js)에 반영한다. "디자인 스튜디오 열어 줘", "스튜디오 저장본 반영해 줘", "디자인 요청 반영", "내가 만져 본 대로 바꿔 줘", "/design-studio" 에 쓴다.
---

# 디자인 스튜디오

사용자가 말로 "여기 좀 줄여 줘"를 반복하는 대신, **복제 앱에서 직접 만져 본 결과**를 Claude 가 실제 코드로 옮기고 더 다듬는 도구다.

| 파일 | 하는 일 |
|---|---|
| `tools/design_studio/studio_server.py` | 복제 앱 서버. 진짜 `web/` 화면 + 진짜 `web_ui.DashboardHandler` 를 쓰고 데이터만 바꾼다. POST 는 전부 가짜 응답 |
| `tools/design_studio/demo_data.py` | 지어낸 학생 데이터(과목 5개·자료·마감·메일·시간표). 날짜는 늘 오늘 기준 |
| `tools/design_studio/studio.js` · `studio.css` | 앱 위에 얹는 편집 도구 (Shadow DOM). 앱 코드는 건드리지 않는다 |
| `tools/design_studio/snapshot.py` | 저장본을 '지금 화면' / '요청한 화면' 사진으로 찍는다 |
| `tools/design_studio/requests/` | 저장본 `<날짜-시각-제목>.md`(읽기용) + `.json`(정확한 값). git 에 안 올라간다 |

`tools/` 는 설치 파일에 들어가지 않는다(`bungeoppang.spec` 은 `web/`·`data/` 만 묶는다).

## A. 스튜디오 열기

```powershell
.venv\Scripts\python.exe tools\design_studio\studio_server.py              # 연습용 가짜 데이터 (기본, 8796 포트)
.venv\Scripts\python.exe tools\design_studio\studio_server.py --data real  # 내 데이터 폴더를 읽기만
```

- 브라우저가 저절로 열린다. 포트가 차 있으면 다음 빈 포트로 옮겨 뜨고 주소를 찍는다.
- **demo**: 임시 폴더에 가짜 데이터를 만들고, 바깥으로 나가는 연결(LMS·메일·학교 API·프록시)을 소켓에서 막는다. 시간표·내 일정·선택 상태처럼 임시 폴더 안에서 끝나는 POST 만 진짜로 처리한다.
- **real**: 사용자 데이터 폴더(`C:\lms-autosaver`)를 읽기만 한다. POST 는 전부 막는다. 실제 메일 제목이 저장본에 들어갈 수 있으니 사용자가 원할 때만 쓴다.
- Claude 데스크톱 앱이면 `.claude/launch.json`(git 제외 파일)에 아래 항목을 넣고 `preview_start` 로 띄워도 된다.
  ```json
  { "name": "design-studio", "runtimeExecutable": ".venv\\Scripts\\python.exe",
    "runtimeArgs": ["tools\\design_studio\\studio_server.py", "--no-open"], "port": 8796 }
  ```

띄운 뒤 사용자에게 짧게 알려 줄 것:

- 아래 막대: **둘러보기(V)** 앱처럼 누르며 화면 이동 · **고르기(S)** 요소를 골라 오른쪽 패널에서 바꾸기 · **댓글(C)** 누르면 그 자리, 끌면 영역에 댓글
- 고른 상자 왼쪽 위 **⠿ 옮기기**를 끌면 순서가 바뀌고, 오른쪽 아래 모서리를 끌면 크기가 바뀐다. 두 번 누르면 글자 고치기. ↑ 는 바깥 상자.
- **색·테마** 탭: 테마별 색 토큰과 강조색 빠른 조합. **조합 A/B/…**: 따로 바꿔 보고 숫자 키로 비교
- Alt 를 누른 채 누르면 고르기·댓글 중에도 앱이 그대로 받는다. `\` 는 도구 숨기기, Ctrl+Z 되돌리기.
- 다 되면 **저장해서 Claude에게** → "디자인 스튜디오 저장본 … 반영해 줘" 라고 말하면 된다.

## B. 저장본 반영하기

### 1. 저장본 고르기
- 이름을 말했으면 그것(앞부분만 말해도 `requests/<이름>*.json` 으로 찾는다).
- 아니면 `tools/design_studio/requests/` 바로 아래(= 아직 반영 안 한 것) 중 가장 최근 것. 반영 안 한 것이 여러 개면 목록을 보여 주고 최근 것부터 한다고 말한다.
- `.md` 를 먼저 읽고, 값이 애매하면 `.json` 을 본다. `.json` 의 `variants[chosen]` 이 반영할 조합이고 나머지 조합은 참고만 한다.

### 2. 사용자가 본 화면을 직접 본다
```powershell
.venv\Scripts\python.exe tools\design_studio\snapshot.py <이름>
```
`requests/shots/<이름>/<화면>-now.png`(지금 소스)와 `<화면>-target.png`(요청한 모습, 댓글 핀 포함)가 생긴다. 둘 다 Read 로 열어 비교한다.
사진 크기는 사용자가 쓴 앱 너비(`viewport.w`) 그대로다 — 패널을 붙여 앱이 좁았으면 그 너비의 배치다.
Playwright 를 못 쓰면 스튜디오를 띄워 `/?load=<이름>&view=<화면>&variant=<번호>` 를 열어 보면 된다 (`&clean=1` 은 도구를 감춘다).

### 3. 소스로 옮기기 — 덮어쓰기 CSS 를 그대로 붙이지 않는다
저장본의 "화면에서 쓴 CSS" 는 `!important` 덮어쓰기로 보여 준 것이다. **원래 규칙을 찾아 고친다.**

| 바뀐 것 | 어디를 고치나 |
|---|---|
| 색·모양 토큰 (`--accent` 등) | `web/styles.css` 맨 위 테마 블록. 기본=`:root`, 화이트=`[data-theme="light"]`, 남색=`[data-theme="navy"]`, 다크=`[data-theme="dark"]`. 저장본의 '테마' 열에 적힌 테마만 고친다. 화이트는 강조색을 `:root` 에서 물려받으니 기본을 고치면 화이트도 바뀐다 — 보고에 적는다 |
| 요소 모양 (`selector` · `prop`) | `target.rules` 에 적힌 styles.css 규칙을 grep 해서 그 선언을 고친다. `(@media …)` 가 붙은 규칙도 같은 값을 쓰는지 본다. 다크 테마에 따로 덮은 규칙(`[data-theme="dark"] .x`)이 있으면 함께 맞춘다 |
| 범위가 '이 요소만'(`#id > div:nth-of-type(2)` 같은 경로) | 경로 선택자를 그대로 쓰지 말고, 그 요소의 뜻 있는 클래스·id 를 찾아 규칙을 단다. 필요하면 index.html·app.js 에 클래스를 하나 더한다 |
| 색을 직접 고른 값(`#3e63a6`) | 가까운 토큰이 있으면 `var(--…)` 로 쓴다. 새 색이 꼭 필요하면 토큰을 새로 만들고 네 테마 모두 값을 정한다 |
| 글자 | `from` 문구를 `web/index.html`·`web/app.js`(·화면 문구를 주는 `web_ui.py`)에서 grep 해 바꾼다. 그 뒤 `python scripts/i18n_extract.py` 로 `web/i18n/en.json` 영어를 채운다(빠진 것 0, CLAUDE.md 26-5) |
| 순서·위치 | 고정된 부분(사이드바 `.nav-item` 등)은 `index.html` 순서를, 그려지는 목록은 `app.js` 의 그리는 순서를 바꾼다. 첫 실행 소개(`TOUR_STEPS`)가 그 순서에 기대면 함께 고친다(CLAUDE.md 26-4). 시간표는 버튼 방식 유지(26-2) |
| 너비·높이(`width`/`height` px) | 고정 px 보다 `max-width`·`min-height`·`grid-template-columns` 처럼 창 크기에 맞게 늘고 주는 쪽으로 옮긴다 |

댓글:
- `[고쳐 줘]`·`[아이디어]` → 반영한다. `anchor.path`·`anchor.rules`·영역의 `inside` 목록으로 정확한 요소를 찾는다.
- `[좋아요·유지]` → 그 부분은 건드리지 않는다(주변을 고치다 바뀌지 않게 확인).
- `[질문]` → 답을 보고에 적는다. 코드는 사용자가 원할 때만.
- `(해결됨)` 표시는 건너뛴다.

재량(`freedom`):
- `refine`(기본, "뜻을 살려 더 다듬어 줘") → 요청의 뜻이 살도록 주변도 맞춘다: hover·focus·active 상태, 다크/남색 테마 짝, 같은 모양의 다른 화면, 좁은 창(@media)에서의 모습. 무엇을 더 했는지 따로 적는다.
- `exact` → 적힌 값만 옮긴다.

### 4. 확인
1. `node --check web/app.js`. 파이썬을 고쳤으면 `py_compile`.
2. `snapshot.py <이름> --tag after` → `<화면>-after.png` 를 `<화면>-target.png` 와 비교한다. 다르면 고치고 다시. 토큰을 바꿨으면 `--theme dark` 로도 찍어 본다.
3. 화면 오류(스냅샷 끝의 "화면 오류")가 없어야 한다.
4. CLAUDE.md 1~3: `web/` 를 고친 것은 설치 파일을 다시 만들어야 사용자 앱에 들어간다(`packaging\build_installer.ps1 -Install`). 이 단계는 사용자에게 물어보고 한다. 새 버전을 낼 때만 `VERSION`·`data/changelog.json` 을 올린다.

### 5. 마무리
- 저장본 `.md` 끝에 `## 반영 결과 (날짜)` 를 덧붙인다: 댓글 번호별 한 일, 바꾼 파일:줄, 하지 않은 것과 이유, 재량으로 더 한 것.
- `.json`·`.md` 를 `tools/design_studio/requests/applied/` 로 옮긴다(지우지 않는다). 사진 폴더는 그대로 둔다.
- 사용자에게: 댓글 번호별로 무엇을 했는지 짧게, `target` 과 `after` 사진 경로, 설치 파일을 다시 만들지 물어본다. 커밋은 사용자가 요청할 때만(CLAUDE.md 28).

## C. 스튜디오 자체를 고칠 때
- 앱에 새 화면이 생기면 `studio.js` 의 `VIEW_LABEL` 에 이름을 더한다.
- 새 색 토큰은 `TOKEN_GROUPS`, 새 테마는 `THEMES`.
- 바깥 서버를 부르는 새 GET 은 `studio_server.DEMO_GET_MOCKS` 에 그럴듯한 빈 답을, 임시 폴더 안에서만 끝나는 새 POST 는 `DEMO_LOCAL_POSTS` 에 더한다(나머지 POST 는 자동으로 막힌다).
- 화면에 보이는 데이터가 비어 보이면 `demo_data.py` 를 채운다. 실제 사람 이름·메일 주소는 넣지 않는다.
- 고친 뒤 `node --check tools/design_studio/studio.js`, `python -m py_compile tools/design_studio/*.py`, 그리고 스튜디오를 띄워 고르기·댓글·저장·`?load=` 다시 열기를 한 번씩 해 본다.
