import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { resendVerification, verifyEmail } from "@/api/auth";
import { Logo } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpInput } from "@/components/ui/otp-input";
import { useI18n } from "@/i18n/locale-context";
import { getErrorMessage, getHttpStatus, getRetryAfter } from "@/lib/utils";

const RESEND_SECONDS = 60;

export function VerifyEmailPage() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const email = (params.get("email") ?? "").trim().toLowerCase();
  const [emailDraft, setEmailDraft] = useState(email);
  const [code, setCode] = useState("");
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (seconds <= 0) {
      return;
    }
    const timer = window.setInterval(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearInterval(timer);
  }, [seconds]);

  function mapVerifyError(caught: unknown): string {
    const status = getHttpStatus(caught);
    const detailMessage = getErrorMessage(caught);
    if (status === 404) {
      return t("verify.emailNotFound");
    }
    if (detailMessage === t("error.invalidCode")) {
      return t("verify.invalidCode");
    }
    if (detailMessage === t("error.codeExpired")) {
      return t("verify.expired");
    }
    if (detailMessage === t("error.emailAlreadyVerified")) {
      return t("verify.alreadyVerified");
    }
    if (status === 429) {
      return t("verify.tooSoon", { seconds: getRetryAfter(caught) ?? (seconds || RESEND_SECONDS) });
    }
    return detailMessage;
  }

  if (!email) {
    return (
      <div className="mx-auto w-full max-w-md overflow-x-hidden px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:py-12">
        <Card className="w-full min-w-0">
          <CardHeader className="items-center text-center">
            <Logo />
            <CardTitle className="mt-4">{t("verify.title")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("verify.enterEmail")}</p>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                const next = emailDraft.trim().toLowerCase();
                if (!next) {
                  return;
                }
                setParams({ email: next });
              }}
            >
              <div className="grid gap-2">
                <Label htmlFor="verify-email">{t("register.email")}</Label>
                <Input
                  id="verify-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={emailDraft}
                  onChange={(event) => setEmailDraft(event.target.value)}
                  placeholder={t("register.placeholderEmail")}
                />
              </div>
              <Button type="submit" className="h-12 w-full">
                {t("verify.continue")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mx-auto w-full max-w-md overflow-x-hidden px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:py-12">
        <Card className="w-full min-w-0">
          <CardHeader className="items-center text-center">
            <Logo />
            <CardTitle className="mt-4">{t("verify.success")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("verify.registrationComplete")}</p>
          </CardHeader>
          <CardContent>
            <Button className="h-12 w-full" onClick={() => navigate("/login")}>
              {t("verify.login")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md overflow-x-hidden px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:py-12">
      <Card className="w-full min-w-0">
        <CardHeader className="items-center text-center">
          <Logo />
          <CardTitle className="mt-4">{t("verify.title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("verify.description")}</p>
          <p className="break-all text-sm font-semibold">{email}</p>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!/^\d{6}$/.test(code)) {
                setError(t("verify.invalidCode"));
                return;
              }
              setSubmitting(true);
              try {
                await verifyEmail(email, code);
                setSuccess(true);
                toast.success(t("verify.success"));
              } catch (caught) {
                const message = mapVerifyError(caught);
                setError(message);
                toast.error(message);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {error ? (
              <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
            ) : null}
            <div className="grid min-w-0 gap-2">
              <Label htmlFor="otp-0">{t("verify.code")}</Label>
              <OtpInput id="otp-0" value={code} onChange={setCode} disabled={submitting} />
            </div>
            <Button type="submit" className="h-12 w-full" disabled={submitting}>
              {submitting ? t("verify.submitting") : t("verify.submit")}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">{t("verify.didNotGet")}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-2 min-h-11 w-full"
            disabled={seconds > 0}
            onClick={async () => {
              try {
                await resendVerification(email);
                setSeconds(RESEND_SECONDS);
                setError(null);
                toast.success(t("verify.resent"));
              } catch (caught) {
                const status = getHttpStatus(caught);
                if (status === 429) {
                  const wait = getRetryAfter(caught) ?? RESEND_SECONDS;
                  setSeconds(wait);
                  setError(t("verify.tooSoon", { seconds: wait }));
                  toast.error(t("verify.tooSoon", { seconds: wait }));
                  return;
                }
                toast.error(mapVerifyError(caught));
              }
            }}
          >
            {seconds > 0 ? t("verify.resendCountdown", { seconds }) : t("verify.resend")}
          </Button>
          {import.meta.env.DEV ? (
            <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">{t("register.devHint")}</p>
          ) : null}
          <p className="mt-4 text-center text-sm">
            <Link to="/login" className="font-semibold text-primary">
              {t("nav.login")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
