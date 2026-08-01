import { useLingui } from "@lingui/react/macro";
import { useDebouncedValue } from "@tanstack/react-pacer";
import {
  ArrowLeftIcon,
  BellRingIcon,
  CalendarClockIcon,
  MegaphoneIcon,
  MessageCircleIcon,
  PlusIcon,
  SearchIcon,
  SendIcon,
  Trash2Icon,
} from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { Alert, AlertTitle } from "@modular-vsa/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@modular-vsa/ui/avatar";
import { Badge } from "@modular-vsa/ui/badge";
import { Bubble, BubbleContent } from "@modular-vsa/ui/bubble";
import { Button } from "@modular-vsa/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@modular-vsa/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@modular-vsa/ui/empty";
import { Field, FieldGroup } from "@modular-vsa/ui/field";
import { useAppForm } from "@modular-vsa/ui/form";
import { Input } from "@modular-vsa/ui/input";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from "@modular-vsa/ui/item";
import { Marker, MarkerContent } from "@modular-vsa/ui/marker";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from "@modular-vsa/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@modular-vsa/ui/message-scroller";
import { NativeSelectOption } from "@modular-vsa/ui/native-select";
import { Skeleton } from "@modular-vsa/ui/skeleton";
import { Spinner } from "@modular-vsa/ui/spinner";

import {
  useAnnouncementsQuery,
  useConversationsQuery,
  useCreateAnnouncementMutation,
  useCreateDirectMutation,
  useDeleteMessageMutation,
  useMarkReadMutation,
  useMessagesQuery,
  useSendMessageMutation,
  useUsersQuery,
} from "../api/query";
import { flattenMessagePages } from "../helpers/message-order";
import { formatFullNotificationDate, formatNotificationDate } from "../helpers/notification-date";
import { VirtualItems } from "./virtual-items";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function MessengerModal({
  open,
  onOpenChange,
  currentUserId,
  isAdmin,
  initialConversationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  isAdmin: boolean;
  initialConversationId?: string;
}) {
  const { t } = useLingui();
  const conversationsQuery = useConversationsQuery(open);
  const scheduledAnnouncementsQuery = useAnnouncementsQuery("scheduled", open && isAdmin);
  const deliveredAnnouncementsQuery = useAnnouncementsQuery("delivered", open && isAdmin);
  const [selectedConversationId, setSelectedConversationId] = useState<string>();
  const [showAnnouncementComposer, setShowAnnouncementComposer] = useState(false);
  const [showConversationList, setShowConversationList] = useState(!initialConversationId);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, { wait: 250 });
  const [showUsers, setShowUsers] = useState(false);
  const usersQuery = useUsersQuery(debouncedSearch, open && showUsers);
  const selectedId =
    selectedConversationId ?? initialConversationId ?? conversationsQuery.data?.[0]?.id;
  const createDirect = useCreateDirectMutation();
  const createAnnouncement = useCreateAnnouncementMutation();
  const selected = conversationsQuery.data?.find(({ id }) => id === selectedId);

  const selectedUserTargets = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
  const scheduledAnnouncements = useMemo(
    () => scheduledAnnouncementsQuery.data?.pages.flatMap(({ items }) => items) ?? [],
    [scheduledAnnouncementsQuery.data?.pages]
  );
  const deliveredAnnouncements = useMemo(
    () => deliveredAnnouncementsQuery.data?.pages.flatMap(({ items }) => items) ?? [],
    [deliveredAnnouncementsQuery.data?.pages]
  );

  async function startDirect(userId: string) {
    const row = await createDirect.mutateAsync(userId);
    setSelectedConversationId(row.id);
    setShowConversationList(false);
    setShowUsers(false);
  }

  async function submitAnnouncement(values: AnnouncementValues) {
    const targetKind = values.targetKind as "all" | "role" | "user";
    const targetValue = values.targetValue.trim();
    await createAnnouncement.mutateAsync({
      title: values.title.trim(),
      body: values.body.trim(),
      actionUrl: values.actionUrl.trim() || undefined,
      scheduledAt: values.scheduledAt ? new Date(values.scheduledAt) : undefined,
      targets: [{ kind: targetKind, value: targetKind === "all" ? undefined : targetValue }],
    });
    setShowAnnouncementComposer(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="top-0! left-0! h-[calc(100dvh-5rem)]! w-screen! max-w-none! translate-x-0! translate-y-0! overflow-hidden rounded-none p-0 md:top-1/2! md:left-1/2! md:h-[min(46rem,calc(100dvh-4rem))]! md:w-full! md:max-w-5xl! md:-translate-x-1/2! md:-translate-y-1/2! md:rounded-xl"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{t`Messenger`}</DialogTitle>
          <DialogDescription>{t`Direct messages, platform notifications, and announcements.`}</DialogDescription>
        </DialogHeader>
        <div className="grid min-h-0 grid-cols-1 md:grid-cols-[20rem_1fr]">
          <ConversationSidebar
            conversations={conversationsQuery.data}
            conversationsLoading={conversationsQuery.isLoading}
            onSearchChange={setSearch}
            onSelect={(conversationId) => {
              setSelectedConversationId(conversationId);
              setShowConversationList(false);
            }}
            onStartDirect={startDirect}
            onToggleUsers={() => setShowUsers((value) => !value)}
            search={search}
            selectedId={selectedId}
            showConversationList={showConversationList}
            showUsers={showUsers}
            users={selectedUserTargets}
            isAdmin={isAdmin}
          />
          <section
            className={`${selectedId && !showConversationList ? "flex" : "hidden"} min-h-0 flex-col md:flex`}
          >
            {selected ? (
              <>
                <div className="flex h-14 items-center gap-3 border-b ps-4 pe-14">
                  <Button
                    className="md:hidden"
                    size="icon-sm"
                    variant="ghost"
                    aria-label={t`Back to conversations`}
                    onClick={() => setShowConversationList(true)}
                  >
                    <ArrowLeftIcon />
                  </Button>
                  <MessageCircleIcon />
                  <div>
                    <p className="font-medium">{selected.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {selected.kind === "direct" ? t`Direct conversation` : t`Platform updates`}
                    </p>
                  </div>
                  {selected.kind === "announcement" && isAdmin ? (
                    <Button
                      className="ms-auto"
                      size="icon-sm"
                      variant="outline"
                      aria-label={t`Create notification`}
                      aria-expanded={showAnnouncementComposer}
                      onClick={() => setShowAnnouncementComposer((value) => !value)}
                    >
                      <PlusIcon />
                    </Button>
                  ) : null}
                </div>
                {selected.kind === "announcement" && isAdmin ? (
                  <AdminAnnouncementView
                    hasMoreNotifications={deliveredAnnouncementsQuery.hasNextPage}
                    hasMoreScheduled={scheduledAnnouncementsQuery.hasNextPage}
                    loadingNotifications={deliveredAnnouncementsQuery.isFetchingNextPage}
                    loadingScheduled={scheduledAnnouncementsQuery.isFetchingNextPage}
                    notificationsError={deliveredAnnouncementsQuery.isError}
                    notificationsLoading={deliveredAnnouncementsQuery.isLoading}
                    notifications={deliveredAnnouncements}
                    onLoadMoreNotifications={deliveredAnnouncementsQuery.fetchNextPage}
                    onLoadMoreScheduled={scheduledAnnouncementsQuery.fetchNextPage}
                    onSubmit={submitAnnouncement}
                    pending={createAnnouncement.isPending}
                    scheduled={scheduledAnnouncements}
                    scheduledError={scheduledAnnouncementsQuery.isError}
                    scheduledLoading={scheduledAnnouncementsQuery.isLoading}
                    showComposer={showAnnouncementComposer}
                    users={selectedUserTargets}
                  />
                ) : (
                  <ConversationMessageView
                    conversation={selected}
                    currentUserId={currentUserId}
                    open={open}
                  />
                )}
              </>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>{t`Select a conversation`}</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type Conversation = NonNullable<ReturnType<typeof useConversationsQuery>["data"]>[number];
type UserTarget = NonNullable<ReturnType<typeof useUsersQuery>["data"]>[number];
type AnnouncementItem = NonNullable<
  ReturnType<typeof useAnnouncementsQuery>["data"]
>["pages"][number]["items"][number];
type AnnouncementValues = {
  title: string;
  targetKind: string;
  body: string;
  targetValue: string;
  scheduledAt: string;
  actionUrl: string;
};

function ConversationMessageView({
  conversation,
  currentUserId,
  open,
}: {
  conversation: Conversation;
  currentUserId: string;
  open: boolean;
}) {
  const { i18n, t } = useLingui();
  const messagesQuery = useMessagesQuery(conversation.id);
  const sendMessage = useSendMessageMutation();
  const { mutate: markRead } = useMarkReadMutation();
  const deleteMessage = useDeleteMessageMutation();
  const viewportRef = useRef<HTMLDivElement>(null);
  const latestMessageId = messagesQuery.data?.pages[0]?.items.at(-1)?.id;
  const direct = conversation.kind === "direct";
  const displayedMessages = useMemo(
    () => flattenMessagePages(messagesQuery.data?.pages ?? [], !direct),
    [direct, messagesQuery.data?.pages]
  );
  const messageForm = useAppForm({
    defaultValues: { message: "" },
    onSubmit: async ({ value }) => {
      const body = value.message.trim();
      if (!body) return;
      await sendMessage.mutateAsync({ conversationId: conversation.id, body });
      messageForm.reset();
    },
  });

  useEffect(() => {
    if (latestMessageId)
      markRead({ conversationId: conversation.id, throughMessageId: latestMessageId });
  }, [conversation.id, latestMessageId, markRead]);

  useLayoutEffect(() => {
    if (!direct || !open || !latestMessageId) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        viewport.scrollTop = viewport.scrollHeight;
      });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [conversation.id, direct, latestMessageId, open]);

  return (
    <>
      <MessageScrollerProvider autoScroll>
        <MessageScroller>
          <MessageScrollerViewport ref={viewportRef}>
            <MessageScrollerContent className={direct ? undefined : "justify-start"}>
              {direct ? (
                <InfiniteLoadTrigger
                  hasMore={messagesQuery.hasNextPage}
                  loading={messagesQuery.isFetchingNextPage}
                  onLoadMore={messagesQuery.fetchNextPage}
                />
              ) : null}
              {displayedMessages.length ? (
                <VirtualItems
                  items={displayedMessages}
                  scrollRef={viewportRef}
                  estimateSize={() => 92}
                  getItemKey={(item) => item.id}
                  renderItem={(item) => {
                    const own = item.senderId === currentUserId;
                    return (
                      <MessageScrollerItem className="pb-4" messageId={item.id} scrollAnchor={own}>
                        {item.kind !== "direct" && item.title ? (
                          <Marker variant="separator">
                            <MarkerContent>{item.title}</MarkerContent>
                          </Marker>
                        ) : null}
                        <Message align={own ? "end" : "start"}>
                          {!own && item.senderName ? (
                            <MessageAvatar>
                              <Avatar className="size-8">
                                <AvatarImage
                                  src={item.senderImage ?? undefined}
                                  alt={item.senderName}
                                />
                                <AvatarFallback>{initials(item.senderName)}</AvatarFallback>
                              </Avatar>
                            </MessageAvatar>
                          ) : null}
                          <MessageContent>
                            {!own && item.senderName ? (
                              <MessageHeader>{item.senderName}</MessageHeader>
                            ) : null}
                            <Bubble align={own ? "end" : "start"}>
                              <BubbleContent>
                                {item.deletedAt ? t`Message deleted` : item.body}
                              </BubbleContent>
                            </Bubble>
                            <MessageFooter className="flex items-center gap-1">
                              <NotificationTime value={item.createdAt} locale={i18n.locale} />
                              {own && !item.deletedAt ? (
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  aria-label={t`Delete message`}
                                  onClick={() =>
                                    deleteMessage.mutate({
                                      id: item.id,
                                      conversationId: item.conversationId,
                                    })
                                  }
                                >
                                  <Trash2Icon />
                                </Button>
                              ) : null}
                            </MessageFooter>
                          </MessageContent>
                        </Message>
                      </MessageScrollerItem>
                    );
                  }}
                />
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <MessageCircleIcon />
                    </EmptyMedia>
                    <EmptyTitle>{t`Nothing here yet`}</EmptyTitle>
                    <EmptyDescription>{t`New messages will appear here after Firebase notifies this device.`}</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
              {!direct ? (
                <InfiniteLoadTrigger
                  hasMore={messagesQuery.hasNextPage}
                  loading={messagesQuery.isFetchingNextPage}
                  onLoadMore={messagesQuery.fetchNextPage}
                />
              ) : null}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
      {direct ? (
        <form
          className="flex gap-2 border-t p-3"
          onSubmit={(event) => {
            event.preventDefault();
            void messageForm.handleSubmit();
          }}
        >
          <messageForm.AppForm>
            <messageForm.Field
              name="message"
              validators={{
                onSubmit: ({ value }) => (value.trim() ? undefined : t`Write a message.`),
              }}
            >
              {(field) => (
                <Input
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-label={t`Message`}
                  placeholder={t`Write a message`}
                  maxLength={5000}
                  required
                />
              )}
            </messageForm.Field>
            <messageForm.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting] as const}
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  size="icon"
                  disabled={!canSubmit || isSubmitting || sendMessage.isPending}
                  aria-label={t`Send message`}
                >
                  <SendIcon />
                </Button>
              )}
            </messageForm.Subscribe>
          </messageForm.AppForm>
        </form>
      ) : null}
    </>
  );
}

function ConversationSidebar({
  conversations,
  conversationsLoading,
  onSearchChange,
  onSelect,
  onStartDirect,
  onToggleUsers,
  search,
  selectedId,
  showConversationList,
  showUsers,
  users,
  isAdmin,
}: {
  conversations: Conversation[] | undefined;
  conversationsLoading: boolean;
  onSearchChange: (value: string) => void;
  onSelect: (conversationId: string) => void;
  onStartDirect: (userId: string) => Promise<void>;
  onToggleUsers: () => void;
  search: string;
  selectedId: string | undefined;
  showConversationList: boolean;
  showUsers: boolean;
  users: UserTarget[];
  isAdmin: boolean;
}) {
  const { t } = useLingui();
  const peopleScrollRef = useRef<HTMLDivElement>(null);
  const conversationScrollRef = useRef<HTMLDivElement>(null);

  return (
    <aside
      className={`${selectedId && !showConversationList ? "hidden" : "flex"} min-h-0 flex-col border-r md:flex`}
    >
      <div className="flex h-14 items-center justify-between border-b ps-4 pe-14 md:pe-4">
        <div>
          <p className="font-heading font-semibold">{t`Messenger`}</p>
          <p className="text-xs text-muted-foreground">{t`Stored securely in your inbox`}</p>
        </div>
        <Button
          size="icon-sm"
          variant="outline"
          aria-label={t`Start a conversation`}
          onClick={onToggleUsers}
        >
          <PlusIcon />
        </Button>
      </div>
      {showUsers ? (
        <div className="flex min-h-0 flex-1 flex-col gap-2 p-3">
          <div className="relative">
            <SearchIcon className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              className="pl-8"
              placeholder={t`Search people`}
            />
          </div>
          <div ref={peopleScrollRef} className="min-h-0 flex-1 overflow-y-auto">
            <VirtualItems
              items={users}
              scrollRef={peopleScrollRef}
              estimateSize={() => 44}
              getItemKey={(person) => person.id}
              renderItem={(person) => (
                <Button
                  variant="ghost"
                  className="h-10 w-full justify-start"
                  onClick={() => void onStartDirect(person.id)}
                >
                  <Avatar className="size-8">
                    <AvatarImage src={person.image ?? undefined} alt={person.name} />
                    <AvatarFallback>{initials(person.name)}</AvatarFallback>
                  </Avatar>
                  <span className="truncate">{person.name}</span>
                </Button>
              )}
            />
          </div>
        </div>
      ) : (
        <div ref={conversationScrollRef} className="min-h-0 flex-1 overflow-y-auto p-2">
          {conversationsLoading ? (
            <ConversationSkeleton />
          ) : (
            <VirtualItems
              items={conversations ?? []}
              scrollRef={conversationScrollRef}
              estimateSize={() => 68}
              getItemKey={(item) => item.id}
              renderItem={(item) => (
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className="flex h-16 w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-muted data-[active=true]:bg-muted"
                  data-active={item.id === selectedId}
                >
                  <Avatar className="size-10">
                    <AvatarImage src={item.image ?? undefined} alt={item.title} />
                    <AvatarFallback>
                      {item.kind === "announcement" ? (
                        <MegaphoneIcon />
                      ) : item.kind === "platform" ? (
                        <BellRingIcon />
                      ) : (
                        initials(item.title)
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">{item.title}</span>
                      {item.unreadCount && (!isAdmin || item.kind !== "announcement") ? (
                        <Badge>{item.unreadCount > 99 ? "99+" : item.unreadCount}</Badge>
                      ) : null}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {item.lastMessage ?? t`No messages yet`}
                    </span>
                  </span>
                </button>
              )}
            />
          )}
        </div>
      )}
    </aside>
  );
}

function ConversationSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-3">
      {[0, 1, 2].map((value) => (
        <div key={value} className="flex gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminAnnouncementView({
  hasMoreNotifications,
  hasMoreScheduled,
  loadingNotifications,
  loadingScheduled,
  notificationsError,
  notificationsLoading,
  notifications,
  onLoadMoreNotifications,
  onLoadMoreScheduled,
  onSubmit,
  pending,
  scheduled,
  scheduledError,
  scheduledLoading,
  showComposer,
  users,
}: {
  hasMoreNotifications: boolean;
  hasMoreScheduled: boolean;
  loadingNotifications: boolean;
  loadingScheduled: boolean;
  notificationsError: boolean;
  notificationsLoading: boolean;
  notifications: AnnouncementItem[];
  onLoadMoreNotifications: () => Promise<unknown>;
  onLoadMoreScheduled: () => Promise<unknown>;
  onSubmit: (values: AnnouncementValues) => Promise<void>;
  pending: boolean;
  scheduled: AnnouncementItem[];
  scheduledError: boolean;
  scheduledLoading: boolean;
  showComposer: boolean;
  users: UserTarget[];
}) {
  const { i18n, t } = useLingui();
  const scheduledScrollRef = useRef<HTMLDivElement>(null);
  const notificationsScrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {showComposer ? (
        <section className="border-b bg-muted/30 p-4" aria-labelledby="new-announcement-title">
          <div className="mb-3 flex flex-col gap-1">
            <h2 id="new-announcement-title" className="font-heading font-semibold">
              {t`Create notification`}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t`Choose an audience and publish now or schedule it for later.`}
            </p>
          </div>
          <AnnouncementComposer onSubmit={onSubmit} pending={pending} users={users} />
        </section>
      ) : null}
      <div className="flex flex-col gap-8 p-4 md:p-6">
        <section aria-labelledby="scheduled-notifications-title">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 id="scheduled-notifications-title" className="font-heading font-semibold">
                {t`Scheduled notifications`}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t`Upcoming announcements, newest first.`}
              </p>
            </div>
          </div>
          {scheduledError ? (
            <Alert variant="destructive">
              <AlertTitle>{t`Scheduled notifications could not be loaded.`}</AlertTitle>
            </Alert>
          ) : scheduledLoading ? (
            <NotificationListSkeleton />
          ) : scheduled.length ? (
            <div ref={scheduledScrollRef} className="h-80 overflow-y-auto">
              <VirtualItems
                items={scheduled}
                scrollRef={scheduledScrollRef}
                estimateSize={() => 104}
                getItemKey={(item) => item.id}
                renderItem={(item) => (
                  <div className="pb-3">
                    <Item variant="outline" render={<article />}>
                      <ItemMedia variant="icon">
                        <CalendarClockIcon />
                      </ItemMedia>
                      <ItemContent>
                        <ItemHeader>
                          <ItemTitle>{item.title}</ItemTitle>
                          <Badge variant="outline">{t`Scheduled`}</Badge>
                        </ItemHeader>
                        <ItemDescription>{item.body}</ItemDescription>
                        <NotificationTime
                          value={item.scheduledAt}
                          locale={i18n.locale}
                          prefix={t`Scheduled for`}
                        />
                      </ItemContent>
                    </Item>
                  </div>
                )}
              />
            </div>
          ) : (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              {t`No notifications are scheduled.`}
            </p>
          )}
          <InfiniteLoadTrigger
            hasMore={hasMoreScheduled}
            loading={loadingScheduled}
            onLoadMore={onLoadMoreScheduled}
          />
        </section>

        <section aria-labelledby="notification-history-title">
          <div className="mb-3">
            <h2 id="notification-history-title" className="font-heading font-semibold">
              {t`Latest notifications`}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t`Delivered announcements, newest first.`}
            </p>
          </div>
          {notificationsError ? (
            <Alert variant="destructive">
              <AlertTitle>{t`Notifications could not be loaded.`}</AlertTitle>
            </Alert>
          ) : notificationsLoading ? (
            <NotificationListSkeleton />
          ) : notifications.length ? (
            <div ref={notificationsScrollRef} className="h-80 overflow-y-auto">
              <VirtualItems
                items={notifications}
                scrollRef={notificationsScrollRef}
                estimateSize={() => 96}
                getItemKey={(item) => item.id}
                renderItem={(item) => (
                  <div className="pb-3">
                    <Item variant="muted" render={<article />}>
                      <ItemMedia variant="icon">
                        <MegaphoneIcon />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>{item.title ?? t`Announcement`}</ItemTitle>
                        <ItemDescription>{item.body}</ItemDescription>
                        <NotificationTime
                          value={item.sentAt ?? item.createdAt}
                          locale={i18n.locale}
                        />
                      </ItemContent>
                    </Item>
                  </div>
                )}
              />
            </div>
          ) : (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              {t`No notifications have been delivered yet.`}
            </p>
          )}
          <InfiniteLoadTrigger
            hasMore={hasMoreNotifications}
            loading={loadingNotifications}
            onLoadMore={onLoadMoreNotifications}
          />
        </section>
      </div>
    </div>
  );
}

function NotificationTime({
  locale,
  prefix,
  value,
}: {
  locale: string;
  prefix?: string;
  value: Date | string;
}) {
  return (
    <time
      className="text-xs text-muted-foreground"
      dateTime={new Date(value).toISOString()}
      title={formatFullNotificationDate(value, locale)}
    >
      {prefix ? `${prefix} ` : null}
      {formatNotificationDate(value, new Date(), locale)}
    </time>
  );
}

function InfiniteLoadTrigger({
  hasMore,
  loading,
  onLoadMore,
}: {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => Promise<unknown>;
}) {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger || !hasMore || loading) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) void onLoadMore();
      },
      { rootMargin: "160px" }
    );
    observer.observe(trigger);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  return hasMore || loading ? (
    <div ref={triggerRef} className="flex min-h-10 items-center justify-center py-3">
      {loading ? <Spinner /> : null}
      <span className="sr-only">Loading more notifications</span>
    </div>
  ) : null;
}

function NotificationListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((value) => (
        <Skeleton key={value} className="h-24 w-full" />
      ))}
    </div>
  );
}

function AnnouncementComposer({
  onSubmit,
  pending,
  users,
}: {
  onSubmit: (values: AnnouncementValues) => Promise<void>;
  pending: boolean;
  users: Array<{ id: string; name: string }>;
}) {
  const { t } = useLingui();
  const form = useAppForm({
    defaultValues: {
      title: "",
      targetKind: "all",
      body: "",
      targetValue: "",
      scheduledAt: "",
      actionUrl: "",
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
      form.reset();
    },
  });
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.AppForm>
        <FieldGroup className="grid gap-2 md:grid-cols-2">
          <form.AppField name="title">
            {(field) => (
              <field.TextField id="announcement-title" label={t`Title`} required maxLength={200} />
            )}
          </form.AppField>
          <form.AppField name="targetKind">
            {(field) => (
              <field.NativeSelectField id="announcement-target-kind" label={t`Audience`}>
                <NativeSelectOption value="all">{t`Everyone`}</NativeSelectOption>
                <NativeSelectOption value="role">{t`Role`}</NativeSelectOption>
                <NativeSelectOption value="user">{t`One user`}</NativeSelectOption>
              </field.NativeSelectField>
            )}
          </form.AppField>
          <form.AppField name="body">
            {(field) => (
              <field.TextareaField
                id="announcement-body"
                label={t`Announcement`}
                className="md:col-span-2"
                required
                maxLength={5000}
              />
            )}
          </form.AppField>
          <form.AppField name="targetValue">
            {(field) => (
              <field.TextField
                id="announcement-target"
                label={t`Role or user`}
                list="announcement-users"
                placeholder={t`director or user ID`}
              />
            )}
          </form.AppField>
          <datalist id="announcement-users">
            {users.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </datalist>
          <form.AppField name="scheduledAt">
            {(field) => (
              <field.TextField
                id="announcement-schedule"
                label={t`Schedule`}
                type="datetime-local"
              />
            )}
          </form.AppField>
          <form.AppField name="actionUrl">
            {(field) => (
              <field.TextField
                id="announcement-url"
                label={t`Internal link`}
                placeholder={t`/account/security`}
              />
            )}
          </form.AppField>
          <Field className="justify-end">
            <form.SubmitButton disabled={pending}>
              <MegaphoneIcon data-icon="inline-start" />
              {t`Schedule announcement`}
            </form.SubmitButton>
          </Field>
        </FieldGroup>
      </form.AppForm>
    </form>
  );
}
