import { MarketplaceJobCard } from "@/components/marketplace/job-list-card";
import { localizedCategoryName } from "@/i18n/categories";
import type { MessageKey } from "@/i18n/messages";
import type { Category, Job } from "@/types/api";

interface JobCardProps {
  job: Job;
  categoryName?: string;
  href?: string;
}

export function JobCard({ job, categoryName, href }: JobCardProps) {
  return (
    <MarketplaceJobCard
      job={job}
      categoryName={categoryName}
      href={href}
      layout="tile"
    />
  );
}

export function categoryMap(
  categories: Category[],
  t: (key: MessageKey, vars?: Record<string, string | number>) => string,
): Record<number, string> {
  return Object.fromEntries(
    categories.map((item) => [item.id, localizedCategoryName(item, t)]),
  );
}
