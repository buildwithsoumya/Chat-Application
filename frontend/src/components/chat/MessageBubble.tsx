import { memo } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { type Message } from "@/store/chatStore"
import { MessageStatus } from "./MessageStatus"
import { cn } from "@/lib/utils"

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  showAvatar?: boolean
}

export const MessageBubble = memo(function MessageBubble({ message, isOwn, showAvatar = true }: MessageBubbleProps) {
  // Extract time from timestamp (e.g. 10:45 AM)
  const timeStr = new Date(message.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  })

  return (
    <div className={cn("flex w-full mt-2 gap-3", isOwn ? "justify-end" : "justify-start")}>
      {!isOwn && (
        <div className="w-8 shrink-0 flex items-end">
          {showAvatar && (
            <Avatar className="h-8 w-8 mb-1">
              <AvatarImage src={message.senderAvatar} />
              <AvatarFallback className="text-xs bg-sidebar text-muted-foreground border border-border">
                {message.senderName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      )}

      <div className={cn("flex flex-col max-w-[70%]", isOwn ? "items-end" : "items-start")}>
        {!isOwn && showAvatar && (
          <span className="text-xs text-muted-foreground ml-1 mb-1 font-medium">
            {message.senderName}
          </span>
        )}
        
        <div 
          className={cn(
            "px-4 py-2.5 rounded-2xl relative break-words whitespace-pre-wrap shadow-sm text-[15px] leading-relaxed",
            isOwn 
              ? "bg-primary text-primary-foreground rounded-br-sm" 
              : "bg-surface border border-border text-foreground rounded-bl-sm"
          )}
        >
          {message.content}
        </div>
        
        <div className={cn("flex items-center gap-1 mt-1 px-1", isOwn ? "justify-end" : "justify-start")}>
          <span className="text-[11px] text-muted-foreground">{timeStr}</span>
          {isOwn && <MessageStatus status={message.status} />}
        </div>
      </div>
    </div>
  )
})
