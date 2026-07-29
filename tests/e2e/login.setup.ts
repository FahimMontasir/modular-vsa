import { expect, test as setup } from "@playwright/test";

import {
  authStatePath,
  bootstrapAdmin,
  installAuthSession,
  waitForAuthServer,
} from "./utils/auth";

setup("authenticate the bootstrap administrator", async ({ page, request }) => {
  await waitForAuthServer(request);
  await page.goto("/account/profile");
  await expect(page).toHaveURL(/\/login\?redirect=%2Faccount%2Fprofile/);
  await expect(page.getByText("Welcome back", { exact: true })).toBeVisible();

  await installAuthSession(page, bootstrapAdmin.username, bootstrapAdmin.password);
  await page.goto("/account/profile");
  await expect(page.getByRole("heading", { name: "Your identity" })).toBeVisible();

  await page.context().storageState({ path: authStatePath });
});
