import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@nyosegawa/agent-ui-core": new URL("./packages/core/src/index.ts", import.meta.url).pathname,
      "@nyosegawa/agent-ui-codex": new URL("./packages/codex/src/index.ts", import.meta.url).pathname,
      "@nyosegawa/agent-ui-react": new URL("./packages/react/src/index.ts", import.meta.url).pathname,
      "@nyosegawa/agent-ui-server": new URL("./packages/server/src/index.ts", import.meta.url).pathname,
    },
  },
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
    },
    environment: "node",
    globals: true,
    include: ["**/*.{test,spec,vitest}.{ts,tsx}"],
  },
});
