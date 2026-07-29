import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";

const execFileAsync = promisify(execFile);
const workspaceRoot = resolve(import.meta.dirname, "../../..");

async function runFixture(script: string, ...args: string[]) {
  return await execFileAsync(
    "bun",
    ["--env-file=apps/server/.env.local", "run", `tests/bun-fixtures/${script}`, ...args],
    { cwd: workspaceRoot }
  );
}

export async function createAuthSession(username: string, password: string) {
  const { stdout } = await runFixture("create-auth-session.ts", username, password);
  const output = stdout.trim().split("\n").at(-1);
  if (!output) throw new Error("Auth session fixture returned no output");
  return (JSON.parse(output) as { cookie: string }).cookie;
}

export async function seedExternalAccount(userId: string, providerId: string, accountId: string) {
  await runFixture("seed-external-account.ts", userId, providerId, accountId);
}

export async function deleteUploadedFile(key: string) {
  await runFixture("delete-upload.ts", key);
}

export async function deleteNotificationConversation(id: string) {
  await runFixture("delete-notification.ts", "conversation-id", id);
}

export async function deleteDirectNotificationConversation(firstUserId: string, secondUserId: string) {
  await runFixture("delete-notification.ts", "direct-pair", firstUserId, secondUserId);
}

export async function deleteNotificationAnnouncement(title: string) {
  await runFixture("delete-notification.ts", "announcement-title", title);
}
