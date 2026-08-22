import {
  Bike,
  BookOpen,
  Briefcase,
  Hammer,
  Monitor,
  Package,
  Sofa,
  Sparkles,
  Truck,
  Droplets,
  Zap,
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
  zap: Zap,
  droplet: Droplets,
  bike: Bike,
  sofa: Sofa,
  book: BookOpen,
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
