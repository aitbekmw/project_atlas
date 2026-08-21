import { LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Logo } from "@/components/layout/navbar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/users/user-avatar";
import { useAuth } from "@/context/auth-context";
import { useI18n } from "@/i18n/locale-context";
import { getNavItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import type { MessageKey } from "@/i18n/messages";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  const items = getNavItems(user.role);

  return (
    <div className="flex h-full flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="px-5 py-5">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/app/dashboard" || item.to === "/app/chat"}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {t(item.labelKey)}
          </NavLink>
        ))}
      </nav>
      <Separator />
      <div className="px-4 pb-2">
        <LanguageSwitcher className="w-full" />
      </div>
      <div className="flex items-center gap-3 p-4 pt-2">
        <UserAvatar user={user} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {user.first_name} {user.last_name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {t(`role.${user.role}` as MessageKey)}
          </p>
        </div>
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full"
          aria-label={t("nav.logout")}
          onClick={async () => {
            await logout();
            navigate("/");
          }}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
