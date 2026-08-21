import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { listCategories } from "@/api/categories";
import { createJob } from "@/api/jobs";
import { JobForm } from "@/components/jobs/job-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/i18n/locale-context";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/utils";
import type { JobPayload } from "@/types/api";

export function CreateJobPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories,
    queryFn: listCategories,
  });
  const mutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      toast.success(t("job.published"));
      navigate("/app/jobs");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <div>
      <PageHeader title={t("job.createTitle")} description={t("job.createHint")} />
      <Card>
        <CardContent className="p-6">
          <JobForm
            categories={categoriesQuery.data ?? []}
            categoriesLoading={categoriesQuery.isLoading}
            categoriesError={categoriesQuery.isError}
            onRetryCategories={() => void categoriesQuery.refetch()}
            submitLabel={t("job.publish")}
            isSubmitting={mutation.isPending}
            onSubmit={async (values: JobPayload) => {
              await mutation.mutateAsync(values);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
