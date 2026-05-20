import { logger } from "@modular-vsa/shared/common/logger";

import { defineJob } from "../../core/job";
import { enqueue } from "../../core/queue";

/** Daily job that sends scheduled messages to users. */
export const dailyUpdateJob = defineJob({
  name: "notification.send-sms",
  queue: "notification",
  handler: async function sendSMS() {
    logger.info("sendSMS called");
    return { success: true };
  },
});

export function schedulerSendSMS() {
  return enqueue(dailyUpdateJob, {} as Record<string, never>, {
    removeOnComplete: 10,
    removeOnFail: 5,
  });
}
