import { Briefcase, Inbox, MessageCircle, SearchX, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const icons = {
  jobs: Briefcase,
  inbox: Inbox,
  chat: MessageCircle,
  search: SearchX,
} as const;

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: keyof typeof icons | LucideIcon;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon = "inbox",
  action,
  className,
}: EmptyStateProps) {
  const Icon = typeof icon === "string" ? icons[icon] : icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/60 px-6 py-16 text-center",
        className,
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
