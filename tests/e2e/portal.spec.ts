import { expect, test, type Page } from "@playwright/test";

const admin = {
  username: "admin",
  password: "local-admin-password-123",
};

let adminCookies:
  | Awaited<ReturnType<ReturnType<Page["context"]>["cookies"]>>
  | undefined;

test.describe.configure({ mode: "serial" });

async function signIn(page: Page, credentials = admin, destination = "/") {
  await expect
    .poll(async () => (await page.request.get("http://localhost:3000/api/auth/ok")).status())
    .toBe(200);

  if (credentials === admin && adminCookies) {
    await page.context().addCookies(adminCookies);
    await page.goto(destination);
    return;
  }

  await page.goto(destination);
  await expect(page).toHaveURL(/\/login\?redirect=/);
  await page.getByRole("textbox", { name: "Username" }).fill(credentials.username);
  await page.getByLabel("Password").fill(credentials.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(new RegExp(`${destination.replace("/", "\\/")}$`));
  if (credentials === admin) adminCookies = await page.context().cookies();
}

test("username login preserves the protected destination", async ({ page }) => {
  await signIn(page, admin, "/account/profile");
  await expect(page).toHaveURL(/\/account\/profile$/);
  await expect(page.getByRole("heading", { name: "Your identity" })).toBeVisible();
});

test("portal shell exposes breadcrumbs and responsive navigation", async ({ page }, testInfo) => {
  await signIn(page);
  const mobile = testInfo.project.name.includes("Mobile");
  const breadcrumbs = page.getByRole("navigation", { name: "breadcrumb" });
  if (mobile) {
    await expect(breadcrumbs).toBeHidden();
    await expect(page.locator("header").getByRole("link", { name: "Modular VSA" })).toBeVisible();
  } else {
    await expect(breadcrumbs.getByText("Home", { exact: true })).toBeVisible();
    await expect(breadcrumbs.getByText("Portal", { exact: true })).toBeVisible();
  }

  const bottomNavigation = page.locator("nav").filter({ hasText: "Access Control" });
  if (mobile) {
    await expect(bottomNavigation).toBeVisible();
    await bottomNavigation.getByRole("link", { name: "Account" }).click();
  } else {
    await expect(bottomNavigation).toBeHidden();
    await page.getByRole("link", { name: "Account" }).first().click();
  }

  await expect(page.getByRole("heading", { name: "Your identity" })).toBeVisible();
});

test("language switch translates the shared shell and persists the locale", async ({ page }) => {
  await signIn(page);
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

test("admin can manage and impersonate a read-only director", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("Mobile"), "The workflow is covered in the desktop suite");
  await signIn(page);
  await page.getByRole("link", { name: "Access Control" }).first().click();
  await expect(page.getByRole("heading", { name: "Access Control" })).toBeVisible();

  const suffix = `${Date.now()}`;
  const director = {
    name: `PW Director ${suffix}`,
    email: `pw-director-${suffix}@modular-vsa.local`,
    username: `pwdirector${suffix.slice(-8)}`,
    password: "director-password-123",
  };

  await page.getByLabel("Name", { exact: true }).first().fill(director.name);
  await page.getByLabel("Email", { exact: true }).fill(director.email);
  await page.getByLabel("Username", { exact: true }).first().fill(director.username);
  await page.getByLabel("Password", { exact: true }).first().fill(director.password);
  await page.getByRole("button", { name: "Create user" }).click();
  await expect(page.getByText("User created")).toBeVisible();

  await page.getByPlaceholder("Search names").fill(director.name);
  const identity = page.getByRole("button", { name: new RegExp(director.email) });
  await expect(identity).toBeVisible();
  await identity.click();
  await page.getByRole("button", { name: "Impersonate" }).click();
  await expect(page.getByRole("heading", { name: "Welcome" })).toBeVisible();
  await expect(page.getByText("Impersonation session")).toBeVisible();

  const forbidden = await page.request.post("http://localhost:3000/api/v1/home/", {
    headers: { Origin: "http://localhost:3001" },
    data: { title: "Must be denied", content: "Director mutation", published: false },
  });
  expect(forbidden.status()).toBe(403);

  await page.getByLabel("Open account menu").click();
  await page.getByRole("menuitem", { name: "Stop impersonating" }).click();
  await expect(page.getByText("Impersonation session")).toBeHidden();

  await page.goto("/access-control/users");
  await page.getByPlaceholder("Search names").fill(director.name);
  await page.getByRole("button", { name: new RegExp(director.email) }).click();
  await page.getByRole("button", { name: "Remove user" }).click();
  await expect(page.getByRole("heading", { name: `Remove ${director.name}?` })).toBeVisible();
  await page.getByRole("button", { name: "Remove permanently" }).click();
  await expect(page.getByText("User removed")).toBeVisible();
});

test("access-control pages expose sessions and the shared policy", async ({ page }) => {
  await signIn(page);
  await page.goto("/access-control/users");
  const sectionNavigation = page.getByRole("navigation", { name: "Access Control sections" });
  await sectionNavigation.getByRole("link", { name: "Sessions" }).click();
  await expect(page.getByText("User sessions", { exact: true })).toBeVisible();
  await sectionNavigation.getByRole("link", { name: "Permissions" }).click();
  await expect(page.getByText("Role permission matrix", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Check on server" })).toBeVisible();
});
