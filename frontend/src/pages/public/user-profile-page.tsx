import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { useParams } from "react-router-dom";

import { listCategories } from "@/api/categories";
import { getJob, listJobs } from "@/api/jobs";
import { getUserReviews } from "@/api/reviews";
import { getUser } from "@/api/users";
import { categoryMap } from "@/components/jobs/job-card";
import { MarketplaceJobCard } from "@/components/marketplace/job-list-card";
import { ReviewCard } from "@/components/marketplace/review-card";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { JobFeedSkeleton, ReviewListSkeleton } from "@/components/states/loading-state";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/users/user-avatar";
import { usePageTitle } from "@/hooks/use-page-title";
import { useI18n } from "@/i18n/locale-context";
import { roleKey } from "@/i18n/status";
import { formatRating } from "@/lib/marketplace";
import {
  averageRating,
  mostCommonCity,
  uniqueCategoryIds,
  uniqueJobIdsFromReviews,
} from "@/lib/profile-stats";
import { queryKeys } from "@/lib/query-keys";
import { fullName } from "@/lib/utils";
import type { Job } from "@/types/api";

export function UserProfilePage() {
  const { t } = useI18n();
  const { userId } = useParams();
  const id = Number(userId);
  const valid = Number.isFinite(id) && id > 0;

  const userQuery = useQuery({
    queryKey: queryKeys.user(id),
    queryFn: () => getUser(id),
    enabled: valid,
    retry: false,
  });
  const reviewsQuery = useQuery({
    queryKey: queryKeys.userReviews(id),
    queryFn: () => getUserReviews(id),
    enabled: valid && userQuery.isSuccess,
    retry: false,
  });
  const jobsQuery = useQuery({
    queryKey: queryKeys.jobs({ size: 100 }),
    queryFn: () => listJobs({ size: 100 }),
    enabled: valid && userQuery.isSuccess,
    retry: false,
  });
  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories,
    queryFn: listCategories,
  });

  const user = userQuery.data;
  const reviews = reviewsQuery.data ?? [];
  const names = categoryMap(categoriesQuery.data ?? [], t);
  const ownedJobs = (jobsQuery.data ?? []).filter((job) => job.owner_id === id);
  const completedOwned = ownedJobs.filter((job) => job.status === "COMPLETED");
  const rating = averageRating(reviews);
  const reviewedJobIds = uniqueJobIdsFromReviews(reviews);

  const reviewedJobsQuery = useQuery({
    queryKey: ["profile-reviewed-jobs", id, reviewedJobIds],
    enabled: reviewedJobIds.length > 0,
    retry: false,
    queryFn: async () => {
      const entries = await Promise.all(
        reviewedJobIds.slice(0, 12).map(async (jobId) => {
          try {
            return await getJob(jobId);
          } catch {
            return null;
          }
        }),
      );
      return entries.filter((job): job is Job => job != null);
    },
  });

  const reviewedJobs = reviewedJobsQuery.data ?? [];
  const city = mostCommonCity(reviewedJobs.length > 0 ? reviewedJobs : ownedJobs);
  const specializations = uniqueCategoryIds(reviewedJobs)
    .map((categoryId) => names[categoryId])
    .filter(Boolean);
  const titleName = user ? fullName(user) : t("common.userFallback", { id });

  usePageTitle(
    userQuery.isError || !valid ? t("seo.notFound") : t("seo.profile", { name: titleName }),
  );

  if (!valid) {
    return (
      <div className="atlas-page">
        <ErrorState title={t("profile.notFound")} description={t("notFound.hint")} />
      </div>
    );
  }

  if (userQuery.isLoading) {
    return (
      <div className="atlas-page">
        <JobFeedSkeleton />
      </div>
    );
  }

  if (userQuery.isError || !user) {
    return (
      <div className="atlas-page">
        <ErrorState
          title={t("profile.notFound")}
          error={userQuery.error}
          onRetry={() => void userQuery.refetch()}
        />
      </div>
    );
  }

  const historyJobs = user.role === "worker" ? reviewedJobs : ownedJobs;

  return (
    <div className="atlas-page">
      <div className="rounded-2xl border bg-card p-4 sm:p-6">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
          <UserAvatar user={user} className="h-16 w-16 sm:h-20 sm:w-20" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-2xl font-bold tracking-tight">{fullName(user)}</h1>
              <Badge variant="secondary">{t(roleKey(user.role))}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{t("profile.publicHint")}</p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {rating != null ? (
                <span className="inline-flex items-center gap-1 font-semibold">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {formatRating(rating)}
                </span>
              ) : (
                <span className="text-muted-foreground">{t("landing.noReviews")}</span>
              )}
              {reviews.length > 0 ? (
                <span>{t("profile.reviewsCount", { count: reviews.length })}</span>
              ) : null}
              {user.role === "worker" && reviewedJobIds.length > 0 ? (
                <span>{t("profile.jobsWithReviews", { count: reviewedJobIds.length })}</span>
              ) : null}
              {(user.role === "customer" || user.role === "admin") && ownedJobs.length > 0 ? (
                <span>{t("profile.postedCount", { count: ownedJobs.length })}</span>
              ) : null}
              {(user.role === "customer" || user.role === "admin") && completedOwned.length > 0 ? (
                <span>{t("profile.completedCount", { count: completedOwned.length })}</span>
              ) : null}
              {city ? <span className="text-muted-foreground">{city}</span> : null}
            </div>
            {specializations.length > 0 ? (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("profile.specializations")}
                </p>
                <p className="mt-1 text-sm">{specializations.join(" · ")}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-bold tracking-tight">{t("profile.reviewsAbout")}</h2>
        {reviewsQuery.isLoading ? (
          <div className="mt-4">
            <ReviewListSkeleton />
          </div>
        ) : null}
        {reviewsQuery.isError ? (
          <div className="mt-4">
            <ErrorState error={reviewsQuery.error} onRetry={() => void reviewsQuery.refetch()} />
          </div>
        ) : null}
        {!reviewsQuery.isLoading && !reviewsQuery.isError && reviews.length === 0 ? (
          <EmptyState
            className="mt-4"
            title={t("profile.noReviews")}
            description={t("profile.noReviewsHint")}
          />
        ) : null}
        {reviews.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                rating={review.rating}
                comment={review.comment}
                createdAt={review.created_at}
                jobId={review.job_id}
                jobTitle={
                  reviewedJobs.find((job) => job.id === review.job_id)?.title ??
                  t("common.jobFallback", { id: review.job_id })
                }
              />
            ))}
          </div>
        ) : null}
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold tracking-tight">
          {user.role === "worker" ? t("profile.workHistory") : t("profile.postedJobs")}
        </h2>
        {jobsQuery.isLoading || reviewedJobsQuery.isLoading ? (
          <div className="mt-4">
            <JobFeedSkeleton />
          </div>
        ) : null}
        {!jobsQuery.isLoading && !reviewedJobsQuery.isLoading && historyJobs.length === 0 ? (
          <EmptyState
            className="mt-4"
            title={t("profile.noJobs")}
            description={t("profile.noJobsHint")}
          />
        ) : null}
        {historyJobs.length > 0 ? (
          <div className="mt-4 grid gap-3">
            {historyJobs.slice(0, 8).map((job) => (
              <MarketplaceJobCard
                key={job.id}
                job={job}
                categoryName={names[job.category_id]}
                href={`/jobs/${job.id}`}
                layout="list"
              />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
