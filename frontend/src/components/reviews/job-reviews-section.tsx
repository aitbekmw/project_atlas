import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createReview, listReviews } from "@/api/reviews";
import { getUser } from "@/api/users";
import { ReviewCard } from "@/components/marketplace/review-card";
import { ReviewForm } from "@/components/reviews/review-form";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { ReviewListSkeleton } from "@/components/states/loading-state";
import { Card, CardContent } from "@/components/ui/card";
import { queryKeys } from "@/lib/query-keys";
import { fullName, getErrorMessage } from "@/lib/utils";
import type { Application, Job, User } from "@/types/api";

interface JobReviewsSectionProps {
  job: Job;
  currentUser?: User | null;
  applications?: Application[];
  myAccepted: boolean;
}

export function JobReviewsSection({
  job,
  currentUser,
  applications = [],
  myAccepted,
}: JobReviewsSectionProps) {
  const queryClient = useQueryClient();
  const reviewsQuery = useQuery({
    queryKey: queryKeys.reviews,
    queryFn: listReviews,
  });
  const jobReviews = (reviewsQuery.data ?? []).filter((item) => item.job_id === job.id);
  const accepted = applications.find((item) => item.status === "ACCEPTED");
  const isOwner = currentUser?.id === job.owner_id;
  const toUserId = isOwner ? accepted?.worker_id : job.owner_id;
  const alreadyReviewed = jobReviews.some((item) => item.from_user_id === currentUser?.id);
  const canReview =
    job.status === "COMPLETED" &&
    Boolean(currentUser) &&
    Boolean(toUserId) &&
    currentUser!.id !== toUserId &&
    (isOwner ? Boolean(accepted) : myAccepted) &&
    !alreadyReviewed;

  const recipientQuery = useQuery({
    queryKey: queryKeys.user(toUserId ?? 0),
    queryFn: () => getUser(toUserId!),
    enabled: Boolean(canReview && toUserId),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (values: { rating: number; comment: string }) =>
      createReview({
        job_id: job.id,
        to_user_id: toUserId!,
        rating: values.rating,
        comment: values.comment,
      }),
    onSuccess: async () => {
      toast.success("Отзыв опубликован");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.reviews }),
        queryClient.invalidateQueries({ queryKey: queryKeys.userReviews(toUserId ?? 0) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.userReviews(job.owner_id) }),
      ]);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Card className="mt-4">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold">Отзывы по заказу</h2>
        {reviewsQuery.isLoading ? (
          <div className="mt-4">
            <ReviewListSkeleton count={2} />
          </div>
        ) : null}
        {reviewsQuery.isError ? (
          <div className="mt-4">
            <ErrorState error={reviewsQuery.error} onRetry={() => void reviewsQuery.refetch()} />
          </div>
        ) : null}
        {!reviewsQuery.isLoading && !reviewsQuery.isError && jobReviews.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="Отзывов по этому заказу нет"
              description="Оценку могут оставить заказчик и принятый исполнитель после статуса COMPLETED."
              className="border-dashed"
            />
          </div>
        ) : null}
        <div className="mt-4 grid gap-3">
          {jobReviews.map((review) => (
            <JobReviewRow
              key={review.id}
              fromUserId={review.from_user_id}
              toUserId={review.to_user_id}
              rating={review.rating}
              comment={review.comment}
              createdAt={review.created_at}
              jobId={review.job_id}
            />
          ))}
        </div>
        {canReview && toUserId ? (
          <div className="mt-6 rounded-xl border p-4">
            <p className="mb-3 text-sm text-muted-foreground">
              Отзыв для{" "}
              {recipientQuery.data
                ? fullName(recipientQuery.data)
                : `пользователя #${toUserId}`}
              . Оценка 1–5, как в ReviewCreate.
            </p>
            <ReviewForm
              isSubmitting={createMutation.isPending}
              onSubmit={async (values) => {
                await createMutation.mutateAsync(values);
              }}
            />
          </div>
        ) : null}
        {job.status === "COMPLETED" && alreadyReviewed ? (
          <p className="mt-4 text-sm text-muted-foreground">Вы уже оставили отзыв по этому заказу.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function JobReviewRow({
  fromUserId,
  toUserId,
  rating,
  comment,
  createdAt,
  jobId,
}: {
  fromUserId: number;
  toUserId: number;
  rating: number;
  comment: string;
  createdAt: string;
  jobId: number;
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

  return (
    <ReviewCard
      rating={rating}
      comment={comment}
      createdAt={createdAt}
      author={fromQuery.data ? fullName(fromQuery.data) : `Пользователь #${fromUserId}`}
      recipient={toQuery.data ? fullName(toQuery.data) : `Пользователь #${toUserId}`}
      jobId={jobId}
    />
  );
}
