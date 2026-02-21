<script setup lang="ts">
import { ElConfigProvider } from 'element-plus'
import id from 'element-plus/es/locale/lang/id'
</script>

<template>
  <ElConfigProvider :locale="id">
    <RouterView />
  </ElConfigProvider>
</template>
