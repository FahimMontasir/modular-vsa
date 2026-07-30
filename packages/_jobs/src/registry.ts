import { logger } from "@modular-vsa/shared/common/logger";

import type { AnyJobDefinition } from "./core/job";
import type { QueueName } from "./core/job";
import type { WorkerOverrides } from "./core/worker";
import { NOTIFICATION_JOBS } from "./def/notification";
import {
  reconcileAnnouncements,
  reconcileNotificationDeliveries,
} from "./def/notification/firebase";
import { schedulerSendSMS } from "./def/notification/sms";

/** Registry of all job definitions. */
export const JOB_REGISTRY: readonly AnyJobDefinition[] = [...NOTIFICATION_JOBS] as const;

/** Per-queue worker overrides. */
export const QUEUE_WORKER_OVERRIDES: WorkerOverrides = {
  notification: { concurrency: 20 },
} satisfies Partial<Record<QueueName, object>>;

/** Recurring schedules using Bun.cron. */
export type ScheduleEntry = {
  readonly cron: Bun.CronWithAutocomplete;
  readonly description: string;
  readonly run: () => Promise<unknown>;
};

export const SCHEDULES: readonly ScheduleEntry[] = [
  {
    cron: "@daily",
    description: "Daily send sms",
    run: schedulerSendSMS,
  },
  {
    cron: "@hourly",
    description: "Reconcile Firebase notification outbox",
    run: async () => Promise.all([reconcileNotificationDeliveries(), reconcileAnnouncements()]),
  },
] as const;

/** Wire every `SCHEDULES` entry into `Bun.cron`. */
export function registerCronSchedules() {
  for (const entry of SCHEDULES) {
    Bun.cron(entry.cron, () => {
      entry.run().catch((error) => {
        logger.error(`Jobs cron "${entry.description}" failed:`, error);
      });
    });
  }
  logger.info(`Jobs Registered ${SCHEDULES.length} cron schedules via Bun.cron`);
}
