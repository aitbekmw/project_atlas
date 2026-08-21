import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { createCategory, deleteCategory, listCategories, updateCategory } from "@/api/categories";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { TableSkeleton } from "@/components/states/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { localizedCategoryDescription, localizedCategoryName } from "@/i18n/categories";
import { useI18n } from "@/i18n/locale-context";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/utils";

export function AdminCategoriesPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const listQuery = useQuery({
    queryKey: queryKeys.categories,
    queryFn: listCategories,
  });

  const createMutation = useMutation({
    mutationFn: () => createCategory({ name, description }),
    onSuccess: async () => {
      setName("");
      setDescription("");
      toast.success(t("admin.categoryCreated"));
      await queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: async () => {
      toast.success(t("admin.categoryDeleted"));
      await queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <div>
      <PageHeader
        title={t("admin.categoriesTitle")}
        description={t("admin.categoriesHint")}
      />
      <Card className="mb-6">
        <CardContent className="grid gap-4 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="grid gap-2">
            <Label>{t("admin.categoryName")}</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>{t("admin.categoryDesc")}</Label>
            <Input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <Button
            disabled={!name || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {t("admin.add")}
          </Button>
        </CardContent>
      </Card>
      {listQuery.isLoading ? <TableSkeleton /> : null}
      {listQuery.isError ? <ErrorState onRetry={() => void listQuery.refetch()} /> : null}
      {listQuery.data?.length === 0 ? (
        <EmptyState title={t("admin.categoriesEmpty")} description={t("admin.categoriesEmptyHint")} />
      ) : null}
      <div className="grid gap-3">
        {listQuery.data?.map((category) => (
          <Card key={category.id}>
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">{localizedCategoryName(category, t)}</p>
                <p className="text-sm text-muted-foreground">
                  {localizedCategoryDescription(category, t) || t("admin.noDescription")}
                </p>
                <Badge className="mt-2" variant={category.is_active ? "success" : "secondary"}>
                  {category.is_active ? t("common.active") : t("admin.hidden")}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await updateCategory(category.id, {
                        is_active: !category.is_active,
                      });
                      await queryClient.invalidateQueries({
                        queryKey: queryKeys.categories,
                      });
                    } catch (error) {
                      toast.error(getErrorMessage(error));
                    }
                  }}
                >
                  {category.is_active ? t("admin.hide") : t("admin.show")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(category.id)}
                >
                  {t("common.delete")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
