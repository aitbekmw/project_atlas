import { Clock, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/i18n/locale-context";
import { jobStatusKey, paymentMethodKey } from "@/i18n/status";
import { cn, formatDate, formatDistanceKm, formatMoneyKgs } from "@/lib/utils";
import type { Job, JobStatus } from "@/types/api";

const statusVariant: Record<JobStatus, "success" | "warning" | "secondary" | "danger"> = {
  OPEN: "success",
  IN_PROGRESS: "warning",
  COMPLETED: "secondary",
  CANCELLED: "danger",
};

interface MarketplaceJobCardProps {
  job: Job;
  categoryName?: string;
  href?: string;
  layout?: "list" | "tile" | "horizontal";
  active?: boolean;
  distanceKm?: number;
}

export function MarketplaceJobCard({
  job,
  categoryName,
  href,
  layout = "list",
  active = false,
  distanceKm,
}: MarketplaceJobCardProps) {
  const { t } = useI18n();
  const to = href ?? `/jobs/${job.id}`;
  const compact = layout === "horizontal";

  return (
    <Link
      to={to}
      className={cn(
        "block min-w-0 rounded-2xl border bg-card p-3.5 transition-colors duration-200 hover:border-primary/30 hover:bg-card-hover sm:p-4",
        active && "border-primary ring-2 ring-primary/15",
        layout === "horizontal" && "min-w-0",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <Badge variant="secondary">
          {categoryName ?? t("common.categoryFallback", { id: job.category_id })}
        </Badge>
        <Badge variant={statusVariant[job.status]}>{t(jobStatusKey(job.status))}</Badge>
      </div>
      <h3 className={cn("mt-2 min-w-0 break-words font-semibold leading-snug sm:mt-3", compact ? "text-sm sm:text-base" : "text-base sm:text-lg")}>
        {job.title}
      </h3>
      {layout === "tile" ? (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{job.description}</p>
      ) : null}
      <p className="mt-2 text-base font-bold text-primary sm:mt-3 sm:text-lg">
        {formatMoneyKgs(job.salary)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{t(paymentMethodKey(job.payment_method))}</p>
      <div className="mt-3 flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex min-w-0 items-center gap-1 break-words">
          <MapPin className="h-3.5 w-3.5" />
          {job.city}
          {job.address ? ` · ${job.address}` : ""}
        </span>
        {distanceKm != null ? (
          <span>{formatDistanceKm(distanceKm)}</span>
        ) : null}
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {formatDate(job.created_at)}
        </span>
      </div>
    </Link>
  );
}
