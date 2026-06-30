import { create } from "zustand";
import { conversationService, type Conversation } from "@/services/conversation";
import { messageService } from "@/services/messageService";
import { toast } from "@/store/toastStore";

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  senderId: string;
  senderName: string; // The backend ApiMessage currently doesn't provide this directly, we'll try to resolve it via participant matching in UI
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
  sendingMessage: boolean;
  error: string | null;

  fetchConversations: () => Promise<void>;
  createConversation: (data: { name: string; isGroup: boolean; participant_ids?: string[] }) => Promise<void>;
  selectConversation: (id: string) => void;
  
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, currentUserId: string, currentUserName: string) => Promise<void>;
  setDraft: (conversationId: string, content: string) => void;
  clearMessages: (conversationId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  selectedConversation: null,
  messages: {},
  draftMessages: {},
  isLoading: false,
  isLoadingMessages: false,
  sendingMessage: false,
  error: null,

  fetchConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const conversations = await conversationService.fetchConversations();
      set({ conversations, isLoading: false });
    } catch (error: any) {
      toast.error("Failed to load conversations", error.response?.data?.detail || error.message);
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
      toast.error("Failed to create conversation", error.response?.data?.detail || error.message);
      set({ 
        error: error.response?.data?.detail || "Failed to create conversation", 
        isLoading: false 
      });
      throw error;
    }
  },

  selectConversation: (id: string) => {
    const conversation = get().conversations.find((c) => String(c.id) === String(id));
    if (conversation) {
      set({ selectedConversation: conversation });
      get().fetchMessages(id);
    }
  },

  fetchMessages: async (conversationId: string) => {
    set({ isLoadingMessages: true });
    try {
      const apiMessages = await messageService.fetchMessages(conversationId);
      
      // Map API messages to our frontend Message interface
      const mappedMessages: Message[] = apiMessages.map(msg => ({
        id: String(msg.id),
        conversationId: String(msg.conversation_id),
        content: msg.content,
        senderId: String(msg.sender_id),
        senderName: "User", // Fallback, will be resolved in component
        timestamp: msg.created_at,
        status: "sent"
      }));

      // Ensure chronological order
      mappedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      set((state) => ({
        messages: { ...state.messages, [conversationId]: mappedMessages },
        isLoadingMessages: false
      }));
    } catch (error: any) {
      toast.error("Network Error", "Could not fetch message history.");
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (conversationId, content, currentUserId, currentUserName) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      conversationId,
      content,
      senderId: currentUserId,
      senderName: currentUserName,
      timestamp: new Date().toISOString(),
      status: "sending",
    };

    // Optimistic Update & Clear Draft
    set((state) => {
      const currentMessages = state.messages[conversationId] || [];
      return {
        sendingMessage: true,
        messages: {
          ...state.messages,
          [conversationId]: [...currentMessages, optimisticMessage]
        },
        draftMessages: {
          ...state.draftMessages,
          [conversationId]: "" 
        }
      };
    });
    
    try {
      const apiMessage = await messageService.sendMessage(conversationId, content);
      
      // Replace optimistic message with actual data from backend
      set((state) => {
        const msgs = state.messages[conversationId] || [];
        const updated = msgs.map(m => m.id === tempId ? {
          ...m,
          id: String(apiMessage.id),
          timestamp: apiMessage.created_at,
          status: "sent" as const
        } : m);
        
        return { 
          sendingMessage: false,
          messages: { ...state.messages, [conversationId]: updated } 
        };
      });
    } catch (error: any) {
      toast.error("Failed to send message", "Please try again.");
      
      // Remove optimistic message on failure
      set((state) => {
        const msgs = state.messages[conversationId] || [];
        const filtered = msgs.filter(m => m.id !== tempId);
        
        return { 
          sendingMessage: false,
          messages: { ...state.messages, [conversationId]: filtered },
          draftMessages: {
            ...state.draftMessages,
            [conversationId]: content // restore draft
          }
        };
      });
    }
  },

  setDraft: (conversationId, content) => {
    set((state) => ({
      draftMessages: {
        ...state.draftMessages,
        [conversationId]: content
      }
    }));
  },

  clearMessages: (conversationId) => {
    set((state) => {
      const { [conversationId]: removed, ...rest } = state.messages;
      return { messages: rest };
    });
  }
}));
