<!-- pages/VerifyPage.vue -->
<template>
  <div class="verify-page">
    <header class="page-header">
      <h1>Проверка и демо</h1>
      <p>Проверяйте последовательности и запускайте набор тестов NIST; или посмотрите потоковую демо-ленту.</p>
    </header>

    <div class="tabs">
      <button class="tab" :class="{ active: tab==='audit' }" @click="tab='audit'">Аудит</button>
      <button class="tab" :class="{ active: tab==='demo' }" @click="tab='demo'">Демо</button>
    </div>

    <section v-if="tab==='audit'" class="section">
      <AuditForm @result="onAuditResult" @nistStart="onNistStart" />
      <AuditResult :result="auditResult" />
      <NistProgress :jobId="nistJobId" />
    </section>

    <section v-else class="section">
      <DemoStream />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AuditForm from '@/components/AuditForm.vue'
import AuditResult from '@/components/AuditResult.vue'
import NistProgress from '@/components/NistProgress.vue'
import DemoStream from '@/components/DemoStream.vue'
import type { AuditResult as AuditResultType } from '@/types/audit'

const tab = ref<'audit' | 'demo'>('audit')
const auditResult = ref<AuditResultType | null>(null)
const nistJobId = ref<string | null>(null)

const onAuditResult = (r: AuditResultType) => { auditResult.value = r }
const onNistStart = (id: string) => { nistJobId.value = id }
</script>

<style scoped>
.verify-page { max-width: 1000px; margin: 0 auto; padding: 2rem; }
.page-header { text-align: center; margin-bottom: 1.5rem; }
.tabs { display: flex; gap: 0.5rem; justify-content: center; margin: 0 0 1rem; }
.tab { padding: 0.5rem 1rem; border: 1px solid #ddd; border-radius: 999px; background: #f8f9fa; cursor: pointer; }
.tab.active { background: #007bff; color: #fff; border-color: #007bff; }
.section { margin-top: 0.5rem; }
</style>

