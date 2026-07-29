import { expect, test } from "@playwright/test";

import {
  createManagedUser,
  createRemoteSession,
  isMobileProject,
  removeManagedUser,
} from "./utils/auth";

test("access sessions page revokes a managed identity's sessions", async ({
  page,
  request,
}, testInfo) => {
  await page.goto("/access-control/sessions");
  await expect(page.getByRole("heading", { name: "Access Control" })).toBeVisible();
  await expect(page.getByText("User sessions", { exact: true })).toBeVisible();

  if (isMobileProject(testInfo.project.name)) return;

  const user = await createManagedUser(request, "Access Sessions");
  await createRemoteSession(user);
  await createRemoteSession(user);

  try {
    await page.reload();
    await expect(page.locator("article").first()).toBeVisible();
    await page.getByLabel("Identity").selectOption(user.id);
    await expect(page.getByLabel("Identity")).toHaveValue(user.id);
    await expect(page.locator("article")).toHaveCount(2);
    await page.getByRole("button", { name: "Revoke", exact: true }).first().click();
    await expect(page.getByText("Session revoked")).toBeVisible();
    await page.getByRole("button", { name: "Revoke all user sessions" }).click();
    await page.getByRole("button", { name: "Revoke all", exact: true }).click();
    await expect(page.getByText("All user sessions revoked")).toBeVisible();
    await expect(page.getByText("No active sessions")).toBeVisible();
  } finally {
    await removeManagedUser(request, user.id);
  }
});
