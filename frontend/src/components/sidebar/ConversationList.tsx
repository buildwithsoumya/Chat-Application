import { useEffect, useState, useMemo } from "react"
import { useChatStore } from "@/store/chatStore"
import { ConversationCard } from "./ConversationCard"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface ConversationListProps {
  onSelectConversation?: (id: string) => void;
}

export function ConversationList({ onSelectConversation }: ConversationListProps) {
  const {
    conversations,
    fetchConversations,
    isLoading,
    selectedConversation,
    selectConversation
  } = useChatStore()

  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const filteredConversations = useMemo(() => {
    if (!debouncedQuery.trim()) return conversations;
    const query = debouncedQuery.toLowerCase();
    return conversations.filter(conv => {
      const nameMatch = conv.name?.toLowerCase().includes(query);
      const participantMatch = conv.participants.some(p => p.username.toLowerCase().includes(query));
      return nameMatch || participantMatch;
    });
  }, [conversations, debouncedQuery]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 sticky top-0 z-10 border-b border-border/30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <Input
            type="search"
            placeholder="Search conversations..."
            className="pl-9 bg-white/[0.03] border-border/40 focus-visible:border-blue-500/40 focus-visible:ring-1 focus-visible:ring-blue-500/20 h-9 rounded-lg text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
              <Skeleton className="h-11 w-11 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-24 rounded" />
                <Skeleton className="h-3 w-32 rounded" />
              </div>
            </div>
          ))
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map((conv) => (
            <ConversationCard
              key={conv.id}
              conversation={conv}
              isSelected={selectedConversation?.id === conv.id}
              onClick={() => {
                if (onSelectConversation) {
                  onSelectConversation(conv.id)
                } else {
                  selectConversation(conv.id)
                }
              }}
            />
          ))
        ) : (
          <div className="text-center p-6 text-sm text-muted-foreground mt-4">
            {searchQuery ? "No conversations found." : "No conversations yet."}
          </div>
        )}
      </div>
    </div>
  )
}
