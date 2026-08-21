import { useQuery } from "@tanstack/react-query";

import { listCategories } from "@/api/categories";
import { listJobs } from "@/api/jobs";
import { JobCard, categoryMap } from "@/components/jobs/job-card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { JobListSkeleton } from "@/components/states/loading-state";
import { useI18n } from "@/i18n/locale-context";
import { queryKeys } from "@/lib/query-keys";

export function AdminJobsPage() {
  const { t } = useI18n();
  const jobsQuery = useQuery({
    queryKey: queryKeys.jobs({ size: 50 }),
    queryFn: () => listJobs({ size: 50 }),
  });
  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories,
    queryFn: listCategories,
  });
  const names = categoryMap(categoriesQuery.data ?? [], t);

  return (
    <div>
      <PageHeader title={t("admin.jobsTitle")} description={t("admin.jobsHint")} />
      {jobsQuery.isLoading ? <JobListSkeleton /> : null}
      {jobsQuery.isError ? (
        <ErrorState error={jobsQuery.error} onRetry={() => void jobsQuery.refetch()} />
      ) : null}
      {!jobsQuery.isLoading && !jobsQuery.isError && jobsQuery.data?.length === 0 ? (
        <EmptyState title={t("admin.jobsEmpty")} description={t("admin.jobsEmptyHint")} />
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {jobsQuery.data?.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            categoryName={names[job.category_id]}
            href={`/jobs/${job.id}`}
          />
        ))}
      </div>
    </div>
  );
}
