import { useQuery } from "@tanstack/react-query";

import { getJob } from "@/api/jobs";
import { listReviews } from "@/api/reviews";
import { getUser } from "@/api/users";
import { ReviewCard } from "@/components/marketplace/review-card";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { ReviewListSkeleton } from "@/components/states/loading-state";
import { queryKeys } from "@/lib/query-keys";
import { useI18n } from "@/i18n/locale-context";
import { fullName } from "@/lib/utils";

export function ReviewsPage() {
  const { t } = useI18n();
  const reviewsQuery = useQuery({
    queryKey: queryKeys.reviews,
    queryFn: listReviews,
  });
  const reviews = reviewsQuery.data ?? [];
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
        <div className="mt-5 sm:mt-8">
          <ReviewListSkeleton />
        </div>
      ) : null}
      {reviewsQuery.isError ? (
        <div className="mt-5 sm:mt-8">
          <ErrorState error={reviewsQuery.error} onRetry={() => void reviewsQuery.refetch()} />
        </div>
      ) : null}
      {!reviewsQuery.isLoading && !reviewsQuery.isError && reviews.length === 0 ? (
        <div className="mt-5 sm:mt-8">
          <EmptyState
            title={t("reviews.empty")}
            description={t("reviews.emptyHint")}
          />
        </div>
      ) : null}
      {!reviewsQuery.isError && reviews.length > 0 ? (
        <div className="mt-5 grid gap-3 sm:mt-8 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
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
