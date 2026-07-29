import { t } from "elysia";

const NullableString = t.Union([t.String(), t.Null()]);
const NullableDate = t.Union([t.Date(), t.Null()]);

const Target = t.Object({
  kind: t.Union([t.Literal("all"), t.Literal("role"), t.Literal("user")]),
  value: t.Optional(t.String()),
});

const Conversation = t.Object({
  id: t.String(),
  kind: t.String(),
  key: t.String(),
  title: t.String(),
  source: NullableString,
  createdById: NullableString,
  lastMessageAt: t.Date(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

const StoredMessage = t.Object({
  id: t.String(),
  conversationId: t.String(),
  senderId: NullableString,
  kind: t.String(),
  title: NullableString,
  body: t.String(),
  actionUrl: NullableString,
  deletedAt: NullableDate,
  deletedById: NullableString,
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

const Announcement = t.Object({
  id: t.String(),
  createdById: t.String(),
  messageId: NullableString,
  title: t.String(),
  body: t.String(),
  actionUrl: NullableString,
  status: t.String(),
  scheduledAt: t.Date(),
  sentAt: NullableDate,
  cancelledAt: NullableDate,
  deletedAt: NullableDate,
  deletedById: NullableString,
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

export const NotificationSchema = {
  Conversation,
  ConversationsList: t.Array(
    t.Object({
      id: t.String(),
      kind: t.String(),
      key: t.String(),
      title: t.String(),
      source: NullableString,
      lastMessageAt: t.Date(),
      image: NullableString,
      unreadCount: t.Number(),
      lastMessage: NullableString,
    })
  ),
  UnreadTotal: t.Object({ count: t.Number() }),
  UsersList: t.Array(
    t.Object({
      id: t.String(),
      name: t.String(),
      username: NullableString,
      image: NullableString,
    })
  ),
  MessagesPage: t.Object({
    items: t.Array(
      t.Object({
        id: t.String(),
        conversationId: t.String(),
        senderId: NullableString,
        senderName: NullableString,
        senderImage: NullableString,
        kind: t.String(),
        title: NullableString,
        body: t.String(),
        actionUrl: NullableString,
        deletedAt: NullableDate,
        createdAt: t.Date(),
        updatedAt: t.Date(),
      })
    ),
    nextCursor: NullableString,
  }),
  StoredMessage,
  DeviceRegistration: t.Object({
    id: t.String(),
    userId: t.String(),
    fid: t.String(),
    platform: t.String(),
    userAgent: NullableString,
    lastSeenAt: t.Date(),
    disabledAt: NullableDate,
    createdAt: t.Date(),
  }),
  Announcement,
  AnnouncementsPage: t.Object({
    items: t.Array(Announcement),
    nextCursor: NullableString,
  }),
  DeletedAnnouncement: t.Object({ id: t.String(), deletedAt: NullableDate }),
  Success: t.Object({ success: t.Boolean() }),
  Id: t.Object({ id: t.String({ minLength: 1 }) }),
  ConversationId: t.Object({ conversationId: t.String({ minLength: 1 }) }),
  ListQuery: t.Object({
    cursor: t.Optional(t.String()),
    limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
  }),
  AnnouncementListQuery: t.Object({
    cursor: t.Optional(t.String()),
    limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
    section: t.Optional(
      t.Union([t.Literal("all"), t.Literal("scheduled"), t.Literal("delivered")])
    ),
  }),
  SearchQuery: t.Object({ q: t.Optional(t.String({ maxLength: 100 })) }),
  CreateDirect: t.Object({ userId: t.String({ minLength: 1 }) }),
  SendMessage: t.Object({ body: t.String({ minLength: 1, maxLength: 5000 }) }),
  MarkRead: t.Object({ throughMessageId: t.String({ minLength: 1 }) }),
  Device: t.Object({
    fid: t.String({ minLength: 1 }),
    platform: t.Optional(t.String()),
    userAgent: t.Optional(t.String()),
  }),
  CreateAnnouncement: t.Object({
    title: t.String({ minLength: 1, maxLength: 200 }),
    body: t.String({ minLength: 1, maxLength: 5000 }),
    actionUrl: t.Optional(t.String({ maxLength: 1000 })),
    status: t.Optional(t.Union([t.Literal("draft"), t.Literal("scheduled")])),
    scheduledAt: t.Optional(t.Date()),
    targets: t.Array(Target, { minItems: 1 }),
  }),
};
