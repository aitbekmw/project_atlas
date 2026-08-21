import { PageHeader } from "@/components/layout/page-header";
import { useI18n } from "@/i18n/locale-context";
import { JobsPage } from "@/pages/public/jobs-page";

export function JobsSearchPage() {
  const { t } = useI18n();
  return (
    <div>
      <PageHeader
        title={t("search.pageTitle")}
        description={t("search.pageHint")}
      />
      <JobsPage embedded />
    </div>
  );
}
