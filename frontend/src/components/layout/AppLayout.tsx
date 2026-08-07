import { useState, type ReactNode } from "react";
import { Sidebar, MobileSidebar } from "./Sidebar";
import { Header } from "./Header";

interface AppLayoutProps {
  children: ReactNode;
}

/**
 * AppLayout — wraps the sidebar (desktop + mobile drawer) and the top header
 * around the page content. Manages mobile sidebar open/close state.
 */
export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background p-0 text-foreground lg:p-6">
      <div className="mx-auto flex min-h-screen max-w-[1500px] overflow-hidden border-border bg-card shadow-sm lg:min-h-[calc(100vh-3rem)] lg:rounded-lg lg:border">
        {/* Desktop sidebar */}
        <Sidebar />

        {/* Mobile slide-in drawer */}
        <MobileSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main area */}
        <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
          <Header onMenuOpen={() => setSidebarOpen(true)} />
          <main className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

