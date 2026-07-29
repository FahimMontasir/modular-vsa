import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { resolve } from "node:path";

import { createAuthSession } from "./bun-fixtures";

export const portalURL = process.env.CORS_ORIGIN ?? "http://localhost:3001";
export const serverURL = new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3100").origin;
export const authStatePath = resolve(import.meta.dirname, "../../.auth/admin-desktop.json");

export const bootstrapAdmin = {
  name: process.env.BOOTSTRAP_ADMIN_NAME ?? "Administrator",
  email: process.env.BOOTSTRAP_ADMIN_EMAIL ?? "admin@modular-vsa.local",
  username: process.env.BOOTSTRAP_ADMIN_USERNAME ?? "admin",
  password: process.env.BOOTSTRAP_ADMIN_PASSWORD ?? "local-admin-password-123",
};

export type TestUser = {
  id: string;
  name: string;
  email: string;
  username: string;
  password: string;
};

function authHeaders() {
  return { origin: portalURL };
}

export async function waitForAuthServer(request: APIRequestContext) {
  await expect
    .poll(async () => (await request.get(`${serverURL}/api/auth/ok`)).status())
    .toBe(200);
}

export async function installAuthSession(page: Page, username: string, password: string) {
  const cookieHeader = await createAuthSession(username, password);
  await page.context().clearCookies();
  await page.context().addCookies(
    cookieHeader.split("; ").map((cookie) => {
      const separator = cookie.indexOf("=");
      return {
        name: cookie.slice(0, separator),
        value: cookie.slice(separator + 1),
        url: serverURL,
      };
    })
  );
}

export async function authenticateAsUser(page: Page, user: TestUser, destination = "/") {
  await installAuthSession(page, user.username, user.password);
  await page.goto(destination);
  await expect(page).toHaveURL(new RegExp(`${destination.replaceAll("/", "\\/")}$`));
}

export async function createManagedUser(request: APIRequestContext, label: string): Promise<TestUser> {
  const suffix = `${Date.now()}${crypto.randomUUID().replaceAll("-", "").slice(0, 6)}`;
  const username = `pw${label.toLowerCase().replaceAll(/[^a-z]/g, "").slice(0, 8)}${suffix.slice(-8)}`;
  const user = {
    name: `PW ${label} ${suffix}`,
    email: `${username}@modular-vsa.local`,
    username,
    password: "playwright-password-123",
  };
  const response = await request.post(`${serverURL}/api/auth/admin/create-user`, {
    headers: authHeaders(),
    data: {
      name: user.name,
      email: user.email,
      password: user.password,
      role: "director",
      data: { username: user.username, displayUsername: user.username },
    },
  });

  if (!response.ok()) throw new Error(`Could not create managed user: ${await response.text()}`);
  const payload = (await response.json()) as { user: { id: string } };
  return { ...user, id: payload.user.id };
}

export async function removeManagedUser(request: APIRequestContext, userId: string) {
  const response = await request.post(`${serverURL}/api/auth/admin/remove-user`, {
    headers: authHeaders(),
    data: { userId },
  });

  if (!response.ok() && response.status() !== 404) {
    throw new Error(`Could not remove managed user: ${await response.text()}`);
  }
}

export async function findManagedUser(request: APIRequestContext, email: string) {
  const response = await request.get(`${serverURL}/api/auth/admin/list-users`, {
    headers: authHeaders(),
    params: {
      searchValue: email,
      searchField: "email",
      searchOperator: "contains",
      limit: 10,
      offset: 0,
    },
  });

  if (!response.ok()) throw new Error(`Could not find managed user: ${await response.text()}`);
  const payload = (await response.json()) as { users: Array<{ id: string; email: string }> };
  return payload.users.find((user) => user.email === email);
}

export async function removePostsByTitle(request: APIRequestContext, title: string) {
  const list = await request.get(`${serverURL}/api/v1/home/`, {
    headers: authHeaders(),
    params: { title },
  });
  if (!list.ok()) return;

  const posts = (await list.json()) as Array<{ id: number; title: string }>;
  await Promise.all(
    posts
      .filter((post) => post.title === title)
      .map(async (post) => {
        await request.delete(`${serverURL}/api/v1/home/${post.id}`, { headers: authHeaders() });
      })
  );
}

export async function createRemoteSession(user: TestUser) {
  await createAuthSession(user.username, user.password);
}
