import { MarketplaceJobCard } from "@/components/marketplace/job-list-card";
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

export function categoryMap(categories: Category[]): Record<number, string> {
  return Object.fromEntries(categories.map((item) => [item.id, item.name]));
}
