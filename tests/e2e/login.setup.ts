import { expect, test as setup, type Page } from "@playwright/test";

import {
  authStateFor,
  bootstrapAdmin,
  waitForAuthServer,
} from "./utils/auth";

async function submitValidLogin(page: Page, destination: RegExp) {
  await page.getByRole("button", { name: "Sign in" }).click();
  try {
    await expect(page).toHaveURL(destination, { timeout: 2_000 });
  } catch {
    // Better Auth limits sign-in paths to three attempts per ten-second window. A prior local run
    // can still own that window, so retry the valid request only after it expires.
    await page.waitForTimeout(10_100);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(destination);
  }
}

setup("login page authenticates the bootstrap administrator first", async ({ page, request }, testInfo) => {
  await waitForAuthServer(request);
  await page.goto("/account/profile");
  await expect(page).toHaveURL(/\/login\?redirect=%2Faccount%2Fprofile/);
  await expect(page.getByText("Welcome back", { exact: true })).toBeVisible();

  await page.getByRole("textbox", { name: "Username" }).fill(bootstrapAdmin.username);
  await page.getByLabel("Password").fill("incorrect-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("The credentials did not match an active account.")).toBeVisible();

  await page.getByLabel("Password").fill(bootstrapAdmin.password);
  await submitValidLogin(page, /\/account\/profile$/);
  await expect(page.getByRole("heading", { name: "Your identity" })).toBeVisible();

  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByRole("tab", { name: "Email" }).click();
  await page.getByRole("textbox", { name: "Email" }).fill(bootstrapAdmin.email);
  await page.getByLabel("Password").fill(bootstrapAdmin.password);
  await submitValidLogin(page, /\/$/);
  await expect(page.getByRole("heading", { name: new RegExp(`Welcome, ${bootstrapAdmin.name}`) })).toBeVisible();

  await page.context().storageState({ path: authStateFor(testInfo.project.name) });
});
