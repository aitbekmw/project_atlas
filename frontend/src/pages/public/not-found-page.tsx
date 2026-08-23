import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/locale-context";
import { usePageTitle } from "@/hooks/use-page-title";

export function NotFoundPage() {
  const { t } = useI18n();
  usePageTitle(t("seo.notFound"));
  return (
    <div className="flex min-h-[70svh] flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 text-[2rem] font-bold tracking-tight sm:text-4xl">{t("notFound.title")}</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        {t("notFound.hint")}
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild>
          <Link to="/">{t("common.home")}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/jobs">{t("nav.jobs")}</Link>
        </Button>
      </div>
    </div>
  );
}
