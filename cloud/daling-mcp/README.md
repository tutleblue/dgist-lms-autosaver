# daling-mcp — Claude 커넥터용 원격 MCP 서버

Claude(웹·모바일·데스크톱)의 **커스텀 커넥터**에 주소 하나만 넣으면, 학생 PC 에 있는 Daling 의
강의자료·과제 마감을 Claude 가 읽고 정리할 수 있게 하는 Cloudflare Worker 입니다.

- 커넥터 주소: **`https://mcp.gudaling.dev/mcp`** (Streamable HTTP)
- 인증: OAuth 2.1 (인가 코드 + PKCE S256), 동적 클라이언트 등록(DCR)·Client ID Metadata Document(CIMD)
- 자료는 **여기에 저장하지 않습니다.** 학생 PC 의 Daling 이 밖으로 WebSocket 을 걸어 두고, 도구 호출을 그 연결로 받아 PC 에서 답합니다.
  그래서 PC 가 켜져 있고 Daling 이 떠 있을 때만 됩니다(꺼져 있으면 Claude 에 "Daling is not running…" 이라고 답합니다).

```
Claude ──HTTPS(OAuth 토큰)──> Worker /mcp ──(토큰의 기기 id)──> DeviceRelay DO ══WebSocket══ 학생 PC 의 Daling (claude_link.py)
                                   │                                                     │
                                   └─ /authorize 동의 화면: 연결 코드(8자리) ←──── Daling 설정 'Claude 에서 보기' 에서 받음
```

## 왜 이렇게 만들었나

| 결정 | 까닭 |
|---|---|
| 기존 사이트(gudaling.dev, Pages)와 **다른 Worker** | 사이트는 정적 소개 페이지뿐이고 데이터·로그인이 없습니다. OAuth·Durable Object 가 필요한 서버를 소개 사이트 배포와 묶지 않으려고 하위 도메인 `mcp.gudaling.dev` 로 뗐습니다. |
| `McpAgent` 대신 `createMcpHandler`(agents) + `@modelcontextprotocol/server` | 도구는 모두 한 번 묻고 한 번 답하는 꼴이라 세션 상태가 필요 없습니다. 상태 없는 처리기는 요청마다 서버를 만들고 DO 를 하나 덜 씁니다. 상태가 필요한 것은 PC 연결(DeviceRelay)뿐입니다. |
| 로그인 = **연결 코드** | Daling 에는 계정이 없습니다(학교 계정은 PC 에만 있음). PC 가 만든 기기 비밀값의 해시가 '사용자' 이고, Daling 앱이 받은 10분짜리 일회용 코드를 동의 화면에 넣어 그 PC 를 고릅니다. 학교 비밀번호는 오가지 않습니다. |
| 연결 코드는 KV 가 아니라 DO | KV 는 쓴 뒤 다른 지역에서 읽히기까지 최대 60초라, 받자마자 넣는 코드에 맞지 않습니다. |

## 보안

- **모든 도구 호출에서 토큰을 서버가 검증**합니다(`OAuthResourceServer` → `validateToken`). 토큰이 가리키는 기기 id 로만 DO 를 고르고, 도구 입력에는 PC 를 고르는 칸이 없습니다 → 다른 사람 PC 에 닿을 길이 없습니다(`test/flow.test.ts` '다른 사용자 자료는 볼 수 없다').
- PC 는 기기 비밀값(32바이트)으로만 붙습니다. 서버에는 해시만 남고, 해시로는 PC 행세를 할 수 없습니다.
- 콜백은 Claude 의 `https://claude.ai/api/mcp/auth_callback`, `https://claude.com/api/mcp/auth_callback` 와 이 컴퓨터 주소(MCP Inspector·Claude Code 용, http://localhost·127.0.0.1)만 등록됩니다. 이 컴퓨터 주소로 가는 연결은 동의 화면에 경고가 뜹니다.
- 쓰기 권한(`daling:write`)은 동의 화면의 '바꾸기도 허용' 을 켰을 때만. 끄면 읽기 도구만 됩니다.
- **삭제는 소프트 삭제**: `delete_deadline` 은 숨기기이고 `restore_deadline`·앱의 '숨긴 과제' 로 되돌립니다. 자료 파일은 지우는 도구가 없습니다.
- 입력은 zod 로 검사합니다(날짜·id 형식·길이). 잘못된 입력은 PC 까지 가지 않습니다.
- 오류 문구에 내부 사정을 싣지 않습니다. PC 가 보낸 문구는 '잘못된 입력·찾을 수 없음·읽기 전용' 안내만 옮기고, 나머지는 일반 문구로 바꿉니다.
- 속도 제한(Workers Rate Limiting): 도구 호출 PC 당 60회/분, 연결 코드 넣기 IP 당 20회/분, PC 쪽 주소 PC 당 30회/분.
- 비밀값: **지금은 필요한 것이 없습니다.** 토큰은 라이브러리가 해시로 KV 에 두고, 서명 키를 따로 두지 않습니다. 나중에 비밀값이 생기면 `wrangler secret put` 으로만 넣고 코드·`wrangler.jsonc` 에 적지 않습니다.

## 바인딩

| 이름 | 종류 | 쓰임 |
|---|---|---|
| `OAUTH_KV` | KV | OAuth 클라이언트·권한·토큰(해시). id 를 비워 두면 첫 배포가 만들어 붙입니다. |
| `DEVICE_RELAY` | Durable Object (SQLite) | PC 한 대에 하나. WebSocket(Hibernation API)을 붙잡고 도구 호출을 넘깁니다. |
| `PAIRING` | Durable Object (SQLite) | 연결 코드(해시) → 기기 id. 10분, 한 번만. |
| `TOOL_LIMITER`·`CODE_LIMITER`·`DEVICE_LIMITER` | Rate Limiting | 위 '속도 제한' |
| `PUBLIC_ORIGIN` | 변수 | 커넥터의 바깥 주소. 토큰의 발급자·대상이 이 값이라 **배포 뒤에 바꾸면 모든 연결이 끊깁니다.** |
| `ALLOW_LOOPBACK_REDIRECTS` | 변수 | `"true"` 면 이 컴퓨터 주소 콜백 허용(MCP Inspector·Claude Code). |

## 개발·시험

```powershell
cd cloud\daling-mcp
npm ci
npm test            # workerd 안에서 40개: OAuth 흐름·PKCE·DCR 거절·연결 코드·읽기 전용·다른 사용자 차단·시각
npm run typecheck
npm run dev -- --env local   # http://localhost:8787
```

PC 쪽까지 이어 보기 (데이터는 시험용 폴더로):

```powershell
$env:DALING_MCP_URL = "http://localhost:8787"
$env:AUTOSAVER_ROOT = "<시험용 폴더>"; $env:AUTOSAVER_DATA_ROOT = $env:AUTOSAVER_ROOT
$env:AUTOSAVER_CONFIG_PATH = "$env:AUTOSAVER_ROOT\config.json"; $env:AUTOSAVER_DEV_PORT = "8812"
..\..\.venv\Scripts\python.exe ..\..\scripts\dev_server.py
# 설정 → 'Claude 에서 보기' 켜기 → '연결 코드 받기'
npx @modelcontextprotocol/inspector@2.13.0
# Streamable HTTP, http://localhost:8787/mcp → Connect → 동의 화면에 코드 → Tools
```

## 배포

1. Cloudflare 에 로그인: `npx wrangler login` (gudaling.dev 영역이 있는 계정)
2. `npm run deploy` (= `wrangler deploy --env=`, 시험용 `local` 설정이 아닌 맨 위 설정으로) — `mcp.gudaling.dev` 사용자 지정 도메인과 DNS 레코드, `OAUTH_KV` 가 함께 만들어집니다.
3. 확인: `https://mcp.gudaling.dev/.well-known/oauth-authorization-server` 와 `/.well-known/oauth-protected-resource/mcp` 가 JSON 을 주는지, `POST /mcp` 가 토큰 없이 401 과 `WWW-Authenticate: … resource_metadata=…` 를 주는지.

## Claude 에 커넥터 넣기 (학생이 하는 일)

1. Daling → 설정 → **Claude 에서 보기** 켜기 → **연결 코드 받기** (8자리, 10분)
2. Claude → 설정 → 커넥터 → **커스텀 커넥터 추가** → 주소 `https://mcp.gudaling.dev/mcp` → 추가
3. **연결** → 열린 Daling 화면에 코드 넣기 → '바꾸기도 허용' 은 원하면 끄기 → **연결하기**
4. 끊기: Daling 설정의 연결 목록에서 **끊기**, 또는 Claude 에서 커넥터 지우기

Team·Enterprise 는 조직 관리자가 먼저 커넥터를 추가해야 합니다(Claude 정책).

## 도구

시각은 모두 ISO 8601, 한국 시각(+09:00). 시간대 없는 입력은 한국 시각으로 읽습니다.

| 도구 | 하는 일 | 주석 |
|---|---|---|
| `list_materials` | 강의자료 목록(과목·LMS 폴더·내 컴퓨터에 있는 것만), 쪽 나누기 | 읽기 |
| `search_materials` | 파일 이름·과목·폴더에서 낱말 찾기 | 읽기 |
| `get_material` | 자료 하나(과목·학기·폴더·크기·내 폴더) | 읽기 |
| `list_folders` | 내가 만든 자료 폴더(책장) | 읽기 |
| `create_material_folder` | 자료 폴더 만들기 (자료 자체는 LMS 에서만 옴) | 쓰기 |
| `update_material` | 자료 숨기기/보이기, 내 폴더에 넣기/빼기 | 쓰기·destructive |
| `list_deadlines` | 마감 목록(upcoming·overdue·open·done·all, 기간·과목·출처) | 읽기 |
| `get_deadline` | 마감 하나 | 읽기 |
| `create_deadline` | 내 마감 추가 (앱의 대시보드·달력·알림·.ics 에도 나옴) | 쓰기 |
| `update_deadline` | 내 마감 고치기 (LMS 과제는 거절) | 쓰기·destructive |
| `complete_deadline` | 내 마감 완료/미완료 (LMS 과제는 LMS 에서 제출해야) | 쓰기·destructive |
| `delete_deadline` | 마감 지우기 = 숨기기(되돌릴 수 있음) | 쓰기·destructive |
| `restore_deadline` | 지운 마감 되돌리기 | 쓰기 |

PC 쪽 처리는 저장소 루트의 `claude_link.py`(`OPS`) 입니다. 새 도구를 넣으면 두 곳을 같이 고칩니다.
