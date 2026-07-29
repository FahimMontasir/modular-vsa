import * as React from "react";

import { cn } from "../lib/utils";

function Bubble({
  className,
  align = "start",
  ...props
}: React.ComponentProps<"div"> & { align?: "start" | "end" }) {
  return (
    <div
      data-slot="bubble"
      data-align={align}
      className={cn(
        "max-w-[85%] rounded-2xl bg-muted px-3 py-2 text-sm data-[align=end]:ml-auto data-[align=end]:bg-primary data-[align=end]:text-primary-foreground",
        className
      )}
      {...props}
    />
  );
}

function BubbleContent(props: React.ComponentProps<"div">) {
  return <div data-slot="bubble-content" className="break-words whitespace-pre-wrap" {...props} />;
}

export { Bubble, BubbleContent };
