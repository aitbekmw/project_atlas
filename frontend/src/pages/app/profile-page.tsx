import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { getJob } from "@/api/jobs";
import { deleteReview, getUserReviews, listReviews } from "@/api/reviews";
import { getMe, getUser } from "@/api/users";
import { PageHeader } from "@/components/layout/page-header";
import { ReviewCard } from "@/components/marketplace/review-card";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { ReviewListSkeleton } from "@/components/states/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AvatarEditor } from "@/components/users/avatar-editor";
import { UserCard } from "@/components/users/user-card";
import { useAuth } from "@/context/auth-context";
import { queryKeys } from "@/lib/query-keys";
import { formatDateTime, fullName, getErrorMessage } from "@/lib/utils";
import { ROLE_LABEL } from "@/types/api";

export function ProfilePage() {
  const { applyUser, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: getMe,
  });
  const user = meQuery.data;
  const receivedQuery = useQuery({
    queryKey: queryKeys.userReviews(user?.id ?? 0),
    queryFn: () => getUserReviews(user!.id),
    enabled: Boolean(user),
  });
  const givenQuery = useQuery({
    queryKey: queryKeys.reviews,
    queryFn: listReviews,
    enabled: Boolean(user),
  });
  const given = (givenQuery.data ?? []).filter((item) => item.from_user_id === user?.id);

  const deleteMutation = useMutation({
    mutationFn: deleteReview,
    onSuccess: async () => {
      toast.success("Отзыв удалён");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.reviews }),
        queryClient.invalidateQueries({ queryKey: queryKeys.userReviews(user?.id ?? 0) }),
      ]);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  async function onUserUpdated() {
    await refreshUser();
  }

  if (meQuery.isLoading) {
    return (
      <div>
        <PageHeader title="Профиль" description="Публичные данные аккаунта и отзывы" />
        <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (meQuery.isError || !user) {
    return (
      <div>
        <PageHeader title="Профиль" description="Публичные данные аккаунта и отзывы" />
        <ErrorState error={meQuery.error} onRetry={() => void meQuery.refetch()} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Профиль" description="Публичные данные аккаунта и отзывы" />
      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <div className="grid gap-6 self-start">
          <UserCard user={user} />
          <Card>
            <CardContent className="p-5">
              <h2 className="text-lg font-semibold">Фото профиля</h2>
              <p className="mt-1 text-sm text-muted-foreground">POST и DELETE /users/me/avatar</p>
              <div className="mt-4">
                <AvatarEditor
                  user={user}
                  onUpdated={async (updated) => {
                    applyUser(updated);
                    await onUserUpdated();
                  }}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="grid gap-3 p-5 text-sm">
              <h2 className="text-lg font-semibold">Данные аккаунта</h2>
              <p className="text-muted-foreground">GET /users/me</p>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="mt-0.5 font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Телефон</p>
                <p className="mt-0.5 font-medium">{user.phone || "Не указан"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Роль</p>
                <p className="mt-0.5 font-medium">{ROLE_LABEL[user.role]}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {user.is_verified ? (
                  <Badge variant="success">подтверждён</Badge>
                ) : (
                  <Badge variant="secondary">не подтверждён</Badge>
                )}
                {user.is_active ? (
                  <Badge variant="secondary">активен</Badge>
                ) : (
                  <Badge variant="danger">неактивен</Badge>
                )}
                {user.is_online ? (
                  <Badge variant="success">онлайн</Badge>
                ) : (
                  <Badge variant="outline">офлайн</Badge>
                )}
              </div>
              <div>
                <p className="text-muted-foreground">Был в сети</p>
                <p className="mt-0.5 font-medium">{formatDateTime(user.last_seen)}</p>
              </div>
              <Button asChild variant="outline" className="mt-2">
                <Link to="/app/settings">Редактировать профиль</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold">Отзывы обо мне</h2>
              <p className="mt-1 text-sm text-muted-foreground">GET /reviews/user/{user.id}</p>
              {receivedQuery.isLoading ? (
                <div className="mt-4">
                  <ReviewListSkeleton count={2} />
                </div>
              ) : null}
              {receivedQuery.isError ? (
                <div className="mt-4">
                  <ErrorState
                    error={receivedQuery.error}
                    onRetry={() => void receivedQuery.refetch()}
                  />
                </div>
              ) : null}
              {!receivedQuery.isLoading &&
              !receivedQuery.isError &&
              (receivedQuery.data?.length ?? 0) === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    title="Отзывов пока нет"
                    description="Оценки появятся, когда по вам оставят отзыв после завершённого заказа."
                    className="border-dashed"
                  />
                </div>
              ) : null}
              <div className="mt-4 grid gap-3">
                {(receivedQuery.data ?? []).map((review) => (
                  <ProfileReviewRow
                    key={review.id}
                    reviewId={review.id}
                    rating={review.rating}
                    comment={review.comment}
                    createdAt={review.created_at}
                    fromUserId={review.from_user_id}
                    jobId={review.job_id}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold">Мои отзывы</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Удалить можно только свой отзыв (DELETE /reviews/{"{id}"}).
              </p>
              {givenQuery.isLoading ? (
                <div className="mt-4">
                  <ReviewListSkeleton count={2} />
                </div>
              ) : null}
              {givenQuery.isError ? (
                <div className="mt-4">
                  <ErrorState error={givenQuery.error} onRetry={() => void givenQuery.refetch()} />
                </div>
              ) : null}
              {!givenQuery.isLoading && !givenQuery.isError && given.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">Вы ещё не оставляли отзывы.</p>
              ) : null}
              <div className="mt-4 grid gap-3">
                {given.map((review) => (
                  <ProfileReviewRow
                    key={review.id}
                    reviewId={review.id}
                    rating={review.rating}
                    comment={review.comment}
                    createdAt={review.created_at}
                    fromUserId={review.from_user_id}
                    toUserId={review.to_user_id}
                    jobId={review.job_id}
                    onDelete={() => deleteMutation.mutate(review.id)}
                    deleting={deleteMutation.isPending}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ProfileReviewRow({
  rating,
  comment,
  createdAt,
  fromUserId,
  toUserId,
  jobId,
  onDelete,
  deleting,
}: {
  reviewId: number;
  rating: number;
  comment: string;
  createdAt: string;
  fromUserId: number;
  toUserId?: number;
  jobId: number;
  onDelete?: () => void;
  deleting?: boolean;
}) {
  const authorQuery = useQuery({
    queryKey: queryKeys.user(fromUserId),
    queryFn: () => getUser(fromUserId),
    retry: false,
  });
  const recipientQuery = useQuery({
    queryKey: queryKeys.user(toUserId ?? 0),
    queryFn: () => getUser(toUserId!),
    enabled: Boolean(toUserId),
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
      author={authorQuery.data ? fullName(authorQuery.data) : `Пользователь #${fromUserId}`}
      recipient={
        toUserId
          ? recipientQuery.data
            ? fullName(recipientQuery.data)
            : `Пользователь #${toUserId}`
          : undefined
      }
      jobId={jobId}
      jobTitle={jobQuery.data?.title}
      onDelete={onDelete}
      deleting={deleting}
    />
  );
}
