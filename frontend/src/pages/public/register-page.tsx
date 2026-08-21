import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { Logo } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { useI18n } from "@/i18n/locale-context";
import { getErrorMessage } from "@/lib/utils";

type Values = {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone?: string;
  password: string;
  role: "customer" | "worker";
};

export function RegisterPage() {
  const { t } = useI18n();
  const schema = useMemo(
    () =>
      z.object({
        first_name: z.string().trim().min(1, t("auth.nameRequired")).max(100),
        last_name: z.string().trim().min(1, t("auth.lastNameRequired")).max(100),
        username: z.string().trim().min(3, t("auth.usernameMin")).max(50, t("auth.usernameMax")),
        email: z.string().email(t("auth.emailInvalid")),
        phone: z.string().max(30).optional(),
        password: z.string().min(8, t("auth.passwordMin")),
        role: z.enum(["customer", "worker"]),
      }),
    [t],
  );
  const { register } = useAuth();
  const navigate = useNavigate();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: "",
      last_name: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      role: "worker",
    },
  });

  return (
    <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-lg items-center px-4 py-12">
      <Card className="w-full">
        <CardHeader className="items-center text-center">
          <Logo />
          <CardTitle className="mt-4">{t("auth.registerTitle")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("auth.registerSubtitle")}
          </p>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            onSubmit={form.handleSubmit(async (values) => {
              try {
                await register({
                  ...values,
                  phone: values.phone || null,
                });
                toast.success(t("auth.created"));
                navigate("/app/dashboard");
              } catch (error) {
                const message = getErrorMessage(error);
                form.setError("root", { message });
                toast.error(message);
              }
            })}
          >
            {form.formState.errors.root ? (
              <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>{t("auth.firstName")}</Label>
                <Input {...form.register("first_name")} />
                {form.formState.errors.first_name ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.first_name.message}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label>{t("auth.lastName")}</Label>
                <Input {...form.register("last_name")} />
                {form.formState.errors.last_name ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.last_name.message}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>{t("auth.username")}</Label>
              <Input {...form.register("username")} />
              {form.formState.errors.username ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.username.message}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label>{t("auth.email")}</Label>
              <Input type="email" {...form.register("email")} />
              {form.formState.errors.email ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label>{t("auth.phone")}</Label>
              <Input {...form.register("phone")} />
            </div>
            <div className="grid gap-2">
              <Label>{t("auth.password")}</Label>
              <Input type="password" {...form.register("password")} />
              {form.formState.errors.password ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.password.message}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label>{t("auth.role")}</Label>
              <select
                className="flex min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                {...form.register("role")}
              >
                <option value="worker">{t("role.worker")}</option>
                <option value="customer">{t("role.customer")}</option>
              </select>
            </div>
            <Button type="submit" className="h-11" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? t("auth.creating") : t("auth.create")}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("auth.hasAccount")}{" "}
            <Link to="/login" className="font-semibold text-primary">
              {t("nav.login")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
