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
import { queryKeys } from "@/lib/query-keys";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
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
        <PageHeader title={t("dashboard.admin")} description="Обзор платформы Atlas" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Заказы" value={allJobs.data?.length ?? 0} />
          <Stat label="Отклики" value={applications.data?.length ?? 0} />
          <Stat label="Отзывы" value={reviews.data?.length ?? 0} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/app/admin/categories">{t("nav.categories")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/app/admin/users">{t("nav.users")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (user?.role === "customer") {
    return (
      <div>
        <PageHeader
          title={`Здравствуйте, ${user.first_name}`}
          description="Управляйте заказами, откликами и сообщениями"
          action={
            <Button asChild>
              <Link to="/app/jobs/new">{t("nav.placeOrder")}</Link>
            </Button>
          }
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Мои заказы" value={myJobs.data?.length ?? 0} />
          <Stat label="Отклики" value={applications.data?.length ?? 0} />
          <Stat label="Отзывы" value={aboutMe.data?.length ?? 0} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Здравствуйте, ${user?.first_name ?? ""}`}
        description="Находите заказы и отслеживайте отклики"
        action={
          <Button asChild>
            <Link to="/app/search">{t("nav.searchJobs")}</Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Мои отклики" value={myApplications.data?.length ?? 0} />
        <Stat label="Открытые заказы" value={openJobs.data?.length ?? 0} />
        <Stat label="Отзывы" value={aboutMe.data?.length ?? 0} />
      </div>
    </div>
  );
}
