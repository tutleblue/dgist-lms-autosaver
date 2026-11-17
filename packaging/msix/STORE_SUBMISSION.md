# Microsoft Store 제출 안내 (Daling)

목적: Windows 의 'PC 보호(SmartScreen)' 경고 없이 깔리게 하기. Store 에서 받은 앱은 Microsoft 가 서명하므로
SmartScreen·스마트 앱 컨트롤에 막히지 않는다. 자세한 까닭과 실측은 `FEATURES.md` 'Microsoft Store 판'.

계정 등록·신분 확인·제출 단추는 **본인이 직접** 합니다. 아래에서 ✋ 표시가 직접 할 일, 🤖 은 Claude 가 할 일입니다.

---

## 1. ✋ 개인 개발자 등록 (무료, 10분)

1. https://storedeveloper.microsoft.com → **Get started for free** → **Individual**(개인)
2. 개인 Microsoft 계정으로 로그인
3. 휴대폰으로 **신분증 원본 + 셀카** 촬영 (밝은 곳에서). 카드·결제 없음
4. 확인 메일이 오면 Partner Center 에 들어갈 수 있습니다

## 2. ✋ 이름 예약

Partner Center › **앱 및 게임** › **새 제품** › **MSIX 또는 PWA 앱** → 이름 `Daling`
(이미 쓰이면 `Daling for DGIST` 등. 바꾸면 Claude 에게 알려 주세요 — 앱 안 표시 이름도 같이 맞춥니다)

## 3. ✋→🤖 제품 ID 값 넘기기

제품 › **제품 관리** › **제품 ID** 화면의 세 값을 Claude 에게 붙여 주세요 (비밀 값이 아닙니다):

- `Package/Identity/Name` (예: `12345Kimjy.Daling`)
- `Package/Identity/Publisher` (예: `CN=ABCD1234-…`)
- `Package/Properties/PublisherDisplayName`

🤖 그 값으로 제출용 패키지를 만듭니다:
`powershell -ExecutionPolicy Bypass -File packaging\msix\build_msix.ps1 -Build -Store -IdentityName … -Publisher … -PublisherDisplayName …`
→ `packaging\out\daling-<버전>-win-x64-store.msix` (서명 안 함 — Store 가 서명)

## 4. ✋ 제출 칸 채우기

| 칸 | 넣을 것 |
|---|---|
| 패키지 | `packaging\out\daling-<버전>-win-x64-store.msix` 올리기 |
| 가격·사용 가능 | 무료 · 시장: 대한민국(또는 전체) |
| 범주 | 교육 (또는 생산성) |
| 개인정보처리방침 URL | `https://gudaling.dev/privacy` |
| 지원 연락처 | `https://github.com/tutleblue/dgist-lms-autosaver/issues` |
| 연령 등급(IARC 설문) | 폭력·도박·성적 내용 없음 · 사용자끼리 대화·공유 기능 없음 · 위치 공유 없음 |
| 스크린샷 | `packaging\msix\store-screenshots\` — 한국어 목록에 `ko-1`~`ko-6`, 영어 목록에 `en-1`~`en-6` (번호 순서) |
| 제한된 기능 사유 (`runFullTrust`) | 아래 4-3 |
| 인증 참고 사항 (Notes for certification) | 아래 4-4 |

### 4-1. 스토어 목록 — 한국어

**짧은 설명**
> DGIST LMS 강의자료·과제 마감·학교 메일·학사일정을 한 화면에 모아 주는 학생용 앱 (비공식)

**설명**
> Daling은 DGIST 학생이 쓰려고 만든 비공식 앱입니다. DGIST가 만들거나 운영하는 서비스가 아닙니다.
>
> • LMS 강의자료를 과목별 폴더로 자동 저장하고, 새 자료가 올라오면 알려 줍니다.
> • 과제 마감을 모아 D-day 순으로 보여 주고, 원하면 Google Calendar에 넣어 줍니다.
> • 학교 메일을 앱 안에서 읽고 쓰며, 수업·세미나·행사 메일을 알아서 나눕니다.
> • 학사일정·학교 공지·셔틀버스·시간표를 한 화면에서 봅니다.
> • 받은 자료를 내 Google Drive와 내 컴퓨터 폴더로 정리합니다.
>
> 로그인 정보와 받은 자료는 이 PC에만 저장되고 개발자에게 보내지 않습니다. 계정 없이도 '계정 없이 체험하기'로 모든 화면을 둘러볼 수 있습니다.

### 4-2. Store listing — English

**Short description**
> An unofficial app that gathers DGIST LMS materials, deadlines, school mail and the academic calendar in one place.

**Description**
> Daling is an unofficial app made by a DGIST student. It is not made or operated by DGIST.
>
> • Saves LMS course materials into per-course folders automatically and tells you when new ones arrive.
> • Collects assignment deadlines in D-day order and can add them to your Google Calendar.
> • Reads and writes your school mail inside the app and sorts class, seminar and event mail for you.
> • Shows the academic calendar, school notices, shuttle bus and your timetable on one screen.
> • Organizes downloaded files into your own Google Drive and folders on your PC.
>
> Your sign-in details and files stay on this PC and are never sent to the developer. Use "Try without an account" to explore every screen with sample data.

### 4-3. 제한된 기능 `runFullTrust` 사유 (영어 그대로 붙이기)

> Daling is a classic Win32 desktop app (Python, packaged with PyInstaller) that shows its UI in WebView2 served from a local 127.0.0.1 server. It starts its own helper processes (Daling.exe --autosaver-job) and Playwright's bundled Node.js driver to sign in to the university LMS with the system Microsoft Edge in headless mode (nothing is downloaded on Windows), saves course files to the user's own folders (C:\lms-autosaver, Documents) and can hand PDFs to Samsung Notes. These need full-trust desktop execution; the app cannot run in an AppContainer.

### 4-4. 인증 참고 사항 (영어 그대로 붙이기)

> No test account is needed. DGIST LMS and school mail use SSO accounts that the university issues only to enrolled students, so we cannot create one for testers. Instead, the app has a built-in demo mode with sample data:
> 1. Launch Daling. On the first intro card, click "Try without an account" (or, any time, the same button in the top bar, or Settings › Connected accounts › Demo mode › "Try the demo").
> 2. Every screen fills with sample data: Dashboard, Deadlines, Calendar, Courses (with announcements), Files (sample PDFs open locally) and Mailbox (read, star, delete, restore).
> 3. While the demo is on, a striped bar at the top and a "Demo · sample data" pill are shown. The app makes no network requests in demo mode; actions that need a server (sync, sending mail, Google sign-in, uploads) show "Not available in demo mode".
> 4. Click "End demo" in the top bar to leave the demo. Your own data folder is not touched.
> Public screens (academic calendar, school notices, shuttle bus, course timetable) also work without an account outside demo mode. The UI can be switched to English in Settings › "Language · 언어"; demo data then appears in English.

## 5. ✋ 제출 → 심사 (보통 1~3일)

떨어지면 받은 사유를 Claude 에게 그대로 붙여 주세요.

## 6. 🤖 통과한 뒤

- 사이트 내려받기에 **Microsoft Store 에서 받기** 단추를 맨 앞에 둡니다 (경고 없는 길을 기본으로).
- 새 버전마다 `-store.msix` 를 만들어 Partner Center 에서 '업데이트' 제출 → Store 가 이용자 PC 를 자동으로 바꿉니다.
- GitHub 설치 파일(경고 있음)과 한 줄 설치는 그대로 둡니다 (맥·리눅스, Store 를 못 쓰는 PC 용).

## 미리 알아 둘 것

- 이미 GitHub 판을 쓰는 사람이 Store 판을 깔면 **같은 데이터(`C:\lms-autosaver`)를 그대로 씁니다.** 두 판을 함께 켜지 말고 GitHub 판은 지우면 됩니다.
- 심사에서 문제 될 수 있는 것: 삼성 노트 정리(다른 앱 DB 를 직접 고침). 걸리면 Store 판에서만 그 기능을 끄겠습니다.
- 확인 완료(2026-11-17): 1.12.65 코드로 Store 형식 묶기 성공(가짜 ID 값, 73.8MB) · 스크린샷 12장 새로 찍음(체험 데이터, 바깥 연결 0건).
