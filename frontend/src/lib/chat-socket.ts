import { getWsBaseUrl } from "@/lib/env";
import type { Message } from "@/types/api";

export type ChatSocketIncoming =
  | {
      type: "message";
      id: number;
      conversation_id: number;
      sender_id: number;
      text: string;
      created_at: string;
    }
  | { type: "typing"; user_id: number }
  | { type: "stop_typing"; user_id: number }
  | { type: "online"; user_id: number }
  | { type: "offline"; user_id: number };

export function chatWebSocketUrl(conversationId: number, token: string): string {
  const base = getWsBaseUrl();
  return `${base}/ws/chat/${conversationId}?token=${encodeURIComponent(token)}`;
}

export function parseChatSocketEvent(raw: string): ChatSocketIncoming | null {
  try {
    const data = JSON.parse(raw) as { type?: unknown };
    if (!data || typeof data !== "object" || typeof data.type !== "string") {
      return null;
    }
    if (data.type === "message") {
      const message = data as ChatSocketIncoming & { type: "message" };
      if (
        typeof message.id !== "number" ||
        typeof message.conversation_id !== "number" ||
        typeof message.sender_id !== "number" ||
        typeof message.text !== "string"
      ) {
        return null;
      }
      return {
        type: "message",
        id: message.id,
        conversation_id: message.conversation_id,
        sender_id: message.sender_id,
        text: message.text,
        created_at: String(message.created_at ?? new Date().toISOString()),
      };
    }
    if (
      data.type === "typing" ||
      data.type === "stop_typing" ||
      data.type === "online" ||
      data.type === "offline"
    ) {
      const event = data as { type: "typing" | "stop_typing" | "online" | "offline"; user_id?: unknown };
      if (typeof event.user_id !== "number") {
        return null;
      }
      return { type: event.type, user_id: event.user_id };
    }
    return null;
  } catch {
    return null;
  }
}

export function messageFromSocketEvent(
  event: Extract<ChatSocketIncoming, { type: "message" }>,
): Message {
  return {
    id: event.id,
    conversation_id: event.conversation_id,
    sender_id: event.sender_id,
    text: event.text,
    is_delivered: false,
    is_read: false,
    read_at: null,
    created_at: event.created_at,
  };
}

export function upsertMessage(list: Message[], incoming: Message): Message[] {
  const existing = list.find((item) => item.id === incoming.id);
  if (existing) {
    return list.map((item) =>
      item.id === incoming.id
        ? {
            ...existing,
            ...incoming,
            is_delivered: existing.is_delivered || incoming.is_delivered,
            is_read: existing.is_read || incoming.is_read,
            read_at: existing.read_at ?? incoming.read_at,
          }
        : item,
    );
  }
  return [...list, incoming].sort((a, b) => {
    const time = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return time !== 0 ? time : a.id - b.id;
  });
}
