<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'

import { listInventoryReceivings, type InventoryReceiving } from '../lib/api/modules/inventoryReceivings'
import { useTabsStore } from '../stores/tabs'

defineProps<{ tabId: string }>()

const tabsStore = useTabsStore()

const loading = ref(false)
const errorMessage = ref<string | null>(null)
const rows = ref<InventoryReceiving[]>([])

function isSerialRequired(row: InventoryReceiving): boolean {
  return Boolean(row.serial_is_required)
}

function isSerialComplete(row: InventoryReceiving): boolean {
  return Boolean(row.serial_is_complete)
}

function serialBadgeLabel(row: InventoryReceiving): string {
  const req = Number(row.serial_required_qty ?? 0)
  const cap = Number(row.serial_captured_qty ?? 0)
  return `${cap}/${req}`
}

async function load() {
  loading.value = true
  errorMessage.value = null

  try {
    rows.value = await listInventoryReceivings()
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    const message = maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal memuat inventory receivings'
    errorMessage.value = String(message ?? 'Gagal memuat inventory receivings')
    ElMessage.error(errorMessage.value)
  } finally {
    loading.value = false
  }
}

function openNew() {
  const existing = tabsStore.getChildTab('inventory-receivings::new')
  if (existing) {
    tabsStore.activateChildTab(existing.id)
    return
  }

  const result = tabsStore.openChildTab({
    localId: 'new',
    title: 'New Inventory Receiving',
    component: 'InventoryReceivingFormWorkspace',
    props: { mode: 'create' },
    closable: true,
  })

  if (!result.ok) ElMessage.warning(result.message)
}

function openEdit(row: InventoryReceiving) {
  const result = tabsStore.openChildTab({
    localId: `edit-${row.id}`,
    title: `Edit Receiving #${row.id}`,
    component: 'InventoryReceivingFormWorkspace',
    props: { mode: 'edit', receivingId: row.id },
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
        <div class="text-lg font-semibold">Inventory Receivings</div>
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
      <el-table-column prop="status" label="Status" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'draft' ? 'info' : 'success'">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="warehouse_id" label="Warehouse" width="120" />
      <el-table-column prop="purchase_order_id" label="PO" width="120" />
      <el-table-column prop="vendor_invoice_id" label="Vendor Invoice" width="140" />
      <el-table-column label="Serial" width="170">
        <template #default="scope">
          <div v-if="isSerialRequired(scope.row)">
            <el-tag :type="isSerialComplete(scope.row) ? 'success' : 'danger'">
              {{ isSerialComplete(scope.row) ? 'Serial OK' : 'Serial incomplete' }}
            </el-tag>
            <span class="ml-2 text-xs text-[var(--el-text-color-secondary)]">
              {{ serialBadgeLabel(scope.row) }}
            </span>
          </div>
          <div v-else class="text-xs text-[var(--el-text-color-secondary)]">-</div>
        </template>
      </el-table-column>
      <el-table-column prop="received_at" label="Received At" width="180" />
      <el-table-column prop="posted_at" label="Posted At" width="180" />
    </el-table>

    <div v-if="!loading && !errorMessage && rows.length === 0" class="mt-3 text-sm text-[var(--el-text-color-secondary)]">
      Tidak ada data.
    </div>
  </div>
</template>
