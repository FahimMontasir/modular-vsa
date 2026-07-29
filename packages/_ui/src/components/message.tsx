import * as React from "react";

import { cn } from "../lib/utils";

function Message({
  className,
  align = "start",
  ...props
}: React.ComponentProps<"article"> & { align?: "start" | "end" }) {
  return (
    <article
      data-slot="message"
      data-align={align}
      className={cn("flex gap-2 data-[align=end]:justify-end", className)}
      {...props}
    />
  );
}

function MessageAvatar(props: React.ComponentProps<"div">) {
  return <div data-slot="message-avatar" className="shrink-0" {...props} />;
}

function MessageContent(props: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-content"
      className="flex max-w-[85%] min-w-0 flex-col gap-1"
      {...props}
    />
  );
}

function MessageHeader(props: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-header"
      className="text-xs font-medium text-muted-foreground"
      {...props}
    />
  );
}

function MessageFooter(props: React.ComponentProps<"div">) {
  return <div data-slot="message-footer" className="text-xs text-muted-foreground" {...props} />;
}

export { Message, MessageAvatar, MessageContent, MessageFooter, MessageHeader };
