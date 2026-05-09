import { defineJob } from "../../core/job";
import { enqueue } from "../../core/queue";

export const demoHomeJob = defineJob({
  name: "notification.home-demo",
  queue: "notification",
  handler: async function demoHomeJob(id: string) {
    console.log("demoHomeJob called", id);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("demoHomeJob called after 1 second", id);
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
