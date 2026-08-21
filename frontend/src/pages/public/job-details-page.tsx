import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, MessageSquare, Star } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { createApplication, getMyApplications, acceptApplication, rejectApplication } from "@/api/applications";
import { listCategories } from "@/api/categories";
import { createConversation, listConversations } from "@/api/conversations";
import { cancelJob, completeJob, getJob, getJobApplications } from "@/api/jobs";
import { getUserReviews } from "@/api/reviews";
import { getUser } from "@/api/users";
import {
  ApplicationActions,
  ApplicationCard,
} from "@/components/applications/application-card";
import { CityMap } from "@/components/marketplace/city-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { JobReviewsSection } from "@/components/reviews/job-reviews-section";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { ApplicationListSkeleton, JobDetailsSkeleton } from "@/components/states/loading-state";
import { useAuth } from "@/context/auth-context";
import { localizedCategoryName } from "@/i18n/categories";
import { useI18n } from "@/i18n/locale-context";
import { applicationStatusKey, jobStatusKey } from "@/i18n/status";
import { formatRating } from "@/lib/marketplace";
import { queryKeys } from "@/lib/query-keys";
import { formatDate, formatMoney, fullName, getErrorMessage } from "@/lib/utils";
import type { Application, Job, JobStatus } from "@/types/api";

const statusVariant: Record<JobStatus, "success" | "warning" | "secondary" | "danger"> = {
  OPEN: "success",
  IN_PROGRESS: "warning",
  COMPLETED: "secondary",
  CANCELLED: "danger",
};

export function JobDetailsPage() {
  const { t } = useI18n();
  const { jobId } = useParams();
  const id = Number(jobId);
  const jobIdValid = Number.isFinite(id) && id > 0;
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const jobQuery = useQuery({
    queryKey: queryKeys.job(id),
    queryFn: () => getJob(id),
    enabled: jobIdValid,
  });
  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories,
    queryFn: listCategories,
  });
  const ownerQuery = useQuery({
    queryKey: queryKeys.user(jobQuery.data?.owner_id ?? 0),
    queryFn: () => getUser(jobQuery.data!.owner_id),
    enabled: Boolean(jobQuery.data),
  });
  const reviewsQuery = useQuery({
    queryKey: queryKeys.userReviews(jobQuery.data?.owner_id ?? 0),
    queryFn: () => getUserReviews(jobQuery.data!.owner_id),
    enabled: Boolean(jobQuery.data),
    retry: false,
  });
  const myApplicationsQuery = useQuery({
    queryKey: queryKeys.myApplications,
    queryFn: getMyApplications,
    enabled: user?.role === "worker",
  });
  const isOwner = Boolean(user && jobQuery.data && user.id === jobQuery.data.owner_id);
  const canSeeApplications = isOwner || user?.role === "admin";
  const applicationsQuery = useQuery({
    queryKey: queryKeys.jobApplications(id),
    queryFn: () => getJobApplications(id),
    enabled: jobIdValid && canSeeApplications,
    retry: false,
  });

  const applyMutation = useMutation({
    mutationFn: () => createApplication(id),
    onSuccess: async () => {
      toast.success(t("job.applied"));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.myApplications }),
        queryClient.invalidateQueries({ queryKey: queryKeys.applications }),
        queryClient.invalidateQueries({ queryKey: queryKeys.jobApplications(id) }),
      ]);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const acceptMutation = useMutation({
    mutationFn: acceptApplication,
    onSuccess: async () => {
      toast.success(t("app.accepted"));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.jobApplications(id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.applications }),
        queryClient.invalidateQueries({ queryKey: queryKeys.myApplications }),
        queryClient.invalidateQueries({ queryKey: queryKeys.job(id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.myJobs }),
        queryClient.invalidateQueries({ queryKey: ["jobs"] }),
      ]);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const rejectMutation = useMutation({
    mutationFn: rejectApplication,
    onSuccess: async () => {
      toast.success(t("app.rejected"));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.jobApplications(id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.applications }),
        queryClient.invalidateQueries({ queryKey: queryKeys.myApplications }),
      ]);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const completeMutation = useMutation({
    mutationFn: () => completeJob(id),
    onSuccess: async () => {
      toast.success(t("job.completedToast"));
      await queryClient.invalidateQueries({ queryKey: queryKeys.job(id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.myJobs });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const cancelMutation = useMutation({
    mutationFn: () => cancelJob(id),
    onSuccess: async () => {
      toast.success(t("job.cancelledToast"));
      await queryClient.invalidateQueries({ queryKey: queryKeys.job(id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.myJobs });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (!jobIdValid) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <ErrorState title={t("error.jobNotFound")} description={t("error.notFoundHint")} />
      </div>
    );
  }

  if (jobQuery.isLoading) {
    return <JobDetailsSkeleton />;
  }

  if (jobQuery.isError || !jobQuery.data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <ErrorState error={jobQuery.error} onRetry={() => void jobQuery.refetch()} />
      </div>
    );
  }

  const job = jobQuery.data;
  const category = categoriesQuery.data?.find((item) => item.id === job.category_id);
  const myApplication = myApplicationsQuery.data?.find((item) => item.job_id === job.id);
  const alreadyApplied = Boolean(myApplication);
  const reviews = reviewsQuery.data ?? [];
  const ownerRating =
    reviews.length > 0
      ? reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length
      : null;
  const canManageStatus = job.status !== "COMPLETED" && job.status !== "CANCELLED";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link to="/jobs" className="text-sm text-muted-foreground hover:text-foreground">
        ← {t("nav.jobs")}
      </Link>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {category
                ? localizedCategoryName(category, t)
                : t("common.categoryFallback", { id: job.category_id })}
            </Badge>
            <Badge variant={statusVariant[job.status]}>{t(jobStatusKey(job.status))}</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">{job.title}</h1>
          <p className="mt-3 flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {job.city}
            {job.address ? `, ${job.address}` : ""}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("job.publishedAt", { date: formatDate(job.created_at) })}
          </p>

          <Card className="mt-6">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold">{t("job.description")}</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {job.description}
              </p>
            </CardContent>
          </Card>

          {ownerQuery.data ? (
            <Card className="mt-4">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold">{t("job.owner")}</h2>
                <p className="mt-2 font-medium">
                  {ownerQuery.data.first_name} {ownerQuery.data.last_name}
                </p>
                <p className="text-sm text-muted-foreground">@{ownerQuery.data.username}</p>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {ownerRating != null ? (
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      {formatRating(ownerRating)}
                    </span>
                  ) : (
                    <span>{t("landing.noReviews")}</span>
                  )}
                  <span>{t("job.reviewsCount", { count: reviews.length })}</span>
                  {applicationsQuery.data ? (
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {t("job.applicationsCount", { count: applicationsQuery.data.length })}
                    </span>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {canSeeApplications ? (
            <Card className="mt-4">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">{t("job.applications")}</h2>
                  <Button asChild variant="link" className="h-auto p-0">
                    <Link to="/app/applications">{t("job.allApplications")}</Link>
                  </Button>
                </div>
                {applicationsQuery.isLoading ? <ApplicationListSkeleton rows={3} /> : null}
                {applicationsQuery.isError ? (
                  <div className="mt-4">
                    <ErrorState
                      error={applicationsQuery.error}
                      onRetry={() => void applicationsQuery.refetch()}
                    />
                  </div>
                ) : null}
                {!applicationsQuery.isLoading &&
                !applicationsQuery.isError &&
                (applicationsQuery.data?.length ?? 0) === 0 ? (
                  <div className="mt-4">
                    <EmptyState
                      icon="inbox"
                      title={t("job.noApplications")}
                      description={t("job.noApplicationsHint")}
                    />
                  </div>
                ) : null}
                <div className="mt-4 grid gap-3">
                  {(applicationsQuery.data ?? []).map((application) => (
                    <JobApplicationRow
                      key={application.id}
                      application={application}
                      job={job}
                      busy={acceptMutation.isPending || rejectMutation.isPending}
                      onAccept={() => acceptMutation.mutate(application.id)}
                      onReject={() => rejectMutation.mutate(application.id)}
                      onChat={async () => {
                        try {
                          const conversations = await listConversations();
                          const existing = conversations.find(
                            (item) =>
                              item.job_id === job.id &&
                              item.worker_id === application.worker_id,
                          );
                          if (existing) {
                            navigate(`/app/chat/${existing.id}`);
                            return;
                          }
                          const conversation = await createConversation(
                            job.id,
                            application.worker_id,
                          );
                          navigate(`/app/chat/${conversation.id}`);
                        } catch (error) {
                          toast.error(getErrorMessage(error));
                        }
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <JobReviewsSection
            job={job}
            currentUser={user}
            applications={applicationsQuery.data ?? []}
            myAccepted={myApplication?.status === "ACCEPTED"}
          />
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">{t("job.pay")}</p>
              <p className="mt-1 text-3xl font-bold text-primary">{formatMoney(job.salary)}</p>
              <div className="mt-6 flex flex-col gap-3">
                {user?.role === "worker" && job.status === "OPEN" && !isOwner ? (
                  <Button
                    disabled={
                      alreadyApplied ||
                      applyMutation.isPending ||
                      myApplicationsQuery.isLoading
                    }
                    onClick={() => applyMutation.mutate()}
                  >
                    {alreadyApplied ? t("job.alreadyApplied") : t("job.apply")}
                  </Button>
                ) : null}
                {myApplication ? (
                  <p className="text-sm text-muted-foreground">
                    {t("job.myApplication", { status: t(applicationStatusKey(myApplication.status)) })}
                  </p>
                ) : null}
                {!isAuthenticated ? (
                  <Button asChild>
                    <Link to="/login">{t("job.loginToApply")}</Link>
                  </Button>
                ) : null}
                {isOwner ? (
                  <Button variant="outline" onClick={() => navigate(`/app/jobs/${job.id}/edit`)}>
                    {t("common.edit")}
                  </Button>
                ) : null}
                {isOwner && canManageStatus ? (
                  <>
                    <Button
                      disabled={completeMutation.isPending}
                      onClick={() => completeMutation.mutate()}
                    >
                      {t("job.complete")}
                    </Button>
                    <Button
                      variant="outline"
                      disabled={cancelMutation.isPending}
                      onClick={() => cancelMutation.mutate()}
                    >
                      {t("job.cancel")}
                    </Button>
                  </>
                ) : null}
                <Button asChild variant="outline">
                  <Link to="/jobs">{t("job.otherJobs")}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <CityMap
            jobs={[job]}
            selectedJobId={job.id}
            showCards={false}
            className="min-h-[240px]"
          />
        </div>
      </div>
    </div>
  );
}

function JobApplicationRow({
  application,
  job,
  busy,
  onAccept,
  onReject,
  onChat,
}: {
  application: Application;
  job: Job;
  busy: boolean;
  onAccept: () => void;
  onReject: () => void;
  onChat: () => void;
}) {
  const { t } = useI18n();
  const workerQuery = useQuery({
    queryKey: queryKeys.user(application.worker_id),
    queryFn: () => getUser(application.worker_id),
    retry: false,
  });
  const workerName = workerQuery.data
    ? fullName(workerQuery.data)
    : t("common.userFallback", { id: application.worker_id });
  const isPending = application.status === "PENDING";
  const isAccepted = application.status === "ACCEPTED";

  return (
    <ApplicationCard
      application={application}
      job={job}
      workerName={workerName}
      actions={
        <ApplicationActions
          busy={busy}
          onAccept={isPending ? onAccept : undefined}
          onReject={isPending ? onReject : undefined}
          onChat={isAccepted ? onChat : undefined}
        />
      }
    />
  );
}
