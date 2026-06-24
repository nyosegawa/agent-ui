import { expect, test } from "@playwright/test";

test("rich transcript accessibility snapshot exposes core chat surfaces", async ({
  page,
}) => {
  await page.goto("/rich-transcript");
  await expect(
    page.getByRole("heading", { name: "Rich transcript fixture" }),
  ).toBeVisible();

  await page.getByRole("button", { name: /Run policy:/ }).click();
  await expect(page.getByRole("menu", { name: "Run policy" })).toBeVisible();

  const snapshot = await page.locator("body").ariaSnapshot();
  expect(snapshot).toContain("- main:");
  expect(snapshot).toContain('heading "Rich transcript fixture"');
  expect(snapshot).toContain('textbox "Message"');
  expect(snapshot).toContain('button "Run policy:');
  expect(snapshot).toContain('menu "Run policy"');
  expect(snapshot).toContain("Approve command request approval-command-rich-transcript");
  expect(snapshot).not.toContain("3 decisions need your review");
});
