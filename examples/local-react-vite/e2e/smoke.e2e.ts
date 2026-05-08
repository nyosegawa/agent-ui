import { expect, test } from "@playwright/test";

test("renders Agent UI chat", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("agent-chat")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Implement approval UI" })).toBeVisible();
  await expect(page.getByLabel("Command output")).toContainText("7 tests passed");
  await expect(page.getByLabel("Diff preview")).toContainText("AgentDiffPanel");
  await expect(page.getByRole("button", { name: "Approve" }).first()).toBeVisible();
});
