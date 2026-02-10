<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'

import { getProduct, type Product } from '../lib/api/modules/products'
import { listProductUnits, type ProductUnit } from '../lib/api/modules/productUnits'
import { listWarehouses, type Warehouse } from '../lib/api/modules/warehouses'
import { listVendors, type Vendor } from '../lib/api/modules/vendors'
import { listChartOfAccounts, type ChartOfAccount } from '../lib/api/modules/chartOfAccounts'
import { useTabsStore } from '../stores/tabs'

const props = defineProps<{ tabId: string; productId: number }>()

const tabsStore = useTabsStore()

const loading = ref(false)
const loadingLookups = ref(false)
const errorMessage = ref<string | null>(null)

const product = ref<Product | null>(null)
const units = ref<ProductUnit[]>([])

const warehouses = ref<Warehouse[]>([])
const vendors = ref<Vendor[]>([])
const accounts = ref<ChartOfAccount[]>([])

const warehouseById = computed(() => new Map(warehouses.value.map((w) => [w.id, w])))
const vendorById = computed(() => new Map(vendors.value.map((v) => [v.id, v])))
const accountById = computed(() => new Map(accounts.value.map((a) => [a.id, a])))

function typeLabel(type: Product['type']): string {
  return type === 'stock_item' ? 'Inventory' : 'Service'
}

function yesNoTagType(value: unknown): 'success' | 'info' {
  return value ? 'success' : 'info'
}

function formatMoney(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-'
  const num = typeof value === 'number' ? value : Number(String(value))
  if (!Number.isFinite(num)) return String(value)
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(num)
}

function labelWarehouse(id?: number | null): string {
  if (!id) return '-'
  const w = warehouseById.value.get(id)
  return w ? `${w.code} — ${w.name}` : `#${id}`
}

function labelVendor(id?: number | null): string {
  if (!id) return '-'
  const v = vendorById.value.get(id)
  return v ? `${v.code} — ${v.name}` : `#${id}`
}

function labelAccount(id?: number | null): string {
  if (!id) return '-'
  const a = accountById.value.get(id)
  return a ? `${a.code} — ${a.name}` : `#${id}`
}

async function loadLookups() {
  loadingLookups.value = true
  try {
    const [warehousesList, vendorsList, accountsList] = await Promise.all([
      listWarehouses(),
      listVendors(),
      listChartOfAccounts(),
    ])
    warehouses.value = warehousesList
    vendors.value = vendorsList
    accounts.value = accountsList
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    const message = maybe?.response?.data?.message ?? maybe?.message
    ElMessage.warning(String(message ?? 'Gagal memuat lookup data (warehouse/vendor/COA)'))
  } finally {
    loadingLookups.value = false
  }
}

async function load() {
  loading.value = true
  errorMessage.value = null

  try {
    const [p, u] = await Promise.all([getProduct(props.productId), listProductUnits(props.productId)])
    product.value = p
    units.value = u
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    const message = maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal memuat product'
    errorMessage.value = String(message)
    ElMessage.error(errorMessage.value)
  } finally {
    loading.value = false
  }
}

function openEdit() {
  if (!product.value) return

  const result = tabsStore.openChildTab({
    localId: `edit-${product.value.id}`,
    title: `Edit Product ${product.value.code}`,
    component: 'ProductFormWorkspace',
    props: { mode: 'edit', productId: product.value.id },
    closable: true,
  })

  if (!result.ok) ElMessage.warning(result.message)
}

function openSerialRegistry() {
  if (!product.value) return

  const result = tabsStore.openChildTab({
    localId: `serials-${product.value.id}`,
    title: `Serials ${product.value.code}`,
    component: 'ProductSerialsListWorkspace',
    props: { initialProductId: product.value.id },
    closable: true,
  })

  if (!result.ok) ElMessage.warning(result.message)
}

onMounted(() => {
  void loadLookups()
  void load()
})
</script>

<template>
  <div class="p-4">
    <div class="flex items-center justify-between gap-3 mb-3">
      <div>
        <div class="text-lg font-semibold">
          <span v-if="product">Product {{ product.code }}</span>
          <span v-else>Product Detail</span>
        </div>
        <div v-if="product" class="text-sm text-[var(--el-text-color-secondary)]">{{ product.name }}</div>
        <div v-else class="text-sm text-[var(--el-text-color-secondary)]">Data diambil dari backend.</div>
      </div>

      <div class="flex items-center gap-2">
        <el-button size="small" :loading="loading" @click="load">Refresh</el-button>
        <el-button size="small" type="primary" :disabled="!product" @click="openEdit">Edit</el-button>
        <el-button
          size="small"
          :disabled="!product || !product.use_serial_number"
          @click="openSerialRegistry"
        >
          Serial Registry
        </el-button>
      </div>
    </div>

    <el-alert v-if="errorMessage" type="error" :title="errorMessage" show-icon class="mb-3" />

    <div v-loading="loading">
      <div v-if="product" class="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <el-card shadow="never">
          <template #header>
            <div class="font-semibold">General</div>
          </template>

          <el-descriptions :column="1" border>
            <el-descriptions-item label="Code">{{ product.code }}</el-descriptions-item>
            <el-descriptions-item label="Name">{{ product.name }}</el-descriptions-item>
            <el-descriptions-item label="Type">{{ typeLabel(product.type) }}</el-descriptions-item>
            <el-descriptions-item label="Category">{{ product.category_name ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label="UoM">{{ product.uom }}</el-descriptions-item>
            <el-descriptions-item label="On Hand">
              {{ product.on_hand_qty ?? '0' }}
            </el-descriptions-item>
            <el-descriptions-item label="Active">
              <el-tag :type="yesNoTagType(product.is_active)">{{ product.is_active ? 'Yes' : 'No' }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card shadow="never">
          <template #header>
            <div class="font-semibold">Inventory & Serial</div>
          </template>

          <el-descriptions :column="1" border>
            <el-descriptions-item label="Use Serial">
              <el-tag :type="yesNoTagType(product.use_serial_number)">
                {{ product.use_serial_number ? 'Yes' : 'No' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="Default Warehouse">
              {{ labelWarehouse(product.default_warehouse_id ?? null) }}
            </el-descriptions-item>
            <el-descriptions-item label="Inventory Type">{{ product.inventory_type ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label="Tax Code">{{ product.tax_code ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label="All Users Allowed">
              <el-tag :type="yesNoTagType(product.is_all_users_allowed)">
                {{ product.is_all_users_allowed ? 'Yes' : 'No' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card shadow="never">
          <template #header>
            <div class="font-semibold">Vendor & Guardrails</div>
          </template>

          <el-descriptions :column="1" border>
            <el-descriptions-item label="Preferred Vendor">
              {{ labelVendor(product.preferred_vendor_id ?? null) }}
            </el-descriptions-item>
            <el-descriptions-item label="Min Sales Price">{{ formatMoney(product.min_sales_price) }}</el-descriptions-item>
            <el-descriptions-item label="Max Sales Price">{{ formatMoney(product.max_sales_price) }}</el-descriptions-item>
            <el-descriptions-item label="Min Purchase Price">{{ formatMoney(product.min_purchase_price) }}</el-descriptions-item>
            <el-descriptions-item label="Max Purchase Price">{{ formatMoney(product.max_purchase_price) }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card shadow="never">
          <template #header>
            <div class="font-semibold">Account Overrides</div>
          </template>

          <el-descriptions :column="1" border>
            <el-descriptions-item label="Inventory">{{ labelAccount(product.inventory_account_id ?? null) }}</el-descriptions-item>
            <el-descriptions-item label="COGS">{{ labelAccount(product.cogs_account_id ?? null) }}</el-descriptions-item>
            <el-descriptions-item label="Sales">{{ labelAccount(product.sales_account_id ?? null) }}</el-descriptions-item>
            <el-descriptions-item label="Sales Discount">
              {{ labelAccount(product.sales_discount_account_id ?? null) }}
            </el-descriptions-item>
            <el-descriptions-item label="Sales Return">
              {{ labelAccount(product.sales_return_account_id ?? null) }}
            </el-descriptions-item>
            <el-descriptions-item label="Purchase Return">
              {{ labelAccount(product.purchase_return_account_id ?? null) }}
            </el-descriptions-item>
            <el-descriptions-item label="Unbilled Receipt">
              {{ labelAccount(product.unbilled_receipt_account_id ?? null) }}
            </el-descriptions-item>
            <el-descriptions-item label="Goods In Transit">
              {{ labelAccount(product.goods_in_transit_account_id ?? null) }}
            </el-descriptions-item>
          </el-descriptions>

          <div v-if="loadingLookups" class="mt-2 text-xs text-[var(--el-text-color-secondary)]">
            Memuat lookup COA...
          </div>
        </el-card>

        <el-card shadow="never" class="lg:col-span-2">
          <template #header>
            <div class="font-semibold">Units</div>
          </template>

          <el-table :data="units" class="w-full" border>
            <el-table-column label="#" width="70" align="center">
              <template #default="scope">
                <div class="text-center">{{ scope.$index + 1 }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="unit_name" label="Unit" min-width="160" />
            <el-table-column prop="ratio" label="Ratio" width="120" align="right" />
            <el-table-column label="Base" width="110" align="center">
              <template #default="scope">
                <el-tag :type="scope.row.is_base_unit ? 'success' : 'info'">
                  {{ scope.row.is_base_unit ? 'Yes' : 'No' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="Price L1" width="130" align="right">
              <template #default="scope">{{ formatMoney(scope.row.price_level_1) }}</template>
            </el-table-column>
            <el-table-column label="Price L2" width="130" align="right">
              <template #default="scope">{{ formatMoney(scope.row.price_level_2) }}</template>
            </el-table-column>
            <el-table-column label="Price L3" width="130" align="right">
              <template #default="scope">{{ formatMoney(scope.row.price_level_3) }}</template>
            </el-table-column>
          </el-table>

          <div v-if="units.length === 0" class="mt-3 text-sm text-[var(--el-text-color-secondary)]">
            Tidak ada unit.
          </div>
        </el-card>
      </div>

      <div v-else class="text-sm text-[var(--el-text-color-secondary)]">Memuat...</div>
    </div>
  </div>
</template>
