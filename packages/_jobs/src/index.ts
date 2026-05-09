import { startWorkers } from "./core/worker";
import { JOB_REGISTRY, QUEUE_WORKER_OVERRIDES, registerCronSchedules } from "./registry";

/** Boot the background pipeline: Starts workers and registers cron schedules. */
export async function startAllWorkers() {
  const workers = startWorkers(JOB_REGISTRY, QUEUE_WORKER_OVERRIDES);
  registerCronSchedules();

  console.info(
    `[jobs] Started ${workers.length} workers across ${JOB_REGISTRY.length} job definitions`
  );

  return workers;
}
