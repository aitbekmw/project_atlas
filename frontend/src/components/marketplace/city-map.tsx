import { load } from "@2gis/mapgl";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { MapFallbackCanvas, MapOverlay } from "@/components/marketplace/map-overlay";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/locale-context";
import { paymentMethodKey } from "@/i18n/status";
import { geocodeJobs, storedJobCoords, type LngLat } from "@/lib/geocode";
import { queryKeys } from "@/lib/query-keys";
import { cn, formatDistanceKm, formatMoneyKgs } from "@/lib/utils";
import type { Job } from "@/types/api";

type MapglApi = Awaited<ReturnType<typeof load>>;
type MapglMap = InstanceType<MapglApi["Map"]>;
type MapglMarker = InstanceType<MapglApi["Marker"]>;

interface CityMapProps {
  jobs: Job[];
  selectedJobId?: number | null;
  activeId?: number | null;
  onJobSelect?: (job: Job) => void;
  onSelect?: (job: Job) => void;
  jobHref?: (job: Job) => string;
  className?: string;
  showCards?: boolean;
  showOverlay?: boolean;
  showFooter?: boolean;
  categoryNames?: Record<number, string>;
  userLocation?: LngLat | null;
}

const API_KEY = import.meta.env.VITE_2GIS_API_KEY ?? "";

/** Camera only when no job was geocoded. Not a job marker. */
export const EMPTY_VIEW: LngLat = [74.5698, 42.8746];

function markerIcon(selected: boolean): string {
  const fill = selected ? "#0f6ae8" : "#1677ff";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
    <path fill="${fill}" d="M18 0c9 0 16 7.2 16 16.2C34 28 18 44 18 44S2 28 2 16.2C2 7.2 9 0 18 0z"/>
    <circle cx="18" cy="16" r="6" fill="#ffffff"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function userMarkerIcon(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
    <circle cx="14" cy="14" r="12" fill="#1677ff" fill-opacity="0.18"/>
    <circle cx="14" cy="14" r="7" fill="#1677ff"/>
    <circle cx="14" cy="14" r="3" fill="#ffffff"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function CityMap({
  jobs,
  selectedJobId,
  activeId,
  onJobSelect,
  onSelect,
  jobHref = (job) => `/jobs/${job.id}`,
  className,
  showCards = true,
  showOverlay = false,
  showFooter = false,
  categoryNames,
  userLocation = null,
}: CityMapProps) {
  const { t } = useI18n();
  const selectedId = selectedJobId ?? activeId ?? null;
  const selectJob = onJobSelect ?? onSelect;
  const [mapReady, setMapReady] = useState(false);
  const [mapInteractive, setMapInteractive] = useState(false);
  const [coarsePointer, setCoarsePointer] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapglMap | null>(null);
  const apiRef = useRef<MapglApi | null>(null);
  const markersRef = useRef<MapglMarker[]>([]);
  const userMarkerRef = useRef<MapglMarker | null>(null);
  const fittedKeyRef = useRef("");
  const jobsRef = useRef(jobs);
  const selectRef = useRef(selectJob);
  jobsRef.current = jobs;
  selectRef.current = selectJob;

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const media = window.matchMedia("(pointer: coarse)");
    const update = () => setCoarsePointer(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const stored = useMemo(() => {
    const next: Record<number, LngLat> = {};
    for (const job of jobs) {
      const point = storedJobCoords(job);
      if (point) {
        next[job.id] = point;
      }
    }
    return next;
  }, [jobs]);
  const missing = jobs.filter((job) => !stored[job.id]);
  const coordKey = useMemo(
    () =>
      missing
        .map((job) => ({ id: job.id, city: job.city, address: job.address }))
        .sort((a, b) => a.id - b.id),
    [missing],
  );
  const coordsQuery = useQuery({
    queryKey: queryKeys.jobCoords(coordKey),
    queryFn: () => geocodeJobs(missing, API_KEY),
    enabled: Boolean(API_KEY) && missing.length > 0,
    staleTime: 30 * 60 * 1000,
  });
  const coords = { ...stored, ...(coordsQuery.data ?? {}) };
  const origin = userLocation ?? EMPTY_VIEW;
  const located = jobs.filter((job) => coords[job.id]);
  const selected = jobs.find((job) => job.id === selectedId) ?? located[0] ?? null;
  const selectedDistance =
    selected && coords[selected.id]
      ? (selected.distance_km ?? (userLocation ? distanceFrom(origin, coords[selected.id]) : null))
      : null;

  useEffect(() => {
    if (!API_KEY || !containerRef.current) {
      return;
    }

    let cancelled = false;

    void load().then((mapglAPI) => {
      if (cancelled || !containerRef.current || mapRef.current) {
        return;
      }
      apiRef.current = mapglAPI;
      mapRef.current = new mapglAPI.Map(containerRef.current, {
        key: API_KEY,
        center: EMPTY_VIEW,
        zoom: 12,
        enableTrackResize: true,
      });
      setMapReady(true);
    });

    return () => {
      cancelled = true;
      setMapReady(false);
      markersRef.current.forEach((marker) => marker.destroy());
      markersRef.current = [];
      userMarkerRef.current?.destroy();
      userMarkerRef.current = null;
      mapRef.current?.destroy();
      mapRef.current = null;
      apiRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const api = apiRef.current;
    if (!map || !api) {
      return;
    }

    markersRef.current.forEach((marker) => marker.destroy());
    markersRef.current = [];
    userMarkerRef.current?.destroy();
    userMarkerRef.current = null;

    const points: LngLat[] = [];
    if (userLocation) {
      points.push(userLocation);
      userMarkerRef.current = new api.Marker(map, {
        coordinates: userLocation,
        icon: userMarkerIcon(),
        size: [28, 28],
        anchor: [14, 14],
      });
    }

    for (const job of jobsRef.current) {
      const point = coords[job.id];
      if (!point) {
        continue;
      }
      points.push(point);
      const marker = new api.Marker(map, {
        coordinates: point,
        icon: markerIcon(job.id === selectedId),
        size: job.id === selectedId ? [40, 49] : [32, 39],
        anchor: job.id === selectedId ? [20, 49] : [16, 39],
        userData: job.id,
      });
      marker.on("click", () => {
        const current = jobsRef.current.find((item) => item.id === job.id);
        if (current) {
          selectRef.current?.(current);
        }
      });
      markersRef.current.push(marker);
    }

    const fitKey = `${userLocation?.join(",") ?? ""}|${points.map((point) => point.join(",")).join("|")}`;
    if (points.length === 1 && fittedKeyRef.current !== fitKey) {
      fittedKeyRef.current = fitKey;
      map.setCenter(points[0]);
      map.setZoom(14);
    } else if (points.length > 1 && fittedKeyRef.current !== fitKey) {
      fittedKeyRef.current = fitKey;
      const lngs = points.map((point) => point[0]);
      const lats = points.map((point) => point[1]);
      map.fitBounds(
        {
          southWest: [Math.min(...lngs), Math.min(...lats)],
          northEast: [Math.max(...lngs), Math.max(...lats)],
        },
        { padding: { top: 48, right: 48, bottom: 96, left: 48 } },
      );
    }
  }, [coords, selectedId, jobs, mapReady, userLocation]);

  return (
    <div
      className={cn(
        "relative z-0 min-h-[240px] w-full max-w-full overflow-hidden rounded-3xl border bg-surface",
        className,
      )}
    >
      {API_KEY ? (
        <div ref={containerRef} className="absolute inset-0" />
      ) : (
        <>
          <MapFallbackCanvas />
          <div className="absolute left-3 right-3 top-3 z-20 rounded-xl border bg-card/95 px-3 py-2 text-center shadow-sm backdrop-blur-sm">
            <p className="text-xs font-medium">{t("map.missing")}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{t("map.hint")}</p>
          </div>
        </>
      )}

      {API_KEY && coarsePointer && !mapInteractive ? (
        <div
          role="button"
          tabIndex={0}
          className="absolute inset-0 z-[15] flex touch-pan-y items-start justify-center bg-transparent pt-12"
          onClick={() => setMapInteractive(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setMapInteractive(true);
            }
          }}
          aria-label={t("map.interact")}
        >
          <span className="pointer-events-none rounded-full border bg-card/95 px-3 py-1.5 text-center text-xs font-medium shadow-sm">
            {t("map.interact")}
            <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
              {t("map.interactHint")}
            </span>
          </span>
        </div>
      ) : null}

      {API_KEY && coarsePointer && mapInteractive ? (
        <button
          type="button"
          className="absolute right-3 top-3 z-[30] min-h-9 rounded-full border bg-card/95 px-3 py-1.5 text-xs font-medium shadow-sm"
          onClick={() => setMapInteractive(false)}
        >
          {t("map.stopInteract")}
        </button>
      ) : null}

      {API_KEY && coordsQuery.isLoading ? (
        <div className="absolute left-4 top-4 z-20 rounded-xl border bg-card px-3 py-2 text-xs text-muted-foreground">
          {t("map.geocoding")}
        </div>
      ) : null}

      {API_KEY && !coordsQuery.isLoading && jobs.length > 0 && located.length === 0 ? (
        <div className="absolute left-4 top-4 z-20 rounded-xl border bg-card px-3 py-2 text-xs text-muted-foreground">
          {t("map.noCoords")}
        </div>
      ) : null}

      {showOverlay ? (
        <MapOverlay
          jobs={jobs}
          coords={coords}
          origin={origin}
          categoryNames={categoryNames}
          jobHref={jobHref}
          showFooter={showFooter}
        />
      ) : null}

      {showCards && selected && coords[selected.id] ? (
        <div className="absolute bottom-4 left-4 right-4 z-20 max-w-xs rounded-2xl border bg-card p-3 soft-shadow">
          <p className="text-xs font-medium text-primary">
            {categoryNames?.[selected.category_id] ?? selected.city}
            {selectedDistance != null ? ` · ${formatDistanceKm(selectedDistance)}` : ""}
          </p>
          <p className="mt-1 text-sm font-semibold leading-snug">{selected.title}</p>
          <p className="mt-2 text-sm font-bold text-primary">{formatMoneyKgs(selected.salary)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t(paymentMethodKey(selected.payment_method))}
          </p>
          <Button asChild size="sm" className="mt-3 min-h-10 w-full">
            <Link to={jobHref(selected)}>{t("map.openJob")}</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function distanceFrom(origin: LngLat, point: LngLat): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(point[1] - origin[1]);
  const dLng = toRad(point[0] - origin[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(origin[1])) * Math.cos(toRad(point[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}
