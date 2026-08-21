import * as SheetPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentProps } from "react";

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
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/40" />
      <SheetPrimitive.Content
        className={cn(
          "fixed z-50 flex h-full w-80 flex-col bg-background text-foreground shadow-lg",
          side === "left" ? "left-0 top-0" : "right-0 top-0",
          className,
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="absolute right-4 top-4 text-muted-foreground" aria-label={t("common.closeMenu")}>
          <X className="h-4 w-4" />
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

export { Sheet, SheetClose, SheetContent, SheetTrigger };
