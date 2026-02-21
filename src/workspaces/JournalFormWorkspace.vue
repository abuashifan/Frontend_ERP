<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

import { listChartOfAccounts, type ChartOfAccount } from '../lib/api/modules/chartOfAccounts'
import { resolveAccountingPeriod } from '../lib/api/modules/accountingPeriods'
import { createJournal } from '../lib/api/modules/journals'
import { useTenantStore } from '../stores/tenant'
import { useTabsStore } from '../stores/tabs'
import { useTabDirty } from '../composables/useTabDirty'

type LineDraft = {
  _key: string
  account_id: number | null
  debit: number | null
  credit: number | null
  description: string | null
}

const props = defineProps<{ tabId: string }>()

const tenantStore = useTenantStore()
const tabsStore = useTabsStore()
const { dirty, markDirty, clearDirty } = useTabDirty(props.tabId)

const loading = ref(false)
const saving = ref(false)
const loaded = ref(false)

const accounts = ref<ChartOfAccount[]>([])
const periodId = ref<number | null>(null)
const periodLabel = ref<string>('')
const periodOpen = ref<boolean>(true)

function todayIso(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function defaultJournalNumber(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(
    d.getSeconds(),
  )}`
  return `MANUAL-${stamp}`
}

function makeKey(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const model = ref({
  journal_number: defaultJournalNumber(),
  journal_date: todayIso(),
  source_type: 'manual',
  source_id: null as number | null,
  description: '',
})

const lines = ref<LineDraft[]>([
  { _key: makeKey(), account_id: null, debit: null, credit: null, description: null },
  { _key: makeKey(), account_id: null, debit: null, credit: null, description: null },
])

const totalDebit = computed(() => {
  return lines.value.reduce((sum, ln) => sum + Number(ln.debit ?? 0), 0)
})

const totalCredit = computed(() => {
  return lines.value.reduce((sum, ln) => sum + Number(ln.credit ?? 0), 0)
})

const isBalanced = computed(() => {
  return Math.abs(totalDebit.value - totalCredit.value) < 0.005
})

const canSave = computed(() => {
  if (!tenantStore.activeCompanyId) return false
  if (!periodId.value) return false
  if (!periodOpen.value) return false
  if (model.value.journal_number.trim() === '') return false
  if (model.value.description.trim() === '') return false
  if (lines.value.length < 2) return false
  if (!isBalanced.value) return false

  for (const ln of lines.value) {
    if (!ln.account_id) return false
    const debit = Number(ln.debit ?? 0)
    const credit = Number(ln.credit ?? 0)
    if (debit < 0 || credit < 0) return false
    if (debit === 0 && credit === 0) return false
  }

  return true
})

function accountLabel(a: ChartOfAccount): string {
  return `${a.code} — ${a.name}`
}

async function loadAccounts() {
  accounts.value = await listChartOfAccounts({ postableOnly: true, activeOnly: true })
}

async function loadPeriod() {
  const res = await resolveAccountingPeriod(model.value.journal_date)
  periodId.value = res.period.id
  periodOpen.value = Boolean(res.period.is_open)
  periodLabel.value = `${res.period.year}-${String(res.period.month).padStart(2, '0')} (${res.period.status})`
}

function addLine() {
  lines.value.push({ _key: makeKey(), account_id: null, debit: null, credit: null, description: null })
}

function removeLine(idx: number) {
  if (lines.value.length <= 2) {
    ElMessage.warning('Minimal 2 lines')
    return
  }
  lines.value.splice(idx, 1)
}

async function save() {
  if (!tenantStore.activeCompanyId) {
    ElMessage.error('company_id belum diset')
    return
  }
  if (!periodId.value) {
    ElMessage.error('period_id belum terisi')
    return
  }

  saving.value = true
  try {
    await createJournal({
      journal: {
        journal_number: model.value.journal_number.trim(),
        company_id: Number(tenantStore.activeCompanyId),
        period_id: periodId.value,
        journal_date: model.value.journal_date,
        source_type: model.value.source_type,
        source_id: model.value.source_id,
        description: model.value.description.trim(),
      },
      lines: lines.value.map((ln) => ({
        account_id: Number(ln.account_id),
        debit: ln.debit ?? 0,
        credit: ln.credit ?? 0,
        description: ln.description ?? null,
      })),
    })

    ElMessage.success('Journal created')
    clearDirty()
    tabsStore.closeChildTab(props.tabId)
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    ElMessage.error(String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal membuat journal'))
  } finally {
    saving.value = false
  }
}

watch(
  () => model.value.journal_date,
  () => {
    if (!loaded.value) return
    void loadPeriod()
    markDirty()
  },
)

watch(
  () => model.value,
  () => {
    if (!loaded.value) return
    markDirty()
  },
  { deep: true },
)

watch(
  () => lines.value,
  () => {
    if (!loaded.value) return
    markDirty()
  },
  { deep: true },
)

async function init() {
  loading.value = true
  try {
    await Promise.all([loadAccounts(), loadPeriod()])
    loaded.value = true
    clearDirty()
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    ElMessage.error(String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal memuat form journal'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void init()
})
</script>

<template>
  <div class="p-4">
    <div class="flex items-center justify-between gap-3 mb-3">
      <div class="flex items-center gap-3">
        <div class="text-lg font-semibold">New Journal</div>
        <el-tag v-if="dirty" type="warning">Unsaved</el-tag>
        <el-tag v-else type="success">Saved</el-tag>
      </div>
      <el-button type="primary" :loading="saving" :disabled="!canSave" @click="save">Save</el-button>
    </div>

    <el-skeleton v-if="loading" rows="8" animated />

    <div v-else>
      <el-card class="mb-3">
        <el-form label-width="150px">
          <el-form-item label="Journal Number">
            <el-input v-model="model.journal_number" />
          </el-form-item>

          <el-form-item label="Journal Date">
            <el-date-picker v-model="model.journal_date" type="date" value-format="YYYY-MM-DD" class="w-full" />
          </el-form-item>

          <el-form-item label="Period">
            <div class="flex items-center gap-2">
              <el-tag :type="periodOpen ? 'success' : 'danger'">{{ periodLabel || '-' }}</el-tag>
              <div v-if="!periodOpen" class="text-sm text-[var(--el-color-danger)]">Period closed</div>
            </div>
          </el-form-item>

          <el-form-item label="Source Type">
            <el-input v-model="model.source_type" disabled />
          </el-form-item>

          <el-form-item label="Description">
            <el-input v-model="model.description" type="textarea" :rows="2" />
          </el-form-item>
        </el-form>
      </el-card>

      <el-card>
        <div class="flex items-center justify-between mb-3">
          <div>
            <div class="text-sm text-[var(--el-text-color-secondary)]">Minimal 2 lines. Debit harus sama dengan credit.</div>
            <div class="text-sm">
              Total Debit: <strong>{{ totalDebit.toFixed(2) }}</strong>
              &nbsp;|&nbsp; Total Credit: <strong>{{ totalCredit.toFixed(2) }}</strong>
              &nbsp;|&nbsp;
              <el-tag :type="isBalanced ? 'success' : 'warning'">{{ isBalanced ? 'Balanced' : 'Not balanced' }}</el-tag>
            </div>
          </div>
          <el-button size="small" @click="addLine">Add Line</el-button>
        </div>

        <el-table :data="lines" border class="w-full">
          <el-table-column label="#" width="60" align="center">
            <template #default="scope">
              {{ scope.$index + 1 }}
            </template>
          </el-table-column>

          <el-table-column label="Account" min-width="260">
            <template #default="scope">
              <el-select v-model="scope.row.account_id" filterable class="w-full" placeholder="Select account">
                <el-option v-for="a in accounts" :key="a.id" :label="accountLabel(a)" :value="a.id" />
              </el-select>
            </template>
          </el-table-column>

          <el-table-column label="Debit" width="160" align="right">
            <template #default="scope">
              <el-input-number v-model="scope.row.debit" :min="0" controls-position="right" class="w-full" />
            </template>
          </el-table-column>

          <el-table-column label="Credit" width="160" align="right">
            <template #default="scope">
              <el-input-number v-model="scope.row.credit" :min="0" controls-position="right" class="w-full" />
            </template>
          </el-table-column>

          <el-table-column label="Line Desc" min-width="220">
            <template #default="scope">
              <el-input v-model="scope.row.description" placeholder="optional" />
            </template>
          </el-table-column>

          <el-table-column label="" width="110" align="center">
            <template #default="scope">
              <el-button size="small" type="danger" plain @click="removeLine(scope.$index)">Remove</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>
