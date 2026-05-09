import { type Job, type JobsOptions, Queue } from "bullmq";

import type { JobDefinition, QueueName } from "./job";
import { BULL_REDIS_PREFIX, DEFAULT_JOB_OPTIONS, REDIS_CONNECTION } from "./redis";

const queues = new Map<QueueName, Queue>();

/** Lazily create and cache a `Queue` instance per queue name. */
export function getQueue(queueName: QueueName): Queue {
  const existing = queues.get(queueName);
  if (existing) return existing;

  const queue = new Queue(queueName, {
    connection: REDIS_CONNECTION,
    prefix: BULL_REDIS_PREFIX,
    defaultJobOptions: DEFAULT_JOB_OPTIONS,
  });

  queue.on("error", (error) => {
    console.error(`[jobs] queue "${queueName}" error:`, error);
  });

  queues.set(queueName, queue);
  return queue;
}

/** Return every cached queue. */
export function getAllQueues(): readonly Queue[] {
  return Array.from(queues.values());
}

/** Enqueue a typed job. */
export async function enqueue<Data, Result>(
  definition: JobDefinition<string, Data, Result>,
  data: Data,
  options?: JobsOptions
): Promise<Job<Data, Result>> {
  const queue = getQueue(definition.queue);
  return (await queue.add(definition.name, data, {
    ...definition.defaultJobOptions,
    ...options,
  })) as Job<Data, Result>;
}

/** Gracefully close every queue. */
export async function closeAllQueues(): Promise<void> {
  const pending = Array.from(queues.values()).map((queue) => queue.close());
  await Promise.all(pending);
  queues.clear();
}
