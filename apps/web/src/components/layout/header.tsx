"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, BriefcaseBusiness, Home, LayoutDashboard, LogOut, MessageCircle, Search, UserRound, UsersRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useLogoutMutation, useSession } from "@/features/auth/hooks/use-auth";
import { useNotifications } from "@/features/notifications/hooks/use-notifications";
import { useAuthStore } from "@/stores/auth-store";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Network", href: "/network", icon: UsersRound },
  { label: "Jobs", href: "/jobs", icon: BriefcaseBusiness },
  { label: "Messages", href: "/messages", icon: MessageCircle },
  { label: "Profile", href: "/profile", icon: UserRound },
  { label: "Alerts", href: "/notifications", icon: Bell }
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogoutMutation();
  const { data: notifications } = useNotifications();
  const unreadCount = notifications?.unreadCount ?? 0;
  useSession();

  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
        <div className="container flex h-16 items-center gap-3">
          <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold text-primary">
            <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground">
              <BriefcaseBusiness />
            </span>
            <span className="hidden text-lg sm:inline">ProNet</span>
          </Link>
          <div className="relative hidden min-w-48 max-w-sm flex-1 md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-10 bg-secondary pl-10" placeholder="Search people, posts and jobs" />
          </div>
          <nav className="ml-auto hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <DesktopNavItem key={item.label} item={item} pathname={pathname} unreadCount={unreadCount} />
            ))}
            {user?.role === "admin" ? (
              <Button asChild variant="ghost" className="h-12 flex-col gap-1 px-3 text-xs font-medium">
                <Link href="/admin" aria-current={isActive(pathname, "/admin") ? "page" : undefined}>
                  <LayoutDashboard />
                  Admin
                </Link>
              </Button>
            ) : null}
          </nav>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Search">
            <Search />
          </Button>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Logout"
            disabled={logoutMutation.isPending}
            onClick={() => {
              logoutMutation.mutate(undefined, {
                onSettled: () => router.replace("/login")
              });
            }}
          >
            <LogOut />
          </Button>
          <Link href="/profile" aria-label="Open profile">
            <Avatar className="size-10">
              <AvatarImage src={user?.avatarUrl} />
              <AvatarFallback>{initials(user?.name ?? "User")}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-lg backdrop-blur lg:hidden">
        <div className="mx-auto grid h-16 max-w-2xl grid-cols-6">
          {navItems.map((item) => (
            <MobileNavItem key={item.label} item={item} pathname={pathname} unreadCount={unreadCount} />
          ))}
        </div>
      </nav>
    </>
  );
}

type NavItem = (typeof navItems)[number];

function DesktopNavItem({ item, pathname, unreadCount }: { item: NavItem; pathname: string; unreadCount: number }) {
  return (
    <Button asChild variant="ghost" className="relative h-12 flex-col gap-1 px-3 text-xs font-medium">
      <Link href={item.href} aria-current={isActive(pathname, item.href) ? "page" : undefined}>
        <item.icon />
        <NotificationBadge item={item} unreadCount={unreadCount} />
        {item.label}
      </Link>
    </Button>
  );
}

function MobileNavItem({ item, pathname, unreadCount }: { item: NavItem; pathname: string; unreadCount: number }) {
  const active = isActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "relative flex min-w-0 flex-col items-center justify-center gap-1 text-[11px] font-semibold text-primary"
          : "relative flex min-w-0 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground"
      }
    >
      <item.icon className="size-5" />
      <NotificationBadge item={item} unreadCount={unreadCount} />
      <span className="max-w-full truncate">{item.label}</span>
    </Link>
  );
}

function NotificationBadge({ item, unreadCount }: { item: NavItem; unreadCount: number }) {
  if (item.label !== "Alerts" || unreadCount <= 0) {
    return null;
  }

  return (
    <span className="absolute right-3 top-2 grid min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
      {unreadCount > 9 ? "9+" : unreadCount}
    </span>
  );
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
