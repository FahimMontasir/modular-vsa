import { StatusMap } from "elysia";

import { applicationActions } from "@modular-vsa/auth/access-control";
import { secureAPI } from "@modular-vsa/auth/server/secure-api";

import { ENDPOINTS_PATH } from "../helpers/path";
import { detachDevice, softDeleteAnnouncement, softDeleteMessage } from "../services/notification";
import { NotificationSchema } from "../validators";

export const DeleteRoutes = secureAPI()
  .delete(
    ENDPOINTS_PATH.messageById,
    async ({ user, params }) => {
      return await softDeleteMessage(
        params.id,
        user.id,
        user.role?.split(",").includes("admin") ?? false
      );
    },
    {
      authorize: { notification: [applicationActions.notification.delete] },
      params: NotificationSchema.Id,
      response: { [StatusMap.OK]: NotificationSchema.StoredMessage },
      detail: {
        summary: "Delete a message",
        description: "Soft-delete an owned message while preserving its audit record",
      },
    }
  )
  .delete(
    ENDPOINTS_PATH.devices,
    async ({ user, body }) => {
      return await detachDevice(user.id, body.fid);
    },
    {
      authorize: { notification: [applicationActions.notification.read] },
      body: NotificationSchema.Device,
      response: { [StatusMap.OK]: NotificationSchema.Success },
      detail: {
        summary: "Delete a Firebase device registration",
        description: "Detach the current Firebase Installation ID from the authenticated user",
      },
    }
  )
  .delete(
    ENDPOINTS_PATH.announcementById,
    async ({ user, params }) => {
      return await softDeleteAnnouncement(params.id, user.id);
    },
    {
      authorize: { notification: [applicationActions.notification.announce] },
      params: NotificationSchema.Id,
      response: { [StatusMap.OK]: NotificationSchema.DeletedAnnouncement },
      detail: {
        summary: "Delete an announcement",
        description: "Soft-delete an announcement while preserving its audit record",
      },
    }
  );
