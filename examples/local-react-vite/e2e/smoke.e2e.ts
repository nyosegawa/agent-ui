import { expect, test } from "@playwright/test";

test("renders Agent UI chat", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("agent-chat")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Implement approval UI" })).toBeVisible();
  await expect(page.getByLabel("Command output")).toContainText("7 tests passed");
  await expect(page.getByLabel("Diff preview")).toContainText("AgentDiffPanel");
  await expect(page.getByRole("button", { name: "Approve" }).first()).toBeVisible();
  await expect(page.getByLabel("Run settings")).toContainText("Execution mode");
  await expect(page.getByLabel("Usage limits")).toContainText("fixture-demo-model weekly");
  await expect(page.getByLabel("Search history")).toBeVisible();
  await page.getByRole("button", { name: "Load" }).click();
  await page.getByRole("button", { name: /Stored session/ }).click();
  await expect(page.getByRole("heading", { name: "Stored session" })).toBeVisible();
  await expect(page.getByText("Stored session history can be read before resuming.")).toBeVisible();
  await page.getByRole("button", { name: "Resume" }).click();
  await expect(page.locator(".aui-status-pill")).toHaveText("loaded");
  await expect(page.getByLabel("Model", { exact: true })).toHaveValue("fixture-demo-model");
  await expect(page.getByLabel("Effort", { exact: true })).toHaveValue("");
  await expect(page.getByRole("button", { name: "Review" })).toHaveAttribute("aria-pressed", "true");
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
});

test("does not overflow on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/");
  await expect(page.getByLabel("Run settings")).toBeVisible();
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
});
