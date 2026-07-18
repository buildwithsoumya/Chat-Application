interface DateSeparatorProps {
  date: string
}

export function DateSeparator({ date }: DateSeparatorProps) {
  return (
    <div className="flex items-center justify-center my-6">
      <div className="glass text-muted-foreground text-xs font-medium px-3 py-1 rounded-full">
        {date}
      </div>
    </div>
  )
}
