import { Link } from "react-router-dom";

import { Logo } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/i18n/locale-context";
import type { MessageKey } from "@/i18n/messages";

function LegalPage({ titleKey, bodyKey }: { titleKey: MessageKey; bodyKey: MessageKey }) {
  const { t } = useI18n();
  return (
    <div className="mx-auto w-full max-w-2xl overflow-x-hidden px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:py-12">
      <Card className="min-w-0">
        <CardHeader className="items-center text-center">
          <Logo />
          <CardTitle className="mt-4">{t(titleKey)}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <p className="text-sm leading-6 text-muted-foreground">{t(bodyKey)}</p>
          <Button asChild variant="outline" className="min-h-11 w-full sm:w-auto">
            <Link to="/register">{t("nav.register")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function TermsPage() {
  return <LegalPage titleKey="legal.termsTitle" bodyKey="legal.termsBody" />;
}

export function PrivacyPage() {
  return <LegalPage titleKey="legal.privacyTitle" bodyKey="legal.privacyBody" />;
}
