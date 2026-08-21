import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getJob } from "@/api/jobs";
import { deleteReview, listReviews } from "@/api/reviews";
import { getUser } from "@/api/users";
import { PageHeader } from "@/components/layout/page-header";
import { ReviewCard } from "@/components/marketplace/review-card";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { ReviewListSkeleton } from "@/components/states/loading-state";
import { queryKeys } from "@/lib/query-keys";
import { fullName, getErrorMessage } from "@/lib/utils";

export function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const reviewsQuery = useQuery({
    queryKey: queryKeys.reviews,
    queryFn: listReviews,
  });
  const deleteMutation = useMutation({
    mutationFn: deleteReview,
    onSuccess: async () => {
      toast.success("Отзыв удалён");
      await queryClient.invalidateQueries({ queryKey: queryKeys.reviews });
      await queryClient.invalidateQueries({ queryKey: ["user-reviews"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <div>
      <PageHeader title="Отзывы" description="Модерация: DELETE /reviews/{id} доступен автору и admin" />
      {reviewsQuery.isLoading ? <ReviewListSkeleton /> : null}
      {reviewsQuery.isError ? (
        <ErrorState error={reviewsQuery.error} onRetry={() => void reviewsQuery.refetch()} />
      ) : null}
      {!reviewsQuery.isLoading && !reviewsQuery.isError && reviewsQuery.data?.length === 0 ? (
        <EmptyState title="Отзывов нет" description="Когда появятся оценки, они отобразятся здесь." />
      ) : null}
      <div className="grid gap-3">
        {(reviewsQuery.data ?? []).map((review) => (
          <AdminReviewRow
            key={review.id}
            fromUserId={review.from_user_id}
            toUserId={review.to_user_id}
            jobId={review.job_id}
            rating={review.rating}
            comment={review.comment}
            createdAt={review.created_at}
            deleting={deleteMutation.isPending}
            onDelete={() => deleteMutation.mutate(review.id)}
          />
        ))}
      </div>
    </div>
  );
}

function AdminReviewRow({
  fromUserId,
  toUserId,
  jobId,
  rating,
  comment,
  createdAt,
  deleting,
  onDelete,
}: {
  fromUserId: number;
  toUserId: number;
  jobId: number;
  rating: number;
  comment: string;
  createdAt: string;
  deleting: boolean;
  onDelete: () => void;
}) {
  const fromQuery = useQuery({
    queryKey: queryKeys.user(fromUserId),
    queryFn: () => getUser(fromUserId),
    retry: false,
  });
  const toQuery = useQuery({
    queryKey: queryKeys.user(toUserId),
    queryFn: () => getUser(toUserId),
    retry: false,
  });
  const jobQuery = useQuery({
    queryKey: queryKeys.job(jobId),
    queryFn: () => getJob(jobId),
    retry: false,
  });

  return (
    <ReviewCard
      rating={rating}
      comment={comment}
      createdAt={createdAt}
      author={fromQuery.data ? fullName(fromQuery.data) : `Пользователь #${fromUserId}`}
      recipient={toQuery.data ? fullName(toQuery.data) : `Пользователь #${toUserId}`}
      jobId={jobId}
      jobTitle={jobQuery.data?.title}
      onDelete={onDelete}
      deleting={deleting}
    />
  );
}
