<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'

import { listProducts, type Product } from '../lib/api/modules/products'
import { useTabsStore } from '../stores/tabs'

defineProps<{ tabId: string }>()

const tabsStore = useTabsStore()

const loading = ref(false)
const errorMessage = ref<string | null>(null)
const rows = ref<Product[]>([])

function formatQty(value: unknown): string {
  if (value === null || value === undefined || value === '') return '0'
  const num = typeof value === 'number' ? value : Number(String(value))
  if (!Number.isFinite(num)) return String(value)
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(num)
}

function typeLabel(type: Product['type']): string {
  return type === 'stock_item' ? 'Inventory' : 'Service'
}

async function load() {
  loading.value = true
  errorMessage.value = null

  try {
    rows.value = await listProducts()
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    const message = maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal memuat products'
    errorMessage.value = String(message ?? 'Gagal memuat products')
    ElMessage.error(errorMessage.value)
  } finally {
    loading.value = false
  }
}

function openNew() {
  const result = tabsStore.openChildTab({
    localId: 'new',
    title: 'New Product',
    component: 'ProductFormWorkspace',
    props: { mode: 'create' },
    closable: true,
  })

  if (!result.ok) ElMessage.warning(result.message)
}

function openEdit(row: Product) {
  const result = tabsStore.openChildTab({
    localId: `edit-${row.id}`,
    title: `Edit Product ${row.code}`,
    component: 'ProductFormWorkspace',
    props: { mode: 'edit', productId: row.id },
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
        <div class="text-lg font-semibold">Products</div>
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
      <el-table-column label="#" width="70" align="center">
        <template #default="scope">
          <div class="text-center">{{ scope.$index + 1 }}</div>
        </template>
      </el-table-column>

      <el-table-column prop="name" label="Nama Product" min-width="240" />

      <el-table-column prop="description" label="Description" min-width="280" />

      <el-table-column label="Jumlah / Qty" width="140" align="right">
        <template #default="scope">
          <div class="text-right">{{ formatQty(scope.row.on_hand_qty) }}</div>
        </template>
      </el-table-column>

      <el-table-column prop="uom" label="Unit" width="120" />

      <el-table-column prop="use_serial_number" label="Serial" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.use_serial_number ? 'warning' : 'info'">
            {{ scope.row.use_serial_number ? 'Yes' : 'No' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="Type" width="140">
        <template #default="scope">
          {{ typeLabel(scope.row.type) }}
        </template>
      </el-table-column>

      <el-table-column prop="category_name" label="Category" min-width="200" />

      <el-table-column prop="code" label="Code" width="140" />

      <el-table-column prop="is_active" label="Active" width="110">
        <template #default="scope">
          <el-tag :type="scope.row.is_active ? 'success' : 'info'">
            {{ scope.row.is_active ? 'Yes' : 'No' }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>

    <div
      v-if="!loading && !errorMessage && rows.length === 0"
      class="mt-3 text-sm text-[var(--el-text-color-secondary)]"
    >
      Tidak ada data.
    </div>
  </div>
</template>
