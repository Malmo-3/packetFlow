/**
 * AppShell — persistent chrome that wraps every authenticated page.
 *
 * Renders a sidebar on desktop and a horizontal nav bar on mobile.
 * The nav items shown depend on `user.role` — each role has its own
 * navigation set defined in the `NAV` record.
 *
 * Design: Uber-inspired white sidebar with black active indicators.
 * - White sidebar background, hairline right border
 * - Active nav row: `bg-secondary` fill + left black indicator bar + bold label
 * - Inactive nav row: muted text, gray hover fill
 * - All interactive elements use pill shape (rounded-full)
 *
 * Also hosts:
 * - **Notifications button** with live unread count badge (polled every 30 s).
 * - **Sign out** button — calls `signOut()` and redirects to `/login`.
 */
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Boxes,
  LayoutDashboard,
  LogOut,
  Moon,
  PackagePlus,
  Route as RouteIcon,
  Search,
  Send,
  Star,
  Sun,
  UserCheck,
  Users,
  Webhook as WebhookIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import type { Role } from "@packetflow/types";
import type { ReactNode } from "react";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

const NAV: Record<Role, NavItem[]> = {
  sender: [
    { to: "/sender", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/sender/packages/new", label: "Create package", icon: PackagePlus },
    { to: "/sender/packages", label: "My shipments", icon: Send },
  ],
  recipient: [
    { to: "/recipient", label: "Saved packages", icon: Star, end: true },
    { to: "/recipient/track", label: "Track package", icon: Search },
  ],
  admin: [
    { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/admin/packages", label: "Packages", icon: Boxes },
    { to: "/admin/trips", label: "Trips", icon: RouteIcon },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/applications", label: "Applications", icon: UserCheck },
    { to: "/admin/webhooks", label: "Webhooks", icon: WebhookIcon },
  ],
  carrier: [
    { to: "/carrier/packages", label: "Packages", icon: Boxes },
    { to: "/carrier/trips", label: "Trips", icon: RouteIcon },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  sender: "Sender",
  recipient: "Recipient",
  carrier: "Carrier",
};

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: notifData } = useNotifications();
  const unreadCount = notifData?.unreadCount ?? 0;

  if (!user) return null;

  const items = NAV[user.role];
  // Highlight only the single best-matching nav item (the longest matching
  // path prefix). This prevents nested routes such as /sender/packages/new
  // from also lighting up the parent /sender/packages ("My shipments") entry.
  const pathMatches = (to: string) =>
    location.pathname === to || location.pathname.startsWith(to + "/");
  const activeTo = items
    .filter((it) => pathMatches(it.to))
    .sort((a, b) => b.to.length - a.to.length)[0]?.to;
  const isActive = (item: NavItem) => item.to === activeTo;

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">

      {/* ── Desktop sidebar ────────────────────────────────────────────── */}
      <aside className="hidden w-64 flex-col border-r border-border bg-sidebar text-sidebar-foreground md:flex">

        {/* Logo — inline SVG that follows the sidebar's text colour */}
        <div className="px-6 py-5">
          <Logo className="h-9 w-auto text-sidebar-foreground" />
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-0.5 px-3">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-secondary font-medium text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                {/* Black left-edge active indicator */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-foreground" />
                )}
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-border p-4">
          <div className="mb-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {ROLE_LABEL[user.role]}
            </div>
            <div className="truncate text-sm font-medium">{user.name}</div>
            <div className="truncate text-xs text-muted-foreground">{user.email}</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-1 w-full justify-start gap-2 text-sm"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="mb-1 w-full justify-start gap-2 text-sm"
            onClick={() => navigate("/notifications")}
          >
            <Bell className="h-4 w-4" />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-sm text-muted-foreground"
            onClick={() => {
              signOut();
              navigate("/login");
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* ── Main content area ──────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b border-border bg-background px-4 py-3 md:hidden">
          <Logo className="h-7 w-auto" />
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                signOut();
                navigate("/login");
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Mobile pill nav */}
        <nav className="flex gap-1.5 overflow-x-auto border-b border-border bg-background px-4 py-2 md:hidden">
          {items.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-foreground text-background"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/70",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
