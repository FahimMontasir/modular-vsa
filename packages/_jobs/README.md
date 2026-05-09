# Background Jobs (`@modular-vsa/jobs`)

This package provides a robust, typed background job system powered by [BullMQ](https://docs.bullmq.io/) and Redis, with built-in cron scheduling via Bun.

## Usage Guide

### 1. Defining a Job

Jobs are defined declaratively in the `src/def` directory. Use the `defineJob` utility to ensure strong typing for both the payload (`data`) and the `handler`.

```typescript
import { defineJob } from "../../core/job";

export const sendWelcomeEmailJob = defineJob({
  // The job name (prefix with queue name for clarity)
  name: "notification.send-welcome",
  // The queue this job belongs to
  queue: "notification",
  // The handler function that processes the job
  handler: async function sendWelcomeEmail(data: { userId: string }, ctx) {
    console.log(`Sending email to ${data.userId}...`);
    // ...implementation...
    return { success: true };
  },
});
```

### 2. Registering a Job

For a worker to process the job, you must register it in `src/registry.ts`. Add your job definition to the `JOB_REGISTRY` array.

```typescript
// src/registry.ts
import { sendWelcomeEmailJob } from "./def/email/welcome";
import type { AnyJobDefinition } from "./core/job";

export const JOB_REGISTRY: readonly AnyJobDefinition[] = [
  // ...other jobs
  sendWelcomeEmailJob,
] as const;
```

### 3. Enqueueing Jobs in Services

To trigger a job from an API endpoint, service, or webhook, use the `enqueue` function. Because you pass the job definition, the payload parameter is fully type-checked.

```typescript
import { enqueue } from "@modular-vsa/jobs/core/queue";
import { sendWelcomeEmailJob } from "@modular-vsa/jobs/def/email/welcome";

// Inside a controller or service:
await enqueue(sendWelcomeEmailJob, { userId: "user_123" });
```

You can also pass BullMQ `JobsOptions` as the third argument to configure delays, retries, etc:

```typescript
await enqueue(sendWelcomeEmailJob, { userId: "user_123" }, { delay: 5000 });
```

### 4. Scheduling Jobs (Bun Cron)

If a job needs to run on a recurring schedule, you can use `Bun.cron` to enqueue it automatically.

First, create a wrapper function that enqueues the job:

```typescript
// src/def/notification/sms.ts
import { enqueue } from "../../core/queue";
import { dailyUpdateJob } from "./sms";

export function schedulerSendSMS() {
  // Enqueue the job with specific options for scheduled runs
  return enqueue(
    dailyUpdateJob,
    {},
    {
      removeOnComplete: 10,
      removeOnFail: 5,
    }
  );
}
```

Next, register the schedule in `src/registry.ts` by adding it to the `SCHEDULES` array:

```typescript
// src/registry.ts
import { schedulerSendSMS } from "./def/notification/sms";
import type { ScheduleEntry } from "./registry";

export const SCHEDULES: readonly ScheduleEntry[] = [
  {
    cron: "@daily", // standard cron expression or shortcuts like @daily, @hourly
    description: "Daily send sms",
    run: schedulerSendSMS,
  },
] as const;
```

The system will automatically register these schedules with `Bun.cron` during startup.
