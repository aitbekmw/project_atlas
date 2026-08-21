import {
  Briefcase,
  FolderTree,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  PlusCircle,
  Search,
  Settings,
  Star,
  UserRound,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { UserRole } from "@/types/api";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export function getNavItems(role: UserRole): NavItem[] {
  if (role === "customer") {
    return [
      { label: "Дашборд", to: "/app/dashboard", icon: LayoutDashboard },
      { label: "Мои заказы", to: "/app/jobs", icon: Briefcase },
      { label: "Разместить заказ", to: "/app/jobs/new", icon: PlusCircle },
      { label: "Отклики", to: "/app/applications", icon: Users },
      { label: "Сообщения", to: "/app/chat", icon: MessageSquare },
      { label: "Профиль", to: "/app/profile", icon: UserRound },
      { label: "Настройки", to: "/app/settings", icon: Settings },
    ];
  }

  if (role === "admin") {
    return [
      { label: "Дашборд", to: "/app/dashboard", icon: LayoutDashboard },
      { label: "Пользователи", to: "/app/admin/users", icon: Users },
      { label: "Категории", to: "/app/admin/categories", icon: FolderTree },
      { label: "Заказы", to: "/app/admin/jobs", icon: Briefcase },
      { label: "Отклики", to: "/app/applications", icon: Inbox },
      { label: "Отзывы", to: "/app/admin/reviews", icon: Star },
      { label: "Профиль", to: "/app/profile", icon: UserRound },
      { label: "Настройки", to: "/app/settings", icon: Settings },
    ];
  }

  return [
    { label: "Дашборд", to: "/app/dashboard", icon: LayoutDashboard },
    { label: "Найти заказы", to: "/app/search", icon: Search },
    { label: "Мои отклики", to: "/app/applications", icon: Briefcase },
    { label: "Сообщения", to: "/app/chat", icon: MessageSquare },
    { label: "Профиль", to: "/app/profile", icon: UserRound },
    { label: "Настройки", to: "/app/settings", icon: Settings },
  ];
}

export function getAccountMenuItems(role: UserRole): NavItem[] {
  if (role === "customer") {
    return [
      { label: "Мой профиль", to: "/app/profile", icon: UserRound },
      { label: "Мои заказы", to: "/app/jobs", icon: Briefcase },
      { label: "Сообщения", to: "/app/chat", icon: MessageSquare },
      { label: "Настройки", to: "/app/settings", icon: Settings },
    ];
  }

  if (role === "admin") {
    return [
      { label: "Дашборд", to: "/app/dashboard", icon: LayoutDashboard },
      { label: "Пользователи", to: "/app/admin/users", icon: Users },
      { label: "Заказы", to: "/app/admin/jobs", icon: Briefcase },
      { label: "Отклики", to: "/app/applications", icon: Inbox },
      { label: "Отзывы", to: "/app/admin/reviews", icon: Star },
      { label: "Настройки", to: "/app/settings", icon: Settings },
    ];
  }

  return [
    { label: "Мой профиль", to: "/app/profile", icon: UserRound },
    { label: "Мои отклики", to: "/app/applications", icon: Briefcase },
    { label: "Сообщения", to: "/app/chat", icon: MessageSquare },
    { label: "Настройки", to: "/app/settings", icon: Settings },
  ];
}
