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
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/utils";

export function AdminCategoriesPage() {
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
      toast.success("Категория создана");
      await queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: async () => {
      toast.success("Категория удалена");
      await queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <div>
      <PageHeader
        title="Категории"
        description="Создание и управление справочником. Доступно только admin."
      />
      <Card className="mb-6">
        <CardContent className="grid gap-4 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="grid gap-2">
            <Label>Название</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Описание</Label>
            <Input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <Button
            disabled={!name || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            Добавить
          </Button>
        </CardContent>
      </Card>
      {listQuery.isLoading ? <TableSkeleton /> : null}
      {listQuery.isError ? <ErrorState onRetry={() => void listQuery.refetch()} /> : null}
      {listQuery.data?.length === 0 ? (
        <EmptyState title="Категорий нет" description="Создайте первую категорию." />
      ) : null}
      <div className="grid gap-3">
        {listQuery.data?.map((category) => (
          <Card key={category.id}>
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">{category.name}</p>
                <p className="text-sm text-muted-foreground">
                  {category.description || "Без описания"}
                </p>
                <Badge className="mt-2" variant={category.is_active ? "success" : "secondary"}>
                  {category.is_active ? "Активна" : "Скрыта"}
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
                  {category.is_active ? "Скрыть" : "Показать"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(category.id)}
                >
                  Удалить
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
