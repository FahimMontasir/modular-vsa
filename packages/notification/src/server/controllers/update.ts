import { StatusMap } from "elysia";

import { applicationActions } from "@modular-vsa/auth/access-control";
import { secureAPI } from "@modular-vsa/auth/server/secure-api";

import { ENDPOINTS_PATH } from "../helpers/path";
import { cancelAnnouncement, markConversationRead, registerDevice } from "../services/notification";
import { NotificationSchema } from "../validators";

export const UpdateRoutes = secureAPI()
  .post(
    ENDPOINTS_PATH.read,
    async ({ user, params, body }) => {
      return await markConversationRead(params.conversationId, user.id, body.throughMessageId);
    },
    {
      authorize: { notification: [applicationActions.notification.read] },
      params: NotificationSchema.ConversationId,
      body: NotificationSchema.MarkRead,
      response: { [StatusMap.OK]: NotificationSchema.Success },
      detail: {
        summary: "Update conversation read state",
        description: "Mark messages read through a stable message identifier",
      },
    }
  )
  .put(
    ENDPOINTS_PATH.devices,
    async ({ user, body }) => {
      return await registerDevice(user.id, body);
    },
    {
      authorize: { notification: [applicationActions.notification.read] },
      body: NotificationSchema.Device,
      response: { [StatusMap.OK]: NotificationSchema.DeviceRegistration },
      detail: {
        summary: "Update a Firebase device registration",
        description: "Register or refresh the authenticated user's Firebase Installation ID",
      },
    }
  )
  .post(
    ENDPOINTS_PATH.announcementCancel,
    async ({ user, params }) => {
      return await cancelAnnouncement(params.id, user.id);
    },
    {
      authorize: { notification: [applicationActions.notification.announce] },
      params: NotificationSchema.Id,
      response: { [StatusMap.OK]: NotificationSchema.Announcement },
      detail: {
        summary: "Cancel an announcement",
        description: "Cancel an owned announcement that has not started dispatching",
      },
    }
  );
