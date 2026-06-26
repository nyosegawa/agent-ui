import { expect, test } from "@playwright/test";

test("keeps explicit scoped thread lists independent in the browser", async ({
  page,
}) => {
  await page.goto("/maintainer/scoped-thread-lists");
  await expect(page.getByTestId("scoped-thread-lists")).toBeVisible();

  const left = page.getByRole("region", { name: "Left scoped list" });
  const right = page.getByRole("region", { name: "Right scoped list" });

  await expect(left.getByLabel("Left cursor")).toHaveText("history:left-fixture:page-2");
  await expect(right.getByLabel("Right cursor")).toHaveText(
    "history:right-fixture:page-2",
  );
  await expect(left.getByLabel("Left threads")).toContainText("Left alpha thread");
  await expect(right.getByLabel("Right threads")).toContainText("Right beta thread");

  await left.getByLabel("Left search").fill("alpha");
  await left.getByRole("button", { name: "Refresh Left" }).click();
  await expect(left.getByLabel("Left threads")).toContainText("Left alpha thread");
  await expect(left.getByLabel("Left scope metadata")).toHaveText("alpha");
  await expect(left.getByLabel("Left cursor")).toHaveText("history:left-fixture:page-2");
  await expect(right.getByLabel("Right threads")).toContainText("Right beta thread");

  await right.getByLabel("Right search").fill("beta");
  await right.getByRole("button", { name: "Refresh Right" }).click();
  await expect(right.getByLabel("Right threads")).toContainText("Right beta thread");
  await expect(right.getByLabel("Right scope metadata")).toHaveText("beta");
  await expect(right.getByLabel("Right cursor")).toHaveText(
    "history:right-fixture:page-2",
  );
  await expect(left.getByLabel("Left threads")).toContainText("Left alpha thread");

  await left.getByRole("button", { name: "Load more Left" }).click();
  await expect(left.getByLabel("Left threads")).toContainText("Left page thread");
  await expect(left.getByLabel("Left cursor")).toHaveText("End of list");
  await expect(right.getByLabel("Right threads")).not.toContainText("Left page thread");

  await left.getByRole("button", { name: "Left page thread" }).click();
  await expect(left.getByLabel("Left active")).toHaveText("thread-left-page");
  await expect(right.getByLabel("Right active")).toHaveText("");
});
