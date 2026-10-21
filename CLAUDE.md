# CLAUDE.md — 붕어빵 (DGIST LMS AutoSaver) 작업 안내

DGIST 학생용 **Windows·macOS(M칩·인텔)** 데스크톱 앱입니다(리눅스 판도 CI 로 빌드). 두 운영체제 규칙은 아래 '3. Windows·macOS 둘 다 지원'. **보이는 이름은 Daling**(2026-10-11, 예전 이름 붕어빵)이고, 실행 파일(`붕어빵.exe`)·설치 폴더(`Programs\붕어빵`)·데이터 폴더·업데이트 파일(`bungeoppang-*-setup.exe`)·사용자 자료 폴더(`문서\붕어빵 파일 정리`, `붕어빵 강의자료`)는 기존 설치본 업데이트를 위해 그대로 둡니다. 로고는 `design/logo/daling-source.webp` → `python scripts/make_icons.py`. LMS 강의자료·과제 마감·학교 메일·학사일정·공지를 자동으로 모아
한 화면에서 보고, Google Drive·Google Calendar·삼성 노트·내 컴퓨터로 보냅니다.

- **기능 전체 지도, API 목록, 데이터 파일, 설정 키는 `FEATURES.md`** 에 있습니다. 기능을 고치기 전에 해당 절을 먼저 읽습니다.
- 사용자는 한국어로 말하고, 코드 주석과 화면 문구도 한국어입니다. 주석은 "왜 이렇게 했는지(실측·실제 겪은 일)"를 적는 스타일을 따릅니다.

## 1. 위치

| 무엇 | 경로 |
|---|---|
| 저장소 | `C:\Users\jykim\바탕화면\dgist-lms-autosaver-main\dgist-lms-autosaver-main` (git `main`, 원격 `tutleblue/dgist-lms-autosaver`) |
| 설치된 앱 | `%LOCALAPPDATA%\Programs\붕어빵\붕어빵.exe` |
| 사용자 데이터 | `C:\lms-autosaver\` (설치 앱과 개발 서버가 **함께** 씀). 맥은 `~/Library/Application Support/Daling`(예전부터 쓰던 맥은 `~/.lms-autosaver`), 리눅스 `~/.lms-autosaver` — `runtime_config.default_data_root()` |
| 맥·Windows CI 빌드 | `.github/workflows/build.yml`(main 푸시·수동) → Windows 설치 파일 + `mac.yml`(M칩·인텔 DMG 두 벌). 결과는 Actions 의 Artifacts. 릴리스에는 두 DMG 와 각 `.sha256` 을 모두 올린다 |
| 파이썬 | 저장소의 `.venv` (Python 3.14). 시스템 `python`이 아니라 `.venv\Scripts\python.exe`를 씁니다 |

## 2. 자주 쓰는 명령

```powershell
# 문법 검사
.venv\Scripts\python.exe -m py_compile app.py web_ui.py email_reader.py lms_crawler.py samsung_notes.py
node --check web\app.js

# 소스 그대로 화면 띄우기 (8794 포트, 설치 앱과 같은 데이터)
.venv\Scripts\python.exe scripts\dev_server.py
#   Claude 데스크톱 앱에서는 .claude/launch.json 의 "autosaver-src" 로 preview_start

# 설치 파일 만들기 / 만들고 이 PC에 설치·실행
powershell -ExecutionPolicy Bypass -File packaging\build_installer.ps1
powershell -ExecutionPolicy Bypass -File packaging\build_installer.ps1 -Install

# Microsoft Store 판(MSIX) 만들기 / 시험 설치·패키지 안 점검 / Store 제출판 (FEATURES.md 'Microsoft Store 판')
powershell -ExecutionPolicy Bypass -File packaging\msix\build_msix.ps1 -Build
powershell -ExecutionPolicy Bypass -File packaging\msix\build_msix.ps1 -Install -Smoke

# 디자인 스튜디오 (연습용 복제 앱에서 화면 만지기·댓글 → 저장본 반영). 도구는 ~/.claude/design-studio/tool,
# 개인화는 .claude/design-studio/, 저장본·시안은 .design-studio/ (git 제외). --mode real 은 내 데이터를 읽기만
.venv\Scripts\python.exe "$env:USERPROFILE\.claude\design-studio\tool\run_studio.py" --project .

# 설치된 앱이 떠 있는 포트 찾기 (8765가 막혀 있으면 8766~8785)
Get-NetTCPConnection -OwningProcess (Get-Process 붕어빵).Id -State Listen
```

파이썬 모듈을 직접 불러 시험할 때는 데이터 경로를 넘깁니다.

```bash
AUTOSAVER_DATA_ROOT=C:/lms-autosaver AUTOSAVER_CONFIG_PATH=C:/lms-autosaver/config.json PYTHONPATH=. ./.venv/Scripts/python.exe -X utf8 -c "..."
```

테스트 스위트는 없습니다. 검증은 문법 검사 + 개발 서버에서 화면 확인 + 설치본에서 재확인으로 합니다.

## 3. 반드시 지킬 것

### 작업 완료의 기준
1. **파이썬 코드를 고쳤으면 설치 파일을 다시 만들고 설치해야 사용자 앱에 반영됩니다.** 소스만 고치고 "됐다"고 하지 않습니다. `build_installer.ps1 -Install` 후 설치본에서 확인합니다.
2. 화면 변경은 개발 서버에서 눈으로 확인(스크린샷·콘솔 오류)한 뒤 설치본에도 반영합니다.
3. 측정할 수 있는 것은 측정하고 숫자로 보고합니다. 추측으로 원인을 말하지 않습니다.

### 사용자 데이터와 계정
4. **비밀번호·API 키를 대신 입력하거나 파일·코드에 적지 않습니다.** 사용자가 채팅에 붙여 넣고 "넣어 달라"고 해도 설정 화면에서 직접 넣도록 안내합니다.
   - 예외(사용자 결정, 2026-10-09): **공공데이터포털 기본 인증키**는 `public_data_key.txt`(저장소 루트, `.gitignore`)에 두고 설치 파일에만 묶습니다(`bungeoppang.spec`, CI 는 `secrets.DGIST_API_KEY`). 소스·커밋·공개 저장소에는 절대 넣지 않습니다. 모두가 한 키를 나눠 쓰므로 호출은 캐시를 거칩니다(`web_ui.get_school_events` 6시간).
5. 비밀 설정 키는 `web_ui.SECRET_KEYS`와 `runtime_config.SECRET_KEYS` **두 곳 모두**에 있어야 합니다. 한쪽에만 있으면 작업 프로세스가 `dpapi:` 암호문을 그대로 씁니다.
6. 학교 포털 비밀번호 저장이 필요한 기능은 먼저 제안하지 않습니다.
7. 데이터 파일(`C:\lms-autosaver\*.json`)에 쓰는 시험을 할 때는 설치된 앱을 먼저 끄고, 시험 전에 해당 파일을 백업합니다.
8. 사용자 파일은 지우지 말고 휴지통으로 보내거나 옮깁니다.

### 메일 (IMAP)
9. **절대 일반 `EXPUNGE`를 보내지 않습니다.** 휴지통 전체가 영구 삭제됩니다(실제로 사고가 날 뻔했음). 서버에 UIDPLUS가 없으므로 `expunge_uid`는 아무것도 안 하고, 검색은 `NOT DELETED`로 합니다.
10. 서버에 IDLE·MOVE·CONDSTORE가 없습니다. 실시간 푸시를 전제로 설계하지 않습니다.
11. 메일 저장 형식을 바꿔 예전 메일을 다시 받아야 하면 `email_reader.BODY_VERSION`을 올립니다.

### 삼성 노트
12. **삼성 노트가 켜져 있을 때 `Storage.sqlite`에 쓰지 않습니다.** 앱이 메모리 값으로 덮어씁니다. 쓰기 전에는 반드시 DB를 백업합니다(`_backup_db`).
13. 옮기는 노트는 이번에 우리가 만든 것(UUID로 특정) 또는 파일 이름이 정확히 맞는 미분류 노트만입니다. 사용자가 정리한 노트는 건드리지 않습니다.
14. 가져오는 동안 창을 **최소화하지 않습니다.** UWP라 일시정지되어 가져오기가 멈춥니다. 투명화(`HiddenNotesWindow`)를 씁니다.
15. 저장되기 전에 다음 파일을 넘기거나 앱을 닫으면 그 노트는 사라집니다. 파일마다 DB에 줄이 생긴 것을 확인하고 넘어갑니다.
16. 삼성 노트 실험은 실제 노트를 만듭니다. 그 과목 강의자료처럼 들어가도 되는 파일로만 하고, 무엇이 들어갔는지 사용자에게 알립니다.

### EXE·Windows
17. EXE에서 작업 프로세스를 띄울 때 `sys.executable -c`를 쓰지 않습니다(창이 새로 뜸). `붕어빵.exe --autosaver-job <kind>`를 씁니다.
18. `console=False` EXE는 `sys.stdout`이 없고 한국어 Windows 기본 인코딩은 cp949입니다. 작업 출력은 `_bind_worker_output`이 UTF-8로 잡습니다.
19. PyInstaller 결과물에서 `pythonnet`의 `runtimes\*`를 지우지 않습니다(pywebview가 깨짐).
20. 한글이 든 `.ps1`은 **UTF-8 BOM**으로 저장합니다. BOM이 없으면 PowerShell 5.1이 구문 오류를 냅니다. **예외: `docs/install.ps1`은 BOM 없이** — `irm … | iex`가 BOM을 글자로 읽어 깨집니다(한글은 `docs/_headers`의 charset으로).
21. 포트 8765는 다른 도구가 잡고 있을 수 있습니다. 앱은 빈 포트로 옮겨 뜨고(`app.start_server`), 서버는 `SO_EXCLUSIVEADDRUSE`로 혼자 잡습니다. **내가 띄우지 않은 프로세스는 끄지 않습니다.**
22-1. **코드 서명**: `build_installer.ps1`이 사설 인증서(`CN=붕어빵 (jykim5215)`, 현재 사용자 `My` 저장소, 내보내기 불가)가 있으면 EXE·설치 파일·`unins000.exe`를 서명합니다(`packaging\sign_tools.ps1`). 2026-10-02 Defender가 서명·버전 정보 없는 EXE를 `Bearfoos.A!ml`로 오탐해 지운 뒤 넣었습니다. 루트 신뢰(`-Trust`)는 보안 설정이라 사용자가 직접 합니다. 배포용 공인 서명은 SignPath Foundation(무료, Apache-2.0 공개 조건)으로, 태그 `v<버전>`을 푸시하면 `.github/workflows/release.yml`이 CI에서 빌드·서명·릴리스합니다(`CODE_SIGNING.md`, `.signpath/`; SignPath 비밀이 없으면 건너뜀). CI용 패키지 판은 `requirements-build.txt`.
22-2. **공인 서명이 생기기 전까지 경고 창은 한 줄 설치로 피합니다** (`docs/install.ps1`·`install.sh`, FEATURES.md '서명·한 줄 설치'). 릴리스에는 설치 파일마다 `<파일>.sha256`을 같이 올립니다(API 한도에 걸린 한 줄 설치가 씁니다). 맥 앱 안 업데이트도 묶은 `install.sh`로 바꿔 끼우므로, 이 파일을 고치면 `mac.yml`로 다시 점검합니다.
22. 실행 파일 안의 파이썬 코드는 GitHub 파일 교체로 바뀌지 않습니다. 설치형 앱의 `updater.apply_update`는 막혀 있습니다.

### 화면 (web/)
23. 프레임워크 없는 단일 `app.js`입니다. 새 화면 부분은 `RENDER_PARTS`에 서명과 함께 넣어, 값이 안 바뀌면 다시 그리지 않게 합니다.
24. 전역 `[hidden] { display: none !important; }`가 있습니다. 요소를 숨길 때는 `el.hidden`을 씁니다.
25. 수백 줄짜리 목록은 아이콘을 `iconHtml()`로 처음부터 넣고, 리스너는 부모에 하나만 겁니다. 접힌 내용은 펼칠 때 그립니다.
26. 화면 문구는 사람 말로 짧게. 오류는 `humanError`로 바꿔 보여 줍니다.
26-1. **목록을 고치는 기능은 드래그를 기본으로 만듭니다.** 순서 바꾸기·옮기기·담기는 끌어 놓기로 되게 하고, 버튼·메뉴는 보조로만 남깁니다 (키보드와 좁은 화면 때문에 지우지는 않습니다).
26-5. **영어 화면**: 화면 문구를 새로 넣거나 고치면 `python scripts/i18n_extract.py` 를 돌려 `web/i18n/en.json` 에 영어를 채웁니다(빠진 것 0 이 되게). 사용자 자료(메일·과목명)는 번역하지 않습니다.
26-2. 다만 **주간 시간표는 버튼(편집 창) 방식을 지킵니다.** 사용자가 그렇게 정했습니다. 시간표에 드래그 이동을 다시 넣지 않습니다.

### 체험 모드 (Store 심사용, `demo_mode.py`)
26-6. 체험 중에는 **바깥 요청 0건**을 지킵니다. 새 API 가 LMS·메일·Google·학교 서버에 묻는다면 `DashboardHandler.DEMO_BLOCKED_GET/POST` 에 넣거나 체험 중엔 있는 것만 주게 합니다(소켓 차단은 안전망). 가짜 데이터에 실명·실제 주소를 넣지 않습니다(옛이야기 인물·example.com). `--autosaver-smoke` 의 '체험 모드' 점검이 지켜봅니다.

### 마스코트 달구·첫 실행 소개
26-3. 달구 그림은 `design/dalgu/sheet0.png`·`sheet1.png`·`sheet2.webp`(4×4 스티커 시트, sheet2 는 걷기·달리기·옆모습)에서 `scripts/slice_dalgu.py`로 잘라 `web/img/dalgu/`에 둡니다. 포즈를 바꾸려면 스크립트의 `POSES`를 고치고 다시 돌립니다(시스템 파이썬의 Pillow 사용, 앱에는 불필요). `design/`은 설치 파일에 들어가지 않습니다.
26-4. 첫 실행 소개(`TOUR_STEPS`)는 새 화면·메뉴를 만들면 함께 고칩니다. 비출 곳은 선택자로 적고, 못 찾으면 가운데 카드로 나옵니다. 어둡게 하는 막은 큰 `box-shadow` 대신 사각형 네 장(`.tour-dim`)을 씁니다 — WebView 가 큰 그림자를 그리지 않을 때가 있었습니다. 달구는 카드에 붙어 있지 않고 단계마다 비출 곳 옆으로 걸어갑니다(`placeBuddy`). 새 단계를 넣을 때 자리는 자동으로 고르니 `pose` 만 정하면 됩니다.

### 새 버전 내기
27. `VERSION`과 `data/changelog.json` 맨 위 항목을 같은 번호로 함께 올립니다. 앱 사이드바의 '업데이트 내용'이 이 파일을 보여 주고, 설치 파일 버전도 `VERSION`을 따릅니다.
27-1. **업데이트 내용은 한 줄씩 짧게** 씁니다. 항목 하나는 30자 안팎의 명사형·짧은 동사형("고쳐 올린 자료를 Drive에서도 새 판으로 교체"), 절마다 2~4개. 원인·수치·배경 설명은 넣지 않고 `FEATURES.md`에 적습니다. 사용자가 "줄글이라 읽기 힘들다"고 했습니다.

### Git
28. 커밋·푸시는 사용자가 요청할 때만 합니다. 원격보다 앞선 커밋과 커밋 안 한 변경이 많습니다. 푸시에는 `gh auth login`이 필요합니다.

### Windows·macOS 둘 다 지원 (2026-10-20)
이 프로젝트는 **Windows 와 macOS 를 모두 지원합니다.** 기능을 고치면 두 운영체제에서 다 되게 하고, 한쪽에만 있는 기능은 분기하고 다른 쪽에서는 단추를 숨깁니다(예: 삼성 노트). 개발 PC 에 맥이 없으므로 아래를 지킵니다.
29. **경로를 손으로 짜지 않습니다.** `C:\`, 백슬래시로 경로 잇기, `%APPDATA%`·`LOCALAPPDATA` 같은 환경변수를 OS 분기 없이 쓰지 않습니다. 경로는 `pathlib` 로 잇습니다. 데이터 폴더는 `runtime_config.default_data_root()` 하나만 씁니다(화면 서버와 작업 프로세스가 같은 함수를 봐야 같은 폴더를 씀). **`~/.lms-autosaver` 를 새로 만드는 코드를 넣지 않습니다**(맥 새 설치가 다음 실행부터 옛 자리로 돌아감). 화면 JS 에서 경로를 비교할 때는 `\` 와 `/` 를 둘 다 다룹니다.
30. **실행 파일 옆·앱 묶음 안에 쓰지 않습니다.** `sys._MEIPASS`, `PROJECT_ROOT`, 맥 `Daling.app/Contents` 는 읽기만 합니다. 맥은 `.app` 안의 파일이 바뀌면 서명이 깨져 앱이 열리지 않습니다. 쓰기는 데이터 폴더·임시 폴더에만 합니다.
31. **Windows 전용 API 는 분기 안에서만** 씁니다: `ctypes.windll`, `winreg`, DPAPI, `os.startfile`, `creationflags`, PowerShell·cmd·`.exe` 실행, `winotify`, WinRT, pythonnet. Windows 전용 모듈(`samsung_notes`, `window_chrome`)은 `os.name == "nt"` 안에서 불러옵니다. 맥에서는 파일 열기 `open`, 알림 `osascript`(글은 인자로 넘김), 비밀 값은 `secret_store`(키체인)를 씁니다.
32. 맥에서 Finder 로 켠 앱은 PATH 가 `/usr/bin:/bin:/usr/sbin:/sbin` 뿐입니다. 바깥 명령(claude·node 등)은 `shutil.which` 만 믿지 말고 `ai_cli._unix_bin_dirs` 처럼 설치 자리를 직접 봅니다.
33. **글꼴은 Windows 글꼴 뒤에 맥 글꼴을 함께 적습니다**: 산세리프 `"Segoe UI", "Malgun Gothic", -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo"`, 명조 `"AppleMyungjo"`, 고정폭 `Consolas, "SF Mono", Menlo` (`styles.css` 의 `--font-sans`·`--font-serif`). 맑은 고딕만 적지 않습니다.
34. **단축키를 Ctrl 로 고정하지 않습니다.** 처리는 `event.ctrlKey || event.metaKey` 로 함께 받고, 화면에 보이는 안내는 `keyLabel(tr("…Ctrl+K…"))` 로 그립니다(맥에서 ⌘K). 정적 HTML 의 안내는 `macKeyLabels` 가 바꿉니다. 맥의 Option(Alt)+화살표는 글자 칸의 단어 이동이라 가로채지 않습니다. 화면 문구에 'Windows·윈도우' 를 쓰지 않습니다('컴퓨터', '운영체제').
35. 줄바꿈 `\r\n` 을 가정하지 않습니다(IMAP·.ics 처럼 규격이 정한 곳만). 셸 스크립트는 LF 로 둡니다(`.gitattributes`).
36. **한 칩 전용 바이너리·패키지를 더하지 않습니다.** 저장소에 `.exe·.dll·.dylib·.so` 를 넣지 않습니다. 맥 판은 **M칩(arm64)·인텔(x86_64) 두 벌**을 따로 묶습니다(`mac.yml` 매트릭스, `daling-mac.spec` 의 `DALING_MAC_ARCH`, 파일 `daling-<버전>-mac-arm64.dmg`·`-mac-x86_64.dmg`). 새 패키지는 `requirements-mac.txt` 에 **두 칩 모두 휠이 있는 판**으로 넣습니다 — `pip download <패키지> --platform macosx_12_0_x86_64 --python-version 3.13 --only-binary=:all:` (arm64 도) 로 확인하고, 한쪽이 끊긴 패키지는 `; platform_machine == "x86_64"` 로 칩마다 판을 나눕니다(예: cryptography 는 49 부터 인텔 휠이 없어 인텔만 48.0.0). Windows 전용이면 `daling-mac.spec` 의 `excludes` 에 넣습니다. universal2 는 `pydantic_core`·`cryptography`·`cffi` 휠이 없어 하지 않습니다(2026-10-20 실측). 맥 칩 판별은 `sysctl hw.optional.arm64`(`updater._mac_arch`·`install.sh mac_arch`, 로제타에서도 M칩을 알아봄).
37. **맥 권한이 필요한 기능**(마이크·카메라·화면 기록·연락처·사진·외장 디스크 등)을 넣으면 `daling-mac.spec` 의 `info_plist` 에 `NS…UsageDescription` 을 함께 넣습니다. 카메라·마이크 같은 것은 설명이 없으면 macOS 가 앱을 바로 죽입니다.
38. **맥 앱은 맥 러너에서 `ditto`·`hdiutil` 로만 묶습니다.** `.app` 폴더를 그대로 아티팩트·zip 에 넣지 않습니다(실행 권한·심볼릭 링크가 사라져 '손상됨'). 서명은 최소 ad-hoc(`codesign --sign -`) — M칩은 서명 없는 실행 파일을 `killed: 9` 로 죽입니다. 공증 자리는 `mac.yml` 주석·`packaging/mac/entitlements.plist`.
39. **맥 쪽 변경은 CI 로 확인합니다.** `build.yml`·`mac.yml` 이 실제 앱을 띄워 화면 서버 응답·`--autosaver-smoke`·데이터 폴더 위치를 봅니다. 소스만 고치고 "맥에서도 된다" 고 하지 않습니다. CI 로 못 보는 것(창 모양·키체인 창·권한 창·⌘ 단축키)은 맥 사용자에게 확인을 부탁하고 그렇다고 적습니다.

## 4. 구조 요약

```
붕어빵.exe
├─ pywebview 창 ──HTTP──> web_ui.DashboardHandler (서버 스레드, 포트 8765~8785)
├─ app.scheduler_loop (매일 예약 동기화 + 메일 5분/마감 60분/자료 180분)
├─ web_ui.start_notes_job (삼성 노트, 뒤에서)
└─ 붕어빵.exe --autosaver-job sync|deadlines|emails|verify|google-oauth
     sync → main.run_job → lms_crawler.crawl_lms → Drive 업로드 → organize_downloads
```

| 하고 싶은 일 | 볼 곳 |
|---|---|
| 새 API | `web_ui.py`의 `do_GET`/`do_POST` (`route ==` 분기) |
| 새 설정 칸 | `index.html` 설정 폼 → `app.js` `loadConfig`·저장 핸들러 → `web_ui.write_config`·`safe_public_config` → 필요하면 `runtime_config` |
| 자동 실행 주기 | `web_ui.auto_minutes`, `app.next_due_job` |
| LMS 수집 규칙 | `lms_crawler.process_content`, `download_lms_file` |
| 자료 목록 필드 | `web_ui._build_file_rows` (캐시: `_files_cache`, 메타데이터 파일 도장 기준) |
| 메일 수신 | `email_reader.MiniIMAP.fetch_structure`/`fetch_parts`, `_parse_one_message` |
| 메일 화면 | `app.js` `renderEmails`, `emailListRow`, `renderMailBody`, `mailFrameDoc` |
| 폴더 나무 | `app.js` `renderFolderView`, `buildFolderTree`, `folderTreeHtml` |
| 삼성 노트 | `samsung_notes.import_pdfs` |
| 체험 모드(가짜 데이터) | `demo_mode.build`, `web_ui._demo_get`·`_demo_post`·`toggle_demo`, `app.js` `setDemo` |

## 5. 알아 두면 시간을 아끼는 사실

- LMS 로그인에서 `wait_for_load_state("networkidle")`은 시간 초과가 잦아 쓰지 않습니다.
- LMS 콘텐츠 API는 지난 학기 과목에 403을 줍니다. 오류가 아니라 정상입니다.
- 메일 HTML은 파트 번호를 찍어 받으면 안 됩니다. multipart/related에서는 2번 파트가 사진입니다. `BODYSTRUCTURE`를 먼저 읽습니다.
- quoted-printable이 헤더에 안 적혀 있는 메일이 있습니다(`_looks_quoted_printable`).
- HTML→평문 정규식에서 공백을 두 군데서 나눠 가질 수 있게 쓰면 역추적 폭발로 메일 새로고침이 멈춥니다.
- data.go.kr 오류 코드 30은 "경로는 맞고 키가 없음"입니다.
- 삼성 노트는 긴 제목을 약 50자에서 자르고 중복에 `_2`를 붙입니다. 가져온 노트는 "마지막으로 열린 폴더"에 생깁니다.
- 삼성 노트 정상 종료는 노트를 막 가져온 직후엔 썸네일을 만드느라 약 15초 걸립니다. 강제로 닫아도 썸네일은 다음 실행 때 다시 만들어집니다.
- Windows에서 파이썬 기본 HTTP 서버는 이미 쓰이는 포트도 같이 잡을 수 있습니다(SO_REUSEADDR).
- 설치형 앱의 문서 폴더는 OneDrive 아래일 수 있습니다. 경로는 `SHGetKnownFolderPath`로 찾습니다.
- Claude 데스크톱의 스크린샷 도구는 허용하지 않은 앱 창을 검은 사각형으로 가립니다. 그 사각형을 앱 창으로 착각하지 않습니다.
