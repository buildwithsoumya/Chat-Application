import { useToastStore } from "@/store/toastStore"
import { X } from "lucide-react"

export function Toaster() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start justify-between w-80 p-4 rounded-lg shadow-lg border pointer-events-auto transition-all bg-background text-foreground ${
            toast.type === "error" ? "border-destructive text-destructive" :
            toast.type === "success" ? "border-success text-success" : "border-border"
          }`}
        >
          <div className="flex flex-col">
            <span className="font-semibold">{toast.title}</span>
            {toast.description && (
              <span className="text-sm opacity-90">{toast.description}</span>
            )}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
