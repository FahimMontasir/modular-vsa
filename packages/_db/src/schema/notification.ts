import { relations } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  pgTable,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

function id() {
  return text("id").$defaultFn(() => crypto.randomUUID());
}

export const conversation = pgTable(
  "notification_conversation",
  {
    id: id().primaryKey(),
    kind: text("kind").notNull(),
    key: text("key").notNull(),
    title: text("title").notNull(),
    source: text("source"),
    createdById: text("created_by_id").references(() => user.id, { onDelete: "set null" }),
    lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("notification_conversation_key_uidx").on(table.key),
    index("notification_conversation_last_idx").on(table.lastMessageAt),
  ]
);

export const conversationParticipant = pgTable(
  "notification_conversation_participant",
  {
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversation.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.conversationId, table.userId] }),
    index("notification_participant_user_idx").on(table.userId),
  ]
);

export const message = pgTable(
  "notification_message",
  {
    id: id().primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversation.id, { onDelete: "cascade" }),
    senderId: text("sender_id").references(() => user.id, { onDelete: "set null" }),
    kind: text("kind").notNull(),
    title: text("title"),
    body: text("body").notNull(),
    actionUrl: text("action_url"),
    deletedAt: timestamp("deleted_at"),
    deletedById: text("deleted_by_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { precision: 3 }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { precision: 3 }).defaultNow().notNull(),
  },
  (table) => [
    index("notification_message_conversation_idx").on(table.conversationId, table.createdAt),
  ]
);

export const messageRecipient = pgTable(
  "notification_message_recipient",
  {
    messageId: text("message_id")
      .notNull()
      .references(() => message.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    readAt: timestamp("read_at"),
    hiddenAt: timestamp("hidden_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.messageId, table.userId] }),
    index("notification_recipient_unread_idx").on(table.userId, table.readAt),
  ]
);

export const deviceRegistration = pgTable(
  "notification_device_registration",
  {
    id: id().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    fid: text("fid").notNull(),
    platform: text("platform").default("web").notNull(),
    userAgent: text("user_agent"),
    lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
    disabledAt: timestamp("disabled_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("notification_device_fid_uidx").on(table.fid),
    index("notification_device_user_idx").on(table.userId),
  ]
);

export const notificationDelivery = pgTable(
  "notification_delivery",
  {
    id: id().primaryKey(),
    messageId: text("message_id")
      .notNull()
      .references(() => message.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status").default("pending").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    nextAttemptAt: timestamp("next_attempt_at").defaultNow().notNull(),
    acceptedAt: timestamp("accepted_at"),
    lastError: text("last_error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("notification_delivery_message_user_uidx").on(table.messageId, table.userId),
    index("notification_delivery_pending_idx").on(table.status, table.nextAttemptAt),
  ]
);

export const notificationDeliveryTarget = pgTable(
  "notification_delivery_target",
  {
    id: id().primaryKey(),
    deliveryId: text("delivery_id")
      .notNull()
      .references(() => notificationDelivery.id, { onDelete: "cascade" }),
    deviceRegistrationId: text("device_registration_id")
      .notNull()
      .references(() => deviceRegistration.id, { onDelete: "cascade" }),
    status: text("status").default("pending").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    nextAttemptAt: timestamp("next_attempt_at").defaultNow().notNull(),
    acceptedAt: timestamp("accepted_at"),
    lastError: text("last_error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("notification_delivery_target_device_uidx").on(
      table.deliveryId,
      table.deviceRegistrationId
    ),
    index("notification_delivery_target_pending_idx").on(table.status, table.nextAttemptAt),
  ]
);

export const announcement = pgTable(
  "notification_announcement",
  {
    id: id().primaryKey(),
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    messageId: text("message_id").references(() => message.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    actionUrl: text("action_url"),
    status: text("status").default("scheduled").notNull(),
    scheduledAt: timestamp("scheduled_at").defaultNow().notNull(),
    sentAt: timestamp("sent_at"),
    cancelledAt: timestamp("cancelled_at"),
    deletedAt: timestamp("deleted_at"),
    deletedById: text("deleted_by_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("notification_announcement_schedule_idx").on(table.status, table.scheduledAt)]
);

export const announcementTarget = pgTable(
  "notification_announcement_target",
  {
    id: id().primaryKey(),
    announcementId: text("announcement_id")
      .notNull()
      .references(() => announcement.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    value: text("value"),
  },
  (table) => [index("notification_announcement_target_idx").on(table.announcementId)]
);

export const notificationRelations = relations(conversation, ({ many }) => ({
  participants: many(conversationParticipant),
  messages: many(message),
}));

export const messageRelations = relations(message, ({ one, many }) => ({
  conversation: one(conversation, {
    fields: [message.conversationId],
    references: [conversation.id],
  }),
  sender: one(user, { fields: [message.senderId], references: [user.id] }),
  recipients: many(messageRecipient),
  deliveries: many(notificationDelivery),
}));

export const notificationDeliveryRelations = relations(notificationDelivery, ({ many }) => ({
  targets: many(notificationDeliveryTarget),
}));

export const notificationDeliveryTargetRelations = relations(
  notificationDeliveryTarget,
  ({ one }) => ({
    delivery: one(notificationDelivery, {
      fields: [notificationDeliveryTarget.deliveryId],
      references: [notificationDelivery.id],
    }),
    device: one(deviceRegistration, {
      fields: [notificationDeliveryTarget.deviceRegistrationId],
      references: [deviceRegistration.id],
    }),
  })
);
