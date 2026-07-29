import { announcementDispatchJob, firebaseDeliveryJob } from "./firebase";
import { demoHomeJob } from "./home-demo";
import { dailyUpdateJob } from "./sms";

export const NOTIFICATION_JOBS = [
  dailyUpdateJob,
  demoHomeJob,
  firebaseDeliveryJob,
  announcementDispatchJob,
] as const;
