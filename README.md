# DGIST LMS AutoSaver

DGIST LMS 강의 자료를 찾아 Google Drive에 정리하고, 새 자료 확인과 업로드 상태를 웹 인터페이스에서 관리하는 앱입니다.

© 2026 Daling. [Apache License 2.0](LICENSE)으로 공개합니다.

- 개인정보: 개발자에게 아무것도 보내지 않습니다 → [PRIVACY.md](PRIVACY.md)
- 코드 서명: Free code signing provided by [SignPath.io](https://about.signpath.io), certificate by [SignPath Foundation](https://signpath.org) → [CODE_SIGNING.md](CODE_SIGNING.md)

## 주요 기능

- DGIST LMS 로그인 및 강의 자료 탐색
- 여러 과목의 파일을 강의별/주차별로 분류
- Google OAuth 기반 Google Drive 연동
- Gemini API를 이용한 자료 요약
- 웹 대시보드에서 설정, 동기화, 검증 실행
- 사용자별 작업공간 분리 모드

## 실행

**쓰는 사람은 설치 파일로 설치합니다.**
[Releases](https://github.com/tutleblue/dgist-lms-autosaver/releases/latest)의 Assets에서 받습니다.
설치한 앱은 새 버전이 나오면 앱 안에서 업데이트됩니다.

| 운영체제 | 파일 | 경고 창 없이 한 줄로 설치 |
|---|---|---|
| Windows 10·11 (x64) | `daling-<버전>-win-x64-setup.exe` | PowerShell 창에 `irm https://gudaling.dev/install.ps1 \| iex` |
| macOS 12 이상 — M칩(Apple Silicon) 맥 | `daling-<버전>-mac-arm64.dmg` | 터미널에 `curl -fsSL https://gudaling.dev/install.sh \| sh` (칩에 맞는 판을 알아서 고름) |
| macOS 12 이상 — 인텔 맥 | `daling-<버전>-mac-x86_64.dmg` | 위와 같음 |
| Linux (x86_64) | `daling-<버전>-linux-x86_64.AppImage` | 터미널에 `curl -fsSL https://gudaling.dev/install.sh \| sh` |

### macOS 에서 열기

맥 판은 Apple 공증(유료 Apple Developer 계정 필요)을 받지 않았습니다. 그래서 **브라우저로 받은 DMG** 는 처음 열 때 macOS 가 막습니다.
위의 한 줄 설치로 깔면 이 창이 뜨지 않습니다(다운로드한 파일에 붙는 '인터넷에서 받음' 표시가 없어서). DMG 로 깔았다면 아래처럼 엽니다.

1. DMG 를 열고 `Daling` 을 `Applications`(응용 프로그램) 폴더로 끌어다 놓습니다.
2. `Daling` 을 엽니다. **"Apple은 'Daling'에 악성 코드가 없음을 확인할 수 없습니다"** 창이 뜨면 `완료` 를 누릅니다.
3. **시스템 설정 → 개인정보 보호 및 보안** 을 열고 아래로 내려 **"'Daling'이(가) 차단되었습니다"** 옆의 **`그래도 열기`** 를 누릅니다. 맥 암호를 넣고 다시 `그래도 열기`.
   (macOS 15 Sequoia 부터는 예전처럼 Control-클릭 → 열기 로는 열리지 않습니다.) 한 번 열고 나면 다음부터는 그냥 열립니다.

**"'Daling'이(가) 손상되었기 때문에 열 수 없습니다. 휴지통으로 이동해야 합니다"** 가 뜨면, 파일이 망가진 것이 아니라
격리 표시가 붙은 채 서명 확인을 못 한 것입니다. 이 저장소의 Releases·Actions 에서 받은 파일이 맞다면, 터미널에서 격리 표시를 지운 뒤 다시 엽니다.

```bash
xattr -cr /Applications/Daling.app
```

받은 파일이 진짜인지 확인하려면 함께 올라간 `.sha256` 과 맞춰 봅니다: `shasum -a 256 daling-<버전>-mac-<arm64|x86_64>.dmg`
(GitHub CLI 가 있으면 `gh attestation verify <받은 DMG> -R tutleblue/dgist-lms-autosaver` 로 이 저장소의 CI 가 만든 파일인지도 볼 수 있습니다.)

그 밖에 알아 둘 것:
- **칩에 맞는 DMG 를 받습니다.** M칩 맥은 `mac-arm64`, 인텔 맥은 `mac-x86_64`. 내 맥이 어느 쪽인지는 Apple 메뉴 → 이 Mac 에 관하여 → '칩'(M1·M2…) 또는 '프로세서'(Intel). 다른 칩 판을 받으면 열리지 않습니다. 한 줄 설치와 앱 안 업데이트는 알아서 맞는 판을 고릅니다.
- 인텔 판은 2026-10-21 이후에 나오는 버전부터 릴리스에 올라옵니다. 그 전 버전에는 M칩 판만 있습니다.
- 처음 켜면 키체인 접근을 묻습니다(학교 메일 암호 같은 비밀 설정을 키체인에 둡니다). 새 버전으로 업데이트한 뒤에도 한 번 다시 묻습니다 — 공증받은 서명이 아니라서입니다. `항상 허용` 을 누르면 그 버전에서는 다시 묻지 않습니다.
- 데이터 폴더: `~/Library/Application Support/Daling` (예전 버전부터 쓰던 맥은 `~/.lms-autosaver` 를 그대로 씁니다). 앱을 지워도 이 폴더는 남습니다.

**시험판 받기 (Actions):** 커밋마다 [build 워크플로](https://github.com/tutleblue/dgist-lms-autosaver/actions/workflows/build.yml)가 Windows·맥 판을 만듭니다.
실행 하나를 열고 아래 **Artifacts** 에서 `daling-mac-dmg-arm64`(M칩 맥)·`daling-mac-dmg-x86_64`(인텔 맥) 또는 `daling-windows-setup`(Windows)을 받아 압축을 풉니다. 서명이 없는 시험판이라 위와 같은 창이 뜹니다.

> 웹 주소(Render)로 쓰는 방식은 2026-09-29에 멈췄습니다. 무료 서버에서는 LMS 동기화가 계속 실패했고
> 학교 비밀번호가 서버에 평문으로 남았습니다. 그 주소는 이제 설치 안내만 보여 줍니다(`hosted_notice.py`).
> `DEPLOYMENT.md`, `GITHUB_DEPLOY.md`는 옛 기록입니다.

개발할 때 (소스에서 실행):

```powershell
pip install -r requirements.txt
pythonw app.py            # 앱 창으로 실행 (LMS용 브라우저는 처음 동기화 때 자동으로 받음)
```

## Google API 설정

앱의 설정 화면에는 Google Drive OAuth와 Gemini API 발급을 돕는 도움말이 포함되어 있습니다.

운영 배포 후에는 Google Cloud Console의 OAuth Redirect URI에 Render 도메인을 추가해야 합니다.

```text
https://<render-domain>/oauth2callback
```

## 민감 파일

다음 파일은 GitHub에 올리지 않습니다.

- `config.py`, `config.json`
- `credentials.json`, `token.json`, `oauth_pending.json`
- `downloaded_files.json`, `file_metadata.json`
- `downloads/`, `users/`

## 구조

```text
dgist-lms-autosaver/
├── web_ui.py          # 웹 대시보드 서버
├── main.py            # 동기화 작업 실행
├── lms_crawler.py     # LMS 자료 탐색
├── drive_uploader.py  # Google Drive 업로드
├── runtime_config.py  # 사용자별 실행 설정
├── web/               # 프론트엔드 파일
├── Dockerfile         # Render Docker 배포
└── render.yaml        # Render Blueprint 설정
```
