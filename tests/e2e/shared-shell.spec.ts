import { expect, test } from "@playwright/test";

test("shared shell exposes desktop navigation", async ({ page }) => {
  await page.goto("/");
  const breadcrumbs = page.getByRole("navigation", { name: "breadcrumb" });

  await expect(breadcrumbs.getByText("Home", { exact: true })).toBeVisible();
  await expect(breadcrumbs.getByText("Portal", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Account" }).first().click();

  await expect(page.getByRole("heading", { name: "Your identity" })).toBeVisible();
});

test("language switch persists the selected locale", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Open account menu").click();
  await page.getByRole("menuitem", { name: "Switch to Bengali" }).click();

  await expect(page.locator("html")).toHaveAttribute("lang", "bn");
  await expect(page.getByRole("link", { name: "হোম", exact: true }).first()).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("app-language"))).toBe("bn");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "bn");
  await page.getByLabel("অ্যাকাউন্ট মেনু খুলুন").click();
  await page.getByRole("menuitem", { name: "ইংরেজিতে পরিবর্তন করুন" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});
