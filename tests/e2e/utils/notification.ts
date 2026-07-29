import { expect, type APIRequestContext, type Page } from "@playwright/test";

import {
  createManagedUser,
  portalURL,
  removeManagedUser,
  serverURL,
  type TestUser,
} from "./auth";
import {
  createAuthSession,
  deleteDirectNotificationConversation,
  deleteNotificationAnnouncement,
  deleteNotificationConversation,
} from "./bun-fixtures";

type CurrentUser = { id: string; name: string };

async function unreadTotal(request: APIRequestContext) {
  const response = await request.get(`${serverURL}/api/v1/notification/unread`, {
    headers: { origin: portalURL },
  });
  if (!response.ok()) throw new Error(`Could not read unread total: ${await response.text()}`);
  const payload = (await response.json()) as { count: number };
  return payload.count;
}

async function currentUser(request: APIRequestContext): Promise<CurrentUser> {
  const response = await request.get(`${serverURL}/api/auth/get-session`, {
    headers: { origin: portalURL },
  });
  if (!response.ok()) throw new Error(`Could not read current user: ${await response.text()}`);
  const payload = (await response.json()) as { user: CurrentUser };
  return payload.user;
}

async function userHeaders(user: TestUser) {
  return {
    cookie: await createAuthSession(user.username, user.password),
    origin: portalURL,
  };
}

export async function seedIncomingDirectMessage(request: APIRequestContext, body: string) {
  const recipient = await currentUser(request);
  const unreadBefore = await unreadTotal(request);
  const sender = await createManagedUser(request, "MessengerIncoming");
  try {
    const headers = await userHeaders(sender);
    const directResponse = await request.post(`${serverURL}/api/v1/notification/direct`, {
      headers,
      data: { userId: recipient.id },
    });
    if (!directResponse.ok())
      throw new Error(`Could not create incoming conversation: ${await directResponse.text()}`);
    const direct = (await directResponse.json()) as { id: string };
    const messageResponse = await request.post(
      `${serverURL}/api/v1/notification/conversations/${direct.id}/messages`,
      { headers, data: { body } }
    );
    if (!messageResponse.ok())
      throw new Error(`Could not create incoming message: ${await messageResponse.text()}`);
    return { body, conversationId: direct.id, recipient, sender, unreadBefore };
  } catch (error) {
    await removeManagedUser(request, sender.id);
    throw error;
  }
}

export async function cleanupIncomingDirectMessage(
  request: APIRequestContext,
  fixture: Awaited<ReturnType<typeof seedIncomingDirectMessage>>
) {
  await deleteNotificationConversation(fixture.conversationId);
  await removeManagedUser(request, fixture.sender.id);
}

export async function createDirectChatTarget(request: APIRequestContext) {
  return {
    recipient: await currentUser(request),
    target: await createManagedUser(request, "MessengerTarget"),
  };
}

export async function cleanupDirectChatTarget(
  request: APIRequestContext,
  fixture: Awaited<ReturnType<typeof createDirectChatTarget>>
) {
  await deleteDirectNotificationConversation(fixture.recipient.id, fixture.target.id);
  await removeManagedUser(request, fixture.target.id);
}

export async function openMessenger(page: Page) {
  await page.getByLabel("Open account menu").click();
  await page.getByRole("menuitem", { name: /Messenger/ }).click();
  const dialog = page.locator('[data-slot="dialog-content"]');
  await expect(dialog).toBeVisible();
  return dialog;
}

export async function cleanupAnnouncement(title: string) {
  await deleteNotificationAnnouncement(title);
}
