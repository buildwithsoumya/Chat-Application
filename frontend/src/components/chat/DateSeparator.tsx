interface DateSeparatorProps {
  date: string
}

export function DateSeparator({ date }: DateSeparatorProps) {
  return (
    <div className="flex items-center justify-center my-6">
      <div className="bg-surface border border-border text-muted-foreground text-xs font-medium px-3 py-1 rounded-full shadow-sm">
        {date}
      </div>
    </div>
  )
}
