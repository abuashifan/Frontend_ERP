<script setup lang="ts">
import { computed } from 'vue'
import { ElMessageBox } from 'element-plus'
import { Close } from '@element-plus/icons-vue'

import { useTabsStore } from '../stores/tabs'

const tabsStore = useTabsStore()

const tabs = computed(() => tabsStore.tabs)
const activeTabId = computed(() => tabsStore.activeTabId)

function activate(id: string) {
  tabsStore.activateTab(id)
}

async function attemptClose(id: string) {
  const tab = tabsStore.getTab(id)
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

  tabsStore.closeTab(id)
}
</script>

<template>
  <div class="tabs-bar">
    <div
      v-for="tab in tabs"
      :key="tab.id"
      class="tab"
      :class="{ active: tab.id === activeTabId, dirty: tab.dirty }"
      @click="activate(tab.id)"
    >
      <span class="title">{{ tab.title }}</span>
      <span v-if="tab.dirty" class="dot" title="Unsaved changes" />
      <button
        v-if="tab.closable"
        class="close"
        type="button"
        title="Close"
        @click.stop="attemptClose(tab.id)"
      >
        <el-icon><Close /></el-icon>
      </button>
    </div>
  </div>
</template>

<style scoped>
.tabs-bar {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  overflow-x: auto;
  border-bottom: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
}

.tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

.tab.active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.title {
  font-size: 13px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-color-warning);
}

.close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  color: var(--el-text-color-secondary);
}

.close:hover {
  color: var(--el-text-color-primary);
}
</style>
