import { expect, test } from "@playwright/test";

import {
  authenticateAsUser,
  createManagedUser,
  createRemoteSession,
  removeManagedUser,
} from "./utils/auth";

test("account sessions page revokes browser sessions and signs out", async ({ page, request }) => {
  await page.goto("/account/sessions");
  await expect(page.getByRole("heading", { name: "Sessions" })).toBeVisible();

  const user = await createManagedUser(request, "Sessions");

  try {
    await authenticateAsUser(page, user, "/account/sessions");
    await createRemoteSession(user);
    await page.getByRole("button", { name: "Refresh" }).click();
    await expect(page.locator("article")).toHaveCount(2);
    await page.getByRole("button", { name: "Revoke", exact: true }).click();
    await expect(page.getByText("Session revoked")).toBeVisible();

    await createRemoteSession(user);
    await page.getByRole("button", { name: "Refresh" }).click();
    await expect(page.locator("article")).toHaveCount(2);
    await page.getByRole("button", { name: "Revoke other sessions" }).click();
    await expect(page.getByText("Other sessions revoked")).toBeVisible();

    await page.getByRole("button", { name: "Revoke all and sign out" }).click();
    await page.getByRole("button", { name: "Revoke all" }).click();
    await expect(page).toHaveURL(/\/login(?:\?redirect=%2F)?$/);
  } finally {
    await removeManagedUser(request, user.id);
  }
});
