<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'

import { listWarehouseTransfers, type WarehouseTransfer } from '../lib/api/modules/warehouseTransfers'
import { useTabsStore } from '../stores/tabs'

defineProps<{ tabId: string }>()

const tabsStore = useTabsStore()

const loading = ref(false)
const errorMessage = ref<string | null>(null)
const rows = ref<WarehouseTransfer[]>([])

async function load() {
  loading.value = true
  errorMessage.value = null

  try {
    rows.value = await listWarehouseTransfers()
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    const message = maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal memuat warehouse transfers'
    errorMessage.value = String(message ?? 'Gagal memuat warehouse transfers')
    ElMessage.error(errorMessage.value)
  } finally {
    loading.value = false
  }
}

function openNew() {
  const existing = tabsStore.getChildTab('warehouse-transfers::new')
  if (existing) {
    tabsStore.activateChildTab(existing.id)
    return
  }

  const result = tabsStore.openChildTab({
    localId: 'new',
    title: 'New Warehouse Transfer',
    component: 'WarehouseTransferFormWorkspace',
    props: { mode: 'create' },
    closable: true,
  })

  if (!result.ok) ElMessage.warning(result.message)
}

function openEdit(row: WarehouseTransfer) {
  const result = tabsStore.openChildTab({
    localId: `edit-${row.id}`,
    title: `Edit Transfer ${row.transfer_number}`,
    component: 'WarehouseTransferFormWorkspace',
    props: { mode: 'edit', transferId: row.id },
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
        <div class="text-lg font-semibold">Warehouse Transfers</div>
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
      <el-table-column prop="transfer_number" label="Number" width="180" />
      <el-table-column prop="transfer_date" label="Date" width="140" />
      <el-table-column prop="status" label="Status" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'draft' ? 'info' : scope.row.status === 'approved' ? 'warning' : 'success'">
            {{ scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="source_warehouse_id" label="Source" width="120" />
      <el-table-column prop="destination_warehouse_id" label="Destination" width="120" />
      <el-table-column prop="description" label="Description" min-width="240" />
    </el-table>

    <div v-if="!loading && !errorMessage && rows.length === 0" class="mt-3 text-sm text-[var(--el-text-color-secondary)]">
      Tidak ada data.
    </div>
  </div>
</template>
