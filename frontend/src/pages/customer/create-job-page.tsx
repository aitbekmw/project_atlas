import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { listCategories } from "@/api/categories";
import { createJob } from "@/api/jobs";
import { JobForm } from "@/components/jobs/job-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/components/states/error-state";
import { PageSpinner } from "@/components/states/loading-state";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/utils";
import type { JobPayload } from "@/types/api";

export function CreateJobPage() {
  const navigate = useNavigate();
  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories,
    queryFn: listCategories,
  });
  const mutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      toast.success("Заказ опубликован");
      navigate("/app/jobs");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (categoriesQuery.isLoading) {
    return <PageSpinner />;
  }
  if (categoriesQuery.isError) {
    return <ErrorState onRetry={() => void categoriesQuery.refetch()} />;
  }

  return (
    <div>
      <PageHeader
        title="Разместить заказ"
        description="Заполните детали задачи. Поля соответствуют JobCreate в API."
      />
      <Card>
        <CardContent className="p-6">
          <JobForm
            categories={categoriesQuery.data ?? []}
            submitLabel="Опубликовать"
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
