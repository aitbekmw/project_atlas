import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { listCategories } from "@/api/categories";
import { listJobs } from "@/api/jobs";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { JobListSkeleton } from "@/components/states/loading-state";
import { Button } from "@/components/ui/button";
import { localizedCategoryDescription, localizedCategoryName } from "@/i18n/categories";
import { useI18n } from "@/i18n/locale-context";
import { iconForCategory } from "@/lib/category-icons";
import { queryKeys } from "@/lib/query-keys";
import type { Category, Job } from "@/types/api";

function countFor(category: Category, jobs: Job[]): number {
  return jobs.filter((job) => job.category_id === category.id).length;
}

export function CategoriesPage() {
  const { t } = useI18n();
  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories,
    queryFn: listCategories,
  });
  const jobsQuery = useQuery({
    queryKey: queryKeys.jobs({ size: 50, status: "OPEN" }),
    queryFn: () => listJobs({ size: 50, status: "OPEN" }),
  });

  const categories = (categoriesQuery.data ?? []).filter((item) => item.is_active);
  const jobs = jobsQuery.data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("categories.title")}</h1>
          <p className="mt-2 text-muted-foreground">
            {t("categories.hint")}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/jobs">{t("nav.jobs")}</Link>
        </Button>
      </div>
      {categoriesQuery.isLoading ? <JobListSkeleton /> : null}
      {categoriesQuery.isError ? (
        <ErrorState
          error={categoriesQuery.error}
          onRetry={() => void categoriesQuery.refetch()}
        />
      ) : null}
      {!categoriesQuery.isLoading && !categoriesQuery.isError && categories.length === 0 ? (
        <EmptyState
          icon="search"
          title={t("categories.empty")}
          description={t("categories.emptyHint")}
        />
      ) : null}
      {!categoriesQuery.isError && categories.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => {
            const Icon = iconForCategory(category);
            const categoryDescription = localizedCategoryDescription(category, t);
            return (
              <Link
                key={category.id}
                to={`/jobs?category_id=${category.id}`}
                className="rounded-2xl border bg-card p-5 transition-colors duration-200 hover:border-primary/30 hover:bg-card-hover"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-4 font-semibold">{localizedCategoryName(category, t)}</p>
                {categoryDescription ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {categoryDescription}
                  </p>
                ) : null}
                <p className="mt-3 text-xs text-muted-foreground">
                  {t("jobs.jobsCount", { count: countFor(category, jobs) })}
                </p>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
