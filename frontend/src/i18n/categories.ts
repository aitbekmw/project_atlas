import type { MessageKey } from "@/i18n/messages";
import type { Category } from "@/types/api";

type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

type SystemSlug =
  | "repair"
  | "delivery"
  | "cleaning"
  | "moving"
  | "it"
  | "electric"
  | "plumbing"
  | "courier"
  | "furniture"
  | "tutoring";

const BY_ICON: Record<string, SystemSlug> = {
  wrench: "repair",
  hammer: "repair",
  package: "delivery",
  sparkles: "cleaning",
  sparkle: "cleaning",
  truck: "moving",
  monitor: "it",
  zap: "electric",
  droplet: "plumbing",
  bike: "courier",
  sofa: "furniture",
  book: "tutoring",
};

const BY_NAME: Record<string, SystemSlug> = {
  ремонт: "repair",
  доставка: "delivery",
  уборка: "cleaning",
  переезд: "moving",
  "it и техника": "it",
  электрика: "electric",
  сантехника: "plumbing",
  курьер: "courier",
  мебель: "furniture",
  репетиторство: "tutoring",
  repair: "repair",
  delivery: "delivery",
  cleaning: "cleaning",
  moving: "moving",
  "it and gadgets": "it",
  electrical: "electric",
  plumbing: "plumbing",
  courier: "courier",
  furniture: "furniture",
  tutoring: "tutoring",
  оңдоо: "repair",
  жеткирүү: "delivery",
  тазалоо: "cleaning",
  көчүү: "moving",
  "it жана техника": "it",
  репетиторлук: "tutoring",
  эмерек: "furniture",
};

const NAME_KEYS: Record<SystemSlug, MessageKey> = {
  repair: "sysCategory.repair",
  delivery: "sysCategory.delivery",
  cleaning: "sysCategory.cleaning",
  moving: "sysCategory.moving",
  it: "sysCategory.it",
  electric: "sysCategory.electric",
  plumbing: "sysCategory.plumbing",
  courier: "sysCategory.courier",
  furniture: "sysCategory.furniture",
  tutoring: "sysCategory.tutoring",
};

const DESC_KEYS: Record<SystemSlug, MessageKey> = {
  repair: "sysCategory.repairDesc",
  delivery: "sysCategory.deliveryDesc",
  cleaning: "sysCategory.cleaningDesc",
  moving: "sysCategory.movingDesc",
  it: "sysCategory.itDesc",
  electric: "sysCategory.electricDesc",
  plumbing: "sysCategory.plumbingDesc",
  courier: "sysCategory.courierDesc",
  furniture: "sysCategory.furnitureDesc",
  tutoring: "sysCategory.tutoringDesc",
};

function systemCategorySlug(
  category: Pick<Category, "name" | "icon">,
): SystemSlug | null {
  const fromIcon = category.icon
    ? BY_ICON[category.icon.toLowerCase().trim()]
    : undefined;
  if (fromIcon) {
    return fromIcon;
  }
  return BY_NAME[category.name.toLowerCase().trim()] ?? null;
}

export function localizedCategoryName(
  category: Pick<Category, "name" | "icon">,
  t: Translate,
): string {
  const slug = systemCategorySlug(category);
  return slug ? t(NAME_KEYS[slug]) : category.name;
}

export function localizedCategoryDescription(
  category: Pick<Category, "name" | "icon" | "description">,
  t: Translate,
): string | null {
  const slug = systemCategorySlug(category);
  if (slug) {
    return t(DESC_KEYS[slug]);
  }
  return category.description?.trim() ? category.description : null;
}
