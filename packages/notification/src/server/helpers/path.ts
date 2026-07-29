export const ENDPOINTS_PATH = {
  prefix: "/notification",
  conversations: "/conversations",
  unread: "/unread",
  users: "/users",
  direct: "/direct",
  messages: "/conversations/:conversationId/messages",
  read: "/conversations/:conversationId/read",
  messageById: "/messages/:id",
  devices: "/devices",
  announcements: "/announcements",
  announcementCancel: "/announcements/:id/cancel",
  announcementById: "/announcements/:id",
} as const;
