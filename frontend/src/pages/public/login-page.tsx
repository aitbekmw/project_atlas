import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { resendVerification } from "@/api/auth";
import { AuthDivider, GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Logo } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuth } from "@/context/auth-context";
import { useI18n } from "@/i18n/locale-context";
import type { MessageKey } from "@/i18n/messages";
import { getErrorMessage, getHttpStatus, getRetryAfter } from "@/lib/utils";

type Values = {
  email: string;
  password: string;
};

export function LoginPage() {
  const { t } = useI18n();
  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email(t("auth.emailInvalid")),
        password: z.string().min(1, t("auth.passwordMin")),
      }),
    [t],
  );
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);

  const googleErrors: Record<string, MessageKey> = {
    google_cancelled: "auth.googleCancelled",
    google_failed: "auth.googleFailed",
    google_email_not_verified: "auth.googleEmailNotVerified",
    google_email_exists: "auth.googleEmailExists",
    google_not_configured: "auth.googleNotConfigured",
  };
  const googleErrorKey = googleErrors[params.get("error") ?? ""] ?? null;

  useEffect(() => {
    if (resendSeconds <= 0) {
      return;
    }
    const timer = window.setInterval(() => setResendSeconds((value) => value - 1), 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const verifyPath = unverifiedEmail
    ? `/verify-email?email=${encodeURIComponent(unverifiedEmail)}`
    : "/verify-email";

  return (
    <div className="mx-auto w-full max-w-md overflow-x-hidden px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:py-12">
      <Card className="w-full min-w-0">
        <CardHeader className="items-center text-center">
          <Logo />
          <CardTitle className="mt-4">{t("auth.loginTitle")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("auth.loginSubtitle")}</p>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            onSubmit={form.handleSubmit(async (values) => {
              setUnverifiedEmail(null);
              try {
                await login(values);
                toast.success(t("auth.welcome"));
                navigate("/app/dashboard");
              } catch (error) {
                const message = getErrorMessage(error);
                if (getHttpStatus(error) === 403) {
                  const email = values.email.trim().toLowerCase();
                  setUnverifiedEmail(email);
                  form.setError("root", { message: t("auth.emailNotVerified") });
                  return;
                }
                form.setError("root", { message });
                toast.error(message);
              }
            })}
          >
            {form.formState.errors.root ? (
              <div className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <p>{form.formState.errors.root.message}</p>
                {unverifiedEmail ? (
                  <div className="mt-3 grid gap-2">
                    <Button asChild className="min-h-11 w-full">
                      <Link to={verifyPath}>{t("auth.goToVerify")}</Link>
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">{t("verify.didNotGet")}</p>
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 w-full"
                      disabled={resendSeconds > 0}
                      onClick={async () => {
                        try {
                          await resendVerification(unverifiedEmail);
                          setResendSeconds(60);
                          toast.success(t("verify.resent"));
                        } catch (caught) {
                          const wait = getRetryAfter(caught) ?? 60;
                          if (getHttpStatus(caught) === 429) {
                            setResendSeconds(wait);
                            toast.error(t("verify.tooSoon", { seconds: wait }));
                            return;
                          }
                          toast.error(getErrorMessage(caught));
                        }
                      }}
                    >
                      {resendSeconds > 0
                        ? t("verify.resendCountdown", { seconds: resendSeconds })
                        : t("verify.resend")}
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="grid min-w-0 gap-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                {...form.register("email")}
              />
              {form.formState.errors.email ? (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              ) : null}
            </div>
            <div className="grid min-w-0 gap-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                showLabel={t("register.showPassword")}
                hideLabel={t("register.hidePassword")}
                {...form.register("password")}
              />
              {form.formState.errors.password ? (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              ) : null}
            </div>
            <Button type="submit" className="h-12 w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? t("auth.signingIn") : t("auth.signIn")}
            </Button>
          </form>
          <div className="mt-4 grid gap-3">
            <AuthDivider />
            <GoogleAuthButton />
          </div>
          {googleErrorKey ? (
            <p className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {t(googleErrorKey)}
            </p>
          ) : null}
          <p className="mt-4 text-center text-sm">
            <Link to="/forgot-password" className="font-semibold text-primary">
              {t("auth.restorePassword")}
            </Link>
          </p>
          <p className="mt-3 text-center text-sm text-muted-foreground">
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
