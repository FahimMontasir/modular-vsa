export type FirebaseTargetState = {
  status: string;
  nextAttemptAt: Date;
  lastError: string | null;
};

export type FirebaseDeliveryState = {
  status: "accepted" | "failed" | "retry" | "skipped";
  nextAttemptAt: Date;
  lastError: string | null;
};

export function aggregateFirebaseDeliveryState(
  targets: FirebaseTargetState[],
  now = new Date()
): FirebaseDeliveryState {
  if (!targets.length)
    return {
      status: "skipped",
      nextAttemptAt: now,
      lastError: "No active Firebase registration",
    };

  const retryTargets = targets.filter(({ status }) => status === "pending" || status === "retry");
  if (retryTargets.length) {
    const nextAttemptAt = retryTargets.reduce(
      (earliest, target) =>
        target.nextAttemptAt.getTime() < earliest.getTime() ? target.nextAttemptAt : earliest,
      retryTargets[0]!.nextAttemptAt
    );
    return {
      status: "retry",
      nextAttemptAt,
      lastError: retryTargets.find(({ lastError }) => lastError)?.lastError ?? null,
    };
  }

  const failed = targets.find(({ status }) => status === "failed");
  if (failed)
    return {
      status: "failed",
      nextAttemptAt: failed.nextAttemptAt,
      lastError: failed.lastError,
    };

  if (targets.every(({ status }) => status === "accepted"))
    return { status: "accepted", nextAttemptAt: now, lastError: null };

  return { status: "skipped", nextAttemptAt: now, lastError: null };
}
