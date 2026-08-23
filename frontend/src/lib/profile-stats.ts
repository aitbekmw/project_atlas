import type { Job, Review } from "@/types/api";

export function averageRating(reviews: Review[]): number | null {
  if (reviews.length === 0) {
    return null;
  }
  return reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length;
}

export function uniqueNumbers(values: number[]): number[] {
  return [...new Set(values.filter((value) => Number.isFinite(value) && value > 0))];
}

export function uniqueJobIdsFromReviews(reviews: Review[]): number[] {
  return uniqueNumbers(reviews.map((item) => item.job_id));
}

export function mostCommonCity(jobs: Job[]): string | undefined {
  const counts = new Map<string, number>();
  for (const job of jobs) {
    const city = job.city.trim();
    if (!city) {
      continue;
    }
    counts.set(city, (counts.get(city) ?? 0) + 1);
  }
  let best: string | undefined;
  let max = 0;
  for (const [city, count] of counts) {
    if (count > max) {
      best = city;
      max = count;
    }
  }
  return best;
}

export function uniqueCategoryIds(jobs: Job[]): number[] {
  return uniqueNumbers(jobs.map((job) => job.category_id));
}
