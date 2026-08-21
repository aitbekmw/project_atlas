import { useEffect, useRef } from "react";

import { cn, formatDateTime } from "@/lib/utils";
import type { Message } from "@/types/api";

interface MessageListProps {
  messages: Message[];
  currentUserId: number;
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
        Напишите первое сообщение
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {messages.map((message) => {
        const mine = message.sender_id === currentUserId;
        return (
          <div
            key={message.id}
            className={cn("flex", mine ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                mine
                  ? "rounded-br-md bg-primary text-primary-foreground"
                  : "rounded-bl-md bg-secondary text-foreground",
              )}
            >
              <p className="whitespace-pre-wrap">{message.text}</p>
              <p
                className={cn(
                  "mt-1 text-[10px]",
                  mine ? "text-primary-foreground/70" : "text-muted-foreground",
                )}
              >
                {formatDateTime(message.created_at)}
                {mine && message.is_read
                  ? " · прочитано"
                  : mine && message.is_delivered
                    ? " · доставлено"
                    : ""}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
