import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useChatStore } from "@/store/chatStore"
import { userService, type UserSearchResult } from "@/services/userService"
import { toast } from "@/store/toastStore"
import { Plus, Search, X, Users, User } from "lucide-react"

const schema = z
  .object({
    name: z.string().optional(),
    isGroup: z.boolean(),
    participantIds: z.array(z.string()).default([]),
  })
  .refine(
    (data) => !data.isGroup || (data.name && data.name.trim().length > 0),
    {
      message: "Group name is required",
      path: ["name"],
    }
  )
  .refine((data) => data.participantIds.length > 0, {
    message: "Select at least one participant",
    path: ["participantIds"],
  })
  .refine((data) => data.isGroup || data.participantIds.length === 1, {
    message: "Direct conversations require exactly one participant",
    path: ["participantIds"],
  })

type FormData = z.infer<typeof schema>

export function CreateConversationModal() {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [selectedParticipants, setSelectedParticipants] = useState<UserSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const { createConversation } = useChatStore()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      isGroup: false,
      participantIds: [],
    },
  })

  const isGroup = watch("isGroup")
  const participantIds = watch("participantIds")

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await userService.searchUsers(searchQuery.trim(), 10)
        setSearchResults(results)
      } catch (_error) {
        // Search failures are non-fatal; just clear results.
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const syncParticipantIds = (participants: UserSearchResult[]) => {
    setSelectedParticipants(participants)
    setValue("participantIds", participants.map((p) => p.id), {
      shouldValidate: true,
    })
  }

  const addParticipant = (user: UserSearchResult) => {
    if (participantIds.includes(user.id)) return

    if (!isGroup) {
      syncParticipantIds([user])
    } else {
      syncParticipantIds([...selectedParticipants, user])
    }
    setSearchQuery("")
    setSearchResults([])
  }

  const removeParticipant = (id: string) => {
    syncParticipantIds(selectedParticipants.filter((p) => p.id !== id))
  }

  const onSubmit = async (data: FormData) => {
    try {
      await createConversation({
        name: data.name || "",
        isGroup: data.isGroup,
        participantIds: data.participantIds,
      })
      toast.success("Conversation created")
      setOpen(false)
      reset()
      setSearchQuery("")
      setSearchResults([])
      setSelectedParticipants([])
    } catch (_error) {
      toast.error("Failed to create conversation")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Plus className="h-5 w-5" />
          <span className="sr-only">New Conversation</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>
            Start a direct chat or create a group conversation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          {/* Type toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={!isGroup ? "default" : "outline"}
              size="sm"
              className="flex-1 gap-2"
              onClick={() => {
                setValue("isGroup", false)
                if (selectedParticipants.length > 1) {
                  syncParticipantIds([selectedParticipants[0]])
                }
              }}
            >
              <User className="h-4 w-4" />
              Direct
            </Button>
            <Button
              type="button"
              variant={isGroup ? "default" : "outline"}
              size="sm"
              className="flex-1 gap-2"
              onClick={() => setValue("isGroup", true)}
            >
              <Users className="h-4 w-4" />
              Group
            </Button>
          </div>

          {/* Group name */}
          {isGroup && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Group Name</label>
              <Input
                {...register("name")}
                placeholder="e.g. Project Alpha"
                className={errors.name ? "border-destructive" : ""}
                disabled={isSubmitting}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
          )}

          {/* Participant search */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {isGroup ? "Add Participants" : "Select a Participant"}
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by username..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {isSearching && <p className="text-sm text-muted-foreground">Searching...</p>}

            {!isSearching && searchResults.length > 0 && (
              <div className="border rounded-md max-h-32 overflow-y-auto">
                {searchResults
                  .filter((user) => !participantIds.includes(user.id))
                  .map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => addParticipant(user)}
                      className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-center justify-between"
                    >
                      <span>{user.username}</span>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
              </div>
            )}

            {!isSearching && searchQuery.trim() && searchResults.length === 0 && (
              <p className="text-sm text-muted-foreground">No users found.</p>
            )}

            {errors.participantIds && (
              <p className="text-sm text-destructive">{errors.participantIds.message}</p>
            )}
          </div>

          {/* Selected participants */}
          {selectedParticipants.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedParticipants.map((user) => (
                <Badge key={user.id} variant="secondary" className="gap-1 pr-1">
                  {user.username}
                  <button
                    type="button"
                    onClick={() => removeParticipant(user.id)}
                    className="rounded-full hover:bg-muted p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
