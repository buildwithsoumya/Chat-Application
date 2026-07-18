import { useRef, useEffect, useState } from "react"
import { useAuthStore } from "@/store/authStore"
import { useChatStore } from "@/store/chatStore"
import { Button } from "@/components/ui/button"
import { Smile, Paperclip, Send, X, FileText, Image as ImageIcon } from "lucide-react"
import { EmojiPicker } from "./EmojiPicker"
import { cn } from "@/lib/utils"

interface SelectedFile {
  name: string
  size: number
  type: string
  preview?: string
}

export function MessageComposer() {
  const { user } = useAuthStore()
  const { selectedConversation, draftMessages, setDraft, sendMessage } = useChatStore()

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const conversationId = selectedConversation?.id
  const draft = conversationId ? draftMessages[conversationId] || "" : ""

  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null)

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }

  const handleTyping = (val: string) => {
    setDraft(conversationId!, val)

    useChatStore.getState().sendTypingIndicator(true)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      useChatStore.getState().sendTypingIndicator(false)
    }, 1500)
  }

  useEffect(() => {
    handleInput()
  }, [draft])

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        useChatStore.getState().sendTypingIndicator(false)
      }
    }
  }, [])

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current
    if (!textarea) {
      handleTyping(draft + emoji)
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newText = draft.slice(0, start) + emoji + draft.slice(end)
    handleTyping(newText)

    requestAnimationFrame(() => {
      textarea.focus()
      const cursorPos = start + emoji.length
      textarea.setSelectionRange(cursorPos, cursorPos)
    })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isImage = file.type.startsWith("image/")
    const fileData: SelectedFile = {
      name: file.name,
      size: file.size,
      type: file.type,
    }

    if (isImage) {
      const reader = new FileReader()
      reader.onload = () => {
        setSelectedFile({ ...fileData, preview: reader.result as string })
      }
      reader.readAsDataURL(file)
    } else {
      setSelectedFile(fileData)
    }

    e.target.value = ""
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleSend = () => {
    if ((!draft.trim() && !selectedFile) || !conversationId || !user) return
    sendMessage(conversationId, draft.trim(), user.id, user.username, selectedFile?.preview || null)
    if (selectedFile) {
      setSelectedFile(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!conversationId) return null

  return (
    <div className="p-4 glass-strong border-t border-border/30 shrink-0 z-10 relative">
      {/* File attachment preview */}
      {selectedFile && (
        <div className="mb-2 flex items-center gap-3 glass rounded-xl p-2.5 pr-3 animate-scale-in">
          {selectedFile.preview ? (
            <img
              src={selectedFile.preview}
              alt={selectedFile.name}
              className="h-12 w-12 rounded-lg object-cover border border-border/50"
            />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center border border-border/50">
              <FileText className="h-5 w-5 text-blue-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(selectedFile.size)}
              {!selectedFile.preview && " · File attachment (upload not yet supported)"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedFile(null)}
            className="h-7 w-7 rounded-lg hover:bg-white/[0.08] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Emoji picker */}
      {showEmojiPicker && (
        <EmojiPicker
          onSelect={handleEmojiSelect}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}

      <div className="flex items-end gap-2 glass rounded-2xl p-2 shadow-sm focus-within:ring-1 focus-within:ring-blue-500/30 transition-all">
        <div className="flex gap-1 pb-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Attach file"
            className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 rounded-lg"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar,.7z"
          />
        </div>

        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Type a message..."
          aria-label="Message text area"
          className="flex-1 max-h-[150px] min-h-[40px] bg-transparent resize-none outline-none py-2 px-1 text-[15px] custom-scrollbar overflow-y-auto placeholder:text-muted-foreground/50"
          rows={1}
        />

        <div className="flex gap-1 pb-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Add emoji"
            className={cn(
              "h-8 w-8 rounded-lg transition-colors",
              showEmojiPicker
                ? "text-primary bg-blue-500/10"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Smile className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleSend}
            disabled={!draft.trim() && !selectedFile}
            size="icon"
            aria-label="Send message"
            className="h-8 w-8 rounded-lg ml-1 transition-all bg-gradient-to-br from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-muted disabled:to-muted shadow-md shadow-blue-500/20"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="text-center mt-2">
        <span className="text-[10px] text-muted-foreground/40">
          <strong className="font-medium">Enter</strong> to send · <strong className="font-medium">Shift + Enter</strong> for new line
        </span>
      </div>
    </div>
  )
}
