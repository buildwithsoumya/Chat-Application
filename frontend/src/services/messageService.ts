import { api } from "@/lib/axios";

export interface ApiMessage {
  id: string | number;
  conversation_id: string | number;
  sender_id: string | number;
  content: string;
  attachment?: string | null;
  created_at: string;
  updated_at?: string;
}

export const messageService = {
  async fetchMessages(conversationId: string | number, page = 1, limit = 50): Promise<ApiMessage[]> {
    const response = await api.get<ApiMessage[]>(`/conversations/${conversationId}/messages`, {
      params: { page, limit }
    });
    return response.data;
  },

  async sendMessage(conversationId: string | number, content: string, attachment?: string | null): Promise<ApiMessage> {
    const response = await api.post<ApiMessage>("/messages", {
      conversation_id: conversationId,
      content,
      attachment: attachment || undefined,
    });
    return response.data;
  },
};
