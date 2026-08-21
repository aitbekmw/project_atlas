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

import type { MessageKey } from "@/i18n/messages";
import type { UserRole } from "@/types/api";

export interface NavItem {
  labelKey: MessageKey;
  to: string;
  icon: LucideIcon;
}

export function getNavItems(role: UserRole): NavItem[] {
  if (role === "customer") {
    return [
      { labelKey: "nav.dashboard", to: "/app/dashboard", icon: LayoutDashboard },
      { labelKey: "nav.myJobs", to: "/app/jobs", icon: Briefcase },
      { labelKey: "nav.placeOrder", to: "/app/jobs/new", icon: PlusCircle },
      { labelKey: "nav.applications", to: "/app/applications", icon: Users },
      { labelKey: "nav.messages", to: "/app/chat", icon: MessageSquare },
      { labelKey: "nav.profile", to: "/app/profile", icon: UserRound },
      { labelKey: "nav.settings", to: "/app/settings", icon: Settings },
    ];
  }

  if (role === "admin") {
    return [
      { labelKey: "nav.dashboard", to: "/app/dashboard", icon: LayoutDashboard },
      { labelKey: "nav.users", to: "/app/admin/users", icon: Users },
      { labelKey: "nav.categories", to: "/app/admin/categories", icon: FolderTree },
      { labelKey: "nav.orders", to: "/app/admin/jobs", icon: Briefcase },
      { labelKey: "nav.applications", to: "/app/applications", icon: Inbox },
      { labelKey: "nav.reviews", to: "/app/admin/reviews", icon: Star },
      { labelKey: "nav.profile", to: "/app/profile", icon: UserRound },
      { labelKey: "nav.settings", to: "/app/settings", icon: Settings },
    ];
  }

  return [
    { labelKey: "nav.dashboard", to: "/app/dashboard", icon: LayoutDashboard },
    { labelKey: "nav.searchJobs", to: "/app/search", icon: Search },
    { labelKey: "nav.myApplications", to: "/app/applications", icon: Briefcase },
    { labelKey: "nav.messages", to: "/app/chat", icon: MessageSquare },
    { labelKey: "nav.profile", to: "/app/profile", icon: UserRound },
    { labelKey: "nav.settings", to: "/app/settings", icon: Settings },
  ];
}

export function getAccountMenuItems(role: UserRole): NavItem[] {
  if (role === "customer") {
    return [
      { labelKey: "nav.myProfile", to: "/app/profile", icon: UserRound },
      { labelKey: "nav.myJobs", to: "/app/jobs", icon: Briefcase },
      { labelKey: "nav.messages", to: "/app/chat", icon: MessageSquare },
      { labelKey: "nav.settings", to: "/app/settings", icon: Settings },
    ];
  }

  if (role === "admin") {
    return [
      { labelKey: "nav.dashboard", to: "/app/dashboard", icon: LayoutDashboard },
      { labelKey: "nav.users", to: "/app/admin/users", icon: Users },
      { labelKey: "nav.orders", to: "/app/admin/jobs", icon: Briefcase },
      { labelKey: "nav.applications", to: "/app/applications", icon: Inbox },
      { labelKey: "nav.reviews", to: "/app/admin/reviews", icon: Star },
      { labelKey: "nav.settings", to: "/app/settings", icon: Settings },
    ];
  }

  return [
    { labelKey: "nav.myProfile", to: "/app/profile", icon: UserRound },
    { labelKey: "nav.myApplications", to: "/app/applications", icon: Briefcase },
    { labelKey: "nav.messages", to: "/app/chat", icon: MessageSquare },
    { labelKey: "nav.settings", to: "/app/settings", icon: Settings },
  ];
}
