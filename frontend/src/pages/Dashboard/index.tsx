import { useState } from "react"
import { useAuthStore } from "@/store/authStore"
import { useChatStore } from "@/store/chatStore"
import { Button } from "@/components/ui/button"
import { ConversationList } from "@/components/sidebar/ConversationList"
import { CreateConversationModal } from "@/components/sidebar/CreateConversationModal"
import { ChatHeader } from "@/components/chat/ChatHeader"
import { MessageList } from "@/components/chat/MessageList"
import { MessageComposer } from "@/components/chat/MessageComposer"
import { EmptyChat } from "@/components/chat/EmptyChat"
import { SettingsModal } from "@/components/settings/SettingsModal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Settings, MessageCircle, LogOut, Users } from "lucide-react"

export default function Dashboard() {
  const { user, logout } = useAuthStore()
  const { selectedConversation, selectConversation } = useChatStore()
  const [showMobileSidebar, setShowMobileSidebar] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  const activeName = selectedConversation?.name ||
    selectedConversation?.participants?.[0]?.username ||
    "Unknown"

  const handleSelectConversation = (id: string) => {
    selectConversation(id)
    setShowMobileSidebar(false)
  }

  return (
    <div className="flex h-screen bg-bgPrimary text-foreground overflow-hidden">
      {/* Left Sidebar */}
      <div className={`w-80 glass-strong border-r border-border/50 flex flex-col h-full md:flex ${
        showMobileSidebar ? "flex absolute inset-0 z-20 md:relative" : "hidden"
      }`}>
        {/* User Profile Header */}
        <div className="p-4 flex items-center justify-between border-b border-border/30 h-16 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => setShowSettings(true)}>
            <div className="relative">
              <Avatar className="h-9 w-9 ring-2 ring-blue-500/20">
                <AvatarImage src={user?.avatar} alt={user?.username} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-primary text-sm font-semibold">
                  {user?.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-sidebar" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-medium text-sm truncate">{user?.username}</span>
              <span className="text-[11px] text-success flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-success"></span> Online
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <CreateConversationModal />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/[0.05] rounded-lg"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-4 w-4" />
              <span className="sr-only">Settings</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-hidden">
          <ConversationList onSelectConversation={handleSelectConversation} />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col relative h-full ${
        showMobileSidebar ? "hidden md:flex" : "flex"
      }`}>
        {selectedConversation ? (
          <>
            <ChatHeader
              conversation={selectedConversation}
              onBack={() => setShowMobileSidebar(true)}
            />
            <MessageList />
            <MessageComposer />
          </>
        ) : (
          <EmptyChat />
        )}
      </div>

      {/* Right Sidebar — Conversation Details */}
      <div className="w-64 glass-strong border-l border-border/50 p-5 hidden lg:block h-full overflow-y-auto custom-scrollbar">
        {selectedConversation ? (
          <div className="animate-fade-in">
            <h3 className="font-semibold text-xs mb-4 uppercase tracking-wider text-muted-foreground">About</h3>
            <div className="flex flex-col items-center justify-center py-6 border-b border-border/30">
              {selectedConversation.isGroup ? (
                <div className="h-20 w-20 mb-3 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 flex items-center justify-center ring-2 ring-indigo-500/20">
                  <Users className="h-10 w-10" />
                </div>
              ) : (
                <Avatar className="h-20 w-20 mb-3 ring-2 ring-blue-500/20">
                  <AvatarImage src={selectedConversation.participants[0]?.avatar} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-primary font-bold">
                    {activeName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              <h4 className="font-semibold text-lg">{activeName}</h4>
              <p className="text-sm text-muted-foreground mt-0.5">
                {selectedConversation.isGroup ? `${selectedConversation.participants.length} members` : "Direct Message"}
              </p>
              {selectedConversation.isGroup && selectedConversation.participants.length > 0 && (
                <div className="flex -space-x-2 mt-3">
                  {selectedConversation.participants.slice(0, 4).map((p) => (
                    <Avatar key={p.id} className="h-7 w-7 ring-2 ring-sidebar">
                      <AvatarImage src={p.avatar} />
                      <AvatarFallback className="text-[10px] bg-surface text-muted-foreground">
                        {p.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <div className="h-12 w-12 rounded-xl glass flex items-center justify-center mb-3">
              <MessageCircle className="h-6 w-6 text-muted-foreground/60" />
            </div>
            <p className="text-sm">Select a conversation to see details</p>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <SettingsModal open={showSettings} onOpenChange={setShowSettings} />
    </div>
  )
}
