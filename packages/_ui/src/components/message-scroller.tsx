import * as React from "react";

import { cn } from "../lib/utils";

function MessageScrollerProvider({
  children,
}: {
  children: React.ReactNode;
  autoScroll?: boolean;
}) {
  return children;
}

function MessageScroller(props: React.ComponentProps<"div">) {
  return <div data-slot="message-scroller" className="relative min-h-0 flex-1" {...props} />;
}

function MessageScrollerViewport({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-scroller-viewport"
      className={cn("size-full overflow-y-auto", className)}
      {...props}
    />
  );
}

function MessageScrollerContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-scroller-content"
      className={cn("flex min-h-full flex-col justify-end gap-4 p-4", className)}
      {...props}
    />
  );
}

function MessageScrollerItem(
  props: React.ComponentProps<"div"> & { messageId?: string; scrollAnchor?: boolean }
) {
  const { messageId: _, scrollAnchor: __, ...rest } = props;
  return <div data-slot="message-scroller-item" {...rest} />;
}

function MessageScrollerButton() {
  return null;
}

export {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
};
