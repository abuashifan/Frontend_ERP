<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'

import { listProducts, type Product } from '../lib/api/modules/products'
import { useTabsStore } from '../stores/tabs'

defineProps<{ tabId: string }>()

const tabsStore = useTabsStore()

const loading = ref(false)
const errorMessage = ref<string | null>(null)
const rows = ref<Product[]>([])

const keyword = ref('')
const categoryName = ref<string | null>(null)
const type = ref<Product['type'] | 'all'>('all')
const active = ref<'all' | 'active' | 'inactive'>('all')
const serialOnly = ref(false)

const categoryOptions = computed(() => {
  const set = new Set<string>()
  for (const r of rows.value) {
    const name = typeof r.category_name === 'string' ? r.category_name.trim() : ''
    if (name) set.add(name)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
})

const filteredRows = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  return rows.value.filter((r) => {
    if (q) {
      const hay = `${r.code ?? ''} ${r.name ?? ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }

    if (categoryName.value) {
      if (String(r.category_name ?? '') !== categoryName.value) return false
    }

    if (type.value !== 'all') {
      if (r.type !== type.value) return false
    }

    if (active.value !== 'all') {
      const wantActive = active.value === 'active'
      if (Boolean(r.is_active) !== wantActive) return false
    }

    if (serialOnly.value) {
      if (!r.use_serial_number) return false
    }

    return true
  })
})

function resetFilters() {
  keyword.value = ''
  categoryName.value = null
  type.value = 'all'
  active.value = 'all'
  serialOnly.value = false
}

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

function openDetail(row: Product) {
  const result = tabsStore.openChildTab({
    localId: `detail-${row.id}`,
    title: `Product ${row.code}`,
    component: 'ProductDetailWorkspace',
    props: { productId: row.id },
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

    <div class="mb-3 grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
      <div>
        <div class="text-xs text-[var(--el-text-color-secondary)] mb-1">Keyword</div>
        <el-input v-model="keyword" placeholder="Code / name" clearable />
      </div>

      <div>
        <div class="text-xs text-[var(--el-text-color-secondary)] mb-1">Category</div>
        <el-select v-model="categoryName" placeholder="All" clearable filterable class="w-full">
          <el-option v-for="c in categoryOptions" :key="c" :label="c" :value="c" />
        </el-select>
      </div>

      <div>
        <div class="text-xs text-[var(--el-text-color-secondary)] mb-1">Type</div>
        <el-select v-model="type" class="w-full">
          <el-option label="All" value="all" />
          <el-option label="Inventory" value="stock_item" />
          <el-option label="Service" value="service" />
        </el-select>
      </div>

      <div>
        <div class="text-xs text-[var(--el-text-color-secondary)] mb-1">Active</div>
        <el-select v-model="active" class="w-full">
          <el-option label="All" value="all" />
          <el-option label="Active" value="active" />
          <el-option label="Inactive" value="inactive" />
        </el-select>
      </div>

      <div class="flex items-center justify-between gap-2">
        <el-checkbox v-model="serialOnly">Serial-only</el-checkbox>
        <el-button size="small" @click="resetFilters">Reset</el-button>
      </div>
    </div>

    <el-alert v-if="errorMessage" type="error" :title="errorMessage" show-icon class="mb-3" />

    <el-table
      v-loading="loading"
      :data="filteredRows"
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

      <el-table-column label="Actions" width="170" align="center">
        <template #default="scope">
          <div class="flex items-center justify-center gap-2">
            <el-button size="small" @click="openDetail(scope.row)">Detail</el-button>
            <el-button size="small" type="primary" plain @click="openEdit(scope.row)">Edit</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div
      v-if="!loading && !errorMessage && filteredRows.length === 0"
      class="mt-3 text-sm text-[var(--el-text-color-secondary)]"
    >
      Tidak ada data.
    </div>
  </div>
</template>
