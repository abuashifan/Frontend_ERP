<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

import {
  createProduct,
  getProduct,
  updateProduct,
  type Product,
  type ProductType,
  type CreateProductPayload,
} from '../lib/api/modules/products'
import { listProductCategories, type ProductCategory } from '../lib/api/modules/productCategories'
import { listWarehouses, type Warehouse } from '../lib/api/modules/warehouses'
import { listVendors, type Vendor } from '../lib/api/modules/vendors'
import { listChartOfAccounts, type ChartOfAccount } from '../lib/api/modules/chartOfAccounts'
import {
  createProductUnit,
  deleteProductUnit,
  listProductUnits,
  updateProductUnit,
  type ProductUnit,
} from '../lib/api/modules/productUnits'
import { useTabDirty } from '../composables/useTabDirty'
import { useTabsStore } from '../stores/tabs'

const props = defineProps<{ tabId: string; mode: 'create' | 'edit'; productId?: number }>()

const isEdit = computed(() => props.mode === 'edit')
const loading = ref(false)
const saving = ref(false)
const loaded = ref(false)

const { dirty, markDirty, clearDirty } = useTabDirty(props.tabId)
const tabsStore = useTabsStore()

const model = ref<CreateProductPayload>({
  code: '',
  name: '',
  description: null,
  category_id: null,
  parent_product_id: null,
  default_warehouse_id: null,
  preferred_vendor_id: null,
  inventory_type: null,
  type: 'stock_item',
  uom: 'PCS',
  tax_code: null,
  use_serial_number: false,
  is_all_users_allowed: true,
  min_sales_price: null,
  max_sales_price: null,
  min_purchase_price: null,
  max_purchase_price: null,

  inventory_account_id: null,
  sales_account_id: null,
  sales_discount_account_id: null,
  sales_return_account_id: null,
  purchase_return_account_id: null,
  cogs_account_id: null,
  unbilled_receipt_account_id: null,
  goods_in_transit_account_id: null,
  is_active: true,
})

const categories = ref<ProductCategory[]>([])
const warehouses = ref<Warehouse[]>([])
const vendors = ref<Vendor[]>([])
const accounts = ref<ChartOfAccount[]>([])

const unitsDialogOpen = ref(false)
const unitsLoading = ref(false)
const unitsSaving = ref(false)
type ProductUnitDraft = Omit<ProductUnit, 'id' | 'product_id'> & { id?: number; product_id?: number }
const units = ref<ProductUnitDraft[]>([])

function accountLabel(a: ChartOfAccount): string {
  return `${a.code} — ${a.name}`
}

function openUnits() {
  if (!isEdit.value || !props.productId) {
    ElMessage.warning('Units hanya bisa di-manage setelah product dibuat')
    return
  }
  unitsDialogOpen.value = true
  void loadUnits()
}

async function loadUnits() {
  if (!props.productId) return

  unitsLoading.value = true
  try {
    const rows = await listProductUnits(props.productId)
    units.value = rows.map((u) => ({
      id: u.id,
      product_id: u.product_id,
      unit_name: u.unit_name,
      ratio: u.ratio,
      price_level_1: u.price_level_1 ?? null,
      price_level_2: u.price_level_2 ?? null,
      price_level_3: u.price_level_3 ?? null,
      price_level_4: u.price_level_4 ?? null,
      price_level_5: u.price_level_5 ?? null,
      is_base_unit: Boolean(u.is_base_unit),
    }))
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    ElMessage.error(String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal memuat product units'))
  } finally {
    unitsLoading.value = false
  }
}

function addUnit() {
  units.value.push({
    unit_name: '',
    ratio: 1,
    price_level_1: null,
    price_level_2: null,
    price_level_3: null,
    price_level_4: null,
    price_level_5: null,
    is_base_unit: units.value.length === 0,
  })
}

function toggleBaseUnit(index: number) {
  for (const [i, u] of units.value.entries()) {
    u.is_base_unit = i === index
  }
}

async function removeUnit(index: number) {
  const row = units.value[index]
  if (!row) return

  if (row.id) {
    try {
      await deleteProductUnit(row.id)
    } catch (err: unknown) {
      const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
      ElMessage.error(String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal menghapus unit'))
      return
    }
  }

  units.value.splice(index, 1)
}

async function saveUnits() {
  if (!props.productId) return

  const trimmedNames = units.value.map((u) => String(u.unit_name ?? '').trim()).filter(Boolean)
  if (trimmedNames.length !== units.value.length) {
    ElMessage.warning('Unit name wajib diisi')
    return
  }

  const lower = trimmedNames.map((n) => n.toLowerCase())
  if (new Set(lower).size !== lower.length) {
    ElMessage.warning('Unit name tidak boleh duplikat dalam product yang sama')
    return
  }

  for (const [i, u] of units.value.entries()) {
    const ratio = Number(u.ratio ?? 0)
    if (!isFinite(ratio) || ratio <= 0) {
      ElMessage.warning(`Line ${i + 1}: ratio harus > 0`)
      return
    }
  }

  const baseCount = units.value.filter((u) => Boolean(u.is_base_unit)).length
  if (baseCount !== 1) {
    ElMessage.warning('Harus ada tepat 1 base unit')
    return
  }

  unitsSaving.value = true
  try {
    for (const u of units.value) {
      const payload = {
        unit_name: String(u.unit_name).trim(),
        ratio: Number(u.ratio),
        price_level_1: u.price_level_1 === '' ? null : u.price_level_1 ?? null,
        price_level_2: u.price_level_2 === '' ? null : u.price_level_2 ?? null,
        price_level_3: u.price_level_3 === '' ? null : u.price_level_3 ?? null,
        price_level_4: u.price_level_4 === '' ? null : u.price_level_4 ?? null,
        price_level_5: u.price_level_5 === '' ? null : u.price_level_5 ?? null,
        is_base_unit: Boolean(u.is_base_unit),
      }

      if (u.id) {
        await updateProductUnit(u.id, payload)
      } else {
        await createProductUnit(props.productId, payload)
      }
    }

    ElMessage.success('Units saved')
    await loadUnits()
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    ElMessage.error(String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal menyimpan units'))
  } finally {
    unitsSaving.value = false
  }
}

const typeOptions: Array<{ label: string; value: ProductType }> = [
  { label: 'Stock Item', value: 'stock_item' },
  { label: 'Service', value: 'service' },
]

async function load() {
  if (!isEdit.value) {
    try {
      ;[categories.value, warehouses.value, vendors.value, accounts.value] = await Promise.all([
        listProductCategories(),
        listWarehouses(),
        listVendors(),
        listChartOfAccounts(),
      ])
    } catch (err: unknown) {
      const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
      ElMessage.error(String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal memuat product categories'))
    }
    loaded.value = true
    return
  }

  if (!props.productId) {
    ElMessage.error('productId tidak ditemukan')
    return
  }

  loading.value = true
  try {
    ;[categories.value, warehouses.value, vendors.value, accounts.value] = await Promise.all([
      listProductCategories(),
      listWarehouses(),
      listVendors(),
      listChartOfAccounts(),
    ])
    const product: Product = await getProduct(props.productId)
    model.value = {
      code: product.code,
      name: product.name,
      description: product.description ?? null,
      category_id: product.category_id ?? null,
      parent_product_id: product.parent_product_id ?? null,
      default_warehouse_id: product.default_warehouse_id ?? null,
      preferred_vendor_id: product.preferred_vendor_id ?? null,
      inventory_type: product.inventory_type ?? null,
      type: product.type,
      uom: product.uom,
      tax_code: product.tax_code ?? null,
      use_serial_number: Boolean(product.use_serial_number),
      is_all_users_allowed: product.is_all_users_allowed ?? true,
      min_sales_price: product.min_sales_price ?? null,
      max_sales_price: product.max_sales_price ?? null,
      min_purchase_price: product.min_purchase_price ?? null,
      max_purchase_price: product.max_purchase_price ?? null,

      inventory_account_id: product.inventory_account_id ?? null,
      sales_account_id: product.sales_account_id ?? null,
      sales_discount_account_id: product.sales_discount_account_id ?? null,
      sales_return_account_id: product.sales_return_account_id ?? null,
      purchase_return_account_id: product.purchase_return_account_id ?? null,
      cogs_account_id: product.cogs_account_id ?? null,
      unbilled_receipt_account_id: product.unbilled_receipt_account_id ?? null,
      goods_in_transit_account_id: product.goods_in_transit_account_id ?? null,
      is_active: product.is_active,
    }
    clearDirty()
    loaded.value = true
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    ElMessage.error(String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal memuat product'))
  } finally {
    loading.value = false
  }
}

watch(
  () => model.value,
  () => {
    if (!loaded.value) return
    markDirty()
  },
  { deep: true },
)

async function save() {
  saving.value = true
  try {
    if (isEdit.value && props.productId) {
      await updateProduct(props.productId, model.value)
      ElMessage.success('Product updated')
    } else {
      await createProduct(model.value)
      ElMessage.success('Product created')
    }
    clearDirty()
    tabsStore.closeChildTab(props.tabId)
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    ElMessage.error(String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal menyimpan product'))
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="p-4">
    <div class="flex items-center justify-between gap-3 mb-3">
      <div class="flex items-center gap-3">
        <div class="text-lg font-semibold">{{ isEdit ? 'Edit Product' : 'New Product' }}</div>
        <el-tag v-if="dirty" type="warning">Unsaved</el-tag>
        <el-tag v-else type="success">Saved</el-tag>
      </div>
      <div class="flex items-center gap-2">
        <el-button v-if="isEdit" :disabled="!props.productId" @click="openUnits">Manage Units</el-button>
        <el-button type="primary" :loading="saving" @click="save">Save</el-button>
      </div>
    </div>

    <el-skeleton v-if="loading" rows="6" animated />

    <el-form v-else label-width="200px" class="max-w-[980px]">
      <el-form-item label="Code">
        <el-input v-model="model.code" />
      </el-form-item>

      <el-form-item label="Name">
        <el-input v-model="model.name" />
      </el-form-item>

      <el-form-item label="Description">
        <el-input v-model="model.description" type="textarea" :rows="3" />
      </el-form-item>

      <el-form-item label="Category">
        <el-select v-model="model.category_id" class="w-full" clearable filterable>
          <el-option v-for="c in categories" :key="c.id" :label="`${c.code} — ${c.name}`" :value="c.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Type">
        <el-select v-model="model.type" class="w-full">
          <el-option v-for="opt in typeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </el-form-item>

      <el-form-item label="UoM">
        <el-input v-model="model.uom" />
      </el-form-item>

      <el-divider content-position="left">Inventory & Serial</el-divider>

      <el-form-item label="Use Serial Number">
        <el-switch v-model="model.use_serial_number" />
      </el-form-item>

      <el-form-item label="Default Warehouse (optional)">
        <el-select v-model="model.default_warehouse_id" class="w-full" clearable filterable>
          <el-option v-for="w in warehouses" :key="w.id" :label="`${w.code} — ${w.name}`" :value="w.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Inventory Type (optional)">
        <el-input v-model="model.inventory_type" placeholder="Optional" />
      </el-form-item>

      <el-form-item label="Tax Code (optional)">
        <el-input v-model="model.tax_code" placeholder="Optional" />
      </el-form-item>

      <el-divider content-position="left">Vendor & Pricing Guardrails</el-divider>

      <el-form-item label="Preferred Vendor (optional)">
        <el-select v-model="model.preferred_vendor_id" class="w-full" clearable filterable>
          <el-option v-for="v in vendors" :key="v.id" :label="`${v.code} — ${v.name}`" :value="v.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Min Sales Price (optional)">
        <el-input v-model="model.min_sales_price" inputmode="decimal" placeholder="Optional" />
      </el-form-item>

      <el-form-item label="Max Sales Price (optional)">
        <el-input v-model="model.max_sales_price" inputmode="decimal" placeholder="Optional" />
      </el-form-item>

      <el-form-item label="Min Purchase Price (optional)">
        <el-input v-model="model.min_purchase_price" inputmode="decimal" placeholder="Optional" />
      </el-form-item>

      <el-form-item label="Max Purchase Price (optional)">
        <el-input v-model="model.max_purchase_price" inputmode="decimal" placeholder="Optional" />
      </el-form-item>

      <el-divider content-position="left">Account Overrides</el-divider>

      <el-form-item label="Inventory Account">
        <el-select v-model="model.inventory_account_id" class="w-full" clearable filterable>
          <el-option v-for="a in accounts" :key="a.id" :label="accountLabel(a)" :value="a.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="COGS Account">
        <el-select v-model="model.cogs_account_id" class="w-full" clearable filterable>
          <el-option v-for="a in accounts" :key="a.id" :label="accountLabel(a)" :value="a.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Sales Account">
        <el-select v-model="model.sales_account_id" class="w-full" clearable filterable>
          <el-option v-for="a in accounts" :key="a.id" :label="accountLabel(a)" :value="a.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Sales Discount Account">
        <el-select v-model="model.sales_discount_account_id" class="w-full" clearable filterable>
          <el-option v-for="a in accounts" :key="a.id" :label="accountLabel(a)" :value="a.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Sales Return Account">
        <el-select v-model="model.sales_return_account_id" class="w-full" clearable filterable>
          <el-option v-for="a in accounts" :key="a.id" :label="accountLabel(a)" :value="a.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Purchase Return Account">
        <el-select v-model="model.purchase_return_account_id" class="w-full" clearable filterable>
          <el-option v-for="a in accounts" :key="a.id" :label="accountLabel(a)" :value="a.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Unbilled Receipt Account">
        <el-select v-model="model.unbilled_receipt_account_id" class="w-full" clearable filterable>
          <el-option v-for="a in accounts" :key="a.id" :label="accountLabel(a)" :value="a.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Goods In Transit Account">
        <el-select v-model="model.goods_in_transit_account_id" class="w-full" clearable filterable>
          <el-option v-for="a in accounts" :key="a.id" :label="accountLabel(a)" :value="a.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Active">
        <el-switch v-model="model.is_active" />
      </el-form-item>
    </el-form>

    <el-dialog v-model="unitsDialogOpen" title="Manage Units" width="900">
      <div class="mb-3 flex items-center justify-between">
        <div class="text-sm text-[var(--el-text-color-secondary)]">
          Minimal harus ada 1 base unit (tepat 1).
        </div>
        <div class="flex items-center gap-2">
          <el-button size="small" @click="addUnit">Add Unit</el-button>
          <el-button size="small" type="primary" :loading="unitsSaving" @click="saveUnits">Save Units</el-button>
        </div>
      </div>

      <el-skeleton v-if="unitsLoading" rows="6" animated />

      <el-table v-else :data="units" border class="w-full">
        <el-table-column label="#" width="60">
          <template #default="scope">
            <div class="text-center">{{ scope.$index + 1 }}</div>
          </template>
        </el-table-column>

        <el-table-column label="Unit" min-width="180">
          <template #default="scope">
            <el-input v-model="scope.row.unit_name" />
          </template>
        </el-table-column>

        <el-table-column label="Ratio" width="120">
          <template #default="scope">
            <el-input v-model="scope.row.ratio" inputmode="decimal" />
          </template>
        </el-table-column>

        <el-table-column label="Base" width="90" align="center">
          <template #default="scope">
            <el-switch :model-value="Boolean(scope.row.is_base_unit)" @change="() => toggleBaseUnit(scope.$index)" />
          </template>
        </el-table-column>

        <el-table-column label="PL1" width="120">
          <template #default="scope">
            <el-input v-model="scope.row.price_level_1" inputmode="decimal" />
          </template>
        </el-table-column>

        <el-table-column label="PL2" width="120">
          <template #default="scope">
            <el-input v-model="scope.row.price_level_2" inputmode="decimal" />
          </template>
        </el-table-column>

        <el-table-column label="PL3" width="120">
          <template #default="scope">
            <el-input v-model="scope.row.price_level_3" inputmode="decimal" />
          </template>
        </el-table-column>

        <el-table-column label="PL4" width="120">
          <template #default="scope">
            <el-input v-model="scope.row.price_level_4" inputmode="decimal" />
          </template>
        </el-table-column>

        <el-table-column label="PL5" width="120">
          <template #default="scope">
            <el-input v-model="scope.row.price_level_5" inputmode="decimal" />
          </template>
        </el-table-column>

        <el-table-column label="" width="90" align="center">
          <template #default="scope">
            <el-button size="small" type="danger" plain @click="removeUnit(scope.$index)">Remove</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>
