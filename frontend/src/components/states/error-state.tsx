import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n, type TranslateFn } from "@/i18n/locale-context";
import { getErrorMessage, getHttpStatus } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  description?: string;
  error?: unknown;
  onRetry?: () => void;
}

const KNOWN_STATUSES = new Set([401, 403, 404, 500]);

function copyForStatus(
  t: TranslateFn,
  status?: number,
): { title: string; description: string } {
  if (status === 401) {
    return { title: t("error.authRequired"), description: t("error.authRequiredHint") };
  }
  if (status === 403) {
    return { title: t("error.forbidden"), description: t("error.forbiddenHint") };
  }
  if (status === 404) {
    return { title: t("error.notFound"), description: t("error.notFoundHint") };
  }
  if (status === 400) {
    return { title: t("error.badRequest"), description: t("error.badRequestHint") };
  }
  if (status === 409) {
    return { title: t("error.conflict"), description: t("error.conflictHint") };
  }
  if (status === 422) {
    return { title: t("error.validation"), description: t("error.validationHint") };
  }
  if (status === 500) {
    return { title: t("error.server"), description: t("error.serverHint") };
  }
  return { title: t("error.loadFailed"), description: t("error.network") };
}

export function ErrorState({
  title,
  description,
  error,
  onRetry,
}: ErrorStateProps) {
  const { t } = useI18n();
  const status = getHttpStatus(error);
  const fallback = copyForStatus(t, status);
  const detail = error ? getErrorMessage(error) : undefined;
  const useDetail =
    Boolean(detail) &&
    (status === 400 || status === 409 || status === 422 || (status != null && !KNOWN_STATUSES.has(status)));
  const resolvedDescription = description ?? (useDetail ? detail : fallback.description);

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-card px-6 py-16 text-center">
      <AlertCircle className="mb-3 h-8 w-8 text-destructive" />
      <h3 className="text-lg font-semibold">{title ?? fallback.title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{resolvedDescription}</p>
      {onRetry ? (
        <Button className="mt-5 min-h-11" variant="outline" onClick={onRetry}>
          {t("error.retry")}
        </Button>
      ) : null}
    </div>
  );
}
