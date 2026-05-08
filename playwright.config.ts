import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "examples/local-react-vite/e2e",
  testMatch: "*.e2e.ts",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  webServer: {
    command: "bun run --cwd examples/local-react-vite preview --host 127.0.0.1",
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
