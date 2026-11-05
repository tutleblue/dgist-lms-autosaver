// 동의 화면·안내 화면. 학생이 보는 화면이라 한국어로, Daling 앱과 같은 색(따뜻한 흰색·테라코타)으로.
// 클라이언트 이름·주소는 클라이언트가 스스로 적어 보낸 값이라 모두 escape 한다.

export function escapeHtml(value: unknown): string {
	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

const STYLE = `
:root{--bg:#faf9f5;--surface:#fff;--line:#e6e3da;--text:#1f1e1d;--soft:#5d5a52;--accent:#c0674a;--accent-strong:#9c4e33;--warn-bg:#fff4e5;--warn:#8a5300;--err-bg:#fdecea;--err:#a8281e;
--sans:"Segoe UI","Malgun Gothic",-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo",system-ui,sans-serif}
@media (prefers-color-scheme:dark){:root{--bg:#262624;--surface:#30302e;--line:#45443f;--text:#f0eee6;--soft:#bfbbb0;--accent:#d9825f;--accent-strong:#e89a7a;--warn-bg:#3a2f1c;--warn:#f0c27a;--err-bg:#3d2120;--err:#f19a90}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:16px/1.6 var(--sans);display:flex;justify-content:center;padding:32px 16px}
main{width:100%;max-width:440px;background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:28px 24px}
h1{font-size:22px;margin:0 0 6px}
p{margin:0 0 14px;color:var(--soft)}
.who{border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin:0 0 16px}
.who strong{color:var(--text)}
.who small{display:block;color:var(--soft);word-break:break-all}
label{display:block;font-weight:600;margin:0 0 6px}
input[type=text]{width:100%;font:600 22px/1.2 Consolas,"SF Mono",Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;padding:12px 14px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--text)}
input[type=text]:focus{outline:2px solid var(--accent);outline-offset:1px}
.hint{font-size:14px;margin:6px 0 16px}
.check{display:flex;gap:10px;align-items:flex-start;margin:0 0 18px;font-weight:400}
.check input{margin-top:5px;width:18px;height:18px;accent-color:var(--accent)}
.check span small{display:block;color:var(--soft);font-size:14px}
.row{display:flex;gap:10px}
button{flex:1;font:600 16px var(--sans);padding:12px;border-radius:10px;border:1px solid var(--line);cursor:pointer;background:var(--surface);color:var(--text)}
button.primary{background:var(--accent);border-color:var(--accent);color:#fff}
button.primary:hover{background:var(--accent-strong)}
.warn{background:var(--warn-bg);color:var(--warn);border-radius:10px;padding:10px 12px;font-size:14px;margin:0 0 16px}
.error{background:var(--err-bg);color:var(--err);border-radius:10px;padding:10px 12px;font-size:14px;margin:0 0 16px}
ul{margin:0 0 16px;padding-left:20px;color:var(--soft);font-size:15px}
code{font-family:Consolas,"SF Mono",Menlo,monospace;font-size:14px;word-break:break-all}
`;

export const PAGE_HEADERS: Record<string, string> = {
	"Content-Type": "text/html; charset=utf-8",
	"Cache-Control": "no-store",
	"Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
	"X-Content-Type-Options": "nosniff",
	"Referrer-Policy": "no-referrer",
};

function page(title: string, body: string): string {
	return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)}</title><style>${STYLE}</style></head><body><main>${body}</main></body></html>`;
}

export type ConsentView = {
	handle: string;
	clientName: string;
	clientDomain?: string;
	redirectHost: string;
	redirectIsLoopback: boolean;
	error?: string;
	allowWrite?: boolean;
};

export function consentPage(v: ConsentView): string {
	const who = v.clientDomain
		? `<strong>${escapeHtml(v.clientName)}</strong><small>확인된 주소: ${escapeHtml(v.clientDomain)}</small>`
		: `<strong>${escapeHtml(v.clientName)}</strong>`;
	const loopback = v.redirectIsLoopback
		? `<div class="warn">이 연결은 이 컴퓨터에서 돌아가는 프로그램(${escapeHtml(v.redirectHost)})으로 갑니다. 직접 시작한 연결이 아니면 거절하세요.</div>`
		: "";
	const error = v.error ? `<div class="error" role="alert">${escapeHtml(v.error)}</div>` : "";
	const writeChecked = v.allowWrite === false ? "" : " checked";
	return page(
		"Daling 연결",
		`<h1>Daling 데이터에 연결</h1>
<p>아래 프로그램이 내 Daling 의 강의자료·과제 마감을 보려고 합니다.</p>
<div class="who">${who}<small>돌아갈 곳: ${escapeHtml(v.redirectHost)}</small></div>
${loopback}${error}
<form method="post" action="/authorize" autocomplete="off">
<input type="hidden" name="handle" value="${escapeHtml(v.handle)}">
<input type="hidden" name="client_name" value="${escapeHtml(v.clientName)}">
<input type="hidden" name="client_domain" value="${escapeHtml(v.clientDomain ?? "")}">
<input type="hidden" name="redirect_host" value="${escapeHtml(v.redirectHost)}">
<input type="hidden" name="redirect_loopback" value="${v.redirectIsLoopback ? "1" : ""}">
<label for="code">연결 코드</label>
<input type="text" id="code" name="code" inputmode="text" autocapitalize="characters" spellcheck="false" maxlength="12" placeholder="ABCD-2345" required autofocus>
<p class="hint">Daling 앱 → 설정 → <b>Claude 에서 보기</b> 에서 '연결 코드 받기'를 누르면 나오는 8자리입니다. 10분 동안 한 번만 쓸 수 있어요.</p>
<label class="check"><input type="checkbox" name="allow_write" value="1"${writeChecked}><span>바꾸기도 허용<small>마감 추가·수정·완료·숨기기, 자료 숨기기·내 폴더 정리. 끄면 읽기만 합니다.</small></span></label>
<ul><li>학교 계정·비밀번호는 넘어가지 않습니다.</li><li>Daling 이 켜져 있는 동안만 연결됩니다. 자료는 중간 서버에 저장되지 않습니다.</li><li>Daling 설정에서 언제든 연결을 끊을 수 있습니다.</li></ul>
<div class="row"><button type="submit" name="action" value="deny">거절</button><button type="submit" name="action" value="approve" class="primary">연결하기</button></div>
</form>`,
	);
}

export function messagePage(title: string, message: string): string {
	return page(title, `<h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p>`);
}

export function landingPage(connectorUrl: string): string {
	return page(
		"Daling × Claude",
		`<h1>Daling × Claude 연결 서버</h1>
<p>Claude 에서 내 Daling 의 강의자료·과제 마감을 보고 정리할 수 있게 이어 주는 곳입니다.</p>
<ul><li>Claude → 설정 → 커넥터 → <b>커스텀 커넥터 추가</b></li><li>주소: <code>${escapeHtml(connectorUrl)}</code></li><li>연결하기를 누르고, Daling 앱 설정의 <b>Claude 에서 보기</b>에서 받은 코드를 넣습니다.</li></ul>
<p>자세한 안내: <code>https://gudaling.dev</code></p>`,
	);
}
