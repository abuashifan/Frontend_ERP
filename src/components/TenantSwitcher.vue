<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import { useTenantStore } from '../stores/tenant'
import { useTabsStore } from '../stores/tabs'

const tenantStore = useTenantStore()
const tabsStore = useTabsStore()

const draftCompanyId = ref(tenantStore.activeCompanyId ?? '')

const hasDirty = computed(() => tabsStore.modules.some((m) => m.tabs.some((t) => t.dirty)))

async function applyCompanyId() {
  const next = draftCompanyId.value.trim()
  const prev = tenantStore.activeCompanyId

  if (next.length === 0) {
    if (prev === null) return

    if (hasDirty.value) {
      try {
        await ElMessageBox.confirm(
          'Ada form yang belum disimpan. Menghapus company context akan menutup semua workspace. Lanjutkan?',
          'Konfirmasi',
          {
            confirmButtonText: 'Lanjutkan',
            cancelButtonText: 'Batal',
            type: 'warning',
          },
        )
      } catch {
        draftCompanyId.value = prev ?? ''
        return
      }
    }

    tenantStore.clear()
    tabsStore.$reset()
    ElMessage.success('Company context dihapus')
    return
  }

  if (prev === next) return

  if (hasDirty.value) {
    try {
      await ElMessageBox.confirm(
        'Ada form yang belum disimpan. Mengganti company akan menutup semua workspace. Lanjutkan?',
        'Konfirmasi',
        {
          confirmButtonText: 'Ganti',
          cancelButtonText: 'Batal',
          type: 'warning',
        },
      )
    } catch {
      draftCompanyId.value = prev ?? ''
      return
    }
  }

  tenantStore.setActiveCompanyId(next)
  tabsStore.$reset()
  ElMessage.success(`Company aktif: ${next}`)
}

function resetDraft() {
  draftCompanyId.value = tenantStore.activeCompanyId ?? ''
}
</script>

<template>
  <div class="flex items-center gap-2">
    <div class="text-sm text-[var(--el-text-color-secondary)]">Company</div>

    <el-input
      v-model="draftCompanyId"
      size="small"
      placeholder="X-Company-Id"
      class="w-[140px]"
      @keydown.enter.prevent="applyCompanyId"
    />

    <el-button size="small" type="primary" @click="applyCompanyId">Apply</el-button>
    <el-button size="small" @click="resetDraft">Reset</el-button>

    <el-tag v-if="tenantStore.activeCompanyId" size="small" type="info">
      Active: {{ tenantStore.activeCompanyId }}
    </el-tag>
    <el-tag v-else size="small" type="warning">No company</el-tag>
  </div>
</template>
