import { expect, test } from "@playwright/test";

import {
  authenticateAsUser,
  createManagedUser,
  removeManagedUser,
} from "./utils/auth";

test("profile page updates a disposable identity", async ({ page, request }) => {
  await page.goto("/account/profile");
  await expect(page.getByRole("heading", { name: "Your identity" })).toBeVisible();

  const user = await createManagedUser(request, "Profile");
  try {
    await authenticateAsUser(page, user, "/account/profile");
    const updatedName = `${user.name} Updated`;
    const updatedUsername = `${user.username.slice(0, 25)}u`;

    await page.getByRole("textbox", { name: "Name", exact: true }).fill(updatedName);
    await page.getByLabel("Username").fill(updatedUsername);
    await page.getByRole("button", { name: "Check availability" }).click();
    await expect(page.getByText("Username is available.")).toBeVisible();
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText("Profile updated")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Name", exact: true })).toHaveValue(updatedName);
  } finally {
    await removeManagedUser(request, user.id);
  }
});
