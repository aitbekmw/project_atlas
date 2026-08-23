import { useState, type ReactNode } from "react";

import { CityMap } from "@/components/marketplace/city-map";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/locale-context";
import type { LngLat } from "@/lib/geocode";
import { cn } from "@/lib/utils";
import type { Job } from "@/types/api";

interface JobsMapPanelProps {
  jobs: Job[];
  selectedJobId?: number | null;
  onJobSelect?: (job: Job) => void;
  jobHref?: (job: Job) => string;
  categoryNames?: Record<number, string>;
  userLocation?: LngLat | null;
  showCards?: boolean;
  showOverlay?: boolean;
  showFooter?: boolean;
  compact?: boolean;
  hideToggle?: boolean;
  className?: string;
}

/**
 * Desktop: list ~67% / map ~33%.
 * The aside stretches with the jobs column (sticky containing block).
 * The map itself is sticky and only as tall as the visible viewport, so it
 * stays filled on the right while the page scrolls, then releases at section end.
 */
export function MarketplaceSplit({
  list,
  map,
  fillViewport = false,
}: {
  list: ReactNode;
  map: ReactNode;
  fillViewport?: boolean;
}) {
  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
      <div className="min-w-0">{list}</div>
      <aside className="min-w-0">
        <div
          className={cn(
            "lg:sticky lg:top-[calc(var(--navbar-height)+0.75rem)] lg:z-0 lg:flex lg:flex-col lg:overflow-hidden",
            fillViewport
              ? "lg:h-[calc(100svh-var(--navbar-height)-1.5rem)]"
              : "lg:h-[min(34rem,calc(100svh-var(--navbar-height)-1.5rem))]",
          )}
        >
          {map}
        </div>
      </aside>
    </div>
  );
}

const MAP_HEIGHT = "h-[280px] w-full sm:h-[320px] lg:h-full";

export function JobsMapPanel({
  jobs,
  selectedJobId,
  onJobSelect,
  jobHref,
  categoryNames,
  userLocation,
  showCards = true,
  showOverlay = false,
  showFooter = false,
  hideToggle = false,
  className,
}: JobsMapPanelProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const mobileHidden = !hideToggle && !open;

  return (
    <div className={cn("z-0 flex min-w-0 w-full flex-col lg:h-full", className)}>
      {hideToggle ? null : (
        <Button
          type="button"
          variant="outline"
          className="mb-3 min-h-11 w-full lg:hidden"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? t("map.hideMap") : t("map.showJobsMap")}
        </Button>
      )}
      <div className={cn("min-h-0 lg:h-full", mobileHidden && "max-lg:hidden")}>
        <CityMap
          jobs={jobs}
          selectedJobId={selectedJobId}
          onJobSelect={onJobSelect}
          jobHref={jobHref}
          categoryNames={categoryNames}
          userLocation={userLocation}
          showCards={showCards}
          showOverlay={showOverlay}
          showFooter={showFooter}
          className={MAP_HEIGHT}
        />
      </div>
    </div>
  );
}
