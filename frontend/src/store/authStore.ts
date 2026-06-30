import { create } from 'zustand'
import { authService, type LoginFormData, type RegisterFormData } from '@/services/auth'

export interface User {
  id: string
  username: string
  email: string
  avatar?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  initializeAuth: () => void
  login: (data: LoginFormData) => Promise<void>
  register: (data: Omit<RegisterFormData, "confirmPassword">) => Promise<void>
  logout: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  initializeAuth: () => {
    // In a real app, this would verify the token with the backend and fetch the user profile
    const token = localStorage.getItem('token');
    if (token) {
      // Mock user initialization if we only have token stored without user data locally
      // For now, we'll rely on login/register to populate the user or assume basic auth state
      set({ isAuthenticated: true, token });
    } else {
      set({ isAuthenticated: false, user: null, token: null });
    }
  },

  login: async (data: LoginFormData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authService.login(data)
      localStorage.setItem('token', response.token)
      set({ 
        user: response.user, 
        token: response.token,
        isAuthenticated: true, 
        isLoading: false 
      })
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || "Failed to login"
      set({ error: message, isLoading: false })
      throw error
    }
  },

  register: async (data: Omit<RegisterFormData, "confirmPassword">) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authService.register(data)
      localStorage.setItem('token', response.token)
      set({ 
        user: response.user, 
        token: response.token,
        isAuthenticated: true, 
        isLoading: false 
      })
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || "Failed to register"
      set({ error: message, isLoading: false })
      throw error
    }
  },

  logout: () => {
    authService.logout()
    set({ user: null, token: null, isAuthenticated: false })
  },

  clearError: () => set({ error: null })
}))
