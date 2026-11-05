import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

// 시험은 실제 Workers 런타임(workerd)에서 돈다. 'local' 환경 = http://localhost:8787, 사용자 지정 도메인 없음.
export default defineConfig({
	// 첫 요청은 workerd 가 모듈을 불러오느라 몇 초 걸린다 (이 PC 에서 5초를 넘긴 적이 있음)
	test: { testTimeout: 30_000 },
	plugins: [
		cloudflareTest({
			wrangler: { configPath: "./wrangler.jsonc", environment: "local" },
		}),
	],
});
