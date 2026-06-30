import { useRef, useEffect } from "react"
import { useAuthStore } from "@/store/authStore"
import { useChatStore } from "@/store/chatStore"
import { Button } from "@/components/ui/button"
import { Smile, Paperclip, Send } from "lucide-react"

export function MessageComposer() {
  const { user } = useAuthStore()
  const { selectedConversation, draftMessages, setDraft, sendMessage } = useChatStore()
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const conversationId = selectedConversation?.id
  const draft = conversationId ? draftMessages[conversationId] || "" : ""

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }

  const handleTyping = (val: string) => {
    setDraft(conversationId!, val)
    
    // Typing indicator logic
    useChatStore.getState().sendTypingIndicator(true)
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      useChatStore.getState().sendTypingIndicator(false)
    }, 1500)
  }

  // Adjust height on mount/draft change
  useEffect(() => {
    handleInput()
  }, [draft])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        useChatStore.getState().sendTypingIndicator(false)
      }
    }
  }, [])

  const handleSend = () => {
    if (!draft.trim() || !conversationId || !user) return
    sendMessage(conversationId, draft.trim(), user.id, user.username)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!conversationId) return null

  return (
    <div className="p-4 bg-surface/50 backdrop-blur-md border-t border-border shrink-0 z-10">
      <div className="flex items-end gap-2 bg-bgPrimary border border-border rounded-xl p-2 shadow-sm focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
        <div className="flex gap-1 pb-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 rounded-full">
            <Paperclip className="h-4 w-4" />
          </Button>
        </div>
        
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Type a message..."
          className="flex-1 max-h-[150px] min-h-[40px] bg-transparent resize-none outline-none py-2 px-1 text-[15px] custom-scrollbar overflow-y-auto placeholder:text-muted-foreground/70"
          rows={1}
        />
        
        <div className="flex gap-1 pb-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full">
            <Smile className="h-4 w-4" />
          </Button>
          <Button 
            onClick={handleSend}
            disabled={!draft.trim()}
            size="icon" 
            className="h-8 w-8 rounded-full ml-1 transition-transform active:scale-95"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="text-center mt-2">
        <span className="text-[10px] text-muted-foreground/50">
          <strong>Return</strong> to send, <strong>Shift + Return</strong> to add a new line
        </span>
      </div>
    </div>
  )
}
