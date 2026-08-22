import { useState } from "react";
import { toast } from "sonner";

import { startGoogleLogin } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/locale-context";
import { getErrorMessage } from "@/lib/utils";

export function GoogleAuthButton() {
  const { t } = useI18n();
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      className="h-12 w-full min-w-0 max-w-full"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          const url = await startGoogleLogin();
          window.location.assign(url);
        } catch (error) {
          setPending(false);
          toast.error(getErrorMessage(error));
        }
      }}
    >
      <GoogleMark />
      <span className="truncate">{pending ? t("auth.googleRedirecting") : t("auth.continueWithGoogle")}</span>
    </Button>
  );
}

export function AuthDivider() {
  const { t } = useI18n();
  return (
    <div className="flex min-w-0 items-center gap-3 py-1">
      <span className="h-px min-w-0 flex-1 bg-border" />
      <span className="shrink-0 text-xs uppercase tracking-wide text-muted-foreground">
        {t("auth.or")}
      </span>
      <span className="h-px min-w-0 flex-1 bg-border" />
    </div>
  );
}

function GoogleMark() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.82-.07-1.64-.23-2.43H12v4.6h6.46a5.52 5.52 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.56-5.17 3.56-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.93l-3.87-3c-1.08.73-2.47 1.16-4.08 1.16-3.14 0-5.8-2.12-6.75-4.97H1.27v3.09A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.25 14.26A7.2 7.2 0 0 1 4.87 12c0-.79.14-1.55.38-2.26V6.65H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.35l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.33.6 4.57 1.78l3.43-3.43C17.95 1.19 15.24 0 12 0 7.31 0 3.2 2.69 1.27 6.65l3.98 3.09C6.2 6.87 8.86 4.75 12 4.75z"
      />
    </svg>
  );
}
