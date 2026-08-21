import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { listCategories } from "@/api/categories";
import { cancelJob, completeJob, deleteJob, getMyJobs } from "@/api/jobs";
import { JobCard, categoryMap } from "@/components/jobs/job-card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { JobListSkeleton } from "@/components/states/loading-state";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/lib/query-keys";
import { useI18n } from "@/i18n/locale-context";
import { getErrorMessage } from "@/lib/utils";

export function MyJobsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const jobsQuery = useQuery({ queryKey: queryKeys.myJobs, queryFn: getMyJobs });
  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories,
    queryFn: listCategories,
  });
  const names = categoryMap(categoriesQuery.data ?? [], t);

  const completeMutation = useMutation({
    mutationFn: completeJob,
    onSuccess: async () => {
      toast.success(t("job.completedToast"));
      await queryClient.invalidateQueries({ queryKey: queryKeys.myJobs });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const cancelMutation = useMutation({
    mutationFn: cancelJob,
    onSuccess: async () => {
      toast.success(t("job.cancelledToast"));
      await queryClient.invalidateQueries({ queryKey: queryKeys.myJobs });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteJob,
    onSuccess: async () => {
      toast.success(t("job.deletedToast"));
      await queryClient.invalidateQueries({ queryKey: queryKeys.myJobs });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <div>
      <PageHeader
        title={t("myJobs.title")}
        description={t("myJobs.hint")}
        action={
          <Button asChild>
            <Link to="/app/jobs/new">{t("nav.placeOrder")}</Link>
          </Button>
        }
      />
      {jobsQuery.isLoading ? <JobListSkeleton /> : null}
      {jobsQuery.isError ? (
        <ErrorState error={jobsQuery.error} onRetry={() => void jobsQuery.refetch()} />
      ) : null}
      {!jobsQuery.isLoading && !jobsQuery.isError && jobsQuery.data?.length === 0 ? (
        <EmptyState
          icon="jobs"
          title={t("myJobs.empty")}
          description={t("myJobs.emptyHint")}
          action={
            <Button asChild>
              <Link to="/app/jobs/new">{t("nav.placeOrder")}</Link>
            </Button>
          }
        />
      ) : null}
      <div className="grid gap-4">
        {jobsQuery.data?.map((job) => (
          <div key={job.id} className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-stretch">
            <JobCard
              job={job}
              categoryName={names[job.category_id]}
              href={`/app/jobs/${job.id}/edit`}
            />
            <div className="flex flex-wrap gap-2 lg:flex-col">
              <Button asChild variant="outline" size="sm">
                <Link to={`/jobs/${job.id}`}>{t("common.open")}</Link>
              </Button>
              {job.status !== "COMPLETED" && job.status !== "CANCELLED" ? (
                <Button size="sm" onClick={() => completeMutation.mutate(job.id)}>
                  {t("job.complete")}
                </Button>
              ) : null}
              {job.status !== "COMPLETED" && job.status !== "CANCELLED" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => cancelMutation.mutate(job.id)}
                >
                  {t("common.cancel")}
                </Button>
              ) : null}
              {job.status === "COMPLETED" ? (
                <Button asChild size="sm" variant="outline">
                  <Link to={`/jobs/${job.id}`}>{t("job.review")}</Link>
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteMutation.mutate(job.id)}
              >
                {t("common.delete")}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
