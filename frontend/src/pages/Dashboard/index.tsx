import { useAuthStore } from "@/store/authStore"
import { useChatStore } from "@/store/chatStore"
import { Button } from "@/components/ui/button"
import { ConversationList } from "@/components/sidebar/ConversationList"
import { CreateConversationModal } from "@/components/sidebar/CreateConversationModal"
import { ChatHeader } from "@/components/chat/ChatHeader"
import { MessageList } from "@/components/chat/MessageList"
import { MessageComposer } from "@/components/chat/MessageComposer"
import { EmptyChat } from "@/components/chat/EmptyChat"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut } from "lucide-react"

export default function Dashboard() {
  const { user, logout } = useAuthStore()
  const { selectedConversation } = useChatStore()

  const activeName = selectedConversation?.name || 
    selectedConversation?.participants?.[0]?.username || 
    "Unknown"

  return (
    <div className="flex h-screen bg-bgPrimary text-foreground overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-80 bg-sidebar border-r border-border flex flex-col hidden md:flex h-full">
        {/* User Profile Header */}
        <div className="p-4 flex items-center justify-between border-b border-border/50 h-16 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.avatar} alt={user?.username} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {user?.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="font-medium text-sm truncate">{user?.username}</span>
              <span className="text-xs text-success flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-success"></span> Online
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <CreateConversationModal />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={logout}>
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </div>
        
        {/* Conversation List */}
        <div className="flex-1 overflow-hidden">
          <ConversationList />
        </div>
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 bg-surface flex flex-col relative h-full">
        {selectedConversation ? (
          <>
            <ChatHeader conversation={selectedConversation} />
            <MessageList />
            <MessageComposer />
          </>
        ) : (
          <EmptyChat />
        )}
      </div>

      {/* Right Sidebar Placeholder */}
      <div className="w-64 bg-sidebar border-l border-border p-4 hidden lg:block h-full overflow-y-auto">
        {selectedConversation ? (
          <>
            <h3 className="font-semibold text-sm mb-4 uppercase tracking-wider text-muted-foreground">About</h3>
            <div className="flex flex-col items-center justify-center py-6 border-b border-border/50">
              <Avatar className="h-20 w-20 mb-3 border-2 border-surface">
                <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                  {activeName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h4 className="font-medium text-lg">{activeName}</h4>
              <p className="text-sm text-muted-foreground">
                {selectedConversation.isGroup ? `${selectedConversation.participants.length} members` : "Direct Message"}
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm text-center">
            Select a conversation to see details
          </div>
        )}
      </div>
    </div>
  )
}
