import { describe, expect, it } from "vitest";
import { redirectAllowed } from "../src/index";
import { normalizeCode } from "../src/relay";
import { nowSeoulIso, parseSeoulInput, toSeoulIso } from "../src/time";
import { deadlineStatus, filterDeadlines, formatDeadline } from "../src/tools";

describe("서울 시각", () => {
	it("UTC 를 +09:00 으로 바꾼다", () => {
		expect(toSeoulIso("2026-11-20T14:59:00Z")).toBe("2026-11-20T23:59:00+09:00");
		expect(toSeoulIso("2026-12-31T15:00:00Z")).toBe("2027-01-01T00:00:00+09:00");
		expect(toSeoulIso("not a date")).toBeNull();
		expect(toSeoulIso(null)).toBeNull();
	});

	it("시간대 없는 입력은 서울 시각으로 읽는다", () => {
		expect(new Date(parseSeoulInput("2026-11-20T18:00") as number).toISOString()).toBe("2026-11-20T09:00:00.000Z");
		expect(new Date(parseSeoulInput("2026-11-20", "start") as number).toISOString()).toBe("2026-11-19T15:00:00.000Z");
		expect(new Date(parseSeoulInput("2026-11-20", "end") as number).toISOString()).toBe("2026-11-20T14:59:59.999Z");
		expect(new Date(parseSeoulInput("2026-11-20", "due") as number).toISOString()).toBe("2026-11-20T14:59:00.000Z");
	});

	it("시간대가 붙은 입력은 그대로 쓴다", () => {
		expect(new Date(parseSeoulInput("2026-11-20T18:00:00Z") as number).toISOString()).toBe("2026-11-20T18:00:00.000Z");
		expect(new Date(parseSeoulInput("2026-11-20T18:00+09:00") as number).toISOString()).toBe("2026-11-20T09:00:00.000Z");
	});

	it("없는 날짜·이상한 글은 거절한다", () => {
		expect(parseSeoulInput("2026-02-30")).toBeNull();
		expect(parseSeoulInput("2026-13-01")).toBeNull();
		expect(parseSeoulInput("next friday")).toBeNull();
		expect(parseSeoulInput("2026-11-20T25:00")).toBeNull();
	});

	it("지금 시각도 서울로", () => {
		expect(nowSeoulIso(Date.parse("2026-11-05T00:00:00Z"))).toBe("2026-11-05T09:00:00+09:00");
	});
});

describe("마감 걸러 내기", () => {
	const now = Date.parse("2026-11-05T03:00:00Z"); // 서울 12:00
	const items = [
		{ id: "lms:1:1", source: "lms" as const, title: "HW1", course: "선형대수", due: "2026-11-01T14:59:00Z", myStatus: "None" },
		{ id: "lms:1:2", source: "lms" as const, title: "HW2", course: "선형대수", due: "2026-11-10T14:59:00Z", myStatus: "NeedsGrading" },
		{ id: "lms:2:1", source: "lms" as const, title: "Lab", course: "Physics", due: "2026-11-07T14:59:00Z", myStatus: null },
		{ id: "my:aa", source: "manual" as const, title: "팀 회의", course: "", due: "2026-11-06T09:00:00Z", myStatus: "Done" },
		{ id: "my:bb", source: "manual" as const, title: "동아리", course: "", due: "2026-11-08T09:00:00Z", myStatus: null, hidden: true },
	];
	const base = { status: "all", fromMs: null, toMs: null, source: "all", includeDeleted: false };

	it("상태를 나눈다", () => {
		expect(deadlineStatus(items[0], now)).toBe("overdue");
		expect(deadlineStatus(items[1], now)).toBe("submitted");
		expect(deadlineStatus(items[2], now)).toBe("upcoming");
		expect(deadlineStatus(items[3], now)).toBe("done");
		expect(deadlineStatus({ ...items[2], due: null }, now)).toBe("no_due_date");
	});

	it("지운(숨긴) 것은 기본으로 빼고, 마감 순으로 준다", () => {
		expect(filterDeadlines(items, base, now).map((i) => i.id)).toEqual(["lms:1:1", "my:aa", "lms:2:1", "lms:1:2"]);
		expect(filterDeadlines(items, { ...base, includeDeleted: true }, now).map((i) => i.id)).toContain("my:bb");
	});

	it("upcoming·overdue·open·done", () => {
		expect(filterDeadlines(items, { ...base, status: "upcoming" }, now).map((i) => i.id)).toEqual(["lms:2:1"]);
		expect(filterDeadlines(items, { ...base, status: "overdue" }, now).map((i) => i.id)).toEqual(["lms:1:1"]);
		expect(filterDeadlines(items, { ...base, status: "open" }, now).map((i) => i.id)).toEqual(["lms:1:1", "lms:2:1"]);
		expect(filterDeadlines(items, { ...base, status: "done" }, now).map((i) => i.id)).toEqual(["my:aa", "lms:1:2"]);
	});

	it("기간·과목·출처", () => {
		const fromMs = parseSeoulInput("2026-11-06", "start");
		const toMs = parseSeoulInput("2026-11-07", "end");
		expect(filterDeadlines(items, { ...base, fromMs, toMs }, now).map((i) => i.id)).toEqual(["my:aa", "lms:2:1"]);
		expect(filterDeadlines(items, { ...base, course: "PHYS" }, now).map((i) => i.id)).toEqual(["lms:2:1"]);
		expect(filterDeadlines(items, { ...base, source: "manual" }, now).map((i) => i.id)).toEqual(["my:aa"]);
	});

	it("내보낼 때 서울 시각·점수·메모", () => {
		const lms = formatDeadline({ ...items[1], myScore: 9, pointsPossible: 10 }, now);
		expect(lms).toMatchObject({ due: "2026-11-10T23:59:00+09:00", status: "submitted", score: 9, pointsPossible: 10 });
		const mine = formatDeadline({ ...items[4], note: "회의실 B" }, now);
		expect(mine).toMatchObject({ source: "manual", note: "회의실 B", deleted: true });
		expect(mine).not.toHaveProperty("score");
	});
});

describe("콜백 주소", () => {
	const loopbackOn = { ALLOW_LOOPBACK_REDIRECTS: "true" };
	const loopbackOff = { ALLOW_LOOPBACK_REDIRECTS: "false" };

	it("Claude 콜백은 늘 된다", () => {
		expect(redirectAllowed("https://claude.ai/api/mcp/auth_callback", loopbackOff)).toBe(true);
		expect(redirectAllowed("https://claude.com/api/mcp/auth_callback", loopbackOff)).toBe(true);
	});

	it("비슷한 주소는 막는다", () => {
		expect(redirectAllowed("https://claude.ai/api/mcp/auth_callback/../x", loopbackOn)).toBe(false);
		expect(redirectAllowed("https://claude.ai.evil.example/api/mcp/auth_callback", loopbackOn)).toBe(false);
		expect(redirectAllowed("https://evil.example/cb", loopbackOn)).toBe(false);
		expect(redirectAllowed("http://claude.ai/api/mcp/auth_callback", loopbackOn)).toBe(false);
	});

	it("이 컴퓨터 주소는 켰을 때만, http 로만", () => {
		expect(redirectAllowed("http://localhost:6274/oauth/callback", loopbackOn)).toBe(true);
		expect(redirectAllowed("http://127.0.0.1:33418/callback", loopbackOn)).toBe(true);
		expect(redirectAllowed("http://localhost:6274/oauth/callback", loopbackOff)).toBe(false);
		expect(redirectAllowed("http://user:pw@localhost:6274/cb", loopbackOn)).toBe(false);
		expect(redirectAllowed("http://localhost.evil.example/cb", loopbackOn)).toBe(false);
	});
});

describe("연결 코드", () => {
	it("대시·소문자·공백을 무시한다", () => {
		expect(normalizeCode(" abcd-2345 ")).toBe("ABCD2345");
	});
});
