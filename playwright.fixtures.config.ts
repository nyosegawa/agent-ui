import { defineConfig, devices } from "@playwright/test";
import process from "node:process";

export default defineConfig({
  testDir: ".",
  testMatch: "examples/local-react-vite/e2e/**/*.e2e.ts",
  outputDir: "test-results/fixtures",
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  snapshotPathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}{ext}",
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  webServer: {
    command:
      "env -u NO_COLOR -u FORCE_COLOR bun run --cwd examples/local-react-vite build && env -u NO_COLOR -u FORCE_COLOR bun run --cwd examples/local-react-vite preview --host 127.0.0.1",
    port: 4173,
    reuseExistingServer: false,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
