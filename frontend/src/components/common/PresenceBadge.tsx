import * as React from "react"
import { cn } from "@/lib/utils"

interface PresenceBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: "online" | "offline" | "away" | "busy"
}

export function PresenceBadge({ status, className, ...props }: PresenceBadgeProps) {
  const statusColor = {
    online: "bg-success",
    offline: "bg-muted-foreground",
    away: "bg-yellow-500",
    busy: "bg-destructive",
  }

  return (
    <div
      className={cn(
        "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
        statusColor[status],
        className
      )}
      {...props}
    />
  )
}
