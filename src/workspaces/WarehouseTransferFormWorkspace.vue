<script setup lang="ts">
import { computed, nextTick, onActivated, onDeactivated, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

import { listWarehouses, type Warehouse } from '../lib/api/modules/warehouses'
import { listProducts, type Product } from '../lib/api/modules/products'
import { listAvailableProductSerialNumbers } from '../lib/api/modules/productSerials'
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

const productsById = computed(() => new Map(products.value.map((p) => [p.id, p])))

function isSerialTrackedProduct(productId: number | null | undefined): boolean {
  if (!productId) return false
  return Boolean(productsById.value.get(productId)?.use_serial_number)
}

function parseSerialNumbersInput(input: string): string[] {
  return input
    .split(/[\n,;]+/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function serialNumbersToText(serialNumbers: unknown): string {
  if (!Array.isArray(serialNumbers)) return ''
  return serialNumbers.map((s) => String(s ?? '').trim()).filter(Boolean).join('\n')
}

function setLineSerialNumbers(line: WarehouseTransferLine, rawText: string) {
  const parsed = parseSerialNumbersInput(rawText)
  line.serial_numbers = parsed.length ? parsed : undefined
}

const serialInputRefs = ref<any[]>([])

function setSerialInputRef(index: number, el: any) {
  if (!el) {
    serialInputRefs.value[index] = undefined
    return
  }
  serialInputRefs.value[index] = el
}

function clearLineSerialNumbers(line: WarehouseTransferLine) {
  line.serial_numbers = undefined
}

function normalizeSerials(serialNumbers: unknown): string[] {
  if (!Array.isArray(serialNumbers)) return []
  return serialNumbers.map((s) => String(s ?? '').trim()).filter(Boolean)
}

function getDuplicateSerials(serialNumbers: unknown): string[] {
  const normalized = normalizeSerials(serialNumbers)
  const counts = new Map<string, number>()
  for (const s of normalized) counts.set(s, (counts.get(s) ?? 0) + 1)
  return Array.from(counts.entries())
    .filter(([, c]) => c > 1)
    .map(([s]) => s)
}

function getSerialWarning(line: WarehouseTransferLine): string | null {
  if (!isSerialTrackedProduct(line.product_id)) return null

  const qty = Number(line.quantity ?? 0)
  if (!Number.isFinite(qty) || qty <= 0) return null

  const serials = normalizeSerials(line.serial_numbers)
  if (serials.length < 1) return 'Serial wajib diisi'
  if (!Number.isInteger(qty)) return 'Quantity harus bilangan bulat'
  if (serials.length !== qty) return `Jumlah serial ${serials.length} harus sama dengan qty ${qty}`

  const dupes = getDuplicateSerials(serials)
  if (dupes.length) return `Duplikat: ${dupes.join(', ')}`

  return null
}

async function focusFirstSerialError(err: unknown) {
  const response = (err as any)?.response
  if (!response || response.status !== 422) return

  const errors = response?.data?.errors
  if (!errors || typeof errors !== 'object') return

  const keys = Object.keys(errors as Record<string, unknown>)
  const firstLineKey =
    keys.find((k) => /^lines\.(\d+)\.serial_numbers(\.|$)/.test(k)) ??
    keys.find((k) => /^lines\.(\d+)\./.test(k))
  if (!firstLineKey) return

  const match = firstLineKey.match(/^lines\.(\d+)\./)
  if (!match) return

  const index = Number(match[1])
  if (!Number.isFinite(index)) return

  await nextTick()
  const input = serialInputRefs.value[index]
  const host = (input?.$el ?? null) as HTMLElement | null
  host?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  input?.focus?.()
}

function handleLineProductChanged(line: WarehouseTransferLine, pid: unknown) {
  const productId = typeof pid === 'number' ? pid : pid === null || pid === undefined ? null : Number(pid)
  if (!isSerialTrackedProduct(productId)) line.serial_numbers = undefined
}

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
        serial_numbers: undefined,
      },
    ],
  }
}

const model = ref<CreateWarehouseTransferPayload>(createEmptyModel())

type SerialSuggestion = { value: string }
const serialQuickAdd = ref<string[]>(model.value.lines.map(() => ''))

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
  serialQuickAdd.value.push('')
}

function removeLine(index: number) {
  if (model.value.lines.length <= 1) {
    ElMessage.warning('Minimal 1 line')
    return
  }
  model.value.lines.splice(index, 1)
  serialInputRefs.value.splice(index, 1)
  serialQuickAdd.value.splice(index, 1)
}

async function fetchSerialSuggestions(
  line: WarehouseTransferLine,
  query: string,
  cb: (items: SerialSuggestion[]) => void,
) {
  if (!model.value.source_warehouse_id || model.value.source_warehouse_id <= 0) {
    cb([])
    return
  }

  if (!line.product_id || line.product_id <= 0) {
    cb([])
    return
  }

  try {
    const serials = await listAvailableProductSerialNumbers({
      product_id: line.product_id,
      warehouse_id: model.value.source_warehouse_id,
      q: query,
      limit: 30,
    })
    cb(serials.map((s) => ({ value: s })))
  } catch {
    cb([])
  }
}

function addSerialToLine(line: WarehouseTransferLine, serial: string) {
  const s = String(serial ?? '').trim()
  if (!s) return

  const current = normalizeSerials(line.serial_numbers)
  if (current.includes(s)) {
    ElMessage.warning('Serial sudah ada di line ini')
    return
  }

  current.push(s)
  line.serial_numbers = current
}

function addSerialFromQuickAdd(line: WarehouseTransferLine, index: number, value?: string) {
  const raw = String(value ?? serialQuickAdd.value[index] ?? '').trim()
  if (!raw) return
  addSerialToLine(line, raw)
  serialQuickAdd.value[index] = ''
}

function onSerialSuggestionSelected(line: WarehouseTransferLine, index: number, item: SerialSuggestion) {
  addSerialFromQuickAdd(line, index, item?.value)
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
          serial_numbers: Array.isArray(l.serials) ? l.serials.map((s) => String(s.serial_number)) : undefined,
        })),
      }

      if (!model.value.lines.length) model.value.lines = createEmptyModel().lines
    }

    serialQuickAdd.value = model.value.lines.map(() => '')

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
  serialQuickAdd.value = model.value.lines.map(() => '')
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

      const serialTracked = isSerialTrackedProduct(line.product_id)
      const serials = Array.isArray(line.serial_numbers) ? line.serial_numbers : []
      const normalizedSerials = serials.map((s) => String(s ?? '').trim()).filter(Boolean)

      if (!serialTracked && normalizedSerials.length > 0) {
        ElMessage.warning(`Line ${idx + 1}: serial numbers hanya untuk product yang memakai serial`)
        return
      }

      if (serialTracked) {
        if (!Number.isInteger(qty)) {
          ElMessage.warning(`Line ${idx + 1}: quantity harus bilangan bulat untuk product serial`)
          return
        }

        if (normalizedSerials.length < 1) {
          ElMessage.warning(`Line ${idx + 1}: serial numbers wajib diisi untuk product serial`)
          return
        }

        if (normalizedSerials.length !== qty) {
          ElMessage.warning(`Line ${idx + 1}: jumlah serial numbers harus sama dengan quantity`)
          return
        }

        const unique = new Set(normalizedSerials)
        if (unique.size !== normalizedSerials.length) {
          ElMessage.warning(`Line ${idx + 1}: serial numbers tidak boleh duplikat`)
          return
        }
      }
    }

    const payload: CreateWarehouseTransferPayload = {
      ...model.value,
      lines: model.value.lines.map((l) => ({
        product_id: l.product_id,
        quantity: l.quantity,
        serial_numbers:
          isSerialTrackedProduct(l.product_id) && Array.isArray(l.serial_numbers) && l.serial_numbers.length
            ? l.serial_numbers
            : undefined,
      })),
    }

    if (isCreate.value) {
      await createWarehouseTransfer(payload)
    } else {
      if (!props.transferId) {
        ElMessage.error('transferId tidak ditemukan')
        return
      }
      await updateWarehouseTransfer(props.transferId, payload)
    }

    clearDirty()
    ElMessage.success('Saved')
    tabsStore.closeChildTab(props.tabId)
  } catch (err: unknown) {
    await focusFirstSerialError(err)
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
            <el-select
              v-model="scope.row.product_id"
              filterable
              class="w-full"
              @change="handleLineProductChanged(scope.row, $event)"
            >
              <el-option v-for="p in products" :key="p.id" :label="`${p.code} — ${p.name}`" :value="p.id" />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column label="Serial Numbers" min-width="260">
          <template #default="scope">
            <template v-if="isSerialTrackedProduct(scope.row.product_id)">
              <div class="flex items-center gap-2 mb-2">
                <el-autocomplete
                  v-model="serialQuickAdd[scope.$index]"
                  class="w-full"
                  :fetch-suggestions="(q: string, cb: any) => fetchSerialSuggestions(scope.row, q, cb)"
                  :trigger-on-focus="true"
                  :debounce="250"
                  placeholder="Cari serial available (source warehouse)"
                  :disabled="!model.source_warehouse_id || !scope.row.product_id"
                  @select="(item: any) => onSerialSuggestionSelected(scope.row, scope.$index, item)"
                />
                <el-button
                  size="small"
                  :disabled="!model.source_warehouse_id || !scope.row.product_id || !String(serialQuickAdd[scope.$index] ?? '').trim()"
                  @click="addSerialFromQuickAdd(scope.row, scope.$index)"
                >
                  Add
                </el-button>
              </div>
              <el-input
                type="textarea"
                :rows="2"
                :ref="(el: any) => setSerialInputRef(scope.$index, el)"
                :model-value="serialNumbersToText(scope.row.serial_numbers)"
                @update:model-value="(v: string) => setLineSerialNumbers(scope.row, v)"
                placeholder="1 serial per baris (wajib)"
              />
              <div class="mt-1 flex items-center justify-between gap-2">
                <div class="text-xs text-[var(--el-text-color-secondary)]">
                  {{ Array.isArray(scope.row.serial_numbers) ? scope.row.serial_numbers.length : 0 }} / {{ Number(scope.row.quantity ?? 0) || 0 }}
                </div>
                <el-button
                  v-if="Array.isArray(scope.row.serial_numbers) && scope.row.serial_numbers.length"
                  size="small"
                  type="danger"
                  link
                  @click="clearLineSerialNumbers(scope.row)"
                >
                  Clear
                </el-button>
              </div>
              <div v-if="getSerialWarning(scope.row)" class="text-xs text-[var(--el-color-danger)] mt-1">
                {{ getSerialWarning(scope.row) }}
              </div>
            </template>
            <template v-else>
              <div class="text-xs text-[var(--el-text-color-secondary)]">-</div>
            </template>
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
