import { load } from "@2gis/mapgl";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/locale-context";
import { geocodeJobs, type LngLat } from "@/lib/geocode";
import { queryKeys } from "@/lib/query-keys";
import { cn, formatMoney } from "@/lib/utils";
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
}

const API_KEY = import.meta.env.VITE_2GIS_API_KEY ?? "";

/** Camera only when no job was geocoded. Not a job marker. */
const EMPTY_VIEW: LngLat = [74.5698, 42.8746];

function markerIcon(selected: boolean): string {
  const fill = selected ? "#0f6ae8" : "#1677ff";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
    <path fill="${fill}" d="M18 0c9 0 16 7.2 16 16.2C34 28 18 44 18 44S2 28 2 16.2C2 7.2 9 0 18 0z"/>
    <circle cx="18" cy="16" r="6" fill="#ffffff"/>
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
}: CityMapProps) {
  const { t } = useI18n();
  const selectedId = selectedJobId ?? activeId ?? null;
  const selectJob = onJobSelect ?? onSelect;
  const [mapReady, setMapReady] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapglMap | null>(null);
  const apiRef = useRef<MapglApi | null>(null);
  const markersRef = useRef<MapglMarker[]>([]);
  const fittedKeyRef = useRef("");
  const jobsRef = useRef(jobs);
  const selectRef = useRef(selectJob);
  jobsRef.current = jobs;
  selectRef.current = selectJob;

  const coordKey = useMemo(
    () =>
      jobs
        .map((job) => ({ id: job.id, city: job.city, address: job.address }))
        .sort((a, b) => a.id - b.id),
    [jobs],
  );
  const coordsQuery = useQuery({
    queryKey: queryKeys.jobCoords(coordKey),
    queryFn: () => geocodeJobs(jobs, API_KEY),
    enabled: Boolean(API_KEY) && jobs.length > 0,
    staleTime: 30 * 60 * 1000,
  });
  const coords = coordsQuery.data ?? {};
  const located = jobs.filter((job) => coords[job.id]);
  const selected = jobs.find((job) => job.id === selectedId) ?? located[0] ?? null;

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

    const points: LngLat[] = [];
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

    const fitKey = points.map((point) => point.join(",")).join("|");
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
  }, [coords, selectedId, jobs, mapReady]);

  return (
    <div
      className={cn(
        "relative min-h-[280px] overflow-hidden rounded-3xl border bg-surface",
        className,
      )}
    >
      {API_KEY ? (
        <div ref={containerRef} className="absolute inset-0" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
          <MapPin className="h-6 w-6 text-primary" />
          <p className="text-sm font-medium">{t("map.missing")}</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            {t("map.hint")}
          </p>
        </div>
      )}

      {API_KEY && coordsQuery.isLoading ? (
        <div className="absolute left-4 top-4 rounded-xl border bg-card px-3 py-2 text-xs text-muted-foreground">
          {t("map.geocoding")}
        </div>
      ) : null}

      {API_KEY && !coordsQuery.isLoading && jobs.length > 0 && located.length === 0 ? (
        <div className="absolute left-4 top-4 rounded-xl border bg-card px-3 py-2 text-xs text-muted-foreground">
          {t("map.noCoords")}
        </div>
      ) : null}

      {showCards && selected && coords[selected.id] ? (
        <div className="absolute bottom-4 left-4 right-4 max-w-xs rounded-2xl border bg-card p-3 soft-shadow">
          <p className="text-xs font-medium text-primary">
            {selected.city}
            {selected.address ? ` · ${selected.address}` : ""}
          </p>
          <p className="mt-1 text-sm font-semibold leading-snug">{selected.title}</p>
          <p className="mt-2 text-sm font-bold text-primary">{formatMoney(selected.salary)}</p>
          <Button asChild size="sm" className="mt-3 w-full">
            <Link to={jobHref(selected)}>{t("map.openJob")}</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
