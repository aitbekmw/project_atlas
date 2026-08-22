import type { Job } from "@/types/api";

/** MapGL uses `[longitude, latitude]`. */
export type LngLat = [number, number];

interface GeocodeResponse {
  meta?: { code?: number };
  result?: {
    items?: Array<{
      point?: { lat: number; lon: number };
    }>;
  };
}

const cache = new Map<string, LngLat | null>();

function queryForJob(job: Job): string {
  return `${job.city}, ${job.address}`.replace(/\s+/g, " ").trim();
}

export async function geocodeAddress(query: string, key: string): Promise<LngLat | null> {
  const cached = cache.get(query);
  if (cached !== undefined) {
    return cached;
  }

  const url = new URL("https://catalog.api.2gis.com/3.0/items/geocode");
  url.searchParams.set("q", query);
  url.searchParams.set("fields", "items.point");
  url.searchParams.set("key", key);

  const response = await fetch(url.toString());
  if (!response.ok) {
    cache.set(query, null);
    return null;
  }

  const data = (await response.json()) as GeocodeResponse;
  const point = data.result?.items?.find((item) => item.point)?.point;
  const coords: LngLat | null =
    point && Number.isFinite(point.lon) && Number.isFinite(point.lat)
      ? [point.lon, point.lat]
      : null;

  cache.set(query, coords);
  return coords;
}

export function storedJobCoords(job: Pick<Job, "latitude" | "longitude">): LngLat | null {
  if (job.latitude == null || job.longitude == null) {
    return null;
  }
  return [job.longitude, job.latitude];
}

export async function geocodeJobs(
  jobs: Job[],
  key: string,
): Promise<Record<number, LngLat>> {
  const byId: Record<number, LngLat> = {};
  const unique = new Map<string, Job[]>();
  for (const job of jobs) {
    const stored = storedJobCoords(job);
    if (stored) {
      byId[job.id] = stored;
      continue;
    }
    const query = queryForJob(job);
    const list = unique.get(query) ?? [];
    list.push(job);
    unique.set(query, list);
  }

  const resolved = await Promise.all(
    [...unique.entries()].map(async ([query, group]) => {
      const coords = await geocodeAddress(query, key);
      return { group, coords };
    }),
  );

  for (const { group, coords } of resolved) {
    if (!coords) {
      continue;
    }
    for (const job of group) {
      byId[job.id] = coords;
    }
  }
  return byId;
}

/** Approximate distance in km between two MapGL `[lng, lat]` points. */
export function distanceKm(from: LngLat, to: LngLat): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(to[1] - from[1]);
  const dLng = toRad(to[0] - from[0]);
  const lat1 = toRad(from[1]);
  const lat2 = toRad(to[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}
