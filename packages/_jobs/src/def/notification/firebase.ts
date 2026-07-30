import { and, eq, isNull, lte, or } from "drizzle-orm";

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
  notificationDeliveryTarget,
} from "@modular-vsa/db/schema/notification";
import { sendFidMulticastPushNotification } from "@modular-vsa/firebase/server/messaging";
import { logger } from "@modular-vsa/shared/common/logger";

import { defineJob } from "../../core/job";
import { enqueue } from "../../core/queue";
import { aggregateFirebaseDeliveryState } from "./firebase-delivery-state";
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
  if (!row || row.status === "accepted" || row.status === "failed" || row.status === "skipped")
    return;

  const devices = await db
    .select({ id: deviceRegistration.id, fid: deviceRegistration.fid })
    .from(deviceRegistration)
    .where(and(eq(deviceRegistration.userId, row.userId), isNull(deviceRegistration.disabledAt)));
  const now = new Date();
  if (!devices.length) {
    await db
      .update(notificationDelivery)
      .set({
        status: "skipped",
        lastError: "No active Firebase registration",
        updatedAt: now,
      })
      .where(eq(notificationDelivery.id, row.id));
    return;
  }

  await db
    .insert(notificationDeliveryTarget)
    .values(
      devices.map(({ id: deviceRegistrationId }) => ({
        deliveryId: row.id,
        deviceRegistrationId,
      }))
    )
    .onConflictDoNothing();

  const targets = await db
    .select({
      id: notificationDeliveryTarget.id,
      deviceRegistrationId: notificationDeliveryTarget.deviceRegistrationId,
      fid: deviceRegistration.fid,
      status: notificationDeliveryTarget.status,
      attempts: notificationDeliveryTarget.attempts,
      nextAttemptAt: notificationDeliveryTarget.nextAttemptAt,
      lastError: notificationDeliveryTarget.lastError,
    })
    .from(notificationDeliveryTarget)
    .innerJoin(
      deviceRegistration,
      eq(deviceRegistration.id, notificationDeliveryTarget.deviceRegistrationId)
    )
    .where(
      and(eq(notificationDeliveryTarget.deliveryId, row.id), isNull(deviceRegistration.disabledAt))
    );
  const dueTargets = targets.filter(
    ({ status, nextAttemptAt }) =>
      (status === "pending" || status === "retry") && nextAttemptAt.getTime() <= now.getTime()
  );

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
  for (let index = 0; index < dueTargets.length; index += 500) {
    const batch = dueTargets.slice(index, index + 500);
    let responses;
    try {
      const response = await sendFidMulticastPushNotification({
        fids: batch.map(({ fid }) => fid),
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
      responses = response.responses;
    } catch (error) {
      const failure = safeError(error);
      responses = batch.map(() => ({ success: false as const, error: failure }));
    }

    await Promise.all(
      responses.map(async (result, responseIndex) => {
        const target = batch[responseIndex];
        if (!target) return;
        if (result.success) {
          await db
            .update(notificationDeliveryTarget)
            .set({
              status: "accepted",
              attempts: target.attempts + 1,
              acceptedAt: now,
              lastError: null,
              updatedAt: now,
            })
            .where(eq(notificationDeliveryTarget.id, target.id));
          return;
        }

        const failure = safeError(result.error);
        const classification = classifyFirebaseError(failure.code, target.attempts);
        if (classification === "invalid")
          await db
            .update(deviceRegistration)
            .set({ disabledAt: now })
            .where(eq(deviceRegistration.id, target.deviceRegistrationId));
        await db
          .update(notificationDeliveryTarget)
          .set({
            status:
              classification === "transient"
                ? "retry"
                : classification === "invalid"
                  ? "skipped"
                  : "failed",
            attempts: target.attempts + 1,
            nextAttemptAt: new Date(now.getTime() + retryDelayMs(target.attempts)),
            lastError: failure.code,
            updatedAt: now,
          })
          .where(eq(notificationDeliveryTarget.id, target.id));
      })
    );
  }

  const activeTargets = await db
    .select({
      status: notificationDeliveryTarget.status,
      nextAttemptAt: notificationDeliveryTarget.nextAttemptAt,
      lastError: notificationDeliveryTarget.lastError,
    })
    .from(notificationDeliveryTarget)
    .innerJoin(
      deviceRegistration,
      eq(deviceRegistration.id, notificationDeliveryTarget.deviceRegistrationId)
    )
    .where(
      and(eq(notificationDeliveryTarget.deliveryId, row.id), isNull(deviceRegistration.disabledAt))
    );
  const aggregate = aggregateFirebaseDeliveryState(activeTargets, now);
  await db
    .update(notificationDelivery)
    .set({
      status: aggregate.status,
      attempts: dueTargets.length ? row.attempts + 1 : row.attempts,
      nextAttemptAt: aggregate.nextAttemptAt,
      acceptedAt: aggregate.status === "accepted" ? now : null,
      lastError: aggregate.lastError,
      updatedAt: now,
    })
    .where(eq(notificationDelivery.id, row.id));

  if (aggregate.status === "retry") {
    const delayMs = Math.max(0, aggregate.nextAttemptAt.getTime() - Date.now());
    await enqueueNotificationDeliveries([row.id], delayMs);
  }
}

export const firebaseDeliveryJob = defineJob({
  name: "notification.firebase-delivery",
  queue: "notification",
  handler: async ({ deliveryIds }: { deliveryIds: string[] }) => {
    for (const deliveryId of deliveryIds) await deliver(deliveryId);
    return { success: true };
  },
});

export function enqueueNotificationDeliveries(deliveryIds: string[], delayMs = 0) {
  return Promise.all(
    deliveryIds.map((deliveryId) =>
      enqueue(
        firebaseDeliveryJob,
        { deliveryIds: [deliveryId] },
        {
          jobId: firebaseDeliveryJobId(deliveryId),
          delay: delayMs,
          removeOnComplete: 100,
          removeOnFail: true,
        }
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
  if (rows.length) {
    await enqueueNotificationDeliveries(rows.map(({ id }) => id));
    logger.info(`[notification] reconciled ${rows.length} Firebase deliveries`);
  }
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
