import { expect, test } from "@playwright/test";

test("rich transcript accessibility snapshot exposes core chat surfaces", async ({
  page,
}) => {
  await page.goto("/rich-transcript");
  await expect(
    page.getByRole("heading", { name: "Rich transcript fixture" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Execution mode" }).click();
  await expect(page.getByRole("menu", { name: "Execution mode" })).toBeVisible();

  const snapshot = await page.locator("body").ariaSnapshot();
  expect(snapshot).toContain("- main:");
  expect(snapshot).toContain('heading "Rich transcript fixture"');
  expect(snapshot).toContain('textbox "Message"');
  expect(snapshot).toContain('button "Execution mode"');
  expect(snapshot).toContain('menu "Execution mode"');
  expect(snapshot).toContain("Approve command request approval-command-rich-transcript");
  expect(snapshot).toContain("3 decisions need your review");
});
