import type { PropsWithChildren } from "react";

export function PageContainer({ children }: PropsWithChildren) {
  return <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">{children}</div>;
}
