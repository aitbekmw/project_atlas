function trimSlash(value: string): string {
  return value.replace(/\/$/, "");
}

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

/**
 * Same-origin `/api` by default (Vite proxy or nginx).
 * Set VITE_API_URL to an absolute URL only when the API is on another host.
 */
export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.trim();
  if (fromEnv && isAbsoluteUrl(fromEnv)) {
    return trimSlash(fromEnv);
  }
  if (fromEnv) {
    const path = fromEnv.startsWith("/") ? fromEnv : `/${fromEnv}`;
    return trimSlash(path) || "/api";
  }
  return "/api";
}

export function getWsBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_WS_URL?.trim();
  if (fromEnv) {
    return trimSlash(fromEnv);
  }

  if (typeof window !== "undefined" && window.location?.host) {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}`;
  }

  const api = getApiBaseUrl();
  if (isAbsoluteUrl(api)) {
    if (api.startsWith("https://")) {
      return `wss://${api.slice("https://".length)}`;
    }
    return `ws://${api.slice("http://".length)}`;
  }
  return "";
}
