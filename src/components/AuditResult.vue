<!-- components/AuditResult.vue -->
<template>
  <div v-if="result" class="audit-result">
    <h3>Результаты анализа</h3>
    <div class="summary">
      <div><strong>Статус:</strong> {{ result.status }}</div>
      <div><strong>Длина:</strong> {{ result.length }} бит</div>
    </div>

    <div class="tests">
      <div v-for="(val, name) in result.tests" :key="name" class="test-item">
        <div class="test-name">{{ prettify(name) }}</div>
        <div class="test-value">
          <code>{{ format(val) }}</code>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="audit-empty">Пока нет данных для отображения.</div>
</template>

<script setup lang="ts">
import type { AuditResult } from '@/types/audit'

defineProps<{ result: AuditResult | null }>()

const prettify = (s: string) =>
  s
    .replace(/_/g, ' ')
    .replace(/\bmonobit\b/i, 'Моно-бит')
    .replace(/\bruns\b/i, 'Серии (runs)')
    .replace(/\bblock\b/i, 'Блочный')

const format = (v: unknown) => {
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}
</script>

<style scoped>
.audit-result { margin-top: 1.25rem; }
.summary { display: flex; gap: 2rem; margin: 0.5rem 0 1rem; color: #333; }
.tests { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; }
.test-item { padding: 0.75rem; background: #f8f9fa; border: 1px solid #eee; border-radius: 8px; }
.test-name { font-weight: 600; margin-bottom: 0.25rem; }
.test-value code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; }
.audit-empty { margin-top: 1rem; color: #666; }
</style>

