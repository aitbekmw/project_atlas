import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { listCategories } from "@/api/categories";
import { listJobs } from "@/api/jobs";
import { categoryMap } from "@/components/jobs/job-card";
import { CityMap } from "@/components/marketplace/city-map";
import { MarketplaceJobCard } from "@/components/marketplace/job-list-card";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { JobFeedSkeleton } from "@/components/states/loading-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryKeys } from "@/lib/query-keys";
import { useI18n } from "@/i18n/locale-context";
import { paymentMethodKey } from "@/i18n/status";
import { isPaymentMethod, PAYMENT_METHODS, type JobStatus } from "@/types/api";

const PAGE_SIZE = 10;

export function JobsPage({ embedded = false }: { embedded?: boolean }) {
  const { t } = useI18n();
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
  const names = categoryMap(categoriesQuery.data ?? [], t);
  const jobs = jobsQuery.data ?? [];
  const selected = jobs.find((job) => job.id === activeJobId) ?? jobs[0];
  const hasNextPage = jobs.length === PAGE_SIZE;
  const jobHref = (jobId: number) => (embedded ? `/app/jobs/${jobId}` : `/jobs/${jobId}`);

  return (
    <div className={embedded ? "" : "mx-auto max-w-6xl px-4 py-10"}>
      {!embedded ? (
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{t("jobs.title")}</h1>
          <p className="mt-2 text-muted-foreground">
            {t("jobs.subtitle")}
          </p>
        </div>
      ) : null}
      <div className="mb-6 grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
        <Input
          placeholder={t("jobs.search")}
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
        <Input
          placeholder={t("jobs.where")}
          value={cityInput}
          onChange={(event) => setCityInput(event.target.value)}
        />
        <select
          className="flex min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
          value={categoryId}
          onChange={(event) => patchParams({ category_id: event.target.value || null })}
        >
          <option value="">{t("category.all")}</option>
          {(categoriesQuery.data ?? []).map((category) => (
            <option key={category.id} value={category.id}>
              {names[category.id] ?? category.name}
            </option>
          ))}
        </select>
        <select
          className="flex min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
          value={paymentMethod}
          onChange={(event) => patchParams({ payment_method: event.target.value || null })}
        >
          <option value="">{t("jobs.allPayments")}</option>
          {PAYMENT_METHODS.map((method) => (
            <option key={method} value={method}>
              {t(paymentMethodKey(method))}
            </option>
          ))}
        </select>
        <Input
          type="number"
          min={0}
          placeholder={t("jobs.minPay")}
          value={minSalary}
          onChange={(event) => patchParams({ min_salary: event.target.value || null })}
        />
      </div>
      {when ? (
        <p className="mb-4 text-sm text-muted-foreground">
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
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <CityMap
              jobs={jobs}
              selectedJobId={selected?.id}
              onJobSelect={(job) => setActiveJobId(job.id)}
              jobHref={(job) => jobHref(job.id)}
              className="min-h-[360px] lg:sticky lg:top-24"
              showCards
            />
            <div className="grid gap-3">
              {jobs.map((job) => (
                <div key={job.id} onMouseEnter={() => setActiveJobId(job.id)}>
                  <MarketplaceJobCard
                    job={job}
                    categoryName={names[job.category_id]}
                    href={jobHref(job.id)}
                    layout="list"
                    active={selected?.id === job.id}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              disabled={page <= 1 || jobsQuery.isFetching}
              onClick={() => patchParams({ page: String(page - 1) }, false)}
            >
              {t("jobs.prev")}
            </Button>
            <p className="text-sm text-muted-foreground">{t("jobs.page", { page })}</p>
            <Button
              variant="outline"
              disabled={!hasNextPage || jobsQuery.isFetching}
              onClick={() => patchParams({ page: String(page + 1) }, false)}
            >
              {t("jobs.next")}
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
