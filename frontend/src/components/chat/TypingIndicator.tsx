export function TypingIndicator() {
  return (
    <div className="flex w-full mt-2 justify-start items-end gap-2">
      <div className="w-8 shrink-0 flex items-end">
        {/* Placeholder for avatar, could be passed as prop */}
      </div>
      <div className="bg-surface border border-border px-4 py-3 rounded-2xl rounded-bl-sm w-16 h-10 flex items-center justify-center gap-1">
        <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce"></div>
      </div>
    </div>
  )
}
