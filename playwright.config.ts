import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "examples/**/*.e2e.ts",
  snapshotPathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}{ext}",
  timeout: 30_000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command:
        "env -u NO_COLOR -u FORCE_COLOR bun run --cwd examples/local-react-vite preview --host 127.0.0.1",
      port: 4173,
      reuseExistingServer: false,
    },
    {
      command:
        "env -u NO_COLOR -u FORCE_COLOR AGENT_UI_PORT=4174 AGENT_UI_CODEX_COMMAND=bun AGENT_UI_CODEX_ARGS='[\"e2e/fake-codex-app-server.ts\"]' bun --filter @nyosegawa/agent-ui-example-codex-local-web dev",
      port: 4174,
      reuseExistingServer: false,
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
