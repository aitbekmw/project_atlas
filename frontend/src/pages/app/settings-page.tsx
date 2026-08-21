import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
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
import { useI18n } from "@/i18n/locale-context";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/utils";

export function SettingsPage() {
  const { t } = useI18n();
  const profileSchema = useMemo(
    () =>
      z.object({
        first_name: z.string().trim().min(1, t("auth.nameRequired")).max(100),
        last_name: z.string().trim().min(1, t("auth.lastNameRequired")).max(100),
        phone: z.string().max(30).optional(),
      }),
    [t],
  );
  const passwordSchema = useMemo(
    () =>
      z.object({
        current_password: z.string().min(1, t("settings.currentPasswordRequired")),
        new_password: z.string().min(8, t("auth.passwordMin")),
      }),
    [t],
  );
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
      toast.success(t("settings.profileUpdated"));
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
      toast.success(t("settings.passwordChanged"));
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
        <PageHeader title={t("settings.title")} description={t("settings.hint")} />
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
        <PageHeader title={t("settings.title")} description={t("settings.hint")} />
        <ErrorState error={meQuery.error} onRetry={() => void meQuery.refetch()} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={t("settings.title")} description={t("settings.hint")} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.personal")}</CardTitle>
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
                <Label>{t("auth.firstName")}</Label>
                <Input maxLength={100} {...profileForm.register("first_name")} />
                {profileForm.formState.errors.first_name ? (
                  <p className="text-sm text-destructive">
                    {profileForm.formState.errors.first_name.message}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label>{t("auth.lastName")}</Label>
                <Input maxLength={100} {...profileForm.register("last_name")} />
                {profileForm.formState.errors.last_name ? (
                  <p className="text-sm text-destructive">
                    {profileForm.formState.errors.last_name.message}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label>{t("auth.phone")}</Label>
                <Input maxLength={30} {...profileForm.register("phone")} />
                {profileForm.formState.errors.phone ? (
                  <p className="text-sm text-destructive">
                    {profileForm.formState.errors.phone.message}
                  </p>
                ) : null}
              </div>
              <Button type="submit" disabled={profileMutation.isPending}>
                {profileMutation.isPending ? t("common.saving") : t("common.save")}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.password")}</CardTitle>
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
                <Label>{t("settings.currentPassword")}</Label>
                <Input type="password" {...passwordForm.register("current_password")} />
                {passwordForm.formState.errors.current_password ? (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.current_password.message}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label>{t("settings.newPassword")}</Label>
                <Input type="password" {...passwordForm.register("new_password")} />
                {passwordForm.formState.errors.new_password ? (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.new_password.message}
                  </p>
                ) : null}
              </div>
              <Button type="submit" disabled={passwordMutation.isPending}>
                {passwordMutation.isPending ? t("settings.updating") : t("settings.updatePassword")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
