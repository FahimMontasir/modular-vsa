import type { Job, JobsOptions } from "bullmq";

import type { QUEUE_NAMES } from "../const";

/** Logical queue a job belongs to. */
export type QueueName = (typeof QUEUE_NAMES)[number];

/** Extra context passed to handler alongside payload. */
export interface JobContext<Data> {
  readonly job: Job<Data>;
}

/** Declarative job definition. */
export interface JobDefinition<Name extends string = string, Data = unknown, Result = unknown> {
  readonly name: Name;
  readonly queue: QueueName;
  readonly handler: (data: Data, ctx: JobContext<Data>) => Promise<Result>;
  readonly defaultJobOptions?: JobsOptions;
}

/** Erased job definition type for registry/worker plumbing. */
export type AnyJobDefinition = JobDefinition<string, any, any>;

/** Helper that preserves generic signature while returning job definition. */
export function defineJob<Name extends string, Data, Result>(
  def: JobDefinition<Name, Data, Result>
): JobDefinition<Name, Data, Result> {
  return def;
}

/** Payload type of a job definition. */
export type JobDefinitionData<D> =
  D extends JobDefinition<string, infer Data, unknown> ? Data : never;

/** Result type of a job definition. */
export type JobDefinitionResult<D> =
  D extends JobDefinition<string, unknown, infer Result> ? Result : never;
