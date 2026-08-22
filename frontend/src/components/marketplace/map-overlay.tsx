import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/locale-context";
import type { MessageKey } from "@/i18n/messages";
import { distanceKm, type LngLat } from "@/lib/geocode";
import { cn, formatDistanceKm, formatMoneyKgs } from "@/lib/utils";
import type { Job } from "@/types/api";

interface MapOverlayProps {
  jobs: Job[];
  coords: Record<number, LngLat>;
  origin: LngLat;
  categoryNames?: Record<number, string>;
  jobHref?: (job: Job) => string;
  showFooter?: boolean;
}

interface OverlaySlot {
  left: string;
  top: string;
}

const OVERLAY_SLOTS: OverlaySlot[] = [
  { left: "8%", top: "14%" },
  { left: "58%", top: "12%" },
  { left: "62%", top: "38%" },
  { left: "10%", top: "48%" },
  { left: "42%", top: "62%" },
];

/**
 * Decorative specialist chips used only when the jobs API has no open items.
 * Not job records and never mixed into API state.
 */
const DEMO_SPECIALISTS: { roleKey: MessageKey; km: number }[] = [
  { roleKey: "map.role.courier", km: 0.8 },
  { roleKey: "map.role.electrician", km: 1.1 },
  { roleKey: "map.role.plumber", km: 3.2 },
  { roleKey: "sysCategory.repair", km: 2.4 },
];

function Chip({
  className,
  style,
  children,
}: {
  className?: string;
  style: OverlaySlot;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "pointer-events-auto absolute max-w-[46%] rounded-xl border bg-card/95 px-2.5 py-1.5 text-xs font-semibold leading-snug text-foreground shadow-sm backdrop-blur-sm sm:max-w-[42%]",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}

export function MapOverlay({
  jobs,
  coords,
  origin,
  categoryNames,
  jobHref = (job) => `/jobs/${job.id}`,
  showFooter = true,
}: MapOverlayProps) {
  const { t } = useI18n();
  const realJobs = jobs.slice(0, OVERLAY_SLOTS.length);
  const useDemo = realJobs.length === 0;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      <CenterPin label={t("map.youAreHere")} />

      {useDemo
        ? DEMO_SPECIALISTS.map((item, index) => (
            <Chip
              key={item.roleKey}
              style={OVERLAY_SLOTS[index]}
              className={index > 2 ? "max-sm:hidden" : undefined}
            >
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3 w-3 shrink-0 text-primary" />
                <span className="truncate">{t(item.roleKey)}</span>
                <span className="font-medium text-muted-foreground">
                  · {formatDistanceKm(item.km)}
                </span>
              </span>
            </Chip>
          ))
        : realJobs.map((job, index) => (
            <Chip
              key={job.id}
              style={OVERLAY_SLOTS[index]}
              className={index > 2 ? "max-sm:hidden" : undefined}
            >
              <JobChip
                job={job}
                href={jobHref(job)}
                categoryName={categoryNames?.[job.category_id]}
                distance={
                  coords[job.id] ? distanceKm(origin, coords[job.id]) : null
                }
              />
            </Chip>
          ))}

      {showFooter ? (
        <div className="pointer-events-auto absolute inset-x-3 bottom-3 flex min-h-11 items-center justify-between gap-2 rounded-2xl border bg-card/95 px-3 py-2 shadow-sm backdrop-blur-sm">
          <p className="min-w-0 truncate text-xs text-muted-foreground">
            {useDemo
              ? t("map.demoHint")
              : t("map.jobsNearby", { count: jobs.length })}
          </p>
          <Button asChild size="sm" className="h-9 shrink-0">
            <Link to="/jobs">{t("map.viewOnMap")}</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function JobChip({
  job,
  href,
  categoryName,
  distance,
}: {
  job: Job;
  href: string;
  categoryName?: string;
  distance: number | null;
}) {
  return (
    <Link to={href} className="block min-w-0">
      <span className="block truncate text-[11px] font-bold text-primary">
        {formatMoneyKgs(job.salary)}
      </span>
      <span className="mt-0.5 flex items-center gap-1 truncate font-medium text-muted-foreground">
        <MapPin className="h-3 w-3 shrink-0 text-primary" />
        <span className="truncate">{categoryName ?? job.title}</span>
        {distance != null ? (
          <span>· {formatDistanceKm(distance)}</span>
        ) : null}
      </span>
    </Link>
  );
}

function CenterPin({ label }: { label: string }) {
  return (
    <div
      className="absolute left-1/2 top-[42%] z-20 -translate-x-1/2 -translate-y-1/2"
      aria-label={label}
    >
      <span className="absolute -inset-3 animate-ping rounded-full bg-primary/25" />
      <span className="relative flex h-4 w-4 items-center justify-center rounded-full border-2 border-background bg-primary shadow-sm" />
    </div>
  );
}

export function MapFallbackCanvas() {
  return (
    <div className="map-fallback-canvas absolute inset-0" aria-hidden>
      <svg viewBox="0 0 400 400" className="h-full w-full opacity-70">
        <path
          d="M20 90 H380 M40 160 H360 M0 230 H400 M60 300 H340"
          stroke="currentColor"
          strokeWidth="6"
          className="text-[color:var(--map-road)]"
          fill="none"
        />
        <path
          d="M90 0 V400 M170 20 V380 M250 0 V400 M330 40 V360"
          stroke="currentColor"
          strokeWidth="5"
          className="text-[color:var(--map-road)]"
          fill="none"
        />
        <rect x="118" y="118" width="70" height="48" rx="8" fill="var(--map-park)" />
        <rect x="248" y="188" width="86" height="56" rx="8" fill="var(--map-block)" />
      </svg>
    </div>
  );
}
