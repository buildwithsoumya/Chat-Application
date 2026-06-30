import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { type Conversation } from "@/services/conversation"
import { cn } from "@/lib/utils"

interface ConversationCardProps {
  conversation: Conversation
  isSelected: boolean
  onClick: () => void
}

export function ConversationCard({ conversation, isSelected, onClick }: ConversationCardProps) {
  // If it's a group, use the name, otherwise use the other participant's username
  // For simplicity, we just use the name or first participant
  const displayName = conversation.name || conversation.participants[0]?.username || "Unknown"
  const avatarUrl = conversation.participants[0]?.avatar

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border border-transparent",
        isSelected 
          ? "bg-surface border-border shadow-sm" 
          : "hover:bg-surface/50"
      )}
    >
      <Avatar className="h-10 w-10 border border-border">
        <AvatarImage src={avatarUrl} alt={displayName} />
        <AvatarFallback className="bg-primary/10 text-primary">
          {displayName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm truncate">{displayName}</h4>
          {conversation.lastMessageAt && (
            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
              {new Date(conversation.lastMessageAt).toLocaleDateString()}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {conversation.isGroup ? "Group Chat" : "Direct Message"}
        </p>
      </div>

      {conversation.unreadCount ? (
        <Badge variant="default" className="h-5 min-w-5 rounded-full flex items-center justify-center px-1">
          {conversation.unreadCount}
        </Badge>
      ) : null}
    </div>
  )
}
