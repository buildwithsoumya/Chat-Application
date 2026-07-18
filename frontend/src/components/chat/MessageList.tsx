import { useEffect, useRef } from "react"
import { useAuthStore } from "@/store/authStore"
import { useChatStore } from "@/store/chatStore"
import { MessageBubble } from "./MessageBubble"
import { LoadingMessages } from "./LoadingMessages"
import { DateSeparator } from "./DateSeparator"

export function MessageList() {
  const { user } = useAuthStore()
  const { messages, selectedConversation, isLoadingMessages } = useChatStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  const activeMessages = selectedConversation
    ? messages[selectedConversation.id] || []
    : []
  const lastMessageId = activeMessages[activeMessages.length - 1]?.id

  useEffect(() => {
    if (bottomRef.current && lastMessageId) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [lastMessageId])

  if (isLoadingMessages) {
    return (
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <LoadingMessages />
      </div>
    )
  }

  if (!selectedConversation || activeMessages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
        <div className="glass p-5 rounded-2xl mb-3 shadow-sm">
          <span className="text-3xl">👋</span>
        </div>
        <p className="font-medium text-foreground">Say hello!</p>
        <p className="text-sm mt-1 text-center max-w-sm leading-relaxed">
          This is the beginning of your conversation. Send the first message to get started.
        </p>
      </div>
    )
  }

  const todayStr = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  })

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 flex flex-col custom-scrollbar bg-grid-pattern">
      <DateSeparator date={todayStr} />

      <div className="flex flex-col gap-1 pb-2">
        {activeMessages.map((msg, idx) => {
          const prevMsg = idx > 0 ? activeMessages[idx - 1] : null
          const showAvatar = prevMsg?.senderId !== msg.senderId

          const isOwn = String(msg.senderId) === String(user?.id) || msg.senderId === "me"
          let senderName = msg.senderName
          let senderAvatar = msg.senderAvatar

          if (!isOwn && selectedConversation?.participants) {
            const participant = selectedConversation.participants.find(p => String(p.id) === String(msg.senderId))
            if (participant) {
              senderName = participant.username
              senderAvatar = participant.avatar
            }
          }

          const displayMessage = { ...msg, senderName, senderAvatar }

          return (
            <MessageBubble
              key={msg.id}
              message={displayMessage}
              isOwn={isOwn}
              showAvatar={showAvatar}
            />
          )
        })}

        <div ref={bottomRef} className="h-1" />
      </div>
    </div>
  )
}
