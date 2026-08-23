import { LOCALES } from "@/i18n/messages";
import { useI18n } from "@/i18n/locale-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({
  className,
  variant = "header",
}: {
  className?: string;
  variant?: "header" | "panel";
}) {
  const { locale, setLocale, t } = useI18n();
  const current = LOCALES.find((item) => item.id === locale)?.nativeLabel ?? locale;

  if (variant === "panel") {
    return (
      <div className={cn("grid gap-2", className)}>
        <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("lang.label")}
        </p>
        <div className="grid gap-1">
          {LOCALES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                "min-h-11 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors duration-200",
                item.id === locale
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
              aria-pressed={item.id === locale}
              onClick={() => setLocale(item.id)}
            >
              {item.nativeLabel}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn("min-w-0 max-w-[9.5rem] truncate duration-200", className)}
          aria-label={t("lang.label")}
        >
          {current}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {LOCALES.map((item) => (
          <DropdownMenuItem
            key={item.id}
            className={cn(item.id === locale && "bg-secondary font-semibold")}
            onSelect={() => setLocale(item.id)}
            onClick={() => setLocale(item.id)}
          >
            {item.nativeLabel}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
