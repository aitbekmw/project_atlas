import { PageHeader } from "@/components/layout/page-header";
import { JobsPage } from "@/pages/public/jobs-page";

export function JobsSearchPage() {
  return (
    <div>
      <PageHeader
        title="Найти заказы"
        description="Открытые заказы с фильтрами API"
      />
      <JobsPage embedded />
    </div>
  );
}
