import { StatusMap } from "elysia";

import { applicationActions } from "@modular-vsa/auth/access-control";
import { secureAPI } from "@modular-vsa/auth/server/secure-api";

import { ENDPOINTS_PATH } from "../helpers/path";
import {
  createAnnouncement,
  createDirectConversation,
  sendDirectMessage,
} from "../services/notification";
import { NotificationSchema } from "../validators";

export const CreateRoutes = secureAPI()
  .post(
    ENDPOINTS_PATH.direct,
    async ({ user, body }) => {
      return await createDirectConversation(user.id, body.userId);
    },
    {
      authorize: { notification: [applicationActions.notification.send] },
      body: NotificationSchema.CreateDirect,
      response: { [StatusMap.OK]: NotificationSchema.Conversation },
      detail: {
        summary: "Create a direct conversation",
        description: "Create or return the canonical one-to-one conversation for two users",
      },
    }
  )
  .post(
    ENDPOINTS_PATH.messages,
    async ({ user, params, body }) => {
      return await sendDirectMessage(params.conversationId, user.id, body.body);
    },
    {
      authorize: { notification: [applicationActions.notification.send] },
      params: NotificationSchema.ConversationId,
      body: NotificationSchema.SendMessage,
      response: { [StatusMap.OK]: NotificationSchema.StoredMessage },
      detail: {
        summary: "Create a direct message",
        description: "Persist a direct message, recipient state, and Firebase outbox atomically",
      },
    }
  )
  .post(
    ENDPOINTS_PATH.announcements,
    async ({ user, body }) => {
      return await createAnnouncement(user.id, body);
    },
    {
      authorize: { notification: [applicationActions.notification.announce] },
      body: NotificationSchema.CreateAnnouncement,
      response: { [StatusMap.OK]: NotificationSchema.Announcement },
      detail: {
        summary: "Create an announcement",
        description: "Create a draft or scheduled announcement with normalized targeting rules",
      },
    }
  );
