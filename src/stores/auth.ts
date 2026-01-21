import { defineStore } from 'pinia'

type AuthState = {
  token: string | null
}

const STORAGE_KEY = 'erp.auth.token'

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: null,
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.token),
  },

  actions: {
    loadFromStorage() {
      const token = localStorage.getItem(STORAGE_KEY)
      this.token = token && token.length > 0 ? token : null
    },

    setToken(token: string) {
      this.token = token
      localStorage.setItem(STORAGE_KEY, token)
    },

    clear() {
      this.token = null
      localStorage.removeItem(STORAGE_KEY)
    },
  },
})
