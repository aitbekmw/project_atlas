import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { messages, type Locale, type MessageKey } from "@/i18n/messages";
import { setActiveLocale } from "@/lib/utils";

const STORAGE_KEY = "atlas.locale";

export type TranslateFn = (key: MessageKey, vars?: Record<string, string | number>) => string;

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslateFn;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    vars[name] === undefined ? `{${name}}` : String(vars[name]),
  );
}

function isLocale(value: string | null): value is Locale {
  return value === "ru" || value === "ky" || value === "en";
}

function readStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) {
      return stored;
    }
  } catch {
    /* private mode */
  }
  return "ru";
}

function persistLocale(next: Locale): void {
  setActiveLocale(next);
  if (typeof document !== "undefined") {
    document.documentElement.lang = next;
  }
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* ignore quota / private mode */
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const initial = readStoredLocale();
    persistLocale(initial);
    return initial;
  });

  useEffect(() => {
    persistLocale(locale);
  }, [locale]);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY || !isLocale(event.newValue)) {
        return;
      }
      persistLocale(event.newValue);
      setLocaleState(event.newValue);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    persistLocale(next);
    setLocaleState(next);
  }, []);

  const t = useCallback<TranslateFn>(
    (key, vars) => {
      const value = messages[locale][key];
      if (!value) {
        if (import.meta.env.DEV) {
          console.warn(`[i18n] missing key "${key}" for locale "${locale}"`);
        }
        return key;
      }
      return interpolate(value, vars);
    },
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useI18n must be used within LocaleProvider");
  }
  return context;
}
