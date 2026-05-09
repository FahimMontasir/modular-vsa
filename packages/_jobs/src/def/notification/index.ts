import { demoHomeJob } from "./home-demo";
import { dailyUpdateJob } from "./sms";

export const NOTIFICATION_JOBS = [dailyUpdateJob, demoHomeJob] as const;
