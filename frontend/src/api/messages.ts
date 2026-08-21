import { api } from "@/api/client";
import type { Message } from "@/types/api";

export async function sendMessage(
  conversationId: number,
  text: string,
): Promise<Message> {
  const { data } = await api.post<Message>(`/messages/${conversationId}`, { text });
  return data;
}

export async function getMessages(
  conversationId: number,
  page = 1,
  size = 100,
): Promise<Message[]> {
  const { data } = await api.get<Message[]>(`/messages/${conversationId}`, {
    params: { page, size },
  });
  return data;
}

export async function getMessageHistory(conversationId: number): Promise<Message[]> {
  const size = 100;
  const all: Message[] = [];
  for (let page = 1; page <= 20; page += 1) {
    const chunk = await getMessages(conversationId, page, size);
    all.push(...chunk);
    if (chunk.length < size) {
      break;
    }
  }
  const seen = new Set<number>();
  return all.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

export async function markDelivered(messageId: number): Promise<Message> {
  const { data } = await api.patch<Message>(`/messages/${messageId}/delivered`);
  return data;
}

export async function markRead(messageId: number): Promise<Message> {
  const { data } = await api.patch<Message>(`/messages/${messageId}/read`);
  return data;
}

export async function deleteMessage(messageId: number): Promise<void> {
  await api.delete(`/messages/${messageId}`);
}
