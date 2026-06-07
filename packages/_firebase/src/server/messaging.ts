import { getMessaging as _getMessaging } from "firebase-admin/messaging";
import type {
  BatchResponse,
  MulticastMessage,
  TokenMessage,
  TopicMessage,
} from "firebase-admin/messaging";

import { getAdminApp } from "./init";

/**
 * Sends a push notification to a single device via FCM.
 *
 * @param message - A {@link TokenMessage} with at minimum `token` and `notification`.
 * @param dryRun - If `true`, validate the request without delivering.
 * @returns The FCM message ID.
 * @see https://firebase.google.com/docs/cloud-messaging/send-message#send_messages_to_specific_devices
 */
export async function sendPushNotification(
  message: TokenMessage,
  dryRun?: boolean
): Promise<string> {
  return _getMessaging(getAdminApp()).send(message, dryRun);
}

/**
 * Sends a push notification to multiple devices in a single FCM request.
 *
 * Maximum 500 tokens per call (FCM limit).
 *
 * @param message - A {@link MulticastMessage} with `tokens` array and notification payload.
 * @param dryRun - If `true`, validate the request without delivering.
 * @see https://firebase.google.com/docs/cloud-messaging/send-message#send_messages_to_multiple_devices
 */
export async function sendMulticastPushNotification(
  message: MulticastMessage,
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
