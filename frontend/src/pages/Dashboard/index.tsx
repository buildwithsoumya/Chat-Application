import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"

export default function Dashboard() {
  const { user, logout } = useAuthStore()

  return (
    <div className="flex h-screen bg-bgPrimary text-foreground">
      {/* Sidebar Placeholder */}
      <div className="w-64 bg-sidebar border-r border-border p-4 flex flex-col justify-between">
        <div>
          <h2 className="text-lg font-bold mb-4">ChatSphere</h2>
          <div className="space-y-2">
            <p className="text-sm font-medium">Conversations</p>
            {/* List */}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-sm">Logged in as {user?.username}</div>
          <Button variant="outline" onClick={logout}>Logout</Button>
        </div>
      </div>
      
      {/* Chat Area Placeholder */}
      <div className="flex-1 bg-surface flex flex-col items-center justify-center">
        <p className="text-muted-foreground">Select a conversation to start chatting</p>
      </div>

      {/* Right Sidebar Placeholder */}
      <div className="w-64 bg-sidebar border-l border-border p-4 hidden lg:block">
        <h3 className="font-semibold mb-2">Members</h3>
      </div>
    </div>
  )
}
