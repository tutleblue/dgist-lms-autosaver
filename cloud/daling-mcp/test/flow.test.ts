import { describe, expect, it } from "vitest";
import {
	CLAUDE_CALLBACK,
	callTool,
	connectClaude,
	connectFakePc,
	exchangeCode,
	fetchWorker,
	mcp,
	openConsent,
	pairCode,
	pkce,
	randomSecret,
	registerClient,
	submitConsent,
	toolJson,
} from "./helpers";

// 가짜 PC 두 대. 각자 자기 자료만 갖고 있다.
function pcData(owner: string) {
	return (op: string, args: any) => {
		switch (op) {
			case "deadlines.list":
				return {
					ok: true as const,
					data: {
						updatedAt: "2026-11-05T00:00:00Z",
						items: [
							{
								id: `lms:${owner}:1`,
								source: "lms",
								title: `${owner} 과제`,
								course: `${owner} 과목`,
								due: "2099-01-01T14:59:00Z",
								myStatus: null,
							},
						],
					},
				};
			case "materials.list":
				return { ok: true as const, data: { total: 1, items: [{ id: "m_0123456789abcdef", name: `${owner}.pdf`, savedAt: "2026-11-01T10:00:00" }] } };
			case "deadlines.create":
				return {
					ok: true as const,
					data: { id: "my:abc", source: "manual", title: args.title, course: args.course, due: args.due, myStatus: null, note: args.note },
				};
			case "deadlines.hide":
				return {
					ok: true as const,
					data: { id: args.id, source: "manual", title: "x", course: "", due: "2099-01-01T00:00:00Z", myStatus: null, hidden: args.hidden },
				};
			default:
				return { ok: false as const, error: { code: "unsupported_op" } };
		}
	};
}

async function waitUntilOffline(secret: string) {
	for (let i = 0; i < 50; i++) {
		const res = await fetchWorker("/device/status", { headers: { Authorization: `Bearer ${secret}` } });
		if (!((await res.json()) as { connected: boolean }).connected) return;
		await new Promise((r) => setTimeout(r, 20));
	}
	throw new Error("still connected");
}

describe("메타데이터·첫 응답", () => {
	it("RFC 9728 보호 자원 메타데이터", async () => {
		const res = await fetchWorker("/.well-known/oauth-protected-resource/mcp");
		expect(res.status).toBe(200);
		const body = (await res.json()) as any;
		expect(body.resource).toBe("http://localhost:8787/mcp");
		expect(body.authorization_servers).toEqual(["http://localhost:8787"]);
	});

	it("RFC 8414 인가 서버 메타데이터 (PKCE S256·DCR·CIMD)", async () => {
		const res = await fetchWorker("/.well-known/oauth-authorization-server");
		expect(res.status).toBe(200);
		const body = (await res.json()) as any;
		expect(body.issuer).toBe("http://localhost:8787");
		expect(body.authorization_endpoint).toBe("http://localhost:8787/authorize");
		expect(body.token_endpoint).toBe("http://localhost:8787/oauth/token");
		expect(body.registration_endpoint).toBe("http://localhost:8787/oauth/register");
		expect(body.code_challenge_methods_supported).toContain("S256");
		expect(body.code_challenge_methods_supported).not.toContain("plain");
		expect(body.client_id_metadata_document_supported).toBe(true);
	});

	it("토큰 없이 /mcp → 401 + resource_metadata 안내", async () => {
		const res = await mcp(null, "initialize", {});
		expect(res.status).toBe(401);
		expect(res.headers.get("WWW-Authenticate")).toContain('resource_metadata="http://localhost:8787/.well-known/oauth-protected-resource/mcp"');
	});

	it("가짜 토큰 → 401", async () => {
		const res = await mcp("abc:def:ghi", "initialize", {});
		expect(res.status).toBe(401);
	});
});

describe("클라이언트 등록 (DCR)", () => {
	it("Claude 콜백은 받는다", async () => {
		const res = await registerClient();
		expect(res.status).toBe(201);
		expect(((await res.json()) as any).client_id).toBeTruthy();
	});

	it("다른 콜백은 거절한다", async () => {
		const res = await registerClient(["https://evil.example/callback"]);
		expect(res.status).toBe(400);
		expect(((await res.json()) as any).error).toBe("invalid_redirect_uri");
	});

	it("섞여 있어도 거절한다", async () => {
		const res = await registerClient([CLAUDE_CALLBACK, "https://evil.example/callback"]);
		expect(res.status).toBe(400);
	});
});

describe("동의 화면과 연결 코드", () => {
	it("틀린 코드는 거절하고, 같은 화면에서 맞는 코드를 넣으면 된다", async () => {
		const secret = randomSecret();
		const reg = (await (await registerClient()).json()) as { client_id: string };
		const { verifier, challenge } = await pkce();
		const page = await openConsent(reg.client_id, challenge);
		expect(page.status).toBe(200);
		expect(page.html).toContain("연결 코드");
		expect(page.handle).toBeTruthy();

		const wrong = await submitConsent(page, { code: "ZZZZ-ZZZZ" });
		expect(wrong.status).toBe(400);
		expect(await wrong.text()).toContain("코드가 맞지 않거나");

		const code = await pairCode(secret);
		const ok = await submitConsent(page, { code });
		expect(ok.status).toBe(302);
		const location = new URL(ok.headers.get("Location") ?? "");
		expect(`${location.origin}${location.pathname}`).toBe(CLAUDE_CALLBACK);
		expect(location.searchParams.get("state")).toBe("st-1");

		// PKCE: 다른 verifier 로는 토큰을 못 받는다
		const bad = await exchangeCode(reg.client_id, location.searchParams.get("code") ?? "", "x".repeat(43));
		expect(bad.status).toBe(400);
		void verifier;
	});

	it("코드는 한 번만 쓴다", async () => {
		const secret = randomSecret();
		const code = await pairCode(secret);
		const reg = (await (await registerClient()).json()) as { client_id: string };
		const first = await openConsent(reg.client_id, (await pkce()).challenge);
		expect((await submitConsent(first, { code })).status).toBe(302);
		const second = await openConsent(reg.client_id, (await pkce()).challenge);
		expect((await submitConsent(second, { code })).status).toBe(400);
	});

	it("새 코드를 받으면 앞의 코드는 못 쓴다", async () => {
		const secret = randomSecret();
		const old = await pairCode(secret);
		await pairCode(secret);
		const reg = (await (await registerClient()).json()) as { client_id: string };
		const page = await openConsent(reg.client_id, (await pkce()).challenge);
		expect((await submitConsent(page, { code: old })).status).toBe(400);
	});

	it("거절하면 access_denied 로 돌아간다", async () => {
		const reg = (await (await registerClient()).json()) as { client_id: string };
		const page = await openConsent(reg.client_id, (await pkce()).challenge);
		const res = await submitConsent(page, { code: "", action: "deny" });
		expect(res.status).toBe(302);
		expect(new URL(res.headers.get("Location") ?? "").searchParams.get("error")).toBe("access_denied");
	});

	it("등록 안 된 콜백으로 가는 요청은 화면조차 안 연다", async () => {
		const reg = (await (await registerClient()).json()) as { client_id: string };
		const params = new URLSearchParams({
			response_type: "code",
			client_id: reg.client_id,
			redirect_uri: "https://evil.example/cb",
			code_challenge: (await pkce()).challenge,
			code_challenge_method: "S256",
		});
		const res = await fetchWorker(`/authorize?${params}`);
		expect(res.status).toBe(400);
		expect(await res.text()).not.toContain('name="code"');
	});

	it("코드 맞히기는 분당 20번에서 막힌다", async () => {
		const reg = (await (await registerClient()).json()) as { client_id: string };
		const page = await openConsent(reg.client_id, (await pkce()).challenge);
		const form = (code: string) =>
			fetchWorker("/authorize", {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: page.cookie, "CF-Connecting-IP": "203.0.113.7" },
				body: new URLSearchParams({ handle: page.handle, code, action: "approve" }),
			});
		const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
		const statuses: number[] = [];
		for (let i = 0; i < 22; i++) statuses.push((await form(`QQQQ-QQQ${alphabet[i]}`)).status);
		expect(statuses.slice(0, 20).every((s) => s === 400)).toBe(true);
		expect(statuses.at(-1)).toBe(429);
	});
});

describe("PC 쪽 주소", () => {
	it("비밀값이 없거나 짧으면 401", async () => {
		expect((await fetchWorker("/device/pair", { method: "POST" })).status).toBe(401);
		expect((await fetchWorker("/device/pair", { method: "POST", headers: { Authorization: "Bearer short" } })).status).toBe(401);
		expect((await fetchWorker("/device/status", { headers: { Authorization: "Bearer " } })).status).toBe(401);
	});

	it("코드 형식과 만료 시각", async () => {
		const res = await fetchWorker("/device/pair", { method: "POST", headers: { Authorization: `Bearer ${randomSecret()}` } });
		const body = (await res.json()) as any;
		expect(body.code).toMatch(/^[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/);
		const ttl = Date.parse(body.expiresAt) - Date.now();
		expect(ttl).toBeGreaterThan(9 * 60 * 1000);
		expect(ttl).toBeLessThanOrEqual(10 * 60 * 1000);
		expect(body.connectorUrl).toBe("http://localhost:8787/mcp");
	});
});

describe("MCP 도구", () => {
	it("도구 13개, 이름·주석", async () => {
		const secret = randomSecret();
		const token = await connectClaude(secret);
		await mcp(token, "initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } });
		const res = await mcp(token, "tools/list");
		expect(res.status).toBe(200);
		const tools = res.body.result.tools as any[];
		const byName = Object.fromEntries(tools.map((t) => [t.name, t]));
		expect(Object.keys(byName).sort()).toEqual(
			[
				"complete_deadline",
				"create_deadline",
				"create_material_folder",
				"delete_deadline",
				"get_deadline",
				"get_material",
				"list_deadlines",
				"list_folders",
				"list_materials",
				"restore_deadline",
				"search_materials",
				"update_deadline",
				"update_material",
			].sort(),
		);
		for (const name of ["list_materials", "search_materials", "get_material", "list_folders", "list_deadlines", "get_deadline"]) {
			expect(byName[name].annotations.readOnlyHint, name).toBe(true);
		}
		for (const name of ["update_material", "update_deadline", "complete_deadline", "delete_deadline"]) {
			expect(byName[name].annotations.destructiveHint, name).toBe(true);
			expect(byName[name].annotations.readOnlyHint, name).toBe(false);
		}
		for (const name of ["create_deadline", "create_material_folder", "restore_deadline"]) {
			expect(byName[name].annotations.destructiveHint, name).toBe(false);
			expect(byName[name].annotations.readOnlyHint, name).toBe(false);
		}
	});

	it("PC 가 꺼져 있으면 알기 쉬운 오류", async () => {
		const token = await connectClaude(randomSecret());
		const result = await callTool(token, "list_deadlines", { status: "all" });
		expect(result.isError).toBe(true);
		expect(result.content[0].text).toContain("Daling is not running");
	});

	it("마감 목록은 서울 시각으로", async () => {
		const secret = randomSecret();
		const pc = await connectFakePc(secret, pcData("A"));
		const token = await connectClaude(secret);
		const data = toolJson(await callTool(token, "list_deadlines", { status: "all" }));
		expect(data.items[0]).toMatchObject({ id: "lms:A:1", due: "2099-01-01T23:59:00+09:00", status: "upcoming" });
		expect(data.now).toMatch(/\+09:00$/);
		expect(pc.calls[0]).toEqual({ op: "deadlines.list", args: { includeHidden: false } });
		pc.close();
	});

	it("입력 검증: 잘못된 id·날짜는 PC 까지 가지 않는다", async () => {
		const secret = randomSecret();
		const pc = await connectFakePc(secret, pcData("A"));
		const token = await connectClaude(secret);
		const badId = await callTool(token, "get_material", { id: "../../etc/passwd" });
		expect(badId.isError).toBe(true);
		const badDate = await callTool(token, "create_deadline", { title: "x", due: "2026-02-30" });
		expect(badDate.isError).toBe(true);
		expect(badDate.content[0].text).toContain("ISO 8601");
		expect(pc.calls).toEqual([]);
		pc.close();
	});

	it("만들기는 서울 23:59 로, 지우기는 숨기기로", async () => {
		const secret = randomSecret();
		const pc = await connectFakePc(secret, pcData("A"));
		const token = await connectClaude(secret);
		const created = toolJson(await callTool(token, "create_deadline", { title: "팀 회의", due: "2026-11-20", course: "캡스톤" }));
		expect(created).toMatchObject({ id: "my:abc", due: "2026-11-20T23:59:00+09:00", source: "manual" });
		expect(pc.calls[0].args.due).toBe("2026-11-20T14:59:00.000Z");
		const deleted = toolJson(await callTool(token, "delete_deadline", { id: "my:abc" }));
		expect(deleted).toMatchObject({ deleted: true, restorable: true });
		expect(pc.calls[1]).toEqual({ op: "deadlines.hide", args: { id: "my:abc", hidden: true } });
		pc.close();
	});

	it("LMS 과제는 고치거나 완료 처리하지 않는다", async () => {
		const secret = randomSecret();
		const pc = await connectFakePc(secret, pcData("A"));
		const token = await connectClaude(secret);
		const res = await callTool(token, "update_deadline", { id: "lms:1:2", title: "x" });
		expect(res.isError).toBe(true);
		const done = await callTool(token, "complete_deadline", { id: "lms:1:2" });
		expect(done.isError).toBe(true);
		expect(pc.calls).toEqual([]);
		pc.close();
	});

	it("읽기만 허용한 연결은 바꾸지 못한다", async () => {
		const secret = randomSecret();
		const pc = await connectFakePc(secret, pcData("A"));
		const token = await connectClaude(secret, { allowWrite: false });
		const read = await callTool(token, "list_deadlines", { status: "all" });
		expect(read.isError).toBeFalsy();
		for (const [name, args] of [
			["create_deadline", { title: "x", due: "2026-11-20" }],
			["delete_deadline", { id: "my:abc" }],
			["update_material", { id: "m_0123456789abcdef", hidden: true }],
			["create_material_folder", { name: "x" }],
		] as const) {
			const res = await callTool(token, name, args);
			expect(res.isError, name).toBe(true);
			expect(res.content[0].text, name).toContain("reading only");
		}
		expect(pc.calls.map((c) => c.op)).toEqual(["deadlines.list"]);
		pc.close();
	});

	it("PC 내부 오류 문구는 Claude 에 넘기지 않는다", async () => {
		const secret = randomSecret();
		const pc = await connectFakePc(secret, () => ({
			ok: false,
			error: { code: "internal", message: "Traceback: C:\\lms-autosaver\\deadlines.json KeyError" },
		}));
		const token = await connectClaude(secret);
		const res = await callTool(token, "list_folders");
		expect(res.isError).toBe(true);
		expect(res.content[0].text).not.toContain("lms-autosaver");
		expect(res.content[0].text).not.toContain("Traceback");
		pc.close();
	});
});

describe("다른 사용자 자료는 볼 수 없다", () => {
	it("토큰은 자기 PC 에만 닿는다", async () => {
		const secretA = randomSecret();
		const secretB = randomSecret();
		const pcA = await connectFakePc(secretA, pcData("A"));
		const pcB = await connectFakePc(secretB, pcData("B"));
		const tokenA = await connectClaude(secretA);
		const tokenB = await connectClaude(secretB);

		const a = toolJson(await callTool(tokenA, "list_deadlines", { status: "all" }));
		const b = toolJson(await callTool(tokenB, "list_deadlines", { status: "all" }));
		expect(a.items.map((i: any) => i.id)).toEqual(["lms:A:1"]);
		expect(b.items.map((i: any) => i.id)).toEqual(["lms:B:1"]);
		expect(pcA.calls).toHaveLength(1);
		expect(pcB.calls).toHaveLength(1);

		// 도구 입력에 다른 PC 를 적어 봐도 무시된다 (스키마에 그런 칸이 없다)
		const sneaky = toolJson(
			await callTool(tokenA, "list_materials", { device_id: "b".repeat(64), deviceId: "b".repeat(64), user: "B" } as any),
		);
		expect(sneaky.items[0].name).toBe("A.pdf");
		expect(pcB.calls).toHaveLength(1);

		// A 의 PC 가 꺼지면 A 는 '꺼져 있음' 만 받는다. 켜져 있는 B 로 넘어가지 않는다.
		pcA.close();
		await waitUntilOffline(secretA);
		const offline = await callTool(tokenA, "list_deadlines", { status: "all" });
		expect(offline.isError).toBe(true);
		expect(offline.content[0].text).toContain("Daling is not running");
		expect(offline.content[0].text).not.toContain("B");
		expect(pcB.calls).toHaveLength(1);
		pcB.close();
	});

	it("A 의 비밀값을 모르면 A 의 PC 행세를 할 수 없다", async () => {
		const secretA = randomSecret();
		const pcA = await connectFakePc(secretA, pcData("A"));
		const tokenA = await connectClaude(secretA);
		// 공격자는 자기 비밀값으로만 붙을 수 있고, 그건 다른 기기 id 가 된다
		const attacker = await connectFakePc(randomSecret(), pcData("EVIL"));
		const data = toolJson(await callTool(tokenA, "list_deadlines", { status: "all" }));
		expect(data.items[0].id).toBe("lms:A:1");
		expect(attacker.calls).toEqual([]);
		pcA.close();
		attacker.close();
	});

	it("연결 목록·끊기도 자기 것만", async () => {
		const secretA = randomSecret();
		const secretB = randomSecret();
		const tokenA = await connectClaude(secretA);
		await connectClaude(secretB);
		const statusA = (await (await fetchWorker("/device/status", { headers: { Authorization: `Bearer ${secretA}` } })).json()) as any;
		const statusB = (await (await fetchWorker("/device/status", { headers: { Authorization: `Bearer ${secretB}` } })).json()) as any;
		expect(statusA.grants).toHaveLength(1);
		expect(statusB.grants).toHaveLength(1);
		expect(statusA.grants[0].canWrite).toBe(true);

		// B 가 A 의 연결 id 로 끊기를 보내도 아무 일 없다
		const cross = await fetchWorker("/device/revoke", {
			method: "POST",
			headers: { Authorization: `Bearer ${secretB}`, "Content-Type": "application/json" },
			body: JSON.stringify({ grantId: statusA.grants[0].id }),
		});
		expect(((await cross.json()) as any).revoked).toBe(0);
		expect((await mcp(tokenA, "tools/list")).status).toBe(200);

		// A 가 스스로 끊으면 토큰이 바로 안 된다
		const own = await fetchWorker("/device/revoke", {
			method: "POST",
			headers: { Authorization: `Bearer ${secretA}`, "Content-Type": "application/json" },
			body: JSON.stringify({ all: true }),
		});
		expect(((await own.json()) as any).revoked).toBe(1);
		expect((await mcp(tokenA, "tools/list")).status).toBe(401);
	});
});
