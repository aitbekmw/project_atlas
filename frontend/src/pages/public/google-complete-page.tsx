import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { exchangeGoogleCode } from "@/api/auth";
import { Logo } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageSpinner } from "@/components/states/loading-state";
import { useAuth } from "@/context/auth-context";
import { useI18n } from "@/i18n/locale-context";

export function GoogleCompletePage() {
  const { t } = useI18n();
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const code = (params.get("code") ?? "").trim();

  useEffect(() => {
    if (!code) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        await exchangeGoogleCode(code);
        if (cancelled) {
          return;
        }
        await refreshUser();
        navigate("/app/dashboard", { replace: true });
      } catch (error) {
        if (cancelled) {
          return;
        }
        navigate("/login?error=google_failed", { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, navigate, refreshUser]);

  if (!code) {
    return (
      <div className="mx-auto w-full max-w-md overflow-x-hidden px-4 py-8 sm:py-12">
        <Card className="min-w-0">
          <CardHeader className="items-center text-center">
            <Logo />
            <CardTitle className="mt-4">{t("auth.googleFailed")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild className="h-12 w-full">
              <Link to="/login">{t("nav.login")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[50svh] items-center justify-center px-4">
      <PageSpinner />
    </div>
  );
}
