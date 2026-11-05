import { DurableObject } from "cloudflare:workers";

// PC ↔ 중계 메시지 (JSON 텍스트 한 줄):
//   중계 → PC  {"t":"call","id":"…","op":"deadlines.list","args":{…}}
//   PC → 중계  {"t":"result","id":"…","ok":true,"data":…} | {"t":"result","id":"…","ok":false,"error":{"code":"not_found"}}
//   PC → 중계  "ping" → "pong" (자동 응답이라 DO 를 깨우지 않는다)

export type RelayError = { code: string; message?: string };
export type RelayResult = { ok: true; data: unknown } | { ok: false; error: RelayError };

const CALL_TIMEOUT_MS = 20_000;
// PC 가 보내는 답 하나의 최대 크기. 자료 목록은 쪽마다 50개까지라 넉넉하다.
const MAX_MESSAGE_BYTES = 2 * 1024 * 1024;
const MAX_PENDING = 16;

type Pending = { resolve: (r: RelayResult) => void; timer: ReturnType<typeof setTimeout> };

/** PC 한 대. 이름은 기기 id(기기 비밀값의 SHA-256)라서, 비밀값을 가진 PC 만 이 DO 에 붙을 수 있다. */
export class DeviceRelay extends DurableObject<Env> {
	private pending = new Map<string, Pending>();

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
	}

	/** /device/connect 가 기기 비밀값을 확인한 뒤 넘긴 WebSocket 업그레이드만 받는다. */
	async fetch(request: Request): Promise<Response> {
		if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
			return new Response("Expected WebSocket", { status: 426 });
		}
		// 같은 PC 가 다시 붙으면(재시작·네트워크 바뀜) 예전 연결은 닫는다. 연결은 늘 하나.
		for (const old of this.ctx.getWebSockets()) {
			try {
				old.close(4000, "replaced");
			} catch {
				// 이미 닫힌 연결
			}
		}
		const pair = new WebSocketPair();
		const [client, server] = Object.values(pair);
		this.ctx.acceptWebSocket(server);
		server.serializeAttachment({
			connectedAt: Date.now(),
			appVersion: (request.headers.get("X-Daling-Version") ?? "").slice(0, 32),
		});
		return new Response(null, { status: 101, webSocket: client });
	}

	/** 도구 하나를 PC 에 넘기고 답을 기다린다. PC 가 없거나 늦으면 오류 결과를 준다(던지지 않는다). */
	async call(op: string, args: unknown, timeoutMs = CALL_TIMEOUT_MS): Promise<RelayResult> {
		const ws = this.openSocket();
		if (!ws) return { ok: false, error: { code: "device_offline" } };
		if (this.pending.size >= MAX_PENDING) return { ok: false, error: { code: "device_busy" } };
		const id = crypto.randomUUID();
		return new Promise<RelayResult>((resolve) => {
			const timer = setTimeout(() => {
				this.pending.delete(id);
				resolve({ ok: false, error: { code: "device_timeout" } });
			}, timeoutMs);
			this.pending.set(id, { resolve, timer });
			try {
				ws.send(JSON.stringify({ t: "call", id, op, args }));
			} catch {
				clearTimeout(timer);
				this.pending.delete(id);
				resolve({ ok: false, error: { code: "device_offline" } });
			}
		});
	}

	async status(): Promise<{ connected: boolean; connectedAt: number | null; appVersion: string | null }> {
		const ws = this.openSocket();
		if (!ws) return { connected: false, connectedAt: null, appVersion: null };
		const info = (ws.deserializeAttachment() ?? {}) as { connectedAt?: number; appVersion?: string };
		return { connected: true, connectedAt: info.connectedAt ?? null, appVersion: info.appVersion || null };
	}

	/** 연결을 끊는다 (사용자가 앱에서 'Claude 연결 끄기'를 눌렀을 때 PC 가 스스로 닫지만, 서버 쪽에서도 끊을 수 있게). */
	async disconnect(): Promise<void> {
		for (const ws of this.ctx.getWebSockets()) {
			try {
				ws.close(4001, "disconnected");
			} catch {
				// 이미 닫힘
			}
		}
	}

	async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
		if (typeof message !== "string" || message.length > MAX_MESSAGE_BYTES) {
			ws.close(1009, "message too large");
			return;
		}
		let parsed: unknown;
		try {
			parsed = JSON.parse(message);
		} catch {
			return;
		}
		if (!parsed || typeof parsed !== "object") return;
		const msg = parsed as { t?: unknown; id?: unknown; ok?: unknown; data?: unknown; error?: unknown };
		if (msg.t !== "result" || typeof msg.id !== "string") return;
		const waiting = this.pending.get(msg.id);
		if (!waiting) return; // 시간이 지나 버린 답
		this.pending.delete(msg.id);
		clearTimeout(waiting.timer);
		if (msg.ok === true) {
			waiting.resolve({ ok: true, data: msg.data });
		} else {
			const err = (msg.error && typeof msg.error === "object" ? msg.error : {}) as RelayError;
			waiting.resolve({
				ok: false,
				error: {
					code: typeof err.code === "string" ? err.code.slice(0, 40) : "device_error",
					message: typeof err.message === "string" ? err.message.slice(0, 300) : undefined,
				},
			});
		}
	}

	async webSocketClose(ws: WebSocket, code: number): Promise<void> {
		// 기다리던 호출은 바로 실패로 돌려준다 (20초를 다 기다리게 하지 않는다)
		if (this.ctx.getWebSockets().filter((s) => s !== ws).length === 0) {
			for (const [id, waiting] of this.pending) {
				clearTimeout(waiting.timer);
				waiting.resolve({ ok: false, error: { code: "device_offline" } });
				this.pending.delete(id);
			}
		}
		try {
			ws.close(code === 1005 ? 1000 : code, "closed");
		} catch {
			// 이미 닫힘
		}
	}

	private openSocket(): WebSocket | null {
		for (const ws of this.ctx.getWebSockets()) {
			if (ws.readyState === WebSocket.OPEN) return ws;
		}
		return null;
	}
}

// 헷갈리는 글자(0·O·1·I·L)를 뺀 31자. 8자리 ≈ 8.5×10^11 가지.
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const CODE_TTL_MS = 10 * 60 * 1000;

type CodeRecord = { deviceId: string; expiresAt: number };

export function normalizeCode(code: string): string {
	return code.toUpperCase().replace(/[^0-9A-Z]/g, "");
}

export async function sha256Hex(text: string): Promise<string> {
	const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * 연결 코드 목록 (전체에 하나). 코드는 해시로만 두고, 한 번 쓰면 지운다.
 * Claude 동의 화면에서 사용자가 넣은 코드가 어느 PC 것인지 찾는 데만 쓴다.
 */
export class PairingDirectory extends DurableObject<Env> {
	async create(deviceId: string, now = Date.now()): Promise<{ code: string; expiresAt: number }> {
		// 이 PC 가 전에 만든 코드는 버린다 (하나만 살아 있게)
		const previous = await this.ctx.storage.get<string>(`device:${deviceId}`);
		if (previous) await this.ctx.storage.delete(`code:${previous}`);

		let raw = "";
		while (raw.length < 8) {
			// 248 = 31×8 미만만 써서 글자마다 확률을 같게 한다
			for (const b of crypto.getRandomValues(new Uint8Array(16))) {
				if (b < 248 && raw.length < 8) raw += CODE_ALPHABET[b % CODE_ALPHABET.length];
			}
		}
		const code = `${raw.slice(0, 4)}-${raw.slice(4)}`;
		const hash = await sha256Hex(normalizeCode(code));
		const expiresAt = now + CODE_TTL_MS;
		await this.ctx.storage.put<CodeRecord>(`code:${hash}`, { deviceId, expiresAt });
		await this.ctx.storage.put(`device:${deviceId}`, hash);
		if ((await this.ctx.storage.getAlarm()) === null) {
			await this.ctx.storage.setAlarm(now + CODE_TTL_MS + 60_000);
		}
		return { code, expiresAt };
	}

	/** 맞는 코드면 PC id 를 주고 그 코드를 지운다. 틀리거나 지났으면 null. */
	async redeem(code: string, now = Date.now()): Promise<string | null> {
		const normalized = normalizeCode(code);
		if (normalized.length !== 8) return null;
		const hash = await sha256Hex(normalized);
		const record = await this.ctx.storage.get<CodeRecord>(`code:${hash}`);
		if (!record) return null;
		await this.ctx.storage.delete(`code:${hash}`);
		if ((await this.ctx.storage.get<string>(`device:${record.deviceId}`)) === hash) {
			await this.ctx.storage.delete(`device:${record.deviceId}`);
		}
		return record.expiresAt > now ? record.deviceId : null;
	}

	async alarm(): Promise<void> {
		const now = Date.now();
		let next: number | null = null;
		const codes = await this.ctx.storage.list<CodeRecord>({ prefix: "code:" });
		for (const [key, record] of codes) {
			if (record.expiresAt <= now) {
				await this.ctx.storage.delete(key);
				const hash = key.slice("code:".length);
				if ((await this.ctx.storage.get<string>(`device:${record.deviceId}`)) === hash) {
					await this.ctx.storage.delete(`device:${record.deviceId}`);
				}
			} else if (next === null || record.expiresAt < next) {
				next = record.expiresAt;
			}
		}
		if (next !== null) await this.ctx.storage.setAlarm(next + 60_000);
	}
}
