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
  type: 'stock_item',
  uom: 'PCS',
  is_active: true,
})

const categories = ref<ProductCategory[]>([])

const typeOptions: Array<{ label: string; value: ProductType }> = [
  { label: 'Stock Item', value: 'stock_item' },
  { label: 'Service', value: 'service' },
]

async function load() {
  if (!isEdit.value) {
    try {
      categories.value = await listProductCategories()
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
    categories.value = await listProductCategories()
    const product: Product = await getProduct(props.productId)
    model.value = {
      code: product.code,
      name: product.name,
      description: product.description ?? null,
      category_id: product.category_id ?? null,
      type: product.type,
      uom: product.uom,
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
      <el-button type="primary" :loading="saving" @click="save">Save</el-button>
    </div>

    <el-skeleton v-if="loading" rows="6" animated />

    <el-form v-else label-width="140px" class="max-w-[760px]">
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

      <el-form-item label="Active">
        <el-switch v-model="model.is_active" />
      </el-form-item>
    </el-form>
  </div>
</template>
