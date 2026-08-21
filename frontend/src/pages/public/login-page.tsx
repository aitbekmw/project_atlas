import { zodResolver } from "@hookform/resolvers/zod";
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

const schema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(8, "Минимум 8 символов"),
});

type Values = z.infer<typeof schema>;

export function LoginPage() {
  const { t } = useI18n();
  const { login } = useAuth();
  const navigate = useNavigate();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-md items-center px-4 py-12">
      <Card className="w-full">
        <CardHeader className="items-center text-center">
          <Logo />
          <CardTitle className="mt-4">{t("auth.loginTitle")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("auth.loginSubtitle")}
          </p>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            onSubmit={form.handleSubmit(async (values) => {
              try {
                await login(values);
                toast.success(t("auth.welcome"));
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
            <div className="grid gap-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" {...form.register("email")} />
              {form.formState.errors.email ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input id="password" type="password" {...form.register("password")} />
              {form.formState.errors.password ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.password.message}
                </p>
              ) : null}
            </div>
            <Button type="submit" className="h-11" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? t("auth.signingIn") : t("auth.signIn")}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("auth.needAccount")}{" "}
            <Link to="/register" className="font-semibold text-primary">
              {t("nav.register")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
