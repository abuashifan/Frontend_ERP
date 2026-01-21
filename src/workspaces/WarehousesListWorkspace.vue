<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'

import { listWarehouses, type Warehouse } from '../lib/api/modules/warehouses'

defineProps<{ tabId: string }>()

const loading = ref(false)
const errorMessage = ref<string | null>(null)
const rows = ref<Warehouse[]>([])

async function load() {
  loading.value = true
  errorMessage.value = null

  try {
    rows.value = await listWarehouses()
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    const message = maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal memuat warehouses'
    errorMessage.value = String(message ?? 'Gagal memuat warehouses')
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
        <div class="text-lg font-semibold">Warehouses</div>
        <div class="text-sm text-[var(--el-text-color-secondary)]">Data diambil dari backend.</div>
      </div>
      <div class="flex items-center gap-2">
        <el-button size="small" :loading="loading" @click="load">Refresh</el-button>
      </div>
    </div>

    <el-alert v-if="errorMessage" type="error" :title="errorMessage" show-icon class="mb-3" />

    <el-table v-loading="loading" :data="rows" height="calc(100vh - 240px)" class="w-full">
      <el-table-column prop="id" label="ID" width="90" />
      <el-table-column prop="code" label="Code" width="140" />
      <el-table-column prop="name" label="Name" min-width="240" />
      <el-table-column prop="address" label="Address" min-width="260" />
      <el-table-column prop="is_active" label="Active" width="110">
        <template #default="scope">
          <el-tag :type="scope.row.is_active ? 'success' : 'info'">
            {{ scope.row.is_active ? 'Yes' : 'No' }}
          </el-tag>
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
