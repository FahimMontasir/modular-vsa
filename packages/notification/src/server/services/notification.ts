import { and, asc, count, desc, eq, ilike, inArray, isNull, lt, ne, or, sql } from "drizzle-orm";

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
import {
  enqueueAnnouncementDispatch,
  enqueueNotificationDeliveries,
} from "@modular-vsa/jobs/notification";
import { ApiError } from "@modular-vsa/shared/server/apiError";

import {
  decodeCursor,
  directConversationKey,
  encodeCursor,
  normalizeAnnouncementTargets,
  normalizeInternalUrl,
  tombstone,
} from "../helpers/notification";
import type { CreateAnnouncementBody, PlatformNotificationInput } from "../types";

const ANNOUNCEMENT_KEY = "announcement:global";
const SOURCE_TITLES: Record<string, string> = {
  account: "Account",
  security: "Security",
  content: "Content",
  system: "System",
};

async function requireParticipant(conversationId: string, userId: string) {
  const [row] = await db
    .select({ conversationId: conversationParticipant.conversationId })
    .from(conversationParticipant)
    .where(
      and(
        eq(conversationParticipant.conversationId, conversationId),
        eq(conversationParticipant.userId, userId)
      )
    )
    .limit(1);
  if (!row) throw new ApiError("Forbidden", "Conversation access denied");
}

async function ensureConversation(key: string, values: typeof conversation.$inferInsert) {
  await db.insert(conversation).values(values).onConflictDoNothing({ target: conversation.key });
  const [row] = await db.select().from(conversation).where(eq(conversation.key, key)).limit(1);
  if (!row) throw new ApiError("Internal Server Error", "Conversation could not be created");
  return row;
}

async function queueDeliveries(deliveryIds: string[]) {
  if (deliveryIds.length) await enqueueNotificationDeliveries(deliveryIds);
}

export async function createDirectConversation(currentUserId: string, otherUserId: string) {
  if (currentUserId === otherUserId)
    throw new ApiError("Bad Request", "You cannot message yourself");
  const [other] = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(and(eq(user.id, otherUserId), eq(user.banned, false)))
    .limit(1);
  if (!other) throw new ApiError("Not Found", "User not found");

  const key = directConversationKey(currentUserId, otherUserId);
  const row = await ensureConversation(key, {
    kind: "direct",
    key,
    title: other.name,
    createdById: currentUserId,
  });
  await db
    .insert(conversationParticipant)
    .values([
      { conversationId: row.id, userId: currentUserId },
      { conversationId: row.id, userId: otherUserId },
    ])
    .onConflictDoNothing();
  return row;
}

export async function listUsers(currentUserId: string, query = "") {
  const filters = [ne(user.id, currentUserId), eq(user.banned, false)];
  if (query.trim()) filters.push(ilike(user.name, `%${query.trim()}%`));
  return db
    .select({ id: user.id, name: user.name, username: user.username, image: user.image })
    .from(user)
    .where(and(...filters))
    .orderBy(asc(user.name))
    .limit(30);
}

export async function listConversations(userId: string) {
  const announcements = await ensureConversation(ANNOUNCEMENT_KEY, {
    kind: "announcement",
    key: ANNOUNCEMENT_KEY,
    title: "Announcements",
  });
  await db
    .insert(conversationParticipant)
    .values({ conversationId: announcements.id, userId })
    .onConflictDoNothing();

  const rows = await db
    .select({
      id: conversation.id,
      kind: conversation.kind,
      key: conversation.key,
      title: conversation.title,
      source: conversation.source,
      lastMessageAt: conversation.lastMessageAt,
    })
    .from(conversationParticipant)
    .innerJoin(conversation, eq(conversation.id, conversationParticipant.conversationId))
    .where(eq(conversationParticipant.userId, userId));

  const summaries = await Promise.all(
    rows.map(async (row) => {
      const [[last], [unread]] = await Promise.all([
        db
          .select({ body: message.body, deletedAt: message.deletedAt })
          .from(message)
          .leftJoin(
            messageRecipient,
            and(eq(messageRecipient.messageId, message.id), eq(messageRecipient.userId, userId))
          )
          .where(
            and(
              eq(message.conversationId, row.id),
              or(eq(message.senderId, userId), eq(messageRecipient.userId, userId))
            )
          )
          .orderBy(desc(message.createdAt), desc(message.id))
          .limit(1),
        db
          .select({ count: count() })
          .from(messageRecipient)
          .innerJoin(message, eq(message.id, messageRecipient.messageId))
          .where(
            and(
              eq(messageRecipient.userId, userId),
              eq(message.conversationId, row.id),
              isNull(messageRecipient.readAt),
              isNull(messageRecipient.hiddenAt)
            )
          ),
      ]);
      let title = row.title;
      let image: string | null = null;
      if (row.kind === "direct") {
        const [peer] = await db
          .select({ name: user.name, image: user.image })
          .from(conversationParticipant)
          .innerJoin(user, eq(user.id, conversationParticipant.userId))
          .where(
            and(
              eq(conversationParticipant.conversationId, row.id),
              ne(conversationParticipant.userId, userId)
            )
          )
          .limit(1);
        title = peer?.name ?? title;
        image = peer?.image ?? null;
      }
      return {
        ...row,
        title,
        image,
        unreadCount: unread?.count ?? 0,
        lastMessage: last ? (last.deletedAt ? "Message deleted" : last.body) : null,
      };
    })
  );
  return summaries.toSorted((a, b) => {
    function rank(kind: string) {
      return kind === "announcement" ? 0 : kind === "platform" ? 1 : 2;
    }
    return rank(a.kind) - rank(b.kind) || b.lastMessageAt.getTime() - a.lastMessageAt.getTime();
  });
}

export async function unreadTotal(userId: string) {
  const [row] = await db
    .select({ count: count() })
    .from(messageRecipient)
    .where(
      and(
        eq(messageRecipient.userId, userId),
        isNull(messageRecipient.readAt),
        isNull(messageRecipient.hiddenAt)
      )
    );
  return { count: row?.count ?? 0 };
}

export async function listMessages(
  conversationId: string,
  userId: string,
  limit = 50,
  cursorValue?: string
) {
  await requireParticipant(conversationId, userId);
  const cursor = decodeCursor(cursorValue);
  if (cursorValue && !cursor) throw new ApiError("Bad Request", "Invalid message cursor");
  const rows = await db
    .select({
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderName: user.name,
      senderImage: user.image,
      kind: message.kind,
      title: message.title,
      body: message.body,
      actionUrl: message.actionUrl,
      deletedAt: message.deletedAt,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    })
    .from(message)
    .leftJoin(user, eq(user.id, message.senderId))
    .leftJoin(
      messageRecipient,
      and(eq(messageRecipient.messageId, message.id), eq(messageRecipient.userId, userId))
    )
    .where(
      and(
        eq(message.conversationId, conversationId),
        or(eq(message.senderId, userId), eq(messageRecipient.userId, userId)),
        cursor
          ? or(
              lt(message.createdAt, cursor.createdAt),
              and(eq(message.createdAt, cursor.createdAt), lt(message.id, cursor.id))
            )
          : undefined
      )
    )
    .orderBy(desc(message.createdAt), desc(message.id))
    .limit(limit + 1);
  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  const oldest = page.at(-1);
  return {
    items: page.reverse().map(tombstone),
    nextCursor: hasMore && oldest ? encodeCursor(oldest.createdAt, oldest.id) : null,
  };
}

export async function sendDirectMessage(conversationId: string, senderId: string, body: string) {
  await requireParticipant(conversationId, senderId);
  const [targetConversation] = await db
    .select()
    .from(conversation)
    .where(eq(conversation.id, conversationId))
    .limit(1);
  if (!targetConversation || targetConversation.kind !== "direct")
    throw new ApiError("Bad Request", "Only direct conversations accept user messages");

  const normalizedBody = body.trim();
  if (!normalizedBody) throw new ApiError("Bad Request", "Message cannot be empty");
  const created = await db.transaction(async (tx) => {
    const [createdMessage] = await tx
      .insert(message)
      .values({ conversationId, senderId, kind: "direct", body: normalizedBody })
      .returning();
    if (!createdMessage)
      throw new ApiError("Internal Server Error", "Message could not be created");
    const recipients = await tx
      .select({ userId: conversationParticipant.userId })
      .from(conversationParticipant)
      .where(
        and(
          eq(conversationParticipant.conversationId, conversationId),
          ne(conversationParticipant.userId, senderId)
        )
      );
    if (!recipients.length) return { message: createdMessage, deliveryIds: [] as string[] };
    await tx
      .insert(messageRecipient)
      .values(recipients.map(({ userId }) => ({ messageId: createdMessage.id, userId })));
    const deliveries = await tx
      .insert(notificationDelivery)
      .values(recipients.map(({ userId }) => ({ messageId: createdMessage.id, userId })))
      .returning({ id: notificationDelivery.id });
    await tx
      .update(conversation)
      .set({ lastMessageAt: createdMessage.createdAt, updatedAt: new Date() })
      .where(eq(conversation.id, conversationId));
    return { message: createdMessage, deliveryIds: deliveries.map(({ id }) => id) };
  });
  await queueDeliveries(created.deliveryIds);
  return created.message;
}

export async function markConversationRead(
  conversationId: string,
  userId: string,
  throughMessageId: string
) {
  await requireParticipant(conversationId, userId);
  const [through] = await db
    .select({ id: message.id })
    .from(message)
    .where(and(eq(message.id, throughMessageId), eq(message.conversationId, conversationId)))
    .limit(1);
  if (!through) throw new ApiError("Not Found", "Message not found");
  const ids = await db
    .select({ id: message.id })
    .from(message)
    .where(
      and(
        eq(message.conversationId, conversationId),
        sql`${message.createdAt} <= (
          select boundary.created_at
          from notification_message as boundary
          where boundary.id = ${throughMessageId}
        )`
      )
    );
  if (ids.length) {
    await db
      .update(messageRecipient)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(messageRecipient.userId, userId),
          isNull(messageRecipient.readAt),
          inArray(
            messageRecipient.messageId,
            ids.map(({ id }) => id)
          )
        )
      );
  }
  return { success: true };
}

export async function softDeleteMessage(messageId: string, userId: string, isAdmin: boolean) {
  const [existing] = await db.select().from(message).where(eq(message.id, messageId)).limit(1);
  if (!existing) throw new ApiError("Not Found", "Message not found");
  if (existing.senderId !== userId || (existing.kind === "announcement" && !isAdmin))
    throw new ApiError("Forbidden", "Message deletion denied");
  const [updated] = await db
    .update(message)
    .set({ deletedAt: new Date(), deletedById: userId, updatedAt: new Date() })
    .where(eq(message.id, messageId))
    .returning();
  return tombstone(updated!);
}

export async function registerDevice(
  userId: string,
  values: { fid: string; platform?: string; userAgent?: string }
) {
  const [row] = await db
    .insert(deviceRegistration)
    .values({
      userId,
      fid: values.fid,
      platform: values.platform ?? "web",
      userAgent: values.userAgent,
    })
    .onConflictDoUpdate({
      target: deviceRegistration.fid,
      set: {
        userId,
        platform: values.platform ?? "web",
        userAgent: values.userAgent,
        disabledAt: null,
        lastSeenAt: new Date(),
      },
    })
    .returning();
  return row!;
}

export async function detachDevice(userId: string, fid: string) {
  await db
    .update(deviceRegistration)
    .set({ disabledAt: new Date() })
    .where(and(eq(deviceRegistration.userId, userId), eq(deviceRegistration.fid, fid)));
  return { success: true };
}

export async function createAnnouncement(userId: string, values: CreateAnnouncementBody) {
  let targets: ReturnType<typeof normalizeAnnouncementTargets>;
  try {
    targets = normalizeAnnouncementTargets(values.targets);
  } catch (error) {
    throw new ApiError("Bad Request", error instanceof Error ? error.message : "Invalid targets");
  }
  const scheduledAt = values.scheduledAt ?? new Date();
  const created = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(announcement)
      .values({
        createdById: userId,
        title: values.title.trim(),
        body: values.body.trim(),
        actionUrl: normalizeInternalUrl(values.actionUrl),
        status: values.status ?? "scheduled",
        scheduledAt,
      })
      .returning();
    if (!row) throw new ApiError("Internal Server Error", "Announcement could not be created");
    await tx.insert(announcementTarget).values(
      targets.map((target) => ({
        announcementId: row.id,
        kind: target.kind,
        value: target.value,
      }))
    );
    return row;
  });
  if (created.status === "scheduled") await enqueueAnnouncementDispatch(created.id, scheduledAt);
  return created;
}

export async function listAnnouncements() {
  return db
    .select()
    .from(announcement)
    .where(isNull(announcement.deletedAt))
    .orderBy(desc(announcement.createdAt))
    .limit(100);
}

export async function cancelAnnouncement(id: string, userId: string) {
  const [row] = await db
    .update(announcement)
    .set({ status: "cancelled", cancelledAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(announcement.id, id),
        eq(announcement.createdById, userId),
        eq(announcement.status, "scheduled")
      )
    )
    .returning();
  if (!row) throw new ApiError("Bad Request", "Only your scheduled announcements can be cancelled");
  return row;
}

export async function softDeleteAnnouncement(id: string, userId: string) {
  const [row] = await db
    .update(announcement)
    .set({ deletedAt: new Date(), deletedById: userId, updatedAt: new Date() })
    .where(and(eq(announcement.id, id), isNull(announcement.deletedAt)))
    .returning({ id: announcement.id, deletedAt: announcement.deletedAt });
  if (!row) throw new ApiError("Not Found", "Announcement not found");
  return row;
}

export async function publishPlatformNotification(input: PlatformNotificationInput) {
  const recipientIds = [...new Set(input.recipientIds)];
  if (!recipientIds.length) return null;
  const key = `platform:${input.source}`;
  const targetConversation = await ensureConversation(key, {
    kind: "platform",
    key,
    title: SOURCE_TITLES[input.source] ?? input.source,
    source: input.source,
  });
  const result = await db.transaction(async (tx) => {
    await tx
      .insert(conversationParticipant)
      .values(recipientIds.map((userId) => ({ conversationId: targetConversation.id, userId })))
      .onConflictDoNothing();
    const [createdMessage] = await tx
      .insert(message)
      .values({
        conversationId: targetConversation.id,
        kind: "platform",
        title: input.title,
        body: input.body,
        actionUrl: normalizeInternalUrl(input.actionUrl),
      })
      .returning();
    if (!createdMessage)
      throw new ApiError("Internal Server Error", "Notification could not be created");
    await tx
      .insert(messageRecipient)
      .values(recipientIds.map((userId) => ({ messageId: createdMessage.id, userId })));
    const deliveries = await tx
      .insert(notificationDelivery)
      .values(recipientIds.map((userId) => ({ messageId: createdMessage.id, userId })))
      .returning({ id: notificationDelivery.id });
    await tx
      .update(conversation)
      .set({ lastMessageAt: createdMessage.createdAt, updatedAt: new Date() })
      .where(eq(conversation.id, targetConversation.id));
    return { message: createdMessage, deliveryIds: deliveries.map(({ id }) => id) };
  });
  await queueDeliveries(result.deliveryIds);
  return result.message;
}
