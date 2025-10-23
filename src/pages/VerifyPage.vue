<!-- pages/VerifyPage.vue -->
<template>
  <div class="verify-page">
    <header class="page-header">
      <h1>Аудит внешних последовательностей</h1>
      <p>Запускайте полный набор NIST SP 800-22 и наблюдайте прогресс по WebSocket.</p>
    </header>

    <section class="section">
      <AuditForm @nistStart="onNistStart" />
      <NistProgress :jobId="nistJobId" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AuditForm from '@/components/AuditForm.vue'
import NistProgress from '@/components/NistProgress.vue'

const nistJobId = ref<string | null>(null)
const onNistStart = (id: string) => { nistJobId.value = id }
</script>

<style scoped>
.verify-page { max-width: 1000px; margin: 0 auto; padding: 2rem; }
.page-header { text-align: center; margin-bottom: 1.5rem; }
.section { margin-top: 0.5rem; }
</style>

