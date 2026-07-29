import type { NotificationSchema } from "./validators";

export type CreateAnnouncementBody = typeof NotificationSchema.CreateAnnouncement.static;
export type AnnouncementTargetInput = CreateAnnouncementBody["targets"][number];

export type PlatformNotificationInput = {
  source: "account" | "security" | "content" | "system" | (string & {});
  title: string;
  body: string;
  recipientIds: string[];
  actionUrl?: string;
};
