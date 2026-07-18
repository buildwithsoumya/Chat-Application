import { create } from "zustand";
import { conversationService, type Conversation } from "@/services/conversation";
import { messageService } from "@/services/messageService";
import { wsService } from "@/services/websocketService";
import { toast } from "@/store/toastStore";

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  attachment?: string | null;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: string;
  status: "sending" | "sent" | "delivered" | "read";
}

interface ChatState {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  messages: Record<string, Message[]>;
  draftMessages: Record<string, string>;
  isLoading: boolean;
  isLoadingMessages: boolean;
  sendingMessage: boolean;
  error: string | null;

  connectionStatus: "connected" | "connecting" | "offline";
  typingUsers: Set<string>;
  onlineUsers: Set<string>;
  _wsUnsubscribers: Array<() => void>;

  fetchConversations: () => Promise<void>;
  createConversation: (data: { name: string; isGroup: boolean; participantIds: string[] }) => Promise<void>;
  selectConversation: (id: string) => void;
  markAsRead: (conversationId: string) => Promise<void>;

  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, currentUserId: string, currentUserName: string, attachment?: string | null) => void;
  setDraft: (conversationId: string, content: string) => void;
  clearMessages: (conversationId: string) => void;

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
        isLoading: false
      });

      get().selectConversation(newConversation.id);
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

      get().markAsRead(id);
    }
  },

  markAsRead: async (conversationId: string) => {
    try {
      await conversationService.markAsRead(conversationId);
      set((state) => ({
        conversations: state.conversations.map((c) =>
          String(c.id) === String(conversationId)
            ? { ...c, unreadCount: 0 }
            : c
        ),
        selectedConversation:
          state.selectedConversation && String(state.selectedConversation.id) === String(conversationId)
            ? { ...state.selectedConversation, unreadCount: 0 }
            : state.selectedConversation
      }));
    } catch {
      // Non-fatal: unread count will refresh on next fetch
    }
  },

  fetchMessages: async (conversationId: string) => {
    set({ isLoadingMessages: true });
    try {
      const apiMessages = await messageService.fetchMessages(conversationId);

      const mappedMessages: Message[] = apiMessages.map(msg => ({
        id: String(msg.id),
        conversationId: String(msg.conversation_id),
        content: msg.content,
        attachment: msg.attachment || null,
        senderId: String(msg.sender_id),
        senderName: "User",
        timestamp: msg.created_at,
        status: "sent"
      }));

      mappedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      set((state) => ({
        messages: { ...state.messages, [conversationId]: mappedMessages },
        isLoadingMessages: false
      }));
    } catch {
      toast.error("Network Error", "Could not fetch message history.");
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: (conversationId, content, currentUserId, currentUserName, attachment) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      conversationId,
      content,
      attachment: attachment || null,
      senderId: currentUserId,
      senderName: currentUserName,
      timestamp: new Date().toISOString(),
      status: "sending",
    };

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

    const sent = wsService.send("message", {
      content,
      attachment: attachment || undefined,
      client_message_id: tempId
    });

    if (!sent) {
      // WebSocket not connected — fall back to REST API so messages
      // are persisted even when the recipient is offline.
      messageService
        .sendMessage(conversationId, content, attachment)
        .then((apiMessage) => {
          const realMessage: Message = {
            id: String(apiMessage.id),
            conversationId: String(apiMessage.conversation_id),
            content: apiMessage.content,
            attachment: apiMessage.attachment || null,
            senderId: String(apiMessage.sender_id),
            senderName: currentUserName,
            timestamp: apiMessage.created_at,
            status: "sent",
          };

          set((state) => {
            const currentMessages = state.messages[conversationId] || [];
            const updated = currentMessages.map(m =>
              m.id === tempId ? realMessage : m
            );
            return {
              sendingMessage: false,
              messages: { ...state.messages, [conversationId]: updated }
            };
          });
        })
        .catch(() => {
          toast.error("Failed to send message", "Could not deliver message. Please try again.");
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
      const { [conversationId]: _removed, ...rest } = state.messages;
      return { messages: rest };
    });
  },

  connectWebSocket: (conversationId: string, token: string) => {
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
          attachment: apiMessage.attachment || null,
          senderId: String(apiMessage.sender_id),
          senderName: "User",
          timestamp: apiMessage.created_at,
          status: "sent"
        };

        set((state) => {
          const currentMessages = state.messages[conversationId] || [];

          if (clientMessageId && currentMessages.some(m => m.id === clientMessageId)) {
            const updated = currentMessages.map(m =>
              m.id === clientMessageId ? { ...realMessage, status: "sent" as const } : m
            );
            return {
              sendingMessage: false,
              messages: { ...state.messages, [conversationId]: updated }
            };
          }

          if (currentMessages.some(m => m.id === realMessage.id)) {
            return state;
          }

          // New message from another user — mark conversation as read
          // since we're actively viewing it.
          if (String(apiMessage.sender_id) !== String(realMessage.senderId)) {
            get().markAsRead(conversationId);
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
    get()._wsUnsubscribers.forEach((unsub) => unsub());
    set({ _wsUnsubscribers: [] });
    wsService.disconnect();
    set({ connectionStatus: "offline", typingUsers: new Set() });
  },

  sendTypingIndicator: (isTyping: boolean) => {
    wsService.send(isTyping ? "typing_start" : "typing_stop");
  }
}));
