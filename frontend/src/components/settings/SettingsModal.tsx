import { useState, useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuthStore } from "@/store/authStore"
import { toast } from "@/store/toastStore"
import { Camera, User as UserIcon, Info, LogOut, X } from "lucide-react"
import { cn } from "@/lib/utils"

const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50, "Username too long"),
  bio: z.string().max(200, "Bio must be 200 characters or less").optional().default(""),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Tab = "profile" | "about"

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { user, updateProfile, logout, isLoading } = useAuthStore()
  const [activeTab, setActiveTab] = useState<Tab>("profile")
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user?.avatar)
  const [avatarData, setAvatarData] = useState<string | undefined>(undefined)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || "",
      bio: user?.bio || "",
    },
  })

  const bioValue = watch("bio") || ""
  const bioCount = bioValue.length

  useEffect(() => {
    if (open && user) {
      reset({
        username: user.username,
        bio: user.bio || "",
      })
      setAvatarPreview(user.avatar)
      setAvatarData(undefined)
    }
  }, [open, user, reset])

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file", "Please select an image file")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large", "Image must be under 2MB")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setAvatarPreview(result)
      setAvatarData(result)
    }
    reader.readAsDataURL(file)

    e.target.value = ""
  }

  const removeAvatar = () => {
    setAvatarPreview(undefined)
    setAvatarData("")
  }

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile({
        username: data.username,
        bio: data.bio || "",
        avatar: avatarData !== undefined ? avatarData : undefined,
      })
      toast.success("Profile updated successfully")
      onOpenChange(false)
    } catch (err: any) {
      toast.error("Update failed", err.response?.data?.detail || "Could not update profile")
    }
  }

  const handleLogout = () => {
    onOpenChange(false)
    logout()
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] glass-strong border-border/50 p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Manage your profile and account settings</DialogDescription>
        </DialogHeader>

        {/* Header with avatar */}
        <div className="relative flex flex-col items-center pt-8 pb-6 px-6 bg-mesh-gradient">
          <div className="absolute inset-0 bg-grid-pattern opacity-20" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative group">
              <Avatar className="h-24 w-24 ring-4 ring-border/30 shadow-xl">
                <AvatarImage src={avatarPreview} alt={user.username} />
                <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-primary">
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center shadow-lg transition-colors ring-2 ring-background"
              >
                <Camera className="h-4 w-4 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarSelect}
              />
              {avatarPreview && (
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="absolute top-0 right-0 h-6 w-6 rounded-full bg-destructive hover:bg-destructive/80 flex items-center justify-center shadow-lg transition-colors ring-2 ring-background"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              )}
            </div>
            <h2 className="mt-3 text-xl font-bold">{user.username}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/30">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
              activeTab === "profile"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <UserIcon className="h-4 w-4" />
            Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("about")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
              activeTab === "about"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Info className="h-4 w-4" />
            About
          </button>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === "profile" ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input
                  {...register("username")}
                  placeholder="Enter your username"
                  className={errors.username ? "border-destructive" : ""}
                  disabled={isSubmitting}
                />
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">About</label>
                  <span className={cn(
                    "text-xs",
                    bioCount > 200 ? "text-destructive" : "text-muted-foreground/60"
                  )}>
                    {bioCount}/200
                  </span>
                </div>
                <textarea
                  {...register("bio")}
                  placeholder="Tell something about yourself..."
                  maxLength={200}
                  rows={3}
                  className={cn(
                    "w-full rounded-lg bg-white/[0.03] border border-border/40 px-3 py-2 text-sm",
                    "placeholder:text-muted-foreground/50 outline-none resize-none",
                    "focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all",
                    "custom-scrollbar",
                    errors.bio ? "border-destructive" : ""
                  )}
                  disabled={isSubmitting}
                />
                {errors.bio && (
                  <p className="text-sm text-destructive">{errors.bio.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={user.email}
                  disabled
                  className="bg-white/[0.02] text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground/60">Email cannot be changed</p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 text-muted-foreground"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 glow-sm"
                  isLoading={isSubmitting || isLoading}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="glass rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-3">Account Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">User ID</span>
                    <span className="font-mono text-xs">{user.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Username</span>
                    <span className="font-medium">{user.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium truncate ml-4">{user.email}</span>
                  </div>
                  {user.bio && (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground shrink-0">About</span>
                      <span className="font-medium text-right">{user.bio}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="glass rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-2">About ChatSphere</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  ChatSphere is a real-time chat application built with FastAPI, React, and WebSockets.
                  It features direct and group conversations, typing indicators, and online presence.
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
