import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { listCategories } from "@/api/categories";
import { listJobs } from "@/api/jobs";
import { listReviews } from "@/api/reviews";
import { categoryMap } from "@/components/jobs/job-card";
import { JobsMapPanel, MarketplaceSplit } from "@/components/marketplace/jobs-map-panel";
import { MarketplaceJobCard } from "@/components/marketplace/job-list-card";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { JobFeedSkeleton } from "@/components/states/loading-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePageTitle } from "@/hooks/use-page-title";
import { useUsersMap } from "@/hooks/use-users-map";
import { useI18n } from "@/i18n/locale-context";
import { paymentMethodKey } from "@/i18n/status";
import { averageRatingByUser } from "@/lib/marketplace";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { isPaymentMethod, PAYMENT_METHODS, type JobStatus } from "@/types/api";

const PAGE_SIZE = 10;

export function JobsPage({ embedded = false }: { embedded?: boolean }) {
  const { t } = useI18n();
  usePageTitle(t("seo.jobs"));
  const [searchParams, setSearchParams] = useSearchParams();
  const searchFromUrl = searchParams.get("search") ?? "";
  const cityFromUrl = searchParams.get("city") ?? "";
  const categoryId = searchParams.get("category_id") ?? "";
  const minSalary = searchParams.get("min_salary") ?? "";
  const paymentFromUrl = searchParams.get("payment_method") ?? "";
  const paymentMethod = isPaymentMethod(paymentFromUrl) ? paymentFromUrl : "";
  const when = searchParams.get("when") ?? "";
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);

  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const [cityInput, setCityInput] = useState(cityFromUrl);
  const [activeJobId, setActiveJobId] = useState<number | null>(null);

  useEffect(() => {
    setSearchInput(searchFromUrl);
  }, [searchFromUrl]);

  useEffect(() => {
    setCityInput(cityFromUrl);
  }, [cityFromUrl]);

  const patchParams = useCallback(
    (patch: Record<string, string | null>, resetPage = true) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            if (value) {
              next.set(key, value);
            } else {
              next.delete(key);
            }
          }
          if (resetPage && !("page" in patch)) {
            next.delete("page");
          }
          if (next.get("page") === "1") {
            next.delete("page");
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextSearch = searchInput.trim();
      const nextCity = cityInput.trim();
      if (nextSearch === searchFromUrl && nextCity === cityFromUrl) {
        return;
      }
      patchParams({
        search: nextSearch || null,
        city: nextCity || null,
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [searchInput, cityInput, searchFromUrl, cityFromUrl, patchParams]);

  const categoryIdNumber = Number(categoryId);
  const minSalaryNumber = Number(minSalary);
  const filters = useMemo(
    () => ({
      page,
      size: PAGE_SIZE,
      search: searchFromUrl || undefined,
      city: cityFromUrl || undefined,
      category_id: Number.isFinite(categoryIdNumber) && categoryId ? categoryIdNumber : undefined,
      min_salary: Number.isFinite(minSalaryNumber) && minSalary ? minSalaryNumber : undefined,
      payment_method: paymentMethod || undefined,
      status: "OPEN" as JobStatus,
    }),
    [page, searchFromUrl, cityFromUrl, categoryId, categoryIdNumber, minSalary, minSalaryNumber, paymentMethod],
  );

  const jobsQuery = useQuery({
    queryKey: queryKeys.jobs(filters),
    queryFn: () => listJobs(filters),
    placeholderData: keepPreviousData,
  });
  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories,
    queryFn: listCategories,
  });
  const reviewsQuery = useQuery({
    queryKey: queryKeys.reviews,
    queryFn: listReviews,
    retry: false,
  });
  const names = categoryMap(categoriesQuery.data ?? [], t);
  const jobs = jobsQuery.data ?? [];
  const ownersQuery = useUsersMap(jobs.map((job) => job.owner_id));
  const ownerRatings = useMemo(
    () => averageRatingByUser(reviewsQuery.data ?? []),
    [reviewsQuery.data],
  );
  const selected = jobs.find((job) => job.id === activeJobId) ?? jobs[0];
  const hasNextPage = jobs.length === PAGE_SIZE;
  const jobHref = (jobId: number) => (embedded ? `/app/jobs/${jobId}` : `/jobs/${jobId}`);

  return (
    <div className={embedded ? "min-w-0" : "atlas-page"}>
      {!embedded ? (
        <div className="mb-4 shrink-0 sm:mb-5">
          <h1 className="atlas-page-title">{t("jobs.title")}</h1>
          <p className="atlas-page-lead">{t("jobs.subtitle")}</p>
        </div>
      ) : null}
      <MarketplaceSplit
        fillViewport={!embedded}
        list={
          <>
            <div className="mb-3 grid min-w-0 gap-2 rounded-2xl border bg-card p-3 sm:grid-cols-2">
              <Input
                className="min-w-0 sm:col-span-2"
                placeholder={t("jobs.search")}
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                aria-label={t("jobs.search")}
              />
              <Input
                className="min-w-0"
                placeholder={t("jobs.where")}
                value={cityInput}
                onChange={(event) => setCityInput(event.target.value)}
                aria-label={t("jobs.where")}
              />
              <Select
                value={paymentMethod || "all"}
                onValueChange={(value) => patchParams({ payment_method: value === "all" ? null : value })}
              >
                <SelectTrigger className="min-h-11 min-w-0" aria-label={t("job.payment")}>
                  <SelectValue placeholder={t("jobs.allPayments")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("jobs.allPayments")}</SelectItem>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {t(paymentMethodKey(method))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                className="min-h-11 min-w-0 sm:col-span-2"
                type="number"
                min={0}
                placeholder={t("jobs.minPay")}
                value={minSalary}
                onChange={(event) => patchParams({ min_salary: event.target.value || null })}
                aria-label={t("jobs.minPay")}
              />
            </div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => patchParams({ category_id: null })}
                className={cn(
                  "inline-flex min-h-9 items-center rounded-full border px-3 text-xs font-medium",
                  !categoryId
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {t("landing.chipAll")}
              </button>
              {(categoriesQuery.data ?? []).map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => patchParams({ category_id: String(category.id) })}
                  className={cn(
                    "inline-flex min-h-9 items-center rounded-full border px-3 text-xs font-medium",
                    categoryId === String(category.id)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {names[category.id] ?? category.name}
                </button>
              ))}
            </div>
            {when ? (
              <p className="mb-3 text-sm text-muted-foreground">
                {t("jobs.whenHint", { when })}
              </p>
            ) : null}
            {jobsQuery.isLoading ? <JobFeedSkeleton /> : null}
            {jobsQuery.isError ? (
              <ErrorState error={jobsQuery.error} onRetry={() => void jobsQuery.refetch()} />
            ) : null}
            {!jobsQuery.isLoading && !jobsQuery.isError && jobs.length === 0 ? (
              <EmptyState
                icon="search"
                title={t("jobs.empty")}
                description={t("jobs.emptyHint")}
                action={
                  <Button asChild>
                    <Link to="/app/jobs/new">{t("nav.placeOrder")}</Link>
                  </Button>
                }
              />
            ) : null}
            {!jobsQuery.isError && jobs.length > 0 ? (
              <>
                <div className="mb-3">
                  <p className="text-sm text-muted-foreground">{t("jobs.jobsCount", { count: jobs.length })}</p>
                </div>
                <div className="grid gap-2">
                  {jobs.map((job) => (
                    <div key={job.id} onMouseEnter={() => setActiveJobId(job.id)}>
                      <MarketplaceJobCard
                        job={job}
                        categoryName={names[job.category_id]}
                        href={jobHref(job.id)}
                        layout="list"
                        active={selected?.id === job.id}
                        distanceKm={job.distance_km}
                        customer={ownersQuery.data?.[job.owner_id]}
                        customerRating={ownerRatings[job.owner_id]}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    className="min-h-11"
                    disabled={page <= 1 || jobsQuery.isFetching}
                    onClick={() => patchParams({ page: String(page - 1) }, false)}
                  >
                    {t("jobs.prev")}
                  </Button>
                  <p className="text-sm text-muted-foreground">{t("jobs.page", { page })}</p>
                  <Button
                    variant="outline"
                    className="min-h-11"
                    disabled={!hasNextPage || jobsQuery.isFetching}
                    onClick={() => patchParams({ page: String(page + 1) }, false)}
                  >
                    {t("jobs.next")}
                  </Button>
                </div>
              </>
            ) : null}
          </>
        }
        map={
          <JobsMapPanel
            jobs={jobs}
            selectedJobId={selected?.id}
            onJobSelect={(job) => setActiveJobId(job.id)}
            jobHref={(job) => jobHref(job.id)}
            categoryNames={names}
            showCards={false}
            showOverlay={false}
            showFooter={false}
            compact
          />
        }
      />
    </div>
  );
}
