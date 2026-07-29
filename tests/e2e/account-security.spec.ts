import { expect, test } from "@playwright/test";

import {
  authenticateAsUser,
  createManagedUser,
  removeManagedUser,
} from "./utils/auth";

test("security page changes credentials and deletes a disposable account", async ({ page, request }) => {
  await page.goto("/account/security");
  await expect(page.getByRole("heading", { name: "Security" })).toBeVisible();

  const user = await createManagedUser(request, "Security");
  const newPassword = "playwright-updated-password-123";
  const newEmail = `updated-${user.email}`;

  try {
    await authenticateAsUser(page, user, "/account/security");
    await page.getByLabel("Current password").first().fill(user.password);
    await page.getByLabel("New password").fill(newPassword);
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(page.getByText("Password changed and other sessions revoked")).toBeVisible();

    await page.getByLabel("New email").fill(newEmail);
    await page.getByRole("button", { name: "Change email" }).click();
    await expect(page.getByText("Email address updated")).toBeVisible();

    await page.getByLabel("Current password").last().fill(newPassword);
    await page.getByRole("button", { name: "Delete my account" }).click();
    await page.getByRole("button", { name: "Delete permanently" }).click();
    await expect(page).toHaveURL(/\/login(?:\?redirect=%2F)?$/);
  } finally {
    await removeManagedUser(request, user.id);
  }
});
