<script setup lang="ts">
import { computed, onActivated, onDeactivated, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

import { listWarehouses, type Warehouse } from '../lib/api/modules/warehouses'
import { listProducts, type Product } from '../lib/api/modules/products'
import {
  createInventoryMovement,
  getInventoryMovement,
  updateInventoryMovement,
  type CreateInventoryMovementPayload,
  type InventoryMovement,
  type InventoryMovementLine,
} from '../lib/api/modules/inventoryMovements'
import { useTabDirty } from '../composables/useTabDirty'
import { useTabsStore } from '../stores/tabs'

const props = defineProps<{ tabId: string; mode: 'create' | 'edit'; inventoryMovementId?: number }>()

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

function createEmptyModel(): CreateInventoryMovementPayload {
  return {
    warehouse_id: 0,
    movement_number: '',
    movement_date: today(),
    type: 'in',
    reference_type: null,
    reference_id: null,
    notes: null,
    lines: [
      {
        product_id: 0,
        qty: 1,
        unit_cost: null,
        description: null,
      },
    ],
  }
}

const model = ref<CreateInventoryMovementPayload>(createEmptyModel())

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
    qty: 1,
    unit_cost: null,
    description: null,
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
    ;[warehouses.value, products.value] = await Promise.all([listWarehouses(), listProducts()])

    if (!isCreate.value) {
      if (!props.inventoryMovementId) {
        ElMessage.error('inventoryMovementId tidak ditemukan')
        return
      }

      const mv: InventoryMovement = await getInventoryMovement(props.inventoryMovementId)
      model.value = {
        warehouse_id: mv.warehouse_id,
        movement_number: mv.movement_number,
        movement_date: mv.movement_date ? String(mv.movement_date).slice(0, 10) : today(),
        type: mv.type,
        reference_type: mv.reference_type,
        reference_id: mv.reference_id,
        notes: mv.notes,
        lines: (mv.lines ?? []).map((l): InventoryMovementLine => ({
          id: l.id,
          product_id: l.product_id,
          qty: l.qty,
          unit_cost: l.unit_cost ?? null,
          description: l.description ?? null,
        })),
      }

      if (!model.value.lines.length) model.value.lines = createEmptyModel().lines
    }

    loaded.value = true
    clearDirty()
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    ElMessage.error(String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal memuat inventory movement'))
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

    if (!model.value.movement_number?.trim()) {
      ElMessage.warning('Movement number wajib diisi')
      return
    }

    if (!model.value.movement_date) {
      ElMessage.warning('Movement date wajib diisi')
      return
    }

    if (model.value.type !== 'in' && model.value.type !== 'out') {
      ElMessage.warning('Type tidak valid')
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

      const qty = Number(line.qty ?? 0)
      if (!isFinite(qty) || qty <= 0) {
        ElMessage.warning(`Line ${idx + 1}: qty wajib > 0`)
        return
      }

      if (line.unit_cost !== null && line.unit_cost !== undefined && String(line.unit_cost).length > 0) {
        const cost = Number(line.unit_cost)
        if (!isFinite(cost) || cost < 0) {
          ElMessage.warning(`Line ${idx + 1}: unit cost wajib >= 0`)
          return
        }
      }
    }

    if (isCreate.value) {
      await createInventoryMovement(model.value)
    } else {
      if (!props.inventoryMovementId) {
        ElMessage.error('inventoryMovementId tidak ditemukan')
        return
      }
      await updateInventoryMovement(props.inventoryMovementId, model.value)
    }

    clearDirty()
    ElMessage.success('Saved')
    tabsStore.closeChildTab(props.tabId)
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    ElMessage.error(String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal menyimpan inventory movement'))
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
        <div class="text-lg font-semibold">{{ isCreate ? 'New Inventory Movement' : 'Edit Inventory Movement' }}</div>
        <el-tag :type="dirty ? 'warning' : 'success'">{{ dirty ? 'Unsaved' : 'Saved' }}</el-tag>
      </div>
      <el-button type="primary" :loading="saving" @click="save">Save</el-button>
    </div>

    <el-skeleton v-if="loading" rows="8" animated />

    <el-form v-else label-width="160px" class="max-w-[980px]">
      <el-form-item label="Warehouse">
        <el-select v-model="model.warehouse_id" filterable class="w-full">
          <el-option v-for="w in warehouses" :key="w.id" :label="`${w.code} — ${w.name}`" :value="w.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Movement Number">
        <el-input v-model="model.movement_number" />
      </el-form-item>

      <el-form-item label="Movement Date">
        <el-date-picker v-model="model.movement_date" type="date" value-format="YYYY-MM-DD" />
      </el-form-item>

      <el-form-item label="Type">
        <el-select v-model="model.type" class="w-full">
          <el-option label="In" value="in" />
          <el-option label="Out" value="out" />
        </el-select>
      </el-form-item>

      <el-form-item label="Reference Type">
        <el-input v-model="model.reference_type" placeholder="Optional" />
      </el-form-item>

      <el-form-item label="Reference ID">
        <el-input v-model="model.reference_id" placeholder="Optional" />
      </el-form-item>

      <el-form-item label="Notes">
        <el-input v-model="model.notes" type="textarea" :rows="3" placeholder="Optional" />
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

        <el-table-column label="Qty" width="140">
          <template #default="scope">
            <el-input v-model="scope.row.qty" />
          </template>
        </el-table-column>

        <el-table-column label="Unit Cost" width="160">
          <template #default="scope">
            <el-input v-model="scope.row.unit_cost" />
          </template>
        </el-table-column>

        <el-table-column label="Description" min-width="220">
          <template #default="scope">
            <el-input v-model="scope.row.description" />
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
