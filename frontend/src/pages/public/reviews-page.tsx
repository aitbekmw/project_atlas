import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Headphones } from "lucide-react";

import { getJob } from "@/api/jobs";
import { listReviews } from "@/api/reviews";
import { getUser } from "@/api/users";
import { ReviewCard } from "@/components/marketplace/review-card";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { ReviewListSkeleton } from "@/components/states/loading-state";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/use-page-title";
import { useI18n } from "@/i18n/locale-context";
import { formatRating } from "@/lib/marketplace";
import { queryKeys } from "@/lib/query-keys";
import { cn, fullName } from "@/lib/utils";

export function ReviewsPage() {
  const { t } = useI18n();
  usePageTitle(t("seo.reviews"));
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const reviewsQuery = useQuery({
    queryKey: queryKeys.reviews,
    queryFn: listReviews,
  });
  const reviews = reviewsQuery.data ?? [];
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length
      : null;
  const visibleReviews = useMemo(
    () => (starFilter == null ? reviews : reviews.filter((item) => item.rating === starFilter)),
    [reviews, starFilter],
  );
  const userIds = Array.from(
    new Set(reviews.flatMap((item) => [item.from_user_id, item.to_user_id])),
  );
  const jobIds = Array.from(new Set(reviews.map((item) => item.job_id)));

  const namesQuery = useQuery({
    queryKey: [...queryKeys.reviews, "names", userIds],
    queryFn: () => fetchUserNames(userIds),
    enabled: userIds.length > 0,
    retry: false,
  });
  const jobsQuery = useQuery({
    queryKey: [...queryKeys.reviews, "jobs", jobIds],
    queryFn: () => fetchJobTitles(jobIds),
    enabled: jobIds.length > 0,
    retry: false,
  });

  return (
    <div className="atlas-page">
      <h1 className="atlas-page-title">{t("reviews.title")}</h1>
      <p className="atlas-page-lead">{t("reviews.hint")}</p>
      {reviewsQuery.isLoading ? (
        <div className="mt-3">
          <ReviewListSkeleton />
        </div>
      ) : null}
      {reviewsQuery.isError ? (
        <div className="mt-3">
          <ErrorState error={reviewsQuery.error} onRetry={() => void reviewsQuery.refetch()} />
        </div>
      ) : null}
      {!reviewsQuery.isLoading && !reviewsQuery.isError && reviews.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            title={t("reviews.empty")}
            description={t("reviews.emptyHint")}
          />
        </div>
      ) : null}
      {!reviewsQuery.isError && reviews.length > 0 ? (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-4 rounded-2xl border bg-card px-4 py-3">
            <div>
              <p className="text-2xl font-bold text-primary">
                {averageRating == null ? "—" : `★ ${formatRating(averageRating)}`}
              </p>
              <p className="text-xs text-muted-foreground">{t("reviews.avgRating")}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("job.reviewsCount", { count: reviews.length })}
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Button
              type="button"
              size="sm"
              variant={starFilter == null ? "default" : "outline"}
              className={cn("min-h-11 rounded-full", starFilter != null && "bg-card")}
              onClick={() => setStarFilter(null)}
            >
              {t("reviews.filterAll")}
            </Button>
            {[5, 4, 3].map((stars) => (
              <Button
                key={stars}
                type="button"
                size="sm"
                variant={starFilter === stars ? "default" : "outline"}
                className={cn("min-h-11 rounded-full", starFilter !== stars && "bg-card")}
                onClick={() => setStarFilter(stars)}
              >
                {t("reviews.filterStar", { stars })}
              </Button>
            ))}
          </div>
          {visibleReviews.length === 0 ? (
            <div className="mt-3">
              <EmptyState title={t("reviews.empty")} description={t("reviews.emptyHint")} />
            </div>
          ) : (
            <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {visibleReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  rating={review.rating}
                  comment={review.comment}
                  createdAt={review.created_at}
                  author={labelFor(review.from_user_id, namesQuery.data, t("common.userFallback", { id: review.from_user_id }))}
                  recipient={labelFor(review.to_user_id, namesQuery.data, t("common.userFallback", { id: review.to_user_id }))}
                  jobId={review.job_id}
                  jobTitle={jobsQuery.data?.[review.job_id] || t("common.jobFallback", { id: review.job_id })}
                />
              ))}
            </div>
          )}
          <div className="mt-6 flex items-start gap-3 rounded-2xl border bg-card p-4">
            <Headphones className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h2 className="font-semibold">{t("landing.supportTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("landing.supportText")}</p>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function labelFor(userId: number, names?: Record<number, string>, fallback = ""): string {
  return names?.[userId] || fallback;
}

async function fetchUserNames(ids: number[]): Promise<Record<number, string>> {
  const entries = await Promise.all(
    ids.map(async (id) => {
      try {
        const user = await getUser(id);
        return [id, fullName(user)] as const;
      } catch {
        return [id, ""] as const;
      }
    }),
  );
  return Object.fromEntries(entries);
}

async function fetchJobTitles(ids: number[]): Promise<Record<number, string>> {
  const entries = await Promise.all(
    ids.map(async (id) => {
      try {
        const job = await getJob(id);
        return [id, job.title] as const;
      } catch {
        return [id, ""] as const;
      }
    }),
  );
  return Object.fromEntries(entries);
}
