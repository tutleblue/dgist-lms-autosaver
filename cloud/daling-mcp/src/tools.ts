import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import type { RelayResult } from "./relay";
import { nowSeoulIso, parseSeoulInput, toSeoulIso } from "./time";

// 도구 이름·설명은 Claude 가 읽으므로 영어로, 오류 문구도 Claude 가 사용자에게 옮겨 말하기 좋게 영어로 쓴다.
// 사용자 자료(과목명·파일 이름)는 손대지 않고 그대로 넘긴다.

export type ToolDeps = {
	/** 이 토큰의 PC 에만 넘긴다. 어느 PC 인지는 토큰이 정하고, 도구 입력으로는 고를 수 없다. */
	call: (op: string, args: Record<string, unknown>) => Promise<RelayResult>;
	canWrite: boolean;
	/** 속도 제한. false 면 이번 호출은 거절. */
	allow: () => Promise<boolean>;
	now?: () => number;
};

type ToolResult = {
	content: { type: "text"; text: string }[];
	structuredContent?: Record<string, unknown>;
	isError?: boolean;
};

const MESSAGES: Record<string, string> = {
	device_offline:
		"Daling is not running on the user's computer, so their data can't be reached right now. " +
		"Ask the user to turn on the computer where Daling is installed and open the app, then try again.",
	device_timeout: "The user's computer did not answer in time. Try again in a moment.",
	device_busy: "Too many requests are already waiting for the user's computer. Try again in a moment.",
	rate_limited: "Too many requests in a short time. Wait about a minute and try again.",
	write_scope:
		"This connection was approved for reading only. To allow changes, the user must disconnect and reconnect " +
		"the Daling connector in Claude's settings and keep 'Allow changes' checked on the Daling approval page.",
	unsupported_op: "The Daling app on the user's computer is too old for this action. Ask the user to update Daling.",
};

function ok(data: Record<string, unknown>): ToolResult {
	return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
}

function fail(code: string, message?: string): ToolResult {
	// PC 가 준 문구는 우리 앱이 정한 안내(잘못된 입력·찾을 수 없음)일 때만 옮긴다. 그 밖의 내부 사정은 감춘다.
	const passThrough = code === "invalid" || code === "not_found" || code === "read_only";
	const text =
		MESSAGES[code] ??
		(passThrough && message ? message : "Something went wrong in Daling. Try again later.");
	return { content: [{ type: "text", text }], isError: true };
}

// ===== 마감 =====

type RawDeadline = {
	id: string;
	source: "lms" | "manual";
	title: string;
	course: string;
	due: string | null;
	myStatus: string | null;
	myScore?: number | null;
	pointsPossible?: number | null;
	note?: string | null;
	hidden?: boolean;
};

const DONE_STATUSES = new Set(["Graded", "NeedsGrading", "Done"]);

export function deadlineStatus(item: RawDeadline, now: number): string {
	if (item.myStatus === "Graded") return "graded";
	if (item.myStatus === "NeedsGrading") return "submitted";
	if (item.myStatus === "Done") return "done";
	const due = item.due ? Date.parse(item.due) : Number.NaN;
	if (Number.isNaN(due)) return "no_due_date";
	return due < now ? "overdue" : "upcoming";
}

export function formatDeadline(item: RawDeadline, now: number): Record<string, unknown> {
	const out: Record<string, unknown> = {
		id: item.id,
		title: item.title,
		course: item.course || null,
		due: toSeoulIso(item.due),
		status: deadlineStatus(item, now),
		source: item.source,
	};
	if (item.source === "lms") {
		out.score = item.myScore ?? null;
		out.pointsPossible = item.pointsPossible ?? null;
	} else {
		out.note = item.note || null;
	}
	if (item.hidden) out.deleted = true;
	return out;
}

function asDeadlines(data: unknown): RawDeadline[] {
	const items = (data as { items?: unknown })?.items;
	return Array.isArray(items) ? (items.filter((i) => i && typeof i === "object") as RawDeadline[]) : [];
}

export function filterDeadlines(
	items: RawDeadline[],
	opts: {
		status: string;
		fromMs: number | null;
		toMs: number | null;
		course?: string;
		source: string;
		includeDeleted: boolean;
	},
	now: number,
): RawDeadline[] {
	const course = opts.course?.trim().toLowerCase();
	return items
		.filter((item) => {
			if (!opts.includeDeleted && item.hidden) return false;
			if (opts.source !== "all" && item.source !== opts.source) return false;
			if (course && !(item.course || "").toLowerCase().includes(course)) return false;
			const due = item.due ? Date.parse(item.due) : Number.NaN;
			if (opts.fromMs !== null && (Number.isNaN(due) || due < opts.fromMs)) return false;
			if (opts.toMs !== null && (Number.isNaN(due) || due > opts.toMs)) return false;
			const status = deadlineStatus(item, now);
			const done = DONE_STATUSES.has(item.myStatus ?? "");
			switch (opts.status) {
				case "upcoming":
					return status === "upcoming";
				case "overdue":
					return status === "overdue";
				case "open":
					return !done;
				case "done":
					return done;
				default:
					return true;
			}
		})
		.sort((a, b) => {
			const da = a.due ? Date.parse(a.due) : Number.POSITIVE_INFINITY;
			const db = b.due ? Date.parse(b.due) : Number.POSITIVE_INFINITY;
			return da - db;
		});
}

// ===== 자료 =====

function formatMaterial(item: Record<string, unknown>): Record<string, unknown> {
	return { ...item, savedAt: toSeoulIso(typeof item.savedAt === "string" ? item.savedAt : null) };
}

function asMaterialPage(data: unknown): { total: number; items: Record<string, unknown>[] } {
	const page = (data ?? {}) as { total?: unknown; items?: unknown };
	const items = Array.isArray(page.items) ? (page.items as Record<string, unknown>[]) : [];
	return { total: typeof page.total === "number" ? page.total : items.length, items: items.map(formatMaterial) };
}

// ===== 입력 스키마 =====

const DEADLINE_ID = z
	.string()
	.min(3)
	.max(200)
	.regex(/^(lms|my):/, "Deadline ids start with 'lms:' or 'my:'. Use list_deadlines to find one.")
	.describe("Deadline id from list_deadlines, e.g. 'lms:12345:67890' or 'my:3f9a…'.");
const MATERIAL_ID = z
	.string()
	.regex(/^m_[0-9a-f]{16}$/, "Material ids look like 'm_' + 16 hex digits. Use list_materials or search_materials.")
	.describe("Material id from list_materials or search_materials.");
const FOLDER_ID = z.string().min(1).max(80).describe("Folder id from list_folders.");
const DATE_INPUT = z
	.string()
	.min(10)
	.max(40)
	.describe(
		"ISO 8601 date or date-time. Without a time zone it is read as Korea time (Asia/Seoul, +09:00), e.g. '2026-11-20' or '2026-11-20T18:00'.",
	);

const READ = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

export function buildServer(deps: ToolDeps): McpServer {
	const now = deps.now ?? Date.now;
	const server = new McpServer(
		{ name: "daling", title: "Daling", version: "1.0.0" },
		{
			instructions:
				"Daling holds a DGIST student's LMS course materials and assignment deadlines, synced to the Daling app on their computer. " +
				"Times are Korea time (+09:00). LMS assignments come from the LMS and can only be hidden or restored here; " +
				"deadlines the user adds ('my:' ids) can also be edited and completed. Data is only reachable while Daling is open on the user's computer.",
		},
	);

	async function run(op: string, args: Record<string, unknown>): Promise<RelayResult> {
		if (!(await deps.allow())) return { ok: false, error: { code: "rate_limited" } };
		return deps.call(op, args);
	}

	async function runWrite(op: string, args: Record<string, unknown>): Promise<RelayResult> {
		if (!deps.canWrite) return { ok: false, error: { code: "write_scope" } };
		return run(op, args);
	}

	// ----- 자료 -----

	server.registerTool(
		"list_materials",
		{
			title: "List course materials",
			description:
				"List lecture materials (files) Daling downloaded from the DGIST LMS, ordered by course and LMS folder order. " +
				"Filter by course name or LMS folder (partial, case-insensitive). Returns pages of up to 50; use offset to page.",
			inputSchema: z.object({
				course: z.string().max(100).optional().describe("Part of the course name, e.g. 'Linear Algebra' or '선형대수'."),
				folder: z.string().max(100).optional().describe("Part of the LMS folder path, e.g. 'Week 3' or '3주차'."),
				downloaded_only: z.boolean().optional().describe("Only files that exist on the user's computer."),
				limit: z.number().int().min(1).max(50).default(20),
				offset: z.number().int().min(0).max(10000).default(0),
			}),
			annotations: { ...READ, title: "List course materials" },
		},
		async (args) => {
			const res = await run("materials.list", {
				course: args.course ?? "",
				folder: args.folder ?? "",
				downloadedOnly: args.downloaded_only ?? false,
				limit: args.limit,
				offset: args.offset,
			});
			if (!res.ok) return fail(res.error.code, res.error.message);
			const page = asMaterialPage(res.data);
			return ok({ total: page.total, offset: args.offset, count: page.items.length, items: page.items });
		},
	);

	server.registerTool(
		"search_materials",
		{
			title: "Search course materials",
			description:
				"Search the user's course materials by words in the file name, course name or LMS folder path. " +
				"All words must match (case-insensitive).",
			inputSchema: z.object({
				query: z.string().min(1).max(100).describe("Words to look for, e.g. 'midterm review' or '중간고사'."),
				course: z.string().max(100).optional().describe("Limit to courses whose name contains this."),
				limit: z.number().int().min(1).max(50).default(20),
			}),
			annotations: { ...READ, title: "Search course materials" },
		},
		async (args) => {
			const res = await run("materials.search", {
				query: args.query,
				course: args.course ?? "",
				limit: args.limit,
			});
			if (!res.ok) return fail(res.error.code, res.error.message);
			const page = asMaterialPage(res.data);
			return ok({ total: page.total, count: page.items.length, items: page.items });
		},
	);

	server.registerTool(
		"get_material",
		{
			title: "Get a course material",
			description:
				"Get details of one course material: course, term, LMS folder path, file type and size, " +
				"whether it is on the user's computer, and which of the user's folders hold it.",
			inputSchema: z.object({ id: MATERIAL_ID }),
			annotations: { ...READ, title: "Get a course material" },
		},
		async (args) => {
			const res = await run("materials.get", { id: args.id });
			if (!res.ok) return fail(res.error.code, res.error.message);
			return ok(formatMaterial((res.data ?? {}) as Record<string, unknown>));
		},
	);

	server.registerTool(
		"list_folders",
		{
			title: "List my folders",
			description:
				"List the folders the user made in Daling to group course materials (separate from LMS folders), with their ids.",
			inputSchema: z.object({}),
			annotations: { ...READ, title: "List my folders" },
		},
		async () => {
			const res = await run("folders.list", {});
			if (!res.ok) return fail(res.error.code, res.error.message);
			return ok((res.data ?? { folders: [] }) as Record<string, unknown>);
		},
	);

	server.registerTool(
		"create_material_folder",
		{
			title: "Create a folder for materials",
			description:
				"Create a new folder in Daling for grouping course materials. Materials themselves come from the LMS and " +
				"cannot be created here; put existing materials into the folder with update_material.",
			inputSchema: z.object({ name: z.string().trim().min(1).max(60).describe("Folder name.") }),
			annotations: {
				title: "Create a folder for materials",
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: false,
			},
		},
		async (args) => {
			const res = await runWrite("folders.create", { name: args.name });
			if (!res.ok) return fail(res.error.code, res.error.message);
			return ok((res.data ?? {}) as Record<string, unknown>);
		},
	);

	server.registerTool(
		"update_material",
		{
			title: "Update a course material",
			description:
				"Change how a material is organised in Daling: hide it from the materials list (the file itself is kept and it " +
				"can be shown again with hidden=false), or add it to / remove it from the user's folders.",
			inputSchema: z
				.object({
					id: MATERIAL_ID,
					hidden: z.boolean().optional().describe("true hides it from Daling's list, false shows it again."),
					add_to_folder_ids: z.array(FOLDER_ID).max(20).optional(),
					remove_from_folder_ids: z.array(FOLDER_ID).max(20).optional(),
				})
				.refine(
					(v) => v.hidden !== undefined || v.add_to_folder_ids?.length || v.remove_from_folder_ids?.length,
					"Give at least one change: hidden, add_to_folder_ids or remove_from_folder_ids.",
				),
			annotations: {
				title: "Update a course material",
				readOnlyHint: false,
				destructiveHint: true,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async (args) => {
			const res = await runWrite("materials.update", {
				id: args.id,
				hidden: args.hidden ?? null,
				addToFolders: args.add_to_folder_ids ?? [],
				removeFromFolders: args.remove_from_folder_ids ?? [],
			});
			if (!res.ok) return fail(res.error.code, res.error.message);
			return ok(formatMaterial((res.data ?? {}) as Record<string, unknown>));
		},
	);

	// ----- 마감 -----

	server.registerTool(
		"list_deadlines",
		{
			title: "List deadlines",
			description:
				"List assignment deadlines: LMS assignments (with submission status and score) and deadlines the user added. " +
				"Filter by status, due date range and course. Sorted by due date. Times are Korea time (+09:00).",
			inputSchema: z.object({
				status: z
					.enum(["upcoming", "overdue", "open", "done", "all"])
					.default("upcoming")
					.describe(
						"upcoming: not done and not yet due. overdue: not done and past due. open: not done (upcoming + overdue). " +
							"done: submitted, graded or marked done. all: everything.",
					),
				from: DATE_INPUT.optional().describe("Only deadlines due at or after this (date only = start of that day, Korea time)."),
				to: DATE_INPUT.optional().describe("Only deadlines due at or before this (date only = end of that day, Korea time)."),
				course: z.string().max(100).optional().describe("Part of the course name."),
				source: z.enum(["all", "lms", "manual"]).default("all").describe("lms: from the LMS. manual: added by the user."),
				include_deleted: z.boolean().default(false).describe("Also show deadlines the user deleted (hid)."),
				limit: z.number().int().min(1).max(100).default(50),
			}),
			annotations: { ...READ, title: "List deadlines" },
		},
		async (args) => {
			const fromMs = args.from ? parseSeoulInput(args.from, "start") : null;
			const toMs = args.to ? parseSeoulInput(args.to, "end") : null;
			if ((args.from && fromMs === null) || (args.to && toMs === null)) {
				return fail("invalid", "from/to must be ISO 8601 dates like '2026-11-20' or '2026-11-20T18:00'.");
			}
			const res = await run("deadlines.list", { includeHidden: args.include_deleted });
			if (!res.ok) return fail(res.error.code, res.error.message);
			const t = now();
			const matched = filterDeadlines(
				asDeadlines(res.data),
				{
					status: args.status,
					fromMs,
					toMs,
					course: args.course,
					source: args.source,
					includeDeleted: args.include_deleted,
				},
				t,
			);
			const updatedAt = (res.data as { updatedAt?: string })?.updatedAt;
			return ok({
				now: nowSeoulIso(t),
				lmsSyncedAt: toSeoulIso(updatedAt),
				total: matched.length,
				count: Math.min(matched.length, args.limit),
				items: matched.slice(0, args.limit).map((i) => formatDeadline(i, t)),
			});
		},
	);

	server.registerTool(
		"get_deadline",
		{
			title: "Get a deadline",
			description: "Get one deadline by id, including deleted (hidden) ones.",
			inputSchema: z.object({ id: DEADLINE_ID }),
			annotations: { ...READ, title: "Get a deadline" },
		},
		async (args) => {
			const res = await run("deadlines.list", { includeHidden: true });
			if (!res.ok) return fail(res.error.code, res.error.message);
			const item = asDeadlines(res.data).find((i) => i.id === args.id);
			if (!item) return fail("not_found", "No deadline with that id. Use list_deadlines to find it.");
			return ok(formatDeadline(item, now()));
		},
	);

	server.registerTool(
		"create_deadline",
		{
			title: "Add a deadline",
			description:
				"Add the user's own deadline to Daling (for things not on the LMS, e.g. a team meeting or a report for a club). " +
				"It shows up in Daling's deadline list, calendar and reminders. A date without a time means 23:59 Korea time.",
			inputSchema: z.object({
				title: z.string().trim().min(1).max(200),
				due: DATE_INPUT,
				course: z.string().trim().max(100).optional().describe("Course or category name to show with it."),
				note: z.string().max(1000).optional(),
			}),
			annotations: {
				title: "Add a deadline",
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: false,
			},
		},
		async (args) => {
			const dueMs = parseSeoulInput(args.due, "due");
			if (dueMs === null) return fail("invalid", "due must be an ISO 8601 date like '2026-11-20' or '2026-11-20T18:00'.");
			const res = await runWrite("deadlines.create", {
				title: args.title,
				due: new Date(dueMs).toISOString(),
				course: args.course ?? "",
				note: args.note ?? "",
			});
			if (!res.ok) return fail(res.error.code, res.error.message);
			return ok(formatDeadline(res.data as RawDeadline, now()));
		},
	);

	server.registerTool(
		"update_deadline",
		{
			title: "Edit a deadline",
			description:
				"Edit a deadline the user added ('my:' id): title, due date, course or note. " +
				"LMS assignments ('lms:' ids) can't be edited here because the LMS owns them.",
			inputSchema: z
				.object({
					id: DEADLINE_ID,
					title: z.string().trim().min(1).max(200).optional(),
					due: DATE_INPUT.optional(),
					course: z.string().trim().max(100).optional(),
					note: z.string().max(1000).optional(),
				})
				.refine(
					(v) => v.title !== undefined || v.due !== undefined || v.course !== undefined || v.note !== undefined,
					"Give at least one field to change.",
				),
			annotations: {
				title: "Edit a deadline",
				readOnlyHint: false,
				destructiveHint: true,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async (args) => {
			if (args.id.startsWith("lms:")) {
				return fail("read_only", "LMS assignments can't be edited in Daling. Only deadlines the user added ('my:' ids) can.");
			}
			const fields: Record<string, unknown> = { id: args.id };
			if (args.title !== undefined) fields.title = args.title;
			if (args.course !== undefined) fields.course = args.course;
			if (args.note !== undefined) fields.note = args.note;
			if (args.due !== undefined) {
				const dueMs = parseSeoulInput(args.due, "due");
				if (dueMs === null) return fail("invalid", "due must be an ISO 8601 date like '2026-11-20' or '2026-11-20T18:00'.");
				fields.due = new Date(dueMs).toISOString();
			}
			const res = await runWrite("deadlines.update", fields);
			if (!res.ok) return fail(res.error.code, res.error.message);
			return ok(formatDeadline(res.data as RawDeadline, now()));
		},
	);

	server.registerTool(
		"complete_deadline",
		{
			title: "Mark a deadline done",
			description:
				"Mark a deadline the user added ('my:' id) as done, or not done with done=false. " +
				"LMS assignments become done only when submitted on the LMS; this tool does not submit anything.",
			inputSchema: z.object({ id: DEADLINE_ID, done: z.boolean().default(true) }),
			annotations: {
				title: "Mark a deadline done",
				readOnlyHint: false,
				destructiveHint: true,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async (args) => {
			if (args.id.startsWith("lms:")) {
				return fail(
					"read_only",
					"LMS assignments are marked done only by submitting them on the LMS. Daling can't submit for the user.",
				);
			}
			const res = await runWrite("deadlines.complete", { id: args.id, done: args.done });
			if (!res.ok) return fail(res.error.code, res.error.message);
			return ok(formatDeadline(res.data as RawDeadline, now()));
		},
	);

	server.registerTool(
		"delete_deadline",
		{
			title: "Delete a deadline",
			description:
				"Remove a deadline from Daling's lists, calendar and reminders. This is a soft delete: nothing is erased, " +
				"and restore_deadline (or 'Hidden assignments' in the Daling app) brings it back. LMS assignments stay on the LMS.",
			inputSchema: z.object({ id: DEADLINE_ID }),
			annotations: {
				title: "Delete a deadline",
				readOnlyHint: false,
				destructiveHint: true,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async (args) => {
			const res = await runWrite("deadlines.hide", { id: args.id, hidden: true });
			if (!res.ok) return fail(res.error.code, res.error.message);
			return ok({ ...formatDeadline(res.data as RawDeadline, now()), restorable: true });
		},
	);

	server.registerTool(
		"restore_deadline",
		{
			title: "Restore a deleted deadline",
			description: "Bring back a deadline that was deleted with delete_deadline or hidden in the Daling app.",
			inputSchema: z.object({ id: DEADLINE_ID }),
			annotations: {
				title: "Restore a deleted deadline",
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async (args) => {
			const res = await runWrite("deadlines.hide", { id: args.id, hidden: false });
			if (!res.ok) return fail(res.error.code, res.error.message);
			return ok(formatDeadline(res.data as RawDeadline, now()));
		},
	);

	return server;
}
