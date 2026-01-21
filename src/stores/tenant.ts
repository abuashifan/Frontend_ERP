import { defineStore } from 'pinia'

type TenantState = {
  activeCompanyId: string | null
}

const STORAGE_KEY = 'erp.tenant.activeCompanyId'

export const useTenantStore = defineStore('tenant', {
  state: (): TenantState => ({
    activeCompanyId: null,
  }),

  getters: {
    hasActiveCompany: (state) => Boolean(state.activeCompanyId),
  },

  actions: {
    loadFromStorage() {
      const value = localStorage.getItem(STORAGE_KEY)
      const normalized = value?.trim() ?? ''
      this.activeCompanyId = normalized.length > 0 ? normalized : null
    },

    setActiveCompanyId(companyId: string) {
      const normalized = companyId.trim()
      if (normalized.length === 0) {
        this.clear()
        return
      }

      this.activeCompanyId = normalized
      localStorage.setItem(STORAGE_KEY, normalized)
    },

    clear() {
      this.activeCompanyId = null
      localStorage.removeItem(STORAGE_KEY)
    },
  },
})
