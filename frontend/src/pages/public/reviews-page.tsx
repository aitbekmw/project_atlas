import { useQuery } from "@tanstack/react-query";

import { getJob } from "@/api/jobs";
import { listReviews } from "@/api/reviews";
import { getUser } from "@/api/users";
import { ReviewCard } from "@/components/marketplace/review-card";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { ReviewListSkeleton } from "@/components/states/loading-state";
import { queryKeys } from "@/lib/query-keys";
import { fullName } from "@/lib/utils";

export function ReviewsPage() {
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
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Отзывы</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Реальные оценки из GET /reviews после завершённых заказов.
      </p>
      {reviewsQuery.isLoading ? (
        <div className="mt-8">
          <ReviewListSkeleton />
        </div>
      ) : null}
      {reviewsQuery.isError ? (
        <div className="mt-8">
          <ErrorState error={reviewsQuery.error} onRetry={() => void reviewsQuery.refetch()} />
        </div>
      ) : null}
      {!reviewsQuery.isLoading && !reviewsQuery.isError && reviews.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Отзывов пока нет"
            description="После завершения заказа участники смогут оставить оценку. Пустой список API не заменяется демо."
          />
        </div>
      ) : null}
      {!reviewsQuery.isError && reviews.length > 0 ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              rating={review.rating}
              comment={review.comment}
              createdAt={review.created_at}
              author={labelFor(review.from_user_id, namesQuery.data)}
              recipient={labelFor(review.to_user_id, namesQuery.data)}
              jobId={review.job_id}
              jobTitle={jobsQuery.data?.[review.job_id]}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function labelFor(userId: number, names?: Record<number, string>): string {
  return names?.[userId] ?? `Пользователь #${userId}`;
}

async function fetchUserNames(ids: number[]): Promise<Record<number, string>> {
  const entries = await Promise.all(
    ids.map(async (id) => {
      try {
        const user = await getUser(id);
        return [id, fullName(user)] as const;
      } catch {
        return [id, `Пользователь #${id}`] as const;
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
        return [id, `Заказ #${id}`] as const;
      }
    }),
  );
  return Object.fromEntries(entries);
}
