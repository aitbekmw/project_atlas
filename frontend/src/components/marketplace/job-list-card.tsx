import { Clock, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { cn, formatDate, formatMoney } from "@/lib/utils";
import { JOB_STATUS_LABEL, type Job, type JobStatus } from "@/types/api";

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
}

export function MarketplaceJobCard({
  job,
  categoryName,
  href,
  layout = "list",
  active = false,
}: MarketplaceJobCardProps) {
  const to = href ?? `/jobs/${job.id}`;
  const compact = layout === "horizontal";

  return (
    <Link
      to={to}
      className={cn(
        "block rounded-2xl border bg-card p-4 transition-colors duration-200 hover:border-primary/30 hover:bg-card-hover",
        active && "border-primary ring-2 ring-primary/15",
        layout === "horizontal" && "min-w-[280px] snap-start",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <Badge variant="secondary">{categoryName ?? `Категория #${job.category_id}`}</Badge>
        <Badge variant={statusVariant[job.status]}>{JOB_STATUS_LABEL[job.status]}</Badge>
      </div>
      <h3 className={cn("mt-3 font-semibold leading-snug", compact ? "text-base" : "text-lg")}>
        {job.title}
      </h3>
      {layout === "tile" ? (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{job.description}</p>
      ) : null}
      <p className="mt-3 text-lg font-bold text-primary">{formatMoney(job.salary)}</p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {job.city}
          {job.address ? ` · ${job.address}` : ""}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {formatDate(job.created_at)}
        </span>
      </div>
    </Link>
  );
}
