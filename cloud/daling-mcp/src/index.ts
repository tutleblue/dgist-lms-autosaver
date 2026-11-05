import {
	AuthorizationError,
	CimdFetchError,
	OAuthAuthorizationServer,
	OAuthResourceServer,
	type AuthRequest,
} from "@cloudflare/workers-oauth-provider";
import { createMcpHandler } from "agents/mcp/server";
import { consentPage, landingPage, messagePage, PAGE_HEADERS } from "./pages";
import { DeviceRelay, PairingDirectory, sha256Hex } from "./relay";
import { buildServer } from "./tools";

export { DeviceRelay, PairingDirectory };

// 경로
//   /mcp                                         MCP (Streamable HTTP, OAuth 토큰 필요)
//   /.well-known/oauth-protected-resource/mcp    RFC 9728 (OAuthResourceServer)
//   /.well-known/oauth-authorization-server      RFC 8414 (OAuthAuthorizationServer)
//   /authorize                                   동의 화면 — 연결 코드로 PC 를 고른다
//   /oauth/token, /oauth/register                토큰·DCR (OAuthAuthorizationServer)
//   /device/connect|pair|status|revoke           Daling 앱(PC)만 쓴다. 기기 비밀값으로 확인

export const SCOPES = ["daling:read", "daling:write", "offline_access"];
const READ_SCOPE = "daling:read";
const WRITE_SCOPE = "daling:write";

// Claude 의 OAuth 콜백 (https://claude.com/docs/connectors/building/authentication, 2026-11 확인).
// claude.com 쪽은 '앞으로 바뀔 수 있다'고 안내된 주소라 미리 넣어 둔다.
const CLAUDE_CALLBACKS = new Set([
	"https://claude.ai/api/mcp/auth_callback",
	"https://claude.com/api/mcp/auth_callback",
]);

const DAY = 24 * 60 * 60;

type Props = { deviceId: string };

export function redirectAllowed(uri: string, env: { ALLOW_LOOPBACK_REDIRECTS?: string }): boolean {
	if (CLAUDE_CALLBACKS.has(uri)) return true;
	if (env.ALLOW_LOOPBACK_REDIRECTS !== "true") return false;
	try {
		const url = new URL(uri);
		return (
			url.protocol === "http:" &&
			(url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]") &&
			!url.username &&
			!url.password &&
			!url.hash
		);
	} catch {
		return false;
	}
}

type Servers = {
	origin: string;
	resource: string;
	authorization: OAuthAuthorizationServer<Env>;
	protectedResource: OAuthResourceServer<Env, Props>;
};

let cached: Servers | null = null;

// 발급자·리소스 주소는 만들 때 정해진다. 배포(PUBLIC_ORIGIN)마다 하나만 만들어 재사용한다.
function servers(env: Env): Servers {
	const origin = env.PUBLIC_ORIGIN.replace(/\/+$/, "");
	if (cached && cached.origin === origin) return cached;
	const resource = `${origin}/mcp`;

	const authorization = new OAuthAuthorizationServer<Env>({
		issuer: origin,
		resources: [resource],
		defaultResource: resource,
		authorizeEndpoint: "/authorize",
		tokenEndpoint: "/oauth/token",
		clientRegistrationEndpoint: "/oauth/register",
		scopesSupported: SCOPES,
		clientIdMetadataDocumentEnabled: true,
		accessTokenTTL: 3600,
		// 한 달 안에 한 번이라도 쓰면 연결이 이어지고, 한 달 내내 안 쓰면 끊긴다
		refreshTokenTTL: 30 * DAY,
		refreshTokenIdleTTL: 30 * DAY,
		clientRegistrationTTL: 90 * DAY,
		clientRegistrationCallback: ({ clientMetadata }) => {
			const uris = clientMetadata.redirect_uris;
			if (
				!Array.isArray(uris) ||
				uris.length === 0 ||
				!uris.every((u) => typeof u === "string" && redirectAllowed(u, env))
			) {
				return {
					code: "invalid_redirect_uri",
					description: "Only Claude's callback URLs (and loopback addresses for local tools) can be registered.",
				};
			}
		},
		onError: ({ code, status, internal }) => {
			// 바깥으로 나가는 문구는 라이브러리가 정한 대로 두고, 까닭만 서버 기록에 남긴다 (토큰·자료는 남기지 않는다)
			if (status >= 500) console.error("oauth error", code, status, internal?.reason ?? "");
		},
	});

	const protectedResource = new OAuthResourceServer<Env, Props>({
		resourceMetadata: {
			resource,
			authorization_servers: [origin],
			resource_name: "Daling",
		},
		requiredScopes: [READ_SCOPE, WRITE_SCOPE],
		validateToken: (env) => (res, token) => authorization.validateToken<Props>(res, token, env),
		handler: {
			async fetch(request, env, ctx) {
				if (!ctx.auth.scope.includes(READ_SCOPE)) return new Response("insufficient scope", { status: 403 });
				const deviceId = ctx.props?.deviceId;
				if (typeof deviceId !== "string" || !/^[0-9a-f]{64}$/.test(deviceId)) {
					return new Response("invalid token", { status: 401 });
				}
				// 이 토큰이 가리키는 PC 하나에만 닿는다. 도구 입력에는 PC 를 고르는 칸이 없다.
				const relay = env.DEVICE_RELAY.get(env.DEVICE_RELAY.idFromName(deviceId));
				const mcp = createMcpHandler(
					() =>
						buildServer({
							call: (op, args) => relay.call(op, args),
							canWrite: ctx.auth.scope.includes(WRITE_SCOPE),
							allow: async () => (await env.TOOL_LIMITER.limit({ key: deviceId })).success,
						}),
					{ route: "/mcp", allowedHostnames: [new URL(origin).hostname] },
				);
				return mcp(request, env, ctx);
			},
		},
	});

	cached = { origin, resource, authorization, protectedResource };
	return cached;
}

function html(body: string, status = 200, extra?: Headers): Response {
	const headers = new Headers(PAGE_HEADERS);
	extra?.forEach((value, key) => headers.append(key, value));
	return new Response(body, { status, headers });
}

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
	});
}

function clientIp(request: Request): string {
	return request.headers.get("CF-Connecting-IP") ?? "local";
}

// ===== 동의 화면 =====

async function authorize(request: Request, env: Env, s: Servers): Promise<Response> {
	const oauth = s.authorization.getOAuthApi(env);

	if (request.method === "GET") {
		let authRequest: AuthRequest;
		try {
			authRequest = await oauth.parseAuthRequest(request);
		} catch (error) {
			if (error instanceof AuthorizationError) {
				if (error.redirectTo) return Response.redirect(error.redirectTo, 302);
				return html(messagePage("연결할 수 없어요", "요청이 올바르지 않아요. Claude 에서 다시 연결해 주세요."), 400);
			}
			if (error instanceof CimdFetchError) {
				return html(messagePage("연결할 수 없어요", "연결하려는 프로그램의 정보를 확인하지 못했어요."), 400);
			}
			throw error;
		}
		if (!redirectAllowed(authRequest.redirectUri, env)) {
			return html(messagePage("연결할 수 없어요", "Daling 은 Claude 에서만 연결할 수 있어요."), 400);
		}
		const consent = await oauth.describeConsent(authRequest);
		const tx = await oauth.beginConsent(authRequest);
		return html(
			consentPage({
				handle: tx.handle,
				clientName: consent.clientName,
				clientDomain: consent.clientDomain,
				redirectHost: consent.redirectHost,
				redirectIsLoopback: consent.redirectIsLoopback,
			}),
			200,
			tx.headers,
		);
	}

	if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

	const form = await request.formData();
	const handle = String(form.get("handle") ?? "");
	const view = {
		handle,
		clientName: String(form.get("client_name") ?? "").slice(0, 120),
		clientDomain: String(form.get("client_domain") ?? "").slice(0, 200) || undefined,
		redirectHost: String(form.get("redirect_host") ?? "").slice(0, 200),
		redirectIsLoopback: form.get("redirect_loopback") === "1",
		allowWrite: form.get("allow_write") === "1",
	};

	if (form.get("action") === "deny") {
		try {
			const denied = await oauth.denyConsent(request, handle);
			const headers = new Headers(denied.headers);
			headers.set("Location", denied.redirectTo);
			return new Response(null, { status: 302, headers });
		} catch (error) {
			if (error instanceof AuthorizationError) return html(messagePage("연결을 거절했어요", "이 창을 닫아도 됩니다."), 400);
			throw error;
		}
	}

	// 코드 맞히기를 막는다: IP 하나당 분당 20번 (코드는 31^8 가지, 10분짜리)
	if (!(await env.CODE_LIMITER.limit({ key: `authorize:${clientIp(request)}` })).success) {
		return html(consentPage({ ...view, error: "너무 여러 번 시도했어요. 1분 뒤에 다시 넣어 주세요." }), 429);
	}

	const code = String(form.get("code") ?? "");
	const pairing = env.PAIRING.get(env.PAIRING.idFromName("global"));
	const deviceId = await pairing.redeem(code);
	if (!deviceId) {
		return html(
			consentPage({
				...view,
				error: "코드가 맞지 않거나 시간이 지났어요. Daling 앱에서 새 코드를 받아 넣어 주세요.",
			}),
			400,
		);
	}

	let approved;
	try {
		const scope = [READ_SCOPE, ...(view.allowWrite ? [WRITE_SCOPE] : []), "offline_access"];
		approved = await oauth.approveConsent(request, handle, { scope });
	} catch (error) {
		if (error instanceof AuthorizationError) {
			return html(
				messagePage("다시 시도해 주세요", "연결 화면이 오래되었어요. Claude 에서 다시 연결하고, Daling 앱에서 새 코드를 받아 주세요."),
				400,
			);
		}
		throw error;
	}

	const { redirectTo } = await oauth.completeAuthorization({
		request: approved.request,
		userId: deviceId,
		metadata: { clientName: view.clientName || null, connectedAt: Date.now() },
		scope: approved.request.scope,
		props: { deviceId } satisfies Props,
	});
	const headers = new Headers(approved.headers);
	headers.set("Location", redirectTo);
	return new Response(null, { status: 302, headers });
}

// ===== PC(Daling 앱) 쪽 =====

const DEVICE_SECRET = /^[A-Za-z0-9_-]{43,128}$/;

async function deviceIdFrom(request: Request): Promise<string | null> {
	const auth = request.headers.get("Authorization") ?? "";
	const secret = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
	if (!DEVICE_SECRET.test(secret)) return null;
	// 기기 id = 비밀값의 SHA-256. 서버에는 비밀값이 남지 않고, id 만으로는 PC 행세를 할 수 없다.
	return sha256Hex(`daling-device:${secret}`);
}

async function device(request: Request, env: Env, s: Servers, path: string): Promise<Response> {
	const deviceId = await deviceIdFrom(request);
	if (!deviceId) return json({ error: "unauthorized" }, 401);
	// IP 가 아니라 PC 마다 센다. 학교 망에서는 여러 학생의 PC 가 같은 IP 로 나온다.
	if (!(await env.DEVICE_LIMITER.limit({ key: deviceId })).success) {
		return json({ error: "rate_limited" }, 429);
	}
	const relay = env.DEVICE_RELAY.get(env.DEVICE_RELAY.idFromName(deviceId));

	if (path === "/device/connect") {
		if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") return json({ error: "expected_websocket" }, 426);
		return relay.fetch(request);
	}

	if (path === "/device/pair" && request.method === "POST") {
		const pairing = env.PAIRING.get(env.PAIRING.idFromName("global"));
		const { code, expiresAt } = await pairing.create(deviceId);
		return json({ code, expiresAt: new Date(expiresAt).toISOString(), connectorUrl: s.resource });
	}

	const oauth = s.authorization.getOAuthApi(env);

	if (path === "/device/status" && request.method === "GET") {
		const [link, grants] = await Promise.all([relay.status(), oauth.listUserGrants(deviceId, { limit: 50 })]);
		return json({
			connected: link.connected,
			connectorUrl: s.resource,
			grants: grants.items.map((g) => ({
				id: g.id,
				clientName: (g.metadata as { clientName?: string } | null)?.clientName ?? null,
				canWrite: g.scope.includes(WRITE_SCOPE),
				createdAt: new Date(g.createdAt * (g.createdAt < 1e12 ? 1000 : 1)).toISOString(),
			})),
		});
	}

	if (path === "/device/revoke" && request.method === "POST") {
		let body: { grantId?: unknown; all?: unknown } = {};
		try {
			body = await request.json();
		} catch {
			return json({ error: "invalid" }, 400);
		}
		const grants = await oauth.listUserGrants(deviceId, { limit: 100 });
		const targets = body.all === true ? grants.items : grants.items.filter((g) => g.id === body.grantId);
		for (const g of targets) await oauth.revokeGrant(g.id, deviceId);
		return json({ revoked: targets.length });
	}

	return json({ error: "not_found" }, 404);
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;
		try {
			const s = servers(env);
			if (path === "/mcp" || path.startsWith("/mcp/") || path.startsWith("/.well-known/oauth-protected-resource")) {
				return await s.protectedResource.fetch(request, env, ctx);
			}
			if (path === "/authorize") return await authorize(request, env, s);
			if (path.startsWith("/device/")) return await device(request, env, s, path);
			if (path === "/" && request.method === "GET") return html(landingPage(s.resource));
			if (path === "/robots.txt") return new Response("User-agent: *\nDisallow: /\n", { headers: { "Content-Type": "text/plain" } });
			return await s.authorization.fetch(request, env, ctx);
		} catch (error) {
			// 내부 사정(스택·키 이름)은 응답에 싣지 않는다
			console.error("unhandled", path, error instanceof Error ? `${error.name}: ${error.message}`.slice(0, 300) : "unknown");
			return new Response("Internal error", { status: 500 });
		}
	},
} satisfies ExportedHandler<Env>;
