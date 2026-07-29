import { expect, test } from "@playwright/test";

import { seedExternalAccount } from "./utils/bun-fixtures";
import {
  authenticateAsUser,
  createManagedUser,
  removeManagedUser,
} from "./utils/auth";

test("connections page inspects and unlinks an external account", async ({ page, request }) => {
  await page.goto("/account/connections");
  await expect(page.getByRole("heading", { name: "Connections" })).toBeVisible();

  const user = await createManagedUser(request, "Connections");
  const providerId = `playwright-${crypto.randomUUID().slice(0, 8)}`;
  try {
    await seedExternalAccount(user.id, providerId, `${providerId}-account`);
    await authenticateAsUser(page, user, "/account/connections");
    await expect(page.getByText(providerId, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Unlink" }).click();
    await page.getByRole("button", { name: "Unlink account" }).click();
    await expect(page.getByText("Account unlinked")).toBeVisible();
    await expect(page.getByText(providerId, { exact: true })).toBeHidden();
  } finally {
    await removeManagedUser(request, user.id);
  }
});
