import { expect, test } from "@playwright/test";

import {
  authenticateAsUser,
  createManagedUser,
  removeManagedUser,
} from "./utils/auth";

test("permissions page compares local and server policy decisions", async ({ page, request }) => {
  await page.goto("/access-control/permissions");
  await expect(page.getByRole("heading", { name: "Access Control" })).toBeVisible();
  await expect(page.getByText("Role permission matrix", { exact: true })).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();

  const user = await createManagedUser(request, "Permissions");
  try {
    await authenticateAsUser(page, user, "/access-control/permissions");
    const localPolicy = page.locator("p").filter({ hasText: "Local policy" });
    await page.getByLabel("Role").selectOption("director");
    await page.getByLabel("Resource").selectOption("post");
    await page.getByLabel("Action").selectOption("create");
    await expect(localPolicy).toContainText("Denied");
    await page.getByRole("button", { name: "Check on server" }).click();
    await expect(page.getByText("Server denied this permission")).toBeVisible();

    await page.getByLabel("Action").selectOption("read");
    await expect(localPolicy).toContainText("Allowed");
    await page.getByRole("button", { name: "Check on server" }).click();
    await expect(page.getByText("Server allowed this permission")).toBeVisible();
  } finally {
    await removeManagedUser(request, user.id);
  }
});
