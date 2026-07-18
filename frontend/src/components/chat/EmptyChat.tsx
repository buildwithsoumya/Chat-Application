import { MessageCircle } from "lucide-react"

export function EmptyChat() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-mesh-gradient p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      <div className="relative z-10 flex flex-col items-center animate-fade-in">
        <div className="h-20 w-20 rounded-2xl glass flex items-center justify-center mb-5 shadow-xl">
          <MessageCircle className="h-10 w-10 text-primary/70" />
        </div>
        <h3 className="font-semibold text-xl text-foreground mb-2">Your Messages</h3>
        <p className="text-sm text-center max-w-sm leading-relaxed">
          Select a conversation from the sidebar or start a new one to begin chatting in real-time.
        </p>
      </div>
    </div>
  )
}
