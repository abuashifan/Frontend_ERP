<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'

import {
  listProductSerials,
  type ListProductSerialsParams,
  type ProductSerial,
  type ProductSerialStatus,
} from '../lib/api/modules/productSerials'
import { listProducts, type Product } from '../lib/api/modules/products'
import { listWarehouses, type Warehouse } from '../lib/api/modules/warehouses'
import { useTabsStore } from '../stores/tabs'

const props = defineProps<{ tabId: string; initialProductId?: number | null }>()

const tabsStore = useTabsStore()

const loading = ref(false)
const loadingLookups = ref(false)
const errorMessage = ref<string | null>(null)

const rows = ref<ProductSerial[]>([])

const products = ref<Product[]>([])
const warehouses = ref<Warehouse[]>([])

const filterQ = ref('')
const filterStatus = ref<string>('')
const filterProductId = ref<number | null>(null)
const filterWarehouseId = ref<number | null>(null)
const filterSort = ref<NonNullable<ListProductSerialsParams['sort']>>('received_desc')

const statusOptions = computed<Array<{ value: string; label: string }>>(() => [
  { value: '', label: 'All' },
  { value: 'available', label: 'Available' },
  { value: 'sold', label: 'Sold' },
])

const sortOptions: Array<{ value: NonNullable<ListProductSerialsParams['sort']>; label: string }> = [
  { value: 'received_desc', label: 'Received: Newest' },
  { value: 'received_asc', label: 'Received: Oldest' },
  { value: 'serial_asc', label: 'Serial: A → Z' },
  { value: 'serial_desc', label: 'Serial: Z → A' },
  { value: 'id_desc', label: 'ID: Desc' },
  { value: 'id_asc', label: 'ID: Asc' },
]

function formatDateTime(value: unknown): string {
  if (!value) return '-'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function statusTagType(status: ProductSerialStatus): 'success' | 'info' | 'warning' | 'danger' {
  if (status === 'available') return 'success'
  if (status === 'sold') return 'info'
  return 'warning'
}

function statusLabel(status: ProductSerialStatus): string {
  if (status === 'available') return 'Available'
  if (status === 'sold') return 'Sold'
  return String(status)
}

async function loadLookups() {
  loadingLookups.value = true
  try {
    const [productsList, warehousesList] = await Promise.all([listProducts(), listWarehouses()])
    products.value = productsList
    warehouses.value = warehousesList
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    const message = maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal memuat lookup data'
    ElMessage.error(String(message))
  } finally {
    loadingLookups.value = false
  }
}

function buildParams(): ListProductSerialsParams {
  const params: ListProductSerialsParams = {
    per_page: 200,
    sort: filterSort.value,
  }

  const q = filterQ.value.trim()
  if (q) params.q = q
  if (filterStatus.value) params.status = filterStatus.value
  if (filterProductId.value) params.product_id = filterProductId.value
  if (filterWarehouseId.value) params.warehouse_id = filterWarehouseId.value

  return params
}

async function load() {
  loading.value = true
  errorMessage.value = null

  try {
    rows.value = await listProductSerials(buildParams())
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    const message = maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal memuat product serials'
    errorMessage.value = String(message ?? 'Gagal memuat product serials')
    ElMessage.error(errorMessage.value)
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filterQ.value = ''
  filterStatus.value = ''
  filterProductId.value = null
  filterWarehouseId.value = null
  filterSort.value = 'received_desc'
  void load()
}

function openProduct(row: ProductSerial) {
  const productId = row.product_id
  if (!productId) return

  const title = row.product?.code ? `Product ${row.product.code}` : `Product #${productId}`
  const result = tabsStore.openChildTab({
    localId: `product-${productId}`,
    title,
    component: 'ProductDetailWorkspace',
    props: { productId },
    closable: true,
  })

  if (!result.ok) ElMessage.warning(result.message)
}

onMounted(() => {
  if (props.initialProductId) {
    filterProductId.value = props.initialProductId
  }
  void loadLookups()
  void load()
})
</script>

<template>
  <div class="p-4">
    <div class="flex items-center justify-between gap-3 mb-3">
      <div>
        <div class="text-lg font-semibold">Serial Registry</div>
        <div class="text-sm text-[var(--el-text-color-secondary)]">
          Daftar serial number (filter by status/product/warehouse).
        </div>
      </div>
      <div class="flex items-center gap-2">
        <el-button size="small" :loading="loading" @click="load">Refresh</el-button>
        <el-button size="small" @click="resetFilters">Reset</el-button>
      </div>
    </div>

    <div class="mb-3">
      <el-card shadow="never">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <el-input
            v-model="filterQ"
            placeholder="Cari serial (q)"
            clearable
            @keyup.enter="load"
          />

          <el-select v-model="filterStatus" placeholder="Status" clearable @change="load">
            <el-option
              v-for="opt in statusOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>

          <el-select
            v-model="filterProductId"
            placeholder="Product"
            filterable
            clearable
            :loading="loadingLookups"
            @change="load"
          >
            <el-option
              v-for="p in products"
              :key="p.id"
              :label="`${p.code} — ${p.name}`"
              :value="p.id"
            />
          </el-select>

          <el-select
            v-model="filterWarehouseId"
            placeholder="Warehouse"
            filterable
            clearable
            :loading="loadingLookups"
            @change="load"
          >
            <el-option
              v-for="w in warehouses"
              :key="w.id"
              :label="`${w.code} — ${w.name}`"
              :value="w.id"
            />
          </el-select>

          <el-select v-model="filterSort" placeholder="Sort" @change="load">
            <el-option v-for="s in sortOptions" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>

          <div class="md:col-span-3 flex items-center justify-end gap-2">
            <div class="text-sm text-[var(--el-text-color-secondary)]">Total: {{ rows.length }}</div>
          </div>
        </div>
      </el-card>
    </div>

    <el-alert v-if="errorMessage" type="error" :title="errorMessage" show-icon class="mb-3" />

    <el-table
      v-loading="loading"
      :data="rows"
      height="calc(100vh - 310px)"
      class="w-full"
      @row-dblclick="openProduct"
    >
      <el-table-column label="#" width="70" align="center">
        <template #default="scope">
          <div class="text-center">{{ scope.$index + 1 }}</div>
        </template>
      </el-table-column>

      <el-table-column prop="serial_number" label="Serial Number" min-width="220" />

      <el-table-column label="Status" width="140">
        <template #default="scope">
          <el-tag :type="statusTagType(scope.row.status)">
            {{ statusLabel(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="Product" min-width="260">
        <template #default="scope">
          <div v-if="scope.row.product">
            <div class="font-medium">{{ scope.row.product.code }}</div>
            <div class="text-xs text-[var(--el-text-color-secondary)]">{{ scope.row.product.name }}</div>
          </div>
          <div v-else class="text-sm text-[var(--el-text-color-secondary)]">#{{ scope.row.product_id }}</div>
        </template>
      </el-table-column>

      <el-table-column label="Warehouse" min-width="220">
        <template #default="scope">
          <div v-if="scope.row.warehouse">
            <div class="font-medium">{{ scope.row.warehouse.code }}</div>
            <div class="text-xs text-[var(--el-text-color-secondary)]">{{ scope.row.warehouse.name }}</div>
          </div>
          <div v-else class="text-sm text-[var(--el-text-color-secondary)]">-</div>
        </template>
      </el-table-column>

      <el-table-column label="Received" width="170">
        <template #default="scope">
          {{ formatDateTime(scope.row.received_at) }}
        </template>
      </el-table-column>

      <el-table-column label="Sold" width="170">
        <template #default="scope">
          {{ formatDateTime(scope.row.sold_at) }}
        </template>
      </el-table-column>

      <el-table-column label="Source" min-width="200">
        <template #default="scope">
          <div v-if="scope.row.sold_source_type" class="text-sm">
            {{ scope.row.sold_source_type }} #{{ scope.row.sold_source_id ?? '-' }}
          </div>
          <div v-else class="text-sm text-[var(--el-text-color-secondary)]">-</div>
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
