import { inArray } from "drizzle-orm";

import { db } from "@modular-vsa/db";
import { user } from "@modular-vsa/db/schema/auth";
import {
  announcement,
  conversation,
  deviceRegistration,
} from "@modular-vsa/db/schema/notification";
import { closeAllQueues } from "@modular-vsa/jobs";

export class NotificationFixtures {
  readonly announcementIds = new Set<string>();
  readonly conversationIds = new Set<string>();
  readonly deviceFids = new Set<string>();
  readonly userIds = new Set<string>();

  async seedUser(label: string) {
    const suffix = crypto.randomUUID();
    const id = `notification-${label}-${suffix}`;
    const [created] = await db
      .insert(user)
      .values({
        id,
        name: `Notification ${label} ${suffix.slice(0, 8)}`,
        email: `${id}@example.test`,
        username: `n${suffix.replaceAll("-", "").slice(0, 20)}`,
      })
      .returning();
    if (!created) throw new Error("Failed to seed notification test user");
    this.userIds.add(created.id);
    return created;
  }

  trackConversation(id: string) {
    this.conversationIds.add(id);
    return id;
  }

  trackAnnouncement(id: string) {
    this.announcementIds.add(id);
    return id;
  }

  trackDevice(fid: string) {
    this.deviceFids.add(fid);
    return fid;
  }

  async cleanup() {
    if (this.announcementIds.size)
      await db.delete(announcement).where(inArray(announcement.id, [...this.announcementIds]));
    if (this.conversationIds.size)
      await db.delete(conversation).where(inArray(conversation.id, [...this.conversationIds]));
    if (this.deviceFids.size)
      await db
        .delete(deviceRegistration)
        .where(inArray(deviceRegistration.fid, [...this.deviceFids]));
    if (this.userIds.size) await db.delete(user).where(inArray(user.id, [...this.userIds]));
    await closeAllQueues();
  }
}
