import { defineStore } from 'pinia'
import type { OpenTabPayload, VirtualTab, VirtualTabId } from '../types/virtualTabs'
import { MAX_OPEN_TABS } from '../config/tabs'

type OpenTabResult =
  | { ok: true; activatedExisting: boolean; evictedTabIds: VirtualTabId[] }
  | { ok: false; reason: 'max_tabs_reached'; message: string }

type TabsState = {
  tabs: VirtualTab[]
  activeTabId: VirtualTabId | null
}

export const useTabsStore = defineStore('tabs', {
  state: (): TabsState => ({
    tabs: [],
    activeTabId: null,
  }),

  getters: {
    activeTab(state): VirtualTab | null {
      if (!state.activeTabId) return null
      return state.tabs.find((t) => t.id === state.activeTabId) ?? null
    },

    getTab: (state) => {
      return (id: VirtualTabId) => state.tabs.find((t) => t.id === id) ?? null
    },
  },

  actions: {
    openTab(payload: OpenTabPayload): OpenTabResult {
      const existing = this.tabs.find((t) => t.id === payload.id)
      if (existing) {
        this.activeTabId = existing.id
        existing.lastAccessedAt = Date.now()
        return { ok: true, activatedExisting: true, evictedTabIds: [] }
      }

      const evictedTabIds: VirtualTabId[] = []
      if (this.tabs.length >= MAX_OPEN_TABS) {
        const evictable = this.tabs
          .filter((t) => t.id !== this.activeTabId)
          .filter((t) => t.closable)
          .filter((t) => !t.dirty)
          .sort((a, b) => a.lastAccessedAt - b.lastAccessedAt)

        const candidate = evictable[0]
        if (!candidate) {
          return {
            ok: false,
            reason: 'max_tabs_reached',
            message:
              'Maksimum tab sudah tercapai. Tutup tab lain (terutama yang masih memiliki perubahan) sebelum membuka tab baru.',
          }
        }

        evictedTabIds.push(candidate.id)
        this.closeTab(candidate.id)
      }

      const now = Date.now()
      const tab: VirtualTab = {
        id: payload.id,
        title: payload.title,
        component: payload.component,
        props: payload.props ?? {},
        dirty: false,
        closable: payload.closable ?? true,
        openedAt: now,
        lastAccessedAt: now,
      }

      this.tabs.push(tab)
      this.activeTabId = tab.id

      return { ok: true, activatedExisting: false, evictedTabIds }
    },

    activateTab(id: VirtualTabId) {
      const tab = this.tabs.find((t) => t.id === id)
      if (!tab) return
      this.activeTabId = id
      tab.lastAccessedAt = Date.now()
    },

    closeTab(id: VirtualTabId) {
      const idx = this.tabs.findIndex((t) => t.id === id)
      if (idx === -1) return

      const wasActive = this.activeTabId === id
      this.tabs.splice(idx, 1)

      if (!wasActive) return

      const fallback = this.tabs[idx] ?? this.tabs[idx - 1] ?? null
      this.activeTabId = fallback?.id ?? null
    },

    setDirty(id: VirtualTabId, dirty: boolean) {
      const tab = this.tabs.find((t) => t.id === id)
      if (!tab) return
      tab.dirty = dirty
    },

    updateTitle(id: VirtualTabId, title: string) {
      const tab = this.tabs.find((t) => t.id === id)
      if (!tab) return
      tab.title = title
    },
  },
})
