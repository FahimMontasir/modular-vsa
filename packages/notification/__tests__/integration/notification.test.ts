import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { and, count, eq } from "drizzle-orm";

import { db } from "@modular-vsa/db";
import {
  conversationParticipant,
  messageRecipient,
  notificationDelivery,
} from "@modular-vsa/db/schema/notification";

import {
  createDirectConversation,
  listMessages,
  markConversationRead,
  sendDirectMessage,
  unreadTotal,
} from "../../src/server/services/notification";
import { NotificationFixtures } from "./utils/fixtures";

const fixtures = new NotificationFixtures();
const userIds: string[] = [];

beforeAll(async () => {
  userIds.push(
    (await fixtures.seedUser("service-a")).id,
    (await fixtures.seedUser("service-b")).id,
    (await fixtures.seedUser("service-c")).id
  );
});

afterAll(async () => {
  await fixtures.cleanup();
});

describe("notification persistence", () => {
  test("canonicalizes direct membership and persists recipient/outbox atomically", async () => {
    const first = await createDirectConversation(userIds[0]!, userIds[1]!);
    fixtures.trackConversation(first.id);
    const second = await createDirectConversation(userIds[1]!, userIds[0]!);
    expect(second.id).toBe(first.id);

    const [participantCount] = await db
      .select({ count: count() })
      .from(conversationParticipant)
      .where(eq(conversationParticipant.conversationId, first.id));
    expect(participantCount?.count).toBe(2);

    const created = await sendDirectMessage(first.id, userIds[0]!, "Persist before Firebase");
    const [recipientCount] = await db
      .select({ count: count() })
      .from(messageRecipient)
      .where(eq(messageRecipient.messageId, created.id));
    const [deliveryCount] = await db
      .select({ count: count() })
      .from(notificationDelivery)
      .where(eq(notificationDelivery.messageId, created.id));
    expect(recipientCount?.count).toBe(1);
    expect(deliveryCount?.count).toBe(1);
    expect((await unreadTotal(userIds[1]!)).count).toBe(1);

    await markConversationRead(first.id, userIds[1]!, created.id);
    expect((await unreadTotal(userIds[1]!)).count).toBe(0);
  });

  test("isolates history from non-participants", async () => {
    const direct = await createDirectConversation(userIds[0]!, userIds[1]!);
    let failure: unknown;
    try {
      await listMessages(direct.id, userIds[2]!);
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toBe("Conversation access denied");

    const [membership] = await db
      .select({ count: count() })
      .from(conversationParticipant)
      .where(
        and(
          eq(conversationParticipant.conversationId, direct.id),
          eq(conversationParticipant.userId, userIds[2]!)
        )
      );
    expect(membership?.count).toBe(0);
  });
});
