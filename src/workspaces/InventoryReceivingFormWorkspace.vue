<script setup lang="ts">
import { computed, onActivated, onDeactivated, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

import { listWarehouses, type Warehouse } from '../lib/api/modules/warehouses'
import { listProducts, type Product } from '../lib/api/modules/products'
import { listPurchaseOrders, type PurchaseOrder } from '../lib/api/modules/purchaseOrders'
import { listVendorInvoices, type VendorInvoice } from '../lib/api/modules/vendorInvoices'
import {
  createInventoryReceiving,
  getInventoryReceiving,
  updateInventoryReceiving,
  type CreateInventoryReceivingPayload,
  type InventoryReceiving,
  type InventoryReceivingLine,
} from '../lib/api/modules/inventoryReceivings'
import { useTabDirty } from '../composables/useTabDirty'
import { useTabsStore } from '../stores/tabs'

const props = defineProps<{ tabId: string; mode: 'create' | 'edit'; receivingId?: number }>()

const isCreate = computed(() => props.mode === 'create')
const { dirty, markDirty, clearDirty } = useTabDirty(props.tabId)
const tabsStore = useTabsStore()

const loading = ref(false)
const saving = ref(false)
const loaded = ref(false)

const warehouses = ref<Warehouse[]>([])
const products = ref<Product[]>([])
const purchaseOrders = ref<PurchaseOrder[]>([])
const vendorInvoices = ref<VendorInvoice[]>([])

function createEmptyModel(): CreateInventoryReceivingPayload {
  return {
    warehouse_id: 0,
    purchase_order_id: null,
    vendor_invoice_id: null,
    lines: [
      {
        product_id: 0,
        qty_received: 1,
        unit_cost: 0,
        bin_location: null,
      },
    ],
  }
}

const model = ref<CreateInventoryReceivingPayload>(createEmptyModel())

watch(
  () => model.value,
  () => {
    if (!loaded.value) return
    markDirty()
  },
  { deep: true },
)

function addLine() {
  model.value.lines.push({
    product_id: 0,
    qty_received: 1,
    unit_cost: 0,
    bin_location: null,
  })
}

function removeLine(index: number) {
  if (model.value.lines.length <= 1) {
    ElMessage.warning('Minimal 1 line')
    return
  }
  model.value.lines.splice(index, 1)
}

async function load() {
  loading.value = true

  try {
    ;[warehouses.value, products.value, purchaseOrders.value, vendorInvoices.value] = await Promise.all([
      listWarehouses(),
      listProducts(),
      listPurchaseOrders(),
      listVendorInvoices(),
    ])

    if (!isCreate.value) {
      if (!props.receivingId) {
        ElMessage.error('receivingId tidak ditemukan')
        return
      }

      const recv: InventoryReceiving = await getInventoryReceiving(props.receivingId)
      model.value = {
        warehouse_id: recv.warehouse_id,
        purchase_order_id: recv.purchase_order_id ?? null,
        vendor_invoice_id: recv.vendor_invoice_id ?? null,
        lines: (recv.lines ?? []).map((l): InventoryReceivingLine => ({
          id: l.id,
          product_id: l.product_id,
          qty_received: l.qty_received,
          unit_cost: l.unit_cost,
          bin_location: l.bin_location ?? null,
        })),
      }

      if (!model.value.lines.length) model.value.lines = createEmptyModel().lines
    }

    loaded.value = true
    clearDirty()
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    ElMessage.error(String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal memuat inventory receiving'))
  } finally {
    loading.value = false
  }
}

function resetForCreateOnClose() {
  loaded.value = false
  saving.value = false
  loading.value = false
  model.value = createEmptyModel()
  clearDirty()
}

async function save() {
  saving.value = true

  try {
    if (!model.value.warehouse_id || model.value.warehouse_id <= 0) {
      ElMessage.warning('Warehouse wajib diisi')
      return
    }

    if (!model.value.lines?.length) {
      ElMessage.warning('Minimal 1 line')
      return
    }

    for (const [idx, line] of model.value.lines.entries()) {
      if (!line.product_id || line.product_id <= 0) {
        ElMessage.warning(`Line ${idx + 1}: product wajib dipilih`)
        return
      }

      const qty = Number(line.qty_received ?? 0)
      if (!isFinite(qty) || qty <= 0) {
        ElMessage.warning(`Line ${idx + 1}: qty received wajib > 0`)
        return
      }

      const cost = Number(line.unit_cost ?? 0)
      if (!isFinite(cost) || cost < 0) {
        ElMessage.warning(`Line ${idx + 1}: unit cost wajib >= 0`)
        return
      }
    }

    if (isCreate.value) {
      await createInventoryReceiving(model.value)
    } else {
      if (!props.receivingId) {
        ElMessage.error('receivingId tidak ditemukan')
        return
      }
      await updateInventoryReceiving(props.receivingId, model.value)
    }

    clearDirty()
    ElMessage.success('Saved')
    tabsStore.closeChildTab(props.tabId)
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    ElMessage.error(String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal menyimpan inventory receiving'))
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void load()
})

onActivated(() => {
  if (!loaded.value && !loading.value) void load()
})

onDeactivated(() => {
  const stillOpen = tabsStore.getChildTab(props.tabId) !== null
  if (!stillOpen && props.mode === 'create') {
    resetForCreateOnClose()
  }
})
</script>

<template>
  <div class="p-4">
    <div class="flex items-center justify-between gap-3 mb-3">
      <div class="flex items-center gap-3">
        <div class="text-lg font-semibold">{{ isCreate ? 'New Inventory Receiving' : 'Edit Inventory Receiving' }}</div>
        <el-tag :type="dirty ? 'warning' : 'success'">{{ dirty ? 'Unsaved' : 'Saved' }}</el-tag>
      </div>
      <el-button type="primary" :loading="saving" @click="save">Save</el-button>
    </div>

    <el-skeleton v-if="loading" rows="8" animated />

    <el-form v-else label-width="180px" class="max-w-[980px]">
      <el-form-item label="Warehouse">
        <el-select v-model="model.warehouse_id" filterable class="w-full">
          <el-option v-for="w in warehouses" :key="w.id" :label="`${w.code} — ${w.name}`" :value="w.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Purchase Order (optional)">
        <el-select v-model="model.purchase_order_id" filterable clearable class="w-full">
          <el-option v-for="po in purchaseOrders" :key="po.id" :label="po.po_number" :value="po.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Vendor Invoice (optional)">
        <el-select v-model="model.vendor_invoice_id" filterable clearable class="w-full">
          <el-option v-for="inv in vendorInvoices" :key="inv.id" :label="inv.invoice_number" :value="inv.id" />
        </el-select>
      </el-form-item>

      <div class="mt-6 mb-2 flex items-center justify-between">
        <div class="text-base font-semibold">Lines</div>
        <el-button size="small" @click="addLine">Add line</el-button>
      </div>

      <el-table :data="model.lines" class="w-full" border>
        <el-table-column label="#" width="60">
          <template #default="scope">
            <div class="text-center">{{ scope.$index + 1 }}</div>
          </template>
        </el-table-column>

        <el-table-column label="Product" min-width="280">
          <template #default="scope">
            <el-select v-model="scope.row.product_id" filterable class="w-full">
              <el-option v-for="p in products" :key="p.id" :label="`${p.code} — ${p.name}`" :value="p.id" />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column label="Qty Received" width="160">
          <template #default="scope">
            <el-input v-model="scope.row.qty_received" />
          </template>
        </el-table-column>

        <el-table-column label="Unit Cost" width="160">
          <template #default="scope">
            <el-input v-model="scope.row.unit_cost" />
          </template>
        </el-table-column>

        <el-table-column label="Bin Location" min-width="200">
          <template #default="scope">
            <el-input v-model="scope.row.bin_location" placeholder="Optional" />
          </template>
        </el-table-column>

        <el-table-column label="" width="90" align="center">
          <template #default="scope">
            <el-button size="small" type="danger" plain @click="removeLine(scope.$index)">Remove</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-form>
  </div>
</template>
