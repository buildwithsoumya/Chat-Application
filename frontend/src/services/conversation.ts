import { api } from "@/lib/axios";

export interface Conversation {
  id: string;
  name?: string;
  isGroup: boolean;
  participants: {
    id: string;
    username: string;
    avatar?: string;
  }[];
  lastMessageAt?: string;
  unreadCount?: number;
}

export const conversationService = {
  async fetchConversations(): Promise<Conversation[]> {
    const response = await api.get<Conversation[]>("/conversations");
    return response.data;
  },

  async createConversation(data: { name?: string; isGroup?: boolean; participantIds?: string[] }): Promise<Conversation> {
    const response = await api.post<Conversation>("/conversations", data);
    return response.data;
  },

  async markAsRead(conversationId: string): Promise<void> {
    await api.post(`/conversations/${conversationId}/read`);
  },
};
