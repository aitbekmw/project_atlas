import { api } from "@/api/client";
import type { Conversation } from "@/types/api";

export async function createConversation(
  jobId: number,
  workerId: number,
): Promise<Conversation> {
  const { data } = await api.post<Conversation>(
    `/conversations/${jobId}/${workerId}`,
  );
  return data;
}

export async function listConversations(): Promise<Conversation[]> {
  const { data } = await api.get<Conversation[]>("/conversations");
  return data;
}

export async function getConversation(conversationId: number): Promise<Conversation> {
  const { data } = await api.get<Conversation>(`/conversations/${conversationId}`);
  return data;
}

export async function deleteConversation(conversationId: number): Promise<void> {
  await api.delete(`/conversations/${conversationId}`);
}
