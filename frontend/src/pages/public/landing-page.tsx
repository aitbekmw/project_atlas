import { useQuery } from "@tanstack/react-query";
import {
  ClipboardList,
  FolderTree,
  Headphones,
  Inbox,
  MapPin,
  MessageSquare,
  Search,
  ShieldCheck,
  Star,
  UserPlus,
  UserRoundCheck,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { listCategories } from "@/api/categories";
import { listJobs, listNearbyJobs } from "@/api/jobs";
import { listReviews } from "@/api/reviews";
import { getUser } from "@/api/users";
import { categoryMap } from "@/components/jobs/job-card";
import { CityMap } from "@/components/marketplace/city-map";
import { MarketplaceJobCard } from "@/components/marketplace/job-list-card";
import { ReviewCard } from "@/components/marketplace/review-card";
import { WorkerCard, featuredWorkersFromReviews } from "@/components/marketplace/worker-card";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { JobListSkeleton, ReviewListSkeleton } from "@/components/states/loading-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { useGeolocation } from "@/hooks/use-geolocation";
import { localizedCategoryDescription, localizedCategoryName } from "@/i18n/categories";
import { useI18n } from "@/i18n/locale-context";
import { iconForCategory } from "@/lib/category-icons";
import { formatRating } from "@/lib/marketplace";
import { queryKeys } from "@/lib/query-keys";
import { fullName } from "@/lib/utils";
import type { Job } from "@/types/api";

export function LandingPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [need, setNeed] = useState("");
  const [where, setWhere] = useState("");
  const [when, setWhen] = useState("");
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const geo = useGeolocation();

  const jobsQuery = useQuery({
    queryKey: queryKeys.jobs({ size: 30, status: "OPEN" }),
    queryFn: () => listJobs({ size: 30, status: "OPEN" }),
  });
  const nearbyQuery = useQuery({
    queryKey: queryKeys.nearbyJobs(geo.coords?.[1] ?? 0, geo.coords?.[0] ?? 0, 12),
    queryFn: () =>
      listNearbyJobs({
        lat: geo.coords![1],
        lng: geo.coords![0],
        radius_km: 12,
        size: 30,
      }),
    enabled: geo.status === "granted" && geo.coords != null,
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

  const apiCategories = (categoriesQuery.data ?? []).filter((item) => item.is_active);
  const categories = apiCategories;
  const names = categoryMap(apiCategories, t);
  const jobs: Job[] = jobsQuery.data ?? [];
  const nearbyJobs = nearbyQuery.data ?? [];
  const mapJobs = nearbyJobs.length > 0 ? nearbyJobs : jobs.slice(0, 12);
  const nearby = (nearbyJobs.length > 0 ? nearbyJobs : jobs).slice(0, 6);
  const popular = jobs.slice(0, 6);
  const selected = mapJobs.find((job) => job.id === activeJobId) ?? mapJobs[0];

  const chips = useMemo(
    () => categories.slice(0, 5).map((item) => localizedCategoryName(item, t)),
    [categories, t],
  );

  const apiReviews = reviewsQuery.data ?? [];
  const reviewUserIds = Array.from(
    new Set(apiReviews.flatMap((item) => [item.from_user_id, item.to_user_id])),
  );
  const reviewUsersQuery = useQuery({
    queryKey: [...queryKeys.reviews, "landing-users", reviewUserIds],
    queryFn: async () => {
      const users: Record<number, Awaited<ReturnType<typeof getUser>>> = {};
      await Promise.all(
        reviewUserIds.map(async (id) => {
          try {
            users[id] = await getUser(id);
          } catch {
            /* GET /users/{id} may 404 for deleted accounts */
          }
        }),
      );
      return users;
    },
    enabled: reviewUserIds.length > 0,
    retry: false,
  });
  const reviewAuthors = Object.fromEntries(
    Object.entries(reviewUsersQuery.data ?? {}).map(([id, user]) => [Number(id), fullName(user)]),
  );
  const previewReviews = apiReviews.slice(0, 3);
  const featuredWorkers = featuredWorkersFromReviews(apiReviews, reviewUsersQuery.data ?? {});
  const averageRating =
    apiReviews.length > 0
      ? apiReviews.reduce((sum, item) => sum + item.rating, 0) / apiReviews.length
      : null;
  const openJobsCount = jobsQuery.isSuccess ? jobs.length : null;

  const createOrderTo =
    isAuthenticated && (user?.role === "customer" || user?.role === "admin")
      ? "/app/jobs/new"
      : "/register";
  const becomeWorkerTo = isAuthenticated ? "/app/dashboard" : "/register";
  const jobHref = (job: Job) => `/jobs/${job.id}`;

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (need.trim()) {
      params.set("search", need.trim());
    }
    if (where.trim()) {
      params.set("city", where.trim());
    }
    if (when.trim()) {
      params.set("when", when.trim());
    }
    const query = params.toString();
    navigate(query ? `/jobs?${query}` : "/jobs");
  }

  return (
    <div className="overflow-x-hidden">
      <section className="relative border-b bg-surface">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgb(22_119_255_/_0.12),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top_left,rgb(22_119_255_/_0.18),transparent_50%)]" />
        <div className="relative mx-auto grid max-w-6xl items-stretch gap-5 px-4 py-6 sm:gap-6 sm:py-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:grid-rows-[auto_auto_1fr] lg:gap-x-10 lg:gap-y-6 lg:py-16">
          <div className="order-1 min-w-0 lg:col-start-1 lg:row-start-1">
            <p className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              {t("landing.location")}
            </p>
            <h1 className="mt-4 max-w-xl text-[2rem] font-extrabold leading-tight tracking-tight text-balance sm:mt-5 sm:text-4xl lg:text-5xl">
              {t("landing.heroTitle")}
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("landing.heroText")}
            </p>
          </div>

            <form
              onSubmit={onSearch}
              className="order-2 grid min-w-0 gap-3 rounded-2xl border bg-card p-3 soft-shadow-lg sm:p-4 lg:col-start-1 lg:row-start-2 lg:grid-cols-[1.3fr_0.85fr_0.75fr_auto]"
            >
              <label className="grid min-w-0 gap-1">
                <span className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("landing.searchNeed")}
                </span>
                <Input
                  value={need}
                  onChange={(event) => setNeed(event.target.value)}
                  placeholder={t("landing.searchNeed")}
                  className="h-12 min-h-12 border-0 bg-surface shadow-none focus-visible:ring-1"
                  aria-label={t("landing.searchNeed")}
                />
              </label>
              <label className="grid min-w-0 gap-1">
                <span className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("landing.searchWhere")}
                </span>
                <Input
                  value={where}
                  onChange={(event) => setWhere(event.target.value)}
                  placeholder={t("landing.searchWhere")}
                  className="h-12 min-h-12 border-0 bg-surface shadow-none focus-visible:ring-1"
                  aria-label={t("landing.searchWhere")}
                />
              </label>
              <label className="grid min-w-0 gap-1">
                <span className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("landing.searchWhen")}
                </span>
                <Input
                  value={when}
                  onChange={(event) => setWhen(event.target.value)}
                  placeholder={t("landing.searchWhen")}
                  className="h-12 min-h-12 border-0 bg-surface shadow-none focus-visible:ring-1"
                  aria-label={t("landing.searchWhen")}
                />
              </label>
              <Button type="submit" size="lg" className="h-12 min-h-12 w-full lg:mt-5 lg:w-auto">
                <Search className="h-4 w-4" />
                {t("landing.searchCta")}
              </Button>
            </form>

          <div className="order-3 min-w-0 lg:col-start-1 lg:row-start-3">
            <div className="flex flex-wrap gap-2">
              {chips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    setNeed(chip);
                    navigate(`/jobs?search=${encodeURIComponent(chip)}`);
                  }}
                  className="rounded-full border bg-card px-3 py-2 text-sm text-muted-foreground transition-colors duration-200 hover:border-primary/40 hover:text-foreground"
                >
                  {chip}
                </button>
              ))}
            </div>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {[
                { icon: FolderTree, key: "landing.trustCategories" as const },
                { icon: Search, key: "landing.trustSearch" as const },
                { icon: MessageSquare, key: "landing.trustChat" as const },
                { icon: MapPin, key: "landing.trustCity" as const },
              ].map((item) => (
                <li
                  key={item.key}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <item.icon className="h-4 w-4 shrink-0 text-primary" />
                  {t(item.key)}
                </li>
              ))}
            </ul>
          </div>

          <CityMap
            jobs={mapJobs}
            selectedJobId={selected?.id}
            onJobSelect={(job) => setActiveJobId(job.id)}
            categoryNames={names}
            userLocation={geo.coords}
            showOverlay
            showFooter
            showCards={false}
            className="order-4 h-[240px] min-h-[240px] w-full max-w-full sm:h-[280px] lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:h-auto lg:min-h-[520px]"
          />
        </div>
      </section>

      <section id="categories" className="atlas-section mx-auto max-w-6xl scroll-mt-24 px-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{t("landing.categories")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("landing.categoriesHint")}
            </p>
          </div>
          <Button asChild variant="link" className="shrink-0">
            <Link to="/categories">{t("landing.allCategories")}</Link>
          </Button>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categoriesQuery.isLoading
            ? Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="rounded-2xl border bg-card p-4">
                  <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
                  <div className="mt-3 h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="mt-2 h-3 w-16 animate-pulse rounded bg-muted" />
                </div>
              ))
            : null}
          {categoriesQuery.isError ? (
            <div className="col-span-full">
              <ErrorState
                title={t("category.error")}
                error={categoriesQuery.error}
                onRetry={() => void categoriesQuery.refetch()}
              />
            </div>
          ) : null}
          {!categoriesQuery.isLoading && !categoriesQuery.isError && categories.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                icon="search"
                title={t("landing.noCategories")}
                description={t("landing.noCategoriesHint")}
              />
            </div>
          ) : null}
          {categories.map((category) => {
            const Icon = iconForCategory(category);
            const categoryName = localizedCategoryName(category, t);
            const categoryDescription = localizedCategoryDescription(category, t);
            return (
              <Link
                key={category.id}
                to={`/jobs?category_id=${category.id}`}
                className="rounded-2xl border bg-card p-4 transition-colors duration-200 hover:border-primary/30 hover:bg-card-hover"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-semibold leading-snug">{categoryName}</p>
                {categoryDescription ? (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {categoryDescription}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">{t("landing.viewCategoryJobs")}</p>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-surface">
        <div className="atlas-section mx-auto max-w-6xl px-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{t("landing.nearbyTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("landing.nearbyHint")}
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/jobs">{t("landing.allJobs")}</Link>
            </Button>
          </div>
          {geo.status !== "granted" ? (
            <div className="mt-5 flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {geo.status === "denied"
                  ? t("landing.locationDenied")
                  : geo.status === "unavailable"
                    ? t("landing.locationUnavailable")
                    : t("landing.locationPrompt")}
              </p>
              <Button
                type="button"
                className="min-h-11 shrink-0"
                disabled={geo.status === "pending"}
                onClick={() => geo.request()}
              >
                {geo.status === "pending" ? t("landing.locating") : t("landing.showNearby")}
              </Button>
            </div>
          ) : null}
          {jobsQuery.isLoading || nearbyQuery.isLoading ? <JobListSkeleton /> : null}
          {jobsQuery.isError ? (
            <ErrorState
              error={jobsQuery.error}
              onRetry={() => void jobsQuery.refetch()}
            />
          ) : null}
          {!jobsQuery.isLoading && !jobsQuery.isError && nearby.length === 0 ? (
            <EmptyState
              icon="jobs"
              title={t("landing.nearbyEmpty")}
              description={t("landing.nearbyEmptyHint")}
              action={
                <Button asChild>
                  <Link to="/app/jobs/new">{t("nav.placeOrder")}</Link>
                </Button>
              }
            />
          ) : null}
          {!jobsQuery.isError && nearby.length > 0 ? (
            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.05fr]">
              <CityMap
                jobs={nearby}
                selectedJobId={selected?.id}
                onJobSelect={(job) => setActiveJobId(job.id)}
                categoryNames={names}
                userLocation={geo.coords}
                showOverlay
                showFooter={false}
                showCards
                className="h-[200px] min-h-[200px] w-full max-w-full sm:h-[260px] lg:h-auto lg:min-h-[420px]"
              />
              <div className="grid gap-3">
                {nearby.map((job) => (
                  <div key={job.id} onMouseEnter={() => setActiveJobId(job.id)}>
                    <MarketplaceJobCard
                      job={job}
                      categoryName={names[job.category_id]}
                      href={jobHref(job)}
                      layout="list"
                      active={selected?.id === job.id}
                      distanceKm={job.distance_km}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="atlas-section mx-auto max-w-6xl px-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{t("landing.popularTitle")}</h2>
          <Button asChild variant="link">
            <Link to="/jobs">{t("landing.viewAll")}</Link>
          </Button>
        </div>
        {jobsQuery.isLoading ? <JobListSkeleton /> : null}
        {!jobsQuery.isLoading && !jobsQuery.isError && popular.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon="jobs"
            title={t("landing.popularEmpty")}
            description={t("landing.popularEmptyHint")}
          />
        ) : null}
        {popular.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((job) => (
              <MarketplaceJobCard
                key={job.id}
                job={job}
                categoryName={names[job.category_id]}
                href={jobHref(job)}
                layout="tile"
              />
            ))}
          </div>
        ) : null}
      </section>

      <section className="border-y bg-card">
        <div className="atlas-section mx-auto max-w-6xl px-4">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{t("landing.topWorkers")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("landing.topWorkersHint")}
          </p>
          {reviewsQuery.isLoading ? (
            <div className="mt-6">
              <ReviewListSkeleton count={4} />
            </div>
          ) : null}
          {reviewsQuery.isError ? (
            <div className="mt-6">
              <ErrorState
                error={reviewsQuery.error}
                onRetry={() => void reviewsQuery.refetch()}
              />
            </div>
          ) : null}
          {!reviewsQuery.isLoading && !reviewsQuery.isError && featuredWorkers.length === 0 ? (
            <EmptyState
              className="mt-6"
              icon="inbox"
              title={t("landing.topWorkersEmpty")}
              description={t("landing.topWorkersEmptyHint")}
            />
          ) : null}
          {featuredWorkers.length > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredWorkers.map((worker) => (
                <WorkerCard key={worker.id} worker={worker} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section id="how-it-works" className="atlas-section mx-auto max-w-6xl scroll-mt-24 px-4">
        <div className="max-w-2xl">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{t("landing.howTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("landing.howHint")}
          </p>
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-primary">{t("landing.forCustomer")}</p>
            <div className="mt-4 grid gap-3">
              {[
                {
                  icon: ClipboardList,
                  title: t("landing.howC1Title"),
                  text: t("landing.howC1Text"),
                },
                {
                  icon: Inbox,
                  title: t("landing.howC2Title"),
                  text: t("landing.howC2Text"),
                },
                {
                  icon: UserRoundCheck,
                  title: t("landing.howC3Title"),
                  text: t("landing.howC3Text"),
                },
                {
                  icon: Star,
                  title: t("landing.howC4Title"),
                  text: t("landing.howC4Text"),
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-3 rounded-2xl border bg-card p-4 sm:gap-4 sm:p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">{t("landing.forWorker")}</p>
            <div className="mt-4 grid gap-3">
              {[
                {
                  icon: UserPlus,
                  title: t("landing.howW1Title"),
                  text: t("landing.howW1Text"),
                },
                {
                  icon: Search,
                  title: t("landing.howW2Title"),
                  text: t("landing.howW2Text"),
                },
                {
                  icon: Inbox,
                  title: t("landing.howW3Title"),
                  text: t("landing.howW3Text"),
                },
                {
                  icon: MessageSquare,
                  title: t("landing.howW4Title"),
                  text: t("landing.howW4Text"),
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-3 rounded-2xl border bg-card p-4 sm:gap-4 sm:p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="reviews" className="bg-surface">
        <div className="atlas-section mx-auto max-w-6xl px-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{t("landing.trustTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("landing.trustHint")}
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/reviews">{t("landing.allReviews")}</Link>
            </Button>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Star,
                title:
                  averageRating == null
                    ? t("landing.ratingSoon")
                    : t("landing.ratingValue", { rating: formatRating(averageRating) }),
                text:
                  averageRating == null
                    ? t("landing.ratingEmpty")
                    : t("landing.ratingAvg", { count: apiReviews.length }),
              },
              {
                icon: Inbox,
                title:
                  openJobsCount === null
                    ? t("landing.jobsLoading")
                    : t("landing.openJobsCount", { count: openJobsCount }),
                text:
                  openJobsCount === null
                    ? t("landing.jobsLoadingHint")
                    : t("landing.openJobsHint"),
              },
              {
                icon: ShieldCheck,
                title: t("landing.reputationTitle"),
                text: t("landing.reputationText"),
              },
              {
                icon: MessageSquare,
                title: t("landing.directDealTitle"),
                text: t("landing.directDealText"),
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border bg-card p-5">
                <item.icon className="h-5 w-5 text-primary" />
                <h3 className="mt-3 font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {reviewsQuery.isLoading ? <ReviewListSkeleton count={3} /> : null}
            {reviewsQuery.isError ? (
              <div className="md:col-span-3">
                <ErrorState
                  error={reviewsQuery.error}
                  onRetry={() => void reviewsQuery.refetch()}
                />
              </div>
            ) : null}
            {!reviewsQuery.isLoading && !reviewsQuery.isError && previewReviews.length === 0 ? (
              <div className="md:col-span-3">
                <EmptyState
                  title={t("landing.noReviews")}
                  description={t("landing.noReviewsHint")}
                />
              </div>
            ) : null}
            {!reviewsQuery.isLoading && !reviewsQuery.isError
              ? previewReviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    rating={review.rating}
                    comment={review.comment}
                    createdAt={review.created_at}
                    author={reviewAuthors[review.from_user_id] ?? t("common.userFallback", { id: review.from_user_id })}
                    jobId={review.job_id}
                  />
                ))
              : null}
          </div>
          <div className="mt-6 flex items-start gap-3 rounded-2xl border bg-card p-5">
            <Headphones className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h3 className="font-semibold">{t("landing.supportTitle")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("landing.supportText")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="cta" className="px-4 py-8 sm:py-12 lg:py-16">
        <div className="mx-auto max-w-6xl rounded-3xl bg-primary px-5 py-8 text-center text-primary-foreground sm:px-12 sm:py-12">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("landing.ctaTitle")}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-primary-foreground/80">
            {t("landing.ctaText")}
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="secondary" className="bg-background text-primary hover:bg-background/90">
              <Link to={createOrderTo}>{t("nav.placeOrder")}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link to={becomeWorkerTo}>{t("landing.becomeWorker")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
