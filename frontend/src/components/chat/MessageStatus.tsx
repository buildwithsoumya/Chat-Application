import { Check, CheckCheck, Clock } from "lucide-react"

interface MessageStatusProps {
  status: "sending" | "sent" | "delivered" | "read"
}

export function MessageStatus({ status }: MessageStatusProps) {
  switch (status) {
    case "sending":
      return <Clock className="h-3 w-3 text-muted-foreground/70" />
    case "sent":
      return <Check className="h-3 w-3 text-muted-foreground" />
    case "delivered":
      return <CheckCheck className="h-3 w-3 text-muted-foreground" />
    case "read":
      return <CheckCheck className="h-3 w-3 text-primary" />
    default:
      return null
  }
}
