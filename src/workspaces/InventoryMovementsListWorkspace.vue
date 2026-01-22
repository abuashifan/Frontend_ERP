<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'

import { listInventoryMovements, type InventoryMovement } from '../lib/api/modules/inventoryMovements'
import { useTabsStore } from '../stores/tabs'

defineProps<{ tabId: string }>()

const tabsStore = useTabsStore()

const loading = ref(false)
const errorMessage = ref<string | null>(null)
const rows = ref<InventoryMovement[]>([])

async function load() {
  loading.value = true
  errorMessage.value = null

  try {
    rows.value = await listInventoryMovements()
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    const message = maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal memuat inventory movements'
    errorMessage.value = String(message ?? 'Gagal memuat inventory movements')
    ElMessage.error(errorMessage.value)
  } finally {
    loading.value = false
  }
}

function openNew() {
  const existing = tabsStore.getChildTab('inventory-movements::new')
  if (existing) {
    tabsStore.activateChildTab(existing.id)
    return
  }

  const result = tabsStore.openChildTab({
    localId: 'new',
    title: 'New Inventory Movement',
    component: 'InventoryMovementFormWorkspace',
    props: { mode: 'create' },
    closable: true,
  })

  if (!result.ok) ElMessage.warning(result.message)
}

function openEdit(row: InventoryMovement) {
  const result = tabsStore.openChildTab({
    localId: `edit-${row.id}`,
    title: `Edit Movement ${row.movement_number}`,
    component: 'InventoryMovementFormWorkspace',
    props: { mode: 'edit', inventoryMovementId: row.id },
    closable: true,
  })

  if (!result.ok) ElMessage.warning(result.message)
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="p-4">
    <div class="flex items-center justify-between gap-3 mb-3">
      <div>
        <div class="text-lg font-semibold">Inventory Movements</div>
        <div class="text-sm text-[var(--el-text-color-secondary)]">Data diambil dari backend.</div>
      </div>
      <div class="flex items-center gap-2">
        <el-button size="small" type="primary" @click="openNew">New</el-button>
        <el-button size="small" :loading="loading" @click="load">Refresh</el-button>
      </div>
    </div>

    <el-alert v-if="errorMessage" type="error" :title="errorMessage" show-icon class="mb-3" />

    <el-table
      v-loading="loading"
      :data="rows"
      height="calc(100vh - 240px)"
      class="w-full"
      @row-dblclick="openEdit"
    >
      <el-table-column prop="id" label="ID" width="90" />
      <el-table-column prop="movement_number" label="Number" width="180" />
      <el-table-column prop="movement_date" label="Date" width="140" />
      <el-table-column prop="type" label="Type" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.type === 'in' ? 'success' : 'danger'">{{ scope.row.type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="Status" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'draft' ? 'info' : 'success'">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="warehouse_id" label="Warehouse" width="120" />
      <el-table-column prop="reference_type" label="Ref Type" width="140" />
      <el-table-column prop="reference_id" label="Ref ID" width="120" />
    </el-table>

    <div v-if="!loading && !errorMessage && rows.length === 0" class="mt-3 text-sm text-[var(--el-text-color-secondary)]">
      Tidak ada data.
    </div>
  </div>
</template>
