import { type Job, Worker, type WorkerOptions } from "bullmq";

import type { AnyJobDefinition, QueueName } from "./job";
import { BULL_REDIS_PREFIX, DEFAULT_WORKER_OPTIONS, REDIS_CONNECTION } from "./redis";

const workers = new Map<QueueName, Worker>();

/** Optional per-queue worker overrides. */
export type WorkerOverrides = Partial<Record<QueueName, Partial<WorkerOptions>>>;

/** Start one worker per queue to dispatch incoming jobs. */
export function startWorkers(
  definitions: readonly AnyJobDefinition[],
  overrides: WorkerOverrides = {}
): readonly Worker[] {
  const byQueue = new Map<QueueName, Map<string, AnyJobDefinition>>();
  for (const definition of definitions) {
    let bucket = byQueue.get(definition.queue);
    if (!bucket) {
      bucket = new Map();
      byQueue.set(definition.queue, bucket);
    }
    if (bucket.has(definition.name)) {
      throw new Error(`[jobs] duplicate job "${definition.name}" on queue "${definition.queue}"`);
    }
    bucket.set(definition.name, definition);
  }

  const started: Worker[] = [];
  for (const [queueName, handlerMap] of byQueue) {
    if (workers.has(queueName)) {
      started.push(workers.get(queueName) as Worker);
      continue;
    }

    const worker = new Worker(
      queueName,
      async (job: Job) => {
        const definition = handlerMap.get(job.name);
        if (!definition) {
          throw new Error(`[jobs] no handler registered for "${job.name}" on queue "${queueName}"`);
        }
        return definition.handler(job.data, { job });
      },
      {
        connection: REDIS_CONNECTION,
        prefix: BULL_REDIS_PREFIX,
        ...DEFAULT_WORKER_OPTIONS,
        ...overrides[queueName],
      }
    );

    worker.on("failed", (job, error) => {
      console.error(`[jobs] ${queueName}/${job?.name ?? "?"}#${job?.id ?? "?"} failed:`, error);
    });
    worker.on("error", (error) => {
      console.error(`[jobs] worker "${queueName}" error:`, error);
    });

    workers.set(queueName, worker);
    started.push(worker);
  }

  return started;
}

/** Gracefully close every worker. */
export async function closeAllWorkers(): Promise<void> {
  const pending = Array.from(workers.values()).map((worker) => worker.close());
  await Promise.all(pending);
  workers.clear();
}
