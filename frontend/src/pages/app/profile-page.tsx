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
import { useI18n } from "@/i18n/locale-context";
import { roleKey } from "@/i18n/status";
import { queryKeys } from "@/lib/query-keys";
import { formatDateTime, fullName, getErrorMessage } from "@/lib/utils";

export function ProfilePage() {
  const { t } = useI18n();
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
      toast.success(t("profile.reviewDeleted"));
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
        <PageHeader title={t("profile.title")} description={t("profile.hint")} />
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
        <PageHeader title={t("profile.title")} description={t("profile.hint")} />
        <ErrorState error={meQuery.error} onRetry={() => void meQuery.refetch()} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={t("profile.title")} description={t("profile.hint")} />
      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <div className="grid gap-6 self-start">
          <UserCard user={user} />
          <Card>
            <CardContent className="p-5">
              <h2 className="text-lg font-semibold">{t("profile.photo")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("profile.photoHint")}</p>
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
              <h2 className="text-lg font-semibold">{t("profile.account")}</h2>
              <div>
                <p className="text-muted-foreground">{t("auth.email")}</p>
                <p className="mt-0.5 font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("auth.phone")}</p>
                <p className="mt-0.5 font-medium">{user.phone || t("common.notSpecified")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("auth.role")}</p>
                <p className="mt-0.5 font-medium">{t(roleKey(user.role))}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {user.is_verified ? (
                  <Badge variant="success">{t("common.confirmed")}</Badge>
                ) : (
                  <Badge variant="secondary">{t("common.unconfirmed")}</Badge>
                )}
                {user.is_active ? (
                  <Badge variant="secondary">{t("common.active")}</Badge>
                ) : (
                  <Badge variant="danger">{t("common.inactive")}</Badge>
                )}
                {user.is_online ? (
                  <Badge variant="success">{t("common.online")}</Badge>
                ) : (
                  <Badge variant="outline">{t("common.offline")}</Badge>
                )}
              </div>
              <div>
                <p className="text-muted-foreground">{t("profile.lastSeen")}</p>
                <p className="mt-0.5 font-medium">{formatDateTime(user.last_seen)}</p>
              </div>
              <Button asChild variant="outline" className="mt-2">
                <Link to="/app/settings">{t("profile.edit")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold">{t("profile.reviewsAbout")}</h2>
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
                    title={t("profile.noReviews")}
                    description={t("profile.noReviewsHint")}
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
              <h2 className="text-xl font-semibold">{t("profile.myReviews")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("profile.myReviewsHint")}
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
                <p className="mt-4 text-sm text-muted-foreground">{t("profile.noGiven")}</p>
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
  const { t } = useI18n();
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
      author={authorQuery.data ? fullName(authorQuery.data) : t("common.userFallback", { id: fromUserId })}
      recipient={
        toUserId
          ? recipientQuery.data
            ? fullName(recipientQuery.data)
            : t("common.userFallback", { id: toUserId })
          : undefined
      }
      jobId={jobId}
      jobTitle={jobQuery.data?.title}
      onDelete={onDelete}
      deleting={deleting}
    />
  );
}
