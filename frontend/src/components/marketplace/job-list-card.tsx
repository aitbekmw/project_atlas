import { MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/users/user-avatar";
import { useI18n } from "@/i18n/locale-context";
import { jobStatusKey } from "@/i18n/status";
import { formatRating } from "@/lib/marketplace";
import { cn, formatDistanceKm, formatMoneyKgs, fullName } from "@/lib/utils";
import type { Job, JobStatus, User } from "@/types/api";

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
  customer?: User | null;
  customerRating?: number;
}

export function MarketplaceJobCard({
  job,
  categoryName,
  href,
  layout = "list",
  active = false,
  distanceKm,
  customer,
  customerRating,
}: MarketplaceJobCardProps) {
  const { t } = useI18n();
  const to = href ?? `/jobs/${job.id}`;
  const compact = layout === "horizontal";

  return (
    <article
      className={cn(
        "min-w-0 rounded-2xl border bg-card px-3 py-2.5 transition-colors duration-200 hover:border-primary/30 hover:bg-card-hover sm:px-3.5 sm:py-3",
        active && "border-primary ring-2 ring-primary/15",
      )}
    >
      <Link to={to} className="block min-w-0">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="max-w-[70%] truncate">
            {categoryName ?? t("common.categoryFallback", { id: job.category_id })}
          </Badge>
          <Badge variant={statusVariant[job.status]}>{t(jobStatusKey(job.status))}</Badge>
        </div>
        <h3
          className={cn(
            "mt-1.5 min-w-0 break-words [overflow-wrap:anywhere] font-semibold leading-snug",
            compact ? "line-clamp-1 text-sm" : "line-clamp-1 text-sm sm:text-base",
          )}
        >
          {job.title}
        </h3>
        <p className="mt-1 line-clamp-2 break-words [overflow-wrap:anywhere] text-xs text-muted-foreground sm:text-sm">
          {job.description}
        </p>
        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <p className="max-w-full break-words text-sm font-bold text-primary [overflow-wrap:anywhere] sm:text-base">
            {formatMoneyKgs(job.salary)}
          </p>
          <span className="inline-flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="min-w-0 truncate">{job.city}</span>
            {distanceKm != null ? <span className="shrink-0">{formatDistanceKm(distanceKm)}</span> : null}
          </span>
        </div>
      </Link>
      {customer ? (
        <Link
          to={`/users/${customer.id}`}
          className="mt-2 flex min-h-10 items-center gap-2 border-t pt-2 text-sm hover:text-primary"
        >
          <UserAvatar user={customer} className="h-7 w-7" />
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] tracking-wide text-muted-foreground">
              {t("job.owner")}
            </span>
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate font-medium">{fullName(customer)}</span>
              {customerRating != null ? (
                <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-muted-foreground">
                  <Star className="h-3 w-3 fill-primary text-primary" />
                  {formatRating(customerRating)}
                </span>
              ) : null}
            </span>
          </span>
        </Link>
      ) : null}
    </article>
  );
}
