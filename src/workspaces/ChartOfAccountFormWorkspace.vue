<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

import {
  createChartOfAccount,
  getChartOfAccount,
  updateChartOfAccount,
  type ChartOfAccount,
  type CreateChartOfAccountPayload,
} from '../lib/api/modules/chartOfAccounts'
import { useTabDirty } from '../composables/useTabDirty'
import { useTabsStore } from '../stores/tabs'

const props = defineProps<{ tabId: string; mode: 'create' | 'edit'; accountId?: number }>()

const isEdit = computed(() => props.mode === 'edit')
const loading = ref(false)
const saving = ref(false)
const loaded = ref(false)

const { dirty, markDirty, clearDirty } = useTabDirty(props.tabId)
const tabsStore = useTabsStore()

const model = ref<CreateChartOfAccountPayload>({
  code: '',
  name: '',
  type: 'asset',
  normal_balance: 'debit',
  parent_id: null,
  level: 2,
  is_postable: true,
  is_active: true,
})

async function load() {
  if (!isEdit.value) {
    loaded.value = true
    return
  }

  if (!props.accountId) {
    ElMessage.error('accountId tidak ditemukan')
    return
  }

  loading.value = true
  try {
    const coa: ChartOfAccount = await getChartOfAccount(props.accountId)
    model.value = {
      code: coa.code,
      name: coa.name,
      type: coa.type,
      normal_balance: coa.normal_balance,
      parent_id: coa.parent_id,
      level: coa.level,
      is_postable: coa.is_postable,
      is_active: coa.is_active,
    }
    clearDirty()
    loaded.value = true
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    ElMessage.error(String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal memuat chart of account'))
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
    if (isEdit.value && props.accountId) {
      await updateChartOfAccount(props.accountId, model.value)
      ElMessage.success('Account updated')
    } else {
      await createChartOfAccount(model.value)
      ElMessage.success('Account created')
    }

    clearDirty()
    tabsStore.closeChildTab(props.tabId)
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    ElMessage.error(String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal menyimpan account'))
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
        <div class="text-lg font-semibold">{{ isEdit ? 'Edit Account' : 'New Account' }}</div>
        <el-tag v-if="dirty" type="warning">Unsaved</el-tag>
        <el-tag v-else type="success">Saved</el-tag>
      </div>
      <el-button type="primary" :loading="saving" @click="save">Save</el-button>
    </div>

    <el-skeleton v-if="loading" rows="5" animated />

    <el-form v-else label-width="140px" class="max-w-[760px]">
      <el-form-item label="Code">
        <el-input v-model="model.code" />
      </el-form-item>

      <el-form-item label="Name">
        <el-input v-model="model.name" />
      </el-form-item>

      <el-form-item label="Type">
        <el-select v-model="model.type" class="w-full">
          <el-option label="asset" value="asset" />
          <el-option label="liability" value="liability" />
          <el-option label="equity" value="equity" />
          <el-option label="income" value="income" />
          <el-option label="expense" value="expense" />
        </el-select>
      </el-form-item>

      <el-form-item label="Normal Balance">
        <el-select v-model="model.normal_balance" class="w-full">
          <el-option label="debit" value="debit" />
          <el-option label="credit" value="credit" />
        </el-select>
      </el-form-item>

      <el-form-item label="Level">
        <el-input-number v-model="model.level" :min="1" :max="20" controls-position="right" class="w-full" />
      </el-form-item>

      <el-form-item label="Postable">
        <el-switch v-model="model.is_postable" />
      </el-form-item>

      <el-form-item label="Active">
        <el-switch v-model="model.is_active" />
      </el-form-item>
    </el-form>
  </div>
</template>
