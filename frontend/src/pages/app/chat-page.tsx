import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";

import { getAccessToken } from "@/api/client";
import { getConversation, listConversations } from "@/api/conversations";
import { getJob } from "@/api/jobs";
import { getMessageHistory, markDelivered, markRead, sendMessage } from "@/api/messages";
import { getUser } from "@/api/users";
import { ChatList } from "@/components/chat/chat-list";
import { MessageList } from "@/components/chat/message-list";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import {
  ChatListSkeleton,
  MessageThreadSkeleton,
} from "@/components/states/loading-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { useI18n } from "@/i18n/locale-context";
import {
  chatWebSocketUrl,
  messageFromSocketEvent,
  parseChatSocketEvent,
  upsertMessage,
} from "@/lib/chat-socket";
import { queryKeys } from "@/lib/query-keys";
import { cn, fullName, getErrorMessage } from "@/lib/utils";
import type { Message } from "@/types/api";

type SocketStatus = "connecting" | "open" | "closed" | "denied";

export function ChatPage() {
  const { t } = useI18n();
  const { conversationId } = useParams();
  const activeId = conversationId ? Number(conversationId) : undefined;
  const conversationIdValid = Number.isFinite(activeId) && (activeId ?? 0) > 0;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [typingUserId, setTypingUserId] = useState<number | null>(null);
  const [socketStatus, setSocketStatus] = useState<SocketStatus>("closed");
  const socketRef = useRef<WebSocket | null>(null);
  const typingTimerRef = useRef<number | null>(null);

  const conversationsQuery = useQuery({
    queryKey: queryKeys.conversations,
    queryFn: listConversations,
  });
  const conversationQuery = useQuery({
    queryKey: queryKeys.conversation(activeId ?? 0),
    queryFn: () => getConversation(activeId!),
    enabled: conversationIdValid,
    retry: false,
  });
  const messagesQuery = useQuery({
    queryKey: queryKeys.messages(activeId ?? 0),
    queryFn: () => getMessageHistory(activeId!),
    enabled: conversationIdValid && conversationQuery.isSuccess,
  });
  const jobQuery = useQuery({
    queryKey: queryKeys.job(conversationQuery.data?.job_id ?? 0),
    queryFn: () => getJob(conversationQuery.data!.job_id),
    enabled: Boolean(conversationQuery.data),
    retry: false,
  });
  const peerId = conversationQuery.data
    ? conversationQuery.data.customer_id === user?.id
      ? conversationQuery.data.worker_id
      : conversationQuery.data.customer_id
    : 0;
  const peerQuery = useQuery({
    queryKey: queryKeys.user(peerId),
    queryFn: () => getUser(peerId),
    enabled: peerId > 0,
    retry: false,
  });

  const sendMutation = useMutation({
    mutationFn: (value: string) => sendMessage(activeId!, value),
    onSuccess: async (message) => {
      setText("");
      queryClient.setQueryData<Message[]>(queryKeys.messages(activeId!), (old = []) =>
        upsertMessage(old, message),
      );
      await queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const isParticipant = Boolean(
    user &&
      conversationQuery.data &&
      (user.id === conversationQuery.data.customer_id ||
        user.id === conversationQuery.data.worker_id),
  );

  useEffect(() => {
    if (!conversationIdValid || !user || !conversationQuery.isSuccess || !isParticipant) {
      return;
    }

    const token = getAccessToken();
    if (!token || !activeId) {
      return;
    }

    let disposed = false;
    let reconnectTimer: number | undefined;
    let attempt = 0;

    const connect = () => {
      if (disposed) {
        return;
      }
      setSocketStatus("connecting");
      const socket = new WebSocket(chatWebSocketUrl(activeId, token));
      socketRef.current = socket;

      socket.onopen = () => {
        attempt = 0;
        setSocketStatus("open");
      };

      socket.onmessage = (event) => {
        const payload = parseChatSocketEvent(String(event.data));
        if (!payload) {
          return;
        }
        if (payload.type === "typing" && payload.user_id !== user.id) {
          setTypingUserId(payload.user_id);
          return;
        }
        if (payload.type === "stop_typing" && payload.user_id !== user.id) {
          setTypingUserId((current) => (current === payload.user_id ? null : current));
          return;
        }
        if (payload.type !== "message" || payload.conversation_id !== activeId) {
          return;
        }
        const incoming = messageFromSocketEvent(payload);
        queryClient.setQueryData<Message[]>(queryKeys.messages(activeId), (old = []) =>
          upsertMessage(old, incoming),
        );
        void queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
        if (incoming.sender_id !== user.id) {
          void markDelivered(incoming.id)
            .then((updated) => {
              queryClient.setQueryData<Message[]>(queryKeys.messages(activeId), (old = []) =>
                upsertMessage(old, updated),
              );
            })
            .catch(() => undefined);
          void markRead(incoming.id)
            .then((updated) => {
              queryClient.setQueryData<Message[]>(queryKeys.messages(activeId), (old = []) =>
                upsertMessage(old, updated),
              );
            })
            .catch(() => undefined);
        }
      };

      socket.onerror = () => {
        setSocketStatus("closed");
      };

      socket.onclose = (event) => {
        socketRef.current = null;
        if (disposed) {
          return;
        }
        if (event.code === 1008) {
          setSocketStatus("denied");
          return;
        }
        setSocketStatus("closed");
        const delay = Math.min(15000, 1000 * 2 ** attempt);
        attempt += 1;
        reconnectTimer = window.setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      disposed = true;
      setTypingUserId(null);
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
      const socket = socketRef.current;
      socketRef.current = null;
      if (socket && socket.readyState < WebSocket.CLOSING) {
        socket.close();
      }
    };
  }, [activeId, conversationIdValid, conversationQuery.isSuccess, isParticipant, queryClient, user]);

  useEffect(() => {
    setText("");
    setTypingUserId(null);
  }, [activeId]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        window.clearTimeout(typingTimerRef.current);
      }
    };
  }, []);

  function sendTyping(type: "typing" | "stop_typing") {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }
    socket.send(JSON.stringify({ type }));
  }

  function onComposerChange(value: string) {
    setText(value);
    sendTyping("typing");
    if (typingTimerRef.current) {
      window.clearTimeout(typingTimerRef.current);
    }
    typingTimerRef.current = window.setTimeout(() => {
      sendTyping("stop_typing");
    }, 1200);
  }

  function submitMessage() {
    const value = text.trim();
    if (!value || !activeId || !isParticipant) {
      return;
    }
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "message", text: value }));
      sendTyping("stop_typing");
      setText("");
      window.setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.messages(activeId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
      }, 800);
      return;
    }
    sendMutation.mutate(value);
  }

  const peerName = peerQuery.data
    ? fullName(peerQuery.data)
    : peerId
      ? t("common.userFallback", { id: peerId })
      : "";

  return (
    <div className="min-w-0">
      <div className={cn(conversationIdValid && "max-lg:hidden")}>
        <PageHeader title={t("chat.title")} description={t("chat.hint")} />
      </div>
      <div className="grid min-h-[min(32rem,calc(100dvh-8rem))] overflow-hidden rounded-2xl border bg-card max-lg:min-h-[calc(100dvh-6rem)] lg:min-h-[calc(100dvh-10rem)] lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div
          className={cn(
            "min-w-0 border-b lg:border-b-0 lg:border-r",
            conversationIdValid && "hidden lg:block",
          )}
        >
          {conversationsQuery.isLoading ? <ChatListSkeleton /> : null}
          {conversationsQuery.isError ? (
            <div className="p-3">
              <ErrorState
                error={conversationsQuery.error}
                onRetry={() => void conversationsQuery.refetch()}
              />
            </div>
          ) : null}
          {!conversationsQuery.isLoading && !conversationsQuery.isError ? (
            <ChatList
              conversations={conversationsQuery.data ?? []}
              activeId={conversationIdValid ? activeId : undefined}
              currentUserId={user?.id ?? 0}
            />
          ) : null}
        </div>
        <div
          className={cn(
            "flex min-h-0 min-w-0 flex-col",
            conversationIdValid ? "min-h-[min(32rem,calc(100dvh-8rem))] lg:min-h-0" : "hidden lg:flex",
          )}
        >
          {!conversationIdValid ? (
            <div className="flex flex-1 items-center justify-center p-6">
              <EmptyState
                icon="chat"
                title={t("chat.pick")}
                description={t("chat.pickHint")}
                className="border-0 bg-transparent"
              />
            </div>
          ) : conversationQuery.isLoading ? (
            <MessageThreadSkeleton />
          ) : conversationQuery.isError ? (
            <div className="p-4">
              <ErrorState
                error={conversationQuery.error}
                onRetry={() => void conversationQuery.refetch()}
              />
            </div>
          ) : (
            <>
              <div className="border-b px-3 py-2.5 sm:px-4 sm:py-3">
                <Link
                  to="/app/chat"
                  className="mb-1 inline-block text-xs font-medium text-muted-foreground hover:text-foreground lg:hidden"
                >
                  ← {t("common.back")}
                </Link>
                <p className="break-words font-semibold">
                  {jobQuery.data ? (
                    <Link to={`/jobs/${jobQuery.data.id}`} className="hover:text-primary">
                      {jobQuery.data.title}
                    </Link>
                  ) : (
                    t("common.jobFallback", { id: conversationQuery.data?.job_id ?? 0 })
                  )}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {peerName}
                  {typingUserId ? ` · ${t("chat.typing")}` : ""}
                </p>
                {socketStatus === "denied" ? (
                  <p className="mt-1 text-xs text-destructive">{t("chat.denied")}</p>
                ) : socketStatus !== "open" ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("chat.noRealtime")}
                  </p>
                ) : null}
              </div>
              <div className="flex-1 overflow-y-auto">
                {messagesQuery.isLoading ? <MessageThreadSkeleton /> : null}
                {messagesQuery.isError ? (
                  <div className="p-4">
                    <ErrorState
                      error={messagesQuery.error}
                      onRetry={() => void messagesQuery.refetch()}
                    />
                  </div>
                ) : null}
                {!messagesQuery.isLoading && !messagesQuery.isError ? (
                  <MessageList
                    messages={messagesQuery.data ?? []}
                    currentUserId={user?.id ?? 0}
                  />
                ) : null}
              </div>
              <form
                className="sticky bottom-0 flex gap-2 border-t bg-card p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
                onSubmit={(event) => {
                  event.preventDefault();
                  submitMessage();
                }}
              >
                <Input
                  className="min-h-11"
                  value={text}
                  onChange={(event) => onComposerChange(event.target.value)}
                  placeholder={
                    isParticipant ? t("chat.placeholder") : t("chat.placeholderDenied")
                  }
                  disabled={!isParticipant}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-11 w-11 min-h-11 min-w-11"
                  aria-label={t("chat.send")}
                  disabled={!isParticipant || !text.trim() || sendMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
