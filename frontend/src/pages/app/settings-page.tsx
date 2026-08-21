import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { changePassword, getMe, updateMe } from "@/api/users";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/states/error-state";
import { AvatarEditor } from "@/components/users/avatar-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/utils";

const profileSchema = z.object({
  first_name: z.string().trim().min(1, "Укажите имя").max(100),
  last_name: z.string().trim().min(1, "Укажите фамилию").max(100),
  phone: z.string().max(30).optional(),
});

const passwordSchema = z.object({
  current_password: z.string().min(1, "Укажите текущий пароль"),
  new_password: z.string().min(8, "Минимум 8 символов"),
});

export function SettingsPage() {
  const { applyUser, refreshUser } = useAuth();
  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: getMe,
  });
  const user = meQuery.data;

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    values: {
      first_name: user?.first_name ?? "",
      last_name: user?.last_name ?? "",
      phone: user?.phone ?? "",
    },
  });
  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: "", new_password: "" },
  });

  const profileMutation = useMutation({
    mutationFn: updateMe,
    onSuccess: async (updated) => {
      applyUser(updated);
      await refreshUser();
      toast.success("Профиль обновлён");
    },
    onError: (error) => {
      const message = getErrorMessage(error);
      profileForm.setError("root", { message });
      toast.error(message);
    },
  });
  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      passwordForm.reset();
      toast.success("Пароль изменён");
    },
    onError: (error) => {
      const message = getErrorMessage(error);
      passwordForm.setError("root", { message });
      toast.error(message);
    },
  });

  if (meQuery.isLoading) {
    return (
      <div>
        <PageHeader title="Настройки" description="Профиль и безопасность" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (meQuery.isError || !user) {
    return (
      <div>
        <PageHeader title="Настройки" description="Профиль и безопасность" />
        <ErrorState error={meQuery.error} onRetry={() => void meQuery.refetch()} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Настройки" description="Профиль и безопасность" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Личные данные</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <AvatarEditor
                user={user}
                onUpdated={async (updated) => {
                  applyUser(updated);
                  await refreshUser();
                }}
              />
            </div>
            <form
              className="grid gap-4"
              onSubmit={profileForm.handleSubmit((values) =>
                profileMutation.mutate({
                  first_name: values.first_name,
                  last_name: values.last_name,
                  phone: values.phone || null,
                }),
              )}
            >
              {profileForm.formState.errors.root ? (
                <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {profileForm.formState.errors.root.message}
                </p>
              ) : null}
              <div className="grid gap-2">
                <Label>Имя</Label>
                <Input maxLength={100} {...profileForm.register("first_name")} />
                {profileForm.formState.errors.first_name ? (
                  <p className="text-sm text-destructive">
                    {profileForm.formState.errors.first_name.message}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label>Фамилия</Label>
                <Input maxLength={100} {...profileForm.register("last_name")} />
                {profileForm.formState.errors.last_name ? (
                  <p className="text-sm text-destructive">
                    {profileForm.formState.errors.last_name.message}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label>Телефон</Label>
                <Input maxLength={30} {...profileForm.register("phone")} />
                {profileForm.formState.errors.phone ? (
                  <p className="text-sm text-destructive">
                    {profileForm.formState.errors.phone.message}
                  </p>
                ) : null}
              </div>
              <Button type="submit" disabled={profileMutation.isPending}>
                {profileMutation.isPending ? "Сохранение…" : "Сохранить"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Смена пароля</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={passwordForm.handleSubmit((values) =>
                passwordMutation.mutate(values),
              )}
            >
              {passwordForm.formState.errors.root ? (
                <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {passwordForm.formState.errors.root.message}
                </p>
              ) : null}
              <div className="grid gap-2">
                <Label>Текущий пароль</Label>
                <Input type="password" {...passwordForm.register("current_password")} />
                {passwordForm.formState.errors.current_password ? (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.current_password.message}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label>Новый пароль</Label>
                <Input type="password" {...passwordForm.register("new_password")} />
                {passwordForm.formState.errors.new_password ? (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.new_password.message}
                  </p>
                ) : null}
              </div>
              <Button type="submit" disabled={passwordMutation.isPending}>
                {passwordMutation.isPending ? "Обновление…" : "Обновить пароль"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
