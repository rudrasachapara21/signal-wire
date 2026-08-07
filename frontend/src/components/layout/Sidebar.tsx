import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  CircleUserRound,
  FileClock,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Settings,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Nav items ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { to: "/overview", label: "Overview", icon: LayoutDashboard },
  { to: "/brand-profile", label: "Brand profile", icon: CircleUserRound },
  { to: "/strategy-report", label: "Strategy report", icon: BarChart3 },
  { to: "/past-reports", label: "Past reports", icon: FileClock },
] as const;

// ─── Brand mark ──────────────────────────────────────────────────────────────

function BrandMark() {
  return (
    <Link to="/overview" className="flex items-center gap-3 focus:outline-none">
      <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
        <Megaphone size={18} />
      </span>
      <span className="font-display text-lg font-bold text-sidebar-foreground">
        Signal Wire
      </span>
    </Link>
  );
}

// ─── Sidebar inner content ───────────────────────────────────────────────────

interface SidebarContentProps {
  onClose?: () => void;
}

function SidebarContent({ onClose }: SidebarContentProps) {
  const { user, logout } = useAuth();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <div className="flex h-full flex-col p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <BrandMark />
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close navigation"
            className="size-11 lg:hidden"
          >
            <X size={18} />
          </Button>
        )}
      </div>

      {/* Nav */}
      <nav className="mt-10 space-y-1" aria-label="Main navigation">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const isActive = currentPath === to || currentPath.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className={cn(
                "flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground",
              )}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="mt-auto space-y-3">
        {/* Advisor ready card */}
        <div className="rounded-lg border border-primary/15 bg-accent p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <span className="signal-dot size-2 rounded-full bg-primary" />
            ADVISOR READY
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {user
              ? `${user.name}'s brand profile is ready for analysis.`
              : "Brand profile is 82% complete and ready for analysis."}
          </p>
        </div>

        {/* Settings */}
        <Button
          variant="ghost"
          className="h-10 w-full justify-start px-3 text-sm font-medium text-sidebar-foreground"
        >
          <Settings size={16} />
          Settings
        </Button>

        {/* Log out (only shown when authenticated) */}
        {user && (
          <Button
            variant="ghost"
            onClick={() => {
              logout();
              onClose?.();
            }}
            className="h-10 w-full justify-start px-3 text-sm font-medium text-sidebar-foreground hover:text-destructive"
          >
            <LogOut size={16} />
            Log out
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Desktop sidebar ─────────────────────────────────────────────────────────

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
      <SidebarContent />
    </aside>
  );
}

// ─── Mobile drawer sidebar ───────────────────────────────────────────────────

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-foreground/30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-sidebar-border bg-sidebar transition-transform duration-200 ease-in-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Mobile navigation"
      >
        <SidebarContent onClose={onClose} />
      </aside>
    </>
  );
}
