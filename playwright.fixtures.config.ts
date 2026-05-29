import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "examples/local-react-vite/e2e/**/*.e2e.ts",
  snapshotPathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}{ext}",
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
