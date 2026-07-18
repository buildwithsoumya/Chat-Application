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
  const timeStr = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })

  const isImageAttachment = message.attachment && message.attachment.startsWith("data:image/")

  return (
    <div className={cn("flex w-full mt-2 gap-2.5 animate-fade-in", isOwn ? "justify-end" : "justify-start")}>
      {!isOwn && (
        <div className="w-8 shrink-0 flex items-end">
          {showAvatar && (
            <Avatar className="h-8 w-8 mb-1 ring-1 ring-border/30">
              <AvatarImage src={message.senderAvatar} />
              <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-primary">
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
            "rounded-2xl relative break-words transition-shadow overflow-hidden",
            isOwn
              ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-br-md shadow-md shadow-blue-500/20"
              : "glass rounded-bl-md text-foreground"
          )}
        >
          {isImageAttachment && (
            <img
              src={message.attachment!}
              alt="Attachment"
              className="max-w-full max-h-72 object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(message.attachment!, "_blank")}
            />
          )}
          {message.content && (
            <div className={cn(
              "whitespace-pre-wrap text-[15px] leading-relaxed",
              isImageAttachment ? "px-3 py-2" : "px-4 py-2.5"
            )}>
              {message.content}
            </div>
          )}
        </div>

        <div className={cn("flex items-center gap-1 mt-1 px-1", isOwn ? "justify-end" : "justify-start")}>
          <span className="text-[10px] text-muted-foreground/70">{timeStr}</span>
          {isOwn && <MessageStatus status={message.status} />}
        </div>
      </div>
    </div>
  )
})
