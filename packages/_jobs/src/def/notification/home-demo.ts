import { logger } from "@modular-vsa/shared/common/logger";

import { defineJob } from "../../core/job";
import { enqueue } from "../../core/queue";

export const demoHomeJob = defineJob({
  name: "notification.home-demo",
  queue: "notification",
  handler: async function demoHomeJob(id: string) {
    logger.info("demoHomeJob called", { id });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    logger.info("demoHomeJob called after 1 second", { id });
    return { success: true };
  },
});

export function enqueueDemoHomeJob(id: string) {
  return enqueue(demoHomeJob, id, {
    delay: 1000,
    removeOnComplete: 10,
    removeOnFail: 5,
  });
}
