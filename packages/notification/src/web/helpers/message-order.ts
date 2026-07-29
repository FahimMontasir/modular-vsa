type MessagePage<T> = { items: readonly T[] };

export function flattenMessagePages<T>(pages: readonly MessagePage<T>[], newestFirst: boolean) {
  if (newestFirst) return pages.flatMap(({ items }) => items.toReversed());
  return pages.toReversed().flatMap(({ items }) => items);
}
