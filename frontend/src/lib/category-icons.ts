import {
  Briefcase,
  Hammer,
  Monitor,
  Package,
  Sparkles,
  Truck,
  type LucideIcon,
} from "lucide-react";

import type { Category } from "@/types/api";

const categoryIcons: Record<string, LucideIcon> = {
  wrench: Hammer,
  hammer: Hammer,
  package: Package,
  sparkles: Sparkles,
  sparkle: Sparkles,
  truck: Truck,
  monitor: Monitor,
  ремонт: Hammer,
  доставка: Package,
  уборка: Sparkles,
  переезд: Truck,
  "it и техника": Monitor,
  красота: Sparkles,
};

export function iconForCategory(category: Pick<Category, "name" | "icon">): LucideIcon {
  const fromIcon = category.icon ? categoryIcons[category.icon.toLowerCase()] : undefined;
  const fromName = categoryIcons[category.name.toLowerCase()];
  return fromIcon ?? fromName ?? Briefcase;
}
