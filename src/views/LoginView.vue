<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { ElMessage } from 'element-plus'

import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const token = ref(authStore.token ?? '')
const canSubmit = computed(() => token.value.trim().length > 0)

function saveToken() {
  const value = token.value.trim()
  if (!value) {
    ElMessage.warning('Token wajib diisi')
    return
  }

  authStore.setToken(value)
  ElMessage.success('Token tersimpan')
  router.replace('/app')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="w-full max-w-md bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h1 class="text-xl font-semibold mb-2">Login</h1>
      <p class="text-sm text-gray-600 mb-6">Masukkan Sanctum API token (Bearer).</p>

      <el-form label-position="top" @submit.prevent="saveToken">
        <el-form-item label="API Token">
          <el-input
            v-model="token"
            type="password"
            show-password
            placeholder="Paste token di sini"
            autocomplete="off"
            @keyup.enter="saveToken"
          />
        </el-form-item>

        <el-button type="primary" class="w-full" :disabled="!canSubmit" @click="saveToken">
          Masuk
        </el-button>
      </el-form>
    </div>
  </div>
</template>
