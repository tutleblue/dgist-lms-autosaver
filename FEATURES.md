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
| 조직도(주소록) | 사용자가 넣은 파일 | `directory.py` |
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
- 색: 과제 마감 빨강(`cal-deadline`), 학교 행사 노랑(`cal-school`, `schoolEvent`), 관심 세미나 보라(`cal-event`), 제출 완료 초록, 내 일정 파랑, 학사일정 회색 띠. 칸 이름은 `app.js eventShortTitle` 이 날짜·연도·"개최 안내"를 떼고 영어 제목이면 [학과] 꼬리표로 만든다. 오른쪽 상세는 짧은 이름 + 메일 원래 제목 전체(`it.full`)를 줄바꿈해 보여 준다
- 상세에서 메일 일정을 누르면 메일함으로 가지 않고 그 칸이 펼쳐지며(`toggleDayMail`, `.day-item.open`) 본문 글(`mailPlainText`, 주소는 `linkifyText` → `/api/mail/open-link`)을 보여 준다. 읽는 동안 패널이 넓어짐(`.calendar-stage.reading`). '메일함에서 열기'는 보조 버튼
- 학사일정: 대학/대학원 구분, "학부만" 필터
- 내 일정 추가·수정·삭제 (`my_events.json`), 장소는 OpenStreetMap 검색 (`/api/place-search`)
- 구글 캘린더로 학사일정 올리기 (`/api/gcal/sync-academic`)

### 3.5 강의 (`courses`)

- 수강 과목 카드 (자료가 없는 과목도 `courses_state.json`에서 깔아 둠)
- 과목마다 학년·학기, 학점(개설강좌에서 채움, `_fill_missing_credits`), 강의계획서 바로가기
- 편집 모드로 과목 숨기기/복원
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
  - 핀의 기준점은 점 한가운데(`.wm-pin`은 점 크기, 이름표는 절대 위치). 덩어리 가운데를 맞추면 점이 이름표 폭 절반만큼 밀린다.
  - 대학 사진: `tools/fetch_uni_photos.py` (위키미디어, 작성자·라이선스 기록). 엉뚱한 사진이 골라진 곳은 `SKIP`.
- 셔틀버스 시간표 (`/api/shuttle`): 출근·퇴근·원내순환·원외순환·주말순환. 하루 캐시, 못 받으면 예전 시간표라고 표시. 해석은 `shuttle._routes_from_table`이 표 머리줄의 칸 이름을 읽어 정함

### 3.9 설정 (`settings`)

사용자가 바꿀 일이 있는 것만 둔다. 한 단짜리 카드(`.st-card`, 머리에 색 타일 + 한 줄 설명)를 위에서 아래로 읽는다.
긴 설명은 `?`(`.hint`, `data-hint`)에 숨긴다. 마우스를 올리거나 누르면 보이고, 다른 곳을 누르거나 Esc 로 닫힌다.
개발자용 칸(다운로드 경로·LMS 주소·로그인 주소)은 화면에서 뺐다. 폼에 없으면 `write_config`가 저장된 값을 그대로 둔다.

| 카드 | 내용 |
|---|---|
| 연결된 계정 | LMS·학교 메일·Google 줄마다 로고와 상태 알약(`renderAccountPills`, `renderGoogleSection`). 비밀번호는 DPAPI 암호화, 바꿀 때만 입력 |
| 강의자료 저장 | 저장 위치 카드 두 개: 구글 드라이브(`AUTO_DRIVE_UPLOAD`, 구글 미연결이면 '로그인 필요'), 내 컴퓨터(스위치 + 이번 학기/모든 과목 → `AUTO_LOCAL_SAVE`, 폴더 바꾸기, 지금 맞추기). `renderSaveDestinations` |
| └ 다른 클라우드 | OneDrive·Dropbox·iCloud Drive·네이버 MYBOX. 로그인 없이 PC 동기화 폴더 안 `붕어빵 강의자료\<과목>`에 넣는다 (`detect_cloud_roots`, `cloud_targets`, 설정 `CLOUD_SAVE`). 못 찾으면 '폴더 고르기'(`/api/pick-folder`)로 `path` 지정. '넣을 과목'(`SAVE_SCOPE`)과 '지금 맞추기'는 내 컴퓨터·클라우드 공통. 복사는 `autosave_local` → 위치마다 `_mirror_rows` (필기한 파일 보호 규칙 동일). 과목 아래는 LMS 하위 폴더(`lms_subfolders`) 그대로, 1.11.3까지 펼쳐 넣은 사본은 옮겨 놓는다 |
| └ 차지하는 공간 | 같은 카드 아래. 앱(프로그램 + LMS 로그인용 브라우저 + 메일·설정 데이터) / 강의자료 / 내 컴퓨터 사본을 한 막대로(`/api/storage`의 `app`·`localSave`). 접힌 '강의자료 정리하기'에서 학기·과목별 삭제(`/api/storage/cleanup`, 앱 보관함에서만) |
| 자동으로 가져오기 | 메일(기본 5분)·과제 마감(60분)·강의자료(180분) 주기, 하루 한 번 전체 확인 시각(`SCHEDULE_TIME`) |
| 구글 캘린더 | 머리의 스위치로 메일 일정 자동 등록, 캘린더 이름, 지금 넣기, 학사일정도 넣기 |
| 관심 있는 메일 | 관심 분야·활동 태그, 직접 적기, 끝난 행사 메일 숨기기 |
| 추가 기능 켜기 (접힘) | Gemini 키(번역·요약·시간표 사진), DGIST 공공데이터 키 |
| 앱 | 버전, 업데이트 내용, 전체 다시 확인, 설정 내보내기/불러오기(비밀번호 포함 여부) |

앱 크기에서 브라우저는 `chromium_headless_shell-*` 만 센다. 같은 `ms-playwright` 폴더의 일반 `chromium-*`(약 430MB)은 개발용이라 앱 몫이 아니다.
프로그램·브라우저 크기는 10분 동안 기억한다(`_FOOTPRINT_CACHE`). 프로그램 크기는 EXE 로 돌 때만 나온다.

GitHub 업데이트 확인 버튼은 뺐다. 설치형은 새 설치 파일로 업데이트하고, 저장소 버전이 뒤처져 있어 "최신"이라는 오답을 줬다(4.9절).

---

## 4. 기능별 동작 상세

### 4.1 LMS 자료 동기화 (`lms_crawler.py`)

1. `ensure_browser()`로 Chromium headless shell 확보 (`%LOCALAPPDATA%\ms-playwright`, 처음 한 번 내려받음)
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

빠른 모드(`AUTOSAVER_SYNC_MODE=fast`, 기본)는 마지막 동기화 2일 전 이후 바뀐 파일만 확인합니다. 순서·경로가 비어 있는 옛 자료를 채우려면 전체 모드로 한 번 돌립니다. 지난 학기 과목은 LMS가 403으로 막아 순서가 안 채워집니다.

### 4.2 과제 마감

`crawl_deadlines_only` → `deadlines.json`. 과목별 과제, 기한, 내 제출 상태(`myStatus`). 캘린더·대시보드·마감 화면이 함께 씀.

### 4.3 학교 메일 (`email_reader.py`)

- 서버 특성: IMAP4rev1, XLIST, AUTH=LOGIN만. **IDLE·UIDPLUS·MOVE·CONDSTORE 없음** → 실시간 푸시 불가, 주기 확인.
- 증분 수집: 서버에는 UID 목록만 묻고, 이미 가진 메일은 재사용. 읽음·별표만 서버 기준으로 맞춤.
- **구조 기반 수신**: `BODYSTRUCTURE`를 먼저 읽어(`parse_paren_list`, `bodystructure_parts`) text/plain·text/html 파트 번호를 찾아 그것만 받음. HTML은 40만 바이트까지 받고 30만 자까지 저장.
- 본문 그림: `inlineImages` 메타만 저장 → 메일을 열 때 `fetch_inline_images`가 한 번의 접속으로 받아 `mail_images\`에 저장.
- 첨부: `attachments` 메타(이름·형식·크기), `hasAttachment`. 내려받기 기능은 아직 없음.
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
  - 실측(jykim5215 계정): 전체 `calendar` 로 예전에 만든 'DGIST 메일 일정'도 `app.created` 로 열리고 일정 넣기·고치기·키로 찾기·지우기가 된다 → 다시 연결해도 캘린더가 두 개로 갈라지지 않는다.
  - 찾은 캘린더 ID 는 토큰 옆 `gcal_calendars.json` 에 적어 두고 먼저 쓴다. 같은 이름의 캘린더가 여럿이거나 이 토큰으로 못 여는 것(사용자가 직접 만든 같은 이름)이면 건너뛴다.
  - 연결 URL 에 `include_granted_scopes` 를 넣지 않는다. 넣으면 예전에 허락한 전체 `calendar` 가 새 토큰에 다시 묶인다.
- **OAuth 동의 화면 브랜딩** (2026-10-12): 데스크톱 앱이 쓰는 클라이언트는 Cloud 프로젝트 `dgist-lms-autosaver-2`, 예전 웹판(Render) 클라이언트는 `dgist-lms-sync`. 두 프로젝트 모두 앱 이름 Daling, 로고 `docs/logo-120.png`(= `web/app-logo-120.png`), 홈 `https://gudaling.dev/`, 개인정보처리방침 `/privacy`, 약관 `/terms`, 승인된 도메인 `gudaling.dev`.
  - 2026-10-12 `daling-app.pages.dev` 로 낸 재인증은 "웹사이트가 나에게 등록되어 있지 않음"으로 남아, 같은 날 개인 도메인 `gudaling.dev`(Cloudflare Registrar, 같은 계정)를 사서 Pages 프로젝트 `daling-app` 에 붙였다(DNS: `@` CNAME → `daling-app.pages.dev`, 프록시). `daling-app.pages.dev` 도 같은 내용을 내보내지만 페이지마다 canonical 은 `gudaling.dev`.
  - 이전 반려 사유 4가지: 홈페이지(`jykim5215.github.io/…`)가 내 소유로 확인 안 됨(GitHub 이름이 tutleblue로 바뀌어 404, 게다가 Search Console 확인이 하위 경로라 도메인 소유로 안 침), 개인정보처리방침 내용 부족, 홈에 앱 목적 설명 없음, 동의 화면 이름(Daling)과 홈 이름(붕어빵) 불일치.
  - 사이트 원본은 `docs/`(한국어 + 심사관용 영어). 배포: `npx wrangler pages deploy docs --project-name daling-app --branch main`. Pages 가 `.html`을 떼는 308 리디렉트를 하므로 동의 화면에는 `/privacy`처럼 확장자 없는 주소를 넣습니다.
  - Search Console: '도메인' 속성 `gudaling.dev` 를 DNS TXT(`google-site-verification=…`, Cloudflare DNS 의 `@` TXT)로 jykim5215@gmail.com 소유 확인. 이 TXT 를 지우면 소유 확인이 풀립니다. 예전 URL 접두어 속성 `https://daling-app.pages.dev/` 는 `docs/googlee81e6dcdac788920.html` 로 확인해 두었다.
  - Google 은 github.io 같은 공용 호스팅 하위 도메인을 "소유 확인 불가"로 반려한 사례가 있습니다(2026-06 포럼 답변). 그래서 개인 도메인을 쓴다.
  - **결과**: 2026-10-13 0시경 `gudaling.dev` 로 낸 재인증이 두 프로젝트 모두 몇 분 만에 통과했고 '브랜딩 게시'까지 마쳐, 인증 센터에 "브랜딩이 인증되었으며 사용자에게 표시되고 있습니다". 이름·로고·주소를 바꾸면 다시 인증받아야 하고, 통과한 결과는 7일 안에 게시하지 않으면 만료됩니다.
  - **데이터 액세스** (2026-10-13): 두 프로젝트 모두 데이터 액세스에 `drive.file`·`calendar.app.created`·`calendar.calendarlist.readonly` 만 등록(전부 '민감하지 않은 범위'), `dgist-lms-sync` 에 있던 민감 범위 `calendar` 는 지움. 인증 센터: "앱이 민감하거나 제한된 범위를 요청하지 않으므로 인증이 필요하지 않습니다". 동의 화면은 '확인되지 않은 앱' 경고 없이 Daling 이름·로고로 바로 권한 선택이 나온다. 민감 범위를 다시 넣으면 시연 영상까지 내는 데이터 액세스 인증을 받아야 한다.

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
| `main.py` | `sync` 작업 본체: LMS 크롤 → Drive 폴더·업로드 → 알림 메일 |
| `lms_crawler.py` | LMS 로그인, 자료·공지·마감 수집, 폴더 경로·순서 기록 |
| `browser_setup.py` | Playwright Chromium 확보 |
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
| `/api/mail-image?id=&n=` | 본문 그림 한 장 |
| `/api/mail/folders`, `/api/mail/pending`, `/api/mail/eml` | 메일함 목록, 답장 대기, eml |
| `/api/drive/list`, `/api/drive/get` | Drive 파일 (첨부용) |
| `/api/samsung-notes/status`, `/api/samsung-notes/job` | 설치 여부, 넣기 진행 |
| `/api/local-autosave/job` | 내 컴퓨터 자동 저장 진행 |
| `/api/dgist-api/status` | 공공데이터 키 확인 |
| `/api/update/check` | 업데이트 확인 |

### POST

| 경로 | 내용 |
|---|---|
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
| `/api/samsung-notes/send`, `/api/samsung-notes/organize` | 한 개 넣기(뒤에서), 노트 폴더 정리 |
| `/api/timetable/save`, `/api/timetable/delete`, `/api/timetable/bulk`, `/api/timetable/import-link`, `/api/timetable/import-image` | 시간표 |
| `/api/my-events/save`, `/api/my-events/delete`, `/api/export-ics` | 내 일정, ics 저장 |
| `/api/mark-read`, `/api/mark-all-read`, `/api/delete-email`, `/api/restore-email` | 메일 상태 |
| `/api/mail/star`, `/api/mail/move`, `/api/mail/folder-create`, `/api/mail/reminder`, `/api/mail/translate` | 메일 기능 |
| `/api/mail/open-link` | 메일 본문 링크를 기본 브라우저로 (http·https 만) |
| `/api/send-email` | 메일 보내기 |
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

그 밖의 위치:
- 설치 폴더: `%LOCALAPPDATA%\Programs\붕어빵`
- Playwright 브라우저: `%LOCALAPPDATA%\ms-playwright`
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
| 맥 앱 (DMG) | GitHub Actions `.github/workflows/mac.yml` → `daling-<버전>-mac-arm64.dmg` 아티팩트 (아래 'macOS 판') |
| 리눅스 앱 (AppImage·tar.gz) | GitHub Actions `.github/workflows/linux.yml` → `daling-<버전>-linux-x86_64.AppImage`·`.tar.gz` 아티팩트 (아래 '리눅스 판') |
| 설치본 점검 | `<실행 파일> --autosaver-smoke` (창 없이, 빈 임시 데이터 폴더로. `smoke_test.py`) |

설치 파일(Inno Setup)은 관리자 권한 없이 사용자 폴더에 설치하고, WebView2가 없으면 부트스트래퍼를 실행하고, .NET 4.7.2 미만이면 안내 후 중단합니다. zip 배포에서 생기던 "인터넷에서 받은 파일" 차단 문제를 피하려고 설치 파일로 바꿨습니다. 공인 서명이 없어서 브라우저로 받으면 처음 실행 때 SmartScreen이 뜹니다. 사이트의 한 줄 설치는 이 창 없이 깝니다 (아래 '서명·한 줄 설치'). `build_installer.ps1` 은 설치 파일 옆에 `<설치 파일>.sha256` 도 만듭니다 — 릴리스에 같이 올립니다.

설치 용량 약 167MB 중 88MB는 Playwright의 `node.exe`라 줄일 수 없습니다.

---

## 10. 알려진 한계·남은 일

- 메일 첨부 파일은 이름·아이콘까지만 나오고 내려받기는 아직 없음
- 지난 학기 과목은 LMS가 403을 줘서 LMS 순서를 못 채움 (이름순)
- 학교 메일서버에 IDLE이 없어 새 메일은 주기 확인으로만 앎
- 삼성 노트 넣기는 PDF만, 파일당 약 5.5초 (삼성 노트 자체 저장 시간)
- 설치형 앱의 자가 업데이트는 막혀 있음. 새 설치 파일로 배포해야 함
- GitHub에 올리지 않은 커밋과 변경이 많음 (`git status`로 확인). 푸시·릴리스는 사용자가 `gh auth login` 후 요청할 때
- 공인 코드 서명 없음: 브라우저로 받으면 SmartScreen(Windows)·Gatekeeper(맥) 경고. 한 줄 설치로 피하지만 Windows 스마트 앱 컨트롤은 못 피함 ('서명·한 줄 설치')


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
- 설정의 '조직도 파일 넣기' 줄은 사용자 요청으로 뺐다(2026-09-28). 조직도(`directory.json`)와 자동완성은 그대로. 다시 넣으려면 `index.html` 에 `#directoryImportButton`·`#directoryFileInput`·`#directoryStatus` 를 두면 `bindDirectory` 가 붙는다.
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

- `/api/drive/list?parent=<id>` (폴더 안) / `?q=<이름>` (검색) → folders·files. 권한이 `drive.file` 이라 앱이 올린 파일만 보인다.
- `/api/drive/get?id=` 로 받아 붙인다. 구글 문서·시트·슬라이드는 PDF 로 내보내 붙인다. 20MB 넘는 파일은 고를 수 없게 흐리게 표시.
- 작성창의 '내 자료'(강의자료 목록) 칸은 없앴다. 강의자료는 Drive 창의 AutoSaver 폴더에 있다.


### 메일 보내기·임시저장 (`email_reader.send_email`, `save_draft`)

- SMTP 로 보낸 뒤 IMAP `APPEND` 로 '보낸 편지함'에 사본을 넣는다. 예전엔 안 넣어서 앱·웹메일 어디에도 보낸 기록이 없었다.
- 임시저장은 '임시 보관함'에 `(\Seen \Draft)` 로 넣고 `X-Bungeoppang-Draft: <draftId>` 헤더를 붙인다. 다시 저장하거나 보내면 같은 번호의 예전 판에 `\Deleted` 표시만 한다(EXPUNGE 금지).
- 이 서버는 `SEARCH HEADER` 를 받아도 빈 결과를 준다(실측). 그래서 `search_header` 는 최근 60일 메일의 그 헤더만 FETCH 해서 직접 비교한다.
- 보내기 결과에 `refused`(서버가 거절한 주소)·`savedToSent` 를 돌려주고 화면 토스트에 붙인다.
- 받는 사람·참조·숨은참조는 칩(`setupRecipientChips`). 서버로 보내는 값은 숨긴 원래 칸에 `이름 <주소>, …`. 그 칸의 `value` 를 가로채서 코드가 값을 넣으면 칩을 다시 그린다. 주소 나누기는 따옴표·꺾쇠 안 쉼표를 자르지 않는다(`parseRecipients`, 서버는 `email.utils.getaddresses`).
- 요청 처리 중 잡히지 않은 오류는 `DashboardHandler._guarded` 가 `C:\lms-autosaver\server_errors.log` 에 남기고 화면에 오류 문구를 돌려준다. 창 없는 EXE 에서는 예전에 연결만 끊겨 원인을 알 수 없었다.
- 시험할 때 주의: Git Bash 의 curl 에 한글 JSON 을 그대로 넣으면 UTF-8 이 아닌 코드페이지로 나가 `read_body_json` 에서 깨진다. 본문은 UTF-8 파일로 만들어 `--data-binary @파일` 로 보낸다.

- 자동 저장(`scheduleAutosave`): 쓰다 멈추면 1.5초 뒤 이 컴퓨터(`localStorage` autosaver-mail-draft), 15초 뒤 서버 임시 보관함. 내용 서명이 같으면 다시 안 넣는다. 자동 저장은 첨부 3MB 넘으면 첨부를 뺀다('임시저장' 단추는 다 넣음). '←' 는 손댄 게 있으면 저장하고 닫기, 휴지통은 확인 뒤 `/api/mail/discard-draft` 로 서버 저장본까지 버린다. 메일 쓰기를 새로 열면 `restoreDraftIfAny` 가 이어 쓸지 묻고 같은 draftId 로 이어 저장한다.

### 문의 · 오류 제보 · 아이디어 (`app.js` openFeedback)

- 사이드바 'Feedback'(#feedbackButton, 한국어 화면도 영어, 말풍선 아이콘 — 편지 모양은 접은 사이드바에서 메일함과 헷갈렸다)·설정 › 앱 '보내기'. 종류를 고르면 메일 쓰기가 받는 사람 `FEEDBACK_TO`(tutleblue12@gmail.com)·제목 `[붕어빵 종류] `·본문 서식으로 열린다.
- 본문 아래 앱 정보(`/api/diagnostics`: 버전·Windows·파이썬·설치판 여부, 화면 크기·테마는 화면에서). 오류 제보에는 사흘 안의 `server_errors.log` 마지막 한 건과 마지막 실패 작업을 붙인다. 메일 주소·비밀번호는 넣지 않는다.

### 과목별 교수·조교 (`lms_crawler.fetch_course_staff`, `web_ui.get_course_staff`)

- 마감 확인 작업(1시간마다)에서 `GET /learn/api/public/v1/courses/{id}/users?fields=courseRoleId,user.name,user.userName` 로 학생을 뺀 사람(Instructor→교수, TeachingAssistant·CourseBuilder→조교, Grader→채점 조교)을 받아 `course_staff.json` 에 둔다. 지난 학기 일부 과목은 403(전에 받은 것 유지).
- LMS 는 이메일을 주지 않는다(이름·학번만). 이 학교는 이름 전체를 `name.given` 에 넣고 `family` 는 '.' 이다.
- `/api/course-staff`: 조직도에서 이름으로 이메일을 붙인다. 동명이인이면 교수는 교원, 조교는 대학원생 → 그래도 여럿이면 주고받은 메일에 나온 사람. 그래도 모르면 `email` 을 비우고 `candidates` 를 준다(화면에서 골라 씀). 실측 44명 중 35명 자동, 7명 후보, 2명 조직도에 없음.
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

## 메일 분류 규칙 (2026-10-12)
- `email_reader.rule_based_category` 순서: 답신 → 계정·알림(인증번호·패스키·계정 생성) → 수업·LMS(Blackboard 발신, 제목의 `[2026_2학기]`, 일일 통지·제출물 수신함·강의성찰) → 학생회 → 교수님(발신자 이름에 교수) → 세미나·행사(한·영 낱말: Seminar·Colloquium·Symposium·Lecture Series·Workshop·Forum·투어·마라톤…) → 취업·진로(창업·공모전·해커톤·트랙…) → 행정·학생팀(보낸 부서) → 동아리·문화 → 기타.
- 내용(행사·진로)을 보낸 부서(행정)보다 먼저 본다: 창업지원팀 공모전·총무구매팀 마라톤이 행정으로 갔었다.
- 측정: 받은 편지함 60통 중 기타 44 → 2 (남은 것: DGIST 주간 소식, 내가 보낸 시험 메일). 메일을 새로 받을 때 저장된 메일도 다시 분류된다(`refresh_emails`). Gemini 키가 있으면 Gemini 가 같은 목록(`CATEGORIES`) 중에서 고른다.
- 'LMS·공지' 탭(`isLmsMail`)은 수업·LMS 분류도 포함한다.

## macOS 판 (2026-10-12)
- 빌드는 GitHub Actions 에서만(개발 PC 가 Windows): `.github/workflows/mac.yml` — `build/mac` 브랜치 푸시 또는 수동 실행, macos-latest(arm64)·Python 3.13·`requirements-mac.txt` → `packaging/mac/daling-mac.spec` → `dist/Daling.app` → 서명(사설 인증서, 비밀이 없으면 ad-hoc — 아래 '서명 인증서') → `--autosaver-smoke` → 실제 앱 25초 띄워 `/healthz`·스크린샷 → `daling-<버전>-mac-arm64.dmg`(+ `.sha256`). 릴리스는 만들지 않는다.
- 공증 없음(유료 Apple Developer 계정 필요). 브라우저로 받은 DMG 는 처음 한 번 '시스템 설정 → 개인정보 보호 및 보안 → 그래도 열기'(macOS 15 부터 Control-클릭 → 열기 는 안 통함). 한 줄 설치(`curl -fsSL https://gudaling.dev/install.sh | sh`)는 격리 표시가 안 붙어 이 창이 없다 ('서명·한 줄 설치').
- 비밀 설정: 맥은 DPAPI 가 없어 예전엔 config.json 에 평문이었다. 이제 로그인 키체인(서비스 `Daling`, 계정 `settings`, {키: 값} JSON 한 항목)에 두고 config.json 에는 `keychain:<키>` 만. `mac_keychain.py`(Security.framework 를 ctypes 로, 비밀번호가 명령줄에 안 실림). `web_ui.dpapi_protect/unprotect` 와 `runtime_config._load_config` 둘 다 푼다. 항목을 하나로 둔 까닭: ad-hoc 서명은 새 버전마다 서명 해시가 바뀌어 키체인 접근을 다시 묻는데, 항목이 다섯이면 다섯 번 묻는다(사설 인증서 서명으로 이걸 없애려는 것이 아래 '서명 인증서'). 키체인이 거절하면 DPAPI 실패와 같이 평문을 남기고 다음 저장 때 다시 넣는다.
- 알림·오류 상자: `osascript`(`app.notify`, `_osascript`). 글은 스크립트에 끼우지 않고 `on run argv` 인자로 넘긴다. 알림 센터에는 '스크립트 편집기' 로 보여 제목 줄에 Daling 을 넣는다.
- SSL: 묶은 파이썬의 OpenSSL 은 빌드한 맥의 인증서 경로를 본다 → `app.py` 가 `SSL_CERT_FILE` 을 certifi 로(작업 프로세스도 물려받음). Windows 는 시스템 저장소를 읽어 필요 없다.
- 경로: 데이터 `~/.lms-autosaver`, LMS 브라우저 `~/Library/Caches/ms-playwright`(`browser_ready` 가 맥 실행 파일 이름도 본다), Playwright `node` 는 `Contents/Resources` 에 데이터로 묶여 실행 권한을 확인한다.
- 창: 첫 크기는 `NSScreen.visibleFrame`(메뉴 막대·Dock 제외)에 맞추고 자리는 pywebview 가 가운데로. 삼성 노트는 없음(`is_available` False → 버튼 숨김).
- 업데이트: 릴리스의 `daling-<버전>-mac-arm64.dmg` 만 본다. (2026-10-15~) '지금 업데이트' 는 Windows 처럼 앱이 직접 받아 GitHub digest 로 확인하고, 앱에 묶은 `install.sh`(= `docs/install.sh`)를 따로 띄운 뒤 앱이 꺼진다. install.sh 는 앱이 다 꺼지기를 기다려 DMG 의 앱을 지금 앱이 있는 폴더에 바꿔 끼우고(새 판 복사 → 서명 확인 → 이름만 바꾸기) 다시 켠다. 기록은 `~/.lms-autosaver/update-mac.log`. 예전처럼 브라우저로 받으면 업데이트마다 격리 표시 때문에 '그래도 열기' 를 또 눌러야 했다. 앱이 urllib 로 받은 파일에는 격리 표시가 없다(Info.plist 에 `LSFileQuarantineEnabled` 없음, 샌드박스 아님 — `--autosaver-smoke` 가 확인). DMG 안에서 켰거나(/Volumes) 옮기지 않고 켠(AppTranslocation) 앱은 /Applications(못 쓰면 ~/Applications)에 깐다.
- 아이콘: `packaging/mac/Daling.icns` ← `python scripts/make_icons.py --mac` (애플 격자: 1024 안 824 네모).
- 점검 `--autosaver-smoke`: 빈 임시 데이터 폴더로 화면 서버(빈 포트)·화면 파일·가벼운 /api·작업 프로세스(`--autosaver-job smoke`)·node·(맥) Cocoa 모듈·인증서, `AUTOSAVER_SMOKE_KEYCHAIN=1` 이면 점검용 계정으로 키체인 왕복, `=write`/`=read` 면 그것만(다음 빌드가 묻지 않고 읽는지, 아래). Windows 소스에서도 돈다(13개 통과).
- 서명 인증서 (2026-10-15): ad-hoc 서명의 서명 요구 조건(designated requirement, DR)은 `cdhash H"…"` 라 빌드마다 바뀌고, macOS 는 키체인 허락·개인정보 보호 권한(TCC: 문서 폴더 접근 등)을 이 조건에 묶는다 → 업데이트마다 다시 묻는다. 오래 쓰는 사설 코드 서명 인증서 하나로 서명하면 DR 이 `identifier "app.daling.desktop" and certificate root = H"<인증서 SHA-1>"` 로 고정된다. Gatekeeper 경고와는 상관없다(공증이 필요, 한 줄 설치가 피함). 알림은 osascript 라 앱 신원과 무관.
  - 만들기(한 번, 사용자 PC): `sh packaging/mac/make_sign_cert.sh [폴더]` (Windows 는 Git Bash, 기본 `~/daling-mac-sign`). CN `Daling Mac Signing`, RSA 2048, 20년, `CA:FALSE`·`digitalSignature`·`codeSigning`. .p12 는 3DES·SHA-1 MAC 으로 만든다 — macOS `security import` 가 OpenSSL 3 기본(AES-256·PBKDF2) .p12 를 못 읽는다. `-subj`·`file:` 인자는 Git Bash 경로 변환에 깨져 설정 파일·`env:` 로 넘긴다.
  - 비밀: `MAC_SIGN_P12_BASE64`(.base64.txt)·`MAC_SIGN_P12_PASSWORD`(.password.txt) 를 **사용자가 직접** 저장소 Settings → Secrets → Actions 에 넣는다. 개인 키는 저장소·커밋·채팅에 두지 않는다. 폴더를 잃거나 새로 만들면 SHA-1 이 바뀌어 그 판에서 모두 한 번 다시 허락한다.
  - CI(`mac.yml`): 비밀이 있으면 임시 키체인에 넣고(`set-key-partition-list` 로 codesign 이 묻지 않게) `codesign --force --deep --timestamp=none --sign <SHA-1>`. 없으면 ad-hoc. 서명 뒤 `codesign -d -r-` 의 DR 이 `certificate (root|leaf) = H"<SHA-1>"` 가 아니면 실패. 수동 실행의 `test_cert` 를 켜면 비밀 없이도 이번 실행만 쓰는 인증서를 같은 스크립트로 만들어 이 길을 점검한다. 끝에 서명 키체인을 지운다.
  - '키체인 허락 유지 점검': 이번 빌드(A)가 임시 키체인에 점검 항목을 쓰고, 같은 자리에 판 번호만 바꿔 같은 신원으로 다시 서명한 B(cdhash 다름)가 묻는 창을 막은 채(`SecKeychainSetUserInteractionAllowed(false)`) 읽는다. ad-hoc 대조군은 못 읽어야 정상. 결과는 실행 요약 표와 `logs/keychain-persist.log`.
  - 주의: 애플 포럼(developer.apple.com/forums/thread/98484)에 애플 CA 가 아닌 인증서로 서명한 앱도 업데이트 뒤 항목의 `partition_id` 에 새 cdhash 가 붙으며 다시 물었다는 글이 있다(DR 은 같아도). 그래서 키체인은 위 점검으로 실제로 재고, TCC 는 DR(csreq)로 비교하므로 고정된다. 이미 ad-hoc 판을 쓰던 사람은 인증서로 바뀐 첫 판에서 한 번 더 묻는다.
- 맥에서 HTTPServer 의 `getfqdn` 역조회를 건너뛴다(`ExclusiveHTTPServer.server_bind`). 첫 CI 실행에서 '로컬 네트워크의 기기 찾기 허용?' 창이 떴고 서버가 15초 늦게 떴다. 건너뛰고 나서 창이 없어지고 1초 만에 뜬다.

## 리눅스 판 (2026-10-12)
- 빌드는 GitHub Actions `.github/workflows/linux.yml`(수동 실행 또는 `build/linux` 푸시). ubuntu-22.04(glibc 2.35 → Ubuntu 22.04·Debian 12·Fedora 36 이상)·Python 3.13·`requirements-linux.txt` → `packaging/linux/daling-linux.spec`(onedir, 실행 파일 `daling`) → Xvfb 로 실제 창 띄워 보기 → `--autosaver-smoke` → `daling-<버전>-linux-x86_64.AppImage`(appimagetool, 정적 런타임이라 libfuse2 불필요)·`.tar.gz`(`install.sh` 가 `~/.local/opt/daling`·`~/.local/bin/daling`·`.desktop`). 첫 실행: 19개 점검이 바이너리·AppImage·tar 설치본 모두 통과, 키링 왕복 20개 통과. 크기는 AppImage 262MB(QtWebEngine 이 크롬 하나를 통째로 든다).
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
| Microsoft Store MSIX | 무료(개인 등록 2025-09~) | 1~2주 | Microsoft 가 서명 → Store 설치는 SmartScreen·SAC 모두 통과. MSIX 포장·심사(로그인 앱은 시험 계정 요구)가 필요 |
| Azure Artifact Signing | 월 $9.99~ | — | 개인은 미국·캐나다만 |
| Certum 오픈소스 인증서 | 약 €49 | 며칠 | 유료, 품절 |
| Apple 공증 (맥) | 연 $99 | — | 무료 Apple 계정으로는 불가. Homebrew 는 `--no-quarantine` 을 없앴고(5.0) Gatekeeper 를 못 넘는 cask 를 2026-09-01 에 막았다 |

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
- 끌기: WebView2 `IsNonClientRegionSupportEnabled` 를 첫 페이지 전에 켜고 CSS `app-region: drag`(상단 바·사이드바 빈 곳). 두 번 누르면 최대화·화면 끝 스냅도 진짜 제목 줄처럼 된다.
- 단추: `#winControls`(Segoe Fluent 아이콘) → `GET/POST /api/window {action: minimize|maximize|close}`. 개발 서버는 `custom:false` 라 화면이 그대로다.
- 최대화 뒤 복원하면 WinForms 가 없앤 제목 줄 높이를 다시 더해 창이 29px씩 길어졌다(820→849→878). `WM_SIZE` 로 최대화 직전 크기를 기억했다가 복원 직후 크기만 되돌린다.
- 화면: `html.custom-frame` 에서 넓은 창은 검색창 가운데(Spotify), 상단 바·사이드바 바탕을 이어 붙이고 본문 왼쪽 위를 둥글게. 메일함에도 상단 바를 둔다(창 단추가 읽기 도구를 덮었다).

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
