import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { localizedCategoryName } from "@/i18n/categories";
import { useI18n } from "@/i18n/locale-context";
import type { Category, JobPayload } from "@/types/api";

interface JobFormProps {
  categories: Category[];
  categoriesLoading?: boolean;
  categoriesError?: boolean;
  onRetryCategories?: () => void;
  defaultValues?: Partial<JobPayload>;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (values: JobPayload) => Promise<void> | void;
}

export function JobForm({
  categories,
  categoriesLoading = false,
  categoriesError = false,
  onRetryCategories,
  defaultValues,
  submitLabel,
  isSubmitting,
  onSubmit,
}: JobFormProps) {
  const { t } = useI18n();
  const activeCategories = categories.filter((item) => item.is_active !== false);
  const schema = useMemo(
    () =>
      z.object({
        title: z.string().min(1, t("job.titleRequired")).max(255, t("job.titleMax")),
        description: z.string().min(1, t("job.descriptionRequired")),
        salary: z.coerce.number().min(0, t("job.salaryNegative")),
        city: z.string().min(1, t("job.cityRequired")).max(100, t("job.cityMax")),
        address: z.string().min(1, t("job.addressRequired")).max(255, t("job.addressMax")),
        category_id: z.coerce.number().min(1, t("job.categoryRequired")),
      }),
    [t],
  );

  type JobFormValues = z.infer<typeof schema>;

  const form = useForm<JobFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      salary: defaultValues?.salary ?? 0,
      city: defaultValues?.city ?? "Бишкек",
      address: defaultValues?.address ?? "",
      category_id: defaultValues?.category_id ?? 0,
    },
  });

  const categoryPlaceholder = categoriesLoading
    ? t("category.loading")
    : categoriesError
      ? t("category.error")
      : activeCategories.length === 0
        ? t("category.empty")
        : t("category.choose");

  return (
    <form
      className="grid gap-5"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit(values);
      })}
    >
      <Field label={t("job.title")} error={form.formState.errors.title?.message}>
        <Input
          placeholder={t("job.titlePlaceholder")}
          maxLength={255}
          {...form.register("title")}
        />
      </Field>
      <Field label={t("job.description")} error={form.formState.errors.description?.message}>
        <Textarea
          placeholder={t("job.descriptionPlaceholder")}
          {...form.register("description")}
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("job.salary")} error={form.formState.errors.salary?.message}>
          <Input type="number" min={0} {...form.register("salary")} />
        </Field>
        <Field label={t("job.category")} error={form.formState.errors.category_id?.message}>
          <select
            className="flex min-h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            disabled={categoriesLoading || categoriesError || activeCategories.length === 0}
            {...form.register("category_id", { valueAsNumber: true })}
          >
            <option value={0}>{categoryPlaceholder}</option>
            {activeCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {localizedCategoryName(category, t)}
              </option>
            ))}
          </select>
          {categoriesError && onRetryCategories ? (
            <button
              type="button"
              className="text-left text-xs font-medium text-primary"
              onClick={onRetryCategories}
            >
              {t("category.retry")}
            </button>
          ) : null}
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("job.city")} error={form.formState.errors.city?.message}>
          <Input maxLength={100} {...form.register("city")} />
        </Field>
        <Field label={t("job.address")} error={form.formState.errors.address?.message}>
          <Input maxLength={255} {...form.register("address")} />
        </Field>
      </div>
      <Button type="submit" className="min-h-11" disabled={isSubmitting || categoriesLoading}>
        {isSubmitting ? t("job.saving") : submitLabel}
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
