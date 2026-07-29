import { afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test";

import { sendDirectMessage } from "../../src/server/services/notification";
import { createAuthenticatedNotificationClient } from "./utils/auth";
import { NotificationFixtures } from "./utils/fixtures";

let auth: Awaited<ReturnType<typeof createAuthenticatedNotificationClient>>;
let fixtures: NotificationFixtures;
let peer: Awaited<ReturnType<NotificationFixtures["seedUser"]>>;

beforeAll(async () => {
  auth = await createAuthenticatedNotificationClient();
});

beforeEach(async () => {
  fixtures = new NotificationFixtures();
  peer = await fixtures.seedUser("routes");
});

afterEach(async () => {
  await fixtures.cleanup();
});

async function createDirectConversation() {
  const result = await auth.api.notification.direct.post({ userId: peer.id });
  expect(result.error).toBeNull();
  if (!result.data) throw new Error("Direct route returned no conversation");
  fixtures.trackConversation(result.data.id);
  return result.data;
}

async function unreadCount() {
  const result = await auth.api.notification.unread.get();
  expect(result.error).toBeNull();
  return result.data?.count ?? 0;
}

describe("Notification create controller", () => {
  test("creates direct conversations, messages, and announcements", async () => {
    const direct = await createDirectConversation();
    const sent = await auth.api.notification
      .conversations({ conversationId: direct.id })
      .messages.post({ body: "Created through the notification route" });
    expect(sent.error).toBeNull();
    expect(sent.data?.body).toBe("Created through the notification route");

    const createdAnnouncement = await auth.api.notification.announcements.post({
      title: `Route draft ${crypto.randomUUID()}`,
      body: "Draft announcement created through Eden",
      status: "draft",
      targets: [{ kind: "all" }],
    });
    expect(createdAnnouncement.error).toBeNull();
    expect(createdAnnouncement.data?.status).toBe("draft");
    if (createdAnnouncement.data) fixtures.trackAnnouncement(createdAnnouncement.data.id);
  });
});

describe("Notification read controller", () => {
  test("reads conversations, unread totals, users, history, and announcements", async () => {
    const unreadBefore = await unreadCount();
    const direct = await createDirectConversation();
    const sent = await auth.api.notification
      .conversations({ conversationId: direct.id })
      .messages.post({ body: "Readable route message" });
    expect(sent.error).toBeNull();

    const announcement = await auth.api.notification.announcements.post({
      title: `Readable draft ${crypto.randomUUID()}`,
      body: "Readable route announcement",
      status: "draft",
      targets: [{ kind: "user", value: peer.id }],
    });
    if (announcement.data) fixtures.trackAnnouncement(announcement.data.id);

    const [conversations, unread, users, history, announcements] = await Promise.all([
      auth.api.notification.conversations.get(),
      auth.api.notification.unread.get(),
      auth.api.notification.users.get({ query: { q: peer.name } }),
      auth.api.notification
        .conversations({ conversationId: direct.id })
        .messages.get({ query: { limit: 20 } }),
      auth.api.notification.announcements.get(),
    ]);

    expect(conversations.error).toBeNull();
    expect(conversations.data?.some(({ id }) => id === direct.id)).toBe(true);
    expect(unread.data).toEqual({ count: unreadBefore });
    expect(users.data?.map(({ id }) => id)).toContain(peer.id);
    expect(history.data?.items.map(({ body }) => body)).toContain("Readable route message");
    expect(announcements.data?.some(({ id }) => id === announcement.data?.id)).toBe(true);
  });
});

describe("Notification update controller", () => {
  test("updates read state, Firebase registration, and announcement cancellation", async () => {
    const unreadBefore = await unreadCount();
    const direct = await createDirectConversation();
    const incoming = await sendDirectMessage(direct.id, peer.id, "Unread route message");
    expect((await auth.api.notification.unread.get()).data).toEqual({ count: unreadBefore + 1 });

    const read = await auth.api.notification
      .conversations({ conversationId: direct.id })
      .read.post({ throughMessageId: incoming.id });
    expect(read.data).toEqual({ success: true });
    expect((await auth.api.notification.unread.get()).data).toEqual({ count: unreadBefore });

    const fid = fixtures.trackDevice(`route-fid-${crypto.randomUUID()}`);
    const device = await auth.api.notification.devices.put({ fid, platform: "web" });
    expect(device.error).toBeNull();
    expect(device.data?.fid).toBe(fid);

    const scheduled = await auth.api.notification.announcements.post({
      title: `Scheduled route ${crypto.randomUUID()}`,
      body: "Scheduled route announcement",
      scheduledAt: new Date(Date.now() + 86_400_000),
      targets: [{ kind: "all" }],
    });
    if (!scheduled.data) throw new Error("Announcement route returned no data");
    fixtures.trackAnnouncement(scheduled.data.id);
    const cancelled = await auth.api.notification
      .announcements({ id: scheduled.data.id })
      .cancel.post();
    expect(cancelled.error).toBeNull();
    expect(cancelled.data?.status).toBe("cancelled");
  });
});

describe("Notification delete controller", () => {
  test("soft-deletes messages and announcements and detaches devices", async () => {
    const direct = await createDirectConversation();
    const sent = await auth.api.notification
      .conversations({ conversationId: direct.id })
      .messages.post({ body: "Delete through the route" });
    if (!sent.data) throw new Error("Message route returned no data");
    const deletedMessage = await auth.api.notification.messages({ id: sent.data.id }).delete();
    expect(deletedMessage.error).toBeNull();
    expect(deletedMessage.data).toMatchObject({ body: "", deletedById: auth.user.id });

    const fid = fixtures.trackDevice(`delete-route-fid-${crypto.randomUUID()}`);
    await auth.api.notification.devices.put({ fid, platform: "web" });
    const detached = await auth.api.notification.devices.delete({ fid, platform: "web" });
    expect(detached.data).toEqual({ success: true });

    const announcement = await auth.api.notification.announcements.post({
      title: `Delete route draft ${crypto.randomUUID()}`,
      body: "Delete route announcement",
      status: "draft",
      targets: [{ kind: "all" }],
    });
    if (!announcement.data) throw new Error("Announcement route returned no data");
    fixtures.trackAnnouncement(announcement.data.id);
    const deletedAnnouncement = await auth.api.notification
      .announcements({ id: announcement.data.id })
      .delete();
    expect(deletedAnnouncement.error).toBeNull();
    expect(deletedAnnouncement.data?.deletedAt).toBeInstanceOf(Date);
  });
});
