import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"

export default function Profile() {
  const { user, logout } = useAuthStore()

  return (
    <div className="flex flex-col h-screen bg-bgPrimary text-foreground items-center justify-center">
      <h2 className="text-2xl font-bold mb-4">Profile</h2>
      <div className="p-6 bg-surface border border-border rounded-lg shadow-sm w-96 space-y-4">
        <div>
          <label className="text-sm text-muted-foreground">Username</label>
          <div className="font-medium">{user?.username}</div>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Email</label>
          <div className="font-medium">{user?.email}</div>
        </div>
        <Button variant="destructive" onClick={logout} className="w-full mt-4">
          Logout
        </Button>
      </div>
    </div>
  )
}
