<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'

import { getJournal, type Journal } from '../lib/api/modules/journals'

const props = defineProps<{
  tabId: string
  journalId: number
}>()

const loading = ref(false)
const errorMessage = ref<string | null>(null)
const journal = ref<Journal | null>(null)

function formatMoney(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'Rp 0,00'
  const num = typeof value === 'number' ? value : Number(String(value))
  if (!Number.isFinite(num)) return 'Rp 0,00'
  const formatted = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num)
  return `Rp ${formatted}`
}

function sumDebit(j: Journal) {
  return j.lines.reduce((acc, ln) => acc + Number(ln.debit ?? 0), 0)
}

function sumCredit(j: Journal) {
  return j.lines.reduce((acc, ln) => acc + Number(ln.credit ?? 0), 0)
}

async function load() {
  loading.value = true
  errorMessage.value = null
  try {
    journal.value = await getJournal(props.journalId)
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    const message = maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal memuat journal'
    errorMessage.value = String(message)
    ElMessage.error(errorMessage.value)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="p-4">
    <div class="flex items-center justify-between gap-3 mb-3">
      <div>
        <div class="text-lg font-semibold">Journal Detail</div>
        <div class="text-sm text-[var(--el-text-color-secondary)]">ID: {{ journalId }}</div>
      </div>
      <el-button size="small" :loading="loading" @click="load">Refresh</el-button>
    </div>

    <el-alert v-if="errorMessage" type="error" :title="errorMessage" show-icon class="mb-3" />

    <el-skeleton v-if="loading && !journal" rows="8" animated />

    <template v-else-if="journal">
      <el-card class="mb-3">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <div class="text-xs text-[var(--el-text-color-secondary)]">No. Jurnal</div>
            <div class="font-medium">{{ journal.journal_number }}</div>
          </div>
          <div>
            <div class="text-xs text-[var(--el-text-color-secondary)]">Tanggal</div>
            <div class="font-medium">{{ journal.journal_date }}</div>
          </div>
          <div>
            <div class="text-xs text-[var(--el-text-color-secondary)]">Status</div>
            <div class="font-medium">{{ journal.status }}</div>
          </div>
          <div class="md:col-span-3">
            <div class="text-xs text-[var(--el-text-color-secondary)]">Deskripsi</div>
            <div class="font-medium whitespace-pre-wrap">{{ journal.description }}</div>
          </div>
          <div>
            <div class="text-xs text-[var(--el-text-color-secondary)]">Total Debit</div>
            <div class="font-medium">{{ formatMoney(sumDebit(journal)) }}</div>
          </div>
          <div>
            <div class="text-xs text-[var(--el-text-color-secondary)]">Total Credit</div>
            <div class="font-medium">{{ formatMoney(sumCredit(journal)) }}</div>
          </div>
        </div>
      </el-card>

      <el-card>
        <div class="text-sm font-semibold mb-2">Lines</div>
        <el-table :data="journal.lines" size="small" class="w-full">
          <el-table-column prop="account.code" label="Account" width="140" />
          <el-table-column prop="account.name" label="Account Name" min-width="240" />
          <el-table-column label="Debit" width="140" align="right">
            <template #default="scope">
              {{ formatMoney(scope.row.debit) }}
            </template>
          </el-table-column>
          <el-table-column label="Credit" width="140" align="right">
            <template #default="scope">
              {{ formatMoney(scope.row.credit) }}
            </template>
          </el-table-column>
          <el-table-column prop="description" label="Desc" min-width="240" />
        </el-table>
      </el-card>
    </template>
  </div>
</template>

