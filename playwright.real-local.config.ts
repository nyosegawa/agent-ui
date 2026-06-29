import { defineConfig, devices } from "@playwright/test";
import process from "node:process";

export default defineConfig({
  testDir: ".",
  testMatch: "examples/codex-local-web/e2e/**/*.e2e.ts",
  outputDir: "test-results/real-local",
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  snapshotPathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}{ext}",
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  workers: 1,
  use: {
    trace: "on-first-retry",
  },
  webServer: {
    command:
      'env -u NO_COLOR -u FORCE_COLOR AGENT_UI_PORT=4174 PATH="$PWD/examples/codex-local-web/e2e/fake-bin:$PATH" bun --filter @nyosegawa/agent-ui-example-codex-local-web dev',
    port: 4174,
    reuseExistingServer: false,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
