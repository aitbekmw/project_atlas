import { useQuery } from "@tanstack/react-query";
import {
  ClipboardList,
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
import { JobsMapPanel, MarketplaceSplit } from "@/components/marketplace/jobs-map-panel";
import { MarketplaceJobCard } from "@/components/marketplace/job-list-card";
import { ReviewCard } from "@/components/marketplace/review-card";
import { WorkerCard, featuredWorkersFromReviews } from "@/components/marketplace/worker-card";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { JobFeedSkeleton, ReviewListSkeleton } from "@/components/states/loading-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { useGeolocation } from "@/hooks/use-geolocation";
import { usePageTitle } from "@/hooks/use-page-title";
import { useUsersMap } from "@/hooks/use-users-map";
import { localizedCategoryName, systemCategorySlug } from "@/i18n/categories";
import { useI18n } from "@/i18n/locale-context";
import { iconForCategory } from "@/lib/category-icons";
import { averageRatingByUser, formatRating } from "@/lib/marketplace";
import { mostCommonCity, uniqueCategoryIds } from "@/lib/profile-stats";
import { queryKeys } from "@/lib/query-keys";
import { cn, fullName } from "@/lib/utils";
import type { Job } from "@/types/api";

const HOME_JOBS_LIMIT = 6;
const NEARBY_CHIP_SLUGS = ["repair", "delivery", "cleaning", "moving", "it"] as const;

export function LandingPage() {
  const { t } = useI18n();
  usePageTitle(t("seo.home"));
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [need, setNeed] = useState("");
  const [where, setWhere] = useState("");
  const [when, setWhen] = useState("");
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [nearbyCategoryId, setNearbyCategoryId] = useState<number | null>(null);
  const geo = useGeolocation();

  const jobsQuery = useQuery({
    queryKey: queryKeys.jobs({ size: 30, status: "OPEN" }),
    queryFn: () => listJobs({ size: 30, status: "OPEN" }),
  });
  const completedQuery = useQuery({
    queryKey: queryKeys.jobs({ size: 100, status: "COMPLETED" }),
    queryFn: () => listJobs({ size: 100, status: "COMPLETED" }),
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
  const nearbySource = nearbyJobs.length > 0 ? nearbyJobs : jobs;
  const nearbyChipCategories = useMemo(
    () =>
      NEARBY_CHIP_SLUGS.flatMap((slug) => {
        const match = categories.find((item) => systemCategorySlug(item) === slug);
        return match ? [match] : [];
      }),
    [categories],
  );
  const nearbyFiltered = nearbyCategoryId
    ? nearbySource.filter((job) => job.category_id === nearbyCategoryId)
    : nearbySource;
  const nearbyFeed = nearbyFiltered.slice(0, HOME_JOBS_LIMIT);
  const selected = nearbyFeed.find((job) => job.id === activeJobId) ?? nearbyFeed[0];

  const chips = useMemo(() => categories.slice(0, 5), [categories]);
  const featuredCategories = nearbyChipCategories.length > 0 ? nearbyChipCategories : chips;

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
  const featuredWorkersBase = featuredWorkersFromReviews(apiReviews, reviewUsersQuery.data ?? {});
  const jobsById = useMemo(() => {
    const map: Record<number, Job> = {};
    for (const job of [...(jobsQuery.data ?? []), ...(completedQuery.data ?? [])]) {
      map[job.id] = job;
    }
    return map;
  }, [jobsQuery.data, completedQuery.data]);
  const featuredWorkers = featuredWorkersBase.map((worker) => {
    const related = apiReviews
      .filter((review) => review.to_user_id === worker.id)
      .map((review) => jobsById[review.job_id])
      .filter((job): job is Job => Boolean(job));
    return {
      ...worker,
      city: mostCommonCity(related),
      specializations: uniqueCategoryIds(related)
        .map((categoryId) => names[categoryId])
        .filter(Boolean),
    };
  });
  const ownerIds = nearbyFeed.map((job) => job.owner_id);
  const ownerRatings = useMemo(() => averageRatingByUser(apiReviews), [apiReviews]);
  const ownersQuery = useUsersMap(ownerIds);
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
    <div>
      <section className="relative border-b bg-surface">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgb(22_119_255_/_0.12),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top_left,rgb(22_119_255_/_0.18),transparent_50%)]" />
        <div className="relative mx-auto flex max-w-[90rem] flex-col gap-2 px-4 py-3 sm:py-3.5 lg:py-4">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              {t("landing.location")}
            </p>
            <h1 className="mt-1.5 max-w-xl text-[1.35rem] font-extrabold leading-tight tracking-tight text-balance sm:mt-2 sm:text-[1.75rem] lg:text-[1.9rem]">
              {t("landing.heroTitle")}
            </h1>
            <p className="mt-1 max-w-lg text-sm leading-snug text-muted-foreground sm:text-[0.9375rem]">
              {t("landing.heroText")}
            </p>
          </div>

            <form
              onSubmit={onSearch}
              className="grid min-w-0 gap-2 rounded-2xl border bg-card p-2 sm:p-2.5 lg:grid-cols-[1.3fr_0.85fr_0.75fr_auto]"
            >
              <Input
                value={need}
                onChange={(event) => setNeed(event.target.value)}
                placeholder={t("landing.searchNeed")}
                className="h-11 min-h-11 border-0 bg-surface shadow-none focus-visible:ring-1"
                aria-label={t("landing.searchNeed")}
              />
              <Input
                value={where}
                onChange={(event) => setWhere(event.target.value)}
                placeholder={t("landing.searchWhere")}
                className="h-11 min-h-11 border-0 bg-surface shadow-none focus-visible:ring-1"
                aria-label={t("landing.searchWhere")}
              />
              <Input
                value={when}
                onChange={(event) => setWhen(event.target.value)}
                placeholder={t("landing.searchWhen")}
                className="h-11 min-h-11 border-0 bg-surface shadow-none focus-visible:ring-1"
                aria-label={t("landing.searchWhen")}
              />
              <Button type="submit" size="lg" className="h-11 min-h-11 w-full lg:w-auto">
                <Search className="h-4 w-4" />
                {t("landing.searchCta")}
              </Button>
            </form>
        </div>
      </section>

      <section className="border-b bg-background">
        <div className="mx-auto max-w-[90rem] px-4 py-3 sm:py-4">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-lg font-bold tracking-tight sm:text-xl">{t("landing.categories")}</h2>
            <Link
              to="/categories"
              className="inline-flex min-h-10 shrink-0 items-center text-sm font-medium text-primary hover:underline"
            >
              {t("landing.allCategories")}
            </Link>
          </div>
          {featuredCategories.length > 0 ? (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {featuredCategories.map((category) => {
                const Icon = iconForCategory(category);
                return (
                  <Link
                    key={category.id}
                    to={`/jobs?category_id=${category.id}`}
                    className="flex min-h-11 min-w-0 items-center gap-2.5 rounded-xl border bg-card px-3 py-2.5 transition-colors duration-200 hover:border-primary/40 hover:bg-card-hover"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="truncate text-sm font-medium">
                      {localizedCategoryName(category, t)}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="atlas-section mx-auto max-w-[90rem] px-4">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{t("landing.topWorkers")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("landing.topWorkersHint")} {t("landing.topWorkersSort")}
          </p>
          {reviewsQuery.isLoading ? (
            <div className="mt-5">
              <ReviewListSkeleton count={4} />
            </div>
          ) : null}
          {reviewsQuery.isError ? (
            <div className="mt-5">
              <ErrorState
                error={reviewsQuery.error}
                onRetry={() => void reviewsQuery.refetch()}
              />
            </div>
          ) : null}
          {!reviewsQuery.isLoading && !reviewsQuery.isError && featuredWorkers.length === 0 ? (
            <EmptyState
              className="mt-5"
              icon="inbox"
              title={t("landing.topWorkersEmpty")}
              description={t("landing.topWorkersEmptyHint")}
            />
          ) : null}
          {featuredWorkers.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {featuredWorkers.map((worker) => (
                <WorkerCard key={worker.id} worker={worker} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="bg-surface">
        <div className="atlas-section mx-auto max-w-[90rem] px-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{t("landing.nearbyTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("landing.nearbyHint")}
            </p>
          </div>
          {nearbyChipCategories.length > 0 ? (
            <div className="mt-4 flex min-w-0 gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => setNearbyCategoryId(null)}
                className={cn(
                  "min-h-9 shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors duration-200",
                  nearbyCategoryId == null
                    ? "border-primary bg-primary/10 text-foreground"
                    : "bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {t("landing.chipAll")}
              </button>
              {nearbyChipCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setNearbyCategoryId(category.id)}
                  className={cn(
                    "min-h-9 shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors duration-200",
                    nearbyCategoryId === category.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {localizedCategoryName(category, t)}
                </button>
              ))}
            </div>
          ) : null}
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
          {jobsQuery.isError ? (
            <div className="mt-4">
              <ErrorState
                error={jobsQuery.error}
                onRetry={() => void jobsQuery.refetch()}
              />
            </div>
          ) : null}
          {!jobsQuery.isLoading && !jobsQuery.isError && nearbySource.length === 0 ? (
            <EmptyState
              className="mt-4"
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
          {!jobsQuery.isLoading &&
          !jobsQuery.isError &&
          nearbySource.length > 0 &&
          nearbyFeed.length === 0 ? (
            <EmptyState
              className="mt-4"
              icon="search"
              title={t("landing.nearbyCategoryEmpty")}
              description={t("landing.nearbyCategoryEmptyHint")}
              action={
                <Button asChild variant="outline">
                  <Link to="/jobs">{t("landing.allJobsLink")}</Link>
                </Button>
              }
            />
          ) : null}
          {!jobsQuery.isError &&
          ((jobsQuery.isLoading && nearbyFeed.length === 0) || nearbyFeed.length > 0) ? (
            <div className="mt-4">
              {nearbyFeed.length > 0 ? (
                <p className="mb-3 text-sm text-muted-foreground">
                  {t("jobs.jobsCount", { count: nearbyFeed.length })}
                </p>
              ) : null}
              <MarketplaceSplit
                list={
                  jobsQuery.isLoading && nearbyFeed.length === 0 ? (
                    <JobFeedSkeleton />
                  ) : (
                    <div className="grid gap-2">
                      {nearbyFeed.map((job) => (
                        <div key={job.id} onMouseEnter={() => setActiveJobId(job.id)}>
                          <MarketplaceJobCard
                            job={job}
                            categoryName={names[job.category_id]}
                            href={jobHref(job)}
                            layout="list"
                            active={selected?.id === job.id}
                            distanceKm={job.distance_km}
                            customer={ownersQuery.data?.[job.owner_id]}
                            customerRating={ownerRatings[job.owner_id]}
                          />
                        </div>
                      ))}
                      <Link
                        to="/jobs"
                        className="mt-1 inline-flex min-h-10 items-center text-sm font-medium text-primary hover:underline"
                      >
                        {t("landing.allJobsLink")}
                      </Link>
                    </div>
                  )
                }
                map={
                  <JobsMapPanel
                    jobs={nearbyFeed}
                    selectedJobId={selected?.id}
                    onJobSelect={(job) => setActiveJobId(job.id)}
                    jobHref={jobHref}
                    categoryNames={names}
                    userLocation={geo.coords}
                    showOverlay={false}
                    showFooter={false}
                    showCards={false}
                    compact
                  />
                }
              />
            </div>
          ) : null}
        </div>
      </section>

      <section id="reviews" className="bg-surface">
        <div className="atlas-section mx-auto max-w-[90rem] px-4">
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
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              <div key={item.title} className="rounded-2xl border bg-card p-3.5">
                <item.icon className="h-5 w-5 text-primary" />
                <h3 className="mt-2 font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
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
                    recipient={reviewAuthors[review.to_user_id] ?? t("common.userFallback", { id: review.to_user_id })}
                    jobId={review.job_id}
                    jobTitle={jobsById[review.job_id]?.title}
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

      <section id="how-it-works" className="atlas-section mx-auto max-w-[90rem] scroll-mt-24 px-4">
        <div className="max-w-2xl">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{t("landing.howTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("landing.howHint")}
          </p>
        </div>
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
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
                <div key={item.title} className="flex gap-3 rounded-2xl border bg-card p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
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
                <div key={item.title} className="flex gap-3 rounded-2xl border bg-card p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
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
        <Button asChild variant="outline" size="sm" className="mt-4 min-h-11">
          <Link to="/how-it-works">{t("nav.how")}</Link>
        </Button>
      </section>

      <section id="cta" className="px-4 py-6 sm:py-8 lg:py-10">
        <div className="mx-auto max-w-[90rem] rounded-3xl bg-primary px-5 py-6 text-center text-primary-foreground sm:px-12 sm:py-8">
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
