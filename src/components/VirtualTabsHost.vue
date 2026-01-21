<script setup lang="ts">
import { computed } from 'vue'
import { tabComponentRegistry } from '../tabs/componentRegistry'
import { useTabsStore } from '../stores/tabs'
import { MAX_OPEN_TABS } from '../config/tabs'

const tabsStore = useTabsStore()

const activeTab = computed(() => tabsStore.activeTab)

const activeComponent = computed(() => {
  if (!activeTab.value) return null
  return tabComponentRegistry[activeTab.value.component] ?? null
})

const activeProps = computed(() => activeTab.value?.props ?? {})
</script>

<template>
  <div class="virtual-tabs-host">
    <div v-if="!activeTab" class="empty">Pilih menu untuk membuka workspace.</div>

    <KeepAlive :max="MAX_OPEN_TABS">
      <component
        :is="activeComponent"
        v-if="activeTab && activeComponent"
        :key="activeTab.id"
        v-bind="activeProps"
        :tab-id="activeTab.id"
      />
    </KeepAlive>

    <div v-if="activeTab && !activeComponent" class="empty">
      Component registry tidak ditemukan: <b>{{ activeTab.component }}</b>
    </div>
  </div>
</template>

<style scoped>
.virtual-tabs-host {
  height: 100%;
  min-height: 0;
}
.empty {
  padding: 16px;
  color: var(--el-text-color-secondary);
}
</style>
