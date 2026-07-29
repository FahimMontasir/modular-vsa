import { expect, test } from "@playwright/test";

import {
  findManagedUser,
  isMobileProject,
  removeManagedUser,
} from "./utils/auth";

test("users page completes the administrator identity workflow", async ({ page, request }, testInfo) => {
  await page.goto("/access-control");
  await expect(page).toHaveURL(/\/access-control\/users$/);
  await expect(page.getByRole("heading", { name: "Access Control" })).toBeVisible();

  if (isMobileProject(testInfo.project.name)) {
    await expect(page.getByText("User directory", { exact: true })).toBeVisible();
    return;
  }

  const suffix = `${Date.now()}${crypto.randomUUID().replaceAll("-", "").slice(0, 6)}`;
  const user = {
    name: `PW Users ${suffix}`,
    email: `pw-users-${suffix}@modular-vsa.local`,
    username: `pwusers${suffix.slice(-8)}`,
    password: "playwright-password-123",
  };
  let userId: string | undefined;

  try {
    await page.getByLabel("Name", { exact: true }).first().fill(user.name);
    await page.getByLabel("Email", { exact: true }).fill(user.email);
    await page.getByLabel("Username", { exact: true }).first().fill(user.username);
    await page.getByLabel("Password", { exact: true }).first().fill(user.password);
    await page.getByRole("button", { name: "Create user" }).click();
    await expect(page.getByText("User created")).toBeVisible();

    userId = (await findManagedUser(request, user.email))?.id;
    if (!userId) throw new Error("Created user was not returned by Better Auth");

    await page.getByPlaceholder("Search names").fill(user.name);
    await page.getByRole("button", { name: new RegExp(user.email) }).click();

    const updatedName = `${user.name} Updated`;
    await page.getByLabel("Name", { exact: true }).last().fill(updatedName);
    await page.getByRole("button", { name: "Save name" }).click();
    await expect(page.getByText("User updated")).toBeVisible();

    await page.getByLabel("Role").last().selectOption("admin");
    await page.getByRole("button", { name: "Set role" }).click();
    await expect(page.getByText("Role updated")).toBeVisible();
    await page.getByLabel("Role").last().selectOption("director");
    await page.getByRole("button", { name: "Set role" }).click();

    await page.getByLabel("New password").fill("playwright-replaced-password-123");
    await page.getByRole("button", { name: "Set password" }).click();
    await expect(page.getByText("Password updated")).toBeVisible();

    await page.getByRole("button", { name: "Ban", exact: true }).click();
    await expect(page.getByText("User banned")).toBeVisible();
    await page.getByRole("button", { name: "Unban", exact: true }).click();
    await expect(page.getByText("User unbanned")).toBeVisible();

    await page.getByRole("button", { name: "Impersonate" }).click();
    await expect(page.getByText("Impersonation session")).toBeVisible();
    await page.getByLabel("Open account menu").click();
    await page.getByRole("menuitem", { name: "Stop impersonating" }).click();
    await expect(page.getByText("Impersonation session")).toBeHidden();

    await page.goto("/access-control/users");
    await page.getByPlaceholder("Search names").fill(updatedName);
    await page.getByRole("button", { name: new RegExp(user.email) }).click();
    await page.getByRole("button", { name: "Remove user" }).click();
    await page.getByRole("button", { name: "Remove permanently" }).click();
    await expect(page.getByText("User removed")).toBeVisible();
    userId = undefined;
  } finally {
    if (userId) await removeManagedUser(request, userId);
  }
});
