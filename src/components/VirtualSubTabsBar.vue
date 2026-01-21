<script setup lang="ts">
import { computed } from 'vue'
import { ElMessageBox } from 'element-plus'
import { Close } from '@element-plus/icons-vue'

import { useTabsStore } from '../stores/tabs'

const tabsStore = useTabsStore()

const moduleTab = computed(() => tabsStore.activeModule)
const tabs = computed(() => moduleTab.value?.tabs ?? [])
const activeTabId = computed(() => moduleTab.value?.activeChildTabId ?? null)

function activate(id: string) {
  tabsStore.activateChildTab(id)
}

async function attemptClose(id: string) {
  const tab = tabsStore.getChildTab(id)
  if (!tab) return
  if (!tab.closable) return

  if (tab.dirty) {
    try {
      await ElMessageBox.confirm(
        'Tab ini memiliki perubahan yang belum disimpan. Tutup tetap?',
        'Konfirmasi',
        {
          confirmButtonText: 'Tutup',
          cancelButtonText: 'Batal',
          type: 'warning',
        },
      )
    } catch {
      return
    }
  }

  tabsStore.closeChildTab(id)
}
</script>

<template>
  <div
    v-if="moduleTab"
    class="flex gap-2 items-center px-3 py-2 overflow-x-auto border-b border-[var(--el-border-color-light)] bg-[var(--el-bg-color)]"
  >
    <div
      v-for="tab in tabs"
      :key="tab.id"
      class="inline-flex items-center gap-2 px-2.5 py-1.5 border border-[var(--el-border-color-light)] rounded-lg cursor-pointer select-none whitespace-nowrap"
      :class="
        tab.id === activeTabId
          ? 'border-[var(--el-color-primary)] bg-[var(--el-color-primary-light-9)]'
          : ''
      "
      @click="activate(tab.id)"
    >
      <span class="text-sm">{{ tab.title }}</span>
      <span
        v-if="tab.dirty"
        class="w-2 h-2 rounded-full bg-[var(--el-color-warning)]"
        title="Unsaved changes"
      />
      <button
        v-if="tab.closable"
        class="inline-flex items-center justify-center border-0 bg-transparent p-0 cursor-pointer text-[var(--el-text-color-secondary)] hover:text-[var(--el-text-color-primary)]"
        type="button"
        title="Close"
        @click.stop="attemptClose(tab.id)"
      >
        <el-icon><Close /></el-icon>
      </button>
    </div>
  </div>
</template>
