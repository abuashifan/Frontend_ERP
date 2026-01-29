<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

import {
  createProductCategory,
  getProductCategory,
  updateProductCategory,
  type ProductCategory,
  type CreateProductCategoryPayload,
} from '../lib/api/modules/productCategories'
import { useTabDirty } from '../composables/useTabDirty'
import { useTabsStore } from '../stores/tabs'

const props = defineProps<{ tabId: string; mode: 'create' | 'edit'; productCategoryId?: number }>()

const isEdit = computed(() => props.mode === 'edit')
const loading = ref(false)
const saving = ref(false)
const loaded = ref(false)

const { dirty, markDirty, clearDirty } = useTabDirty(props.tabId)
const tabsStore = useTabsStore()

const model = ref<CreateProductCategoryPayload>({
  code: '',
  name: '',
  is_active: true,
})

async function load() {
  if (!isEdit.value) {
    loaded.value = true
    return
  }

  if (!props.productCategoryId) {
    ElMessage.error('productCategoryId tidak ditemukan')
    return
  }

  loading.value = true
  try {
    const category: ProductCategory = await getProductCategory(props.productCategoryId)
    model.value = {
      code: category.code,
      name: category.name,
      is_active: category.is_active,
    }
    clearDirty()
    loaded.value = true
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    ElMessage.error(String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal memuat product category'))
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
    if (isEdit.value && props.productCategoryId) {
      await updateProductCategory(props.productCategoryId, model.value)
      ElMessage.success('Product category updated')
    } else {
      await createProductCategory(model.value)
      ElMessage.success('Product category created')
    }
    clearDirty()
    tabsStore.closeChildTab(props.tabId)
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    ElMessage.error(String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal menyimpan product category'))
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
        <div class="text-lg font-semibold">{{ isEdit ? 'Edit Product Category' : 'New Product Category' }}</div>
        <el-tag v-if="dirty" type="warning">Unsaved</el-tag>
        <el-tag v-else type="success">Saved</el-tag>
      </div>
      <el-button type="primary" :loading="saving" @click="save">Save</el-button>
    </div>

    <el-skeleton v-if="loading" rows="6" animated />

    <el-form v-else label-width="160px" class="max-w-[760px]">
      <el-form-item label="Code">
        <el-input v-model="model.code" />
      </el-form-item>

      <el-form-item label="Name">
        <el-input v-model="model.name" />
      </el-form-item>

      <el-form-item label="Active">
        <el-switch v-model="model.is_active" />
      </el-form-item>
    </el-form>
  </div>
</template>
