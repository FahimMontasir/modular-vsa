import { and, eq, inArray, isNull, lte, or } from "drizzle-orm";

import { db } from "@modular-vsa/db";
import { user } from "@modular-vsa/db/schema/auth";
import {
  announcement,
  announcementTarget,
  conversation,
  conversationParticipant,
  deviceRegistration,
  message,
  messageRecipient,
  notificationDelivery,
} from "@modular-vsa/db/schema/notification";
import { sendMulticastPushNotification } from "@modular-vsa/firebase/server/messaging";
import { logger } from "@modular-vsa/shared/common/logger";

import { defineJob } from "../../core/job";
import { enqueue } from "../../core/queue";
import { classifyFirebaseError, firebaseDeliveryJobId, retryDelayMs } from "./firebase-helpers";

export { classifyFirebaseError, firebaseDeliveryJobId, retryDelayMs } from "./firebase-helpers";

function safeError(error: unknown) {
  const value = error as { code?: string; message?: string };
  return {
    code: value.code ?? "messaging/unknown-error",
    message: (value.message ?? "Firebase delivery failed").slice(0, 500),
  };
}

async function deliver(deliveryId: string) {
  const [row] = await db
    .select({
      id: notificationDelivery.id,
      status: notificationDelivery.status,
      attempts: notificationDelivery.attempts,
      userId: notificationDelivery.userId,
      messageId: message.id,
      conversationId: message.conversationId,
      kind: message.kind,
      title: message.title,
      senderName: user.name,
      source: conversation.source,
    })
    .from(notificationDelivery)
    .innerJoin(message, eq(message.id, notificationDelivery.messageId))
    .innerJoin(conversation, eq(conversation.id, message.conversationId))
    .leftJoin(user, eq(user.id, message.senderId))
    .where(eq(notificationDelivery.id, deliveryId))
    .limit(1);
  if (!row || row.status === "accepted" || row.status === "skipped") return;

  const devices = await db
    .select({ id: deviceRegistration.id, fid: deviceRegistration.fid })
    .from(deviceRegistration)
    .where(and(eq(deviceRegistration.userId, row.userId), isNull(deviceRegistration.disabledAt)));
  if (!devices.length) {
    await db
      .update(notificationDelivery)
      .set({
        status: "skipped",
        lastError: "No active Firebase registration",
        updatedAt: new Date(),
      })
      .where(eq(notificationDelivery.id, row.id));
    return;
  }

  const title =
    row.kind === "direct"
      ? (row.senderName ?? "New message")
      : row.kind === "platform"
        ? `${row.source ?? "Platform"}: ${row.title ?? "New update"}`
        : (row.title ?? "New announcement");
  const body =
    row.kind === "direct"
      ? "Sent you a message"
      : row.kind === "announcement"
        ? "A new announcement is available"
        : "A new platform update is available";
  const destination = `/?messenger=${encodeURIComponent(row.conversationId)}`;
  const responses = [];
  for (let index = 0; index < devices.length; index += 500) {
    const batch = devices.slice(index, index + 500);
    try {
      const response = await sendMulticastPushNotification({
        tokens: batch.map(({ fid }) => fid),
        data: {
          type: row.kind,
          conversationId: row.conversationId,
          messageId: row.messageId,
          destination,
          pushTitle: title,
          pushBody: body,
        },
        webpush: { fcmOptions: { link: destination } },
      });
      responses.push(...response.responses);
    } catch (error) {
      const failure = safeError(error);
      responses.push(...batch.map(() => ({ success: false, error: failure })));
    }
  }

  const failures = responses.flatMap((result, index) => {
    if (result.success) return [];
    return [{ device: devices[index], error: safeError(result.error) }];
  });
  const invalidIds = failures
    .filter(({ error }) => classifyFirebaseError(error.code) === "invalid")
    .flatMap(({ device }) => (device ? [device.id] : []));
  if (invalidIds.length)
    await db
      .update(deviceRegistration)
      .set({ disabledAt: new Date() })
      .where(inArray(deviceRegistration.id, invalidIds));

  if (responses.some(({ success }) => success)) {
    await db
      .update(notificationDelivery)
      .set({
        status: "accepted",
        attempts: row.attempts + 1,
        acceptedAt: new Date(),
        lastError: failures[0]?.error.code ?? null,
        updatedAt: new Date(),
      })
      .where(eq(notificationDelivery.id, row.id));
    return;
  }

  const failure = failures[0]?.error ?? {
    code: "messaging/unknown-error",
    message: "Firebase rejected every device",
  };
  const transient = classifyFirebaseError(failure.code) === "transient";
  await db
    .update(notificationDelivery)
    .set({
      status: transient ? "retry" : "failed",
      attempts: row.attempts + 1,
      nextAttemptAt: new Date(Date.now() + retryDelayMs(row.attempts)),
      lastError: failure.code,
      updatedAt: new Date(),
    })
    .where(eq(notificationDelivery.id, row.id));
  if (transient) throw new Error(failure.message);
}

export const firebaseDeliveryJob = defineJob({
  name: "notification.firebase-delivery",
  queue: "notification",
  handler: async ({ deliveryIds }: { deliveryIds: string[] }) => {
    for (const deliveryId of deliveryIds) await deliver(deliveryId);
    return { success: true };
  },
});

export function enqueueNotificationDeliveries(deliveryIds: string[]) {
  return Promise.all(
    deliveryIds.map((deliveryId) =>
      enqueue(
        firebaseDeliveryJob,
        { deliveryIds: [deliveryId] },
        { jobId: firebaseDeliveryJobId(deliveryId), removeOnComplete: 100, removeOnFail: true }
      )
    )
  );
}

export const announcementDispatchJob = defineJob({
  name: "notification.announcement-dispatch",
  queue: "notification",
  handler: async ({ announcementId }: { announcementId: string }) => {
    const result = await db.transaction(async (tx) => {
      const [item] = await tx
        .select()
        .from(announcement)
        .where(
          and(
            eq(announcement.id, announcementId),
            eq(announcement.status, "scheduled"),
            lte(announcement.scheduledAt, new Date())
          )
        )
        .limit(1);
      if (!item) return null;
      await tx
        .update(announcement)
        .set({ status: "sending", updatedAt: new Date() })
        .where(eq(announcement.id, item.id));
      const targets = await tx
        .select()
        .from(announcementTarget)
        .where(eq(announcementTarget.announcementId, item.id));
      const roles = targets
        .filter(({ kind }) => kind === "role")
        .flatMap(({ value }) => (value ? [value] : []));
      const explicit = targets
        .filter(({ kind }) => kind === "user")
        .flatMap(({ value }) => (value ? [value] : []));
      const all = targets.some(({ kind }) => kind === "all");
      const candidates = await tx
        .select({ id: user.id, role: user.role })
        .from(user)
        .where(eq(user.banned, false));
      const recipientIds = [
        ...new Set(
          candidates
            .filter(
              ({ id, role }) =>
                all ||
                explicit.includes(id) ||
                role
                  ?.split(",")
                  .map((value) => value.trim())
                  .some((value) => roles.includes(value))
            )
            .map(({ id }) => id)
        ),
      ];
      const key = "announcement:global";
      await tx
        .insert(conversation)
        .values({ kind: "announcement", key, title: "Announcements" })
        .onConflictDoNothing({ target: conversation.key });
      const [thread] = await tx
        .select()
        .from(conversation)
        .where(eq(conversation.key, key))
        .limit(1);
      if (!thread) throw new Error("Announcement conversation missing");
      if (recipientIds.length)
        await tx
          .insert(conversationParticipant)
          .values(recipientIds.map((userId) => ({ conversationId: thread.id, userId })))
          .onConflictDoNothing();
      const [createdMessage] = await tx
        .insert(message)
        .values({
          conversationId: thread.id,
          senderId: item.createdById,
          kind: "announcement",
          title: item.title,
          body: item.body,
          actionUrl: item.actionUrl,
        })
        .returning();
      if (!createdMessage) throw new Error("Announcement message could not be created");
      let deliveryIds: string[] = [];
      if (recipientIds.length) {
        await tx
          .insert(messageRecipient)
          .values(recipientIds.map((userId) => ({ messageId: createdMessage.id, userId })));
        const deliveries = await tx
          .insert(notificationDelivery)
          .values(recipientIds.map((userId) => ({ messageId: createdMessage.id, userId })))
          .returning({ id: notificationDelivery.id });
        deliveryIds = deliveries.map(({ id }) => id);
      }
      await tx
        .update(conversation)
        .set({ lastMessageAt: createdMessage.createdAt, updatedAt: new Date() })
        .where(eq(conversation.id, thread.id));
      await tx
        .update(announcement)
        .set({
          status: "sent",
          messageId: createdMessage.id,
          sentAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(announcement.id, item.id));
      return deliveryIds;
    });
    if (result?.length) await enqueueNotificationDeliveries(result);
    return { success: true };
  },
});

export function enqueueAnnouncementDispatch(announcementId: string, scheduledAt: Date) {
  return enqueue(
    announcementDispatchJob,
    { announcementId },
    {
      jobId: `announcement-${announcementId}`,
      delay: Math.max(0, scheduledAt.getTime() - Date.now()),
      removeOnComplete: 100,
      removeOnFail: 100,
    }
  );
}

export async function reconcileNotificationDeliveries() {
  const rows = await db
    .select({ id: notificationDelivery.id })
    .from(notificationDelivery)
    .where(
      and(
        or(eq(notificationDelivery.status, "pending"), eq(notificationDelivery.status, "retry")),
        lte(notificationDelivery.nextAttemptAt, new Date())
      )
    )
    .limit(500);
  if (rows.length) await enqueueNotificationDeliveries(rows.map(({ id }) => id));
  logger.info(`[notification] reconciled ${rows.length} Firebase deliveries`);
  return { count: rows.length };
}

export async function reconcileAnnouncements() {
  const rows = await db
    .select({ id: announcement.id, scheduledAt: announcement.scheduledAt })
    .from(announcement)
    .where(and(eq(announcement.status, "scheduled"), lte(announcement.scheduledAt, new Date())))
    .limit(100);
  await Promise.all(
    rows.map(({ id, scheduledAt }) => enqueueAnnouncementDispatch(id, scheduledAt))
  );
  return { count: rows.length };
}
