import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { getMyApplications, listApplications } from "@/api/applications";
import { getMyJobs, listJobs } from "@/api/jobs";
import { getUserReviews, listReviews } from "@/api/reviews";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { useI18n } from "@/i18n/locale-context";
import { paymentMethodKey } from "@/i18n/status";
import { queryKeys } from "@/lib/query-keys";
import { formatMoney } from "@/lib/utils";
import type { Job } from "@/types/api";

function DashboardJobs({
  title,
  jobs,
  href,
}: {
  title: string;
  jobs: Job[];
  href: (job: Job) => string;
}) {
  const { t } = useI18n();
  if (jobs.length === 0) {
    return null;
  }
  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-3 grid gap-3">
        {jobs.slice(0, 5).map((job) => (
          <Link
            key={job.id}
            to={href(job)}
            className="min-w-0 rounded-2xl border bg-card px-4 py-3 transition-colors duration-200 hover:border-primary/30 hover:bg-card-hover"
          >
            <p className="break-words font-semibold">{job.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatMoney(job.salary)} · {t(paymentMethodKey(job.payment_method))}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{value}</p>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { t } = useI18n();
  const { user } = useAuth();

  const myJobs = useQuery({
    queryKey: queryKeys.myJobs,
    queryFn: getMyJobs,
    enabled: user?.role === "customer" || user?.role === "admin",
  });
  const myApplications = useQuery({
    queryKey: queryKeys.myApplications,
    queryFn: getMyApplications,
    enabled: user?.role === "worker",
  });
  const applications = useQuery({
    queryKey: queryKeys.applications,
    queryFn: listApplications,
    enabled: user?.role === "customer" || user?.role === "admin",
  });
  const openJobs = useQuery({
    queryKey: queryKeys.jobs({ status: "OPEN", size: 5 }),
    queryFn: () => listJobs({ status: "OPEN", size: 5 }),
    enabled: user?.role === "worker",
  });
  const reviews = useQuery({
    queryKey: queryKeys.reviews,
    queryFn: listReviews,
    enabled: user?.role === "admin",
  });
  const aboutMe = useQuery({
    queryKey: queryKeys.userReviews(user?.id ?? 0),
    queryFn: () => getUserReviews(user!.id),
    enabled: Boolean(user) && user?.role !== "admin",
  });
  const allJobs = useQuery({
    queryKey: queryKeys.jobs({ size: 20 }),
    queryFn: () => listJobs({ size: 20 }),
    enabled: user?.role === "admin",
  });

  if (user?.role === "admin") {
    return (
      <div>
        <PageHeader title={t("dashboard.admin")} description={t("dashboard.adminHint")} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label={t("dashboard.statJobs")} value={allJobs.data?.length ?? 0} />
          <Stat label={t("dashboard.statApplications")} value={applications.data?.length ?? 0} />
          <Stat label={t("dashboard.statReviews")} value={reviews.data?.length ?? 0} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/app/admin/categories">{t("nav.categories")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/app/admin/users">{t("nav.users")}</Link>
          </Button>
        </div>
        <DashboardJobs
          title={t("dashboard.recentJobs")}
          jobs={allJobs.data ?? []}
          href={(job) => `/jobs/${job.id}`}
        />
      </div>
    );
  }

  if (user?.role === "customer") {
    return (
      <div>
        <PageHeader
          title={t("dashboard.helloName", { name: user.first_name })}
          description={t("dashboard.customerHint")}
          action={
            <Button asChild>
              <Link to="/app/jobs/new">{t("nav.placeOrder")}</Link>
            </Button>
          }
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label={t("dashboard.statMyJobs")} value={myJobs.data?.length ?? 0} />
          <Stat label={t("dashboard.statApplications")} value={applications.data?.length ?? 0} />
          <Stat label={t("dashboard.statReviews")} value={aboutMe.data?.length ?? 0} />
        </div>
        <DashboardJobs
          title={t("dashboard.recentJobs")}
          jobs={myJobs.data ?? []}
          href={(job) => `/jobs/${job.id}`}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={t("dashboard.helloName", { name: user?.first_name ?? "" })}
        description={t("dashboard.workerHint")}
        action={
          <Button asChild>
            <Link to="/app/search">{t("nav.searchJobs")}</Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label={t("dashboard.statMyApplications")} value={myApplications.data?.length ?? 0} />
        <Stat label={t("dashboard.statOpenJobs")} value={openJobs.data?.length ?? 0} />
        <Stat label={t("dashboard.statReviews")} value={aboutMe.data?.length ?? 0} />
      </div>
      <DashboardJobs
        title={t("dashboard.recentOpenJobs")}
        jobs={openJobs.data ?? []}
        href={(job) => `/jobs/${job.id}`}
      />
    </div>
  );
}
