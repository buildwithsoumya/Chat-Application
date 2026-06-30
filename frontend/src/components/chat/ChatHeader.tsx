import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Settings, Info } from "lucide-react"
import { type Conversation } from "@/services/conversation"

interface ChatHeaderProps {
  conversation: Conversation;
}

export function ChatHeader({ conversation }: ChatHeaderProps) {
  const activeName = conversation.name || 
    conversation.participants?.[0]?.username || 
    "Unknown"

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
          <h3 className="font-semibold text-foreground">{activeName}</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {conversation.isGroup ? "Group Chat" : "Direct Message"}
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
