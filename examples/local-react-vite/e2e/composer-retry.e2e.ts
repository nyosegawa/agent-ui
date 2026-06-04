import { expect, test } from "@playwright/test";

test("retries a failed first message through the public composer controller", async ({
  page,
}) => {
  await page.goto("/composer-retry");
  await expect(page.getByRole("heading", { name: "Composer retry" })).toBeVisible();

  const starter = page.getByRole("form", { name: "Start a Codex thread" });
  await starter.getByRole("textbox", { name: "Message" }).fill("browser retry");
  await starter.getByRole("button", { name: "Start thread" }).click();

  await expect(page.getByRole("heading", { name: "Browser retry thread" })).toBeVisible();
  await expect(page.getByLabel("failed pending count")).toHaveText("1");
  await expect(page.getByLabel("failed pending error")).toHaveText(
    "browser retry failed once",
  );
  await expect(page.getByLabel("turn start calls")).toHaveText("1");
  await expect(
    page.locator(".aui-message[data-kind='userMessage'][data-status='failed']"),
  ).toContainText("browser retry");

  await page.getByRole("button", { name: "Retry failed first message" }).click();

  await expect(page.getByLabel("failed pending count")).toHaveText("0");
  await expect(page.getByLabel("failed pending error")).toHaveText("none");
  await expect(page.getByLabel("turn start calls")).toHaveText("2");
  await expect(
    page.locator(".aui-message[data-kind='userMessage'][data-status='inProgress']"),
  ).toContainText("browser retry");
});
