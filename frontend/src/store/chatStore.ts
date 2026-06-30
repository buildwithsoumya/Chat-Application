import { create } from "zustand";
import { conversationService, type Conversation } from "@/services/conversation";

interface ChatState {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;

  fetchConversations: () => Promise<void>;
  createConversation: (data: { name: string; isGroup: boolean }) => Promise<void>;
  selectConversation: (id: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  selectedConversation: null,
  isLoading: false,
  error: null,

  fetchConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const conversations = await conversationService.fetchConversations();
      set({ conversations, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || "Failed to load conversations", 
        isLoading: false 
      });
    }
  },

  createConversation: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const newConversation = await conversationService.createConversation(data);
      const currentConversations = get().conversations;
      
      set({ 
        conversations: [newConversation, ...currentConversations],
        selectedConversation: newConversation,
        isLoading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || "Failed to create conversation", 
        isLoading: false 
      });
      throw error;
    }
  },

  selectConversation: (id: string) => {
    const conversation = get().conversations.find((c) => c.id === id);
    if (conversation) {
      set({ selectedConversation: conversation });
    }
  },
}));
