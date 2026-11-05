// 시각은 모두 서울(Asia/Seoul) 기준으로 주고받는다. 한국은 1988년 뒤로 서머타임이 없어 +09:00 고정이다.
// Workers 에도 Intl 시간대 자료가 있지만, 고정 오프셋이면 계산이 단순하고 시험하기 쉽다.

const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;

function pad(n: number, width = 2): string {
	return String(n).padStart(width, "0");
}

/** UTC(또는 오프셋이 붙은) ISO 시각을 `2026-06-18T19:30:22+09:00` 꼴로. 읽을 수 없으면 null. */
export function toSeoulIso(value: string | null | undefined): string | null {
	if (!value) return null;
	const ms = Date.parse(value);
	if (Number.isNaN(ms)) return null;
	const d = new Date(ms + SEOUL_OFFSET_MS);
	return (
		`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` +
		`T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}+09:00`
	);
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const LOCAL_DATETIME = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/;
const ZONED = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/i;

/**
 * Claude 가 넘긴 날짜·시각을 UTC 밀리초로. 시간대가 없으면 서울 시각으로 읽는다.
 * 날짜만 있으면 `dateOnly` 가 정한 그날의 시각(하루의 시작·끝·마감 기본값 23:59)을 쓴다.
 */
export function parseSeoulInput(
	value: string,
	dateOnly: "start" | "end" | "due" = "start",
): number | null {
	const text = value.trim();
	let m = DATE_ONLY.exec(text);
	if (m) {
		const [h, min, s, ms] =
			dateOnly === "start" ? [0, 0, 0, 0] : dateOnly === "end" ? [23, 59, 59, 999] : [23, 59, 0, 0];
		return seoulPartsToUtc(+m[1], +m[2], +m[3], h, min, s, ms);
	}
	m = LOCAL_DATETIME.exec(text);
	if (m) return seoulPartsToUtc(+m[1], +m[2], +m[3], +m[4], +m[5], m[6] ? +m[6] : 0, 0);
	if (ZONED.test(text)) {
		const ms = Date.parse(text.replace(" ", "T"));
		return Number.isNaN(ms) ? null : ms;
	}
	return null;
}

function seoulPartsToUtc(
	y: number,
	mo: number,
	d: number,
	h: number,
	mi: number,
	s: number,
	ms: number,
): number | null {
	if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59 || s > 59) return null;
	const utc = Date.UTC(y, mo - 1, d, h, mi, s, ms);
	// 2월 30일 같은 날짜는 Date.UTC 가 다음 달로 넘기므로 되돌려 확인한다
	const check = new Date(utc);
	if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return null;
	return utc - SEOUL_OFFSET_MS;
}

/** 지금 서울 시각 (도구 결과에 같이 넣어 Claude 가 '오늘'을 헷갈리지 않게). */
export function nowSeoulIso(now = Date.now()): string {
	return toSeoulIso(new Date(now).toISOString()) as string;
}
