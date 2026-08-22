import { Link } from "react-router-dom";

import { Logo } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/i18n/locale-context";

export function ForgotPasswordPage() {
  const { t } = useI18n();
  return (
    <div className="mx-auto w-full max-w-md overflow-x-hidden px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:py-12">
      <Card className="min-w-0">
        <CardHeader className="items-center text-center">
          <Logo />
          <CardTitle className="mt-4">{t("forgot.title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("forgot.hint")}</p>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-sm leading-6 text-muted-foreground">{t("forgot.todo")}</p>
          <Button asChild className="min-h-11 w-full">
            <Link to="/login">{t("forgot.back")}</Link>
          </Button>
          <Button asChild variant="outline" className="min-h-11 w-full">
            <Link to="/verify-email">{t("auth.goToVerify")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
