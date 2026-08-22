import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/context/auth-context";
import { useI18n } from "@/i18n/locale-context";
import type { MessageKey } from "@/i18n/messages";
import { getAccountMenuItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

function usePublicLinks(): { to: string; labelKey: MessageKey }[] {
  return [
    { to: "/jobs", labelKey: "nav.jobs" },
    { to: "/categories", labelKey: "nav.categories" },
    { to: "/#how-it-works", labelKey: "nav.how" },
    { to: "/reviews", labelKey: "nav.reviews" },
  ];
}

export function Logo({ muted = false }: { muted?: boolean }) {
  return (
    <Link to="/" className="flex min-w-0 items-center gap-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
        A
      </span>
      <span className={cn("text-lg font-bold tracking-tight", muted && "text-muted-foreground")}>
        Atlas
      </span>
    </Link>
  );
}

function NavLinks({
  onClick,
  className,
}: {
  onClick?: () => void;
  className?: string;
}) {
  const { t } = useI18n();
  const publicLinks = usePublicLinks();
  return (
    <nav className={cn("flex items-center gap-7 text-sm font-medium", className)}>
      {publicLinks.map((link) =>
        link.to.includes("#") ? (
          <a
            key={link.to}
            href={link.to}
            onClick={onClick}
            className="text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            {t(link.labelKey)}
          </a>
        ) : (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onClick}
            className={({ isActive }) =>
              cn(
                "text-muted-foreground transition-colors duration-200 hover:text-foreground",
                isActive && "text-foreground",
              )
            }
          >
            {t(link.labelKey)}
          </NavLink>
        ),
      )}
    </nav>
  );
}

export function Navbar() {
  const { t } = useI18n();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
        document.body.style.removeProperty("pointer-events");
      };
    }
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("pointer-events");
    return undefined;
  }, [open]);
  const publicLinks = usePublicLinks();
  const createOrderTo =
    isAuthenticated && (user?.role === "customer" || user?.role === "admin")
      ? "/app/jobs/new"
      : "/register";
  const accountItems = user ? getAccountMenuItems(user.role) : [];

  async function onLogout() {
    await logout();
    setOpen(false);
    navigate("/");
  }

  function close() {
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 pt-[env(safe-area-inset-top,0px)] backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-6xl min-w-0 items-center justify-between gap-2 overflow-x-hidden px-4 sm:gap-3">
        <Logo />

        <NavLinks className="hidden lg:flex" />

        <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">
          <LanguageSwitcher className="hidden lg:inline-flex" />
          <ThemeToggle />
          {isAuthenticated && user ? (
            <UserMenu />
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button asChild variant="ghost" size="sm" className="duration-200">
                <Link to="/login">{t("nav.login")}</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="duration-200">
                <Link to="/register">{t("nav.register")}</Link>
              </Button>
            </div>
          )}
          <Button asChild size="sm" className="hidden duration-200 lg:inline-flex">
            <Link to={createOrderTo}>{t("nav.placeOrder")}</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full lg:hidden"
            aria-label={t("nav.menu")}
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-6">
          <Logo />
          <div className="mt-8 flex flex-col gap-1">
            {publicLinks.map((link) =>
              link.to.includes("#") ? (
                <a
                  key={link.to}
                  href={link.to}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground"
                  onClick={close}
                >
                  {t(link.labelKey)}
                </a>
              ) : (
                <Link
                  key={link.to}
                  to={link.to}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground"
                  onClick={close}
                >
                  {t(link.labelKey)}
                </Link>
              ),
            )}
            {isAuthenticated && user ? (
              <>
                <div className="my-2 h-px bg-border" />
                {accountItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground"
                    onClick={close}
                  >
                    <item.icon className="h-4 w-4" />
                    {t(item.labelKey)}
                  </Link>
                ))}
              </>
            ) : (
              <>
                <div className="my-2 h-px bg-border" />
                <Link
                  to="/login"
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                  onClick={close}
                >
                  {t("nav.login")}
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                  onClick={close}
                >
                  {t("nav.register")}
                </Link>
              </>
            )}
            <Button asChild className="mt-4 min-h-11">
              <Link to={createOrderTo} onClick={close}>
                {t("nav.placeOrder")}
              </Link>
            </Button>
            {isAuthenticated ? (
              <Button variant="outline" className="mt-2 min-h-11" onClick={() => void onLogout()}>
                {t("nav.logout")}
              </Button>
            ) : null}
            <div className="my-3 h-px bg-border" />
            <LanguageSwitcher variant="panel" />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
