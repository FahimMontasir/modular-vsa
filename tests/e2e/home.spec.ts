import { expect, test } from "@playwright/test";

import { deleteUploadedFile } from "./utils/bun-fixtures";
import { isMobileProject, removePostsByTitle } from "./utils/auth";

test("home page manages posts and uploads", async ({ page, request }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Welcome,/ })).toBeVisible();
  await expect(page.getByText("Session active")).toBeVisible();

  if (isMobileProject(testInfo.project.name)) {
    await expect(page.getByText("Posts", { exact: true })).toBeVisible();
    return;
  }

  const suffix = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const title = `PW Home ${suffix}`;
  let uploadKey: string | undefined;

  try {
    await page.getByLabel("Title").fill(title);
    await page.getByLabel("Content").fill("Created by the Home page Playwright flow");
    await page.getByRole("switch", { name: "Publish immediately" }).click();
    await page.getByRole("button", { name: "Create post" }).click();

    const article = page.locator("article").filter({ hasText: title });
    await expect(article).toBeVisible();
    await expect(article.getByText("Published", { exact: true })).toBeVisible();
    await article.getByRole("button", { name: "Move to draft" }).click();
    await expect(article.getByText("Draft", { exact: true })).toBeVisible();

    await page.getByLabel("Select file to upload").setInputFiles({
      name: `pw-upload-${suffix}.txt`,
      mimeType: "text/plain",
      buffer: Buffer.from(`Playwright upload ${suffix}`),
    });
    await page.getByRole("button", { name: "Upload file" }).click();
    const keyOutput = page.locator("code");
    await expect(keyOutput).toContainText(`pw-upload-${suffix}.txt`);
    uploadKey = (await keyOutput.textContent()) ?? undefined;

    await article.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Delete post" }).click();
    await expect(article).toBeHidden();
  } finally {
    await removePostsByTitle(request, title);
    if (uploadKey) await deleteUploadedFile(uploadKey);
  }
});
