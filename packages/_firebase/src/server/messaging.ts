import { getMessaging as _getMessaging } from "firebase-admin/messaging";
import type {
  BatchResponse,
  FidMessage,
  FidMulticastMessage,
  TopicMessage,
} from "firebase-admin/messaging";

import { getAdminApp } from "./init";

/**
 * Sends a push notification to a single device via FCM.
 *
 * @param message - A {@link FidMessage} with a registered Firebase Installation ID.
 * @param dryRun - If `true`, validate the request without delivering.
 * @returns The FCM message ID.
 * @see https://firebase.google.com/docs/cloud-messaging/send-message#send_messages_to_specific_devices
 */
export async function sendFidPushNotification(
  message: FidMessage,
  dryRun?: boolean
): Promise<string> {
  return _getMessaging(getAdminApp()).send(message, dryRun);
}

/**
 * Sends a push notification to multiple devices in a single FCM request.
 *
 * Maximum 500 Firebase Installation IDs per call (FCM limit).
 *
 * @param message - A {@link FidMulticastMessage} with an `fids` array and data payload.
 * @param dryRun - If `true`, validate the request without delivering.
 * @see https://firebase.google.com/docs/cloud-messaging/send-message#send_messages_to_multiple_devices
 */
export async function sendFidMulticastPushNotification(
  message: FidMulticastMessage,
  dryRun?: boolean
): Promise<BatchResponse> {
  return _getMessaging(getAdminApp()).sendEachForMulticast(message, dryRun);
}

/**
 * Sends a push notification to all devices subscribed to a topic.
 *
 * @param message - A {@link TopicMessage} with `topic` and notification payload.
 * @param dryRun - If `true`, validate the request without delivering.
 * @returns The FCM message ID.
 * @see https://firebase.google.com/docs/cloud-messaging/send-message#send_messages_to_topics
 */
export async function sendToTopic(message: TopicMessage, dryRun?: boolean): Promise<string> {
  return _getMessaging(getAdminApp()).send(message, dryRun);
}
