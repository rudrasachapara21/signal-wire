import { Bell, Menu, Search } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onMenuOpen: () => void;
}

export function Header({ onMenuOpen }: HeaderProps) {
  const { user } = useAuth();

  const initials = user?.initials ?? "G";
  const avatarLabel = user ? `${user.name}'s account` : "Guest";

  return (
    <header className="grid h-14 grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-border px-3 sm:h-16 sm:gap-3 sm:px-5 lg:px-7">
      {/* Hamburger — mobile only */}
      <Button
        variant="ghost"
        size="icon"
        className="size-11 shrink-0 lg:hidden"
        onClick={onMenuOpen}
        aria-label="Open navigation"
        id="mobile-menu-button"
      >
        <Menu size={19} />
      </Button>

      {/* Search bar — full bar on md+, icon-only trigger on small screens */}
      {/* Full search bar: md and up */}
      <div className="hidden max-w-sm items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground md:flex">
        <Search size={15} className="shrink-0" />
        <span>Search reports and advice</span>
      </div>

      {/* Search icon trigger: small screens only (between hamburger and avatar) */}
      <Button
        variant="ghost"
        size="icon"
        className="size-11 md:hidden"
        aria-label="Search"
      >
        <Search size={18} />
      </Button>

      {/* Right side: bell + avatar */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-11"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </Button>

        {user ? (
          <span
            className="ml-1 grid size-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
            aria-label={avatarLabel}
            title={avatarLabel}
          >
            {initials}
          </span>
        ) : (
          <Link
            to="/login"
            className="ml-1 inline-flex h-10 items-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:ml-2 sm:h-9"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
