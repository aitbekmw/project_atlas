import * as SheetPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useEffect, type ComponentProps } from "react";

import { useI18n } from "@/i18n/locale-context";
import { lockBodyScroll } from "@/lib/body-scroll-lock";
import { cn } from "@/lib/utils";

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;

function SheetOverlay({
  className,
  ...props
}: ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-[80] bg-foreground/40 duration-300",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
        "motion-reduce:animate-none motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = "left",
  ...props
}: ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "left" | "right";
}) {
  const { t } = useI18n();

  useEffect(() => lockBodyScroll(), []);

  return (
    <SheetPrimitive.Portal>
      <SheetOverlay />
      <SheetPrimitive.Content
        aria-modal="true"
        {...props}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          props.onOpenAutoFocus?.(event);
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          props.onCloseAutoFocus?.(event);
        }}
        className={cn(
          "fixed z-[81] flex h-dvh max-h-dvh w-[min(20rem,100vw)] max-w-full flex-col overflow-y-auto overscroll-contain bg-background pb-[env(safe-area-inset-bottom,0px)] pt-[env(safe-area-inset-top,0px)] text-foreground shadow-lg outline-none duration-300",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          side === "left"
            ? "left-0 top-0 data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left"
            : "right-0 top-0 data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
          "motion-reduce:animate-none motion-reduce:transition-none",
          className,
        )}
      >
        <SheetPrimitive.Title className="sr-only">{t("nav.menu")}</SheetPrimitive.Title>
        <SheetPrimitive.Description className="sr-only">
          {t("nav.menu")}
        </SheetPrimitive.Description>
        {children}
        <SheetPrimitive.Close
          className="absolute right-4 top-[calc(env(safe-area-inset-top,0px)+1rem)] z-[81] flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t("common.closeMenu")}
        >
          <X className="h-5 w-5" />
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

export { Sheet, SheetClose, SheetContent, SheetTrigger };
