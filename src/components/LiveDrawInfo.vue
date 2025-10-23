<!-- components/LiveDrawInfo.vue -->
<template>
  <div class="live-info" v-if="hasAny">
    <h3>Готовая информация (онлайн)</h3>

    <div v-if="numbers && numbers.length" class="numbers">
      <div class="hint">Комбинация сгенерирована и зафиксирована</div>
      <div class="grid">
        <div v-for="(n,i) in numbers" :key="i" class="ball">{{ n }}</div>
      </div>
    </div>

    <div v-if="fingerprint" class="fp">
      <div class="hint">Цифровой слепок</div>
      <code>{{ fingerprint }}</code>
    </div>

    <div v-if="testsSummary" class="summary">
      <div class="hint">Автотесты (промежуточная сводка)</div>
      <div class="row">
        <span>Пройдено: <strong>{{ testsSummary.passed }}</strong> / {{ testsSummary.eligible }}</span>
        <span>Всего тестов: {{ testsSummary.total }}</span>
        <span>Доля: {{ (testsSummary.ratio*100).toFixed(1) }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  numbers?: number[]
  fingerprint?: string
  testsSummary?: { eligible: number; total: number; passed: number; ratio: number } | null
}>()

const hasAny = computed(() => {
  // @ts-ignore - injected by Vue at runtime
  const p = __props as any
  return (p.numbers && p.numbers.length) || p.fingerprint || p.testsSummary
})
import { computed } from 'vue'
</script>

<style scoped>
.live-info { margin-top: 1rem; padding: 1rem; border: 1px solid #eee; border-radius: 8px; background: #fff; }
.hint { font-size: 0.85rem; color: #555; margin-bottom: 0.25rem; }
.grid { display: flex; gap: 0.65rem; flex-wrap: wrap; margin-top: 0.25rem; }
.ball { width: 46px; height: 46px; border-radius: 50%; background: #0d6efd; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.fp { margin-top: 0.75rem; }
.fp code { background: #f8f9fa; padding: 0.4rem 0.5rem; border-radius: 6px; display: inline-block; word-break: break-all; }
.summary { margin-top: 0.75rem; }
.row { display: flex; gap: 1rem; flex-wrap: wrap; color: #333; }
</style>

