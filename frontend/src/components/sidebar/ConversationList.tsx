import { useEffect, useState, useMemo } from "react"
import { useChatStore } from "@/store/chatStore"
import { ConversationCard } from "./ConversationCard"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export function ConversationList() {
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
  }, [conversations, searchQuery]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 sticky top-0 bg-sidebar z-10 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search conversations..."
            className="pl-9 bg-surface/50 border-transparent focus-visible:ring-1 focus-visible:ring-primary h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-transparent">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map((conv) => (
            <ConversationCard
              key={conv.id}
              conversation={conv}
              isSelected={selectedConversation?.id === conv.id}
              onClick={() => selectConversation(conv.id)}
            />
          ))
        ) : (
          <div className="text-center p-4 text-sm text-muted-foreground mt-4">
            {searchQuery ? "No conversations found matching your search." : "No conversations yet."}
          </div>
        )}
      </div>
    </div>
  )
}
