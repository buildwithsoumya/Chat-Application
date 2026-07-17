import { MessageCircle } from "lucide-react"

export function EmptyChat() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-bgPrimary/30 p-4">
      <div className="h-16 w-16 rounded-full bg-surface flex items-center justify-center mb-4 shadow-sm border border-border">
        <MessageCircle className="h-8 w-8 text-primary" />
      </div>
      <h3 className="font-semibold text-lg text-foreground">Your Messages</h3>
      <p className="text-sm mt-1 text-center max-w-sm">
        Select a conversation from the sidebar or start a new one to begin chatting.
      </p>
    </div>
  )
}
