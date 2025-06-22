import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  phone?: string
  wechatId?: string
  nickname?: string
  avatar?: string
  role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'VISITOR'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  lastLoginAt?: Date
  createdAt: Date
  isFirstLogin?: boolean
  settings?: {
    sourceLanguage: string
    targetLanguage: string
    voiceName?: string
    voiceSpeed: number
    autoPlay: boolean
  }
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  needsRoleSelection: boolean
  
  // Actions
  login: (credentials: { fingerprint?: string; phone?: string; code?: string }) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
  setRole: (role: User['role']) => Promise<void>
  setNeedsRoleSelection: (needs: boolean) => void
  clearError: () => void
  fetchUserInfo: () => Promise<void>
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      needsRoleSelection: false,

      login: async (credentials) => {
        set({ isLoading: true, error: null })
        
        try {
          let endpoint = ''
          let body = {}
          
          if (credentials.fingerprint) {
            endpoint = '/api/account/visitor-login'
            body = { fingerprint: credentials.fingerprint }
          } else if (credentials.phone && credentials.code) {
            endpoint = '/api/account/phone-login'
            body = { phone: credentials.phone, code: credentials.code }
          } else {
            throw new Error('Invalid credentials')
          }

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          })

          const data = await response.json()

          if (data.code === 1000) {
            set({
              user: data.data.account,
              token: data.data.token,
              isAuthenticated: true,
              isLoading: false,
            })
          } else {
            throw new Error(data.message || '登录失败')
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '登录失败',
            isLoading: false,
          })
          throw error
        }
      },

      logout: async () => {
        const { token } = get()
        
        // 如果有token，先调用服务器端退出登录
        if (token) {
          try {
            await fetch('/api/account/logout', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            })
          } catch (error) {
            console.error('服务器端退出登录失败:', error)
            // 即使服务器端失败，仍然清除本地状态
          }
        }

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
          needsRoleSelection: false,
        })
      },

      setUser: (user) => {
        set({ user })
      },

      setNeedsRoleSelection: (needs) => {
        set({ needsRoleSelection: needs })
      },

      setRole: async (role) => {
        const { token } = get()
        if (!token) throw new Error('未登录')

        set({ isLoading: true, error: null })

        try {
          const response = await fetch('/api/account/role', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ role }),
          })

          const data = await response.json()

          if (data.code === 1000) {
            set((state) => ({
              user: state.user ? { ...state.user, role } : null,
              needsRoleSelection: false, // 角色选择完成，关闭角色选择状态
              isLoading: false,
            }))
          } else {
            throw new Error(data.message || '角色设置失败')
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '角色设置失败',
            isLoading: false,
          })
          throw error
        }
      },

      clearError: () => {
        set({ error: null })
      },

      fetchUserInfo: async () => {
        const { token } = get()
        if (!token) return

        set({ isLoading: true })

        try {
          const response = await fetch('/api/account/info', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })

          const data = await response.json()

          if (data.code === 1000) {
            set({
              user: data.data,
              isLoading: false,
            })
          } else {
            throw new Error(data.message || '获取用户信息失败')
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '获取用户信息失败',
            isLoading: false,
          })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        needsRoleSelection: state.needsRoleSelection,
      }),
    }
  )
)

export default useAuthStore 