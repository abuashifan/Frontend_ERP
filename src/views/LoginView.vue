<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { ElMessage } from 'element-plus'

import { useAuthStore } from '../stores/auth'
import { loginWithPassword } from '../lib/api/modules/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const remember = ref(true)
const loading = ref(false)

const canSubmit = computed(() => email.value.trim().length > 0 && password.value.length > 0)

async function login() {
  if (!canSubmit.value) return

  loading.value = true
  try {
    const res = await loginWithPassword({
      email: email.value.trim(),
      password: password.value,
      device_name: 'frontend',
      remember: remember.value,
    })

    authStore.setToken(res.data.token)
    ElMessage.success('Login berhasil')
    router.replace('/app')
  } catch (e: unknown) {
    ElMessage.error('Email atau password salah')
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[var(--el-bg-color-page)] p-6">
    <el-card class="w-full max-w-md">
      <template #header>
        <div class="font-semibold">Login</div>
      </template>

      <div class="text-sm text-[var(--el-text-color-secondary)] mb-4">
        Masuk menggunakan email dan password.
      </div>

      <el-form label-position="top" @submit.prevent="login">
        <el-form-item label="Email">
          <el-input v-model="email" autocomplete="username" placeholder="admin@test.com" />
        </el-form-item>

        <el-form-item label="Password">
          <el-input
            v-model="password"
            type="password"
            show-password
            autocomplete="current-password"
            placeholder="password123"
            @keyup.enter="login"
          />
        </el-form-item>

        <div class="flex items-center justify-between mb-4">
          <el-checkbox v-model="remember">Remember me</el-checkbox>
        </div>

        <el-button type="primary" class="w-full" :loading="loading" :disabled="!canSubmit" @click="login">
          Masuk
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>
