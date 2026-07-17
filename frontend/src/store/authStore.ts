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

  initializeAuth: () => Promise<void>
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

  initializeAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isAuthenticated: false, user: null, token: null });
      return;
    }

    set({ isLoading: true });
    try {
      const user = await authService.getCurrentUser(token);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      // Token is invalid, expired, or the user no longer exists.
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
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
      await authService.register(data)
      // We don't get a token back on register in this API, so user must login after
      set({ 
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
