import { exports } from "cloudflare:workers";

export const ORIGIN = "http://localhost:8787";
export const CLAUDE_CALLBACK = "https://claude.ai/api/mcp/auth_callback";

export function fetchWorker(path: string, init?: RequestInit): Promise<Response> {
	return exports.default.fetch(new Request(`${ORIGIN}${path}`, { redirect: "manual", ...init }));
}

function b64url(bytes: Uint8Array): string {
	let s = "";
	for (const b of bytes) s += String.fromCharCode(b);
	return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function randomSecret(): string {
	return b64url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function pkce(): Promise<{ verifier: string; challenge: string }> {
	const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)));
	const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
	return { verifier, challenge: b64url(new Uint8Array(digest)) };
}

/** 가짜 Daling 앱(PC). 중계에 WebSocket 으로 붙어, 받은 명령을 `handle` 로 답한다. */
export type FakePc = { calls: { op: string; args: any }[]; close: () => void };

export async function connectFakePc(
	secret: string,
	handle: (op: string, args: any) => { ok: true; data: unknown } | { ok: false; error: { code: string; message?: string } },
): Promise<FakePc> {
	const res = await fetchWorker("/device/connect", {
		headers: { Upgrade: "websocket", Authorization: `Bearer ${secret}` },
	});
	if (res.status !== 101 || !res.webSocket) throw new Error(`connect failed: ${res.status}`);
	const ws = res.webSocket;
	ws.accept();
	const calls: FakePc["calls"] = [];
	ws.addEventListener("message", (event) => {
		const msg = JSON.parse(String(event.data));
		if (msg.t !== "call") return;
		calls.push({ op: msg.op, args: msg.args });
		ws.send(JSON.stringify({ t: "result", id: msg.id, ...handle(msg.op, msg.args) }));
	});
	return { calls, close: () => ws.close(1000, "bye") };
}

export async function pairCode(secret: string): Promise<string> {
	const res = await fetchWorker("/device/pair", { method: "POST", headers: { Authorization: `Bearer ${secret}` } });
	if (res.status !== 200) throw new Error(`pair failed: ${res.status}`);
	return ((await res.json()) as { code: string }).code;
}

export async function registerClient(redirectUris = [CLAUDE_CALLBACK]): Promise<Response> {
	return fetchWorker("/oauth/register", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			client_name: "Claude",
			redirect_uris: redirectUris,
			grant_types: ["authorization_code", "refresh_token"],
			response_types: ["code"],
			token_endpoint_auth_method: "none",
		}),
	});
}

function cookiesFrom(res: Response): string {
	return res.headers
		.getSetCookie()
		.map((c) => c.split(";")[0])
		.join("; ");
}

export type ConsentPage = { status: number; html: string; handle: string; cookie: string };

export async function openConsent(clientId: string, challenge: string, state = "st-1"): Promise<ConsentPage> {
	const params = new URLSearchParams({
		response_type: "code",
		client_id: clientId,
		redirect_uri: CLAUDE_CALLBACK,
		scope: "daling:read daling:write offline_access",
		state,
		code_challenge: challenge,
		code_challenge_method: "S256",
		resource: `${ORIGIN}/mcp`,
	});
	const res = await fetchWorker(`/authorize?${params}`);
	const html = await res.text();
	const handle = /name="handle" value="([^"]+)"/.exec(html)?.[1] ?? "";
	return { status: res.status, html, handle, cookie: cookiesFrom(res) };
}

export async function submitConsent(
	page: ConsentPage,
	fields: { code: string; allowWrite?: boolean; action?: "approve" | "deny" },
): Promise<Response> {
	const form = new URLSearchParams({
		handle: page.handle,
		client_name: "Claude",
		redirect_host: "claude.ai",
		code: fields.code,
		action: fields.action ?? "approve",
	});
	if (fields.allowWrite !== false) form.set("allow_write", "1");
	return fetchWorker("/authorize", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: page.cookie, "CF-Connecting-IP": `10.0.0.${Math.floor(Math.random() * 250)}` },
		body: form,
	});
}

export async function exchangeCode(clientId: string, code: string, verifier: string): Promise<any> {
	const res = await fetchWorker("/oauth/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			grant_type: "authorization_code",
			code,
			redirect_uri: CLAUDE_CALLBACK,
			client_id: clientId,
			code_verifier: verifier,
			resource: `${ORIGIN}/mcp`,
		}),
	});
	return { status: res.status, body: await res.json() };
}

/** 등록부터 토큰까지 한 번에 (PC 하나 = 사용자 하나). */
export async function connectClaude(secret: string, opts: { allowWrite?: boolean } = {}): Promise<string> {
	const reg = (await (await registerClient()).json()) as { client_id: string };
	const { verifier, challenge } = await pkce();
	const page = await openConsent(reg.client_id, challenge);
	const code = await pairCode(secret);
	const approved = await submitConsent(page, { code, allowWrite: opts.allowWrite });
	if (approved.status !== 302) throw new Error(`consent failed: ${approved.status} ${await approved.text()}`);
	const location = new URL(approved.headers.get("Location") ?? "");
	const token = await exchangeCode(reg.client_id, location.searchParams.get("code") ?? "", verifier);
	if (token.status !== 200) throw new Error(`token failed: ${JSON.stringify(token.body)}`);
	return token.body.access_token as string;
}

let rpcId = 0;

/** MCP 요청 하나. 응답이 SSE 로 와도 JSON-RPC 본문만 꺼낸다. */
export async function mcp(token: string | null, method: string, params: unknown = {}): Promise<{ status: number; body: any; headers: Headers }> {
	const headers: Record<string, string> = {
		// 실제 요청에는 늘 있는 머리글. MCP 처리기가 DNS 리바인딩을 막으려고 본다.
		Host: "localhost:8787",
		"Content-Type": "application/json",
		Accept: "application/json, text/event-stream",
		"MCP-Protocol-Version": "2025-06-18",
	};
	if (token) headers.Authorization = `Bearer ${token}`;
	const res = await fetchWorker("/mcp", {
		method: "POST",
		headers,
		body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method, params }),
	});
	const text = await res.text();
	let body: any = null;
	if ((res.headers.get("Content-Type") ?? "").includes("text/event-stream")) {
		const data = text
			.split("\n")
			.filter((l) => l.startsWith("data:"))
			.map((l) => l.slice(5).trim())
			.pop();
		body = data ? JSON.parse(data) : null;
	} else if (text) {
		try {
			body = JSON.parse(text);
		} catch {
			body = text;
		}
	}
	return { status: res.status, body, headers: res.headers };
}

export async function callTool(token: string, name: string, args: Record<string, unknown> = {}): Promise<any> {
	await mcp(token, "initialize", {
		protocolVersion: "2025-06-18",
		capabilities: {},
		clientInfo: { name: "test", version: "1" },
	});
	const res = await mcp(token, "tools/call", { name, arguments: args });
	if (res.status !== 200) throw new Error(`tools/call ${name}: HTTP ${res.status} ${JSON.stringify(res.body)}`);
	return res.body.result;
}

export function toolJson(result: any): any {
	return JSON.parse(result.content[0].text);
}
