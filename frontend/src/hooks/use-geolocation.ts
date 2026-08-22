import { useCallback, useState } from "react";

import type { LngLat } from "@/lib/geocode";

export type GeoStatus = "idle" | "pending" | "granted" | "denied" | "unavailable";

export function useGeolocation() {
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [coords, setCoords] = useState<LngLat | null>(null);

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }
    setStatus("pending");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords([position.coords.longitude, position.coords.latitude]);
        setStatus("granted");
      },
      (error) => {
        setStatus(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
    );
  }, []);

  return { status, coords, request };
}
