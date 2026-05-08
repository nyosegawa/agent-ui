import { expect, test } from "@playwright/test";

test("renders Agent UI chat", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("agent-chat")).toBeVisible();
  await expect(page.getByRole("button", { name: "Start thread" })).toBeVisible();
});
