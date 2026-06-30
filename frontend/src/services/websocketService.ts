type EventHandler = (data: any) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private listeners: Map<string, EventHandler[]> = new Map();
  private isIntentionalDisconnect = false;

  private currentConversationId: string | null = null;
  private currentToken: string | null = null;

  connect(conversationId: string, token: string) {
    if (this.socket) {
      this.disconnect();
    }

    this.currentConversationId = conversationId;
    this.currentToken = token;
    this.isIntentionalDisconnect = false;

    // Dispatch a status event indicating connecting
    this.emit("status", "connecting");

    const wsUrl = `ws://localhost:8000/ws/${conversationId}?token=${token}`;
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.emit("status", "connected");
    };

    this.socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        // Assuming backend sends { type: "message"|"typing_start"|etc, data: {...} }
        if (payload.type) {
          this.emit(payload.type, payload.data);
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message:", e);
      }
    };

    this.socket.onclose = () => {
      this.socket = null;
      this.emit("status", "offline");
      
      if (!this.isIntentionalDisconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
        this.reconnectAttempts++;
        this.reconnectTimeout = setTimeout(() => {
          if (this.currentConversationId && this.currentToken) {
            this.connect(this.currentConversationId, this.currentToken);
          }
        }, delay);
      }
    };

    this.socket.onerror = (error) => {
      this.emit("error", error);
      // onerror is usually followed by onclose, which handles reconnects
    };
  }

  disconnect() {
    this.isIntentionalDisconnect = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.emit("status", "offline");
  }

  send(type: string, data: any = {}) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, data }));
    }
    // We intentionally don't throw a warning here to avoid console spam
    // when users type before the connection is fully established.
  }

  on(event: string, callback: EventHandler) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.push(callback);
    this.listeners.set(event, callbacks);
    
    return () => this.off(event, callback);
  }

  off(event: string, callback: EventHandler) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      this.listeners.set(event, callbacks.filter(cb => cb !== callback));
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }
}

export const wsService = new WebSocketService();
