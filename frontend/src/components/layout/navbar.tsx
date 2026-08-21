import { Menu } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/context/auth-context";
import { getAccountMenuItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const publicLinks = [
  { to: "/jobs", label: "Найти заказы" },
  { to: "/categories", label: "Категории" },
  { to: "/#how-it-works", label: "Как это работает" },
  { to: "/reviews", label: "Отзывы" },
];

export function Logo({ muted = false }: { muted?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
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
            {link.label}
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
            {link.label}
          </NavLink>
        ),
      )}
    </nav>
  );
}

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
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
    <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-3 px-4">
        <Logo />

        <NavLinks className="hidden lg:flex" />

        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          {isAuthenticated && user ? (
            <UserMenu />
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button asChild variant="ghost" size="sm" className="duration-200">
                <Link to="/login">Войти</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="duration-200">
                <Link to="/register">Регистрация</Link>
              </Button>
            </div>
          )}
          <Button asChild size="sm" className="hidden duration-200 lg:inline-flex">
            <Link to={createOrderTo}>Разместить заказ</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full lg:hidden"
            aria-label="Открыть меню"
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
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.to}
                  to={link.to}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground"
                  onClick={close}
                >
                  {link.label}
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
                    {item.label}
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
                  Войти
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                  onClick={close}
                >
                  Регистрация
                </Link>
              </>
            )}
            <Button asChild className="mt-4">
              <Link to={createOrderTo} onClick={close}>
                Разместить заказ
              </Link>
            </Button>
            {isAuthenticated ? (
              <Button variant="outline" className="mt-2" onClick={() => void onLogout()}>
                Выйти
              </Button>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
