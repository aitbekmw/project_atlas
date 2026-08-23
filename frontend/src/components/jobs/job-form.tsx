import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState, type ReactNode } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";

import { ImagePicker } from "@/components/jobs/image-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { localizedCategoryName } from "@/i18n/categories";
import { useI18n } from "@/i18n/locale-context";
import { paymentMethodKey } from "@/i18n/status";
import { PAYMENT_METHODS, type Category, type JobPayload } from "@/types/api";

interface JobFormProps {
  categories: Category[];
  categoriesLoading?: boolean;
  categoriesError?: boolean;
  onRetryCategories?: () => void;
  defaultValues?: Partial<JobPayload>;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (values: JobPayload, image: File | null) => Promise<void> | void;
  existingImageUrl?: string | null;
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
  existingImageUrl = null,
}: JobFormProps) {
  const { t } = useI18n();
  const [image, setImage] = useState<File | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(
    defaultValues?.latitude != null && defaultValues?.longitude != null
      ? { latitude: defaultValues.latitude, longitude: defaultValues.longitude }
      : null,
  );
  const activeCategories = categories.filter((item) => item.is_active !== false);
  const schema = useMemo(
    () =>
      z.object({
        title: z.string().min(1, t("job.titleRequired")).max(255, t("job.titleMax")),
        description: z.string().min(1, t("job.descriptionRequired")),
        salary: z.coerce.number().min(0, t("job.salaryNegative")),
        payment_method: z.enum(["CASH", "QR", "AGREEMENT"], {
          required_error: t("job.paymentRequired"),
          invalid_type_error: t("job.paymentRequired"),
        }),
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
      payment_method: defaultValues?.payment_method ?? "CASH",
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
        await onSubmit(
          {
            ...values,
            latitude: coords?.latitude ?? null,
            longitude: coords?.longitude ?? null,
          },
          image,
        );
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
        <Field label={t("job.payment")} error={form.formState.errors.payment_method?.message}>
          <Controller
            control={form.control}
            name="payment_method"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger aria-label={t("job.payment")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {t(paymentMethodKey(method))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field label={t("job.category")} error={form.formState.errors.category_id?.message}>
          <Controller
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <Select
                value={field.value ? String(field.value) : "0"}
                onValueChange={(value) => field.onChange(Number(value))}
                disabled={categoriesLoading || categoriesError || activeCategories.length === 0}
              >
                <SelectTrigger aria-label={t("job.category")}>
                  <SelectValue placeholder={categoryPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{categoryPlaceholder}</SelectItem>
                  {activeCategories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {localizedCategoryName(category, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
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
      <Field label={t("upload.photo")}>
        <ImagePicker
          file={image}
          previewUrl={image ? null : existingImageUrl}
          onFile={setImage}
        />
      </Field>
      <Button
        type="button"
        variant="outline"
        className="min-h-11 w-full sm:w-auto"
        onClick={() => {
          if (!navigator.geolocation) {
            return;
          }
          navigator.geolocation.getCurrentPosition((position) => {
            setCoords({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          });
        }}
      >
        {t("job.useMyLocation")}
      </Button>
      {coords ? (
        <p className="text-xs text-muted-foreground">
          {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
        </p>
      ) : null}
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
