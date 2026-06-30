import { create } from 'zustand'

interface AuthState {
  user: { id: string; username: string; email: string; avatar?: string } | null
  isAuthenticated: boolean
  login: (user: any) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: {
    id: "user-1",
    username: "Alex",
    email: "alex@example.com",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
  },
  isAuthenticated: true,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}))
