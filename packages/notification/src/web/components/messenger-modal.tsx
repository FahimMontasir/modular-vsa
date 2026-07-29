import { useLingui } from "@lingui/react/macro";
import {
  ArrowLeftIcon,
  BellRingIcon,
  MegaphoneIcon,
  MessageCircleIcon,
  PlusIcon,
  SearchIcon,
  SendIcon,
  Trash2Icon,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

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
import { Field, FieldGroup, FieldLabel } from "@modular-vsa/ui/field";
import { Input } from "@modular-vsa/ui/input";
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
import { Skeleton } from "@modular-vsa/ui/skeleton";
import { Textarea } from "@modular-vsa/ui/textarea";

import {
  useConversationsQuery,
  useCreateAnnouncementMutation,
  useCreateDirectMutation,
  useDeleteMessageMutation,
  useMarkReadMutation,
  useMessagesQuery,
  useSendMessageMutation,
  useUsersQuery,
} from "../api/query";

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
  const [selectedConversationId, setSelectedConversationId] = useState<string>();
  const [showConversationList, setShowConversationList] = useState(false);
  const [search, setSearch] = useState("");
  const [showUsers, setShowUsers] = useState(false);
  const usersQuery = useUsersQuery(search, open && showUsers);
  const selectedId =
    selectedConversationId ?? initialConversationId ?? conversationsQuery.data?.[0]?.id;
  const messagesQuery = useMessagesQuery(selectedId);
  const createDirect = useCreateDirectMutation();
  const sendMessage = useSendMessageMutation();
  const { mutate: markRead } = useMarkReadMutation();
  const deleteMessage = useDeleteMessageMutation();
  const createAnnouncement = useCreateAnnouncementMutation();
  const selected = conversationsQuery.data?.find(({ id }) => id === selectedId);

  const latestMessageId = messagesQuery.data?.at(-1)?.id;
  useEffect(() => {
    if (selectedId && latestMessageId)
      markRead({ conversationId: selectedId, throughMessageId: latestMessageId });
  }, [selectedId, latestMessageId, markRead]);

  const selectedUserTargets = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);

  async function startDirect(userId: string) {
    const row = await createDirect.mutateAsync(userId);
    setSelectedConversationId(row.id);
    setShowConversationList(false);
    setShowUsers(false);
  }

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId) return;
    const form = event.currentTarget;
    const body = formValue(new FormData(form), "message").trim();
    if (!body) return;
    await sendMessage.mutateAsync({ conversationId: selectedId, body });
    form.reset();
  }

  async function submitAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const targetKind = formValue(values, "targetKind") as "all" | "role" | "user";
    const targetValue = formValue(values, "targetValue").trim();
    const scheduled = formValue(values, "scheduledAt");
    await createAnnouncement.mutateAsync({
      title: formValue(values, "title").trim(),
      body: formValue(values, "body").trim(),
      actionUrl: formValue(values, "actionUrl").trim() || undefined,
      scheduledAt: scheduled ? new Date(scheduled) : undefined,
      targets: [{ kind: targetKind, value: targetKind === "all" ? undefined : targetValue }],
    });
    form.reset();
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
          />
          <section
            className={`${selectedId && !showConversationList ? "flex" : "hidden"} min-h-0 flex-col md:flex`}
          >
            {selected ? (
              <>
                <div className="flex h-14 items-center gap-3 border-b px-4">
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
                </div>
                <MessageScrollerProvider autoScroll>
                  <MessageScroller>
                    <MessageScrollerViewport>
                      <MessageScrollerContent>
                        {messagesQuery.data?.length ? (
                          messagesQuery.data.map((item) => {
                            const own = item.senderId === currentUserId;
                            return (
                              <MessageScrollerItem
                                key={item.id}
                                messageId={item.id}
                                scrollAnchor={own}
                              >
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
                                      {new Date(item.createdAt).toLocaleString()}
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
                          })
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
                      </MessageScrollerContent>
                    </MessageScrollerViewport>
                    <MessageScrollerButton />
                  </MessageScroller>
                </MessageScrollerProvider>
                {selected.kind === "direct" ? (
                  <form className="flex gap-2 border-t p-3" onSubmit={submitMessage}>
                    <Input
                      name="message"
                      aria-label={t`Message`}
                      placeholder={t`Write a message`}
                      maxLength={5000}
                      required
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={sendMessage.isPending}
                      aria-label={t`Send message`}
                    >
                      <SendIcon />
                    </Button>
                  </form>
                ) : selected.kind === "announcement" && isAdmin ? (
                  <AnnouncementComposer
                    onSubmit={submitAnnouncement}
                    pending={createAnnouncement.isPending}
                    users={selectedUserTargets}
                  />
                ) : null}
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

function formValue(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === "string" ? value : "";
}

type Conversation = NonNullable<ReturnType<typeof useConversationsQuery>["data"]>[number];
type UserTarget = NonNullable<ReturnType<typeof useUsersQuery>["data"]>[number];

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
}) {
  const { t } = useLingui();

  return (
    <aside
      className={`${selectedId && !showConversationList ? "hidden" : "flex"} min-h-0 flex-col border-r md:flex`}
    >
      <div className="flex h-14 items-center justify-between border-b px-4">
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
          <div className="flex min-h-0 flex-col gap-1 overflow-y-auto">
            {users.map((person) => (
              <Button
                key={person.id}
                variant="ghost"
                className="h-auto justify-start"
                onClick={() => void onStartDirect(person.id)}
              >
                <Avatar className="size-8">
                  <AvatarImage src={person.image ?? undefined} alt={person.name} />
                  <AvatarFallback>{initials(person.name)}</AvatarFallback>
                </Avatar>
                <span className="truncate">{person.name}</span>
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {conversationsLoading ? (
            <ConversationSkeleton />
          ) : (
            conversations?.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-muted data-[active=true]:bg-muted"
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
                    {item.unreadCount ? (
                      <Badge>{item.unreadCount > 99 ? "99+" : item.unreadCount}</Badge>
                    ) : null}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {item.lastMessage ?? t`No messages yet`}
                  </span>
                </span>
              </button>
            ))
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

function AnnouncementComposer({
  onSubmit,
  pending,
  users,
}: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  pending: boolean;
  users: Array<{ id: string; name: string }>;
}) {
  const { t } = useLingui();
  return (
    <form className="border-t p-3" onSubmit={(event) => void onSubmit(event)}>
      <FieldGroup className="grid gap-2 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="announcement-title">{t`Title`}</FieldLabel>
          <Input id="announcement-title" name="title" required maxLength={200} />
        </Field>
        <Field>
          <FieldLabel htmlFor="announcement-target-kind">{t`Audience`}</FieldLabel>
          <select
            id="announcement-target-kind"
            name="targetKind"
            aria-label={t`Audience`}
            className="h-9 rounded-lg border bg-background px-3 text-sm"
          >
            <option value="all">{t`Everyone`}</option>
            <option value="role">{t`Role`}</option>
            <option value="user">{t`One user`}</option>
          </select>
        </Field>
        <Field className="md:col-span-2">
          <FieldLabel htmlFor="announcement-body">{t`Announcement`}</FieldLabel>
          <Textarea id="announcement-body" name="body" required maxLength={5000} />
        </Field>
        <Field>
          <FieldLabel htmlFor="announcement-target">{t`Role or user`}</FieldLabel>
          <Input
            id="announcement-target"
            name="targetValue"
            list="announcement-users"
            placeholder={t`director or user ID`}
          />
          <datalist id="announcement-users">
            {users.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </datalist>
        </Field>
        <Field>
          <FieldLabel htmlFor="announcement-schedule">{t`Schedule`}</FieldLabel>
          <Input id="announcement-schedule" name="scheduledAt" type="datetime-local" />
        </Field>
        <Field>
          <FieldLabel htmlFor="announcement-url">{t`Internal link`}</FieldLabel>
          <Input id="announcement-url" name="actionUrl" placeholder={t`/account/security`} />
        </Field>
        <Field className="justify-end">
          <Button type="submit" disabled={pending}>
            <MegaphoneIcon data-icon="inline-start" />
            {t`Schedule announcement`}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
