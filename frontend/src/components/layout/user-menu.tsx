import { LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/users/user-avatar";
import { useAuth } from "@/context/auth-context";
import { getAccountMenuItems } from "@/lib/navigation";
import { cn, fullName } from "@/lib/utils";
import { ROLE_LABEL } from "@/types/api";

export function UserMenu({ compact = false }: { compact?: boolean }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  const name = fullName(user) || user.username;
  const items = getAccountMenuItems(user.role);

  async function onLogout() {
    await logout();
    navigate("/");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Меню профиля"
          className={cn(
            "flex items-center gap-2 rounded-full p-0.5 text-left outline-none transition-colors duration-200",
            "hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring",
            !compact && "lg:rounded-xl lg:px-2 lg:py-1",
          )}
        >
          <UserAvatar user={user} className="h-9 w-9" />
          <span className={cn("min-w-0", compact ? "hidden" : "hidden lg:block")}>
            <span className="block max-w-32 truncate text-sm font-semibold leading-tight">
              {name}
            </span>
            <span className="block truncate text-[11px] text-muted-foreground">
              {ROLE_LABEL[user.role]}
            </span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-xl p-1.5">
        <div className="flex items-center gap-3 px-2 py-2">
          <UserAvatar user={user} className="h-10 w-10" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{ROLE_LABEL[user.role]}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        {items.map((item) => (
          <DropdownMenuItem key={item.to} asChild>
            <Link to={item.to} className="cursor-pointer">
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={() => void onLogout()}
        >
          <LogOut className="h-4 w-4" />
          Выйти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
