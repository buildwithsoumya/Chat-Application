import { useAuthStore } from "@/store/authStore"
import { useChatStore } from "@/store/chatStore"
import { Button } from "@/components/ui/button"
import { ConversationList } from "@/components/sidebar/ConversationList"
import { CreateConversationModal } from "@/components/sidebar/CreateConversationModal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, Settings } from "lucide-react"

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
            {/* Chat Header */}
            <div className="h-16 shrink-0 border-b border-border flex items-center justify-between px-6 bg-surface/50 backdrop-blur-sm z-10">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarImage src={selectedConversation.participants[0]?.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {activeName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{activeName}</h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedConversation.isGroup ? "Group Chat" : "Direct Message"}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Messages Area Placeholder */}
            <div className="flex-1 flex items-center justify-center bg-bgPrimary/30">
              <p className="text-muted-foreground text-sm">Messages will load here in the next phase</p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-bgPrimary/30">
            <div className="h-16 w-16 rounded-full bg-sidebar flex items-center justify-center mb-4 shadow-sm border border-border">
              <span className="text-2xl">💬</span>
            </div>
            <p className="font-medium">Your Messages</p>
            <p className="text-sm mt-1">Select a conversation or start a new one.</p>
          </div>
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
