import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Settings, Info } from "lucide-react"
import { type Conversation } from "@/services/conversation"
import { useChatStore } from "@/store/chatStore"
import { useAuthStore } from "@/store/authStore"

interface ChatHeaderProps {
  conversation: Conversation;
}

export function ChatHeader({ conversation }: ChatHeaderProps) {
  const { connectionStatus, typingUsers } = useChatStore()
  const { user } = useAuthStore()

  const activeName = conversation.name || 
    conversation.participants?.[0]?.username || 
    "Unknown"

  // Filter out the current user from typing users
  const othersTyping = Array.from(typingUsers).filter(id => String(id) !== String(user?.id))
  
  let typingStatus = ""
  if (othersTyping.length === 1) {
    const typingUser = conversation.participants?.find(p => String(p.id) === othersTyping[0])
    typingStatus = typingUser ? `${typingUser.username} is typing...` : "Someone is typing..."
  } else if (othersTyping.length > 1) {
    typingStatus = "Several people are typing..."
  }

  return (
    <div className="h-16 shrink-0 border-b border-border flex items-center justify-between px-6 bg-surface/80 backdrop-blur-md z-10 sticky top-0">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 border border-border">
          <AvatarImage src={conversation.participants[0]?.avatar} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {activeName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            {activeName}
            {connectionStatus === "connected" && <div className="h-2 w-2 rounded-full bg-green-500"></div>}
            {connectionStatus === "connecting" && <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></div>}
            {connectionStatus === "offline" && <div className="h-2 w-2 rounded-full bg-muted-foreground"></div>}
          </h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {typingStatus ? (
              <span className="text-primary italic animate-pulse">{typingStatus}</span>
            ) : (
              conversation.isGroup ? "Group Chat" : "Direct Message"
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Info className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
