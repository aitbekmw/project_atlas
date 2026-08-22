import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { listCategories } from "@/api/categories";
import { getJob, updateJob, uploadJobImage } from "@/api/jobs";
import { JobForm } from "@/components/jobs/job-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/components/states/error-state";
import { PageSpinner } from "@/components/states/loading-state";
import { queryKeys } from "@/lib/query-keys";
import { useI18n } from "@/i18n/locale-context";
import { getErrorMessage } from "@/lib/utils";
import type { JobPayload } from "@/types/api";

export function EditJobPage() {
  const { t } = useI18n();
  const { jobId } = useParams();
  const id = Number(jobId);
  const navigate = useNavigate();

  const jobQuery = useQuery({
    queryKey: queryKeys.job(id),
    queryFn: () => getJob(id),
    enabled: Number.isFinite(id),
  });
  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories,
    queryFn: listCategories,
  });
  const mutation = useMutation({
    mutationFn: async ({
      payload,
      image,
    }: {
      payload: JobPayload;
      image: File | null;
    }) => {
      const job = await updateJob(id, payload);
      if (image) {
        await uploadJobImage(id, image);
      }
      return job;
    },
    onSuccess: () => {
      toast.success(t("job.updated"));
      navigate("/app/jobs");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (jobQuery.isLoading || categoriesQuery.isLoading) {
    return <PageSpinner />;
  }
  if (jobQuery.isError || !jobQuery.data) {
    return <ErrorState error={jobQuery.error} onRetry={() => void jobQuery.refetch()} />;
  }

  return (
    <div>
      <PageHeader title={t("job.editTitle")} description={jobQuery.data.title} />
      <Card>
        <CardContent className="p-6">
          <JobForm
            categories={categoriesQuery.data ?? []}
            categoriesLoading={categoriesQuery.isLoading}
            categoriesError={categoriesQuery.isError}
            onRetryCategories={() => void categoriesQuery.refetch()}
            defaultValues={jobQuery.data}
            existingImageUrl={jobQuery.data.image_url}
            submitLabel={t("common.save")}
            isSubmitting={mutation.isPending}
            onSubmit={async (values, image) => {
              await mutation.mutateAsync({ payload: values, image });
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
