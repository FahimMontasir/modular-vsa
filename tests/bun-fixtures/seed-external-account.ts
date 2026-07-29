import { db } from "../../packages/_db/src/index";
import { account } from "../../packages/_db/src/schema/auth";

const [userId, providerId, accountId] = Bun.argv.slice(2);

if (!userId || !providerId || !accountId) {
  throw new Error("Usage: seed-external-account.ts <user-id> <provider-id> <account-id>");
}

await db.insert(account).values({
  id: crypto.randomUUID(),
  userId,
  providerId,
  accountId,
});
