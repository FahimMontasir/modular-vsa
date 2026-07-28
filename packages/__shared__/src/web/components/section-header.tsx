import { useLingui } from "@lingui/react/macro";
import { Link, useLocation } from "@tanstack/react-router";
import {
  KeyRoundIcon,
  LinkIcon,
  MonitorSmartphoneIcon,
  ShieldCheckIcon,
  UserRoundIcon,
  UsersIcon,
} from "lucide-react";

import { Badge } from "@modular-vsa/ui/badge";
import { buttonVariants } from "@modular-vsa/ui/button";
import { cn } from "@modular-vsa/ui/lib/utils";
import { ScrollArea } from "@modular-vsa/ui/scroll-area";

export function SectionHeader({
  kind,
  eyebrow,
  title,
  description,
  badge,
}: {
  kind: "access-control" | "account";
  eyebrow: string;
  title: string;
  description: string;
  badge?: string;
}) {
  const { t } = useLingui();
  const pathname = useLocation({ select: (location) => location.pathname });
  const items =
    kind === "access-control"
      ? [
          { href: "/access-control/users", label: t`Users`, icon: UsersIcon },
          { href: "/access-control/sessions", label: t`Sessions`, icon: MonitorSmartphoneIcon },
          { href: "/access-control/permissions", label: t`Permissions`, icon: ShieldCheckIcon },
        ]
      : [
          { href: "/account/profile", label: t`Profile`, icon: UserRoundIcon },
          { href: "/account/security", label: t`Security`, icon: KeyRoundIcon },
          { href: "/account/sessions", label: t`Sessions`, icon: MonitorSmartphoneIcon },
          { href: "/account/connections", label: t`Connections`, icon: LinkIcon },
        ];

  return (
    <header className="flex flex-col gap-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{eyebrow}</p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>
        {badge ? <Badge variant="secondary">{badge}</Badge> : null}
      </div>
      <ScrollArea className="w-full whitespace-nowrap">
        <nav aria-label={t`${title} sections`} className="flex min-w-max border-b">
          {items.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                preload="intent"
                aria-current={active ? "page" : undefined}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "rounded-none border-b-2 border-transparent px-4",
                  active && "border-primary text-foreground"
                )}
              >
                <Icon data-icon="inline-start" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </header>
  );
}
