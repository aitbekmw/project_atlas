import * as SheetPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useEffect, type ComponentProps } from "react";

import { useI18n } from "@/i18n/locale-context";
import { cn } from "@/lib/utils";

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;

function SheetContent({
  className,
  children,
  side = "left",
  ...props
}: ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "left" | "right";
}) {
  const { t } = useI18n();
  useEffect(() => {
    return () => {
      document.body.style.removeProperty("overflow");
      document.body.style.removeProperty("pointer-events");
    };
  }, []);
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-[80] bg-foreground/40" />
      <SheetPrimitive.Content
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
          "fixed z-[81] flex h-dvh max-h-dvh w-[min(20rem,100vw)] flex-col overflow-y-auto bg-background pb-[env(safe-area-inset-bottom,0px)] pt-[env(safe-area-inset-top,0px)] text-foreground shadow-lg",
          side === "left" ? "left-0 top-0" : "right-0 top-0",
          className,
        )}
      >
        {children}
        <SheetPrimitive.Close className="absolute right-4 top-[calc(env(safe-area-inset-top,0px)+1rem)] z-[81] flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground" aria-label={t("common.closeMenu")}>
          <X className="h-5 w-5" />
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

export { Sheet, SheetClose, SheetContent, SheetTrigger };
