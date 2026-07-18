import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Settings, Info, ArrowLeft, Users } from "lucide-react"
import { type Conversation } from "@/services/conversation"
import { useChatStore } from "@/store/chatStore"
import { useAuthStore } from "@/store/authStore"

interface ChatHeaderProps {
  conversation: Conversation;
  onBack?: () => void;
}

export function ChatHeader({ conversation, onBack }: ChatHeaderProps) {
  const { connectionStatus, typingUsers } = useChatStore()
  const { user } = useAuthStore()

  const activeName = conversation.name ||
    conversation.participants?.[0]?.username ||
    "Unknown"

  const othersTyping = Array.from(typingUsers).filter(id => String(id) !== String(user?.id))

  let typingStatus = ""
  if (othersTyping.length === 1) {
    const typingUser = conversation.participants?.find(p => String(p.id) === othersTyping[0])
    typingStatus = typingUser ? `${typingUser.username} is typing...` : "Someone is typing..."
  } else if (othersTyping.length > 1) {
    typingStatus = "Several people are typing..."
  }

  return (
    <div className="h-16 shrink-0 border-b border-border/30 flex items-center justify-between px-4 md:px-6 glass-strong z-10 sticky top-0">
      <div className="flex items-center gap-3">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8 text-muted-foreground hover:text-foreground -ml-2"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to conversations</span>
          </Button>
        )}
        {conversation.isGroup ? (
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 flex items-center justify-center ring-1 ring-border/50">
            <Users className="h-5 w-5" />
          </div>
        ) : (
          <Avatar className="h-9 w-9 ring-1 ring-border/50">
            <AvatarImage src={conversation.participants[0]?.avatar} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-primary text-sm font-semibold">
              {activeName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
        <div>
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            {activeName}
            {connectionStatus === "connected" && <span className="h-2 w-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />}
            {connectionStatus === "connecting" && <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />}
            {connectionStatus === "offline" && <span className="h-2 w-2 rounded-full bg-muted-foreground" />}
          </h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1 h-4">
            {typingStatus ? (
              <span className="text-primary italic">{typingStatus}</span>
            ) : (
              conversation.isGroup ? "Group Chat" : "Direct Message"
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8">
          <Info className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
