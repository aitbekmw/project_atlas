import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  ClipboardList,
  Headphones,
  Inbox,
  MessageSquare,
  Search,
  ShieldCheck,
  Star,
  UserPlus,
  UserRoundCheck,
  Wallet,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { listCategories } from "@/api/categories";
import { listJobs } from "@/api/jobs";
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

  const jobsQuery = useQuery({
    queryKey: queryKeys.jobs({ size: 8, status: "OPEN" }),
    queryFn: () => listJobs({ size: 8, status: "OPEN" }),
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
  const categories = apiCategories.slice(0, 6);
  const names = categoryMap(apiCategories);
  const jobs: Job[] = jobsQuery.data ?? [];
  const nearby = jobs.slice(0, 4);
  const popular = jobs.slice(0, 6);
  const selected = nearby.find((job) => job.id === activeJobId) ?? nearby[0];

  const chips = useMemo(
    () => categories.slice(0, 5).map((item) => item.name),
    [categories],
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
    <div>
      <section className="border-b">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
          <div>
            <h1 className="max-w-xl text-4xl font-extrabold tracking-tight sm:text-5xl">
              {t("landing.heroTitle")}{" "}
              <span className="text-primary">{t("landing.heroAccent")}</span>
            </h1>
            <p className="mt-4 max-w-lg text-base text-muted-foreground">
              {t("landing.heroText")}
            </p>

            <form
              onSubmit={onSearch}
              className="mt-8 grid gap-2 rounded-2xl border bg-card p-2 soft-shadow sm:grid-cols-[1.2fr_0.8fr_0.8fr_auto]"
            >
              <Input
                value={need}
                onChange={(event) => setNeed(event.target.value)}
                placeholder={t("jobs.search")}
                className="h-12 border-0 shadow-none focus-visible:ring-0"
                aria-label={t("jobs.search")}
              />
              <Input
                value={where}
                onChange={(event) => setWhere(event.target.value)}
                placeholder={t("jobs.where")}
                className="h-12 border-0 shadow-none focus-visible:ring-0"
                aria-label={t("jobs.where")}
              />
              <Input
                value={when}
                onChange={(event) => setWhen(event.target.value)}
                placeholder={t("landing.when")}
                className="h-12 border-0 shadow-none focus-visible:ring-0"
                aria-label={t("landing.when")}
              />
              <Button type="submit" size="lg" className="h-12">
                <Search className="h-4 w-4" />
                {t("landing.findHelp")}
              </Button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              {chips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    setNeed(chip);
                    navigate(`/jobs?search=${encodeURIComponent(chip)}`);
                  }}
                  className="rounded-full border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:border-primary/40 hover:text-foreground"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          <CityMap
            jobs={nearby}
            selectedJobId={selected?.id}
            onJobSelect={(job) => setActiveJobId(job.id)}
            className="min-h-[360px] soft-shadow-lg"
          />
        </div>
      </section>

      <section id="categories" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{t("landing.categories")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("landing.categoriesHint")}
            </p>
          </div>
          <Button asChild variant="link">
            <Link to="/categories">{t("landing.allCategories")}</Link>
          </Button>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categoriesQuery.isLoading ? (
            <div className="col-span-full">
              <JobListSkeleton />
            </div>
          ) : null}
          {categoriesQuery.isError ? (
            <div className="col-span-full">
              <ErrorState
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
            return (
              <Link
                key={category.id}
                to={`/jobs?category_id=${category.id}`}
                className="rounded-2xl border bg-card p-4 transition-colors duration-200 hover:border-primary/30 hover:bg-card-hover"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-semibold">{category.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">Смотреть заказы</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Заказы рядом</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Актуальные задания на карте и в списке
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/jobs">Все заказы</Link>
            </Button>
          </div>
          {jobsQuery.isLoading ? <JobListSkeleton /> : null}
          {jobsQuery.isError ? (
            <ErrorState
              error={jobsQuery.error}
              onRetry={() => void jobsQuery.refetch()}
            />
          ) : null}
          {!jobsQuery.isLoading && !jobsQuery.isError && nearby.length === 0 ? (
            <EmptyState
              icon="jobs"
              title="Пока нет открытых заказов"
              description="Как только заказчики опубликуют задачи, они появятся здесь."
              action={
                <Button asChild>
                  <Link to="/app/jobs/new">Разместить заказ</Link>
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
                className="min-h-[420px]"
                showCards={false}
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
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold tracking-tight">Популярные заказы</h2>
          <Button asChild variant="link">
            <Link to="/jobs">Смотреть все</Link>
          </Button>
        </div>
        {jobsQuery.isLoading ? <JobListSkeleton /> : null}
        {!jobsQuery.isLoading && !jobsQuery.isError && popular.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon="jobs"
            title="Популярных заказов пока нет"
            description="Новые задания из GET /jobs появятся в этой ленте."
          />
        ) : null}
        {popular.length > 0 ? (
          <div className="mt-6 flex snap-x gap-4 overflow-x-auto pb-2">
            {popular.map((job) => (
              <MarketplaceJobCard
                key={job.id}
                job={job}
                categoryName={names[job.category_id]}
                href={jobHref(job)}
                layout="horizontal"
              />
            ))}
          </div>
        ) : null}
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold tracking-tight">Лучшие исполнители</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Исполнители с отзывами из GET /reviews и карточками GET /users/{"{id}"}.
            Отдельного списка исполнителей в API нет.
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
              title="Пока нет исполнителей с отзывами"
              description="GET /users отсутствует. Здесь появляются worker-профили, которым уже оставили отзыв."
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

      <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight">Как это работает</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Atlas — двусторонний маркетплейс. Заказчик публикует задачу, исполнитель
            откликается, стороны договариваются в чате и оставляют отзыв.
          </p>
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-primary">Для заказчика</p>
            <div className="mt-4 grid gap-3">
              {[
                {
                  icon: ClipboardList,
                  title: "Разместите заказ",
                  text: "Категория, город, адрес и бюджет — поля как в API JobCreate.",
                },
                {
                  icon: Inbox,
                  title: "Получите отклики",
                  text: "Исполнители отправляют заявки. Статусы: на рассмотрении, принята, отклонена.",
                },
                {
                  icon: UserRoundCheck,
                  title: "Выберите исполнителя",
                  text: "Примите заявку, откройте диалог и согласуйте детали в чате.",
                },
                {
                  icon: Star,
                  title: "Закройте заказ и оставьте отзыв",
                  text: "После выполнения оценка и комментарий появляются в профиле.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 rounded-2xl border bg-card p-5">
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
            <p className="text-sm font-semibold text-primary">Для исполнителя</p>
            <div className="mt-4 grid gap-3">
              {[
                {
                  icon: UserPlus,
                  title: "Создайте профиль",
                  text: "Регистрация с ролью worker. Доступны имя, контакты и отклики.",
                },
                {
                  icon: Search,
                  title: "Найдите заказы рядом",
                  text: "Фильтры поиска совпадают с API: текст, город, категория, оплата.",
                },
                {
                  icon: Inbox,
                  title: "Откликнитесь",
                  text: "Одна заявка на заказ. Заказчик принимает или отклоняет её.",
                },
                {
                  icon: MessageSquare,
                  title: "Договоритесь в чате",
                  text: "После принятия заявки открывается диалог по заказу.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 rounded-2xl border bg-card p-5">
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
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Доверие и отзывы</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Рейтинг и отзывы считаются из GET /reviews. Счётчика всех исполнителей
                и эквайринга в API нет.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/reviews">Все отзывы</Link>
            </Button>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                icon: Star,
                title:
                  averageRating == null
                    ? "Рейтинг появится после отзывов"
                    : `${formatRating(averageRating)} рейтинг`,
                text:
                  averageRating == null
                    ? "GET /reviews пока пуст"
                    : `Среднее по ${apiReviews.length} отзывам из API`,
                demo: false,
              },
              {
                icon: Inbox,
                title:
                  openJobsCount === null
                    ? "Заказы загружаются"
                    : `${openJobsCount} открытых заказов`,
                text:
                  openJobsCount === null
                    ? "GET /jobs"
                    : "Сейчас открыто в GET /jobs",
                demo: false,
              },
              {
                icon: BadgeCheck,
                title: "Число исполнителей неизвестно",
                text: "Демо-заглушка: списка пользователей в API нет",
                demo: true,
              },
              {
                icon: ShieldCheck,
                title: "Проверка репутации",
                text: "Отзыв можно оставить после завершённого заказа",
                demo: false,
              },
              {
                icon: Wallet,
                title: "Безопасные договорённости",
                text: "Демо-формулировка: эквайринга в backend нет",
                demo: true,
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border bg-card p-5">
                <item.icon className="h-5 w-5 text-primary" />
                <h3 className="mt-3 font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
                {item.demo ? (
                  <p className="mt-2 text-[11px] text-muted-foreground">демо</p>
                ) : null}
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
                  title="Отзывов пока нет"
                  description="После завершения заказа оценки из GET /reviews появятся здесь. Пустой API не заменяется демо."
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
                    author={reviewAuthors[review.from_user_id] ?? `Пользователь #${review.from_user_id}`}
                    jobId={review.job_id}
                  />
                ))
              : null}
          </div>
          <div className="mt-6 flex items-start gap-3 rounded-2xl border bg-card p-5">
            <Headphones className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h3 className="font-semibold">Поддержка</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Демо-блок: отдельного support API нет. Споры решаются через статусы
                заказа, отклики и чат.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="cta" className="px-4 py-16">
        <div className="mx-auto max-w-6xl rounded-3xl bg-primary px-6 py-12 text-center text-primary-foreground sm:px-12">
          <h2 className="text-3xl font-bold tracking-tight">Нужна помощь сегодня?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-primary-foreground/80">
            Разместите заказ за пару минут или начните выполнять задания как исполнитель.
            Регистрация и вход идут через FastAPI /auth.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="secondary" className="bg-background text-primary hover:bg-background/90">
              <Link to={createOrderTo}>Разместить заказ</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link to={becomeWorkerTo}>Стать исполнителем</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
