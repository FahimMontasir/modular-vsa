import { StatusMap } from "elysia";

import { applicationActions } from "@modular-vsa/auth/access-control";
import { secureAPI } from "@modular-vsa/auth/server/secure-api";

import { ENDPOINTS_PATH } from "../helpers/path";
import {
  listAnnouncements,
  listConversations,
  listMessages,
  listUsers,
  unreadTotal,
} from "../services/notification";
import { NotificationSchema } from "../validators";

export const ReadRoutes = secureAPI()
  .get(
    ENDPOINTS_PATH.conversations,
    async ({ user }) => {
      const isAdmin = user.role?.split(",").includes("admin") ?? false;
      return await listConversations(user.id, isAdmin);
    },
    {
      authorize: { notification: [applicationActions.notification.read] },
      response: { [StatusMap.OK]: NotificationSchema.ConversationsList },
      detail: {
        summary: "Read conversations",
        description: "Get the authenticated user's ordered notification and direct-message threads",
      },
    }
  )
  .get(
    ENDPOINTS_PATH.unread,
    async ({ user }) => {
      const isAdmin = user.role?.split(",").includes("admin") ?? false;
      return await unreadTotal(user.id, isAdmin);
    },
    {
      authorize: { notification: [applicationActions.notification.read] },
      response: { [StatusMap.OK]: NotificationSchema.UnreadTotal },
      detail: {
        summary: "Read unread total",
        description: "Get the authenticated user's combined unread message count",
      },
    }
  )
  .get(
    ENDPOINTS_PATH.users,
    async ({ user, query }) => {
      return await listUsers(user.id, query.q);
    },
    {
      authorize: { notification: [applicationActions.notification.read] },
      query: NotificationSchema.SearchQuery,
      response: { [StatusMap.OK]: NotificationSchema.UsersList },
      detail: {
        summary: "Search users",
        description: "Find active users available for a direct conversation",
      },
    }
  )
  .get(
    ENDPOINTS_PATH.messages,
    async ({ user, params, query }) => {
      return await listMessages(
        params.conversationId,
        user.id,
        query.limit ? Number(query.limit) : undefined,
        query.cursor
      );
    },
    {
      authorize: { notification: [applicationActions.notification.read] },
      params: NotificationSchema.ConversationId,
      query: NotificationSchema.ListQuery,
      response: { [StatusMap.OK]: NotificationSchema.MessagesPage },
      detail: {
        summary: "Read conversation history",
        description: "Get cursor-paginated messages visible to the authenticated participant",
      },
    }
  )
  .get(
    ENDPOINTS_PATH.announcements,
    async ({ query }) => {
      return await listAnnouncements(
        query.section ?? "all",
        query.limit ? Number(query.limit) : undefined,
        query.cursor
      );
    },
    {
      authorize: { notification: [applicationActions.notification.announce] },
      query: NotificationSchema.AnnouncementListQuery,
      response: { [StatusMap.OK]: NotificationSchema.AnnouncementsPage },
      detail: {
        summary: "Read announcements",
        description: "Get announcements available to administrators",
      },
    }
  );
