import { useLingui } from "@lingui/react/macro";
import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { HomeIcon, KeyRoundIcon, LogOutIcon, ShieldCheckIcon, UserRoundIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@modular-vsa/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@modular-vsa/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@modular-vsa/ui/breadcrumb";
import { Button, buttonVariants } from "@modular-vsa/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@modular-vsa/ui/dropdown-menu";
import { Separator } from "@modular-vsa/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@modular-vsa/ui/sidebar";
import { ThemeToggle } from "@modular-vsa/ui/theme";

import { LanguageSwitcher } from "./language-switcher";

type ShellUser = {
  name: string;
  email: string;
  image?: string | null;
  username?: string | null;
  displayUsername?: string | null;
  role?: string | null;
};

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function ApplicationShell({
  user,
  isImpersonating,
  onSignOut,
  onStopImpersonating,
}: {
  user: ShellUser;
  isImpersonating: boolean;
  onSignOut: () => Promise<void>;
  onStopImpersonating: () => Promise<void>;
}) {
  const { t } = useLingui();
  const location = useLocation();
  const roleLabel = user.role === "admin" ? t`Administrator` : t`Director`;
  const navigation = [
    { to: "/", label: t`Home`, icon: HomeIcon },
    { to: "/access-control/users", label: t`Access Control`, icon: ShieldCheckIcon },
    { to: "/account/profile", label: t`Account`, icon: UserRoundIcon },
  ];
  const currentPage = location.pathname.startsWith("/access-control")
    ? t`Access Control`
    : location.pathname.startsWith("/account")
      ? t`Account`
      : t`Home`;
  const segment = location.pathname.split("/").filter(Boolean)[1];
  const currentSubpage = segment
    ? ({
        users: t`Users`,
        sessions: t`Sessions`,
        permissions: t`Permissions`,
        profile: t`Profile`,
        security: t`Security`,
        connections: t`Connections`,
      }[segment] ?? segment)
    : undefined;
  const sectionPath = location.pathname.startsWith("/access-control")
    ? "/access-control/users"
    : "/account/profile";

  function isActive(to: string) {
    if (to === "/") return location.pathname === "/";
    return location.pathname.startsWith(to.split("/").slice(0, 2).join("/"));
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" render={<Link to="/" />}>
                <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <KeyRoundIcon />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Modular VSA</span>
                  <span className="truncate text-xs">{t`Control plane`}</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{t`Portal`}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      tooltip={item.label}
                      isActive={isActive(item.to)}
                      render={<Link to={item.to} />}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                tooltip={user.email}
                render={<Link to="/account/profile" />}
              >
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage src={user.image ?? undefined} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{initials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {user.displayUsername ?? user.username ?? user.name}
                  </span>
                  <span className="truncate text-xs">{roleLabel}</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="pb-20 md:pb-0">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur">
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger className="-ml-1 hidden md:inline-flex" />
            <Separator orientation="vertical" className="hidden h-4 md:block" />
            <Breadcrumb className="min-w-0">
              <BreadcrumbList className="flex-nowrap">
                <BreadcrumbItem className="hidden sm:block">
                  <span>{t`Portal`}</span>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden sm:block" />
                <BreadcrumbItem>
                  {currentSubpage ? (
                    <BreadcrumbLink render={<Link to={sectionPath} />}>
                      {currentPage}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{currentPage}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {currentSubpage ? (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{currentSubpage}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                ) : null}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon" aria-label={t`Open account menu`} />}
              >
                <Avatar className="size-8">
                  <AvatarImage src={user.image ?? undefined} alt={user.name} />
                  <AvatarFallback>{initials(user.name)}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <span className="block truncate text-foreground">{user.name}</span>
                    <span className="block truncate font-normal">{user.email}</span>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                {isImpersonating ? (
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => void onStopImpersonating()}>
                      <ShieldCheckIcon />
                      {t`Stop impersonating`}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                ) : null}
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => void onSignOut()}>
                    <LogOutIcon />
                    {t`Sign out`}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        {isImpersonating ? (
          <Alert className="m-4 mb-0 rounded-lg border-primary">
            <ShieldCheckIcon />
            <AlertTitle>{t`Impersonation session`}</AlertTitle>
            <AlertDescription>{t`You are viewing the portal as ${user.name}. Use the account menu to return to your administrator session.`}</AlertDescription>
          </Alert>
        ) : null}
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
        <nav
          aria-label={t`Primary navigation`}
          className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t bg-background/95 px-2 py-2 backdrop-blur md:hidden"
        >
          {navigation.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={buttonVariants({
                variant: isActive(item.to) ? "secondary" : "ghost",
                className: "h-auto flex-col gap-1 py-2",
              })}
            >
              <item.icon />
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
        </nav>
      </SidebarInset>
    </SidebarProvider>
  );
}
