import { BadgeCheck, Star } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/users/user-avatar";
import { useI18n } from "@/i18n/locale-context";
import { formatRating } from "@/lib/marketplace";
import type { Review, User } from "@/types/api";

export interface FeaturedWorker {
  id: number;
  first_name: string;
  last_name: string;
  avatar: string | null;
  verified: boolean;
  role: User["role"];
  rating: number;
  reviewCount: number;
  jobsWithReviews: number;
  city?: string;
  specializations?: string[];
}

export function featuredWorkersFromReviews(
  reviews: Review[],
  users: Record<number, User>,
  limit = 4,
): FeaturedWorker[] {
  const ratings = new Map<number, number[]>();
  const jobs = new Map<number, Set<number>>();
  for (const review of reviews) {
    const list = ratings.get(review.to_user_id) ?? [];
    list.push(review.rating);
    ratings.set(review.to_user_id, list);
    const jobIds = jobs.get(review.to_user_id) ?? new Set<number>();
    jobIds.add(review.job_id);
    jobs.set(review.to_user_id, jobIds);
  }

  return [...ratings.entries()]
    .flatMap(([id, values]) => {
      const user = users[id];
      if (!user || user.role !== "worker") {
        return [];
      }
      const total = values.reduce((sum, value) => sum + value, 0);
      return [
        {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          avatar: user.avatar,
          verified: user.is_verified,
          role: user.role,
          rating: total / values.length,
          reviewCount: values.length,
          jobsWithReviews: jobs.get(id)?.size ?? 0,
        } satisfies FeaturedWorker,
      ];
    })
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount || b.jobsWithReviews - a.jobsWithReviews)
    .slice(0, limit);
}

export function WorkerCard({ worker }: { worker: FeaturedWorker }) {
  const { t } = useI18n();
  return (
    <article className="flex h-full flex-col rounded-2xl border bg-card p-3 transition-colors duration-200 hover:border-primary/30 hover:bg-card-hover sm:p-3.5">
      <div className="flex items-start gap-2.5">
        <UserAvatar user={worker} className="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">
            {worker.first_name} {worker.last_name}
            {worker.verified ? (
              <BadgeCheck className="ml-1 inline h-3.5 w-3.5 text-primary" aria-label={t("common.verified")} />
            ) : null}
          </h3>
          {worker.city ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{worker.city}</p> : null}
          <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {formatRating(worker.rating)}
            <span className="font-normal text-muted-foreground">· {worker.reviewCount}</span>
          </p>
        </div>
      </div>
      {worker.specializations && worker.specializations.length > 0 ? (
        <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
          {worker.specializations.join(" · ")}
        </p>
      ) : null}
      <div className="mt-3">
        <Button asChild size="sm" className="min-h-11 w-full">
          <Link to={`/users/${worker.id}`}>{t("landing.viewProfile")}</Link>
        </Button>
      </div>
    </article>
  );
}
