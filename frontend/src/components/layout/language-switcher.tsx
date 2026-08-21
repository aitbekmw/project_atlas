import { LOCALES, type Locale } from "@/i18n/messages";
import { useI18n } from "@/i18n/locale-context";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className={cn("inline-flex min-h-9 items-center", className)}>
      <span className="sr-only">{t("lang.label")}</span>
      <select
        aria-label={t("lang.label")}
        className="h-9 max-w-[9.5rem] rounded-full border border-input bg-background px-2.5 text-xs font-medium text-foreground sm:max-w-none sm:px-3 sm:text-sm"
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
      >
        {LOCALES.map((item) => (
          <option key={item.id} value={item.id}>
            {item.nativeLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
