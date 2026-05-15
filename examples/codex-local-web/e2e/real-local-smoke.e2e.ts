import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

test("hydrates stored threads through the browser websocket transport", async ({
  page,
}, testInfo) => {
  testInfo.setTimeout(180_000);
  await openRealLocalApp(page);
  const storedThread = page.getByRole("button", { name: /Stored real smoke/ });
  await expect(storedThread).toBeVisible();
  await expect(page.getByText("Stored thread hydrated.")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
});

test("exposes live thread controls through the browser websocket transport", async ({
  page,
}, testInfo) => {
  testInfo.setTimeout(90_000);
  await openRealLocalApp(page);
  await expect(page.getByRole("button", { name: "New thread" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
  await expect(page.locator("[class*=work][class*=trace]")).toHaveCount(0);
});

test("keeps composer reachable in the real local web shell", async ({
  page,
}, testInfo) => {
  testInfo.setTimeout(90_000);
  await openRealLocalApp(page);
  await expect(page.getByText("Stored thread hydrated.")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByLabel("Message composer")).toBeVisible();
});

async function openRealLocalApp(
  page: Page,
  viewport: { height: number; width: number } = { width: 1280, height: 900 },
) {
  await page.setViewportSize(viewport);
  await page.goto("http://127.0.0.1:4174");
  await expect(page.getByTestId("agent-chat")).toBeVisible();
  await expect(page.getByText(/real-smoke@example.com/)).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    page.locator('select[aria-label="Model"] option[value="smoke-model"]'),
  ).toHaveText("Smoke Model (smoke-model)", { timeout: 30_000 });
  await expect(page.getByLabel("Usage limits")).toContainText("codex 5h", {
    timeout: 30_000,
  });
  await expect(page.getByLabel("Usage limits")).toContainText("codex weekly", {
    timeout: 30_000,
  });
}
