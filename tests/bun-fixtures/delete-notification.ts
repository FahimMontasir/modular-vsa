import { eq } from "drizzle-orm";

import { db } from "../../packages/_db/src/index";
import {
  announcement,
  conversation,
} from "../../packages/_db/src/schema/notification";

const [kind, ...values] = Bun.argv.slice(2);

if (kind === "conversation-id") {
  const [id] = values;
  if (!id) throw new Error("Usage: delete-notification.ts conversation-id <id>");
  await db.delete(conversation).where(eq(conversation.id, id));
} else if (kind === "direct-pair") {
  const [firstUserId, secondUserId] = values;
  if (!firstUserId || !secondUserId)
    throw new Error("Usage: delete-notification.ts direct-pair <first-user-id> <second-user-id>");
  const key = `direct:${[firstUserId, secondUserId].sort().join(":")}`;
  await db.delete(conversation).where(eq(conversation.key, key));
} else if (kind === "announcement-title") {
  const [title] = values;
  if (!title) throw new Error("Usage: delete-notification.ts announcement-title <title>");
  await db.delete(announcement).where(eq(announcement.title, title));
} else {
  throw new Error(`Unknown notification cleanup kind: ${kind ?? "missing"}`);
}
