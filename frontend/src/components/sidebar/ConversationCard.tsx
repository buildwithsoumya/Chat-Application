import { memo } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { type Conversation } from "@/services/conversation"
import { cn } from "@/lib/utils"
import { Users } from "lucide-react"

interface ConversationCardProps {
  conversation: Conversation
  isSelected: boolean
  onClick: () => void
}

export const ConversationCard = memo(function ConversationCard({ conversation, isSelected, onClick }: ConversationCardProps) {
  const displayName = conversation.name || conversation.participants[0]?.username || "Unknown"
  const avatarUrl = conversation.participants[0]?.avatar
  const initials = displayName.charAt(0).toUpperCase()

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border",
        isSelected
          ? "bg-blue-500/10 border-blue-500/20 shadow-sm"
          : "border-transparent hover:bg-white/[0.03] hover:border-border/30"
      )}
    >
      <div className="relative shrink-0">
        {conversation.isGroup ? (
          <div className={cn(
            "h-11 w-11 rounded-full flex items-center justify-center ring-1 ring-border/50",
            isSelected
              ? "bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400"
              : "bg-surface text-muted-foreground"
          )}>
            <Users className="h-5 w-5" />
          </div>
        ) : (
          <Avatar className="h-11 w-11 ring-1 ring-border/50">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className={cn(
              "text-sm font-semibold",
              isSelected
                ? "bg-gradient-to-br from-blue-500/30 to-indigo-500/30 text-primary"
                : "bg-surface text-muted-foreground"
            )}>
              {initials}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <h4 className={cn("text-sm truncate", conversation.unreadCount ? "font-bold text-foreground" : "font-medium")}>{displayName}</h4>
          {conversation.lastMessageAt && (
            <span className={cn(
              "text-[10px] whitespace-nowrap shrink-0",
              conversation.unreadCount ? "text-blue-400 font-medium" : "text-muted-foreground/70"
            )}>
              {new Date(conversation.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-xs text-muted-foreground/70 truncate">
            {conversation.isGroup ? "Group chat" : "Direct message"}
          </p>
          {conversation.unreadCount ? (
            <Badge variant="default" className="h-5 min-w-5 rounded-full flex items-center justify-center px-1.5 text-[10px] bg-blue-500 text-white shadow-sm shadow-blue-500/30">
              {conversation.unreadCount}
            </Badge>
          ) : null}
        </div>
      </div>
    </div>
  )
})
