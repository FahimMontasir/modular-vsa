const INTERNAL_URL = /^\/(?!\/)/;

export function directConversationKey(firstUserId: string, secondUserId: string) {
  return `direct:${[firstUserId, secondUserId].sort().join(":")}`;
}

export function normalizeInternalUrl(value?: string | null) {
  if (!value) return null;
  if (!INTERNAL_URL.test(value)) throw new Error("Action URL must be an internal path");
  return value;
}

export function normalizeAnnouncementTargets(
  targets: Array<{ kind: "all" | "role" | "user"; value?: string }>
) {
  if (!targets.length) throw new Error("At least one announcement target is required");
  if (targets.some(({ kind }) => kind === "all") && targets.length > 1)
    throw new Error("The all-users target cannot be combined with other targets");
  return targets.map((target) => {
    if (target.kind === "all") return { kind: target.kind, value: undefined };
    const value = target.value?.trim();
    if (!value) throw new Error(`${target.kind} targets require a value`);
    return { kind: target.kind, value };
  });
}

export function encodeCursor(createdAt: Date, id: string) {
  return btoa(JSON.stringify([createdAt.toISOString(), id]));
}

export function decodeCursor(cursor?: string) {
  if (!cursor) return undefined;
  try {
    const [date, id] = JSON.parse(atob(cursor)) as [string, string];
    return { createdAt: new Date(date), id };
  } catch {
    return undefined;
  }
}

export function tombstone<T extends { deletedAt: Date | null; body: string }>(value: T) {
  return value.deletedAt ? { ...value, body: "", title: null, actionUrl: null } : value;
}
