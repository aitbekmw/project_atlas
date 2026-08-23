import { getActiveLocale } from "@/lib/utils";
import { BCP47 } from "@/i18n/messages";
import type { Job } from "@/types/api";

export type JobUrgency = "Срочно" | "Сегодня" | "Гибко";

export interface MarketplaceJobExtras {
  urgency: JobUrgency;
  distanceKm: number;
  duration: string;
  customerName: string;
  rating: number;
  applicationsCount: number;
  whenLabel: string;
  pin: { left: string; top: string };
}

const urgencies: JobUrgency[] = ["Срочно", "Сегодня", "Гибко"];
const durations = ["1–2 ч", "2–3 ч", "3–4 ч", "4–6 ч", "Весь день"];
const customers = [
  "Айгуль К.",
  "Нурлан Т.",
  "Мария С.",
  "Бакыт А.",
  "Елена В.",
  "Тимур Ж.",
  "Алина М.",
  "Данияр О.",
];
const whenLabels = ["Сегодня, 18:00", "Завтра утром", "Сегодня", "В выходные", "Гибко"];
const pins = [
  { left: "28%", top: "32%" },
  { left: "46%", top: "24%" },
  { left: "62%", top: "38%" },
  { left: "38%", top: "58%" },
  { left: "70%", top: "62%" },
  { left: "22%", top: "68%" },
  { left: "54%", top: "72%" },
  { left: "78%", top: "28%" },
];

function seedFrom(id: number): number {
  const n = Math.abs(id) + 17;
  return (n * 9301 + 49297) % 233280;
}

export function extrasForJob(job: Job): MarketplaceJobExtras {
  const seed = seedFrom(job.id);
  const pick = <T,>(items: T[], offset: number) => items[(seed + offset) % items.length];

  return {
    urgency: pick(urgencies, 1),
    distanceKm: 0.4 + ((seed % 36) / 10),
    duration: pick(durations, 3),
    customerName: pick(customers, 5),
    rating: 4.6 + ((seed % 4) / 10),
    applicationsCount: 2 + (seed % 14),
    whenLabel: pick(whenLabels, 7),
    pin: pick(pins, 2),
  };
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} м`;
  }
  return `${km.toFixed(1).replace(".", ",")} км`;
}

export function averageRatingByUser(
  reviews: Array<{ to_user_id: number; rating: number }>,
): Record<number, number> {
  const buckets = new Map<number, { total: number; count: number }>();
  for (const review of reviews) {
    const current = buckets.get(review.to_user_id) ?? { total: 0, count: 0 };
    current.total += review.rating;
    current.count += 1;
    buckets.set(review.to_user_id, current);
  }
  const ratings: Record<number, number> = {};
  for (const [userId, bucket] of buckets) {
    ratings[userId] = bucket.total / bucket.count;
  }
  return ratings;
}

export function formatRating(value: number): string {
  return new Intl.NumberFormat(BCP47[getActiveLocale()], {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}
