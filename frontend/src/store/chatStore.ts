import { create } from "zustand";
import { conversationService, type Conversation } from "@/services/conversation";

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: string;
  status: "sending" | "sent" | "delivered" | "read";
}

interface ChatState {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  messages: Record<string, Message[]>; // Keyed by conversationId
  draftMessages: Record<string, string>; // Keyed by conversationId
  isLoading: boolean;
  isLoadingMessages: boolean;
  error: string | null;

  fetchConversations: () => Promise<void>;
  createConversation: (data: { name: string; isGroup: boolean }) => Promise<void>;
  selectConversation: (id: string) => void;
  
  // Phase F4: Mock Actions
  fetchMessages: (conversationId: string) => void;
  sendMessage: (conversationId: string, content: string, currentUserId: string, currentUserName: string) => void;
  setDraft: (conversationId: string, content: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  selectedConversation: null,
  messages: {},
  draftMessages: {},
  isLoading: false,
  isLoadingMessages: false,
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
      get().fetchMessages(id);
    }
  },

  fetchMessages: (conversationId: string) => {
    set({ isLoadingMessages: true });
    
    // Simulate network delay
    setTimeout(() => {
      const existing = get().messages[conversationId];
      if (!existing) {
        // Create mock data
        const now = new Date();
        const mockMessages: Message[] = [
          {
            id: `msg-${Date.now()}-1`,
            conversationId,
            content: "Hey there! How is the project going?",
            senderId: "mock-user-1",
            senderName: "Alice",
            timestamp: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
            status: "read",
          },
          {
            id: `msg-${Date.now()}-2`,
            conversationId,
            content: "It's going great! Just finished the auth module.",
            senderId: "me", // We will match this with the logged in user ID in components
            senderName: "Me",
            timestamp: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
            status: "read",
          },
          {
            id: `msg-${Date.now()}-3`,
            conversationId,
            content: "Awesome, let's catch up later today.",
            senderId: "mock-user-1",
            senderName: "Alice",
            timestamp: new Date(now.getTime() - 1000 * 60 * 5).toISOString(),
            status: "read",
          }
        ];
        
        set((state) => ({
          messages: { ...state.messages, [conversationId]: mockMessages },
          isLoadingMessages: false
        }));
      } else {
        set({ isLoadingMessages: false });
      }
    }, 500);
  },

  sendMessage: (conversationId, content, currentUserId, currentUserName) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      content,
      senderId: currentUserId,
      senderName: currentUserName,
      timestamp: new Date().toISOString(),
      status: "sent",
    };

    set((state) => {
      const currentMessages = state.messages[conversationId] || [];
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...currentMessages, newMessage]
        },
        draftMessages: {
          ...state.draftMessages,
          [conversationId]: "" // clear draft
        }
      };
    });
    
    // Simulate delivery after 1s
    setTimeout(() => {
      set((state) => {
        const msgs = state.messages[conversationId] || [];
        const updated = msgs.map(m => m.id === newMessage.id ? { ...m, status: "delivered" as const } : m);
        return { messages: { ...state.messages, [conversationId]: updated } };
      });
    }, 1000);
  },

  setDraft: (conversationId, content) => {
    set((state) => ({
      draftMessages: {
        ...state.draftMessages,
        [conversationId]: content
      }
    }));
  }
}));
