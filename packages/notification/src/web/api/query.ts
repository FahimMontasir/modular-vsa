import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { trackEvent } from "@modular-vsa/firebase/web/telemetry";
import { createApiClient } from "@modular-vsa/shared/web/api-client";
import { toast } from "@modular-vsa/ui/toast";

import type { APINotificationType } from "../../server/controllers/routes";
import type { listMessages } from "../../server/services/notification";

type MessagePage = Awaited<ReturnType<typeof listMessages>>;

export const notificationKeys = {
  root: ["notification"] as const,
  unread: ["notification", "unread"] as const,
  conversations: ["notification", "conversations"] as const,
  messages: (conversationId: string) => ["notification", "messages", conversationId] as const,
  users: (query: string) => ["notification", "users", query] as const,
  announcements: ["notification", "announcements"] as const,
};

export const notificationApi = createApiClient<APINotificationType>();

async function requireData<T>(result: { data: T | null; error: unknown }, message: string) {
  if (result.error || result.data === null) throw result.error ?? new Error(message);
  return result.data;
}

export function useUnreadQuery() {
  return useQuery({
    queryKey: notificationKeys.unread,
    queryFn: async () =>
      requireData(await notificationApi.notification.unread.get(), "Unread count unavailable"),
  });
}

export function useConversationsQuery(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.conversations,
    queryFn: async () =>
      requireData(
        await notificationApi.notification.conversations.get(),
        "Conversations unavailable"
      ),
    enabled,
  });
}

export function useMessagesQuery(conversationId?: string) {
  return useQuery({
    ...queryOptions({
      queryKey: notificationKeys.messages(conversationId ?? "none"),
      queryFn: async () => {
        const page = (await requireData(
          await notificationApi.notification
            .conversations({ conversationId: conversationId! })
            .messages.get({ query: { limit: 50 } }),
          "Messages unavailable"
        )) as MessagePage;
        return page.items;
      },
    }),
    enabled: Boolean(conversationId),
  });
}

export function useUsersQuery(query: string, enabled = true) {
  return useQuery({
    queryKey: notificationKeys.users(query),
    queryFn: async () =>
      requireData(
        await notificationApi.notification.users.get({ query: { q: query || undefined } }),
        "Users unavailable"
      ),
    enabled,
  });
}

export function useCreateDirectMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) =>
      requireData(
        await notificationApi.notification.direct.post({ userId }),
        "Conversation could not be created"
      ),
    onSuccess: async (row) => {
      await trackEvent("messenger_action", { action: "start_direct", outcome: "success" });
      await Promise.all([
        client.invalidateQueries({ queryKey: notificationKeys.unread }),
        client.invalidateQueries({ queryKey: notificationKeys.conversations }),
        client.invalidateQueries({ queryKey: notificationKeys.messages(row.id) }),
      ]);
    },
    onError: () => {
      void trackEvent("messenger_action", { action: "start_direct", outcome: "failed" });
      toast.error("Conversation could not be created");
    },
  });
}

export function useSendMessageMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId, body }: { conversationId: string; body: string }) =>
      requireData(
        await notificationApi.notification
          .conversations({ conversationId })
          .messages.post({ body }),
        "Message could not be sent"
      ),
    onSuccess: async (_, values) => {
      await trackEvent("messenger_action", { action: "send", outcome: "success" });
      await Promise.all([
        client.invalidateQueries({ queryKey: notificationKeys.unread }),
        client.invalidateQueries({ queryKey: notificationKeys.conversations }),
        client.invalidateQueries({ queryKey: notificationKeys.messages(values.conversationId) }),
      ]);
    },
    onError: () => {
      void trackEvent("messenger_action", { action: "send", outcome: "failed" });
      toast.error("Message could not be sent");
    },
  });
}

export function useMarkReadMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({
      conversationId,
      throughMessageId,
    }: {
      conversationId: string;
      throughMessageId: string;
    }) =>
      requireData(
        await notificationApi.notification
          .conversations({ conversationId })
          .read.post({ throughMessageId }),
        "Messages could not be marked read"
      ),
    onSuccess: async (_, values) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: notificationKeys.unread }),
        client.invalidateQueries({ queryKey: notificationKeys.conversations }),
        client.invalidateQueries({ queryKey: notificationKeys.messages(values.conversationId) }),
      ]);
    },
  });
}

export function useDeleteMessageMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; conversationId: string }) =>
      requireData(
        await notificationApi.notification.messages({ id }).delete(),
        "Message could not be deleted"
      ),
    onSuccess: async (_, values) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: notificationKeys.unread }),
        client.invalidateQueries({ queryKey: notificationKeys.conversations }),
        client.invalidateQueries({ queryKey: notificationKeys.messages(values.conversationId) }),
      ]);
    },
    onError: () => toast.error("Message could not be deleted"),
  });
}

export function useCreateAnnouncementMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      title: string;
      body: string;
      actionUrl?: string;
      scheduledAt?: Date;
      targets: Array<{ kind: "all" | "role" | "user"; value?: string }>;
    }) =>
      requireData(
        await notificationApi.notification.announcements.post(values),
        "Announcement could not be scheduled"
      ),
    onSuccess: async () => {
      await trackEvent("announcement_action", { action: "schedule", outcome: "success" });
      await Promise.all([
        client.invalidateQueries({ queryKey: notificationKeys.unread }),
        client.invalidateQueries({ queryKey: notificationKeys.conversations }),
        client.invalidateQueries({ queryKey: notificationKeys.announcements }),
      ]);
      toast.success("Announcement scheduled");
    },
    onError: () => {
      void trackEvent("announcement_action", { action: "schedule", outcome: "failed" });
      toast.error("Announcement could not be scheduled");
    },
  });
}
