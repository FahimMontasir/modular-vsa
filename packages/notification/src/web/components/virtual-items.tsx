"use no memo";

import { useVirtualizer } from "@tanstack/react-virtual";
import type { CSSProperties, ReactNode, RefObject } from "react";

export function VirtualItems<T>({
  estimateSize,
  getItemKey,
  items,
  renderItem,
  scrollRef,
}: {
  estimateSize: (index: number) => number;
  getItemKey: (item: T) => string;
  items: readonly T[];
  renderItem: (item: T, index: number) => ReactNode;
  scrollRef: RefObject<HTMLElement | null>;
}) {
  const virtualizer = useVirtualizer({
    count: items.length,
    estimateSize,
    getItemKey: (index) => getItemKey(items[index]!),
    getScrollElement: () => scrollRef.current,
    initialRect: { width: 0, height: 320 },
    overscan: 8,
    useFlushSync: false,
  });

  return (
    <div
      className="relative w-full"
      style={{ height: virtualizer.getTotalSize() } satisfies CSSProperties}
    >
      {virtualizer.getVirtualItems().map((virtualItem) => (
        <div
          key={virtualItem.key}
          ref={virtualizer.measureElement}
          data-index={virtualItem.index}
          className="absolute top-0 left-0 w-full"
          style={{ transform: `translateY(${virtualItem.start}px)` }}
        >
          {renderItem(items[virtualItem.index]!, virtualItem.index)}
        </div>
      ))}
    </div>
  );
}
