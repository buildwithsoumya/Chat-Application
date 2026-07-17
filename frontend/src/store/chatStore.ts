import { create } from "zustand";
import { conversationService, type Conversation } from "@/services/conversation";
import { messageService } from "@/services/messageService";
import { wsService } from "@/services/websocketService";
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

  // Phase F6: WebSockets
  connectionStatus: "connected" | "connecting" | "offline";
  typingUsers: Set<string>;
  onlineUsers: Set<string>;
  _wsUnsubscribers: Array<() => void>;

  fetchConversations: () => Promise<void>;
  createConversation: (data: { name: string; isGroup: boolean; participantIds: string[] }) => Promise<void>;
  selectConversation: (id: string) => void;
  
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, currentUserId: string, currentUserName: string) => void;
  setDraft: (conversationId: string, content: string) => void;
  clearMessages: (conversationId: string) => void;

  // WS Actions
  connectWebSocket: (conversationId: string, token: string) => void;
  disconnectWebSocket: () => void;
  sendTypingIndicator: (isTyping: boolean) => void;
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
  
  connectionStatus: "offline",
  typingUsers: new Set(),
  onlineUsers: new Set(),
  _wsUnsubscribers: [],

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
      const newConversation = await conversationService.createConversation({
        name: data.name,
        isGroup: data.isGroup,
        participantIds: data.participantIds,
      });
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
      
      const token = localStorage.getItem("token");
      if (token) {
        get().connectWebSocket(id, token);
      }
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

  sendMessage: (conversationId, content, currentUserId, currentUserName) => {
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

    // Send over WebSocket; the server will broadcast the persisted message
    // back to all room members, including this sender, replacing the optimistic one.
    const sent = wsService.send("message", {
      content,
      client_message_id: tempId
    });

    if (!sent) {
      toast.error("Failed to send message", "Not connected. Please try again.");

      // Rollback optimistic message and restore draft
      set((state) => {
        const msgs = state.messages[conversationId] || [];
        const filtered = msgs.filter(m => m.id !== tempId);

        return { 
          sendingMessage: false,
          messages: { ...state.messages, [conversationId]: filtered },
          draftMessages: {
            ...state.draftMessages,
            [conversationId]: content
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
  },

  connectWebSocket: (conversationId: string, token: string) => {
    // Clean up previous listeners and connection before registering new ones.
    get().disconnectWebSocket();

    const unsubs: Array<() => void> = [];

    unsubs.push(
      wsService.on("status", (status: any) => {
        set({ connectionStatus: status });
      })
    );

    unsubs.push(
      wsService.on("message", (apiMessage: any) => {
        const clientMessageId = apiMessage.client_message_id;
        const realMessage: Message = {
          id: String(apiMessage.id),
          conversationId: String(apiMessage.conversation_id),
          content: apiMessage.content,
          senderId: String(apiMessage.sender_id),
          senderName: "User", // Will be mapped in UI
          timestamp: apiMessage.created_at,
          status: "sent"
        };

        set((state) => {
          const currentMessages = state.messages[conversationId] || [];

          // If this is a broadcast of our own optimistic message, replace it.
          if (clientMessageId && currentMessages.some(m => m.id === clientMessageId)) {
            const updated = currentMessages.map(m =>
              m.id === clientMessageId ? { ...realMessage, status: "sent" as const } : m
            );
            return {
              sendingMessage: false,
              messages: { ...state.messages, [conversationId]: updated }
            };
          }

          // Otherwise, add the message if it is not already present.
          if (currentMessages.some(m => m.id === realMessage.id)) {
            return state;
          }
          return {
            messages: {
              ...state.messages,
              [conversationId]: [...currentMessages, realMessage]
            }
          };
        });
      })
    );

    unsubs.push(
      wsService.on("typing_start", (data: any) => {
        set((state) => {
          const newSet = new Set(state.typingUsers);
          newSet.add(String(data.user_id));
          return { typingUsers: newSet };
        });
      })
    );

    unsubs.push(
      wsService.on("typing_stop", (data: any) => {
        set((state) => {
          const newSet = new Set(state.typingUsers);
          newSet.delete(String(data.user_id));
          return { typingUsers: newSet };
        });
      })
    );

    unsubs.push(
      wsService.on("presence", (data: any) => {
        set((state) => {
          const newSet = new Set(state.onlineUsers);
          if (data.status === "online") {
            newSet.add(String(data.user_id));
          } else {
            newSet.delete(String(data.user_id));
          }
          return { onlineUsers: newSet };
        });
      })
    );

    unsubs.push(
      wsService.on("error", (data: any) => {
        const clientMessageId = data?.client_message_id;
        if (clientMessageId) {
          set((state) => {
            const currentMessages = state.messages[conversationId] || [];
            const filtered = currentMessages.filter(m => m.id !== clientMessageId);
            if (filtered.length === currentMessages.length) {
              return state;
            }
            return {
              sendingMessage: false,
              messages: { ...state.messages, [conversationId]: filtered }
            };
          });
        }
        toast.error("Chat error", data?.message || "Something went wrong");
      })
    );

    set({ _wsUnsubscribers: unsubs });
    wsService.connect(conversationId, token);
  },

  disconnectWebSocket: () => {
    // Unsubscribe all listeners first so the disconnect callback does not
    // trigger duplicate state updates or leaked handlers.
    get()._wsUnsubscribers.forEach((unsub) => unsub());
    set({ _wsUnsubscribers: [] });
    wsService.disconnect();
    set({ connectionStatus: "offline", typingUsers: new Set() });
  },

  sendTypingIndicator: (isTyping: boolean) => {
    wsService.send(isTyping ? "typing_start" : "typing_stop");
  }
}));
