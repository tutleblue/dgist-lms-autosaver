# 붕어빵 기능 지도 (FEATURES.md)

DGIST 학생용 데스크톱 앱 "붕어빵"(저장소 이름 dgist-lms-autosaver)의 기능을 화면·백엔드·데이터 단위로 정리한 문서입니다.
작업 규칙과 명령어는 `CLAUDE.md`에 있습니다. 이 문서는 "무엇이 어디에 있는가"를 찾을 때 씁니다.

- 기준 버전: `VERSION` 1.11.0 (2026-09-22 기준 코드)
- 코드가 바뀌면 이 문서의 해당 절도 같이 고칩니다.

---

## 1. 한눈에 보기

앱의 핵심 목적은 **학교 생활에 필요한 정보를 자동으로 모아 한 화면에서 쓰게 하는 것**입니다.

| 모으는 것 | 출처 | 담당 모듈 |
|---|---|---|
| 강의자료 파일 | LMS (Blackboard Ultra REST API, Playwright 로그인) | `lms_crawler.py` |
| 과제 마감 | LMS | `lms_crawler.py` (`crawl_deadlines_only`) |
| 학교 메일 | DGIST 메일서버 IMAP (`mail.dgist.ac.kr:993`) | `email_reader.py` |
| 학사일정 | data.go.kr API + DGIST 홈페이지 | `academic_calendar.py`, `dgist_api.py` |
| 개설강좌·학점 | data.go.kr API + DGIST 조회 | `timetable_import.py`, `dgist_api.py` |
| 학교 공지 | DGIST 홈페이지 게시판 | `notice_board.py` |
| 셔틀 시간표 | DGIST 홈페이지 | `shuttle.py` |
| 조직도(주소록) | 사용자가 넣은 파일 + 설치 파일의 교원 주소록(`data/seed_directory_faculty.json`) | `directory.py`, `web_ui.directory_people` |
| FGLP 파견 대학 | 내장 데이터 | `fglp.py` |

모은 것을 보내는 곳은 Google Drive, Google Calendar, 삼성 노트, 내 컴퓨터(문서 폴더)입니다.

---

## 2. 실행 구조

```
붕어빵.exe (PyInstaller onedir, Python 3.14)
├─ 메인 스레드: pywebview 창 (WebView2) ─ http://127.0.0.1:<포트>
├─ 서버 스레드: ExclusiveHTTPServer + web_ui.DashboardHandler (API + 정적 파일)
├─ 스케줄러 스레드: app.scheduler_loop (30초마다 할 일 확인)
├─ 삼성 노트 스레드: web_ui.start_notes_job (요청 시)
└─ 작업 프로세스: 붕어빵.exe --autosaver-job <sync|deadlines|emails|verify|google-oauth>
```

- **포트**: 기본 8765. 다른 프로그램이 쓰고 있으면 8766~8785 중 빈 곳을 씁니다 (`app.start_server`). 이미 켜진 붕어빵은 `/healthz` 응답 모양(`ok`, `mode`)으로 알아보고 창만 엽니다.
- **작업 프로세스**: 무거운 일(LMS 크롤, 메일 수집)은 별도 프로세스로 돌립니다. EXE에서는 `sys.executable -c`를 쓰면 창이 새로 뜨므로 반드시 `--autosaver-job` 플래그(`runtime_config.WORKER_FLAG`)로 부릅니다. 진행 로그는 `task_states`에 쌓이고 `/api/task`로 화면에 갑니다.
- **공유 웹 모드**: `AUTOSAVER_MULTI_USER=1`이면 쿠키별 작업공간을 나눕니다 (`DEPLOYMENT.md`, Render). 데스크톱 앱은 단일 사용자 모드입니다.

---

## 3. 화면별 기능

화면은 `web/index.html`의 `#view-<이름>` 구간과 `web/app.js`의 렌더 함수로 이루어집니다.
`app.js`의 `RENDER_PARTS`가 "어느 화면에서 무엇을 그릴지"와 "값이 바뀌었는지 판단하는 서명"을 갖고 있어서, 보고 있지 않은 화면은 그리지 않습니다.

**목록을 고칠 때는 드래그가 기본입니다.** 대시보드 블록 순서, 내 폴더에 자료 담기, 메일 쓰기 첨부, 메일을 폴더로 옮기기가 끌어서 됩니다. 버튼과 메뉴는 키보드·좁은 화면을 위해 그대로 둡니다.
**시간표는 예외입니다.** 수업은 눌러서 편집 창으로 고칩니다 (사용자가 버튼 방식을 그대로 쓰기로 정함).

### 3.1 공통 (상단·사이드바)

| 기능 | 설명 | 코드 |
|---|---|---|
| 검색창 | 120ms 기다렸다가 지금 화면만 다시 그림 | `#searchInput` 핸들러 |
| 새로고침 버튼 | 화면마다 이름과 동작이 바뀜. 메일함·메일 쓰기에서는 숨김(메일함 안에 제 새로고침이 있다). 마지막 동기화 시각(`#lastSync`)과 한 알약(`.sync-pill`)에 묶임. 1280px 이하에서는 아이콘만. 검색은 Ctrl+K | `VIEW_REFRESH`, `runViewRefresh`, `updateRefreshButton` |
| 통합 검색 | 상단 검색창. 치는 동안 과목·자료·과제·메일·일정(메일 행사·내 일정·학사일정)·공지·설정을 무리별로 보여 주고 고르면 이동. 초성 검색, ↑↓/Enter/Esc, Ctrl+K. 과제·찾지 못한 자료는 그 화면을 이름으로 거름(검색창을 비우면 풀림) | `buildSearchResults`, `renderSearchPop`, `bindSearchPop`, `matchScore` |
| 마지막 동기화 표시 | "자동 · 마감 16시간 전 · 메일 1분 전" | `renderLastSync`, `/api/health` |
| 위쪽 진행 막대 | 동기화 단계 또는 삼성 노트 진행 | `showTopProgress`, `renderTask`, `watchNotesJob` |
| 테마 카드 | 누를 때마다 다음 테마 | `#themeFlip` |
| 시계·지금 수업 | 사이드바 위 시계, 시간표 기준 현재 수업 | `renderNowBar` (1초마다, 값이 같으면 DOM 안 건드림) |
| 동기화 경고 배너 | 연속 실패 또는 3일 이상 동기화 안 됨 | `renderHealth` |
| 화면 자동 갱신 | 작업 중 2초, 평소 12초, 창이 가려지면 쉼 | `refreshAll` 타이머 |
| 첫 실행 소개 | 처음 켜면 마스코트 달구가 메뉴와 화면 안 요소(시간표·D-day·공지 탭·자료 보기 방식·메일 쓰기·저장 위치·언어…)를 비추며 기능을 알려 줌(24단계, 묶음 시작·매일 보는 곳·공부·메일·편하게 쓰기·설정, 단계마다 짧은 기능 목록 tips. 건너뛰기·이전·다음, 점을 눌러 건너뛰기, 키보드 ←→ Esc). 아래쪽 요소는 비추기 전에 스크롤해 오고, 못 찾으면 fallback(그 메뉴), 학사일정이 없으면 D-day 단계는 뺌(when). 본 기록은 데이터 폴더 `tutorial.json`. 설정의 '앱 소개 다시 보기'로 다시 봄. 마치면 처음 쓰는 사람의 '새 업데이트' 점은 끔 | `TOUR_STEPS`, `startTour`, `/api/tutorial`, `/api/tutorial/done`, `web/img/dalgu/` |
| 체험 모드 | 계정 없이 가짜 데이터로 모든 화면 둘러보기. 켜는 곳: 첫 실행 소개 첫 카드 '계정 없이 체험하기'·상단 바 알약(계정이 없을 때)·설정 › 연결된 계정 › 체험 모드. 켜 있으면 창 맨 위 줄무늬 띠 + 상단 바 '체험 중 · 가짜 데이터 · 체험 끝내기' + 상태판 '체험 중'. 아래 '체험 모드' 절 | `demo_mode.py`, `renderDemoPill`, `setDemo`, `/api/demo` |
| 업데이트 소식 | 새 버전일 때만 사이드바 아래 상태 카드 바로 위에 '새 업데이트' 카드가 붙음. 누르면 바뀐 내용 창, 한 번 보면 사라짐(지난 내용은 설정의 '업데이트 내용'). 본 기록은 데이터 폴더 `whats_new.json` | `loadWhatsNew`, `openWhatsNew`, `/api/whats-new`, `data/changelog.json` |

### 3.2 대시보드 (`dashboard`)

- 인사말: 명조체 한 줄 + 불꽃 표시, 이름(보낸 편지함의 내 이름에서 성을 뺌), 아래에 '오늘 남은 수업 · 7일 안 마감 · 안 읽은 메일'. 문장은 시간대별로 하루 동안 고정 (`setHeroGreeting`, `HERO_LINES`)
- 학사일정 D-day: 시험 → 정규 수강신청·변경·포기 → 그 밖(등록·성적확인·계절학기 등) 순서. 석 달 안에 시험·정규 수강신청이 있으면 그것 먼저, 아래에 다음 두 개 (`DDAY_TIERS`, `ddayTier`, `renderDday`). 대학원만의 일정은 뺌
- 지표 카드: 임박한 마감, 전체 자료, 강의 수, 새 메일
- **주간 시간표**: 수업을 눌러 편집 창에서 고치기(드래그로 옮기지 않음 — 사용자가 정한 방식), 에브리타임 링크 가져오기, 시간표 이미지 가져오기(Gemini 키 필요), 토요일 표시
  - 색: 과목(과목번호, 없으면 이름)마다 반드시 다른 색. 12가지(`TT_COLORS`, `.tone-*`). 그릴 때마다 `normalizeTtColors`가 겹친 과목만 다시 칠하고 바뀐 칸만 저장. 12과목을 넘을 때만 가장 적게 쓰인 색을 나눠 씀.
- 다가오는 마감, 다가오는 일정, 학교 공지, 학교 사이트 바로가기
- 시험 기간 응원(`examSeason`, `EXAM_CHEERS`): 학사일정의 학부 중간·기말 시험 기준으로 7일 전(before)·시험 중(during)·마지막 날(last)·끝난 뒤 2일(after). 나우바 아래 줄에 짧은 문장(수업 중·직전 제외). 대시보드 인사 아래 줄(`#heroCheer`)은 1.12.13 에 뺐다(사용자: 거기엔 없어도 됨). 문장은 날짜로 골라 하루 동안 그대로. 나우바를 펼치면(수업이 없을 때) 달구 카드(`nowDalguCard`, `EXAM_DALGU`): 시기별 포즈·움직임(전 study/book 흔들림, 중 fight 주먹, 후 yay/lounge 폴짝)과 위 두 줄과 겹치지 않는 '달구가 하는 말'. 달구를 누르면 폴짝 뛰며 다음 말. 예전엔 펼친 칸이 나우바 아래 줄을 그대로 되풀이했다
- 화면 편집(블록 순서 끌어 옮기기), 모두 접기
  - 편집 화면(1.12.48): 켜도 카드가 움직이지 않는다. 테두리는 `outline`, 조작 알약(`.dash-bar`: 손잡이·이름·위·아래·반 폭/전체·보이기/숨기기, 앱 아이콘 `grip`·`chevronUp/Down`·`colHalf/colFull`·`eye/eyeOff`)은 카드 오른쪽 위 모서리에 걸쳐 띄운다. 켜진 상태(반 폭·숨김)는 `aria-pressed` 강조색. 접기 단추는 `visibility: hidden` 으로 자리만 남긴다. '화면 편집'↔'✓ 완료', Esc 로도 끝낸다. 숨긴 블록은 편집 중에 원래 display 그대로 알약 밖만 흐리게
  - 예전 편집 화면 실측(2026-10-27, 같은 창): 카드마다 위에 22px 를 비워 모든 카드가 9~37px 밀렸고, 카드 크기·그림자 애니메이션이 한꺼번에 돌아 켤 때 33ms 프레임(120Hz 에서 4프레임 빠짐)이 났다. 지금은 밀림 0px·최대 8.7ms. '편집 끝내기' 글자가 길어 '모두 접기' 위에 겹치던 것도 두 단추를 `.dash-tools` 한 줄로 묶어 없앴다
  - 끄는 카드는 `translateY` 만(`scale` 을 걸면 글자가 다시 그려지며 흐려졌다). 자리를 바꿀 때 카드를 다시 붙이면 포인터 붙잡기가 풀려, 창 밖에서 손을 놓으면 카드가 떠 있는 채로 남았다 → 다시 붙인 뒤 `setPointerCapture` 를 다시 건다
  - 배치(`dashLayout`)·접힘(`dashFold`)은 `ui_prefs.json`(`/api/ui-prefs`, `restoreDashPrefs`)에도 둔다. 앱 창 저장소는 끌 때마다 지워져(pywebview 사생활 모드, 재시작 뒤 localStorage 비어 있음 실측) 예전에는 편집한 배치가 다시 켜면 기본으로 돌아갔다
- 과목 변경 감지 배너 → "확인했어요" (`/api/acknowledge-courses`)

### 3.3 과제 마감 (`deadlines`)

- LMS 과제 전체 목록, 과목·상태 필터, 목록에서 숨기기 (`upload_selection.json`의 `hiddenDeadlines`)
- 미제출 과제는 LMS 제출 페이지 열기 (`/api/assignment/open`)
- 캘린더 파일(.ics) 내보내기 (`/api/deadlines.ics`, `/api/export-ics`)

### 3.4 캘린더 (`calendar`)

- 월 달력에 과제 마감 + 학사일정 + 내 일정 + 공휴일 + **메일로 온 행사**
- 여러 날 행사(1.12.18): 행사일 바로 뒤 '부터 …까지'·'~' 의 끝날을 `email_reader.guess_event_end` 가 `eventEnd` 로(2주 이내만, 그보다 길면 신청 기간으로 봄). 본문에 그 사이 날짜를 셋 이상 따로 적었으면 `guess_event_days` → `eventDays`(주말 쉬는 일정). 캘린더는 날마다 'n/N일째' 로, 구글 캘린더는 끝날까지 이어진 종일 일정. 날짜 이름표('개최' 등)가 문장 끝에 있으면 같은 줄 200자 앞까지 본다(비즈니스 모델 세미나가 10/19 로 잡혔던 원인)
- 세미나 연사·발표 제목·장소(`email_reader.guess_seminar_info`, AI 없음): '연사/Speaker/발표자', '제목/Title/주제', '장소/Venue' 이름표 줄(깨진 'Spe a k'·'Venu' 도), 이름표만 있고 값은 다음 줄, 이름표 없는 숫자 번호 줄(사람·강의실·긴 제목으로 짐작, 제목에 세미나류 말이 있을 때만)을 읽는다. 세미나류 말(`_TALK_WORDS`)이 없는 메일은 뽑지 않는다(공모전 상금·강의성찰 목록을 제목으로 읽었었다). `_mark_events` 가 `mail.seminar` 에 넣고, 캘린더 상세(`seminarInfoHtml`)·목록·구글 캘린더(location·description)가 쓴다. 2026-10 메일로 연사까지 뽑힌 것 8건
- 메일 행사: 공식 학사일정에는 달빛제 같은 행사가 없다. 메일 본문·제목에서 날짜를 규칙으로 뽑고(`email_reader.guess_event_date`, AI 불필요), 관심 분야와 맞는 세미나와 학교 전체 행사만 `calendar` 로 표시(`web_ui._mark_events`). 같은 날 같은 행사의 재공지는 하나로 합침. 구글 캘린더 동기화도 이 표시가 붙은 것만 보냄
- 세미나는 분야로만(1.12.51): 제목에 세미나류 말(`email_reader._TALK_WORDS`)이 있는 메일은 설정 관심사 중 '세미나·특강' 낱말(`_GENERIC_TALK_WORDS`)을 뺀 분야·주제 낱말이 제목·보낸 곳과 맞을 때만 `calendar`(학교 전체 행사는 그대로, Gemini 점수는 안 봄). 분야를 하나도 안 골랐으면 예전처럼 '세미나' 로도 올린다. 이유: '세미나·특강' 이 모든 세미나 제목에 걸려 학과와 상관없이 다 올라갔다(2026-10-28 실측: 캘린더 메일 행사 12건 중 세미나 10건 → 고친 뒤 5건, 뇌과학 4·컴퓨터·AI 1). 캘린더에서 따로 고르는 칸은 넣었다가 뺐다(설정에서 이미 고르는데 두 번 고르게 한다는 사용자 지적). 같은 때 짧은 영어 낱말은 낱말 경계로만 맞추게 함(`_word_hit`): 'ai' 가 'Brain' 에 걸려 뇌과학 메일이 컴퓨터·AI 관심으로 잡혔다. 구글 캘린더에 이미 보낸 일정은 지우지 않는다
- 색: 과제 마감 빨강(`cal-deadline`), 학교 행사 노랑(`cal-school`, `schoolEvent`), 관심 세미나 보라(`cal-event`), 제출 완료 초록, 내 일정 파랑, 학사일정 회색 띠. 칸 이름은 `app.js eventShortTitle` 이 날짜·연도·"개최 안내"를 떼고 영어 제목이면 [학과] 꼬리표로 만든다. 오른쪽 상세는 짧은 이름 + 메일 원래 제목 전체(`it.full`)를 줄바꿈해 보여 준다
- 상세에서 메일 일정을 누르면 메일함으로 가지 않고 그 칸이 펼쳐지며(`toggleDayMail`, `.day-item.open`) 본문 글(`mailPlainText`, 주소는 `linkifyText` → `/api/mail/open-link`)을 보여 준다. 읽는 동안 패널이 넓어짐(`.calendar-stage.reading`). '메일함에서 열기'는 보조 버튼
- 학사일정: 대학/대학원 구분, "학부만" 필터
- 내 일정 추가·수정·삭제 (`my_events.json`), 장소는 OpenStreetMap 검색 (`/api/place-search`)
- 구글 캘린더로 학사일정 올리기 (`/api/gcal/sync-academic`)

### 3.5 강의 (`courses`)

- 수강 과목 카드 (자료가 없는 과목도 `courses_state.json`에서 깔아 둠)
- 과목마다 학년·학기, 학점(개설강좌에서 채움, `_fill_missing_credits`), 강의계획서 바로가기
- 편집 모드로 과목 숨기기/복원. 편집 중 카드는 흔들지 않고 점선 테두리만, 숨기기 단추는 빨간 ✕ 대신 앱 단추 모양의 `eyeOff`(1.12.48 — 흔들림은 카드 수만큼 애니메이션 19개가 쉬지 않고 돌았다)
- 개설강좌 목록 (`/api/course-catalog`, `/api/course-terms`)

### 3.6 자료 (`files`)

도구줄: 보기 탭(과목 폴더 / 내 폴더 / 전체 목록, `.file-mode-tab`) · 과목 · 파일 상태(받은 파일/파일 없음) · ⋯ 정리 메뉴(`#filesMoreMenu`).
고른 자료가 있을 때만 그 아래에 '할 일' 막대(`#fileSelectBar`, `updateBulkSaveButton`)가 나타나고, ✕ 로 모두 푼다(`clearFileSelection`).

보기 방식 세 가지 (`state.fileMode`):

1. **리스트**: 전체 표. 체크, Shift+클릭 범위 선택, Ctrl+클릭 행 선택. 최대 400행. 클릭 리스너는 표에 하나만 (`bindFileTableOnce`).
2. **과목별 폴더 (LMS 구조)**: 과목 카드 → LMS와 같은 폴더 나무(예: 1주차 > Lecture 1 > 파일).
   - 폴더와 파일을 LMS에 올라온 순서(`lmsOrder`)대로 섞어 놓음. 순서를 모르면 사람이 읽는 순서("2주차" < "10주차").
   - 하위 폴더마다 전체 선택 체크박스, 일부만 고르면 반쯤 찬 상자.
   - 접힌 폴더는 펼칠 때 그림 (`fillLazyFolder`, `fillLazySubfolder`).
   - 코드: `renderFolderView`, `buildFolderTree`, `folderTreeHtml`, `subfolderHtml`, `compareLmsOrder`.
3. **내 폴더**: 사용자가 만든 폴더에 자료 담기 (`shelves.json`, `/api/shelves`, `/api/shelves/save`).

고른 자료에 하는 일 (`/api/files/bulk`의 `action`):

| 버튼 | action | 동작 |
|---|---|---|
| 내 컴퓨터에 저장 | (별도) `/api/save-local` | `문서\붕어빵 파일 정리\<과목>\`에 복사 |
| Drive에 올리기 | `drive` | 과목 폴더로 업로드, 이미 있으면 건너뜀 |
| 삼성 노트로 | `notes` | 뒤에서 넣기 시작, 즉시 응답 (4.4절) |
| 목록에서 빼기 | `hide` | 파일은 두고 목록에서만 뺌 (`hiddenFiles`) |

⋯ 메뉴: 학기·과목 폴더로 정리(`/api/organize-files`, 옮기고 중복 제거), 삼성 노트 폴더 정리(`/api/samsung-notes/organize`, 삼성 노트 있는 PC만), 숨긴 자료 되돌리기(뺀 게 있을 때만).
예전 보기 전환 버튼은 메일함과 같은 `.view-toggle-btn` 클래스라 메일함 클릭 처리기가 같이 걸려 `emailView`를 망가뜨렸다. 이제 `.file-mode-tab` 이다.
동기화 시작은 위쪽 '자료 새로고침' 하나뿐이다. `#runButton`은 작업 중에만 '작업 중지'로 나타난다. '검증' 버튼(`/api/verify`)은 화면에서 뺐다(설정의 '전체 다시 확인'과 겹쳐서). API 와 작업 종류는 그대로 있다.

### 3.7 메일함·메일 쓰기 (`emails`, `compose`)

메일 쓰기는 사이드바 메뉴가 아니라 메일함 안의 '메일 쓰기' 버튼으로 연다(`switchView("compose")`). 쓰는 동안 사이드바는 '메일함'이 켜진 채로 둔다.

목록:
- **삼성 이메일식 세 줄**: 메일함 꼬리표 · 보낸 사람 · 시각(오늘은 "오전 10:32", 지난 것은 "9월 7일") / 제목 / 미리보기 · 별표. 첨부가 있으면 클립 아이콘.
- **날짜 묶음**: 오늘, 어제, "9월 6일 일요일" (최신순일 때만). `emailListHtml`, `mailDayLabel`.
- **메일함 새로고침**: 메일함 제목 옆 버튼. 마지막으로 받은 때를 "3분 전 업데이트"로 표시 (`refreshMailNow`, `renderMailRefreshAgo`).
- 폴더: 받은/보낸/임시/휴지통/프로모션. 분류 탭: 기본, LMS·공지. 빠른 필터: 안읽음, 중요(별표), 첨부.
- 카드 보기와 목록 보기, 정렬(최신·오래된·보낸 사람·제목·관심도).
- 선택해서 읽음/안읽음/삭제/되돌리기, 모두 읽음.
- **드래그로 옮기기**: 메일 줄을 왼쪽 폴더로 끌어다 놓으면 받은 편지함·프로모션으로 이동, 휴지통으로 삭제, 중요로 별표. 고른 메일이 여럿이면 함께 옮겨집니다 (`bindMailDrag`, `dropMailsOnFolder`). 휴지통에서 받은 편지함으로 끌면 되돌리기.

읽기 화면:
- HTML 메일을 스크립트 막은 iframe(srcdoc)으로 그림. 밝은 테마에서는 본문 바탕을 투명하게 하고 메일 속 순백 바탕을 걷어 내 앱 배경 위에 앉힘(`blendMailBackground`). 다크 테마는 종이 카드 위에 올림(`mailOnPaper`). 남색 테마는 1.11.10부터 밝은 바탕 + 잉크 남색 강조(`#3e63a6`)라 밝은 테마로 친다. 본문 안 그림(`cid:`)은 `/api/mail-image`로 서빙. 긴 메일은 40,000px까지 높이 맞춤.
- 본문 링크는 기본 브라우저에서 열림(`bindMailLinks`, `/api/mail/open-link`). 메일 주소(mailto:)는 앱의 메일 쓰기로 열림. http·https 가 아닌 주소는 열지 않음.
- 답장, 전체 답장, 전달, 이전/다음 메일, 별표(서버 `\Flagged`), 삭제.
- ⋮ 메뉴: 읽지 않음으로 표시, 한국어로 번역, 다시 알림, 이메일 이동(폴더 만들기 포함), 인쇄, 파일로 저장(.eml), 일정 추가, 리마인드 메일 쓰기.
- 답장 안 온 보낸 메일 찾기 (`/api/mail/pending`) → 리마인드 초안 (`/api/mail/reminder`).

쓰기:
- 서식 도구, 서명, 인용, 주소 찾기(조직도 + 받은 주소 자동완성), 임시저장, 미리보기.
- 첨부: 내 PC, 사진, URL, Drive, "내 자료"(받아 둔 강의자료, 쓰기 창 아래에 펼침).
- 보내기: 학교 SMTP (`/api/send-email`, `smtp.dgist.ac.kr:465`).

### 3.8 창고 (`storage`)

- FGLP 파견 지도: 세계지도(`web/img/world.png`) 위 대학 핀, 대륙별 확대, FGLP/학점교류 탭 (`/api/fglp`)
  - 자료: `fglp.py`. 2027 국제학부 입학안내서(2026.6) 13·15쪽 기준. FGLP 28곳(TYPE 1 25, TYPE 2 3), 학점교류는 이름 나온 11곳. 안내서는 그림 PDF라 눈으로 옮겨 적음.
  - 학교 상세 보강(2026-10-21): 사진 여러 장(가로로 넘김, ‹ › 단추), 한국어 이름, 현지 시각·한국과의 시차(브라우저 Intl, 서머타임 반영, `fglp._TZ`), 설립 연도·국공립/사립·학생 수(위키데이터), DGIST에서의 거리(대원거리, 100km 단위), 링크 단추(홈페이지·여름학기 안내·위키백과·OpenStreetMap 지도)와 사진 출처.
    - 자료는 `tools/fetch_uni_info.py` → `uni_info.json`(설치 파일에 묶음, 세 spec 모두) + `web/img/uni/<학교>-<n>.jpg`(640px, 110장 7MB). 시스템 파이썬으로 돌린다(사진 줄이기에 Pillow).
    - 사진은 사람이 고른다(`PICKS`). 커먼스 분류 자동 선택은 고무도장·나무·백신 상자처럼 엉뚱한 게 대부분이었고, 예전 한 장짜리(`uni_photos.json`, 하버드는 시위 사진)도 지웠다.
    - 여름학기 주소는 후보를 열어 보고 제목·주소에 summer 가 있는 것만, 봇 차단(JHU 403)·인증서 문제는 웹 검색으로 확인한 공식 도메인 주소(`SUMMER_SEARCHED`). INSA Lyon·Calgary·RMIT 는 방문 학생용 여름 정규 수업 안내를 못 찾아 비움.
    - 위키데이터 학생 수가 10만을 넘으면(UW–Madison 137,123 = UW 체계 전체) 비운다. 한 줄 소개는 넣지 않았다(한국어 위키백과 첫 문장이 '최상위권 명문' 같은 자랑이거나 비어 있음).
    - 바깥 링크는 `/api/open-url` 로 기본 브라우저에서 연다. 학교 도메인 말고는 막혀 있어서 `fglp.known_links()`(앱에 든 주소와 똑같은 것)만 더 허락한다.
  - 지도 움직임(2026-10-21): 그림과 핀이 한 판(`.wm-stage`)에 붙어 함께 미끄러진다(0.55초). 예전엔 핀을 보는 칸 기준으로 다시 그려 점이 먼저 새 자리에 뜨고 지도가 뒤따랐다. 핀은 세계 좌표(%)라 대륙을 바꿔도 다시 그리지 않고, 탭이 바뀔 때만 차례로 피어난다. 큰 지도 그림이 풀린 뒤에 판째로 나타난다.
    - 목록이나 지도에서 학교를 고르면 지도가 그 학교를 가운데에 두고 가로 36도로 다가간다(`state.fglpFocus`, `FGLP_FOCUS_SPAN`). 상세를 닫으면 보던 대륙으로 돌아간다.
    - 창 크기 감시(ResizeObserver)는 판 자리만 다시 맞춘다. 예전엔 `renderFglpAll` 까지 불러, 상세를 열어 스크롤 막대가 생기며 지도 폭이 2px 줄면 상세가 도로 닫혔다.
  - 핀의 기준점은 점 한가운데(`.wm-pin`은 점 크기, 이름표는 절대 위치). 덩어리 가운데를 맞추면 점이 이름표 폭 절반만큼 밀린다.
  - 대학 사진: `tools/fetch_uni_photos.py` (위키미디어, 작성자·라이선스 기록). 엉뚱한 사진이 골라진 곳은 `SKIP`.
- 셔틀버스 시간표 (`/api/shuttle`): 출근·퇴근·원내순환·원외순환·주말순환. 하루 캐시, 못 받으면 예전 시간표라고 표시. 해석은 `shuttle._routes_from_table`이 표 머리줄의 칸 이름을 읽어 정함

### 3.9 설정 (`settings`)

사용자가 바꿀 일이 있는 것만 둔다. 한 단짜리 카드(`.st-card`, 머리에 색 타일 + 한 줄 설명)를 위에서 아래로 읽는다.
긴 설명은 `?`(`.hint`, `data-hint`)에 숨긴다. 마우스를 올리거나 누르면 보이고, 다른 곳을 누르거나 Esc 로 닫힌다.
개발자용 칸(다운로드 경로·LMS 주소·로그인 주소)은 화면에서 뺐다. 폼에 없으면 `write_config`가 저장된 값을 그대로 둔다.

| 카드 | 내용 |
|---|---|
| 연결된 계정 | LMS·학교 메일·Google 줄마다 로고와 상태 알약(`renderAccountPills`, `renderGoogleSection`). 비밀번호는 DPAPI 암호화, 바꿀 때만 입력. 맨 아래 '체험 모드' 줄(`#demoRow`, 체험해 보기/체험 끝내기) |
| 앱 잠금 | 스위치(켜면 네 자리를 두 번), 자동 잠금 시간(끄기·1·5·10·30분·1시간, 기본 10분), 비밀번호 바꾸기, 지금 잠그기(Ctrl+L). 바꾸는 즉시 적용되고 `config.json` 과 따로다. 아래 '앱 잠금' 절 |
| 강의자료 저장 | 저장 위치 카드 두 개: 구글 드라이브(`AUTO_DRIVE_UPLOAD`, 구글 미연결이면 '로그인 필요'), 내 컴퓨터(스위치 + 이번 학기/모든 과목 → `AUTO_LOCAL_SAVE`, 폴더 바꾸기, 지금 맞추기). `renderSaveDestinations` |
| └ 다른 클라우드 | OneDrive·Dropbox·iCloud Drive·네이버 MYBOX. 로그인 없이 PC 동기화 폴더 안 `붕어빵 강의자료\<과목>`에 넣는다 (`detect_cloud_roots`, `cloud_targets`, 설정 `CLOUD_SAVE`). 못 찾으면 '폴더 고르기'(`/api/pick-folder`)로 `path` 지정. '넣을 과목'(`SAVE_SCOPE`)과 '지금 맞추기'는 내 컴퓨터·클라우드 공통. 복사는 `autosave_local` → 위치마다 `_mirror_rows` (필기한 파일 보호 규칙 동일). 과목 아래는 LMS 하위 폴더(`lms_subfolders`) 그대로, 1.11.3까지 펼쳐 넣은 사본은 옮겨 놓는다 |
| └ 차지하는 공간 | 같은 카드 아래. 앱(프로그램 + LMS 로그인용 브라우저 + 메일·설정 데이터) / 강의자료 / 내 컴퓨터 사본을 한 막대로(`/api/storage`의 `app`·`localSave`). Edge 를 쓰는 PC 에 예전 셸이 남았으면 막대 아래 '예전에 받은 LMS 브라우저' 줄과 '휴지통으로 보내기'(`/api/storage/trash-browser`). 접힌 '강의자료 정리하기'에서 학기·과목별 삭제(`/api/storage/cleanup`, 앱 보관함에서만) |
| 자동으로 가져오기 | 메일(기본 5분)·과제 마감(60분)·강의자료(180분) 주기, 하루 한 번 전체 확인 시각(`SCHEDULE_TIME`) |
| 구글 캘린더 | 머리의 스위치로 메일 일정 자동 등록, 캘린더 이름, 지금 넣기, 학사일정도 넣기 |
| 관심 있는 메일 | 관심 분야·활동 태그, 직접 적기, 끝난 행사 메일 숨기기 |
| ~~추가 기능 켜기~~ | 뺐음(2026-10-21, 사용자: API 키를 직접 요청하는 설정 지우기). 이미 저장된 Gemini·DGIST 키는 `write_config` 가 그대로 두고 계속 쓴다(빈 칸 = 기존 값 유지). 공공데이터 키는 앱에 묶인 기본 키. 시간표 이미지 가져오기 단추는 저장된 Gemini 키가 있을 때만 보인다(`renderSecretBadges`). |
| 앱 | 버전, 업데이트 내용, 전체 다시 확인, 설정 내보내기/불러오기(비밀번호 포함 여부) |

앱 크기에서 브라우저는 `chromium_headless_shell-*` 만 센다(`browser_setup.shell_dirs`). 같은 `ms-playwright` 폴더의 일반 `chromium-*`(약 430MB)은 개발용이라 앱 몫이 아니고 정리할 때도 건드리지 않는다. Windows 는 Edge 를 쓰므로(4.1) 새로 깐 PC 에는 이 칸이 없다. 예전에 받아 둔 셸(약 270MB)이 남은 PC 에서는 이름을 '예전에 받은 브라우저 (지금은 안 씀)'으로 바꿔 세고(`unused`), 막대 아래 줄의 '휴지통으로 보내기'로 정리한다(2026-10-15).
- **지우지 않고 휴지통으로**: `browser_setup.recycle` 이 `SHFileOperationW`(FOF_ALLOWUNDO) 로 폴더째 보낸다. 휴지통 크기를 넘으면 Windows 가 조용히 영구 삭제하므로 `FOF_WANTNUKEWARNING` 으로 먼저 묻게 했다.
- **쓰는 중이면 안 옮김**: 폴더 이름을 잠깐 바꿔 보아(`.daling-check`) 안 되면 그대로 둔다(일부 파일만 옮겨지는 것 방지). LMS 작업(sync·deadlines·verify)이 도는 중이면 거절. Edge 가 없는 PC(셸로 로그인)·맥·리눅스는 이 줄이 안 나오고 API 도 거절. 체험 모드에서도 막는다.
- **다시 받기**: Edge 가 나중에 실패하면 `launch_lms_browser` → `ensure_shell` 이 다시 받는다. 그래서 Windows 의 `shell_ready` 는 `chromium_headless_shell-*` 만 본다 — Playwright 1.49+ 의 headless 실행은 셸만 쓰는데, 예전처럼 개발용 `chromium-*` 도 '있다' 로 보면 받지 않고 'Executable doesn't exist' 로 실패했다(실측). 받을 때 `playwright install` 이 어느 Playwright 도 참조하지 않는 옛 판 폴더(`.links` 기준)를 스스로 지운다 — 앱이 아니라 Playwright 동작이다.
- 실측(가짜 셸 14,098,304바이트, `PLAYWRIGHT_BROWSERS_PATH` 로 임시 폴더): 파일을 열어 둔 채 누르면 409 '쓰는 중' · 폴더 그대로 · 휴지통 0개 / 닫고 누르면 휴지통에 같은 크기로 들어가고 '휴지통으로 옮겼어요 (13.4 MB)', 앱 크기 41.9→28.5MB, 옆 `chromium-9999` 그대로, 휴지통에서 되살리기 됨 / 개발용 `chromium-*` 만 남기고 Edge 실패 흉내 → 셸 151.0.7922.34 를 받아 띄움(32초).
프로그램·브라우저 크기는 10분 동안 기억한다(`_FOOTPRINT_CACHE`). 프로그램 크기는 EXE 로 돌 때만 나온다.

GitHub 업데이트 확인 버튼은 뺐다. 설치형은 새 설치 파일로 업데이트하고, 저장소 버전이 뒤처져 있어 "최신"이라는 오답을 줬다(4.9절).

---

## 4. 기능별 동작 상세

### 4.1 LMS 자료 동기화 (`lms_crawler.py`)

1. `browser_setup.launch_lms_browser()`로 브라우저를 띄움. **Windows 는 깔려 있는 Microsoft Edge**(Playwright `channel="msedge"`)를 써서 아무것도 받지 않는다. Edge 가 없거나 못 띄우면 예전처럼 Chromium headless shell(`%LOCALAPPDATA%\ms-playwright`, 처음 한 번 270MB)을 받아 쓴다. 맥·리눅스는 headless shell 그대로. 작업 로그에 `LMS 접속 브라우저: Microsoft Edge 155…` 한 줄을 남긴다.
2. `login_lms()`: SAML 로그인. `networkidle`을 쓰지 않고 선택자·URL·`/users/me` 응답으로 기다림.
3. 과목 목록 → 과목 4개씩 병렬 `crawl_course`
4. `process_content` 재귀:
   - Zoom·외부 링크·설문·"class recording" 건너뜀
   - 파일 항목(x-bb-file)의 첨부 + 문서(x-bb-document) 본문 안 파일(`extract_body_files`)
   - 폴더 경로 `folder_path`: 폴더 제목을 쌓음. `Weekly Schedule`, `ultraDocumentBody`는 넣지 않음 (`HIDDEN_FOLDER_TITLES`).
   - 여러 파일을 담은 문서는 문서 제목을 한 칸 더 둠
   - LMS 순서 `lms_order`: 각 단계의 위치 번호 목록
5. `download_lms_file`: 동영상 건너뜀. 이미 받은 URL이면 내려받지 않고 `remember_lms_place`로 경로·순서만 갱신. 같은 과목의 같은 파일명은 새 사본을 만들지 않고 덮어씀.
6. 공지사항 첨부도 받음 (`공지사항(Announcements)` 폴더)
7. 끝나면 `web_ui.organize_downloads`가 `downloads\<학기>\<과목>\`로 옮기고 `stored` 경로 기록

LMS 브라우저를 Edge 로 바꾼 까닭 (2026-10-15): Playwright 가 받는 `chrome-headless-shell.exe`·dll 이 서명 없음(실측 NotSigned)이라 스마트 앱 컨트롤(SAC)이 켜진 PC 에서는 Store 판도 LMS 동기화가 막힐 수 있고, Store 정책 10.2.2(실행 코드를 내려받아 실행)에도 걸릴 수 있다. Edge 는 Microsoft 서명이고 Windows 10/11 에 늘 있다. 찾는 자리는 Playwright 와 같은 순서(`LOCALAPPDATA` → `PROGRAMFILES` → `PROGRAMFILES(X86)` 아래 `Microsoft\Edge\Application\msedge.exe`, `browser_setup.system_edge`). 실측(Edge 155 vs headless shell 151, 같은 계정): 띄우기 0.46초 vs 0.17초, SSO 로그인 52초 vs 53초, 과목 21개·콘텐츠 API 같은 결과, 마감 새로고침 81초·빠른 동기화 148초 종료 코드 0. `ms-playwright` 를 빈 폴더로 바꿔도 받지 않고 로그인됐다. 사용자가 Edge 를 켜 둔 채여도 Playwright 가 따로 임시 프로필로 띄우고 끝나면 남는 프로세스가 없다. 시험용으로 `AUTOSAVER_LMS_BROWSER=shell` 이면 Edge 를 건너뛴다. 예전에 받아 둔 `ms-playwright` 폴더는 앱이 스스로 지우지 않는다. 사용자가 설정 › 앱 크기에서 휴지통으로 보낼 수 있다(3절, 실패하면 다시 받음). 에브리타임 시간표 링크 가져오기(`timetable_import._fetch_everytime`)도 같은 `launch_lms_browser` 로 띄운다(`download=False` — 화면 요청 안에서 270MB 를 받지 않음). 예전엔 셸만 불러서 Edge 만 있는 PC 에서는 늘 실패하고 '자동 접속을 막고 있어'로 잘못 보였다. Edge 를 못 띄워 셸로 되돌아가면 `ms-playwright\daling-edge-failed.txt` 를 남기고(Edge 가 다시 뜨면 지움), 그동안은 셸을 '안 씀'으로 보지 않는다(`shell_unused`) — 정책으로 headless Edge 가 막힌 PC 에서 셸을 휴지통으로 보냈다가 동기화마다 270MB 를 다시 받는 일을 막는다.

빠른 모드(`AUTOSAVER_SYNC_MODE=fast`, 기본)는 마지막 동기화 2일 전 이후 바뀐 파일만 확인합니다. 순서·경로가 비어 있는 옛 자료를 채우려면 전체 모드로 한 번 돌립니다. 지난 학기 과목은 LMS가 403으로 막아 순서가 안 채워집니다.

### 4.2 과제 마감

`crawl_deadlines_only` → `deadlines.json`. 과목별 과제, 기한, 내 제출 상태(`myStatus`). 캘린더·대시보드·마감 화면이 함께 씀.

### 4.3 학교 메일 (`email_reader.py`)

- 서버 특성: IMAP4rev1, XLIST, AUTH=LOGIN만. **IDLE·UIDPLUS·MOVE·CONDSTORE 없음** → 실시간 푸시 불가, 주기 확인.
- 증분 수집: 서버에는 UID 목록만 묻고, 이미 가진 메일은 재사용. 읽음·별표만 서버 기준으로 맞춤.
- **구조 기반 수신**: `BODYSTRUCTURE`를 먼저 읽어(`parse_paren_list`, `bodystructure_parts`) text/plain·text/html 파트 번호를 찾아 그것만 받음. HTML은 40만 바이트까지 받고 30만 자까지 저장.
- 본문 그림: `inlineImages` 메타만 저장 → 메일을 열 때 `fetch_inline_images`가 한 번의 접속으로 받아 `mail_images\`에 저장.
  - 받기가 연결 오류로 실패하면 한 번만 다시 받는다(읽기만 해서 두 번 해도 됨, `web_ui.ensure_mail_images`). 실패하면 `cid:` 가 그대로 남아 그림이 깨져 보인다.
  - 같이 쓰는 메일 연결(1.12.34~, `email_reader.imap_session`)은 5초 넘게 쉬었으면 NOOP 으로 살아 있는지 본다(`SESSION_CHECK_AFTER`). 학교 서버는 쉬는 연결을 1분보다 짧게 끊는다(2026-10-22 실측: 1분 안의 두 번째 요청이 4ms 만에 EOF, 69초 쉰 새로고침도 다시 로그인). 예전 기준 60초에서는 30초~1분 사이의 첫 동작(본문 그림·읽음·별표·.eml)이 한 번 실패했다. 쓰기 명령은 저절로 다시 보내지 않는다.
  - 주소(src) 없는 `<img>` 는 메일 화면에서 숨긴다(`mailFrameDoc`). 보낸 쪽 편집기에서 그림이 빠진 자리라 빈 네모만 남았다(2026-10-22 총학생회 카드뉴스 — 원본 .eml 에도 그림 조각이 없었다).
- 메일 자동 확인 주기 자동 조절 (2026-10-22, 1.12.37, 사용자 결정): 앱을 보고 있으면 설정한 주기(기본 5분), 안 보면 15분(`web_ui.effective_minutes`·`AWAY_EMAIL_MINUTES`, 설정이 더 길거나 꺼져 있으면 그대로). '보고 있음' 은 화면(`app.js reportPresence`)이 `/api/presence` 로 알린다: 화면이 보이고 (앱에 초점이 있고 10분 안에 손댔거나) 2분 안에 손댔을 때. 보는 동안 1분마다, 바뀌면 바로 보내고, 서버는 3분 소식이 없으면 안 보는 것으로 친다(`PRESENCE_FRESH_SECONDS`). 다시 손대면 곧바로 알려 밀린 확인을 당긴다. 실패 뒤 간격 두 배·로그인 거절 뒤 2시간 쉬기(`app.next_due_job`)는 그대로.
  - 까닭(2026-10-22 실측, 시험 로그인 2번): 학교 메일 서버는 로그인 뒤 20~40초면 연결을 끊거나 멈춘다 — 5초마다 NOOP 을 보내도 응답이 4ms·289ms·745ms·15.9초로 흔들리다 42초에 20초 동안 답이 없었다. 그래서 5분마다 확인할 때마다 새로 로그인한다(컴퓨터 1대에 시간당 12번). 같은 계정 로그인이 잦으면 맞는 비밀번호도 'NO login failure: invalid auth or access denied' 로 거절한다(9/27·10/12·10/21 21:28·10/22 12:18, 10/21 은 맥 2대 + Windows 가 함께 돌 때 시작). 서버 기록이 없어 거절 규칙은 확인하지 못했다. 연결을 살려 두기(NOOP 유지)는 위 실측대로 소용없다.
- 첨부: `attachments` 메타(이름·형식·크기(전송 인코딩 뒤)·인코딩·`nameChecked`), `hasAttachment`. 읽기 화면 받는 사람 줄 아래 칩(`renderReadAttachments`)을 누르면 `/api/mail/attachment?uid=&folder=&part=` → `email_reader.fetch_attachment` 가 그 파트만 받아(BODY.PEEK, 40MB 까지) 내려받기로 연다(1.12.41, 예전엔 첨부 칸이 없었다).
- `BODY_VERSION`(현재 3)이 올라가면 예전에 받은 메일을 한 번 다시 받음.
- quoted-printable 판별(`_looks_quoted_printable`), HTML→평문 정리(`clean_html_to_text`, 역추적 폭발 없는 정규식).
- 분류: 규칙 기반(`rule_based_category`), Gemini 키가 있으면 관심도·요약 추가.
- 번역(`translator.py`): Gemini 키가 있으면 Gemini, 없으면 로컬 Ollama(`qwen3:8b` 등, 생각 끔).
- 목록 API는 본문을 빼고 줌(`get_emails`, 파일 도장 기준 캐시). 본문은 `/api/email-body`로 한 통씩.

### 4.4 삼성 노트로 보내기 (`samsung_notes.py`)

삼성은 노트 생성 API를 주지 않습니다. Windows 삼성 노트 앱의 `.pdf` 파일 연결을 이용합니다.

1. 중복 확인: 노트 DB(`Storage.sqlite`, 읽기 전용)의 제목과 한 번에 대조. 삼성 노트는 긴 제목을 50자쯤에서 자르고 중복에 `_2`를 붙이므로 `_title_matches`로 맞춤.
2. 앱이 꺼져 있으면 먼저 띄워 준비될 때까지 기다림 (`_notes_ready`: 겉창 안에 CoreWindow가 붙었는지)
3. `HiddenNotesWindow`: 가져오는 동안 겉창(`ApplicationFrameWindow`)을 알파 0 + 클릭 통과로 붙잡아 둠. 초점을 가져가면 원래 창에 돌려줌.
4. 파일마다 WinRT `Launcher.launch_file_with_options_async`로 넘기고, 새 노트 줄(`Id > 시작 Id`, `IsSaving=0`)이 생길 때까지 0.2초 간격으로 확인 (최대 40초)
5. 정상 종료 요청(`WM_SYSCOMMAND SC_CLOSE`). 우리가 켠 앱이면 4초, 원래 켜져 있던 앱이면 20초 기다린 뒤 강제 종료.
6. 닫힌 뒤 `organize_uuids`: DB 백업 후, 이번에 생긴 노트(UUID로 특정)만 과목 이름 폴더로 옮김
7. 원래 켜 두었던 앱이면 다시 띄움

화면에서는 `start_notes_job`이 뒤에서 돌리고 `/api/samsung-notes/job`으로 진행을 알려 줍니다.
실측: 준비 약 4초, 파일당 저장 약 5.5초.

### 4.5 Google 연동

- OAuth: 앱에 들어 있는 데스크톱 클라이언트(`google_client.json`), 토큰은 `token.json`. 설치형 클라이언트라 루프백 포트가 바뀌어도 됩니다.
- Drive (`drive_uploader.py`): 루트 폴더 아래 과목 폴더, 업로드 선택(`upload_selection.json`의 `courses`)을 따름. 권한은 `drive.file`.
- Calendar (`calendar_sync.py`): 메일에서 뽑은 일정, 학사일정을 지정한 캘린더로. 권한은 `calendar.app.created`(앱이 만든 보조 캘린더와 그 일정) + `calendar.calendarlist.readonly`(이름으로 찾기), 둘 다 민감하지 않은 범위라 데이터 액세스 인증이 필요 없다(1.12.23, 2026-10-13).
  - 예전 토큰(전체 `calendar`)도 그대로 쓴다(`runtime_config.calendar_scope_granted`). 그래서 토큰을 읽을 때 권한 목록을 넘기지 않는다 — 넘기면 갱신 때 없는 좁은 권한을 달라고 해 `invalid_scope` 로 실패한다.
  - 실측(개발자 계정): 전체 `calendar` 로 예전에 만든 'DGIST 메일 일정'도 `app.created` 로 열리고 일정 넣기·고치기·키로 찾기·지우기가 된다 → 다시 연결해도 캘린더가 두 개로 갈라지지 않는다.
  - 찾은 캘린더 ID 는 토큰 옆 `gcal_calendars.json` 에 적어 두고 먼저 쓴다. 같은 이름의 캘린더가 여럿이거나 이 토큰으로 못 여는 것(사용자가 직접 만든 같은 이름)이면 건너뛴다.
  - 연결 URL 에 `include_granted_scopes` 를 넣지 않는다. 넣으면 예전에 허락한 전체 `calendar` 가 새 토큰에 다시 묶인다.
- **OAuth 동의 화면 브랜딩** (2026-10-12): 데스크톱 앱이 쓰는 클라이언트는 Cloud 프로젝트 `dgist-lms-autosaver-2`, 예전 웹판(Render) 클라이언트는 `dgist-lms-sync`. 두 프로젝트 모두 앱 이름 Daling, 로고 `docs/logo-120.png`(= `web/app-logo-120.png`), 홈 `https://gudaling.dev/`, 개인정보처리방침 `/privacy`, 약관 `/terms`, 승인된 도메인 `gudaling.dev`.
  - 2026-10-12 `daling-app.pages.dev` 로 낸 재인증은 "웹사이트가 나에게 등록되어 있지 않음"으로 남아, 같은 날 개인 도메인 `gudaling.dev`(Cloudflare Registrar, 같은 계정)를 사서 Pages 프로젝트 `daling-app` 에 붙였다(DNS: `@` CNAME → `daling-app.pages.dev`, 프록시). `daling-app.pages.dev` 도 같은 내용을 내보내지만 페이지마다 canonical 은 `gudaling.dev`.
  - 이전 반려 사유 4가지: 홈페이지(`<옛 GitHub 이름>.github.io/…`)가 내 소유로 확인 안 됨(GitHub 이름이 tutleblue로 바뀌어 404, 게다가 Search Console 확인이 하위 경로라 도메인 소유로 안 침), 개인정보처리방침 내용 부족, 홈에 앱 목적 설명 없음, 동의 화면 이름(Daling)과 홈 이름(붕어빵) 불일치.
  - 사이트 원본은 `docs/`(한국어 + 심사관용 영어). 배포: `npx wrangler pages deploy docs --project-name daling-app --branch main`. Pages 가 `.html`을 떼는 308 리디렉트를 하므로 동의 화면에는 `/privacy`처럼 확장자 없는 주소를 넣습니다.
  - Search Console: '도메인' 속성 `gudaling.dev` 를 DNS TXT(`google-site-verification=…`, Cloudflare DNS 의 `@` TXT)로 개발자 Google 계정 소유 확인. 이 TXT 를 지우면 소유 확인이 풀립니다. 예전 URL 접두어 속성 `https://daling-app.pages.dev/` 는 `docs/googlee81e6dcdac788920.html` 로 확인해 두었다.
  - Google 은 github.io 같은 공용 호스팅 하위 도메인을 "소유 확인 불가"로 반려한 사례가 있습니다(2026-06 포럼 답변). 그래서 개인 도메인을 쓴다.
  - **결과**: 2026-10-13 0시경 `gudaling.dev` 로 낸 재인증이 두 프로젝트 모두 몇 분 만에 통과했고 '브랜딩 게시'까지 마쳐, 인증 센터에 "브랜딩이 인증되었으며 사용자에게 표시되고 있습니다". 이름·로고·주소를 바꾸면 다시 인증받아야 하고, 통과한 결과는 7일 안에 게시하지 않으면 만료됩니다.
  - **데이터 액세스** (2026-10-13): 두 프로젝트 모두 데이터 액세스에 `drive.file`·`calendar.app.created`·`calendar.calendarlist.readonly` 만 등록(전부 '민감하지 않은 범위'), `dgist-lms-sync` 에 있던 민감 범위 `calendar` 는 지움. 인증 센터: "앱이 민감하거나 제한된 범위를 요청하지 않으므로 인증이 필요하지 않습니다". 동의 화면은 '확인되지 않은 앱' 경고 없이 Daling 이름·로고로 바로 권한 선택이 나온다. 민감 범위를 다시 넣으면 시연 영상까지 내는 데이터 액세스 인증을 받아야 한다.
  - **Drive 전체 읽기** (2026-10-22, 1.12.38, 사용자 결정): 메일 'Drive에서 첨부' 가 내 Drive 전체·공유 문서함을 보려고 `drive.readonly` 를 더 요청한다(`runtime_config.GOOGLE_DRIVE_READ_SCOPE`). 구글은 이것을 **제한된 범위** 로 분류한다 → 위의 '인증 필요 없음' 이 깨진다: 심사(보안 평가 포함)를 받기 전까지 연결할 때 '확인되지 않은 앱' 경고('고급 → 이동')가 뜨고, 확인되지 않은 앱은 새 사용자 수에 상한이 있다. Cloud 콘솔 데이터 액세스에 이 범위를 더하는 일과 심사 신청은 사용자가 한다. 쓰기는 여전히 `drive.file` 만.
    - 예전 토큰(drive.file 만)은 그대로 쓴다: Drive 창은 앱이 올린 파일만 보이고 '다시 연결' 안내를 띄웠다(`/api/drive/list` 의 `fullAccess`, 1.12.40 부터는 고르기 창 단추). 다시 연결하면 전체가 보인다. 맨 위에 '공유 문서함'(`parent=shared` → `sharedWithMe`), 목록·받기는 `supportsAllDrives`.
    - 권한을 하나씩 끄고 허락해도 연결되게 `OAUTHLIB_RELAX_TOKEN_SCOPE` 를 켜고, token.json 의 `scopes` 에는 실제로 허락한 것만 적는다(`runtime_config.granted_token_json`). google-auth 의 to_json 은 '요청한' 권한을 적어, 끈 권한도 있는 줄 알고 갱신 때 그 권한까지 달라고 했을 것이다.
    - 다시 연결하면 그 자리에서 반영: 화면 서버가 예전 토큰으로 만들어 둔 Drive 접속(`drive_uploader._service`)을 `finish_google_oauth`·'google-oauth' 작업 끝에 버린다. 2026-10-22 실제로 다시 연결했을 때 새 토큰에 drive.readonly 가 있는데도 Drive 창은 앱 폴더 2개뿐이었다(새로 만든 접속으로는 내 드라이브 46개·공유 문서함 61개).
  - **Drive 전체 읽기를 거두고 구글 고르기 창으로** (2026-10-25, 1.12.40): `GOOGLE_SCOPES` 에서 `drive.readonly` 를 뺐다. 까닭: (1) 1.12.38 로 올린 사람은 토큰에 이 권한이 없어 Drive 창이 '다시 연결' 을 요구했고(사용자: "기존 인증이 풀렸다"), 다시 연결하면 '확인되지 않은 앱' 경고가 떴다. (2) 콘솔 '대상' 에 "사용자 한도 100명 중 3명" — 확인되지 않은 제한된 범위는 평생 100명까지다. (3) 제한된 범위 심사는 시연 영상·사유서에 더해, 데이터가 서버를 거치면 외부 보안 평가(CASA, 유료·매년)까지 든다. 구글 Drive 문서도 자체 파일 목록 대신 Picker + `drive.file` 을 권한다. 인증 센터는 그대로 "브랜딩 인증됨 / 데이터 액세스 인증 필요 없음"(drive.readonly 는 콘솔에 등록한 적이 없다).
    - 고르기 창: `/api/drive/pick` → `create_drive_pick_url` 이 `scope=drive.file&prompt=consent&trigger_onepick=true&allow_multiple=true&access_type=online` 주소를 기본 브라우저로 연다(구글 문서 'desktop-mobile-picker'). 돌아오는 `/oauth2callback?picked_file_ids=…&code=…` 는 state 의 `purpose="drive-pick"` 로 가려 `finish_drive_pick` 이 받는다 — **token.json 에 쓰지 않는다**(drive.file 하나뿐이라 쓰면 캘린더 권한이 사라짐). 고른 파일 이름·크기는 `drive_picks[state]`, 그 파일을 받을 토큰은 `drive_pick_tokens[id]`(50분)에 두고 `/api/drive/get` 이 `drive_service_for_file` 로 쓴다. 화면은 `/api/drive/picked?state=` 를 1.5초마다 묻는다(10분).
    - `access_type=online`: 구글은 한 계정·한 앱의 갱신 토큰을 100개까지만 두고 넘치면 가장 오래된 것을 끊는다. 고를 때마다 갱신 토큰이 생기면 늘 쓰는 token.json 이 끊길 수 있다.
    - 콘솔: `dgist-lms-autosaver-2` 에 Google Picker API(`picker.googleapis.com`)를 켰다. 2026-10-25 실측(Chrome, 개발자 계정): 동의 화면이 경고 없이 "선택하려는 파일의 경우 Daling에서 다음 작업을 할 수 있습니다", 고르기 창에 최근·업로드·내 드라이브·공유 문서함·중요 문서함·컴퓨터 탭이 보였다.
    - 1.12.38~39 에 drive.readonly 를 허락한 토큰은 그대로 둔다(Drive 창이 전체를 보여 줌, `fullAccess`). 다시 연결하면 세 권한만 남는다.

### 4.6 DGIST 공공데이터 (`dgist_api.py`)

기관코드 B552467. `OpenLtService/UnivLtList`(개설강좌), `AcademicScheService/UnivSchisList`·`GrscSchisList`(학사일정), `EvtntcListService01/getNtcList01`(세미나·행사).
키 순서: 환경변수 `AUTOSAVER_DGIST_API_KEY` → 설정 `DGIST_API_KEY` → `config.py`. 오류 코드 30은 "경로는 맞고 키가 없음".
키가 없을 때를 위해 배포본에 씨앗 데이터(`data/seed_*.json`, `scripts/build_seed.py`)를 넣고 캐시 기한은 학사일정 7일, 개설강좌 14일입니다.

### 4.7 자동 실행 (`app.scheduler_loop`)

- 30초마다 확인. 켜고 45초는 쉼, 매일 동기화는 켜고 2분 뒤부터.
- **매일 예약 동기화**: `SCHEDULE_TIME`(기본 08:00)이 지났고 `last_sync.json`의 날짜가 오늘이 아니면 실행. 끝나면 Windows 알림.
- **주기 실행** (`next_due_job`): `health.json`의 마지막 성공 시각 기준으로 메일 → 마감 → 자료 순서로 하나만. 실패 직후에는 주기의 절반(최소 5분) 쉼.
- 결과는 `record_task_result`가 `health.json`에 기록 → 화면의 마지막 동기화 표시와 경고 배너.

### 4.8 내 컴퓨터에도 자동 저장 (`web_ui.autosave_local`)

Drive 자동 업로드처럼, 동기화로 받은 자료를 내 컴퓨터 저장 폴더(`<저장 폴더>\<과목>\<파일>`)에도 둡니다. 수동 "내 컴퓨터에 저장"과 같은 자리라 두 벌이 생기지 않습니다.

- 설정 `AUTO_LOCAL_SAVE`: `off`(기본) / `current`(가장 최근 학기 자료만) / `all`
- 실행 시점: 자료 동기화가 성공하고 학기 폴더 정리가 끝난 직후 (`run_process`). 설정에서 새로 켜면 곧바로 한 번 (`/api/local-autosave/run`, 뒤에서 실행).
- Drive와 같은 과목 선택(`upload_selection.json`의 `courses`)을 따릅니다.
- 이미 있는 파일 처리:
  - 크기가 원본과 같으면 건너뜀
  - 우리가 복사한 뒤 아무도 안 건드렸는데 LMS 자료가 바뀌었으면 새 것으로 교체
  - 사용자가 필기 등으로 고친 파일이면 그대로 두고 `이름 (LMS 새 버전).확장자`로 옆에 저장
  - "우리가 복사한 그대로인지"는 `local_autosave.json`에 적어 둔 크기·수정 시각으로 판단
- 260자가 넘는 경로도 확장 경로(`_long_path`)로 복사합니다.
- 실측: 이번 학기 80개 처음 1.2초, 다시 실행 0.25초. 모든 과목 추가 189개 5.2초.
- 문서 폴더가 OneDrive 아래면 복사한 자료가 OneDrive에도 올라갑니다.

### 4.9 자가 업데이트 (`updater.py`) — 제한 있음

GitHub raw에서 `UPDATE_FILES`를 모두 받은 뒤에만 덮어씁니다.
**설치형 EXE에서는 동작하지 않게 막아 두었습니다** (코드가 실행 파일에 묶여 있어 화면 파일만 바뀌면 앱이 깨짐). 저장소 버전이 더 새롭지 않으면 받지 않습니다.
현재 GitHub `main`은 1.8.6이라 로컬(1.10.1)보다 뒤처져 있습니다. 설치형 배포는 새 설치 파일로 합니다.

---

## 5. 모듈 지도

| 파일 | 책임 |
|---|---|
| `app.py` | 데스크톱 진입점. 서버 띄우기(포트 선택), pywebview 창, 스케줄러, 알림, 작업 프로세스 분기 |
| `web_ui.py` | HTTP 서버와 모든 API. 설정 읽기/쓰기(DPAPI), 작업 실행, 자료 목록, 메일 본문·그림, 삼성 노트 작업, 정리·저장·Drive |
| `runtime_config.py` | 작업 프로세스와 공유하는 설정 상수, 데이터 경로, `WORKER_FLAG`, `SECRET_KEYS` |
| `demo_mode.py` | 체험 모드: 임시 폴더에 가짜 데이터 만들기·지우기, 켜 있는 동안 바깥 연결 막기, 체험 중 메일 읽음·별표·휴지통 |
| `main.py` | `sync` 작업 본체: LMS 크롤 → Drive 폴더·업로드 → 알림 메일 |
| `lms_crawler.py` | LMS 로그인, 자료·공지·마감 수집, 폴더 경로·순서 기록 |
| `browser_setup.py` | LMS 로그인 브라우저: Windows Edge, 없으면 Playwright 헤드리스 셸 받기. 안 쓰는 셸 휴지통으로(`recycle`) |
| `email_reader.py` | IMAP 수집·구조 해석·본문·그림·분류, 읽음/별표/이동/삭제, SMTP 보내기, 리마인드 |
| `email_notifier.py` | 동기화 결과 알림 메일 (함수 이름 `send_kakao_message`는 옛 이름, 실제로는 메일) |
| `translator.py` | 메일 번역 (Gemini 또는 Ollama) |
| `samsung_notes.py` | 삼성 노트 넣기·숨김·폴더 정리 |
| `drive_uploader.py` | Google Drive 인증·폴더·업로드 |
| `calendar_sync.py` | Google Calendar 동기화 |
| `academic_calendar.py` | 학사일정 (API + 홈페이지 병합) |
| `dgist_api.py` | data.go.kr 클라이언트 |
| `timetable_import.py` | 에브리타임 링크, 시간표 이미지(Gemini), DGIST 개설과목 |
| `course_meta.py` | 과목명에서 학기·학년 뽑기, 강의계획서 판별 |
| `notice_board.py` | 홈페이지 공지 |
| `shuttle.py` | 셔틀 시간표 |
| `directory.py` | 조직도 검색 |
| `fglp.py` | FGLP 파견 대학 데이터 |
| `ai_summarizer.py` | Gemini 호출 공통 (모델 대체 순서) |
| `updater.py` | GitHub 자가 업데이트 (소스 실행에서만) |
| `verify.py` | LMS 목록과 받은 파일 대조 (`verify` 작업) |
| `setup.py`, `check_courses.py` | 옛 CLI 도구 |
| `scripts/dev_server.py` | 소스 그대로 8794 포트에 대시보드 |
| `scripts/build_seed.py` | 씨앗 데이터 만들기 |
| `scripts/make_icons.py`, `scripts/extract_logo.py` | 아이콘 만들기 |
| `bungeoppang.spec` | PyInstaller 설정 |
| `packaging/` | Inno Setup 스크립트와 빌드 스크립트 |
| `web/index.html`, `web/app.js`, `web/styles.css` | 화면 전부 (프레임워크 없음) |

---

## 6. API 목록

모든 경로는 `web_ui.DashboardHandler`에 있습니다. POST는 `Content-Type: application/json`이어야 합니다(CSRF 방어). 로컬 모드는 Host가 루프백일 때만 받습니다.
브라우저가 gzip을 받으면 1KB 넘는 JSON 응답과 js·css·html 파일을 압축해 보냅니다.

### GET

| 경로 | 내용 |
|---|---|
| `/healthz` | 살아 있는지 (`ok`, `mode`) |
| `/api/status` | 설정 존재, 구글 연결, 개수, 작업 상태 |
| `/api/task` | 실행 중 작업과 로그 |
| `/api/health` | 종류별 마지막 성공·실패 |
| `/api/config`, `/api/config/export` | 공개 설정, 백업 내보내기 |
| `/api/files` | 자료 목록 (`folderPath`, `lmsOrder`, 학기·학년, 상태) |
| `/api/file?name=` | 파일 내려받기 |
| `/api/selection` | 업로드 선택·숨김 목록 |
| `/api/shelves` | 내 폴더 |
| `/api/storage` | 저장 공간 사용량 |
| `/api/deadlines`, `/api/deadlines.ics` | 과제 마감, ics |
| `/api/course-state`, `/api/course-catalog`, `/api/course-terms` | 수강 과목, 개설강좌, 학기 목록 |
| `/api/timetable` | 시간표 |
| `/api/academic-calendar`, `/api/my-events` | 학사일정, 내 일정 |
| `/api/notices`, `/api/seminars` | 학교 공지, 세미나 |
| `/api/shuttle`, `/api/fglp`, `/api/directory` | 셔틀, FGLP, 조직도 |
| `/api/place-search?q=` | OpenStreetMap 장소 검색 |
| `/api/emails` | 메일 목록 (본문 없음) |
| `/api/email-body?id=` | 본문, HTML(cid 주소 치환), 첨부 메타 |
| `/api/mail/attachment?uid=&folder=&part=` | 첨부 한 개 내려받기 (이름은 서버에서 다시 읽음) |
| `/api/mail/big-upload` (POST 파일 그대로 `?name=` · GET `?job=`) | 25MB 넘는 첨부를 Drive 'Daling 메일 첨부' 에 올려 링크로 (진행률) |
| `/api/mail/big-cancel` (POST `{job}`), `/api/drive/share` (POST `{id}`) | 뺀 큰 첨부 멈춤·Drive 휴지통 / Drive 에서 고른 큰 파일을 링크 공유 |
| `/api/mail-image?id=&n=` | 본문 그림 한 장 |
| `/api/mail/folders`, `/api/mail/pending`, `/api/mail/eml` | 메일함 목록, 답장 대기, eml |
| `/api/drive/list`, `/api/drive/get` | Drive 파일 (첨부용) |
| `/api/drive/pick` (POST), `/api/drive/picked?state=` | 구글 고르기 창으로 Drive 전체에서 첨부할 파일 고르기 |
| `/api/samsung-notes/status`, `/api/samsung-notes/job` | 설치 여부, 넣기 진행 |
| `/api/local-autosave/job` | 내 컴퓨터 자동 저장 진행 |
| `/api/dgist-api/status` | 공공데이터 키 확인 |
| `/api/update/check` | 업데이트 확인 |
| `/api/lock` | 앱 잠금 상태 `{available, enabled, locked, idleMinutes, waitSeconds, canReset}` (잠긴 동안에도 열림) |
| `/api/mail/me` | 메일에 쓰는 내 정보: `manual`(직접 적은 값)·`auto`(LMS·조직도)·`me`(합친 값, 학년·영문 소속 포함) |

### POST

| 경로 | 내용 |
|---|---|
| `/api/lock/unlock` `{pin}`, `/api/lock/reset` `{password}`, `/api/lock/lock` | 잠금 풀기, 저장된 학교 계정 비밀번호로 잠금 끄기, 지금 잠그기 (잠긴 동안에도 받음) |
| `/api/lock/check` `{pin}`, `/api/lock/set` `{pin, current}`, `/api/lock/off` `{current}`, `/api/lock/idle` `{minutes}` | 지금 비밀번호 확인, 새로 정하기·바꾸기, 끄기, 자동 잠금 시간 (풀려 있을 때만) |
| `/api/demo` | 체험 모드 켜기·끄기 `{on, lang}` (GET 은 상태: active·blocked 수·available) |
| `/api/run` | 자료 동기화 (`mode`: fast/full) |
| `/api/refresh-deadlines`, `/api/refresh-emails`, `/api/verify`, `/api/stop` | 작업 시작·중지 |
| `/api/config`, `/api/config/import` | 설정 저장, 백업 불러오기 |
| `/api/google/connect`, `/api/google/disconnect`, `/api/google/credentials` | 구글 계정 |
| `/api/gcal/sync`, `/api/gcal/sync-academic` | 구글 캘린더 |
| `/api/selection`, `/api/acknowledge-courses` | 선택·숨김 저장, 과목 변경 확인 |
| `/api/files/bulk` | 일괄 작업 (`drive`, `notes`, `hide`) |
| `/api/save-local`, `/api/organize-files`, `/api/open-downloads`, `/api/pick-folder` | 로컬 저장·정리 |
| `/api/local-autosave/run` | 내 컴퓨터 자동 저장 지금 실행 (`mode`: current/all, 뒤에서) |
| `/api/shelves/save`, `/api/storage/cleanup` | 내 폴더, 저장 공간 정리 |
| `/api/storage/trash-browser` | Edge 를 쓰는 PC 에서 예전에 받은 LMS 브라우저(헤드리스 셸)를 휴지통으로 |
| `/api/samsung-notes/send`, `/api/samsung-notes/organize` | 한 개 넣기(뒤에서), 노트 폴더 정리 |
| `/api/timetable/save`, `/api/timetable/delete`, `/api/timetable/bulk`, `/api/timetable/import-link`, `/api/timetable/import-image` | 시간표 |
| `/api/my-events/save`, `/api/my-events/delete`, `/api/export-ics` | 내 일정, ics 저장 |
| `/api/mark-read`, `/api/mark-all-read`, `/api/delete-email`, `/api/restore-email` | 메일 상태 |
| `/api/mail/star`, `/api/mail/move`, `/api/mail/folder-create`, `/api/mail/reminder`, `/api/mail/translate` | 메일 기능 |
| `/api/mail/open-link` | 메일 본문 링크를 기본 브라우저로 (http·https 만) |
| `/api/send-email` | 메일 보내기 |
| `/api/mail/flow` | 메일 쓰기 흐름 `{to, courseIndex}` → 받는 사람(교수·조교·외국인·과목)과 한국어·영어 글 조각 |
| `/api/mail/me` | 메일에 쓰는 내 정보 저장 `{name, nameEn, studentId, dept, flow}` (보낸 키만) |
| `/api/ai/polish` | 메일 가운데 용건만 AI 로 다듬기 `{text, lang, flow}` (실험실 스위치를 따른다) |
| `/api/ai/continue` | 메일 쓰기 칸의 `/ai` 지시 자리에 들어갈 글 `{instruction, before, after, lang, flow}` (실험실 스위치, 체험 모드에선 막음) |
| `/api/directory/import` | 조직도 넣기 |
| `/api/assignment/open`, `/api/open-url` | 외부 페이지 열기 |
| `/api/update/apply`, `/api/restart` | 업데이트, 재시작 |
| `/api/update/open-download` | (맥·리눅스) 새 DMG·AppImage 받을 곳을 브라우저로 |

---

## 7. 데이터 파일 (`C:\lms-autosaver\`)

`AUTOSAVER_DATA_ROOT`로 바꿀 수 있습니다. 설치된 앱과 개발 서버가 **같은 폴더를 씁니다**.

| 파일·폴더 | 내용 |
|---|---|
| `config.json` | 설정. 비밀 값은 `dpapi:` 암호문 |
| `token.json`, `oauth_pending.json` | 구글 토큰, 로그인 중 상태 |
| `downloads\<학기>\<과목>\` | 받은 강의자료 |
| `file_metadata.json` | 파일별 `course`, `folder_path`, `lms_order`, `original_name`, `stored` |
| `downloaded_files.json` | 받은 URL 목록 (다시 받지 않기) |
| `courses_state.json` | 수강 과목, 추가·삭제 감지 |
| `deadlines.json` | 과제 마감 |
| `emails.json` | 메일 (본문·HTML·그림 메타·첨부 메타, `bodyVersion`) |
| `mail_images\` | 본문 그림 캐시 |
| `upload_selection.json` | Drive 과목 선택, 숨긴 과목·마감·자료 |
| `shelves.json` | 내 폴더 |
| `timetable.json`, `my_events.json` | 시간표, 내 일정 |
| `academic_calendar.json`, `notices.json`, `shuttle.json` | 캐시 |
| `last_sync.json` | 마지막 자료 동기화 시각 |
| `health.json` | 종류별 마지막 성공·실패 |
| `local_autosave.json` | 내 컴퓨터에 자동 복사한 파일의 크기·수정 시각 (사용자가 고쳤는지 판단용) |
| `lms_profile.json` | 내 이름·학번·학교 메일·LMS 소속 (LMS `/users/me`, 전화번호 등은 받지 않음) |
| `app_lock.json` | 앱 잠금: 비밀번호 PBKDF2 해시·소금, 자동 잠금 시간, 틀린 횟수·막힌 시각. 없으면 잠금 꺼짐 |
| `ai_profile.json` | 직접 적은 내 정보(이름·영문 이름·학번·소속), 흐름 끄기, AI 고르기·실험실 스위치 |

그 밖의 위치:
- 설치 폴더: `%LOCALAPPDATA%\Programs\붕어빵`
- LMS 브라우저: 시스템 Edge(`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`). Edge 가 안 될 때만 Playwright headless shell 을 `%LOCALAPPDATA%\ms-playwright` 에 받음
- 로컬 저장: `문서\붕어빵 파일 정리\<과목>\` (OneDrive 문서 폴더일 수 있음, `SHGetKnownFolderPath`로 찾음)
- 삼성 노트 DB: `%LOCALAPPDATA%\Packages\SAMSUNGELECTRONICSCoLtd.SamsungNotes_wyx1vj98g3asy\LocalState\Storage.sqlite` (백업은 같은 폴더의 `Storage.sqlite.붕어빵백업-*`)

---

## 8. 설정 키 (`config.json`)

| 키 | 뜻 | 기본 |
|---|---|---|
| `LMS_ID`, `LMS_PASSWORD`* | LMS 계정 | |
| `SCHOOL_EMAIL`, `SCHOOL_EMAIL_PASSWORD`*, `SCHOOL_IMAP_HOST` | 학교 메일 | `mail.dgist.ac.kr` |
| `EMAIL_ADDRESS`, `EMAIL_PASSWORD`*, `EMAIL_TO` | 동기화 결과 알림 메일 (선택) | |
| `GEMINI_API_KEY`* | 번역·분류·시간표 이미지 | |
| `DGIST_API_KEY`* | 공공데이터 인증키 | |
| `DOWNLOAD_PATH`, `LOCAL_SAVE_PATH` | 받는 곳, 내 컴퓨터 저장 위치 | 데이터 폴더\downloads, 문서\붕어빵 파일 정리 |
| `AUTO_LOCAL_SAVE` | 내 컴퓨터에도 자동 저장: off / current / all | off |
| `CLOUD_SAVE` | 클라우드 폴더 자동 저장 `{onedrive|dropbox|icloud|mybox: {on, path}}` (path 비면 자동으로 찾은 폴더) | 모두 꺼짐 |
| `SAVE_SCOPE` | 내 컴퓨터·클라우드에 넣을 과목: current / all (`AUTO_LOCAL_SAVE`가 켜져 있으면 그 값이 우선) | current |
| `AUTO_DRIVE_UPLOAD` | 동기화 때 구글 드라이브에도 올리기 (`runtime_config.DRIVE_UPLOAD`, 끄면 `main.run_job`이 받기만 함) | true |
| `SCHEDULE_TIME` | 매일 동기화 시각 | `08:00` |
| `AUTO_EMAIL_MINUTES`, `AUTO_DEADLINE_MINUTES`, `AUTO_SYNC_MINUTES` | 자동 주기(분), 0이면 끔 | 5, 60, 180 |
| `GCAL_SYNC_ENABLED`, `GCAL_CALENDAR_NAME` | 구글 캘린더 | 꺼짐, `DGIST 메일 일정` |
| `EMAIL_INTEREST_TAGS`, `EMAIL_INTERESTS_CUSTOM`, `EMAIL_HIDE_PAST` | 메일 관심사, 지난 일정 숨김 | |
| `LMS_URL`, `LOGIN_URL` | LMS 주소 | |

`*` 표시는 비밀 값입니다. `web_ui.SECRET_KEYS`와 `runtime_config.SECRET_KEYS` 두 곳에 모두 있어야 합니다.

환경 변수: `AUTOSAVER_DATA_ROOT`, `AUTOSAVER_CONFIG_PATH`, `AUTOSAVER_UI_PORT`, `AUTOSAVER_SYNC_MODE`, `AUTOSAVER_HEADLESS`, `AUTOSAVER_MULTI_USER`, `AUTOSAVER_DGIST_API_KEY`, `AUTOSAVER_OPEN_BROWSER`, `AUTOSAVER_DEV_PORT`.

---

## 9. 빌드·배포

| 단계 | 방법 |
|---|---|
| EXE | `.venv\Scripts\python.exe -m PyInstaller bungeoppang.spec --noconfirm` → `dist\붕어빵\` |
| 설치 파일 | `packaging\build_installer.ps1` → `packaging\out\bungeoppang-<버전>-win-x64-setup.exe` (약 54MB) |
| 이 PC에 설치 | `packaging\build_installer.ps1 -Install` |
| 맥 앱 (DMG) | GitHub Actions `.github/workflows/mac.yml` → `daling-<버전>-mac-arm64.dmg`(M칩)·`daling-<버전>-mac-x86_64.dmg`(인텔) 아티팩트 (아래 'macOS 판') |
| 리눅스 앱 (AppImage·tar.gz) | GitHub Actions `.github/workflows/linux.yml` → `daling-<버전>-linux-x86_64.AppImage`·`.tar.gz` 아티팩트 (아래 '리눅스 판') |
| Microsoft Store 판 (MSIX) | `packaging\msix\build_msix.ps1` → `packaging\out\daling-<버전>-win-x64.msix`(시험판)·`-store.msix`(제출판) (아래 'Microsoft Store 판') |
| 설치본 점검 | `<실행 파일> --autosaver-smoke` (창 없이, 빈 임시 데이터 폴더로. `smoke_test.py`). Store 판은 `daling.exe --autosaver-smoke` |

설치 파일(Inno Setup)은 관리자 권한 없이 사용자 폴더에 설치하고, WebView2가 없으면 부트스트래퍼를 실행하고, .NET 4.7.2 미만이면 안내 후 중단합니다. zip 배포에서 생기던 "인터넷에서 받은 파일" 차단 문제를 피하려고 설치 파일로 바꿨습니다. 공인 서명이 없어서 브라우저로 받으면 처음 실행 때 SmartScreen이 뜹니다. 사이트의 한 줄 설치는 이 창 없이 깝니다 (아래 '서명·한 줄 설치'). `build_installer.ps1` 은 설치 파일 옆에 `<설치 파일>.sha256` 도 만듭니다 — 릴리스에 같이 올립니다.

설치 용량 약 167MB 중 88MB는 Playwright의 `node.exe`라 줄일 수 없습니다.

---

## 10. 알려진 한계·남은 일

- 지난 학기 과목은 LMS가 403을 줘서 LMS 순서를 못 채움 (이름순)
- 학교 메일서버에 IDLE이 없어 새 메일은 주기 확인으로만 앎
- 삼성 노트 넣기는 PDF만, 파일당 약 5.5초 (삼성 노트 자체 저장 시간)
- 설치형 앱의 자가 업데이트는 막혀 있음. 새 설치 파일로 배포해야 함
- GitHub에 올리지 않은 커밋과 변경이 많음 (`git status`로 확인). 푸시·릴리스는 사용자가 `gh auth login` 후 요청할 때
- 공인 코드 서명 없음: 브라우저로 받으면 SmartScreen(Windows)·Gatekeeper(맥) 경고. 한 줄 설치로 피하지만 Windows 스마트 앱 컨트롤은 못 피함 ('서명·한 줄 설치'). Microsoft Store 판은 포장까지 준비됨, 등록·제출은 사용자가 ('Microsoft Store 판')


### 공휴일·명절 인사 (`app.js`)

- 공휴일 표: `FIXED_HOLIDAYS`(양력) + `LUNAR_HOLIDAYS[연도]`(설·추석·부처님오신날, 대체공휴일·선거일도 여기에 적는다). 새 해가 오면 그해 줄을 추가한다.
- `specialDay(date)` → 공휴일이면 `{holiday, title, sub}`. 12월 31일처럼 공휴일이 아닌 기념일은 인사만.
- 나우바 `nowStatus`: 방학 다음, 시간표보다 먼저 공휴일을 본다 (`state: "holiday"`).
- 대시보드 `setHeroGreeting`: 새벽이 아니면 그날 인사로 바꾸고, `heroSummary`는 '오늘은 ○○, 수업 없어요'.

## 데이터 파일 쓰기와 화면 갱신 (2026-09-25)
- 데이터 JSON 은 모두 `runtime_config.atomic_write_text`/`atomic_write_json`(임시 파일 → `os.replace`)으로 쓴다. 제자리 쓰기는 읽는 쪽이 반쯤 쓰인 파일을 봐서 '자료 0개'가 됐다 (재현: 300번 읽기 중 223번 깨짐 → 0번).
- `web_ui.get_files`·`get_emails` 는 파일이 있는데 못 읽으면 직전 결과를 준다 (`_MetadataUnreadable`).
- 화면은 `pollLight`(작업 상태 + `/api/health`)만 12초(작업 중 2초, 끊김 5초)마다 묻고, `health.lastSuccess` 가 바뀌거나 작업이 끝나면, 또는 90초(작업 중 20초)마다 `refreshAll` 로 전부 받는다. 연결이 끊기면 `state.offline` 으로 한 번만 알린다.

## 받는 사람 자동완성 (2026-09-26)
- DGIST 메일은 보내는 이름을 `이름/직위/부서` 또는 `이름/학과 (학생)` 로 붙인다. `app.js splitAffiliation` 이 이를 이름·소속으로 쪼개고, `mailContacts` 가 모든 메일의 보낸이·받는이에서 연락처를 모은다(소속이 적힌 이름을 한 번이라도 보면 그걸 씀).
- 목록은 웹메일처럼 `이름/소속 <메일>` 한 줄, 친 글자에 밑줄(`acMark`). 조직도(`/api/directory`) 결과의 소속은 `directoryOrg`(직위/부서 또는 부서(신분)).
- 조직도 파일은 설정 › 학교 메일 아래 `#directoryImportButton` 으로 넣는다. CSV 머리줄(성명·이메일·소속·직급·구분 등)로 칸을 찾고, EUC-KR CSV 도 읽는다(`readTextSmart`). 포탈 SSO 가 필요해 자동으로 긁어 오지는 않는다.
- 조직도 채우는 법 (2026-09-27): 웹메일은 포탈 SSO(isign/auth.dgist.ac.kr) 뒤라 앱이 스스로 못 가져온다. 사용자가 로그인한 브라우저에서 웹메일 API 로 한 번 받아 `directory.json` 으로 넣었다.
  - `POST /mail/org/root/entries` (`_method=GET`): 최상위 1,305명. 부서 나무는 `GET /mail/org/dgist.ac.kr/groups/{id}` 의 `attributes.member` (하위 부서 `org-group-*` 과 사람 `org-user-*` 가 섞여 있음 — 부서만 따라 내려갈 것).
  - 부서 사람: `POST /mail/org/dgist.ac.kr/groups/{id}/entries` 본문 `_method=GET&perPage=500&currentPage=N`. 155개 부서, 약 160초, 4,824명.
  - 필드: `cn`(이름) `mail` `department` `title`/`jobname`(교원·직원·연구원) `identity`(학부생·대학원생…). 값은 모두 배열.
- `/api/directory?q=&limit=` 는 `limit`(최대 50)을 따르고, 조직도는 파일 도장이 바뀔 때만 다시 읽는다(`_directory_cache`).
- 교원 주소록 (2026-10-15): 새 사용자는 조직도를 넣을 길이 없어 교수·조교 주소가 비어 있었다. `web_ui.directory_people` 이 내 `directory.json` 에 설치 파일의 `data/seed_directory_faculty.json`(교원 247명: 이름·메일·소속·직위)을 메일 주소 기준으로 겹치지 않게 더한다. 교수 주소는 학교 홈페이지에 공개된 정보라 공개 배포물에 넣고, 학생·직원까지 든 전체 조직도(4,824명, 학생 3,518)는 포탈 로그인 뒤에만 보이는 정보라 넣지 않는다(사용자 결정). 체험 중에는 섞지 않는다(가짜 데이터에 실명 금지). 새로 만들기: `python scripts/build_faculty_seed.py [조직도 파일]`. `/api/directory` 의 `imported` 는 내가 넣은 인원(0 이면 설정에 '교수 247명').

## 화면 전환 성능 (2026-09-27)
- 메일함 진입 비용은 JS 가 아니라 배치(layout)였다: 메일 41통 = 요소 1,200개, 배치 한 번 24ms × 여러 번. `.email-list-row { content-visibility: auto; contain-intrinsic-size: auto 88px }` 로 163ms → 44ms(중앙값, 9회).
- View Transition 이름: 본문 `appview`, 사이드바 `sidebar`, 상단 막대 `topbar`. 셋 다 0.3s 같은 곡선. 스냅샷은 늘이지 않고(`object-fit: none`, 왼쪽 위) 틀로 자른다. 이름은 화면에 하나씩만 있어야 한다(겹치면 전환 전체가 취소됨).
- 개발 서버는 `http://localhost:8794` 로 열면 요청마다 30ms/270ms 로 들쭉날쭉하다(새로고침 650ms). `127.0.0.1` 로 열면 46ms. 설치 앱은 127.0.0.1 을 쓴다. 성능을 잴 때는 127.0.0.1 로 연다.

## 자료 → Drive 동기화 (2026-09-28)
- `main.run_job` 은 폴더 맨 위가 아니라 **메타데이터의 `stored` 자리**를 따라 파일을 찾는다 (정리 후 받은 파일·다시 받은 파일이 하위 폴더에 있음). 기록 없는 파일은 여전히 올리지 않는다.
- `drive_uploader.upload_to_drive_with_path`: 같은 이름이 있으면 md5 비교 → 같으면 `'exists'`, 다르면 `files().update` 로 새 판(`'updated'`). 폴더 목록은 실행마다 한 번만 받는다(`_folder_listing`). 검색어의 `'`·`\` 는 `_q` 로 이스케이프.
- 빠른 동기화(`fast`)는 `last_sync - 2일` 이후 바뀐 파일만 본다. 과목이 하나라도 실패하면(`_course_failures`) `last_sync` 를 앞당기지 않는다.
- 매일 전체 검사: `app.run_scheduled_sync` 가 `sync_mode="full"` 로 돌고, 오늘 했는지는 `last_full_sync.json`(전체 검사가 성공했을 때만 씀)으로 본다. 자료 화면 새로고침 버튼도 `mode: "full"`.
- 2026-09-28 실측: 이번 학기 파일 중 Drive 에 옛 판 13개, 없는 파일 3개, 같은 파일 269개.
- 큰 파일: `content-length` 가 300MB 를 넘거나 Playwright 가 'string longer than 0x1fffffe8' 로 실패하면 `_stream_to_file`(requests, 로그인 쿠키, 1MB 조각, `.part` → 교체)로 받는다. 예전 코드는 파일을 먼저 열어 실패 시 0바이트 파일을 남겼다.

## 사이드바 상태판 (2026-09-28)
- 예전 '설정 필요 / 매일 08:00 실행' 은 `requiredConfig`(lms·gemini·drive·gmail) 가 모두 참이어야 '완료' 였는데, Gemini(선택)·Gmail 알림(안 씀) 때문에 늘 '설정 필요' 였다.
- 지금은 `app.js renderStatusCard`: 불빛 `statusLights()`(LMS·메일·Drive: ok/warn/bad/off), 제목은 첫 문제(없으면 '모두 정상'), 둘째 줄은 진행 중인 작업 또는 `nextAutoJob()`(마지막 성공 + 주기). 누르면 문제 있으면 설정 계정(`#stAccounts`), 없으면 자동 가져오기(`#stAuto`).
- `/api/health` 에 `authFailed`, `failStreak`, `lastFullSync` 를 더 싣는다.

## 테마 (2026-09-28)
- `THEMES` 맨 앞 `auto`(기본값): `prefers-color-scheme` 이 어두우면 `dark`, 밝으면 `claude`. `resolveTheme` 로 실제 테마를 정한다.
- 시스템 설정이 바뀌면 `followSystemTheme`: change 이벤트 + 창 focus + 3초마다 비교 (이벤트가 안 오는 경우가 있었음).
- 고른 테마는 `ui_prefs.json`(`GET/POST /api/ui-prefs`)에 둔다. 앱 창 저장소는 끌 때마다 지워져 예전에는 켤 때마다 '기본' 으로 돌아갔다. localStorage 키는 `autosaver-theme-v2`(옛 키는 고르지 않아도 '기본' 이 적혀 있어 무시).
- 설정의 '조직도 파일 넣기' 줄은 사용자 요청으로 뺐다가(2026-09-28) 다시 넣었다(2026-10-15, 설정 › 연결된 계정의 학교 메일 아래 '주소록' 줄 `#directoryRow`). 교원 주소록만으로는 조교·학생 주소를 못 찾아서다.
- 대시보드 첫 줄(`setHeroGreeting`)은 인사말 대신 '9월 28일 월요일' (쉬는 날은 ' · 추석' 처럼 이름). 사용자가 인사 문구를 오글거린다고 해서 뺐다(2026-09-28). 둘째 줄 `heroSummary` 는 그대로.
- 저장 위치 스위치(드라이브·내 컴퓨터·범위·클라우드)는 바꾸는 즉시 `/api/config` 에 저장한다(`saveSavePlaceSoon`, 250ms 묶음). 예전에는 '설정 저장' 을 눌러야 해서, 설정 화면을 다시 열 때 `populateSettings` 가 저장된 값(off)으로 되돌려 '켰다 꺼졌다' 했다(2026-09-28).


### 구글 로그인이 없을 때 (`main.run_job`)

- 드라이브 저장은 기본 켜짐이지만, 로그인(token.json)이 없거나 새로 고침이 거절되면 `get_drive_service(interactive=False)`가 `DriveLoginRequired`를 던지고 드라이브만 건너뛴다.
- 1.11.4까지는 이때 동기화 작업이 실패로 끝나, 뒤따르는 폴더 정리·자동 저장도 건너뛰었다. 뒤에서 도는 작업은 절대 로그인 창(run_local_server)을 열지 않는다.

## 첫 실행 소개: 돌아다니는 달구 (2026-09-28)
- 그림: `design/dalgu/sheet2.webp`(옆·뒷모습, 걷기 `trot`=왼쪽을 봄, 달리기 `dash`=오른쪽을 봄 등 16장)를 `scripts/slice_dalgu.py` 가 `web/img/dalgu/*.png` 로 자른다. 기존 16장과 합쳐 32장.
- 달구(`#tourBuddy`)는 카드 밖에 따로 있다. `placeTourCard` 가 카드 자리를 잡은 뒤 `placeBuddy` → `buddySpot` 으로 비출 곳 둘레(아래·오른쪽·왼쪽·위, 비좁으면 카드 옆)에서 화면 안이고 카드와 안 겹치는 자리를 고른다.
- 옮길 때: 거리 360px 넘으면 `dash`, 아니면 `trot` 그림으로 좌우를 가는 쪽에 맞춰 뒤집고(`--face`), 거리에 비례한 시간(0.35~1.1초) 동안 `left/top` 이 움직인다. 도착하면 단계 `pose` 로 바뀐다. 첫 단계는 화면 왼쪽 밖에서 뛰어 들어온다.
- 시작·끝 단계(비출 곳 없음)는 카드가 크게(`.tour-card.hero`), 달구도 176px 로 카드 왼쪽에 선다.

- 폴더 선택(`/api/pick-folder`)은 `pick_folder_dialog`: 앱 창(pywebview)의 FOLDER 창. 설치 파일은 tkinter 를 빼고 묶어서(1.11.6까지) 설치형에서 늘 실패했다.


### 앱 업데이트 (`updater.py`, GitHub 릴리스)

- 확인: `/api/update/check` → api.github.com `releases/latest` 의 태그(v1.2.3)와 `VERSION` 비교. 켤 때 4초 뒤, 그 뒤 6시간마다 (`checkForUpdate`).
- 설치: `/api/update/apply` → 첨부 `bungeoppang-<버전>-win-x64-setup.exe` 를 %TEMP%\bungeoppang-update 에 받고, GitHub 자산 digest(SHA-256)와 맞을 때만
  `/SILENT /CLOSEAPPLICATIONS /RELAUNCH=1` 로 실행, 앱은 2초 뒤 스스로 끈다. 설치 스크립트 `ShouldRelaunch` 가 끝나고 앱을 다시 켠다. 진행은 `/api/update/job`.
- 새 버전 내기: VERSION·changelog 올리고 빌드 → `gh release create v<버전> packaging/out/bungeoppang-<버전>-win-x64-setup.exe` (본문은 '- ' 줄로 짧게).
- 예전 방식(저장소 main 의 VERSION·raw 파일 교체)은 설치형에서 동작하지 않았고, main 이 1.8.6 에 멈춰 늘 '최신' 이었다.
- 화면 전환(2026-09-28): 옛 화면을 먼저 지우고 0.1초 뒤 새 화면을 들이던 방식은 한 번 비어 보여 '깜빡임'으로 느껴졌다. 이제 `appview`·`sidebar`·`topbar` 모두 옛/새를 동시에 0.26~0.3초 겹쳐 바꾸고 `mix-blend-mode: plus-lighter` + `isolation` 으로 같은 부분의 밝기가 꺼지지 않게 한다(`vt-soft-*`). 실측: 모든 옛/새 애니메이션 delay 0.

## 알림 (2026-09-28)
- `app.scheduler_loop` 가 30초마다 `check_deadline_alerts`·`check_new_file_alerts` 를 부른다. 알림은 `app.notify`(winotify).
- 마감: 안 낸 과제가 24h·3h·1h 안으로 들어오면 그 순간 가장 가까운 칸 하나만 알린다(늦게 켜져도 몰아서 안 뜸). 열쇠에 마감 시각을 넣어 마감이 바뀌면 다시 알린다. 기록은 `alerts.json` 의 `sent`(지난 지 3일 지나면 지움).
- 새 자료: 작업이 돌지 않을 때 메타데이터의 파일 크기 목록을 `alerts.json` 의 `files` 와 비교. 새 이름 = 새 자료, 크기 바뀜 = 새 판. 처음에는 기억만 하고 알리지 않는다.
- 설정 키 `NOTIFY_DEADLINES`, `NOTIFY_NEW_FILES`(기본 켜짐, 화면 `notifyDeadlines`/`notifyNewFiles`, 누르는 즉시 저장). 예전의 '자동 동기화 완료/새 자료가 없습니다' 와 켤 때 48시간 요약 알림은 없앴다.
- 메일함 ↔ 다른 화면 전환은 `html.vt-quick` 로 0.15초, 크기 변화 없이(`view-transition-group` 0초).

- 설치 창 디자인: `bungeoppang.iss` 의 WizardStyle(modern dynamic windows11 hidebevels)·WizardBackColor(앱 --bg)·WizardImageFile(+DynamicDark). 그림은 `scripts/make_installer_art.py` (시스템 파이썬 Pillow, Noto Serif KR 제목 + 달구) → `packaging/art/`. 단계는 환영 → 추가 옵션 → 설치 → 완료 (언어·위치·준비됨 창은 뺐다). 문구는 [Messages] 에 앱 말투로.
- 앱 안 업데이트 화면: `#updateDialog` 카드(`setUpdateStep`, 확인→내려받기→검사→설치). 설치는 /VERYSILENT 라 윈도우 설치 창이 안 뜬다. 설치 직전 `update_done.json`(데이터 폴더)에 from/to 를 적고, 다시 켜진 앱은 `/api/whats-new` 의 `justUpdated` 로 '업데이트를 마쳤어요' 카드를 연다(본 뒤 지운다).


### 영어 화면 (i18n)

- 코드의 문구는 한국어 그대로 두고, 화면에 그려진 글자를 번역표 `web/i18n/en.json`(한국어 → 영어)으로 바꿔 보여 준다 (`app.js` 앞부분 `I18N`, `tr`, `i18nTranslateTree`, MutationObserver).
- 표에 정확히 있는 문구만 바꾼다. `{0}` 이 든 틀은 빈자리를 옮겨 넣는다. 고정 한글이 두 글자 이하인 틀은 빈자리까지 모두 영어가 될 때만 쓴다(메일 제목 등 사용자 글 보호). 한글 없는 틀은 무시한다.
- 개수 뒤 영어 명사는 `{0:class|classes}` 꼴로 쓴다: `{0}` 이 1 이면 앞말, 아니면 뒷말(`"오늘 남은 수업 {0}개": "{0} {0:class|classes} left today"`). 한국어 '{0}개' 하나가 영어에선 단수·복수 둘이라 '1 classes left today' 가 나왔다(2026-10-15).
- ` · ` 로 이어 붙인 줄은 마디마다 옮긴다. 날짜(`(월)`, `오후 4:18`, `2026년 9월`)는 규칙으로 바꾼다.
- 알림·확인창(`confirm`/`alert`)과 토스트도 같은 표를 쓴다. 속성은 placeholder·title·aria-label·data-hint·alt.
- 언어는 `ui_prefs.json` 의 `lang`(ko/en), 없으면 윈도우 언어(한국어가 아니면 영어). 바꾸면 화면을 다시 불러온다. 번역하지 않을 곳은 `data-no-i18n`.
- **새 화면 문구를 넣으면** `python scripts/i18n_extract.py` 로 빠진 문구를 찾아 `en.json` 에 채운다. 업데이트 내용(changelog)은 한국어로만 쓴다.

## 강의 › 공지사항 (2026-09-28)
- `lms_crawler.crawl_announcements` 가 공지 글(제목·본문 평문·작성/수정 시각)을 모아 `save_announcements` 로 `course_announcements.json` 에 둔다. 이번에 읽은 과목만 바꿔 끼우고(403 과목은 예전 것 유지), 과목마다 60건까지.
- API `GET /api/course-announcements` (`web_ui.get_course_announcements`). 화면: 강의 view 의 '과목 | 공지사항' 탭(`setCourseTab`). 공지 탭은 최근 7일 줄(`#annRecent`) + 이번 학기 과목 카드 게시판(`annCardHtml`, 최근 4건, '전체 N개 보기') + 지난 학기 접기(`#annPastWrap`, 학기는 과목명의 `YYYY_N학기`). 제목 → 읽기 창 `#annDialog`(이전·다음). 처음의 한 줄 나열식은 '정돈 안 됨' 이라는 말을 듣고 바꿨다.
- 본문: 평문으로 바꾸기 전에 `<del>/<s>/<strike>`·line-through 를 `~~글~~` 로, `<li>` 를 `• ` 로 바꿔 둔다(`lms_crawler._announcement_html`). 화면은 `annTextHtml` 이 `<del>` 로 그린다. 시험 범위에서 뺀 단원이 취소선 없이 범위처럼 보였던 실제 공지 때문(2026-10-09).
- 읽기 창 넘기기: 끌기(가로로 12px 넘게, 70px 넘으면 넘김)·트랙패드 가로 쓸기·←/→ 키 → `goAnn`. 왼쪽으로 밀면 '다음 공지'(더 최근). 끝이면 살짝 튕김.
- 새 공지 알림 `app.check_announcement_alerts` (스위치 `NOTIFY_NEW_FILES` 를 함께 씀, `alerts.json` 의 `ann`, 처음엔 기억만).
- LMS '메시지'는 못 가져온다: 2026-09-28 실측 `/learn/api/public/v1/courses/{id}/messages` → 400, `/learn/api/v1/courses/{id}/messages` → 404. 확인용 `probe_messages` 는 상태 코드만 로그에 남긴다.
- 첫 수집: 과목 15개, 공지 162건.

## 뒤로·앞으로 (2026-09-30)
- History API. `applyView`·`showMailPane`·`setCourseTab` 끝에서 `navPush()` 가 {view, mail(읽는 메일 id), ctab} 를 `history.pushState` 로 적는다(같은 상태면 건너뜀, 첫 실행 소개 중에는 안 적음). `popstate` → `navRestore` 가 그 상태를 다시 연다.
- 단추 `#navBack`/`#navForward`(상단 막대 맨 왼쪽), Alt+←/→, 마우스 옆 버튼(button 3/4). `nav` 는 `var` 로 선언 — 시작할 때 applyView 가 선언 줄보다 먼저 불리기 때문(const 면 TDZ 오류).
- 메일함은 상단 막대가 숨으므로 메일함 머리(`.mail-nav`)에도 같은 단추를 둔다. 단추는 `data-nav="back|forward"` 로 두 벌을 함께 켜고 끈다.


### 앱 안 확인·입력 창 (`app.js` appDialog)

- `window.confirm/prompt/alert` 는 쓰지 않는다. WebView 가 '127.0.0.1:8765의 메시지' 시스템 창을 띄워 디자인이 깨진다.
- `uiConfirm(메시지, {title, ok, cancel, danger, icon})` → true/false, `uiPrompt(메시지, 기본값, opts)` → 문자열/null,
  `uiChoose(제목, [{label, sub, icon}])` → 번호/null, `uiButtons(메시지, [{label, value, primary, danger}])` → value/null.
- 모두 Promise 라 부르는 곳을 async 로 두고 `await` 한다. 결과는 버튼을 누르는 즉시 넘긴다('close' 이벤트는 가려진 창에서 늦게 온다).

### 메일 첨부: Drive 창 (`openDrivePicker`)

- `/api/drive/list?parent=<id>` (폴더 안) / `?q=<이름>` (검색) → folders·files. 권한이 `drive.file` 이라 앱이 올린 파일만 보인다(`fullAccess=false`). 그때 'Drive 전체에서 고르기' 단추가 구글 고르기 창을 띄운다(`pickFromGoogleDrive` → `/api/drive/pick`·`/api/drive/picked`, §4.5). 이 창에서 고른 파일도 함께 붙인다.
- `/api/drive/get?id=` 로 받아 붙인다. 구글 문서·시트·슬라이드는 PDF 로 내보내 붙인다. 20MB 넘는 파일은 고를 수 없게 흐리게 표시.
- 작성창의 '내 자료'(강의자료 목록) 칸은 없앴다. 강의자료는 Drive 창의 AutoSaver 폴더에 있다.


### 메일 보내기·임시저장 (`email_reader.send_email`, `save_draft`)

- SMTP 로 보낸 뒤 IMAP `APPEND` 로 '보낸 편지함'에 사본을 넣는다. 예전엔 안 넣어서 앱·웹메일 어디에도 보낸 기록이 없었다.
- 임시저장은 '임시 보관함'에 `(\Seen \Draft)` 로 넣고 `X-Bungeoppang-Draft: <draftId>` 헤더를 붙인다. 다시 저장하거나 보내면 같은 번호의 예전 판에 `\Deleted` 표시만 한다(EXPUNGE 금지).
- 이 서버는 `SEARCH HEADER` 를 받아도 빈 결과를 준다(실측). 그래서 `search_header` 는 최근 60일 메일의 그 헤더만 FETCH 해서 직접 비교한다.
- 보내기 결과에 `refused`(서버가 거절한 주소)·`savedToSent` 를 돌려주고 화면 토스트에 붙인다.
- **첨부 이름은 학교 웹메일과 같은 꼴**(`name="=?utf-8?b?…?="`, `_encoded_filename`, 1.12.41). 1.12.40 까지는 파이썬 기본 RFC 2231 꼴(`filename*=utf-8''…`)이었는데, 학교 서버가 이것을 구조(BODYSTRUCTURE)에서 버려 `("ATTACHMENT" NIL)` 이 됐다(2026-10-25 실측). 그래서 보낸 편지함에서 '첨부파일' 로만 보였다(파일 내용은 들어 있었음). 받는 사람이 학교 웹메일이면 같은 일이 났을 수 있다. 보낸 편지함 사본(`_message_bytes`)도 받는 사람에게 간 것과 같은 compat32 글자로 넣는다(policy.SMTP 는 머리말을 다시 접으며 RFC 2231 로 바꿨다).
- 이미 그렇게 간 메일: 구조에 이름이 없는 첨부는 메일 앞부분(`BODY.PEEK[]<0.n>`, 앞 파트 크기 합 + 여유, 2MB 까지)을 받아 파트 머리말에서 이름을 읽는다(`MiniIMAP._fill_nameless`). 파트 머리말만 주는 `BODY[n.MIME]` 은 이 서버가 무시하고 메일 전체를 준다(실측). 예전에 받아 둔 '첨부파일' 은 `nameChecked` 가 없어 그 메일만 한 번 다시 받는다.
- 보내기 직전 `settleAutosave`: 예약된 자동 저장을 멈추고 서버로 가는 중인 저장은 끝날 때까지 기다린다. 예전엔 보낸 1초 뒤 같은 메일이 임시 보관함에 다시 생겼다(22:25:17 보냄 · 22:25:18 임시).
- 받는 사람·참조·숨은참조는 칩(`setupRecipientChips`). 서버로 보내는 값은 숨긴 원래 칸에 `이름 <주소>, …`. 그 칸의 `value` 를 가로채서 코드가 값을 넣으면 칩을 다시 그린다. 주소 나누기는 따옴표·꺾쇠 안 쉼표를 자르지 않는다(`parseRecipients`, 서버는 `email.utils.getaddresses`).
- 요청 처리 중 잡히지 않은 오류는 `DashboardHandler._guarded` 가 `C:\lms-autosaver\server_errors.log` 에 남기고 화면에 오류 문구를 돌려준다. 창 없는 EXE 에서는 예전에 연결만 끊겨 원인을 알 수 없었다.
- 시험할 때 주의: Git Bash 의 curl 에 한글 JSON 을 그대로 넣으면 UTF-8 이 아닌 코드페이지로 나가 `read_body_json` 에서 깨진다. 본문은 UTF-8 파일로 만들어 `--data-binary @파일` 로 보낸다.

- 자동 저장(`scheduleAutosave`): 쓰다 멈추면 1.5초 뒤 이 컴퓨터(`localStorage` autosaver-mail-draft), 15초 뒤 서버 임시 보관함. 내용 서명이 같으면 다시 안 넣는다. 자동 저장은 첨부 3MB 넘으면 첨부를 뺀다('임시저장' 단추는 다 넣음). '←' 는 손댄 게 있으면 저장하고 닫기, 휴지통은 확인 뒤 `/api/mail/discard-draft` 로 서버 저장본까지 버린다. 메일 쓰기를 새로 열면 `restoreDraftIfAny` 가 이어 쓸지 묻고 같은 draftId 로 이어 저장한다.
- **첨부가 받는 사람에게 안 가던 일** (2026-10-27, 1.12.46). 보내기(SMTP·MIME)는 멀쩡했다 — `/api/send-email` 로 보낸 시험 메일은 Gmail 에 두 첨부가 원본과 바이트까지 같게 도착. 빠진 곳은 화면이었다.
  - 이어 쓰기: 이 컴퓨터 저장본(`saveLocalDraft`)에 첨부가 없어 '이어서 쓰기' 하면 본문만 돌아왔다(재현: 첨부 1개 → 화면 떠났다 돌아와 이어 쓰기 → 0개). 사용자가 앱에서 보낸 메일(보낸 편지함)에도 첨부 파트가 없었다. 이제 같은 실행 안에서는 메모리(`autosave.memAtts`, draftId 로 맞춤)에서 전부, 껐다 켜면 저장본에서 앞에서부터 합계 1.5MB(`LOCAL_ATTACH_MAX`)까지 내용째 되살린다. 못 담은 파일은 이름만 남겨 '첨부 N개는 다시 넣어 주세요' 로 알린다. 저장소가 꽉 차면 이름만 저장.
  - 전달: 본문만 옮기고 원래 첨부는 버렸다. 이제 `attachOriginalFiles` 가 `/api/mail/attachment` 로 받아 붙인다(출처 '원래 메일', 합계 `ATTACH_LIMIT` 넘는 것은 빼고 알림, 받는 사이 다른 메일을 열면 `composeGen` 이 달라 붙이지 않음). 학과 공지 PDF 2개 실측 1.2초.
  - 보내기 전 확인: 내가 쓴 부분(인용·전달 원문 앞)이나 새 메일 제목에 '첨부/attach' 가 있는데 첨부가 0개면 묻는다. 내용이 빈 첨부가 있으면 막는다(서버 `build_message` 는 base64 가 깨진 첨부를 조용히 건너뛴다).
  - 답장·전달 인용(`quotableText`): 평문 파트에 `<img src="data:…">` 를 그대로 넣어 보내는 메일이 있고, `strip_css_text` 가 `data:image/png;` 를 CSS 선언으로 보고 지워 `<img src=" base64,iVBOR…` 가 남는다. 인용할 때 그림 태그와 200자 넘는 base64 줄을 뺀다(학과 공지 4,000 → 396자). 읽기 화면 평문 보기는 그대로다.
  - 확인(Gmail 받은편지함): '[Daling 첨부 시험 2]' 첨부 2개 → 떠났다 새로고침 → 이어 쓰기 → 보내기, 원본과 바이트 같음. '[Daling 첨부 시험 3]' 학과 공지 전달, PDF 2개 도착.
- **첨부 한도와 큰 파일** (2026-10-27, 1.12.47). 학교 SMTP 는 EHLO 에서 `SIZE 36700160`(메일 한 통 35MB)을 알린다. 첨부는 base64(4/3)+줄바꿈이라 약 1.37배 → 원본 합계 **25MB**(`email_reader.SEND_ATTACH_MAX`, 화면 `ATTACH_LIMIT`, `/api/drive/get`, 임시 메일 이어 쓰기 같은 값). 예전엔 화면 10MB · 서버 20MB 로 따로였고, 끌어 놓기는 크기를 안 봤다.
  - 그대로 붙일 자리가 없는 파일(합계 25MB 초과, 2GB 까지 `BIG_ATTACH_MAX`)은 Gmail 처럼 Drive 링크로(`addAttachmentFiles` → `uploadBigAttachment`). 화면이 파일을 그대로(`application/octet-stream`, JSON·base64 아님) `/api/mail/big-upload?name=` 로 보내면 서버가 1MB 씩 임시 폴더에 받고(`receive_big_upload`), 스레드가 내 Drive 'Daling 메일 첨부' 폴더에 이어 올리기(8MB 조각)로 올린 뒤 '링크가 있는 사람 보기' 권한을 연다(`_run_big_upload`, 앱이 만든 파일이라 drive.file 로 된다). 화면은 0.8초마다 `GET /api/mail/big-upload?job=` 으로 % 를 그린다. 30MB 실측 약 34초.
  - 이 POST 만 JSON 이 아니다. `application/octet-stream` 은 교차 출처에서 미리 묻기(preflight) 없이 못 보내므로 `csrf_ok` 와 같은 막이가 된다. 체험 중·2GB 초과는 본문을 읽지 않고 연결을 닫으며 거절.
  - Drive 접속은 이 스레드에서 따로 만든다(`_big_drive_service`, 로그인 창 없음). httplib2 접속은 스레드에 안전하지 않아 `drive_uploader._service` 를 나눠 쓰지 않는다. 구글 연결이 없으면 '설정에서 Google 연결' 안내.
  - 보낼 때 링크 묶음을 본문 끝에 붙인다(`bigLinksBlock`, HTML 이면 'Google Drive 로 보낸 파일' 칸). 올리는 중이면 보내기를 막는다. 쓰는 중에 빼면 `/api/mail/big-cancel` → 올리는 중이면 멈추고, 다 올라갔으면 Drive 휴지통(지우지 않음). 보낸 뒤의 파일은 그대로 둔다.
  - 'Drive에서 첨부' 로 고른 25MB 넘는 파일은 내려받지 않고 `/api/drive/share` 로 '링크가 있는 사람 보기' 를 열어 링크로 붙인다(고르기 창에 '링크로 보냄' 표시, 예전엔 못 골랐다).
  - 링크 첨부는 서버 임시저장(파일이 아니라 뺀다)에는 안 들어가고, 이 컴퓨터 저장본(`link`)에는 남아 이어 쓰기에서 돌아온다.
  - **큰 메일의 보낸 편지함 사본**: 34MB 메일의 사본이 안 남았다. `MiniIMAP` 소켓 시간 제한 20초가 sendall 전체에 걸려(파이썬 3.5~) 끊겼다 — 32.8MB APPEND 실측 30.2초. `append` 는 크기에 맞춰 늘리고(20초 + 초당 128KB), SMTP 도 같은 까닭으로 40초 고정에서 크기에 맞춰 늘렸다. 사본 넣기가 실패하면 같은 try 의 임시저장본 정리도 건너뛰어 '(제목 없음)' 임시 메일이 남았다(같이 고쳐짐).
  - 확인: '[Daling 첨부 시험 5]' 24MB 첨부 + 30MB Drive 링크 → Gmail 도착(메일 34.4MB), 링크는 로그인 없이 열림. 뺀 2MB 파일은 Drive 휴지통(trashed=True) 확인.

### 문의 · 오류 제보 · 아이디어 (`app.js` openFeedback)

- 사이드바 'Feedback'(#feedbackButton, 한국어 화면도 영어, 말풍선 아이콘 — 편지 모양은 접은 사이드바에서 메일함과 헷갈렸다)·설정 › 앱 '보내기'. 종류를 고르면 메일 쓰기가 받는 사람 `FEEDBACK_TO`(tutleblue12@gmail.com)·제목 `[붕어빵 종류] `·본문 서식으로 열린다.
- 본문 아래 앱 정보(`/api/diagnostics`: 버전·Windows·파이썬·설치판 여부, 화면 크기·테마는 화면에서). 오류 제보에는 사흘 안의 `server_errors.log` 마지막 한 건과 마지막 실패 작업을 붙인다. 메일 주소·비밀번호는 넣지 않는다.

### 과목별 교수·조교 (`lms_crawler.fetch_course_staff`, `web_ui.get_course_staff`)

- 마감 확인 작업(1시간마다)에서 `GET /learn/api/public/v1/courses/{id}/users?fields=courseRoleId,user.name,user.userName` 로 학생을 뺀 사람(Instructor→교수, TeachingAssistant·CourseBuilder→조교, Grader→채점 조교)을 받아 `course_staff.json` 에 둔다. 지난 학기 일부 과목은 403(전에 받은 것 유지).
- LMS 는 이메일을 주지 않는다(이름·학번만). 이 학교는 이름 전체를 `name.given` 에 넣고 `family` 는 '.' 이다.
- `/api/course-staff`: 조직도에서 이름으로 이메일을 붙인다. 동명이인이면 교수는 교원, 조교는 대학원생 → 그래도 여럿이면 주고받은 메일에 나온 사람. 그래도 모르면 `email` 을 비우고 `candidates` 를 준다(화면에서 골라 씀). 실측 44명 중 35명 자동, 7명 후보, 2명 조직도에 없음. 조직도에 이름이 없으면(새 사용자는 교원만 있음) 주고받은 메일에서 이름이 같은 `@dgist.ac.kr` 주소가 하나뿐일 때 그 주소를 쓴다(2026-10-15 실측: 조직도 없이 이번 학기 교수 6/6, 조교 1/6, 조직도와 다른 주소 0).
- 화면: 강의 카드 `courseStaffLine` (누르면 `mailCourseStaff` → 받는 사람 '이름/과목 조교', 제목 '[과목] '). 받는 사람 자동완성은 `staffContacts` 를 연락처에 더하고 '일반물리Ⅱ 조교' 꼬리표(`.ac-tag`)를 붙인다. 여러 낱말 검색은 낱말마다 맞아야 한다.

## 메일 미리보기 CSS (2026-10-02)
- Blackboard 알림(email@blackboard.com '일일 통지'·'제출물 수신함')은 평문 파트 맨 앞에 HTML 의 CSS 가 그대로 들어 있어 미리보기(앞 300자)가 CSS 뿐이었다(78통 중 16통).
- `email_reader.strip_css_text`: CSS 흔적(@import·@media·`{ 속성: }`)이 있을 때만 주석·@import·속성 블록을 걷고, 줄을 넘긴 선택자 조각(`table,`)과 HTML 글자 표기(`&nbsp;`)도 정리. 받을 때(`_parse_one_message`) 적용.
- 이미 받아 둔 메일은 다시 받지 않고 `web_ui.get_emails`(미리보기)·`get_email_body`(본문)가 읽어 줄 때 걷는다.

## 메일함 칸 나누기 (2026-10-02)
- `.mail-app` 열 너비는 `--mail-rail-w`(폴더, 160~360), 두 칸일 때 `.mail-main` 은 `--mail-list-w`(목록, 280~720). 손잡이 `.mail-split[data-split=rail|list]` 를 끌면 바뀌고, 두 번 누르면 기본(232/380). 폴더 손잡이를 120px 아래로 끌면 접힘(`.rail-folded`), ☰(`#mailRailToggle`)로 다시 펼침.
- 쓰는 중(`showMailPane('compose')`)에는 `.mail-app.composing` 으로 폴더·목록 칸을 접는다.
- 너비·접힘은 `ui_prefs.json` 의 `mailLayout`(`/api/ui-prefs`). 메일 영역 860px 이하(폴더가 위쪽 띠)에서는 손잡이·접기를 쓰지 않는다 — 너비 변수 규칙이 파일 뒤쪽에 있어 좁은 화면 규칙에서 다시 한 칸으로 적었다.

## 좁은 창·정사각형·휴대폰 화면 (2026-10-09)
- `styles.css` 끝 '좁은 창·정사각형 창·휴대폰' 절이 예전 규칙을 덮는다.
  - 761~1100px: 사이드바 76px 아이콘 레일(글자는 아이콘 밑 작게), 시계는 상단바 한 줄형(`app.js NOW_MOBILE` 1100px), 마지막 확인 글자 숨김, 캘린더 날짜 상세는 오른쪽 서랍, 설정은 `inset-left 76px`.
  - ~760px: 상단은 `시계 | 새로고침·테마` 한 줄 + 검색. 아래 탭은 대시보드·과제 마감·캘린더·자료·메일함 + '더보기'(`#navMore`, `openMoreSheet`). `data-more` 메뉴(강의·창고·설정)와 문의·업데이트 내용은 더보기 시트에. 실행 로그 손잡이 숨김(진행은 아래 진행 막대). 과제 마감 줄은 두 줄 격자, 캘린더 칸은 색 점만 + 날짜 상세는 아래 시트, 설정은 위 막대까지 덮음.
  - 실측: 375×812 에서 상단이 278px → 약 120px.
- 일정 편집(`#eventEditor`)은 열 때 `body` 로 옮겨 가운데 대화 상자(600px 이하 아래 시트)로 연다. 상세 패널에 `transform` 이 있어 그 안에서는 `fixed` 가 창 기준이 안 된다. Esc·바깥 누르기로 닫힘.
  - 원인(설치본 실측): 창 높이 880 > 작업 영역 852(1440×852, 200% 배율)라 창 아래가 작업표시줄 뒤로 들어가 '저장' 버튼이 화면 밖에 있었다. 저장 자체는 됐다.
- 첫 창 크기 `app.initial_window_size`: 1320×880 을 바라되 작업 영역 −40 을 넘지 않게. 최소 크기 360×560(휴대폰 비율로 줄여 보기 가능).

## 학교 행사/세미나 + 기본 공공데이터 키 (2026-10-09)
- `dgist_api.service_key`: 환경변수 → 설정(config.json) → config.py → `public_data_key.txt`(설치 파일에 묶은 기본 키). 키 파일은 `.gitignore`, `bungeoppang.spec` 이 있으면 묶고, CI 는 `secrets.DGIST_API_KEY` 로 만든다.
- 행사/세미나 서비스(`EvtntcListService01/getNtcList01`)는 성공을 `resultCode 100 / Success` 로 준다. 예전 `_raise_for_error` 는 이를 오류로 봤다. 항목: `seq, title, sdate(시작~끝), stime, place, tel, link, photo`. `fetch_notices` 가 `start/end/time/place/host/link` 로 바꾼다.
- `web_ui.get_school_events`: `school_events.json` 6시간 캐시(모두가 한 키를 나눠 쓰므로). `GET /api/school-events[?force=1]`. 화면은 `loadSchoolEvents` → 캘린더 '학교 행사'(노랑).
- 메일 행사 중복(`_mark_events`): 같은 날짜에서 앞 28자가 같거나, 괄호 꼬리표(`[(D-6!)…]`)·흔한 낱말을 뺀 낱말이 60% 이상 겹치면 하나만 남긴다(`_event_tokens`, `_same_event`). 학교 공식 행사와 같은 날 같은 행사면 메일 쪽을 빼고 `schoolEventId` 를 붙인다.
  - 실측: '제15차 연례 비즈니스 모델 개발 세미나(개방형 혁신)' 메일 4통 → 1개. 같은 날 다른 학과 세미나(10/6 생명과학·화학물리)는 따로 남음. 캘린더 메일 행사 15 → 12.
- 키로 받는 것: 개설강좌 569건, 학사일정 56건, 행사 15건(2026-10-09).
- 좁은 메일함(메일 영역 860px 이하·휴대폰): 폴더 칸을 한 줄 띠로. 묶음 상자(`.mail-write-row`·`.mail-quick`·`.mail-folders`…)를 `display: contents` 로 풀어 단추를 한 줄에 세우고 옆으로 넘긴다(스크롤바 숨김, 오른쪽 끝 흐림, 휠 → 옆 스크롤 `bindMailStripWheel`). 순서: 쓰기 → 폴더 → 분류 → 안읽음·중요·첨부. 예전에는 여러 줄로 펼쳐 메일 영역 834px 에서 폴더 칸만 381px(실측)였고 지금은 58px. 휴대폰의 서랍(☰)도 이 띠로 바꿨다. 잘리던 폴더 제목(`#mailFolderTitle`)과 휴대폰의 목록/카드 전환은 숨김.

## 교수·조교: 분반·학기, 메일 꼬리표 (2026-10-09)
- `web_ui.course_meta`: LMS 과목 이름 '일반물리Ⅱ (General PhysicsⅡ )_03[ 2026_2학기 ]' → 과목명·분반(03)·학기(2026_2). `current_term_key()` 는 `timetable_import.current_term_value()` 를 같은 꼴로.
- `get_course_staff` 응답: `courses`(이번 학기만, 줄마다 title·section·term), `past`(지난 학기, 과목마다 가장 최근 학기와 `termLabel`), `people.byEmail`. 교수·조교는 그 학기 그 분반에만 맞아서 메일 꼬리표·자동완성은 이번 학기 것만 쓴다. 과목 카드는 이번 학기에 없으면 지난 학기 것을 'YYYY-N학기 기준' 과 함께.
- `course_people_index`: 이번 학기 개설강좌(공공데이터, 학부 569 + 대학원 969)의 담당교수 + 내 과목 LMS 교수·조교를 이름으로 모으고, 메일 보낸 사람(조직도 이름 → 없으면 보낸 이름)과 맞춘다. 학위논문·개별연구 과목은 뺀다(`_RESEARCH_COURSE_RE`). 조직도에 학생으로 나온 주소에는 교수 꼬리표를 달지 않는다. 파일 도장으로 캐시(처음 0.2초, 이후 0.04초). 실측 12명.
- 화면: 메일 목록 보낸 사람 옆·읽기 화면 주소 옆 `.person-course`('일반물리Ⅱ 3분반 교수 · 외 2개 분반', 내 수업이면 강조색, 마우스를 올리면 전체). 강의 카드 교수·조교에 분반, 메일 쓰기 제목 `[과목 NN분반] `.
- 안 듣는 과목의 조교 (2026-10-09 실측, 읽기만): `public/v3/courses?name=` 로 다른 분반 과목은 찾을 수 있지만 `public/v1/courses/{id}/users` 403, `v1/courses/{id}/memberships` 403, `v1/courses/{id}?expand=instructorsMembership` 은 200 이나 대표 교수(role P) 한 명만(내 과목에서도 조교는 안 나옴). 저장된 메일 81통 중 조교 언급 7통(대부분 내가 보낸 것). → 다른 과목 조교는 모을 길이 없어 넣지 않았다.
- 좁은 메일 쓰기(`@container mailmain ≤620px`): `.cfield` 를 이름 붙인 칸('label opt find' / 'body body body')으로. 예전 두 칸 규칙은 옵션(개별·중요)이 둘째 칸을 먼저 차지해 입력칸이 58px 첫째 칸으로 밀렸다(615px 창). 첨부가 없으면 빈 표 머리줄을 접고, 쓰는 동안 폴더 띠는 숨긴다.

## 메일 검색: 과목으로 찾기 (2026-10-09)
- `app.js emailMatchesQuery`: `searchNorm`(띄어쓰기 빼고 Ⅱ/ii → 2) 로 비교. 검색어가 내 과목 이름(한글·영어, `mailCourseIndex`)의 일부면 그 과목의 다른 이름이 든 메일과 그 과목 교수·조교(`state.courseStaff` 주소 + 같은 과목명의 `state.coursePeople`) 와 주고받은 메일도 찾는다.
- 검색어가 있으면 `renderEmails` 가 폴더·탭을 가리지 않고 휴지통만 빼고 찾는다. 예전에는 받은 편지함·기본 탭 안에서만 찾아, '다변수' 10통 중 1통만 보였다.
- 실측(81통): 일반화학Ⅱ 0→5, 일반화학II·일반화학2·General Chemistry 0→5, 다변수 1→10, 학술 글쓰기 0→5.
- 첫 실행 소개 27단계: '과목으로 메일 찾기'(#emailSearchInput), '누가 보낸 메일이야?'(.person-course, 꼬리표가 있을 때만), '창을 줄여도 괜찮아' 추가, 캘린더·강의·공지·메일 쓰기 tips 갱신.

## 임시 보관함에서 이어 쓰기 (2026-10-22, 1.12.38)
- 예전엔 임시 보관함의 메일을 받은 메일처럼 읽기 화면에 띄워 이어 쓸 수 없었다(사용자 신고). 이제 `openEmailDetail` 이 임시 보관함 메일이면 `resumeDraft` 로 '메일 쓰기' 를 연다.
- `/api/mail/draft?uid=` → `email_reader.load_draft`: 서버 원본(BODY.PEEK, 읽기만)에서 받는 사람·참조·숨은참조·제목·HTML 본문(본문 그림은 data: 로)·첨부(20MB 까지)·우리 번호(`X-Bungeoppang-Draft`)를 채운다. 우리 앱이 빈 제목 대신 넣은 '(제목 없음)' 은 빈칸으로. 서버에서 못 읽으면 목록에 있는 내용으로 연다(숨은참조·첨부는 빠질 수 있다고 알림). 체험 모드에서는 막힘(목록 내용으로 열림).
- 이어 쓴 메일을 저장·보내기·작성 취소하면 `replaceUid`(그 임시 메일 번호)도 보내 `_drop_old_drafts` 가 지운 표시를 한다 — 웹메일에서 만든 임시 메일은 우리 번호 머리말이 없어서. 임시 보관함 폴더 안에서만, EXPUNGE 없이. 이 컴퓨터 저장본에도 `replaceUid` 를 남겨 껐다 켜서 이어 써도 같은 메일을 바꾼다.
- 열기만 하고 손대지 않으면 다시 저장하지 않는다. 커서는 본문 끝.
- 2026-10-22 22:11 '(본문을 불러오지 못했습니다)' 의 원인: 그 임시 메일은 서버 원본도 본문 0바이트였다(받는 사람만 넣은 채 자동 저장 — 받는 사람만 있어도 내용이 있는 것으로 친다). 불러온 뒤에도 비면 이제 '(본문 없음)'.

## 메일 지우기·휴지통·보관 설정 (2026-10-09)
- 원인(실측): 메일 받기가 '최근 21일(받은 날짜 기준)·폴더당 60통'으로 못 박혀 있었다. 휴지통으로 옮겨도 받은 날짜는 그대로라, 3주 넘은 메일을 지우면 서버 휴지통에는 있지만 앱 휴지통에는 안 보였다(서버 휴지통 10통 중 앱에 4통). 지운 직후에도 목록에서 빼기만 해서 다음 메일 받기(최대 5분)까지 휴지통이 비어 보였다.
- `email_reader.delete_message`: 휴지통 복사가 성공한 것을 확인한 뒤에만 원본에 `\Deleted`. 휴지통을 못 찾거나 복사가 실패하면 지우지 않고 오류(예전엔 복사 결과를 보지 않았다). EXPUNGE 는 여전히 보내지 않는다(`expunge_uid` 는 UIDPLUS 없으면 아무것도 안 함).
- `MiniIMAP.search_all` + `fetch_school_emails`: 휴지통은 SINCE 대신 UID 순서(버린 순서)로 최근 N통.
- 지운 뒤 `patch_email_local(to_trash=True)` 로 이 컴퓨터에서 바로 휴지통으로 옮기고(`pendingTrash`, id `trash:pending-…`), 메일 받기 작업을 뒤에서 시작한다. 서버가 새 번호(COPYUID)를 안 주므로 그 사이 되돌리기·완전 삭제는 막는다.
- 설정 '자동으로 가져오기'에 `MAIL_KEEP_DAYS`(7~730, 기본 21: 1주·3주·2달·6달·1년)·`MAIL_KEEP_MAX`(30~2000, 기본 60: 60·150·300·1000). `runtime_config` 가 읽고 작업 프로세스가 쓴다. 서버 메일은 지우지 않는다. 실측 받은 편지함 412통(21일 안 101통).

## 진행 막대와 자동 작업 (2026-10-11)
- 위쪽 떠 있는 진행 막대(`showTopProgress`)는 사용자가 시킨 작업만 보여 준다. `task.auto`(예약·주기 실행)면 띄우지 않고 실행 기록에만 남는다. 막대를 작업이 띄웠는지 `state.taskOwnsBar` 로 기억해, 삼성 노트·내 컴퓨터 저장 막대는 건드리지 않는다.
- 자동 작업이 도는 중에 사용자가 작업을 시키면 거절하지 않고 `task_state['queued']` 에 두었다가 `run_process` 끝에서 이어서 시작한다(`web_ui.start_task`). 그동안 막대는 '○○ · 곧 시작해요'. 사용자 작업끼리는 예전처럼 '이미 실행 중'.
- 계기: 메일만 새로 가져오려는데 '자동 마감·일정 새로고침' 막대가 떠 있었다.
- 메일 칸 분리(1.12.16): 메일 가져오기는 IMAP 만 써서 `web_ui.task_key(user, 'emails')` = `user:mail` 칸에서 따로 돈다(상태·로그·프로세스). `/api/task` 응답의 `mail` 에 들어 있고, 화면은 `renderTaskBar` 가 두 칸 중 사용자가 시킨 것을 보여 준다('외 1개'). 예약 실행(`app.scheduler_loop`)도 메일은 따로, LMS 작업(마감·자료)만 한 번에 하나. 이어서 하기(queued)는 이제 본 칸 작업에만 쓰인다. 작업 중지 버튼은 본 칸만 멈춘다.
- 교수·조교(`fetch_course_staff`)는 과제 마감 확인(1시간)과 자료 동기화(`crawl_lms` 끝, 마감 수집 뒤) 둘 다에서 받는다. 새 PC 에서 첫 동기화를 마치면 바로 채워진다. 받은 것은 그 PC 의 `course_staff.json` 에만 두어 사용자마다 자기 과목 조교만 보인다(다른 사용자와 나누지 않음 — 수강 정보가 모이는 서버를 두지 않기로, 2026-10-11).

## 리뷰 고침: 막 지운 메일·메일 작업 중지 (2026-10-11)
- 막 휴지통으로 옮긴 메일(`pendingTrash`)은 `uid` 를 비운다(서버 `patch_email_local(to_trash)`·화면 `deleteEmail` 둘 다). IMAP 번호는 메일함마다 따로라, 원래 번호로 휴지통에 읽음·별표를 붙이면 같은 번호인 다른 메일이 바뀌었다(메일을 열면 자동 읽음 표시로 조용히 일어남). `setEmailRead` 는 uid 가 없으면 서버에 안 보낸다. 서버는 `mark-read`·`delete-email`·`restore-email`·`mail/star`·`mail/move`·`mail/eml` 에서 uid 가 없으면 409 `pendingTrash` 로 거절한다.
- `stop_task(workspace, lane)`: 메일은 따로 도는 칸(`task_key(user, "emails")`)이라 예전처럼 `user_id` 칸만 보면 멈춘 메일 가져오기를 끌 수 없었다. `lane` 'mail'·'main'·빈 값(둘 다). `/api/stop` 본문 `{lane}`. 실패 알림도 그 작업의 칸(`key`)에 적는다.
- 화면: '작업 중지'(`#runButton`)는 메일 칸이 직접 시킨 것이거나 30초 넘게 돌 때도 보인다. 메일함 새로고침 단추는 가져오는 동안 '가져오는 중 · 누르면 멈춤' 이고 누르면 메일만 멈춘다.

## 이름·로고: Daling (2026-10-11)
- 보이는 이름만 Daling: 창 제목·알림(`app.WINDOW_TITLE`), 화면 제목·설정 '앱' 카드, EXE 이름표(`FileDescription`·`ProductName`), 설치 화면·제어판·바로가기(`.iss` `AppName`), 설치 그림(`make_installer_art.py`), 첫 실행 소개·문의 메일 제목·설정 내보내기 파일 이름, 영어 번역.
- 그대로 둔 것(기존 설치본이 앱 안 업데이트로 넘어오게): 실행 파일 `붕어빵.exe`, 설치 폴더(`.iss` `AppFolder` → `Programs\붕어빵`), AppId, 업데이트 파일 이름, 데이터 폴더, 사용자 자료 폴더 이름, 설정 백업의 `"app": "붕어빵"` 표시(불러오기 호환), 달구 말풍선의 붕어빵(간식) 농담.
- 예전 '붕어빵' 바로가기는 설치 때 `[InstallDelete]` 로 지운다(바탕화면·시작 메뉴·시작 프로그램에 둘이 생기지 않게).
- 로고: `design/logo/daling-source.webp`(흰 바탕 붓선) → `scripts/make_icons.py` 가 밝기를 불투명도로 바꿔 크림색 둥근 네모(`BG`) 위에 먹색으로 얹어 app.png·app.ico(16~256)·app-logo-120.png·favicon.svg·img/daling-mark.png 를 만든다. 16·24·32px 은 선을 굵게(MaxFilter). 화면의 로고 주소에는 `?v=daling` 을 붙였다(WebView2 캐시에 옛 물고기 그림이 남아 있었다).

## 메일 로그인 거절 (2026-10-12)
- 10/12 13:44~16:02 학교 메일 서버가 맞는 비밀번호를 거절했다가 저절로 풀렸다(21:5x 에 같은 비밀번호로 `OK LOGIN complete`, 19:00 자동 확인도 성공). 9/27 에도 같은 일이 있었다.
- 이제 `MiniIMAP.login` 이 서버의 끝맺음 말(`last_reply`)을 오류에 붙이고, `run_process` 가 이를 `health.json` 의 `authFailed.<kind>.reason` 에 적는다. 경고(`get_health`)는 '서버가 거절 (서버: …) · 2시간 뒤 다시 · 비밀번호를 바꿨다면 설정에서' 순서로 말한다.

## 새 기기에서 '메일 동기화가 계속 실패' (2026-10-25, 1.12.39)
- 신고: 배포판을 다른 기기(맥·Windows 둘 다)에 깔아 쓰면 메일 동기화가 계속 실패. 그 기기의 로그는 없어(작업 로그는 메모리에만) 이 PC 에서 새 기기를 흉내 내 쟀다.
- 원인이 아니었던 것: 빈 데이터 폴더 + 이 PC 설정으로 첫 받기 성공(112통 39.8초). 서버가 긴 연결을 끊는지 — 로그인 한 번으로 240초 동안 명령 346번(0.4초 간격) 모두 성공. 인증서 — 서버가 사슬 3장을 다 보내고 certifi 만으로도 된다.
- 원인 ①(두 운영체제 공통): 자동 확인이 계정이 비었는지 보지 않았다. `app.next_due_job` 그대로 시계만 감아 재현: 계정을 넣기 전 0.8분·17.2분에 '계정을 먼저 입력' 으로 실패 → '동기화가 계속 실패하고 있어요 — emails이(가) 2번 연속 실패' 띠. 32분에 계정을 넣어도 실패마다 두 배로 느는 간격 때문에 47.2분에야 첫 성공(늦게 넣을수록 최대 6시간). 계정이 오래전부터 있던 이 PC 에서는 안 났다.
  - 이제 계정 칸이 빈 작업은 자동으로 안 돈다(`app.scheduler_loop` 의 `ready`, `web_ui.TASK_ACCOUNT_KEYS`·`account_ready`, 매일 예약 동기화도). 상태판은 '계정을 넣으면 자동으로 가져와요'(`nextAutoJob` 도 같은 셈).
  - 계정을 넣거나 바꾸면 그 작업의 `failStreak`·`authFailed`·`lastFailure` 를 지운다(`save_config_dict` → `reset_task_failures`, 비교는 비밀 값을 푼 것끼리). 고친 뒤 같은 재현: 32.0분 저장 → 32.5분 첫 자동 확인 성공, 그 전 실패 0번.
- 원인 ②(맥·리눅스): 키체인을 못 읽는 동안(업데이트 직후 허락 전·거부) 아무 설정이나 저장하면 빈 값으로 읽힌 비밀번호가 키체인에서 지워졌다(`save_config_dict` 의 `forget`). 흉내(Windows 에서 `secret_store` 를 바꿔 끼움): 예약 시각만 바꿔 저장 → 비밀 항목 5개 forget, LMS·메일 비밀번호가 빈 값. 이제 빈 값으로 온 비밀번호는 표시(`keychain:…`)를 그대로 두고, '지우기' 를 누른 것(`cleared`)만 지운다. 백업 불러오기도 같다. 실제 맥 확인은 CI·맥 사용자.
- 띠에 까닭: `run_process` 가 '작업이 실패했습니다: …' 를 `lastFailure.reason` 에 적고(`_failure_reason`, 소스 위치는 뺌) `get_health` 가 작업별 문장(`FAIL_WARNINGS`)과 그 작업의 연속 횟수로 말한다(예전엔 작업 이름 'emails' 와 모든 작업을 합친 횟수). 영어 화면은 경고와 '(마지막 성공: …)' 을 따로 옮긴다(붙어 있으면 번역표에 안 맞아 한국어로 남았다).
- 시험할 때: `web_ui` 의 데이터 폴더는 `AUTOSAVER_ROOT` 를 본다. `AUTOSAVER_DATA_ROOT` 만 바꾸면 `web_ui` 는 그대로 `C:\lms-autosaver` 를 쓴다(이번 시험 2번이 실제 폴더에서 메일 새로고침을 했다 — 새 메일 없음). 또 개발 폴더에는 git 에 없는 옛 `config.py` 가 있어 `config.json` 이 없으면 `web_ui.read_config` 가 그걸 읽는다(설치본에는 안 들어감).

## 메일 분류 규칙 (2026-10-12)
- `email_reader.rule_based_category` 순서: 답신 → 계정·알림(인증번호·패스키·계정 생성) → 수업·LMS(Blackboard 발신, 제목의 `[2026_2학기]`, 일일 통지·제출물 수신함·강의성찰) → 학생회 → 교수님(발신자 이름에 교수) → 세미나·행사(한·영 낱말: Seminar·Colloquium·Symposium·Lecture Series·Workshop·Forum·투어·마라톤…) → 취업·진로(창업·공모전·해커톤·트랙…) → 행정·학생팀(보낸 부서) → 동아리·문화 → 기타.
- 내용(행사·진로)을 보낸 부서(행정)보다 먼저 본다: 창업지원팀 공모전·총무구매팀 마라톤이 행정으로 갔었다.
- 측정: 받은 편지함 60통 중 기타 44 → 2 (남은 것: DGIST 주간 소식, 내가 보낸 시험 메일). 메일을 새로 받을 때 저장된 메일도 다시 분류된다(`refresh_emails`). Gemini 키가 있으면 Gemini 가 같은 목록(`CATEGORIES`) 중에서 고른다.
- 'LMS·공지' 탭(`isLmsMail`)은 수업·LMS 분류도 포함한다.

## macOS 판 (2026-10-12)
- 빌드는 GitHub Actions 에서만(개발 PC 가 Windows): `.github/workflows/mac.yml` — `build/mac` 브랜치 푸시·수동 실행·`build.yml` 이 부름, 칩마다 한 번씩(macos-latest = M칩 arm64, macos-15-intel = 인텔 x86_64)·Python 3.13·`requirements-mac.txt` → `packaging/mac/daling-mac.spec` → `dist/Daling.app` → 서명(사설 인증서, 비밀이 없으면 ad-hoc — 아래 '서명 인증서') → `--autosaver-smoke` → 실제 앱 25초 띄워 `/healthz`·스크린샷 → `daling-<버전>-mac-<arm64|x86_64>.dmg`(+ `.sha256`). 릴리스는 만들지 않는다 — 릴리스에는 두 DMG 와 각 `.sha256` 을 모두 올린다.
- 공증 없음(유료 Apple Developer 계정 필요). 브라우저로 받은 DMG 는 처음 한 번 '시스템 설정 → 개인정보 보호 및 보안 → 그래도 열기'(macOS 15 부터 Control-클릭 → 열기 는 안 통함). 한 줄 설치(`curl -fsSL https://gudaling.dev/install.sh | sh`)는 격리 표시가 안 붙어 이 창이 없다 ('서명·한 줄 설치').
- 비밀 설정: 맥은 DPAPI 가 없어 예전엔 config.json 에 평문이었다. 이제 로그인 키체인(서비스 `Daling`, 계정 `settings`, {키: 값} JSON 한 항목)에 두고 config.json 에는 `keychain:<키>` 만. `mac_keychain.py`(Security.framework 를 ctypes 로, 비밀번호가 명령줄에 안 실림). `web_ui.dpapi_protect/unprotect` 와 `runtime_config._load_config` 둘 다 푼다. 항목을 하나로 둔 까닭: ad-hoc 서명은 새 버전마다 서명 해시가 바뀌어 키체인 접근을 다시 묻는데, 항목이 다섯이면 다섯 번 묻는다(사설 인증서로 서명해도 키체인은 다시 묻는다 — 아래 '서명 인증서'). 키체인이 거절하면 DPAPI 실패와 같이 평문을 남기고 다음 저장 때 다시 넣는다. 앱 안 업데이트 뒤에는 옛 판이 넘긴 값으로 새 판이 항목을 다시 만든다(아래 '키체인 넘겨주기').
- 알림·오류 상자: `osascript`(`app.notify`, `_osascript`). 글은 스크립트에 끼우지 않고 `on run argv` 인자로 넘긴다. 알림 센터에는 '스크립트 편집기' 로 보여 제목 줄에 Daling 을 넣는다.
- SSL: 묶은 파이썬의 OpenSSL 은 빌드한 맥의 인증서 경로를 본다 → `app.py` 가 `SSL_CERT_FILE` 을 certifi 로(작업 프로세스도 물려받음). Windows 는 시스템 저장소를 읽어 필요 없다.
- 경로: 데이터 `~/Library/Application Support/Daling`(2026-10-20~ 새 설치. 예전 판을 쓰던 맥은 `~/.lms-autosaver` 가 있으면 그대로 쓰고 옮기지 않는다 — 설정·메타데이터에 절대 경로가 있고 맥에서 직접 확인할 수 없어서. `runtime_config.default_data_root()` 하나를 web_ui 도 따른다. `mac.yml` '실제 앱 띄워 보기' 가 깨끗한 러너에서 새 자리에 생기고 옛 자리는 안 생기는지 본다), LMS 브라우저 `~/Library/Caches/ms-playwright`(`browser_ready` 가 맥 실행 파일 이름도 본다), Playwright `node` 는 `Contents/Resources` 에 데이터로 묶여 실행 권한을 확인한다.
- 크로스플랫폼 점검 (2026-10-20, 전체 코드 검사): Windows 전용 API 약 45곳은 모두 OS 분기 안이었다. 맥에서 실제로 틀린 것만 고쳤다.
  - AI 도우미(`ai_cli`): Finder 로 켠 앱은 PATH 가 `/usr/bin:/bin` 뿐이라 터미널에서 되는 claude·gemini·codex 를 '없음' 으로 봤다 → `~/.local/bin`·`/opt/homebrew/bin`·`/usr/local/bin`·npm 전역·nvm 자리도 보고, 돌릴 때 그 폴더들을 PATH 에 넣는다(npm CLI 는 `#!/usr/bin/env node`).
  - 클라우드 폴더 찾기(`detect_cloud_roots`): 맥의 `~/Library/CloudStorage/<앱>-<계정>`(OneDrive·Dropbox·MYBOX), `~/.dropbox/info.json`, iCloud Drive(`~/Library/Mobile Documents/com~apple~CloudDocs`). 맥에서 직접 확인하지 못했다.
  - 화면: '저장 폴더가 클라우드 안' 경고가 `root + "\\"` 로 비교해 맥에서 안 떴다 → `/` 로 맞춰 비교. 경로 줄여 보이기(`friendlyPath`)가 `/Users/<이름>/` 도 줄인다.
  - 단축키: 처리는 원래 Ctrl·Cmd 를 함께 받았다. 안내 문구만 맥에서 ⌘ 로(`keyLabel`·`macKeyLabels`, 번역 뒤에 입혀 en.json 은 그대로). 뒤로·앞으로는 맥에서 ⌘[ / ⌘] — Option+←/→ 는 맥 글자 칸의 단어 이동인데 가로채서 메일을 쓰다가 화면이 넘어갔다.
  - 글꼴: Windows 글꼴 뒤에 `-apple-system`·Apple SD Gothic Neo·AppleMyungjo·SF Mono. 화면 문구의 'Windows 알림'·'윈도우의 밝은·어두운 모드' 를 운영체제와 상관없는 말로.
  - Info.plist: 외장 디스크·네트워크 드라이브·클라우드(File Provider) 폴더에 쓸 때 보일 설명을 더했다. 마이크·카메라·화면 기록은 쓰지 않는다.
  - universal2 는 하지 않는다: `pydantic_core`·`cryptography`·`cffi` 에 universal2 휠이 없다(2026-10-20 `pip download --platform macosx_11_0_universal2` 실측). 대신 칩마다 따로 묶는다.
- 맥·리눅스 점검 2차 (2026-10-21, 1.12.34, 읽기 전용 전체 검사 17건 → 아래를 고침):
  - 맥 앱 창(WKWebView)은 `window.open` 을 무시한다(pywebview cocoa 는 링크를 '눌렀을 때' 만 바깥 브라우저로 넘김) → 강의자료 열기·강의계획서·메일 .eml 저장·인쇄가 맥에서 아무 반응이 없었다. `app.js openOutside` 가 맥 앱에서만 서버(`/api/open-app-url`, `/api/file?`·`/api/mail/eml?`·`/api/deadlines.ics` 만)에 기본 브라우저로 열게 하고, 인쇄는 숨은 iframe 에 그린다.
  - LMS 브라우저 준비(`browser_setup.shell_ready`)가 판 번호를 안 봐서, Playwright 판이 바뀐 업데이트 뒤 옛 판 폴더를 보고 새 판을 안 받았다 → 묶인 드라이버의 `browsers.json` revision 폴더만 '있다' 로 본다(못 읽으면 예전처럼).
  - 파일 이름: 맥·리눅스는 255 **바이트**(한글 약 80자)라 180자로만 자르면 긴 한글 자료가 'File name too long' → `folder_layout.fit_file_name`(확장자 두고 240바이트, Windows 는 그대로)을 크롤러·정리에 쓴다.
  - 두 번 켜기 막기(`app._startup_lock`)가 Windows 뮤텍스뿐이었다 → 맥·리눅스는 데이터 폴더 `.start.lock` 에 `flock`.
  - 맥에서 고른 첨부 파일 이름은 NFD(풀어 쓴 자모) → 화면(`nfcName`)·보내기(`email_reader`) 두 곳에서 NFC 로.
  - 리눅스 묶음 앱의 AI CLI(node)는 `linux_support.system_env()` 로 띄운다(묶음의 LD_LIBRARY_PATH 를 물려받지 않게). 앱 크기의 '프로그램' 은 맥 `Contents` 전체·AppImage 파일 크기로. 소개의 삼성 노트 줄은 맥·리눅스에서 뺀다. 리눅스 업데이트 안내에 'Daling 을 끈 뒤'.
  - CI: `build.yml` 이 `linux.yml` 도 부른다(예전엔 수동만). `docs/install.sh` 만 바뀐 커밋도 빌드한다(`paths` 에서 뒤 패턴이 앞을 이김). `--autosaver-smoke` 에 '화면 API 전부 (체험 모드)': `_do_GET` 의 길 51개를 체험 모드로 다 불러 500·연결 끊김이 없고 `server_errors.log` 가 늘지 않는지 본다(소스에서는 빠진 길이 없는지도).
  - 1.12.34 에서 남긴 셋은 1.12.35 에서 마무리했다 (아래).
- 맥·리눅스 마무리 (2026-10-22, 1.12.35):
  - 작업 프로세스와 키체인: sync·deadlines·verify 작업(`--autosaver-job`)이 저장소(키체인·키링)를 직접 읽지 않는다. 앱 본체(`web_ui._secret_handover`)가 풀어 둔 값을 표준 입력 한 줄(JSON 사전)로 넘기고, 작업은 `AUTOSAVER_SECRETS_STDIN=1` 이면 그 값만 쓴다(`runtime_config._HANDED_SECRETS`, 넘겨받지 못한 키는 빈 값 — 묻는 창을 띄우지 않는다). 예전엔 업데이트 뒤 '허용'(항상 허용 아님)을 누르면 60·180분마다 뒤에서 암호 창이 떴고, '거부' 하면 빈 비밀번호로 로그인 실패가 되어 자동 재시도가 멈췄다. 파이프는 두 프로세스 사이에만 있어 환경 변수·파일과 달리 남이 볼 수 없다. 메일은 원래 본체 안에서 돈다. Windows 는 DPAPI 라 그대로. 점검: `--autosaver-smoke` 작업 프로세스 줄의 `handed=1`(맥·리눅스).
  - 자동 시작: 설정 › 자동으로 가져오기 › '컴퓨터 켤 때 실행'(맥·리눅스만, `/api/autostart`, `autostart.py`). 맥 `~/Library/LaunchAgents/app.daling.desktop.autostart.plist`(RunAtLoad, `Contents/MacOS/Daling` 을 바로, `AssociatedBundleIdentifiers` 로 로그인 항목에 Daling 이름), 리눅스 `~/.config/autostart/daling.desktop`(AppImage 면 그 파일). DMG 안·AppTranslocation 에서 켠 앱은 거절(다음 로그인 때 그 자리가 없다). 켤 때마다 `autostart.refresh` 가 옮긴 AppImage 자리로 고친다. 체험 모드에서는 막힘(409). Windows 는 설치 파일의 '시작 시 자동 실행'·Store 판 startupTask. 점검: 임시 HOME 에 만들고 `plutil -lint`·가리키는 실행 파일이 있는지 본 뒤 지운다.
  - 옛 WebKit(업데이트 안 한 macOS 12 = Safari 15): `color-mix()` 36곳·`@container` 23곳을 모른다. `var()` 가 든 color-mix 는 읽을 때 통과했다가 그릴 때 값이 사라져(배경·테두리 없음) CSS 앞줄 단색으로는 못 막는다 → `app.js polyfillColorMix` 가 `CSS.supports` 로 모를 때만 지금 테마 값으로 섞어(CSS Color 5 srgb, 알파 곱) 규칙에 넣고, 테마를 바꾸면 원래 값에서 다시 섞는다. 글자 그대로의 색만 쓰는 9곳은 `styles.css` 에 rgba 앞줄. 크롬에서 강제로 돌려 원래 색과 비교: 34개 선언 모두 채널 차이 0.5 이하(기본·다크). `@container` 는 대신할 길이 없어 맥에서 한 번 'Safari 업데이트' 안내(`warnOldWebKit`) — Monterey 는 Safari 17.6 까지 올라가 둘 다 된다.
  - POST 점검: `--autosaver-smoke` '화면 API 전부 POST (체험 모드)' 가 POST 길 60개를 빈 본문으로 부른다(빼는 것 8개: 체험 모드 켜고 끄기·다시 켜기·창·폴더 고르기 창·파일 관리자·브라우저 여는 길). 소스에서는 빠진 길이 없는지도 본다. 처음 돌리자마자 찾은 것: 체험 모드에서 막는 길처럼 본문을 안 읽고 답하면 연결을 닫을 때 운영체제가 끊어(RST, WinError 10053) 화면이 답을 못 받았다 → `_do_POST` 가 처음에 본문을 다 읽는다.
- 인텔 맥 (2026-10-21, 사용자 요청): `mac.yml` 매트릭스에 인텔 러너 `macos-15-intel`(GitHub 공식 표에 macos-15-intel·macos-26-intel). `daling-mac.spec` 이 `DALING_MAC_ARCH` 로 `target_arch` 를 고르고, CI 가 묶은 실행 파일과 Playwright node 의 칩을 `lipo -archs` 로 확인한다.
  - 휠: 2026-10-21 `pip download --platform macosx_12_0_<칩> --python-version 3.13` 로 55개 모두 두 칩 휠이 있음을 확인. 단 **cryptography 는 49.0.0 부터 인텔 맥 휠이 없다**(49·50 은 arm64 뿐, 48.0.0 은 universal2) → `requirements-mac.txt` 에서 `platform_machine` 으로 인텔만 48.0.0(쓰는 곳은 google-auth, `>=38.0.3`).
  - Playwright 의 universal2 휠에 든 node 는 x86_64 하나뿐이다(Mach-O 헤더 실측). 인텔 러너의 pip 는 그 휠을(macosx_11_0 이 10_13_x86_64 보다 앞섬), M칩 러너는 arm64 휠을 고르므로 둘 다 맞다.
  - 칩 판별: `sysctl -n hw.optional.arm64` 가 1 이면 M칩(로제타로 도는 터미널·인텔 판에서도), 인텔 맥에는 이 항목이 없다 → `updater._mac_arch`·`docs/install.sh mac_arch`. 인텔 맥에 M칩 판을 권하지 않는다(릴리스에 인텔 DMG 가 없으면 '새 버전 없음', 한 줄 설치는 '아직 인텔용이 없음').
  - `install.sh` 는 macOS 12 미만이면 깔기 전에 멈춘다(LSMinimumSystemVersion). 판을 못 읽으면 막지 않는다.
  - 사이트 내려받기: 릴리스에 `mac-x86_64.dmg` 가 있을 때만 '인텔 Mac 은 인텔용 DMG' 줄이 보이고 요구 사항이 'M1 이상·인텔 Mac' 으로 바뀐다(`data-dl-wrap`·`data-req-intel`).
  - CI '한 줄 설치·앱 안 업데이트 점검': 지금 릴리스에 이 칩의 DMG 가 없으면(인텔 첫 릴리스 전) 이번 빌드 DMG 로 새로 깔고 같은 DMG 로 업데이트를 흉내 낸다. 키체인 점검·실험은 칩과 상관없어 M칩 러너에서만.
- CI: `build.yml`(main 푸시·수동)이 Windows(windows-latest, 서명 없는 설치 파일 + `--autosaver-smoke`)와 맥(`mac.yml` 을 `workflow_call` 로)·리눅스(`linux.yml`, 2026-10-21~)를 함께 돌린다. 공증 자리는 `mac.yml` 주석과 `packaging/mac/entitlements.plist`(강화 런타임 예외 allow-jit·allow-unsigned-executable-memory, 아직 안 씀).
- 창: 첫 크기는 `NSScreen.visibleFrame`(메뉴 막대·Dock 제외)에 맞추고 자리는 pywebview 가 가운데로. 삼성 노트는 없음(`is_available` False → 버튼 숨김).
- 업데이트: 릴리스의 이 칩용 `daling-<버전>-mac-<arm64|x86_64>.dmg` 만 본다. (2026-10-15~) '지금 업데이트' 는 Windows 처럼 앱이 직접 받아 GitHub digest 로 확인하고, 앱에 묶은 `install.sh`(= `docs/install.sh`)를 따로 띄운 뒤 앱이 꺼진다. install.sh 는 앱이 다 꺼지기를 기다려 DMG 의 앱을 지금 앱이 있는 폴더에 바꿔 끼우고(새 판 복사 → 서명 확인 → 이름만 바꾸기) 다시 켠다. install.sh 를 띄우기 직전에 키체인 값을 넘긴다(아래 '키체인 넘겨주기'). 기록은 데이터 폴더의 `update-mac.log`. 예전처럼 브라우저로 받으면 업데이트마다 격리 표시 때문에 '그래도 열기' 를 또 눌러야 했다. 앱이 urllib 로 받은 파일에는 격리 표시가 없다(Info.plist 에 `LSFileQuarantineEnabled` 없음, 샌드박스 아님 — `--autosaver-smoke` 가 확인). DMG 안에서 켰거나(/Volumes) 옮기지 않고 켠(AppTranslocation) 앱은 /Applications(못 쓰면 ~/Applications)에 깐다.
- 아이콘: `packaging/mac/Daling.icns` ← `python scripts/make_icons.py --mac` (애플 격자: 1024 안 824 네모).
- 점검 `--autosaver-smoke`: 빈 임시 데이터 폴더로 화면 서버(빈 포트)·화면 파일·가벼운 /api·작업 프로세스(`--autosaver-job smoke`)·node·(맥) Cocoa 모듈·인증서, `AUTOSAVER_SMOKE_KEYCHAIN=1` 이면 점검용 계정으로 키체인 왕복, `=write`/`=read` 면 그것만(다음 빌드가 묻지 않고 읽는지, 아래), `=droppart`/`addpart`/`delete`/`readui` 는 '키체인 실험' 용, `=handoff-write`/`handoff-read` 는 '키체인 넘겨주기 점검' 용(`AUTOSAVER_SMOKE_DATA_ROOT` 로 두 빌드가 같은 데이터 폴더). Windows 소스에서도 돈다(13개 통과).
- 서명 인증서 (2026-10-15): ad-hoc 서명의 서명 요구 조건(designated requirement, DR)은 `cdhash H"…"` 라 빌드마다 바뀌고, macOS 는 개인정보 보호 권한(TCC: 문서 폴더 접근 등)과 키체인 '믿는 앱' 을 이 조건에 묶는다 → 업데이트마다 다시 묻는다. 오래 쓰는 사설 코드 서명 인증서 하나로 서명하면 DR 이 `identifier "app.daling.desktop" and certificate root = H"<인증서 SHA-1>"` 로 고정된다. **키체인 재질문은 이걸로 안 없어진다**(아래 실측). Gatekeeper 경고와는 상관없다(공증이 필요, 한 줄 설치가 피함). 알림은 osascript 라 앱 신원과 무관.
  - 만들기(한 번, 사용자 PC): `sh packaging/mac/make_sign_cert.sh [폴더]` (Windows 는 Git Bash, 기본 `~/daling-mac-sign`). CN `Daling Mac Signing`, RSA 2048, 20년, `CA:FALSE`·`digitalSignature`·`codeSigning`. .p12 는 3DES·SHA-1 MAC 으로 만든다 — macOS `security import` 가 OpenSSL 3 기본(AES-256·PBKDF2) .p12 를 못 읽는다. `-subj`·`file:` 인자는 Git Bash 경로 변환에 깨져 설정 파일·`env:` 로 넘긴다.
  - 비밀: `MAC_SIGN_P12_BASE64`(.base64.txt)·`MAC_SIGN_P12_PASSWORD`(.password.txt) 를 **사용자가 직접** 저장소 Settings → Secrets → Actions 에 넣는다. 개인 키는 저장소·커밋·채팅에 두지 않는다. 폴더를 잃거나 새로 만들면 SHA-1 이 바뀌어 그 판에서 모두 한 번 다시 허락한다.
  - CI(`mac.yml`): 비밀이 있으면 임시 키체인에 넣고(`set-key-partition-list` 로 codesign 이 묻지 않게) `codesign --force --deep --timestamp=none --sign <SHA-1>`. 없으면 ad-hoc. 서명 뒤 `codesign -d -r-` 의 DR 이 `certificate (root|leaf) = H"<SHA-1>"` 가 아니면 실패. 수동 실행의 `test_cert` 를 켜면 비밀 없이도 이번 실행만 쓰는 인증서를 같은 스크립트로 만들어 이 길을 점검한다. 끝에 서명 키체인을 지운다.
  - '키체인 허락 유지 점검': 이번 빌드(A)가 임시 키체인에 점검 항목을 쓰고, 같은 자리에 판 번호만 바꿔 같은 신원으로 다시 서명한 B(cdhash 다름)가 묻는 창을 막은 채(`SecKeychainSetUserInteractionAllowed(false)`) 읽는다. 양성 대조군(A 가 그대로 다시 읽기)은 읽어야, 음성 대조군(ad-hoc B)은 못 읽어야 정상. 항목 접근 목록(`security dump-keychain -a`)도 남긴다. 결과는 실행 요약 표와 `logs/keychain-persist.log`. 양성 대조군이 깨질 때만 단계가 실패한다(사설 인증서 결과는 알림).
  - 실측(2026-10-15, 실행 38616964018 ad-hoc·38617564695 시험용 인증서): 같은 빌드는 다시 읽고, ad-hoc 다음 빌드·**사설 인증서 다음 빌드 둘 다 못 읽는다**(OSStatus -25293). 항목 접근 목록에서 '믿는 앱' 요구 조건은 인증서 DR 로 바뀌었지만, 따로 붙는 `partition_id` 가 `cdhash:<만든 빌드>` 다. 애플 팀 ID 가 없는 서명은 partition 이 cdhash 뿐이라(애플 포럼 developer.apple.com/forums/thread/98484 와 같음) 업데이트마다 키체인을 한 번 묻는다. 없애려면 Developer ID(팀 ID → `teamid:`)가 필요하다.
  - 키체인 실험(2026-10-15, 수동 실행 `keychain_lab`·`keychain_lab_cases`, `mac_keychain_lab.py`; 실행 38684779540·38687984270·38689511971, 시험용 인증서): 1판이 만든 점검 항목을 판 번호만 바꿔 같은 인증서로 다시 서명한 2판·3판이 묻는 창을 막고 읽는가. 경우별 접근 목록(`dump-keychain -a`)은 각 실행의 `logs/keychain-lab.log`, 결과 표는 실행 요약.
    - (a) 접근 목록을 직접 넘겨 만들기(`SecAccessCreate` + `SecKeychainItemCreateFromContent`): **안 됨**. 넘긴 목록엔 partition 항목이 없는데 만든 항목엔 `partition_id = cdhash:<1판>` 이 붙는다(만들 때 시스템이 붙임). 읽기를 모든 앱에 열어도(allowall), 접근 목록 고치기 권한(change_acl)을 인증서 DR 에 줘도(owner) 2·3판 모두 -25293.
    - (b) partition 목록 고치기: **안 됨**. 만든 빌드가 곧바로 지우기(ownerdrop), 업데이트 직전 옛 판이 새 판 cdhash 더하기(ownerprev), 새 판이 제 cdhash 더하기(ownerself) 모두 `SecKeychainItemSetAccess` 가 키체인 암호를 요구한다 — 고치기 권한을 인증서 DR 에 줬어도 -25293, 기본 항목(고치기 권한이 아무 앱에도 없음)은 '접근 권한을 바꾸려 함 — 키체인 암호 입력' 창이 묻는 창 막기를 무시하고 뜬다(drop). `security set-…-partition-list` 가 `-k <암호>` 를 받는 것과 같은 규칙. 앱이 로그인 암호를 알아야 하므로 쓸 수 없다. 기본 항목의 prev·self 는 drop 의 창이 남아 뒤 codesign 이 멈춰 따로 재지 못했다(같은 `SetAccess` 라 같은 창).
    - 되는 것 하나: **새 판은 못 읽는 옛 항목을 묻지 않고 지울 수 있다**(nextdel: 지우기 → 새로 만들기 → 읽기, 2·3판 모두 됨). 값은 꺼내지 못한다.
    - 사용자가 보는 창(ui, 화면 찍음): 'Daling 이(가) 키체인의 "Daling" 키에 접근하려고 함 — 허용하려면 키체인 암호 입력' + 항상 허용·거부·허용. **업데이트마다 로그인 암호를 쳐야 한다**(클릭 한 번이 아님). '항상 허용' 이면 그 판에서는 다시 안 묻는다.
    - CI 주의: 묻는 창이 한 번 뜨면 프로세스를 죽이고 SecurityAgent 를 꺼도 뒤의 codesign·dump-keychain 이 멈췄다 → 창을 띄우는 경우는 맨 끝에, 한 실행에 하나만.
  - 고를 길 (2026-10-15 사용자가 2 를 골랐다):
    1. 키체인만(예전): 다른 앱·같은 사용자의 다른 프로세스는 값을 못 꺼낸다(DR + partition). 대가는 업데이트마다 위 창. DMG 끌어 놓기·한 줄 설치는 지금도 이렇다.
    2. **넘겨주기 (앱 안 업데이트에 넣음)** — 아래 '키체인 넘겨주기'.
    3. 0600 파일만(리눅스 `secretfile:` 길): 안 묻지만 암호화가 없다 — 같은 사용자의 모든 프로세스·Time Machine 백업·동기화 폴더에 평문. 키체인 '모든 앱 허용' 은 partition 때문에 소용없어(allowall) 중간 길도 없다. `/usr/bin/security` 를 거쳐 읽는 길(항목을 `apple-tool:` partition 으로)도 아무 프로세스나 같은 명령으로 꺼낼 수 있어 이 수준이다(재지 않음). 권하지 않는다.
    4. Developer ID(연 99달러): partition 이 `teamid:` 라 안 묻고, 공증으로 Gatekeeper 창도 없어진다. 근본 해결. 그때는 새 판이 옛 항목을 그대로 읽으므로 넘겨주기는 파일만 지우고 끝난다(아래 same 경우).
  - 키체인 넘겨주기 (2026-10-15, `mac_keychain.write_handoff`·`_restore_handoff`, `updater._mac_hand_off_secrets`):
    - 옛 판: '지금 업데이트' 에서 DMG 를 확인한 뒤 install.sh 를 띄우기 직전, 이 프로세스가 키체인에서 읽어 기억한 {키: 값} 을 `~/.lms-autosaver/keychain-handoff.json` 에 쓴다(`O_CREAT|O_EXCL`·0600 임시 파일 → fsync → 이름 바꾸기, 만든 시각 포함). 이번 실행에서 키체인을 못 읽었으면(`_cache` 없음) 쓰지 않는다 — 새 판이 예전처럼 한 번 묻는다. install.sh 를 못 띄우면 바로 지우고, install.sh 가 바꿔 끼우기 전에 끝나면(`DALING_HANDOFF`, EXIT trap) 지운다.
    - 새 판: 처음 키체인을 읽을 때(`_load`, 화면 서버가 켜자마자 `read_config` 로) 파일이 있으면 `flock` 으로 한 프로세스만, 묻는 창을 막고(`SecKeychainSetUserInteractionAllowed(0)`, 끝나면 원래 상태로) 읽어 본다. -25293·-25308 이면 옛 항목을 지우고(묻지 않고 지워진다, nextdel) 파일 값으로 제 항목을 만들고 다시 읽어 같은지 본 뒤 파일을 지운다. 묻지 않고 읽히면(업데이트가 실패해 옛 판이 다시 켜짐) 파일만 지운다. 하루 지났거나 깨졌거나 이 사용자의 0600 파일이 아니면 쓰지 않고 지운다.
    - 실패해도 값을 잃지 않게: 옛 항목을 못 지우면 파일만 지우고 예전처럼 묻는다(값은 옛 항목에). 지웠는데 새 항목을 못 만들면 파일을 남겨 다음 실행에서 다시 하고, 이번에는 넘겨받은 값을 쓴다. 넘겨주기가 어떻게 틀려도 예전 길(묻기)은 남는다.
    - 결과는 `update-mac.log` 에 '키체인 넘겨주기: …' 한 줄(값은 안 적는다).
    - 대가: 업데이트하는 몇 초(새 판이 켜져 읽을 때까지) 같은 사용자의 프로세스가 그 파일을 읽을 수 있다. 이 판(넘겨주기가 든 판)에서 다음 판으로 갈 때부터 안 묻는다 — 넘겨주기가 없는 옛 판에서 올라오는 첫 업데이트는 한 번 묻는다.
    - CI '키체인 넘겨주기 점검'(매 빌드): 1판이 점검 계정에 값을 넣고 updater 함수로 넘김 → 같은 자리에 판 번호만 바꿔 다시 서명한 2판이 묻는 창을 프로세스 전체에서 막은 채 작업 프로세스와 같은 길(`runtime_config._load_config`)로 읽는다. next(대조군: 넘겨주기 없이는 못 읽어야 함)·same(업데이트 실패)·stale(하루 지난 파일)·adhoc, 파일이 남으면 실패. 기록 `logs/keychain-handoff.log`.
    - 실측(2026-10-15, 실행 38694627946, 시험용 인증서): next — 대조군 -25293, 2판이 묻지 않고 넘겨받아 항목의 partition_id 가 2판 cdhash 로 바뀜 · same — 대조군 읽힘, 파일만 지우고 항목(1판 partition) 그대로 · stale — 쓰지 않고 지움, 옛 항목 그대로 · adhoc — next 와 같음. 네 경우 모두 파일 권한 `-rw-------`, 끝난 뒤 남은 파일 없음, 기록에 값 없음. 단계 전체 약 20초.
  - 그래도 남기는 까닭: TCC 는 DR(csreq)로 비교하므로 인증서 서명이면 이어진다(CI 로는 못 잼). 이미 ad-hoc 판을 쓰던 사람은 인증서로 바뀐 첫 판에서 TCC 를 한 번 더 묻는다.
- 맥에서 HTTPServer 의 `getfqdn` 역조회를 건너뛴다(`ExclusiveHTTPServer.server_bind`). 첫 CI 실행에서 '로컬 네트워크의 기기 찾기 허용?' 창이 떴고 서버가 15초 늦게 떴다. 건너뛰고 나서 창이 없어지고 1초 만에 뜬다.
- 업데이트 뒤 LMS·메일이 함께 안 되던 문제 (2026-10-22 사용자 신고 → 1.12.36):
  - 진단 `mac-diagnose.yml`(가짜 서버만 — 계정은 가짜, 메일 127.0.0.1, LMS 는 러너 안 `fake_lms.py`, 부르기 전마다 `guard_fake_targets`). 릴리스 v1.12.34 그대로(실행 39707720717): **새로 깐 맥은 두 칩 모두 됐다**(키체인 저장, 메일이 비밀번호를 읽음, 크로미움 151 받기·띄우기, 작업 프로세스가 가짜 LMS 에 비밀번호 입력). **업데이트한 맥(1.12.33 → 1.12.34)은 새 판이 창·화면 서버가 뜨기 전에 '키체인 암호 입력' 창에서 멈췄다.** `app.py` 맨 위 `import web_ui` → `runtime_config` 가 모듈 맨 위에서 비밀값을 풀며 키체인을 열었고, 옛 판이 만든 항목은 새 판이 허락 없이 못 읽는다(partition_id, 위 '서명 인증서'). 거부하면 `mac_keychain.unprotect` 가 말없이 빈 값을 줘 '설정에서 학교 이메일 계정을 먼저 입력해 주세요'·'LMS ID/비밀번호를 확인해 주세요' 로만 보였다. Safari(기본 브라우저)·메일 서버 인증서는 원인이 아니었다(LMS 는 받은 크로미움을 쓰고, certifi 로도 `mail.dgist.ac.kr:993` 체인이 온전).
  - 10-15 에 고르고도 합쳐지지 않았던 '키체인 넘겨주기'(브랜치 `claude/clever-williamson-3c13f8`)를 지금 코드에 옮겨 합쳤다. 예비 경로가 `~/.lms-autosaver` 고정이라 `default_data_root` 규칙으로 고쳤다(CLAUDE.md 29).
  - 넘겨줄 틈이 없는 업데이트(DMG 끌어 놓기·한 줄 설치·넘겨주기가 없던 판에서 올라올 때)를 위해: 켤 때는 묻는 창 없이만 읽고(`mac_keychain.quiet_startup`, `app.py` 가 `import web_ui` 전에), 허락이 필요하면 창이 뜬 뒤 묻는다(`unlock_interactive`, 뒤 스레드 — 묻는 동안 `_lock` 을 잡지 않아 화면 요청이 멈추지 않는다). 허락하면 `runtime_config.refresh_secrets`. 상태 `ok`·`need`·`asking`·`denied` — 거부하면 그 실행에서는 다시 묻지 않는다(예전엔 5분마다 아무 요청이나 다시 열어 창이 또 떴다).
  - 기다리는 동안(`secret_store.waiting`) LMS·메일 작업을 시작하지 않는다(`web_ui.start_task`, 빈 비밀번호 로그인 → '서버가 거절' 2시간 쉬기를 막으려고). 건강 알림이 '키체인 허락을 기다리고 있어요'·'키체인에서 비밀번호를 못 꺼냈어요' 와 할 일을 말한다(`get_health` 의 `keychain`, `KEYCHAIN_WAIT_MESSAGE`).
  - 되살리기: 거부한 뒤 설정에서 비밀번호를 다시 저장하면 `protect` 가 못 읽는 옛 항목을 묻지 않고 지우고(nextdel 실측) 이 판의 항목을 만든다. 예전엔 이때 평문으로 남았다. 다시 넣지 않은 값은 '항목에 이 값이 없습니다' 로 알린다.
  - 묻는 창이 떠 있는 동안(asking)에는 **같은 프로세스의 키체인 호출이 그 창이 닫힐 때까지 막힌다** (CI 실행 39712261129: 창을 둔 채 저장하자 요청이 30초 넘게 멈췄고, `_lock` 을 쥐고 있어 건강 확인·설정 요청까지 멈췄다). 그래서 그동안의 저장은 키체인을 부르지 않고 값을 잡아 두었다가(`_pending`, config.json 에는 표시만) 창이 닫히면 넣는다 — 허용이면 옛 값과 합쳐, 거부면 옛 항목을 지우고 잡아 둔 값으로. 다시 저장으로는 창을 못 닫으므로 안내는 '창이 안 보이면 Daling 을 껐다 켜 주세요'(껐다 켜면 창이 먼저 뜬 뒤 다시 묻는다).
  - 까닭 전달: `mac_keychain.last_error` → `secret_store.last_error`·`read_problem`, `runtime_config.SECRET_READ_ERRORS`, 작업 프로세스에는 `_secret_handover` 의 `"_secret_errors"`(점검의 `handed=` 개수에는 안 듦). 메일(`email_reader._missing_account_message`)·LMS(`login_lms` — 빈 비밀번호로는 SSO 에 로그인하지 않는다)·`/api/refresh-emails` 가 이 까닭을 말한다.
  - 검증: 단위 흉내 27개(켤 때 조용히 → 허락, 거부, 거부 뒤 다시 저장, 묻는 중 요청이 안 멈춤, 창을 둔 채 다시 저장·옛 창 답 버리기, 새 설치), 작업 프로세스 까닭 전달 5개, CI 넘겨주기 점검 두 칩 '모두 통과', mac-diagnose 로 고친 빌드: 업데이트 뒤에도 창·서버가 먼저 뜨고 키체인 창은 그 위(화면), 기다리는 동안 메일 안 함. '거부' 는 CI 로 흉내 낼 수 없었다(SecurityAgent 를 꺼도 창이 다시 뜸).

## 리눅스 판 (2026-10-12)
- 빌드는 GitHub Actions `.github/workflows/linux.yml`(main 푸시 때 `build.yml` 이 부름, 수동 실행 또는 `build/linux` 푸시). ubuntu-22.04(glibc 2.35 → Ubuntu 22.04·Debian 12·Fedora 36 이상)·Python 3.13·`requirements-linux.txt` → `packaging/linux/daling-linux.spec`(onedir, 실행 파일 `daling`) → Xvfb 로 실제 창 띄워 보기 → `--autosaver-smoke` → `daling-<버전>-linux-x86_64.AppImage`(appimagetool, 정적 런타임이라 libfuse2 불필요)·`.tar.gz`(`install.sh` 가 `~/.local/opt/daling`·`~/.local/bin/daling`·`.desktop`). 첫 실행: 19개 점검이 바이너리·AppImage·tar 설치본 모두 통과, 키링 왕복 20개 통과. 크기는 AppImage 262MB(QtWebEngine 이 크롬 하나를 통째로 든다).
- 창: pywebview Qt(PyQt6·QtWebEngine). WebKitGTK 는 보조 프로세스 경로가 컴파일 때 박혀 묶을 수 없다. Ubuntu 23.10+ 처럼 AppArmor·커널이 사용자 네임스페이스를 막으면 크로미움 샌드박스가 죽으므로 그때만 `QTWEBENGINE_DISABLE_SANDBOX=1`(메일 HTML 은 스크립트 막은 iframe). 화면(DISPLAY·WAYLAND)이 없거나 Qt 를 못 띄우면 기본 브라우저로 열고 서버·스케줄러는 Ctrl+C 까지 돈다 (`linux_support.py`, `app.run_linux_window`).
- 비밀 설정: `secret_store.py` 가 맥(`mac_keychain`)·리눅스(`linux_secrets`)를 고른다. 리눅스는 Secret Service(GNOME 키링·KWallet, `secretstorage`) 항목 하나(application=Daling, account=settings)에 JSON, config.json 에는 `keychain:<키>`. 쓸 수 없으면 `<데이터 폴더>/secrets.json`(0600)에 두고 `secretfile:<키>`. 잠긴 키링을 여는 창은 앱 본체만 띄운다(작업 프로세스는 안 띄움).
- 시스템 프로그램(`xdg-open`·`notify-send`·브라우저)에는 묶음의 `LD_LIBRARY_PATH`·Qt 설정을 뺀 환경을 준다(PyInstaller 안내). 알림은 `notify-send`(인자로 넘김, 셸 없음). 인증서는 시스템 CA 묶음.
- 경로: 데이터 `~/.lms-autosaver`, LMS 브라우저 `~/.cache/ms-playwright`(XDG_CACHE_HOME), 문서 폴더는 `user-dirs.dirs`(예: `~/문서`). `node` 실행 권한은 CI 에서 준다(AppImage 안은 읽기 전용). 크로미움이 시스템 라이브러리가 없어 못 뜨면 배포판별 설치 명령을 한 줄로 알린다(`browser_setup.explain_launch_failure`). `browser_ready` 가 리눅스 `chrome-headless-shell` 도 본다(예전엔 못 알아봤다).
- 묶음에서 뺀 시스템 라이브러리(C++ 런타임·GLib·글꼴·D-Bus·NSS·GTK·CUPS 인쇄 플러그인): 새 배포판의 Mesa·GIO·fontconfig 가 우리 22.04 판을 끌어오지 않게. 24.04·Fedora 에서 문제가 나면 CI 로그 `ldd.txt`·`bundled-libs.txt` 를 본다.
- 업데이트: 설치하지 않고 릴리스의 `daling-<버전>-linux-x86_64.AppImage` 주소를 연다(`manualUrl`). tar.gz·한 줄 설치판(`APPIMAGE` 없음)에는 AppImage 를 권하지 않고 한 줄 설치 명령을 다시 돌리라고만 한다(`LINUX_SCRIPT_NOTE`). `/api/restart` 는 `.AppImage` 파일을 다시 띄운다.
- 아이콘: `packaging/linux/daling-128/256/512.png` ← `python scripts/make_icons.py --linux`. 한글 입력은 PyQt6 휠에 든 ibus 플러그인만(fcitx5·kime 는 안 될 수 있다).

## 서명·한 줄 설치 (2026-10-15)
공인 코드 서명을 무료로 바로 받을 길이 없어서(아래 표), 경고 창이 뜨는 원인인 '인터넷에서 받음' 표시를 붙이지 않는 길로 깔게 했다.
- 명령 (사이트 내려받기 아래 '경고 창 없이 한 줄로 설치'):
  - Windows: `irm https://gudaling.dev/install.ps1 | iex` (PowerShell 창에. Win+R 에 넣지 않게 안내 — ClickFix 악성 수법과 같은 모양이라 탐지 규칙에 걸릴 수 있다)
  - Mac·Linux: `curl -fsSL https://gudaling.dev/install.sh | sh`
- 원본: `docs/install.ps1`·`docs/install.sh`. 사이트 배포(`npx wrangler pages deploy docs --project-name daling-app --branch main`)로 나간다. `docs/_headers` 가 두 파일을 `text/plain; charset=utf-8`·`no-cache` 로 내보낸다.
- 둘 다 GitHub 릴리스에서 이 컴퓨터용 파일을 받아 SHA-256 을 맞춰 본 뒤에만 깐다. 확인값은 API 의 자산 digest, API 한도(로그인 없이 같은 IP 에서 시간당 60번 — 2026-10-15 이 PC 에서 60/60 다 써서 실제로 걸림)에 걸리면 `/releases/latest` 태그로 이름을 맞추고 함께 올린 `<파일>.sha256` 으로 확인한다. 그래서 **릴리스에는 설치 파일마다 `.sha256` 을 같이 올린다** (Windows 것은 `build_installer.ps1` 이 만든다).
- Windows (`install.ps1`):
  - PowerShell(5.1·7)·curl.exe·WebClient 로 받은 파일에는 MOTW(Zone.Identifier)가 없다(이 PC 실측: MOTW=False). SmartScreen 앱 평판 검사는 MOTW 가 있는 파일에만 돈다 → 'PC 보호' 창 없음. 설치 창(개인정보 안내·바로가기)은 그대로 띄운다. 57MB 받기·확인 약 11초(실측).
  - 이 파일은 **BOM 없는 UTF-8** (규칙 20 의 예외): 5.1 의 `irm | iex` 는 BOM 을 글자로 읽어 첫 줄이 깨지고, charset 이 없으면 한글이 Latin-1 로 깨진다(둘 다 실측). 깨지면 영어 안내로 바꾼다('가'.Length 검사). 지역 형식이나 표시 언어가 한국어면 한국어.
  - Defender 는 그대로 검사한다(예전 `Bearfoos.A!ml` 같은 오탐은 못 막음 → microsoft.com/wdsi/filesubmission 에 '소프트웨어 개발자'로 제출). 스마트 앱 컨트롤(SAC)이 켜진 PC 는 받은 길과 상관없이 서명 없는 exe·dll·pyd 를 막고 앱별 예외도 없다 → 스크립트가 SAC 상태(`Get-MpComputerStatus`)를 보고 미리 알린다.
- 맥 (`install.sh`): curl 은 격리 표시(com.apple.quarantine)를 붙이지 않고, Gatekeeper 의 공증 검사는 격리 표시가 있을 때만 돈다 → ad-hoc 서명 앱이 창 없이 뜬다(XProtect 검사는 그대로). DMG 를 붙여 `ditto` 로 옆에 복사 → `codesign --verify --deep --strict` → 예전 판은 이름만 바꿔 치우고 새 판을 넣는다. 켜져 있으면 닫고, 끝나면 연다. 앱 안 업데이트도 이 파일을 쓴다(위 'macOS 판'). 관리 대상(MDM) 맥은 막힐 수 있다.
- 리눅스 (`install.sh`): 서명 검사가 없다. tar.gz 를 `~/.cache` 에 풀어(페도라 /tmp 는 메모리) 그 안의 `install.sh` 로 `~/.local/opt/daling`·앱 목록·`~/.local/bin/daling` 에 깐다.
- CI 점검: `mac.yml` '한 줄 설치·앱 안 업데이트 점검'(릴리스판 설치 → 격리 표시 없음·서명·실행 확인 → 켜 둔 채 이번 빌드 DMG 로 바꾸기 → 판·실행 확인), `--autosaver-smoke` 의 '앱 안 업데이트 도구'·'받은 파일 격리 표시', `linux.yml` '한 줄 설치 점검'.
- 빌드 출처 증명: `mac.yml`·`linux.yml`·`release.yml` 이 `actions/attest@v4`(Sigstore, 공개 저장소 무료)로 만든 파일을 기록한다. 확인 `gh attestation verify <파일> -R tutleblue/dgist-lms-autosaver` (gh 로그인 필요). 이 PC 에서 만든 Windows 설치 파일은 기록이 없다. 경고 창을 없애 주지는 않는다.
- `release.yml`: SignPath 비밀(`SIGNPATH_API_TOKEN`·`SIGNPATH_ORGANIZATION_ID`)이 없으면 `check` 작업이 빌드를 건너뛴다(예전엔 태그마다 1시간 기다리다 실패할 판이라 손으로 취소). 있으면 서명 → `.sha256` → 출처 증명 → 릴리스가 이미 있으면 거기에 올린다.
- 무료 공인 서명 현황 (2026-10-15 조사):

| 길 | 비용 | 걸리는 시간 | 메모 |
|---|---|---|---|
| SignPath Foundation (Windows) | 무료 | 심사 수 주~2달, 승인 뒤에도 밀림 | 2026 거절 사례가 '사용자층이 아직 없음'. 이 저장소(별 0)는 지금은 어렵다. 받아도 게시자는 'SignPath Foundation', SmartScreen 평판은 쌓여야 함. `release.yml`·`.signpath/` 준비됨 |
| OSSign (Windows) | 무료 | — | 신청 잠정 중단, 저장소 6개월 이상 활동 필요 |
| Microsoft Store MSIX | 무료(개인 등록 2025-09~) | 1~2주 | Microsoft 가 서명 → Store 설치는 SmartScreen·SAC 모두 통과. 포장은 준비됨(`packaging\msix`), 심사(로그인 앱은 시험 계정 요구 → '체험 모드' 로 대응)가 남음 — 아래 'Microsoft Store 판' |
| Azure Artifact Signing | 월 $9.99~ | — | 개인은 미국·캐나다만 |
| Certum 오픈소스 인증서 | 약 €49 | 며칠 | 유료, 품절 |
| Apple 공증 (맥) | 연 $99 | — | 무료 Apple 계정으로는 불가. Homebrew 는 `--no-quarantine` 을 없앴고(5.0) Gatekeeper 를 못 넘는 cask 를 2026-09-01 에 막았다 |

## Microsoft Store 판 (MSIX, 2026-10-15)
무료로 지금 받을 수 있는 공인 서명은 Store 뿐이다(위 표). Store 에서 받은 MSIX 는 Microsoft 가 다시 서명하므로 SmartScreen('PC 보호')·스마트 앱 컨트롤(SAC)·S 모드(Store 앱만 허용)에 막히지 않는다. EXE·MSI 를 그대로 내는 길(정책 10.2.9)은 공인 인증서 서명이 있어야 해서 안 된다.
- 만들기: `packaging\msix\build_msix.ps1` — [1/6] `dist\붕어빵`(없거나 `-Build` 면 `build_installer.ps1 -Stage exe`) → [2/6] `build\msix\layout` 에 복사 + 매니페스트 → [3/6] `resources.pri` → [4/6] MakeAppx → [5/6] 서명 → [6/6] `-Install`(·`-Smoke`). `-Uninstall` 은 시험판 지우기.
  - 시험판 `packaging\out\daling-<버전>-win-x64.msix`: 이름 `<게시자>.Daling`, 게시자 = 사설 인증서 주체(`CN=붕어빵 (…), O=…`), 사설 서명. 73.8MB(Inno 설치 파일 57MB 보다 큼: MSIX 는 파일마다 따로 압축).
  - 제출판 `-Store -IdentityName … -Publisher … -PublisherDisplayName …` → `…-store.msix`: Partner Center 값으로, 서명 안 함(Store 가 서명). 가짜 값으로 묶기까지 확인.
  - 도구: Windows SDK 가 없으면 Microsoft 의 NuGet 패키지 `Microsoft.Windows.SDK.BuildTools` 10.0.26100.4654(22MB)를 `build\msix-tools` 에 한 번 받아 MakeAppx·MakePri·SignTool 을 쓴다. 셋 다 Microsoft 서명인지 확인한다(SDK 전체 설치는 관리자 권한이 든다).
  - 판 번호: `VERSION` 1.12.28 → 1.12.28.0 (Store 는 넷째 자리를 자기가 쓰므로 0).
- 매니페스트 틀 `packaging\msix\AppxManifest.xml`: `runFullTrust`(보통 Win32 앱), `windows.startupTask`(꺼짐), 실행 별칭 `daling.exe`, 최소 Windows 10 2004(19041), 언어 ko-KR·en-US. 실행 파일 이름은 `붕어빵.exe` 그대로(MakeAppx 가 받아 줌).
- 로고: `python scripts/make_icons.py --msix` → `packaging\msix\Assets`(배율 5벌 + 작업 표시줄 크기 14벌 × 바탕판 없는 판). 이름만으로는 Windows 가 배율 판을 못 고르므로 build 가 makepri 로 `resources.pri`(후보 96개)를 만든다 — 없으면 작업 표시줄·시작 메뉴 아이콘이 빈다. `_internal` 수천 개는 색인하지 않게 매니페스트+Assets 만 따로 놓고 만든다.
- 이 PC 시험 설치: MSIX 설치는 시스템 서비스가 서명을 보므로 '현재 사용자' 신뢰로는 안 되고(실측 0x800B0109 '루트 인증서는 신뢰할 수 있어야'), **사용자가 직접** 관리자 PowerShell 에서 한 번 `Import-Certificate -FilePath packaging\bungeoppang-codesign.cer -CertStoreLocation Cert:\LocalMachine\TrustedPeople`. (보안 설정이라 대신 하지 않는다. 되돌리기: 인증서 관리자에서 '신뢰할 수 있는 사람'의 붕어빵 인증서 삭제)

### MSIX 안에서 달라지는 것
2026-10-15 이 PC 실측 (`<게시자>.Daling_1.12.28.0_x64__mm60x010zk88p`, 설치 위치 `C:\Program Files\WindowsApps\…`):
- `daling.exe --autosaver-smoke` **14개 통과**. 작업 프로세스가 같은 패키지 이름으로 돎(`package=` 일치), node 실행, 업데이트는 Store 로.
- `%LOCALAPPDATA%` **바로 아래에 새로 만든 폴더**: 패키지 안에서 만들면 `…\Packages\<패밀리>\LocalCache\Local` 로 가고 밖에서 안 보인다. 반대로 **설치 뒤에 밖에서 만든 바로 아래 폴더는 패키지 안에서 아예 안 보인다**(폴더 2개로 확인. 같은 EXE 를 패키지 밖에서 돌리면 보임). 설치 전부터 있던 `ms-playwright` 는 보인다.
- **이미 있던 하위 폴더**(`Programs\붕어빵`, 삼성 노트 `LocalState`, `Temp`): 밖에서 만든 파일이 보이고, 안에서 새로 만든 파일·고친 내용이 진짜 자리에 그대로 간다 → 삼성 노트 DB·백업·저널도 진짜 자리에 쓰인다(실제 DB 에는 쓰지 않고 같은 성격의 폴더로 확인). 홈 폴더·`Temp` 도 진짜 자리.
- 알림: 패키지 안에서 앱 ID 'Daling' 과 패키지 앱 ID 둘 다 알림 기록에 남았다(둘 다 뜸). 패키지 앱 ID 를 쓰는 까닭은 시작 메뉴의 Daling 과 같은 앱으로 묶기 위해서.
- 창: `daling.exe` 로 켜면 서버가 0.8초 만에 뜨고(`/healthz`), 패키지 안 `붕어빵.exe` 의 'Daling' 창(1320×812)에 WebView2 로 대시보드가 그려진다(제목 줄 없는 모양까지 같음).
- 따로 된 데이터로 띄워 볼 때는 `AUTOSAVER_ROOT`(web_ui) 와 `AUTOSAVER_DATA_ROOT`·`AUTOSAVER_CONFIG_PATH`(작업 프로세스)를 **모두** 바꿔야 한다. `AUTOSAVER_DATA_ROOT` 만 바꿨더니 화면은 실제 `C:\lms-autosaver` 를 읽었다(41초 만에 껐고 `boot_times.json`·`notices.json` 만 쓰임. 예약 작업은 켜고 45초 쉰 뒤라 돌지 않음). 실행 별칭은 부른 쪽의 환경 변수를 물려준다.
- 확인 못 한 것: 작업 표시줄·시작 메뉴 아이콘 모양, 알림 클릭, 시작 시 자동 실행 켜기, SAC 켠 PC, 실제 LMS 동기화(Store 판으로 로그인).

| 무엇 | Inno 설치판 | Store 판(MSIX) | 대응 |
|---|---|---|---|
| 설치 폴더 | `%LOCALAPPDATA%\Programs\붕어빵` | `C:\Program Files\WindowsApps\<패키지>` 읽기 전용 | 앱이 설치 폴더에 쓰는 곳 없음(코드 확인: `PROJECT_ROOT` 는 읽기만) |
| 데이터 `C:\lms-autosaver` | 그대로 | 그대로 (AppData 밖은 가상화 안 함) | 두 판이 같은 데이터를 나눠 쓴다. 앱을 지워도 남음 |
| `%LOCALAPPDATA%` 에 새로 만드는 파일·폴더 | 그대로 | 패키지 전용 자리(`…\Packages\<패밀리>\LocalCache\Local`)로 돌려지고, 앱과 그 자식 프로세스에게만 원래 자리로 보인다. 이미 있는 파일 고치기는 진짜 자리에 | LMS 브라우저(`ms-playwright`)는 설치 전부터 진짜 자리에 있었으면 그것을 쓰고, 없으면 패키지 안에 받는다(앱을 지우면 같이 지워짐). 설치 뒤 Inno 판이 받은 것은 Store 판이 못 본다(실측, 아래) |
| HKCU 쓰기 | 그대로 | 앱 전용 사본 | 앱은 레지스트리에 쓰지 않는다(winreg 없음) |
| 시작 시 자동 실행 | 설치 때 고르면 시작프로그램 폴더 바로 가기 | 바로 가기를 만들어도 가상화돼 탐색기가 못 본다 → `StartupTask`(기본 꺼짐) | 켜기: 설정 › 앱 › 시작 프로그램(또는 작업 관리자 › 시작 앱)에서 Daling |
| 작업 프로세스 | `붕어빵.exe --autosaver-job` | 같음. 자식 프로세스(작업·node·크로미움·알림 PowerShell)가 패키지 신원을 물려받는다 | `--autosaver-smoke` 가 작업 프로세스의 패키지 이름이 같은지 본다 |
| 앱 안 업데이트 | GitHub 설치 파일을 받아 조용히 설치 | 끔. 돌리면 Store 판과 따로 노는 Inno 판이 하나 더 깔린다 | `runtime_config.is_msix()` → `updater` 가 GitHub 에 묻지 않고 'Microsoft Store가 새 버전을 알아서 설치해요'. 새 버전은 Store 가 깐다 |
| 작업 표시줄 앱 ID | `DGIST.Bungeoppang.App` 을 붙임 | 패키지가 정함(`<패밀리>!Daling`) | 패키지 안이면 `SetCurrentProcessExplicitAppUserModelID` 를 부르지 않는다(붙이면 창이 시작 메뉴의 Daling 과 다른 앱으로 묶인다) |
| 알림 | winotify 앱 ID 'Daling' | 패키지 앱 ID 로 | `app.notify` 가 `msix_app_user_model_id()` 를 쓴다 |
| WebView2 | 없으면 설치 파일이 깔아 줌 | MSIX 는 설치 프로그램을 못 돌린다 | Windows 11 은 기본 포함, 10 도 Edge 업데이트로 대부분 있음. 없으면 창 대신 기본 브라우저로 연다(`app.run_in_browser`) |
| 명령 줄 | 실행 파일 경로 | 실행 별칭 `daling.exe` (`%LOCALAPPDATA%\Microsoft\WindowsApps`) | 점검: `daling.exe --autosaver-smoke` |
- 개발 서버에서 Store 판 화면 보기: `.claude/launch.json` 의 `autosaver-src-store`(8793, `AUTOSAVER_PRETEND_MSIX=1`). 설정 › 앱 › 새 버전 칸에 'Microsoft Store가 새 버전을 알아서 설치해요 (v1.12.28)', 새 버전 알약·'지금 업데이트' 없음 확인(콘솔 오류 0).
- 남은 위험(제출 전에 볼 것):
  - **LMS 브라우저**: 2026-10-15 부터 Windows 는 Microsoft 서명 Edge 를 `channel="msedge"` 로 써서(4.1) 패키지 밖에서 서명 없는 실행 파일을 받지 않는다. 남은 위험은 Edge 가 없거나(지운 PC) 회사·학교 정책으로 headless 가 막혀 못 띄우는 PC 뿐 — 그때만 예전처럼 서명 없는 `chrome-headless-shell` 을 받아 SAC·정책 10.2.2 위험이 남는다. 묶은 `node.exe` 는 OpenJS Foundation 서명(Valid).
  - 삼성 노트 정리(`organize_notes`)는 다른 앱(삼성 노트)의 DB 를 직접 고친다. 심사에서 '다른 앱 데이터 변경'으로 볼 수 있다. PDF 보내기(WinRT Launcher)는 지원되는 방법.

### Store 제출 절차 (계정 등록·제출은 사용자가 직접)
1. **개인 개발자 등록(무료)**: storedeveloper.microsoft.com → 'Get started for free' → 개인(Individual) 선택, 개인 Microsoft 계정으로 로그인 → 휴대폰으로 정부 발급 신분증 원본 + 셀카 촬영(밝은 곳). 2025-09 부터 개인은 무료·카드 불필요, 회사 계정은 $99.
2. Partner Center › 앱 및 게임 › 새 제품 › MSIX 또는 PWA 앱 → 이름 예약('Daling'. 이미 쓰이면 'Daling for DGIST' 등 — 보이는 이름 `DisplayName` 도 같이 바꿔 묶는다).
3. 제품 관리 › 제품 ID 에서 `Package/Identity/Name`·`Package/Identity/Publisher`·`Package/Properties/PublisherDisplayName` 을 복사 → `build_msix.ps1 -Build -Store -IdentityName … -Publisher … -PublisherDisplayName …` → `packaging\out\daling-<버전>-win-x64-store.msix` 를 패키지 칸에 올린다.
4. 제출 칸:
   - 가격·사용 가능: 무료, 시장은 대한민국(또는 전체).
   - 속성: 범주 '교육'(또는 '생산성'), **개인정보처리방침 URL `https://gudaling.dev/privacy`** (정책 10.5.1: 아이디·비밀번호·메일을 다루므로 필수. 2026-10-15 열림 확인), 지원 주소(GitHub issues 또는 tutleblue12@gmail.com).
   - 연령 등급: IARC 설문. 폭력·도박 없음, 사용자끼리 대화하는 기능은 없음(학교 메일 보내기는 이용자 본인 계정의 메일 앱 기능)으로 답한다.
   - 스토어 목록(한국어·영어): 설명, 짧은 설명, 스크린샷(1366×768 이상, 개인정보 없는 화면). **스크린샷은 `packaging\msix\store-screenshots\` 의 12장** — `ko-1-dashboard`~`ko-6-mail` 은 한국어 목록에, `en-…` 은 영어 목록에 번호 순서대로(대시보드·과제 마감·캘린더·강의·자료·메일함). 1920×1080 PNG, 장마다 140~260KB.
     - 다시 찍기: `.venv\Scripts\python.exe packaging\msix\store_screenshots.py` (약 40초. `--lang ko|en`, `--theme dark`, `--only dashboard emails`). 임시 폴더를 데이터 폴더로 삼은 개발 서버(8792)를 따로 띄워 체험 모드(가짜 데이터, 아래 '체험 모드' 절)로 찍으므로 `C:\lms-autosaver` 는 읽지도 쓰지도 않는다. 2026-10-15 찍는 동안 서버가 막은 바깥 연결 0건.
     - 모양: 1536×864 화면을 1.25배(1080p 노트북의 Windows 기본 배율 125%). 개발 서버엔 창 단추가 없어서 `/api/window` 대답만 custom:true 로 바꿔 설치본처럼 최소화·최대화·닫기를 그리고, 체험 중엔 빼는 바깥 글꼴(Inter·Lora)을 찍는 브라우저에만 붙인다.
     - 체험 표시(맨 위 줄무늬 띠·'체험 중 · 가짜 데이터' 알약·상태판 '체험 중')는 넣지 않는다(사용자 결정, 2026-10-15). 둘러보는 사람이 '체험 끝내기'를 기능으로 오해하지 않게. 첫 화면의 `<html data-demo>` 만 떼고 받아 보통 화면 코드로 그리므로 화면에 보이는 것은 모두 계정을 넣은 화면에도 있는 것이다. 체험 화면 그대로는 `--demo-badge`.
     - 구도: 캘린더는 메일에서 뽑은 세미나 날을 골라 상세에서 그 메일을 펼친 모습(연사·장소·본문), 자료는 '전체 목록'(과목 폴더 4개만으로는 화면이 빔), 메일함은 맨 위 메일을 연 모습. 가짜 데이터가 찍는 날 기준이라 날짜·'오늘 남은 수업' 수는 찍는 시각마다 다르다.
   - **제한된 기능 `runFullTrust` 사유** (영어로):
     > Daling is a classic Win32 desktop app (Python, packaged with PyInstaller) that shows its UI in WebView2 served from a local 127.0.0.1 server. It starts its own helper processes (붕어빵.exe --autosaver-job) and Playwright's bundled Node.js driver to sign in to the university LMS with the system Microsoft Edge in headless mode (nothing is downloaded on Windows), saves course files to the user's own folders (C:\lms-autosaver, Documents) and can hand PDFs to Samsung Notes. These need full-trust desktop execution; the app cannot run in an AppContainer.
   - **인증 참고 사항(Notes for certification) — 정책 10.3.1** ('로그인이 필요하면 쓸 수 있는 시험 계정을 주라'): DGIST 계정은 학교가 재학생에게만 발급하는 SSO 계정이라 심사용으로 만들 수 없고, 이용자 계정을 넘기는 것은 학교 규정 위반이다. 대응은 앱 안 **체험 모드**(아래 '체험 모드' 절, 1.12.28~). 참고 사항 칸에 그대로 붙인다:
       > No test account is needed. DGIST LMS and school mail use SSO accounts that the university issues only to enrolled students, so we cannot create one for testers. Instead, the app has a built-in demo mode with sample data:
       > 1. Launch Daling. On the first intro card, click "Try without an account" (or, any time, the same button in the top bar, or Settings › Connected accounts › Demo mode › "Try the demo").
       > 2. Every screen fills with sample data: Dashboard, Deadlines, Calendar, Courses (with announcements), Files (sample PDFs open locally) and Mailbox (read, star, delete, restore).
       > 3. While the demo is on, a striped bar at the top and a "Demo · sample data" pill are shown. The app makes no network requests in demo mode; actions that need a server (sync, sending mail, Google sign-in, uploads) show "Not available in demo mode".
       > 4. Click "End demo" in the top bar to leave the demo. Your own data folder is not touched.
       > Public screens (academic calendar, school notices, shuttle bus, course timetable) also work without an account outside demo mode. The UI can be switched to English in Settings › Language; demo data then appears in English.
     - 심사자가 한국어 화면으로 보면 체험 데이터도 한국어다(켤 때의 화면 언어로 만든다). 영어로 보려면 먼저 설정 › 언어를 English 로.
5. 심사는 보통 1~3일. 통과하면 Store 주소가 생긴다 → 사이트 내려받기에 'Microsoft Store 에서 받기' 를 더할 수 있다.
6. 새 버전: `VERSION`·changelog 를 올리고 같은 명령으로 새 `-store.msix` 를 만들어 '업데이트' 제출. Store 가 이용자 PC 에서 자동으로 바꾼다(앱 안 업데이트는 꺼져 있음).

## 체험 모드 (2026-10-15)
Microsoft Store 정책 10.3.1(로그인 앱은 심사용 시험 계정을 줄 것)에 대응. DGIST 계정은 학교가 재학생에게만 주는 SSO 계정이라 줄 수 없어서, 심사자와 처음 깐 사람이 계정 없이 모든 화면을 보게 했다. 코드: `demo_mode.py`, `web_ui`(`workspace_for_user`·`_demo_get`·`_demo_post`·`toggle_demo`·`send_demo_index`), `app.scheduler_loop`, `app.js`(`DEMO_ON`·`renderDemoPill`·`setDemo`).

- **켜기·끄기**: 첫 실행 소개 첫 카드의 '계정 없이 체험하기'(계정이 없을 때만), 상단 바 알약(계정이 없으면 '계정 없이 체험하기', 체험 중이면 '체험 중 · 가짜 데이터 · 체험 끝내기'), 설정 › 연결된 계정 맨 아래 '체험 모드'. `POST /api/demo {on, lang}` 뒤 화면을 새로 띄운다(남은 목록·캐시가 섞이지 않게). 켠 상태는 메모리에만 있어 앱을 다시 켜면 늘 내 데이터로 시작한다. 동기화·메일 작업이 도는 중에는 켜지 않는다('가져오는 중이에요').
- **데이터 폴더**: 켜면 `%TEMP%\daling-demo\<pid>`(표지 `.daling-demo`)에 새로 만들고(실측 0.06초) `workspace_for_user` 가 그 폴더를 돌려준다. 끄면 그 폴더를 지운다. 앱이 체험 중에 꺼져 남은 폴더는 다음에 켤 때 하루 지난 것만 치운다. 진짜 폴더(`C:\lms-autosaver`)에서는 화면 취향 세 파일(`ui_prefs.json`·`tutorial.json`·`whats_new.json`)만 읽어 오고, 끌 때 체험 중 바뀐 것(테마·언어, 끝까지 본 소개)만 돌려놓는다. 자료·메일·설정은 옮기지 않는다. 오류 기록(`server_errors.log`)도 체험 중에는 체험 폴더에.
- **가짜 데이터**(켤 때 화면 언어 ko/en 으로, 날짜는 오늘 기준): 과목 4개(미적분학Ⅱ·일반물리학Ⅱ·프로그래밍 기초·글쓰기와 소통, LMS 과목명 꼴 그대로), 강의자료 17개(LMS 폴더·순서·받은 날짜를 흩어 둠, PDF 는 눌러 열리는 진짜 한 쪽 PDF·영문), 마감 11개(오늘·내일·3일 뒤… 제출·채점 완료 섞음)와 LMS 일정(중간고사), 과목 공지 6개, 메일 13통(받은 편지함 10·보낸 2·휴지통 1, 분류·안읽음·답장·세미나/진로 행사 날짜 → 캘린더), 시간표 7칸, 내 일정 2개, 학교 공지 6개(누를 곳 없음), 학교 행사 2개(사진 없음), 셔틀 예시 노선(화면에 '체험용 예시 시간표예요'). 학사일정·개설강좌는 앱에 든 공개 씨앗 그대로. 시험·세미나가 주말에 걸리면 월요일로.
  - 사람은 옛이야기 인물(이몽룡·성춘향·전우치·심청·장화·홍련·콩쥐·팥쥐, 영어 화면은 로마자), 주소는 예약된 `example.com`, 강의실은 A101 같은 번호. 실명·실제 주소 없음.
  - 설정은 상태판이 정상으로 보이게 `LMS_ID`·`SCHOOL_EMAIL`(student@example.com)과 비밀번호 칸에 자리 글자(`demo`)만 넣는다. 진짜 비밀번호가 아니고 어디로도 보내지 않는다. Drive 는 꺼 둠.
- **바깥 요청 0건**: 체험 중에는 (1) `start_task` 가 작업 프로세스를 띄우지 않고(자동 실행도), `scheduler_loop` 는 알림까지 쉰다. (2) 화면 서버가 바깥이 필요한 라우트를 먼저 받는다: 동기화·메일 보내기/임시저장/이동·번역·Drive·Google·캘린더·삼성 노트·내 컴퓨터 저장·.ics 내보내기·업데이트·제출 페이지 열기·설정 저장은 409 '체험 중에는 쓸 수 없어요. 체험을 끝내고 계정을 넣으면 돼요.', 학사일정·공지·셔틀·학교 행사·개설강좌는 새로 받지 않고 있는 것(씨앗)만, 메일 읽음·별표·휴지통·되돌리기는 체험 폴더의 `emails.json` 만 고친다(`demo_mode.patch_mail`). 상단 새로고침은 같은 문구만 띄운다. (3) 안전망: `socket.getaddrinfo`·`socket.connect`·`connect_ex` 를 바꿔 끼워 루프백이 아닌 곳은 막고 `demo_mode.BLOCKED` 에 남긴다(`GET /api/demo` 의 `blocked`). (4) 화면: 체험 중 `index.html` 은 서버가 `<html data-demo="1">` 를 달고 Google Fonts `<link id="webFonts">` 를 뺀다(그래서 `styles.css` 맨 위의 `@import` 를 `index.html` 로 옮겼다). 체험 중 메일 임시저장·별표 localStorage 키는 `autosaver-demo-*`.
- **확인(2026-10-15, 개발 서버)**: 대시보드·마감·캘린더·강의·자료·메일함·창고가 모두 찬 것을 한국어·영어로 확인. 화면이 받은 자원 36·37개 중 바깥 0개(`performance` 기록), 모든 화면과 막는 라우트 17개를 부른 뒤 서버 차단 기록 0건(아무 코드도 바깥으로 나가려 하지 않음). 직접 시험: `urlopen("https://lms.dgist.ac.kr")`·IP 직접 연결 모두 막힘. 끈 뒤 진짜 자료 360개·과목 18개로 돌아오고 취향 파일 세 개와 `config.json` 이 미리 떠 둔 사본과 바이트까지 같음. 빈 데이터 폴더(처음 깐 PC)에서 소개 첫 카드 → '계정 없이 체험하기' → 데이터가 찬 채 소개가 다시 시작(계정 넣기 단계는 뺌).
- 공유 웹사이트 모드(`AUTOSAVER_MULTI_USER`)에서는 쓰지 않는다(`available: false`, 줄·알약 숨김).

## 영어 화면의 학사일정 (2026-10-12)
- 학사일정 이름은 학교 데이터라 번역표에 없어 영어 화면에서도 한국어였다. `acadTitleEn` 이 낱말표(`ACAD_TERMS`)로 옮긴다: '대학 및 대학원' 머리는 빼고, '대학원' 은 'Grad:', 'YYYY학년도 N학기' 는 'Spring/Fall YYYY', 계절학기는 'Summer/Winter session YYYY', "('26.8월 졸업생)" 은 "(Aug '26 grads)", 뒤의 'D-52' 는 그대로. `tr` 안에서 표·틀 다음에 부르며, 다 옮겨 한글이 하나도 안 남을 때만 쓴다(메일 제목은 그대로). 2026 학사일정 38개 이름 모두 옮겨짐.
  - 2026-10 부터 학사일정이 공공데이터(`acad-api-*`)로 오며 '중간고사기간'·'사진변경신청기간'·'수업일수(1/4이후 ~ 2/4)' 처럼 붙여 쓴 이름이 늘어 58개 중 19개가 한국어로 남았다(1.12.26). 낱말표에 '○○기간' 짝과 '기간'→' period' 를 넣고, 수업일수 구간은 규칙('Semester: 1/4 – 2/4')으로. 58개 모두 옮겨짐(`acad_check` 실측). '진행 중' 꼬리는 ' (now)'.
- 교수·조교 꼬리표(`staffHitText`): 한 문자열('일반물리Ⅱ 3분반 교수')로 이어 붙이면 화면 번역이 마디를 못 나눠 영어 화면에서도 한국어였다. 영어 화면은 'General Physics II · Sec. 3 · Professor' 로 만든다. 받는 사람 자동완성은 LMS 영어 과목명(`alias`)으로도 찾는다(예전엔 한글 과목명만). 과목 카드 아래 한글 이름은 영어로 옮기면 제목과 같아지므로 영어 화면에서는 뺀다.
- 과목명은 예외로 LMS 공식 영어 이름을 쓴다(사용자 요청, 2026-10-13): `learnCourseNames` 가 이번 학기·마감·자료의 LMS 과목 전체 이름 '한국어 (English )_NN[ …학기 ]' 에서 짝을 익히고(`COURSE_EN`, 키는 NFKC·띄어쓰기 없앤 한국어), `tr` 이 글 조각이 과목명과 통째로 같을 때 바꾼다. 시간표에 직접 적은 '일반화학Ⅱ' 도 'General Chemistry II' 로. 과제명·메일 제목·보낸 부서·사람 이름은 그대로(CLAUDE.md 26-5).

## 폴더 정리 방식 (2026-10-14)
- 설정 키 `FOLDER_LAYOUT`: `lms`(기본, 과목 / LMS 폴더 / 파일) · `flat`(과목 / 파일). Drive·내 컴퓨터·클라우드 폴더·자료 화면의 '내 컴퓨터에 저장'·'Drive에 올리기' 모두 같은 값을 쓴다. 규칙은 `folder_layout.py`(web_ui·main·drive_uploader 공용: `safe_folder`, `lms_subfolders`, `layout_subfolders`, `normalize_layout`).
- 예전에는 내 컴퓨터만 LMS 폴더대로, Drive 는 늘 과목 폴더에 모아 두었다. 키가 없는 예전 설정은 `lms` 라 다음 동기화 때 Drive 파일이 LMS 폴더로 옮겨진다.
- 방식을 바꾸면 옮긴다(다시 받거나 올리지 않음): 내 컴퓨터·클라우드는 `_mirror_rows` 가 다른 방식 자리의 '우리가 넣은 그대로' 사본을 `os.replace`, 비게 된 하위 폴더는 `os.rmdir`(비었을 때만). 사용자가 고친 사본은 그대로 두고 새 자리에 또 만들지 않는다. Drive 는 `upload_to_drive_with_path` 가 다른 방식 자리에서 같은 이름을 찾아 `files.update(addParents/removeParents)`. 비게 된 Drive 폴더는 지우지 않는다: drive.file 권한으로는 사용자가 넣은 파일이 안 보여 비었는지 알 수 없다. 옛 자리를 볼 때는 `find_folder`(만들지 않음).
- 한 과목 안 같은 이름 파일은 받을 때 하나만 남기므로(`dedupe_downloads`) 모아 두어도 이름이 겹치지 않는다(실측: 19과목 360개 중 0).
- 화면: 설정 › 강의자료 저장 '폴더 정리 방식' 카드 두 개(`#folderLayoutRow`). '?'(`#folderLayoutHelp`)를 누르면 `renderLayoutHelp` 가 내 자료 중 LMS 폴더가 여럿인 과목(공지 첨부 먼저)으로 두 방식의 폴더 모양을 탐색기 창처럼 나란히 그린다(자료가 없으면 일반화학Ⅱ 예시). 그림을 눌러도 고른다. 바꾸면 즉시 저장하고 내 컴퓨터·클라우드는 바로 옮긴다(`runLocalSaveNow`).

## 리뷰 지적 고침 (2026-10-14)
- `calendar_sync._can_use_calendar`: 403·404 만 '못 씀'. 호출 한도·시간 초과·5xx 는 오류를 올려 이번 동기화만 실패(예전엔 False 로 보고 같은 이름 캘린더를 또 만들었다).
  Google Calendar 는 호출 한도도 403(이유 `rateLimitExceeded`·`userRateLimitExceeded`·`dailyLimitExceeded`·`quotaExceeded`, 새 형식 `RESOURCE_EXHAUSTED`)으로 돌려주므로 `_error_reasons` 로 응답 본문의 이유를 읽어 가른다(1.12.26).
- `_calendar_lock(token_path)`: 캘린더 찾기·만들기·`gcal_calendars.json` 기록을 한 번에 하나만(메일 일정·학사일정 동시 동기화 때 기록이 지워졌다). 자물쇠는 기록 파일(사용자)마다 따로라 공유 웹 모드에서 다른 사용자끼리는 기다리지 않는다(1.12.26).
- 학사일정 낱말표는 `web/i18n/en.json` 의 `_academic` 한 곳에만 둔다(app.js 하드코딩 제거, 중복 18개 정리). `i18nCompile` 이 `ACAD_TERMS` 를 채운다.

## 창 제목 줄 = 상단 바 (2026-10-14)

- `window_chrome.py`: WinForms 테두리는 그대로 두고 `WM_NCCALCSIZE` 에서 제목 줄 높이만 클라이언트로 돌려 회색 제목 줄을 없앤다(크기 조절·Aero 스냅·그림자 유지). `frameless=True` 는 이것들이 다 사라져 쓰지 않았다.
- 끌기: WebView2 `IsNonClientRegionSupportEnabled` 를 첫 페이지 전에 켜고 CSS `app-region: drag`. 두 번 누르면 최대화·화면 끝 스냅도 진짜 제목 줄처럼 된다.
- 끌기 자리는 빈 곳의 사각형 몇 개뿐(1.12.42): 상단 바 위·아래 8px 띠(`.topbar::before/::after`), 왼쪽 메뉴 맨 위 여백(`.sidebar::before`), 같은 줄 단추 묶음 사이 24px 넘는 틈(`.drag-gap`, `app.js placeDragGaps` — ResizeObserver 로 재고 값이 같으면 안 건드림). no-drag 구멍은 쓰지 않는다.
  - 틈은 상단 바 위아래 끝까지(1.12.43): 예전엔 이웃 단추 높이(40px)만큼만이었다. 줄바꿈된 다른 줄 단추가 위·아래에 있으면 그 4px 앞에서 자른다. 넓은 창의 검색칸은 520→440px(`flex: 0 1 440px`)로 줄여 오른쪽 틈을 넓혔다. 창 1307px(CSS) 대시보드: 오른쪽 틈 28×40 → 68×61px(진행 칩 없을 때 82×61), 메일함 81×40 → 81×61px. 끌기 조각 10개, 진행 칩을 띄운 채 20초 WM_NULL 0/40번 멈춤(최대 9ms).
  - 좁은 창(1.12.44, 사용자: '앱 크기를 줄이면 끌어서 옮기기가 전혀 안 된다'): CSS 1100px 이하는 검색칸이 남는 자리를 다 채워 틈이 0개라, 옮길 수 있는 곳이 아래 8px 띠와 왼쪽 위 75×4px 뿐이었다(위 8px 띠는 HTTOP). 761~1100px: 검색칸 `flex: 0 1 280px` + 오른쪽 64px 여백, 단추 묶음은 한 줄(`flex: none`), 진행 칩 150px, 960px 이하 ←/→ 빼기, 860px 이하 시계 날짜 빼기 → 검색칸 오른쪽에 늘 72px 넘는 틈. 760px 이하(휴대폰 배치): 시계를 글자 폭만(`justify-self: start`) 써서 시계 옆이 틈, `placeDragGaps` 가 줄 끝(오른쪽 이웃 없음)도 틈으로 잡아 창 단추 아래 검색칸 오른쪽(146px)이 틈. 창 단추 칸 높이(`--winctl-h`)는 단추 묶음 줄 가운데에 맞춘다(64→56px, 둘째 줄을 가리지 않게).
    - 시험 창 실측(앱과 같은 window_chrome·개발 서버, `Chrome_WidgetWin_0` 조각마다 WM_NCHITTEST): 옮기기(2) 넓이 1000px 6484→11139, 800px 4884→8412, 420px 2152→12074(px²). 조각 3~8개. 진행 칩을 띄워도 761~1100px 에서 단추가 창 단추 밑으로 밀리지 않음(전엔 761px 에서 39px). 소개 중(`body.tour-open`)에는 틈을 뺀다(말풍선 위를 누르면 창이 끌리지 않게).
  - 왜: 예전엔 상단 바·사이드바 전체를 drag 로 두고 단추마다 no-drag 를 뚫었다. WebView2 는 그 모양의 사각형 조각마다 자식 창(`Chrome_WidgetWin_0`)을 만든다(67개). 끝없는 애니메이션(진행 칩 고리 `top-ring-spin`, 메일 새로고침 회전 등)이 있으면 매 프레임 그 창들을 UI 스레드에서 `SetWindowPos`·`ShowWindow` 로 다시 놓아 창이 '응답 없음'이 됐다. 메일을 보내면 새로고침 진행 칩이 떠서 늘 걸렸다(2026-10-26 사용자 신고).
  - 실측(시험 앱, WM_NULL 3초 시간 제한으로 20초): 진행 칩만 띄워도 27/27번 멈춤 · 고리 회전을 끄면 1/30 · 끌기 기능을 끄면 0/39 · will-change 로는 그대로 27/27 · 끌기 조각 1개 0/32(최대 3ms) · 조각 15개 0/39 · 29개 26/26. 고친 뒤 4조각: 대시보드·메일함·보내기 흐름 모두 0/39(최대 59ms).
  - 확인: 띠·틈·왼쪽 위에서 실제 마우스로 끌면 창이 옮겨지고, 검색칸 위에서는 안 옮겨짐, 틈 두 번 누르면 최대화/복원.
  - 'x 약 1800px 오른쪽은 안 끌린다'(2026-10-26 오전 기록)는 다시 재 보니 없었다(같은 날 오후, 2880×1800·200%). 설치본 1.12.42·소스 1.12.42·1.12.38 모두 x 1813·1900·2000·2400·2700 에서 실제 마우스(SetCursorPos+mouse_event)로 끌면 옮겨지고 터치(InjectTouchInput)도 같다. 창 위치(120·800·1400)·폭(2000·2640)·최대화를 바꿔도 같다. 길: 끌기 조각 자식 창 `WM_NCHITTEST`=2(HTCAPTION) → `WM_NCLBUTTONDOWN` → WebView2 가 최상위 창에 `WM_SYSCOMMAND 0xF012`(SC_MOVE|HTCAPTION, 화면 좌표 그대로) → `ENTERSIZEMOVE`. 좌표가 잘리는 곳은 없다.
    - 예전 측정이 틀린 까닭(추정): 시험 앱과 설치본이 같은 자리(120,40,2760,1664)에 겹쳐 뜨고, 다른 프로세스의 `SetForegroundWindow` 는 막힐 때가 있다. 그러면 누른 것이 설치본으로 가서 설치본 창이 옮겨지고 시험 앱은 `moved=(0,0)` 로 나온다(이번에 그대로 겪음). 시험 도구는 `WindowFromPoint` 의 `GetAncestor(…, GA_ROOT)` 가 시험 창인지 먼저 확인한다.
    - 실제로 오른쪽이 잘 안 끌렸던 까닭은 배치였다: 상단 바 오른쪽은 검색칸·동기화 칩·테마 단추·창 단추로 차 있어 끌 곳이 검색칸과 동기화 칩 사이 28×40px 틈과 아래 8px 띠뿐이었다(1.12.43 에서 넓힘, 위 항목). 위 8px 띠는 WebView2 가 위쪽 크기 조절(HTTOP=12)로 돌려줘 끌면 높이가 바뀐다. 폭 760px 이하(휴대폰 배치)에 끌기 자리가 없던 것은 1.12.44 에서 고침(위 항목).
- 화면 맨 위 몇 px 는 운영체제의 위쪽 크기 조절 자리라 끌면 창 높이가 바뀐다(원래 그렇다).
- 단추: `#winControls`(Segoe Fluent 아이콘) → `GET/POST /api/window {action: minimize|maximize|close}`. 개발 서버는 `custom:false` 라 화면이 그대로다.
- 최대화 뒤 복원하면 WinForms 가 없앤 제목 줄 높이를 다시 더해 창이 29px씩 길어졌다(820→849→878). `WM_SIZE` 로 최대화 직전 크기를 기억했다가 복원 직후 크기만 되돌린다.
- 화면: `html.custom-frame` 에서 넓은 창은 검색창 가운데(Spotify), 상단 바·사이드바 바탕을 이어 붙이고 본문 왼쪽 위를 둥글게. 메일함에도 상단 바를 둔다(창 단추가 읽기 도구를 덮었다).
- **맥(2026-10-26, `mac_window.py`)**: 사용자 맥 사진에서 밝은 앱 위에 검은 기본 제목 줄과 화면 이름('과제 마감')이 따로 떴다. pywebview 가 제목 줄 뷰를 `windowBackgroundColor` 로 칠해 다크 모드에서 검은 띠가 된다. `app.py` 가 `window.events.before_show` 에 `mac_window.install` 을 걸어:
  - 제목 줄 투명·제목 숨김·`NSWindowStyleMaskFullSizeContentView`·구분선 없음, pywebview 가 칠한 바탕은 `clearColor`. `frameless` 는 크기 조절·신호등이 사라져 쓰지 않는다.
  - 신호등(닫기·최소화·확대)은 운영체제 것을 그대로 두고 상단 바 첫 줄 가운데 높이(`cy`)·왼쪽 `lx`(메일함의 72px 메뉴에선 12)로 옮긴다(Tauri `trafficLightPosition` 방식: 제목 줄 컨테이너 높이를 늘리고 단추 자리를 바꿈). 창 크기·전체 화면·키 창 알림마다 다시 놓는다.
  - 끌기: WKWebView 는 CSS `app-region` 을 모른다. `app.js macDragRegions` 가 상단 바·세로 메뉴(끌 곳)와 그 안의 단추·입력칸·덮개(안 끌 곳)를 사각형으로 재서 `POST /api/window {action:"regions"}` 로 보낸다(DOM 이 바뀔 때만, 같은 값이면 안 보냄). pywebview 의 `WebKitHost.mouseDown:` 을 `objc.classAddMethods` 로 바꿔 끼워 끌 곳이면 `performWindowDragWithEvent_`, 두 번 누르면 시스템 설정(`AppleActionOnDoubleClick`)대로. 하위 클래스로 바꾸면 pywebview 안의 `super(BrowserView.WebKitHost, self)` 가 끝없이 돈다.
  - 화면: `html.mac-frame` — 넓은 창은 세로 메뉴 내용을 상단 바 높이(`--topbar-h`, ResizeObserver 로 따라감) 아래부터, 좁은 창(≤760px)은 상단 바 왼쪽 80px 를 비운다. 메일함 좁은 창은 상단 바 첫 줄을 남긴다(숨기면 신호등이 목록 머리에 겹침). 가장 낮은 창(560px)에서 메뉴 아래가 49px 잘려 메뉴 목록이 스크롤된다.
  - 점검: 개발 PC 에 맥이 없어 `.github/workflows/mac-window.yml`(`diag/mac-window` 브랜치·수동) 이 M칩·인텔에서 `DALING_WINDOW_SELFTEST` 로 켜 신호등 자리·누른 자리 판정·가짜 클릭·스크린샷·실제 끌기(cliclick)를 잰다. 끌기 손맛·창 크기 바꿀 때 깜빡임은 맥 사용자 확인이 필요하다.

## 단추 교통정리 (2026-10-14)

- 같은 줄 단추는 36px·세로 가운데. 메일 쓰기 칸은 `70px 52px 1fr auto` 고정 열이라 받는사람·참조·제목 입력칸 시작점이 같다(예전 242·218·242px).
- 메일 목록 마우스 올림 단추(안읽음·휴지통)가 별을 덮어 별을 못 눌렀다 → 별 왼쪽에 띄운다.
- '모두 접기' 는 화면 편집 중에만, 시간표 '이미지로 가져오기' 는 아이콘만.
- 화면 전환 중 빠르게 누를 때 나던 `AbortError: Transition was skipped` 가 '문제가 생겼어요' 알림으로 뜨던 것 막음.
- 좁은 창(≤1100px) 상단 시계는 시:분·날짜만 두고, 누르면 초가 옆으로 펼쳐진다(`.show-sec`, 세부 상자는 열지 않음 — 열면 상단 바가 화면 반을 덮었다). 나우바의 덧붙임 말(고생했어요·푹 쉬어요·시험 응원 한 줄)은 뺐다.
- 메일함 검색 줄: 폴더 이름 제목은 폴더 칸을 접었거나 좁을 때만, 새로고침은 아이콘만(시각은 도움말).
- 두 번째로 켜면 창을 또 열지 않고 떠 있는 창을 앞으로(`window_chrome.focus_existing`). 예전 두 번째 창은 회색 제목 줄과 앱 창 단추가 겹쳤고, 그 단추가 첫 창을 닫았다.
- 스크롤바(2026-10-14): 기본 막대가 어두운 화면에서 밝은 회색 + 위아래 화살표로 오른쪽 끝을 차지하고 창 단추 옆까지 올라왔다. `::-webkit-scrollbar` 로 얇은 둥근 막대만(화살표·바탕 없음), 전체 화면 막대는 8px·상단 바 아래부터(`margin-top: var(--winctl-h)`). `scrollbar-width/color` 를 같이 주면 크로미움이 webkit 규칙을 무시하니 섞지 않는다.
- 실행 로그(2026-10-14): 오른쪽 308px 기둥·접힌 '실행 로그' 손잡이를 없앴다('거추장스럽다'). 로그·진행은 그대로 쌓이고 설정 맨 아래 앱 정보의 '실행 로그' 단추(`#openLogButton`)로 오른쪽에 떠 있는 창(`html.log-open`)을 연다. Esc·× 로 닫는다. 오류 알림 문구도 '설정 → 실행 로그' 로.
- 화면 전환 중 창이 가려지면 `InvalidStateError: Transition was aborted` 도 나서 오류 알림이 떴다 → AbortError 와 같이 무시.
- 메일함 목록 위 줄 합치기(2026-10-14): 제목 줄 모드에서 새로고침·검색·정렬·보기 단추를 상단 바 가운데 `#topbarMail` 로 옮기고 그 줄(`.mail-topbar.emptied`)은 숨긴다. 폴더 칸을 접으면 ☰·폴더 이름 때문에 줄을 다시 보인다. 처음 자리에 주석 노드를 남겨 다른 화면으로 가면 제자리로 돌린다(`placeMailSearch`).
- '목록' 단추가 `.icon-button` 의 grid 를 물려받아 화살표·글자가 세로로 쌓여 알약 밖으로 나왔다 → inline-flex. 또 `.custom-frame .mail-nav` 숨김이 읽기 화면의 이전·다음 메일 화살표까지 숨기고 있어 `.mail-topbar .mail-nav` 로 좁혔다.

## 남은 결함 정리 (2026-10-14)
- 메일 목록 날짜 머리(`.mail-day`, sticky): 스크롤 칸(`#mailScroll`)의 위 여백(20px, 좁은 칸 12px)만큼 아래에 붙어 그 틈으로 메일 줄이 '어제' 위에 비쳤다. 여백을 `--mail-scroll-top` 변수로 두고 머리를 `top: calc(-1 * var(--mail-scroll-top))` 로 칸 맨 위에 붙인다(실측: 머리 위치 130 → 110px = 칸 위 끝).
- 마감 수집(`lms_crawler.fetch_deadlines`): 과목별 실패(403 이 아닌 상태 코드·예외)를 `failedCourses` 에 적고 그 과목의 예전 마감을 이어 쓴다. 예전엔 기록 없이 건너뛰어 그 과목 마감이 다음 저장에서 사라졌고, 한 과목의 네트워크 예외는 `asyncio.gather` 째로 작업 전체를 멈췄다. 과목이 끝까지 받아졌을 때만 `items` 에 넣는다. 지난 학기 403 은 정상이라 실패로 치지 않는다. 내 제출 상태(users/me)를 못 받으면 로그만 남기고 마감은 둔다.
- `/api/health`(`get_health`): '+09:00'·'Z' 가 붙은 시각이 섞이면 비교·뺄셈 TypeError 로 500 이었다. 모두 현지 시각(시간대 없음)으로 맞추고 못 읽는 값은 건너뛴다.
- 자료 표 보기: 400줄 뒤를 말없이 버렸다. 이제 400줄 + '나머지 N개 더 보기'(`state.fileTableAll`).
- 맨 `except:`(setup.py 시간 입력, verify.py 공지 첨부 해석)를 `ValueError` 등으로 좁혔다(Ctrl+C 까지 삼켰다).
- 메일 분류 탭(기본 / LMS·공지) 없앰(2026-10-14): 받은 편지함은 모든 메일, LMS 만 보려면 왼쪽 '수업·LMS'. 탭이 기본으로 LMS 메일을 숨기던 거르기도 뺐다(`renderEmails`).
- 메일 작업 단추 한 곳으로(2026-10-14): 줄마다 뜨던 읽음/휴지통 단추(휴지통 폴더의 되돌리기만 남김)와 아래 떠오르는 작업 막대를 없애고, 목록 머리줄(`.mail-header-row`, 위에 붙음)이 메일을 고르면 `.picking` 으로 바뀌어 'n통 선택 · 읽음 안읽음 | 답장 전달 | 삭제 · ×' 를 보인다. 평소엔 '전체 · n통 · 안읽음 n · 모두 읽음'.
- 메일함 둥글게(2026-10-14): 메일 줄은 14px 둥근 카드(6px 간격, 아래 선 없음), 날짜 머리는 흰 사각 띠 대신 바탕색 위 글씨, 목록 머리줄은 둥근 판. 다른 화면 카드와 같은 모양.
- 메일 목록 머리줄·날짜 머리 겹침(2026-10-14): 위에 붙는 기준이 스크롤 칸 안쪽 여백(20px) 안이라, 머리줄(top:0)은 20px 아래에 붙어 그 틈으로 메일이 지나가고 날짜 머리(top:-20px)는 그 위로 삐져나왔다. 머리줄 top:-여백, 바탕색 테(box-shadow 8px), 날짜 머리 top: 머리줄 높이(50px)-여백. 스크롤 600px 에서 머리줄 0–44, 날짜 머리 50–86 실측.
- 대시보드 '다가오는 일정'(2026-10-14): LMS 캘린더를 그대로 옮겨 '다가오는 마감' 과 같은 줄이 두 번 떴다. 이제 `upcomingEventItems()` 가 calendarItems() 의 세미나·학교 행사·학사일정·내 일정과, LMS 일정 중 과제 이름과 겹치지 않는 것(시험 등)만 7일 안에서 6개 고른다(여러 날 행사는 첫날만). 종류 꼬리표, 누르면 메일 또는 캘린더.
- 스크롤은 본문에서만(2026-10-14): 제목 줄 모드에서 html/body 를 고정(overflow:hidden)하고 `.workspace` 만 스크롤한다. 문서 전체 스크롤이라 막대 자리가 창 단추 옆부터 창 끝까지 차지했다. 메일함은 grid 줄을 칸 높이에 묶어(`grid-template-rows:minmax(0,1fr)`) 두 겹 스크롤을 막고, 설정 판(fixed)은 `--topbar-h`(fitHeight 가 잼) 아래부터.
- 학사일정 거르기(2026-10-14): `academicShown()` 하나로 달력 막대·달력 칩·대시보드 '다가오는 일정' 이 같은 목록을 쓴다. 행정 기간(사진변경신청·학적기본정정·강의계획서작성·성적입력·미완성적처리)과 '수업일수(… ~ …)' 구간 막대는 빼고 하루짜리 'n/4선' 은 남긴다. 대학·대학원 같은 이름·날짜 중복, 같은 날짜·같은 주제(시험·강의평가·수강변경·수강신청·공동AP·수강포기·성적확인·졸업신청·복학)는 이름이 짧은 쪽 하나만. 158 → 53개.
- 그래파이트 테마(2026-10-14): 사용자가 시안 넷 중 고른 '그래파이트 바탕 + 더스티 블루 포인트'(글꼴은 그대로). `[data-theme="graphite"]`(#f2f2f7 바탕·흰 카드·accent #4f6f9a)와 `graphite-dark`(#000 바탕·#1c1c1e 카드·accent #6e8cb8, 글씨용 accent-strong #a9bedc). '자동'은 이 둘을 따른다. 예전 '기본'(크림+코랄)·'다크' 는 요청대로 그대로 고를 수 있다. 서버 `UI_THEMES` 에도 두 키를 넣어야 저장된다. 그래파이트 다크의 메일 종이는 #f5f5f7.
- 테마 줄이기(2026-10-15): 고르는 목록은 자동·기본·다크 셋만(자동 = 기본↔다크). 화이트·남색·그래파이트는 목록에서 빼고 색 정의는 남겼다. 저장된 값이 빠진 테마면 applyTheme 이 자동으로 돌린다.
- 보낸 메일 받는 사람(2026-10-15): 보낸·임시보관 메일은 읽기 화면 머리에 '받는 사람 · 이름' 과 주소, 목록 줄에 '→ 이름'. 메일 자료의 toName/toEmail 을 쓴다(첫 받는 사람).

## 켜는 속도 (2026-10-15)
- **가장 큰 원인(9초)**: `app.start_server` 가 이미 켜진 Daling 을 찾으려 후보 포트 21개(8765~8785)에 connect 했는데, Windows 는 닫힌 localhost 포트 연결을 거절하지 않고 제한 시간 0.4s 까지 기다린다(WSAEWOULDBLOCK). 21×0.4 ≈ 8.4s 가 켤 때마다 들었다(boot_times.json: serverReady 9.0s). `port_in_use` 를 '직접 잡아 보기'(SO_EXCLUSIVEADDRUSE bind)로 바꿔 21개 1.7ms. 쓰는 중인 포트만 `/healthz` 로 Daling 인지 본다.
- 측정(새로 켠 서버): 첫 화면이 기다리는 API 중 `/api/config` 가 처음에만 1.0s — Drive 맨 위 폴더 이름 하나 읽으려 `drive_uploader` 를 불러와 google.auth 까지 올라왔다. 이름은 `folder_layout.DRIVE_ROOT_FOLDER` 로 옮겨 9ms.
- 남은 첫 호출 비용(`/api/status` 445ms: 시간표 모듈 0.21s·구글 토큰 확인 0.19s, course-staff 130ms, emails 80ms)은 `app._prewarm_first_screen` 이 서버를 띄우자마자 뒤에서 미리 해 둔다(창=WebView2 가 뜨는 1~2초 동안). 실측 676ms → 50ms.
- 켤 때 상단 버전 글자용 GitHub 확인(`/api/update/check`)은 3초 뒤로 미뤘다(첫 화면 요청과 연결을 다투지 않게).
- 기록: 화면이 첫 새로고침을 마치면 `/api/boot-done` → `boot_times.json`(최근 30번: serverReady·pageRequested·firstScreen, 실행 파일 생성 시각 기준 초). '느리다' 는 신고가 오면 이 기록부터 본다.

## AI 도우미 (AI CLI: Claude · Gemini · Codex, 2026-10-15)

- `ai_cli.py`: 이 PC 에 로그인해 둔 CLI 를 그대로 부른다(앱은 키를 받지 않는다). 질문은 **표준입력**으로(배치 파일 인자 해석 위험 회피), 빈 임시 폴더에서, 창 없이, 180초 제한. claude `-p --disallowedTools …`, gemini `-p "Answer the request above."`, codex `exec --skip-git-repo-check --ephemeral -s read-only -o <파일> -`.
- 실측: 한 줄 질문 claude 9초·codex 10초, 말로 찾기 13~15초(목록 799개), 초안 15초, codex 번역 11초. gemini 는 로그인 전이면 'Please set an Auth method' → '로그인 필요' 로 알린다.
- 설정 'AI 도우미'(`#stAi`): 쓸 AI(자동·Claude·Gemini·Codex, 설치 여부 표시) → `ai_profile.json`. 내 정보 칸은 2026-10-19 '메일에 쓰는 내 정보'(`#stMe`)로 옮겼다(AI 를 꺼도 메일 쓰기 흐름이 쓴다). 저장은 보낸 키만 바꾼다(`save_profile` 이 기존 값과 합침) — 예전처럼 한 카드가 다른 카드의 값을 비우지 않게.
- 번역: `/api/mail/translate` 가 고른 AI CLI 를 먼저, 안 되면 예전 길(Ollama → Gemini 키).
- 말로 찾기: 통합 검색 팝업 맨 아래 'AI 에게 물어보기'. `buildSearchResults(q, {all:true})` 로 모든 후보를 모아 순번 id 로 보내고, 돌아온 id 만 원래 결과로 연다(모델이 지어낸 id 는 버려짐). `keepOpen` 항목은 팝업을 닫지 않는다.
- 메일 초안: 쓰기 화면 'AI 초안' → 한 줄 요청. 받는 사람 주소로 `state.coursePeople` 에서 과목·분반·역할(내 수업 먼저)을 찾아 함께 보낸다. 이름이 로마자인 교수면 영어로 쓴다. 2026-10-19 부터 내 정보는 `mail_me`(LMS 이름·학번, 영문 이름·학년·영문 소속)로, 프롬프트에 메일 꼴(아래 '메일 쓰기 흐름'과 같은 첫머리·끝)·상황별로 넣을 것·21일 달력을 넣는다. 'AI 없이 내 소개 넣기' 단추는 흐름(Tab)이 대신해 뺐다.
- 체험 모드에서는 `/api/ai/search`·`/api/ai/draft` 를 막는다. 자동 실행은 없다(누를 때만 바깥으로 나감). 상태 확인은 첫 화면 4초 뒤.
- AI 모델 고르기·받는 사람 추천(2026-10-15 '밀착형 AI'): 메일 쓰기 단추에 'AI 초안' 대신 지금 모델 이름(Opus 5.5, GPT-6-Astra …). 초안 칸의 고르기에서 Claude(opus·sonnet·fable·haiku 별칭)·Gemini(2.5 Pro 등)·Codex(`~/.codex/models_cache.json` 의 visibility=list, 기본은 config.toml model) 모델을 바꾼다 → `ai_profile.json` 의 provider·model. 모델 이름은 `_SAFE_MODEL` 글자만(배치 파일 인자). 안 골랐으면 화면에 보이는 그 CLI 기본 모델을 서버도 똑같이 쓴다.
- 초안이 받는 사람(to)·참조(cc)도 고른다. 후보는 내가 듣는 과목의 교수·조교 중 주소를 아는 사람(`aiDraftCandidates`, 최대 80명: 주소·이름·역할·과목·분반)이고, 후보 밖 주소는 버린다. 받는 사람 칸이 비면 바로 채우고, 나머지는 칩(누르면 넣기/빼기). 제목은 제목 칸에 바로. 실측: 받는 사람 빈칸 + '일반물리 교수님께 결석 양해' → 3분반 교수 자동, 조교 참조 추천, Opus 5.5 14.8초.
- AI 도우미 실험실 스위치(2026-10-15): 설정 'AI 도우미' 카드 머리의 '실험실' 표시 옆 스위치(`#aiEnabled`) → `ai_profile.json` 의 `enabled`("1"/빈 값, 처음엔 꺼짐). 끄면 메일 쓰기의 모델 단추·초안 칸, 검색의 'AI 에게 물어보기', 카드 상세(`#aiBody`)가 숨고, 서버도 `/api/ai/search`·`/api/ai/draft` 를 거절하며 메일 번역은 AI CLI 를 건너뛰고 예전 길(Ollama → Gemini 키)로 간다.

## 메일 쓰기 흐름: 회색 글씨 자동완성 (2026-10-19)

사용자: 'AI 초안'을 채팅처럼 통째로 받아 붙이는 것보다, 교수님 메일의 처음(인사·자기소개)과 끝(감사·서명)은 늘 비슷하니
그 흐름이 회색 글씨로 보이고 클릭하거나 Tab 을 치면 바로 써지게. AI 는 가운데 용건 정리에만. 외국인 교수님이면 영어,
한국인 교수님이면 한국어. 이름·학번은 LMS 에서 받아 자동으로.

- 내 정보: `lms_crawler.fetch_my_profile` 가 교수·조교 목록과 같은 로그인에서(마감 확인 1시간·자료 동기화 끝)
  `GET /learn/api/public/v1/users/me?fields=userName,studentId,name,contact.email,job.department` → `lms_profile.json`.
  실측: studentId 에 9자리 학번, name.given 한글 이름(family '.'), job.department '융복합대학'. 전화번호는 fields 로 아예 안 받는다.
  `web_ui.mail_me` = 직접 적은 값(`ai_profile.json`) > LMS > 조직도(학교 메일 주소로 찾음, 소속 '기초학부(학생)'). 영문 이름은 LMS 에
  없어 `mail_flow.romanize_name` 이 추정(이름은 음절별 로마자, 성은 흔한 표기: 홍길동 → Gildong Hong). 학년은 학번 앞 네 자리
  (3월 전이면 지난 학년도). 영문 소속은 기초학부 → School of Undergraduate Studies.
- 받는 사람(`mail_flow.recipient`): 받는 사람 칸 첫 주소 → 이번 학기 교수·조교(`get_course_staff`)에서 역할·과목·분반, 학수번호는
  `timetable.json` 의 `courseNo`(과목명 또는 교수 이름이 같은 칸), 영어 과목명은 LMS 과목 이름의 괄호 속(General PhysicsⅡ → General
  Physics II). 과목에 없으면 조직도 교원/직원. **외국인 판별 = 이름에 한글이 없고 로마자가 있음**(실측: 교원 247명 중 11명이 로마자,
  예 'Carlos Scarinci', 'DEVECIOGLU DENIZ OLGU'). 영어 호칭은 성: 'Scarinci', 대문자로 시작하는 학교 명부 꼴은 앞 단어
  ('Devecioglu'), 한국인 교수님께 영어로 쓰면 'Professor Kim'.
- 글 조각(`mail_flow.segments`, 서버에서 만든다 — app.js 에 한국어 메일 글을 두면 영어 화면 번역표가 그것까지 번역하려 든다):
  greeting → intro → leadin → (내 용건) → closing → signoff. 영어 꼴은 사용자가 실제로 보낸 메일 그대로
  (Dear Professor … / I hope this email finds you well. My name is … (Student ID: …), a first-year student in the School of
  Undergraduate Studies taking your … class (BS101, Section 04). / I am writing to … / Thank you for your time and understanding. /
  Sincerely, 이름·소속·Student ID). 한국어: 안녕하세요, ○○○ 교수님. / 다변수 미적분학(BS101) 04분반을 수강 중인 기초학부 1학년
  ○○○(학번)입니다. / 다름이 아니라 … / 바쁘신 와중에 메일 읽어 주셔서 감사합니다. / ○○○ 드림. 조교면 '조교님'·'Best regards,'.
  모르는 값은 문장에서 빼고 만든다(빈 [ ] 를 남기지 않음).
- 화면(app.js '메일 쓰기 흐름'): 본문 위 한 줄(`#mailFlowBar`: 받는 사람·과목, 한국어/English, 'Tab 회색 글씨 넣기', AI 켜졌으면
  '용건 다듬기'). 회색 글씨는 본문 안 `<span data-ghost contenteditable=false>` 로, **빈 줄에서만** 뜬다. 이미 쓴 줄을 단계별
  정규식(서버가 `match` 로 준다)으로 앞에서부터 읽어 다음 단계를 고른다 — 앞으로만 간다(용건 줄이 '…입니다.' 로 끝나도 자기소개로
  되돌리지 않음), 자기소개 줄은 내 이름·학번으로도 알아본다, '-----'·'>' 로 시작하는 원본 메일 줄에서 멈춘다(답장).
  Tab·클릭 = 넣기(`execCommand('insertText')` 한 번 — \n 은 문단이 되고 Ctrl+Z 한 번에 통째로 빠진다, 실측), Esc = 다시 칠 때까지 숨기기,
  다른 키 = 떼고 그대로 입력. 클릭 직후 0.1초 안에 Tab 을 쳐도 그 자리에서 계산해 받는다(안 그러면 포커스가 옆 칸으로 갔다, 실측).
  한글 조합 중(keyCode 229·compositionstart)엔 뗀다. 저장·보내기·HTML 전환은 `richHtml()` 이 `[data-ghost]` 를 한 번 더 거른다.
- 빈 줄 판정: 커서 앞·뒤 범위를 복제해 화면 밖 상자(`.flow-measure`, opacity 0 — visibility:hidden 이면 innerText 가 글을 빼먹는다)
  에서 innerText 로 읽는다. 끝에 붙은 빈 `<div><br></div>` 는 innerText 에서 줄바꿈을 안 만들어, 복제본 끝(뒤 범위는 앞)에
  표시 글자(U+2063)를 넣고 읽는다.
- 용건 다듬기(`ai_cli.polish`, `/api/ai/polish`): 고른 글, 없으면 자기소개 다음('I am writing to'·'다름이 아니라' 줄 포함)부터
  감사 인사 앞까지를 보낸다(문단 안쪽만 골라 감사 인사 앞 빈 줄을 지킨다). 프롬프트: 용건만, 인사·소개·서명 금지, 메모의 사실 그대로,
  모르면 [ ], 21일 달력(요일), 상황별로 넣을 것(결석·연장·성적 문의·질문·면담·자료). 결과는 한 번에 바꿔 Ctrl+Z 한 번이면 메모로 돌아간다.
  실측(Opus 5.5): 한국어 메모 → 영어 3문단 9.5초, 한국어 3문단 11.6초 — 사용자가 직접 쓴 메일과 거의 같은 내용·순서.
- 설정 '메일에 쓰는 내 정보'(`#stMe`): 이름·영문 이름·학번·소속(비우면 흐린 글씨로 LMS·조직도 값), '메일 쓸 때 인사·서명 미리 보이기'
  (`ai_profile.json` 의 `flow`="off" 면 끔).
- 시험 주의: 받는 사람이 찬 메일 쓰기를 열면 기존 자동 저장이 학교 메일 임시 보관함에 저장본을 만든다. 개발 서버에서 시험할 땐 그 탭에서
  `window.saveDraftToServer = async () => {}` 로 막고, 생긴 것은 `/api/mail/discard-draft`(지운 표시만, EXPUNGE 없음)로 치운다.
- 커서 뒤도 본다(1.12.30): 앞쪽 줄만 보고 다음 단계를 고르다 보니, 이미 쓴 'Thank you …' 위 빈 줄에 같은 문장을 또 띄웠다(사용자 화면).
  이제 커서 뒤 내 글(원본 메일 인용 전까지)에 고른 단계와 같거나 앞선 단계(용건 포함)의 줄이 있으면 띄우지 않는다.

### /ai: 그 자리에서 AI 가 이어 쓰기 (1.12.30)
사용자: 본문도 자동완성 느낌으로 — '/ai' 로 시작해 하고 싶은 말을 쓰다가 Ctrl+Enter 를 치면 AI 가 그 자리에 자연스럽게 이어 붙이고,
글이 한 글자씩 타자 치듯 나오게.
- 커서 앞에서 가장 가까운 '/ai'(줄 처음이나 띄어쓰기 뒤)부터 커서까지가 지시(`findAiPrompt`, 여러 줄 가능). 그 줄 끝에 흐린 안내
  ('Ctrl+Enter — AI 가 이어 써요', AI 가 꺼져 있으면 '설정 › 실험실에서 켜면…')가 `[data-ghost="hint"]` 로 뜬다(흐름 미리보기를 꺼도).
  Ctrl+Enter, 안내에서 Tab·클릭 = 실행.
- 실행: 지시 글을 지우고(되돌리기 한 단계) 그 자리에 `[data-ghost="ai"]` 칸('… 가 쓰는 중…', 점이 움직임)을 둔다 →
  `/api/ai/continue {instruction, before(커서 앞 6000자), after(뒤 3000자), lang, flow}` → `ai_cli.continue_text`.
  프롬프트: 커서 자리 글만, 앞 글에 바로 이어지게(문장 중간이면 그 문장을 끝맺음), 뒤에 있는 감사·서명·인사는 다시 쓰지 않기,
  메일 언어로(지시가 한국어여도), 사실만·모르면 [ ], 달력·상황별 안내. 서버가 앞 줄 되풀이·뒤에 이미 있는 감사·서명을 한 번 더 뗀다.
- 받은 글은 그 칸에 한 글자씩(짧으면 22ms/자, 길어도 4초 안) 흘리고, 끝나면 `execCommand('insertText')` 한 번으로 진짜 글이 된다
  → Ctrl+Z 한 번에 AI 글이 빠지고, 한 번 더 누르면 지운 '/ai …' 지시가 돌아온다(실측). 흘리는 중 아무 키·클릭 = 바로 끝까지,
  기다리는 중 Esc = 취소(지시 글 되돌림). 창이 뒤에 있으면 rAF 가 멈춰 글이 반쯤에서 섰다 → 시간이 지나면 마저 넣는 타이머를 함께 건다.
  CLI 는 답을 한 번에 줘서 진짜 실시간 흘림은 아니다(기다리는 동안 '쓰는 중').
- 실측(Opus 5.5): 'I am writing to ' 뒤 한국어 지시 → 'inform you that I will be unable to attend class tomorrow, Tuesday, October 20, …'
  두 문단 9.5초. 한국어 메일은 같은 날 41초가 걸린 적도 있다(CLI 응답 편차).
- 실험실 스위치를 따르고(`/api/ai/continue` 도 꺼져 있으면 거절), 체험 모드에서는 막는다.

## /ai 명령과 모델 고르기 (2026-10-20)

- 실험실 켜기 스위치와 설정의 'AI 도우미' 카드를 없앴다. AI CLI(Claude·Gemini·Codex)가 하나라도 있으면 메일 쓰기 창의 모델 단추·`/ai` 가 그대로 된다. AI 로 보내는 건 여전히 사용자가 `/ai`·단추를 눌렀을 때만이다(번역은 예전 저장값을 따른다).
- 명령: `/ai [할 말]`, `/ai with opus5.5 [할 말]`. `[ ]` 없이 `/ai 할 말` 도 된다. `with` 뒤 이름은 모델 표시 이름에서 띄어쓰기를 뺀 소문자(opus5.5·sonnet5.5·gemini2.5pro·gpt-6-astra…)나 CLI 모델 id, 앞부분만 쳐도 된다(`parseAiCommand`, `resolveAiModel`).
- `/ai with ` 를 치면 커서 아래에 설치된 모델 목록(`.ai-model-pop`)이 뜨고 ↑↓·Tab·클릭으로 고르면 `모델 []` 이 들어가 `[ ]` 안에 커서가 선다. 실행은 Ctrl+Enter, 커서 뒤의 `]` 까지 지시 글로 지운다.
- with 로 고른 모델은 그 한 번만: `/api/ai/continue` 에 provider·model 을 실어 보내고, 서버는 아는 CLI·안전한 글자일 때만 받는다. 평소 모델은 쓰기 창의 모델 단추(`#aiModelSelect`)에서 바꾼다. 실측: `with haiku` 요청이 Haiku 4.5 로 13초.
- AI 모델 메뉴·로고(2026-10-21): 채팅식 'AI 초안' 칸은 쓰지 않는다(늘 숨김). 쓰기 창 위 모델 단추(`#aiDraftToggle`, [로고] 모델 ▾) → `.ai-menu` 두 칸: 오른쪽 회사(ChatGPT·Gemini·Claude, 설치 초록 점·지금 ✓, 마우스를 올리면 바뀜) · 왼쪽 세부 모델(기본(CLI 설정)·설명·꼬리표 최고 성능/추천/빠름·직접 입력). 고르면 `ai_profile.json` 에 저장. 로고는 Simple Icons(CC0) 경로를 `AI_LOGO_PATHS` 에 넣고(`web/img/ai/` 원본), AI 가 쓰는 동안 Claude 는 돌며 숨 쉬고(aiClaudeSpin) Gemini 반짝·OpenAI 회전. Gemini 그라데이션은 `#aiGeminiGrad`.

## 메일 쓰기 흐름 문장 다시 쓰기 (2026-10-21)

- 한국어: 대학 공식 메일 순서로 — `○○○ 교수님께,` / `안녕하십니까.` → `저는 [과목(번호) 분반]을 수강하고 있는 [소속 학년 이름](학번 …)입니다.` → `다름이 아니라,` → `바쁘신 와중에 읽어 주셔서 감사합니다.` / `늘 건강하시고 좋은 하루 보내십시오.` → `[소속 학년 이름] 올림` / `학번 …`. 조교는 `안녕하세요`·`드림`, 부서는 `○○팀 담당자님께,`. 을/를은 과목 이름 끝 받침으로(`_eul`). 예전 꼴은 '안녕하세요, ○○ 교수님.' 으로 시작하고 '드림' 이었다.
- 영어: 부서는 `office_en` 으로 영어 부서 이름(`Dear DGIST Scholarship Office,`, `Dear DGIST Counseling and Career Development Team,`), 한국인 직원·조교는 로마자 이름(`Dear Minsu Kim,`), 모르는 부서는 `Dear Sir or Madam,`. 예전엔 'Dear DGIST상담경력개발팀,' 처럼 한글이 그대로 들어갔다. 부서 낱말표는 `OFFICE_CORE_EN`·`OFFICE_SUFFIX_EN`, 모르는 낱말이 섞이면 지어내지 않는다.
- 학과·전공 주소와 사람 이름 가리기(2026-10-21): '인공지능전공' 이 사람 이름으로 잡혀 'Dear Gongjineungjeongong In,' 이 나왔다. 이제 로마자 이름은 `looks_like_person`(띄어쓰기 없는 한글 2~4자, 흔한 성으로 시작, 부서·학과 아님)일 때만. 학과·전공·학부 주소는 `DEPT_FIELD_EN` 으로 `Dear DGIST Department of Artificial Intelligence,`(뇌과학과·에너지공학과는 '과', 화학물리학과는 '학과' 를 떼고 찾는다), 표에 없으면 `Dear Sir or Madam,`. 한국어는 `인공지능전공 담당자님께,`.

## 앱 잠금 (2026-10-27, 1.12.50)

사용자: '로그인 없이도 얻을 수 있는 정보가 앱에 너무 많다. 카카오톡처럼 네 자리 비밀번호로 잠그고, 설정에서 켜고 끌 수 있게.'
**선택 기능**이다. 설정 › 앱 잠금(`#stLock`)에서 켠다(새 비밀번호 두 번). 끄기·바꾸기는 지금 비밀번호를 먼저 묻는다.

- **저장**: `app_lock.json` 에 PBKDF2-HMAC-SHA256(20만 번, 소금 16바이트) 해시만 둔다. `config.json` 이 아니라 '설정 내보내기' 파일에 섞이지 않는다. 파일이 없으면 꺼진 것.
- **잠기는 때**: 앱을 켤 때(서버가 처음 상태를 물을 때 파일을 보고 잠근다), 마우스·키보드를 정한 시간 동안 안 썼을 때(`idleMinutes`, 15초마다와 창으로 돌아올 때 확인), '지금 잠그기'·Ctrl+L(맥 ⌘L).
- **서버가 막는다**: 화면만 덮으면 같은 PC 브라우저로 `http://127.0.0.1:<포트>/api/emails` 를 열어 볼 수 있으므로, 잠긴 동안 `/api/*` 는 423 `{locked:true}` 로 거절한다. 통과: `LOCK_OPEN_GET`(`/api/lock`·`/api/ui-prefs`·`/api/window`), `LOCK_OPEN_POST`(`/api/window`), `/api/lock/unlock|reset|lock`. 큰 첨부 올리기도 막는다. 잠긴 동안 `/` 는 `<html data-locked="1">` 과 테마를 미리 칠하는 한 줄을 넣어 보낸다 — 첫 화면이 번쩍이지 않고 잠금 판부터 뜬다.
- **화면**(`app.js` 앱 잠금): `api()` 는 잠긴 동안 열린 경로가 아니면 풀릴 때까지 기다렸다 보낸다(같은 GET 은 하나로). 423 을 받으면 판을 띄우고 기다린다. 잠긴 동안 `pollLight`·`presence` 는 쉰다. 판은 `<dialog>.showModal` 이라 열려 있던 다른 창 위에 오고, Esc 를 거듭 눌러 브라우저가 닫아도(close watcher, `cancelable=false`) 바로 다시 띄운다. 늦게 온 `close` 가 그새 누른 숫자를 지우지 않게 이미 열려 있으면 그대로 둔다. Windows 창 단추(`#winControls`)는 그동안 판 안으로 옮겨 최소화·닫기를 그대로 쓴다. 숫자는 화면 숫자판·키보드 숫자·Backspace.
- **틀리면**: 다섯 번마다 30초부터 두 배씩(최대 15분) 막는다. 서버가 `failures`·`waitUntil` 로 세므로 앱을 다시 켜도 이어진다. 막힌 동안은 맞는 숫자도 거절하고 판에 남은 시간을 보인다. 남은 기회가 두 번 이하면 '맞지 않아요 · N번 더 틀리면 잠시 막혀요'.
- **잊었을 때**: '잊었어요' → 앱에 이미 저장된 학교 메일(또는 LMS) 비밀번호를 넣으면 잠금이 꺼진다(`/api/lock/reset`, 틀린 횟수는 같이 센다). 저장된 비밀번호가 없으면 여기서 풀 수 없다고만 알린다(그때는 데이터 폴더의 `app_lock.json` 을 지우면 꺼진다). 상태 확인(`canReset`)은 저장 여부만 보고 풀지 않는다 — 맥에서 키체인 창이 뜨지 않게.
- **알림**: 잠긴 동안 마감·새 자료·공지 알림은 제목만 보이고 내용은 'Daling 잠금을 풀면 볼 수 있어요.' (`app.notify(..., private=True)`).
- **켜는 시간 기록**: 잠금을 켜 두면 `boot_times.json` 의 `firstScreen` 에 비밀번호를 누르는 시간이 들어가므로 `unlocked`(푼 시각)를 함께 적는다.
- **한계**: 앱 화면과 로컬 API 만 막는다. 데이터 폴더의 파일(`emails.json`, 받은 자료)은 그대로라 컴퓨터 계정 잠금을 대신하지 않는다. 여러 사람 모드(`MULTI_USER_MODE`)에는 없다(`available:false`, 카드 숨김). 체험 모드에서도 진짜 데이터 폴더의 `app_lock.json` 을 본다(잠금은 앱에 거는 것).
- **점검**: `smoke_test.py` '앱 잠금' — 켜기(2580) → 잠그기 → `/api/emails` 423·`/api/ui-prefs` 200·`/` 에 `data-locked` → 틀린 숫자(남은 기회 4) → 풀기 → 끄기(파일 지워짐). `/api/lock` 은 GET 전수 점검(`SWEEP_GET`)에도 넣었다.
- **실측**(개발 서버, 따로 둔 데이터 폴더): 잠긴 채 다시 열면 요청은 `/api/lock`·`ui-prefs`·`window` 뿐이고, 풀자마자 첫 화면 요청들이 이어 가고 `boot-done` 까지 간다. 1분 자동 잠금, 다섯 번 틀리면 30초 막힘(맞는 숫자도 거절), Esc 연타에도 판 유지, 켜기·바꾸기·끄기, 영어 화면, 높이 560px·폭 375px 에서 숫자판이 잘리지 않음.
