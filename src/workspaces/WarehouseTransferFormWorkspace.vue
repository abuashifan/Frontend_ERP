<script setup lang="ts">
import { computed, onActivated, onDeactivated, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

import { listWarehouses, type Warehouse } from '../lib/api/modules/warehouses'
import { listProducts, type Product } from '../lib/api/modules/products'
import {
  createWarehouseTransfer,
  getWarehouseTransfer,
  updateWarehouseTransfer,
  type CreateWarehouseTransferPayload,
  type WarehouseTransfer,
  type WarehouseTransferLine,
} from '../lib/api/modules/warehouseTransfers'
import { useTabDirty } from '../composables/useTabDirty'
import { useTabsStore } from '../stores/tabs'

const props = defineProps<{ tabId: string; mode: 'create' | 'edit'; transferId?: number }>()

const isCreate = computed(() => props.mode === 'create')
const { dirty, markDirty, clearDirty } = useTabDirty(props.tabId)
const tabsStore = useTabsStore()

const loading = ref(false)
const saving = ref(false)
const loaded = ref(false)

const warehouses = ref<Warehouse[]>([])
const products = ref<Product[]>([])

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function createEmptyModel(): CreateWarehouseTransferPayload {
  return {
    transfer_number: '',
    transfer_date: today(),
    source_warehouse_id: 0,
    destination_warehouse_id: 0,
    description: null,
    lines: [
      {
        product_id: 0,
        quantity: 1,
      },
    ],
  }
}

const model = ref<CreateWarehouseTransferPayload>(createEmptyModel())

watch(
  () => model.value,
  () => {
    if (!loaded.value) return
    markDirty()
  },
  { deep: true },
)

function addLine() {
  model.value.lines.push({ product_id: 0, quantity: 1 })
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
    ;[warehouses.value, products.value] = await Promise.all([listWarehouses(), listProducts()])

    if (!isCreate.value) {
      if (!props.transferId) {
        ElMessage.error('transferId tidak ditemukan')
        return
      }

      const tx: WarehouseTransfer = await getWarehouseTransfer(props.transferId)
      model.value = {
        transfer_number: tx.transfer_number,
        transfer_date: tx.transfer_date ? String(tx.transfer_date).slice(0, 10) : today(),
        source_warehouse_id: tx.source_warehouse_id,
        destination_warehouse_id: tx.destination_warehouse_id,
        description: tx.description ?? null,
        lines: (tx.lines ?? []).map((l): WarehouseTransferLine => ({
          id: l.id,
          product_id: l.product_id,
          quantity: l.quantity,
        })),
      }

      if (!model.value.lines.length) model.value.lines = createEmptyModel().lines
    }

    loaded.value = true
    clearDirty()
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    ElMessage.error(String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal memuat warehouse transfer'))
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
    if (!model.value.transfer_number?.trim()) {
      ElMessage.warning('Transfer number wajib diisi')
      return
    }

    if (!model.value.transfer_date) {
      ElMessage.warning('Transfer date wajib diisi')
      return
    }

    if (!model.value.source_warehouse_id || model.value.source_warehouse_id <= 0) {
      ElMessage.warning('Source warehouse wajib diisi')
      return
    }

    if (!model.value.destination_warehouse_id || model.value.destination_warehouse_id <= 0) {
      ElMessage.warning('Destination warehouse wajib diisi')
      return
    }

    if (model.value.source_warehouse_id === model.value.destination_warehouse_id) {
      ElMessage.warning('Source dan destination tidak boleh sama')
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

      const qty = Number(line.quantity ?? 0)
      if (!isFinite(qty) || qty <= 0) {
        ElMessage.warning(`Line ${idx + 1}: quantity wajib > 0`)
        return
      }
    }

    if (isCreate.value) {
      await createWarehouseTransfer(model.value)
    } else {
      if (!props.transferId) {
        ElMessage.error('transferId tidak ditemukan')
        return
      }
      await updateWarehouseTransfer(props.transferId, model.value)
    }

    clearDirty()
    ElMessage.success('Saved')
    tabsStore.closeChildTab(props.tabId)
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    ElMessage.error(String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal menyimpan warehouse transfer'))
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
        <div class="text-lg font-semibold">{{ isCreate ? 'New Warehouse Transfer' : 'Edit Warehouse Transfer' }}</div>
        <el-tag :type="dirty ? 'warning' : 'success'">{{ dirty ? 'Unsaved' : 'Saved' }}</el-tag>
      </div>
      <el-button type="primary" :loading="saving" @click="save">Save</el-button>
    </div>

    <el-skeleton v-if="loading" rows="8" animated />

    <el-form v-else label-width="200px" class="max-w-[980px]">
      <el-form-item label="Transfer Number">
        <el-input v-model="model.transfer_number" />
      </el-form-item>

      <el-form-item label="Transfer Date">
        <el-date-picker v-model="model.transfer_date" type="date" value-format="YYYY-MM-DD" />
      </el-form-item>

      <el-form-item label="Source Warehouse">
        <el-select v-model="model.source_warehouse_id" filterable class="w-full">
          <el-option v-for="w in warehouses" :key="w.id" :label="`${w.code} — ${w.name}`" :value="w.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Destination Warehouse">
        <el-select v-model="model.destination_warehouse_id" filterable class="w-full">
          <el-option v-for="w in warehouses" :key="w.id" :label="`${w.code} — ${w.name}`" :value="w.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Description">
        <el-input v-model="model.description" type="textarea" :rows="3" placeholder="Optional" />
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

        <el-table-column label="Quantity" width="160">
          <template #default="scope">
            <el-input v-model="scope.row.quantity" />
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
