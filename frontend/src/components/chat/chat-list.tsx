import { useQuery } from "@tanstack/react-query";
import { NavLink } from "react-router-dom";

import { getJob } from "@/api/jobs";
import { getUser } from "@/api/users";
import { EmptyState } from "@/components/states/empty-state";
import { useI18n } from "@/i18n/locale-context";
import { queryKeys } from "@/lib/query-keys";
import { cn, formatDateTime, fullName } from "@/lib/utils";
import type { Conversation } from "@/types/api";

interface ChatListProps {
  conversations: Conversation[];
  activeId?: number;
  currentUserId: number;
}

export function ChatList({ conversations, activeId, currentUserId }: ChatListProps) {
  const { t } = useI18n();
  if (conversations.length === 0) {
    return (
      <EmptyState
        icon="chat"
        title={t("chat.empty")}
        description={t("chat.emptyHint")}
        className="h-full rounded-none border-0"
      />
    );
  }

  return (
    <div className="flex flex-col">
      {conversations.map((conversation) => (
        <ConversationRow
          key={conversation.id}
          conversation={conversation}
          activeId={activeId}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  );
}

function ConversationRow({
  conversation,
  activeId,
  currentUserId,
}: {
  conversation: Conversation;
  activeId?: number;
  currentUserId: number;
}) {
  const { t } = useI18n();
  const peerId =
    conversation.customer_id === currentUserId
      ? conversation.worker_id
      : conversation.customer_id;
  const jobQuery = useQuery({
    queryKey: queryKeys.job(conversation.job_id),
    queryFn: () => getJob(conversation.job_id),
    retry: false,
  });
  const peerQuery = useQuery({
    queryKey: queryKeys.user(peerId),
    queryFn: () => getUser(peerId),
    retry: false,
  });
  const peerName = peerQuery.data
    ? fullName(peerQuery.data)
    : conversation.customer_id === currentUserId
      ? t("common.workerFallback", { id: conversation.worker_id })
      : t("common.customerFallback", { id: conversation.customer_id });

  return (
    <NavLink
      to={`/app/chat/${conversation.id}`}
          className={cn(
        "border-b px-4 py-3 transition-colors duration-200 hover:bg-secondary/70",
        activeId === conversation.id && "bg-secondary",
      )}
    >
      <p className="truncate text-sm font-semibold">
        {jobQuery.data?.title ?? t("common.jobFallback", { id: conversation.job_id })}
      </p>
      <p className="mt-1 truncate text-xs text-muted-foreground">{peerName}</p>
      <p className="mt-2 text-[11px] text-muted-foreground">
        {formatDateTime(conversation.updated_at ?? conversation.created_at)}
      </p>
    </NavLink>
  );
}
