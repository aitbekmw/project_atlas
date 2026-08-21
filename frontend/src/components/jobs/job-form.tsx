import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { ReactNode } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Category, JobPayload } from "@/types/api";

const schema = z.object({
  title: z.string().min(1, "Укажите название").max(255, "Максимум 255 символов"),
  description: z.string().min(1, "Добавьте описание"),
  salary: z.coerce.number().min(0, "Оплата не может быть отрицательной"),
  city: z.string().min(1, "Укажите город").max(100, "Максимум 100 символов"),
  address: z.string().min(1, "Укажите адрес").max(255, "Максимум 255 символов"),
  category_id: z.coerce.number().min(1, "Выберите категорию"),
});

type JobFormValues = z.infer<typeof schema>;

interface JobFormProps {
  categories: Category[];
  defaultValues?: Partial<JobPayload>;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (values: JobPayload) => Promise<void> | void;
}

export function JobForm({
  categories,
  defaultValues,
  submitLabel,
  isSubmitting,
  onSubmit,
}: JobFormProps) {
  const form = useForm<JobFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      salary: defaultValues?.salary ?? 0,
      city: defaultValues?.city ?? "Бишкек",
      address: defaultValues?.address ?? "",
      category_id: defaultValues?.category_id ?? categories[0]?.id ?? 0,
    },
  });

  return (
    <form
      className="grid gap-5"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit(values);
      })}
    >
      <Field label="Название" error={form.formState.errors.title?.message}>
        <Input
          placeholder="Нужен курьер на вечер"
          maxLength={255}
          {...form.register("title")}
        />
      </Field>
      <Field label="Описание" error={form.formState.errors.description?.message}>
        <Textarea
          placeholder="Что нужно сделать, сроки, условия"
          {...form.register("description")}
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Оплата, сом" error={form.formState.errors.salary?.message}>
          <Input type="number" min={0} {...form.register("salary")} />
        </Field>
        <Field label="Категория" error={form.formState.errors.category_id?.message}>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            {...form.register("category_id")}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Город" error={form.formState.errors.city?.message}>
          <Input maxLength={100} {...form.register("city")} />
        </Field>
        <Field label="Адрес" error={form.formState.errors.address?.message}>
          <Input maxLength={255} {...form.register("address")} />
        </Field>
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Сохраняем..." : submitLabel}
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
