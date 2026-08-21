function trimSlash(value: string): string {
  return value.replace(/\/$/, "");
}

export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.trim();
  if (fromEnv) {
    return trimSlash(fromEnv);
  }
  if (import.meta.env.DEV) {
    return "http://localhost:8001";
  }
  throw new Error("VITE_API_URL must be set for production builds");
}

export function getWsBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_WS_URL?.trim();
  if (fromEnv) {
    return trimSlash(fromEnv);
  }
  const api = getApiBaseUrl();
  if (api.startsWith("https://")) {
    return `wss://${api.slice("https://".length)}`;
  }
  if (api.startsWith("http://")) {
    return `ws://${api.slice("http://".length)}`;
  }
  return api;
}
