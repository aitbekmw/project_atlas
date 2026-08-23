import { Menu } from "lucide-react";
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { Logo } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useI18n } from "@/i18n/locale-context";
import { cn } from "@/lib/utils";

function AppMobileHeader() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 pt-[env(safe-area-inset-top,0px)] backdrop-blur lg:hidden">
      <div className="flex h-14 min-w-0 items-center justify-between gap-2 overflow-x-clip px-4">
        <Logo />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-11 w-11 rounded-full"
          aria-label={t("nav.menu")}
          aria-expanded={open}
          aria-controls="app-mobile-nav"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      <Sheet open={open} onOpenChange={setOpen} modal={false}>
        <SheetContent side="left" className="p-0" id="app-mobile-nav">
          <Sidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  );
}

export function AppLayout() {
  const { pathname } = useLocation();
  const isChat = pathname.startsWith("/app/chat");

  return (
    <div className="min-h-svh overflow-x-clip bg-background">
      <AppMobileHeader />
      <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-svh min-h-0 lg:block">
          <Sidebar />
        </aside>
        <main className="min-h-svh min-w-0">
          <div
            className={cn(
              "mx-auto min-w-0 max-w-6xl px-4",
              isChat ? "py-3 sm:py-4 lg:px-8 lg:py-6" : "py-4 sm:py-6 lg:px-8 lg:py-8",
            )}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
