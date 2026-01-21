import { defineStore } from 'pinia'
import type {
  ChildTab,
  ChildTabId,
  ModuleTab,
  ModuleTabId,
  OpenChildTabPayload,
  OpenModulePayload,
} from '../types/virtualTabs'
import { MAX_OPEN_MODULE_TABS, MAX_OPEN_TABS } from '../config/tabs'

type OpenModuleResult =
  | { ok: true; activatedExisting: boolean }
  | { ok: false; reason: 'max_modules_reached'; message: string }

type OpenChildTabResult =
  | { ok: true; activatedExisting: boolean; evictedTabIds: ChildTabId[]; tabId: ChildTabId }
  | { ok: false; reason: 'no_active_module' | 'max_tabs_reached'; message: string }

type TabsState = {
  modules: ModuleTab[]
  activeModuleId: ModuleTabId | null
}

function buildChildTabId(moduleId: ModuleTabId, localId: string): ChildTabId {
  return `${moduleId}::${localId}`
}

function findModule(modules: ModuleTab[], id: ModuleTabId): ModuleTab | null {
  return modules.find((m) => m.id === id) ?? null
}

function findChildTab(modules: ModuleTab[], id: ChildTabId): { module: ModuleTab; tab: ChildTab } | null {
  for (const module of modules) {
    const tab = module.tabs.find((t) => t.id === id)
    if (tab) return { module, tab }
  }
  return null
}

export const useTabsStore = defineStore('tabs', {
  state: (): TabsState => ({
    modules: [],
    activeModuleId: null,
  }),

  getters: {
    activeModule(state): ModuleTab | null {
      if (!state.activeModuleId) return null
      return state.modules.find((m) => m.id === state.activeModuleId) ?? null
    },

    activeChildTab(): ChildTab | null {
      const module = this.activeModule
      if (!module?.activeChildTabId) return null
      return module.tabs.find((t) => t.id === module.activeChildTabId) ?? null
    },

    getModule: (state) => {
      return (id: ModuleTabId) => state.modules.find((m) => m.id === id) ?? null
    },

    getChildTab: (state) => {
      return (id: ChildTabId) => findChildTab(state.modules, id)?.tab ?? null
    },

    hasAnyDirtyInActiveModule(): boolean {
      const module = this.activeModule
      if (!module) return false
      return module.tabs.some((t) => t.dirty)
    },
  },

  actions: {
    openModule(payload: OpenModulePayload): OpenModuleResult {
      const existing = this.modules.find((m) => m.id === payload.id)
      const now = Date.now()

      if (existing) {
        this.activeModuleId = existing.id
        existing.lastAccessedAt = now
        if (!existing.activeChildTabId) {
          // Ensure module always has at least one child tab.
          this.openChildTab({ moduleId: existing.id, ...payload.defaultChild })
        }
        return { ok: true, activatedExisting: true }
      }

      if (this.modules.length >= MAX_OPEN_MODULE_TABS) {
        return {
          ok: false,
          reason: 'max_modules_reached',
          message: 'Maksimum menu tab sudah tercapai. Tutup menu tab lain sebelum membuka yang baru.',
        }
      }

      const module: ModuleTab = {
        id: payload.id,
        title: payload.title,
        closable: payload.closable ?? true,
        showSubTabsBar: payload.showSubTabsBar ?? true,
        openedAt: now,
        lastAccessedAt: now,
        tabs: [],
        activeChildTabId: null,
      }

      this.modules.push(module)
      this.activeModuleId = module.id
      this.openChildTab({ moduleId: module.id, ...payload.defaultChild })

      return { ok: true, activatedExisting: false }
    },

    activateModule(id: ModuleTabId) {
      const module = findModule(this.modules, id)
      if (!module) return
      this.activeModuleId = id
      module.lastAccessedAt = Date.now()
      if (!module.activeChildTabId && module.tabs.length > 0) {
        module.activeChildTabId = module.tabs[0]?.id ?? null
      }
    },

    closeModule(id: ModuleTabId) {
      const idx = this.modules.findIndex((m) => m.id === id)
      if (idx === -1) return

      const wasActive = this.activeModuleId === id
      this.modules.splice(idx, 1)

      if (!wasActive) return
      const fallback = this.modules[idx] ?? this.modules[idx - 1] ?? null
      this.activeModuleId = fallback?.id ?? null
    },

    openChildTab(payload: OpenChildTabPayload & { moduleId?: ModuleTabId }): OpenChildTabResult {
      const moduleId = payload.moduleId ?? this.activeModuleId
      if (!moduleId) {
        return { ok: false, reason: 'no_active_module', message: 'Tidak ada menu tab yang aktif.' }
      }

      const module = findModule(this.modules, moduleId)
      if (!module) {
        return { ok: false, reason: 'no_active_module', message: 'Menu tab tidak ditemukan.' }
      }

      const now = Date.now()
      const tabId = buildChildTabId(moduleId, payload.localId)
      const existing = module.tabs.find((t) => t.id === tabId)
      if (existing) {
        module.activeChildTabId = existing.id
        existing.lastAccessedAt = now
        return { ok: true, activatedExisting: true, evictedTabIds: [], tabId }
      }

      const evictedTabIds: ChildTabId[] = []
      if (module.tabs.length >= MAX_OPEN_TABS) {
        const evictable = module.tabs
          .filter((t) => t.id !== module.activeChildTabId)
          .filter((t) => t.closable)
          .filter((t) => !t.dirty)
          .sort((a, b) => a.lastAccessedAt - b.lastAccessedAt)

        const candidate = evictable[0]
        if (!candidate) {
          return {
            ok: false,
            reason: 'max_tabs_reached',
            message:
              'Maksimum tab form sudah tercapai. Tutup tab lain (terutama yang masih memiliki perubahan) sebelum membuka tab baru.',
          }
        }

        evictedTabIds.push(candidate.id)
        this.closeChildTab(candidate.id)
      }

      const tab: ChildTab = {
        id: tabId,
        localId: payload.localId,
        title: payload.title,
        component: payload.component,
        props: payload.props ?? {},
        dirty: false,
        closable: payload.closable ?? true,
        openedAt: now,
        lastAccessedAt: now,
      }

      module.tabs.push(tab)
      module.activeChildTabId = tab.id
      module.lastAccessedAt = now
      this.activeModuleId = moduleId

      return { ok: true, activatedExisting: false, evictedTabIds, tabId }
    },

    activateChildTab(id: ChildTabId) {
      const found = findChildTab(this.modules, id)
      if (!found) return
      const now = Date.now()
      this.activeModuleId = found.module.id
      found.module.activeChildTabId = id
      found.module.lastAccessedAt = now
      found.tab.lastAccessedAt = now
    },

    closeChildTab(id: ChildTabId) {
      const found = findChildTab(this.modules, id)
      if (!found) return

      const idx = found.module.tabs.findIndex((t) => t.id === id)
      if (idx === -1) return

      const wasActive = found.module.activeChildTabId === id
      found.module.tabs.splice(idx, 1)

      if (!wasActive) return

      const fallback = found.module.tabs[idx] ?? found.module.tabs[idx - 1] ?? null
      found.module.activeChildTabId = fallback?.id ?? null
    },

    setDirty(id: ChildTabId, dirty: boolean) {
      const found = findChildTab(this.modules, id)
      if (!found) return
      found.tab.dirty = dirty
    },

    updateTitle(id: ChildTabId, title: string) {
      const found = findChildTab(this.modules, id)
      if (!found) return
      found.tab.title = title
    },
  },
})
