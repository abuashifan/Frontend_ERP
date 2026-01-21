import { computed } from 'vue'
import { useTabsStore } from '../stores/tabs'

export function useTabDirty(tabId: string) {
  const tabsStore = useTabsStore()

  const dirty = computed(() => tabsStore.getTab(tabId)?.dirty ?? false)

  function markDirty() {
    tabsStore.setDirty(tabId, true)
  }

  function clearDirty() {
    tabsStore.setDirty(tabId, false)
  }

  return {
    dirty,
    markDirty,
    clearDirty,
  }
}
