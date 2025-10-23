<!-- components/DrawFormNew.vue -->
<template>
  <div class="draw-form">
    <form @submit.prevent="submitForm" novalidate>
      <div class="form-block">
        <div class="block-head">
          <h3>Источники случайности</h3>
          <div class="block-actions">
            <button type="button" class="link" @click="selectAll">Выбрать все</button>
            <span class="sep">•</span>
            <button type="button" class="link" @click="clearAll">Очистить</button>
          </div>
        </div>
        <div class="sources">
          <label v-for="s in allSources" :key="s" class="chip" :class="{ on: form.sources.includes(s) }">
            <input type="checkbox" :value="s" v-model="form.sources" />
            <span>{{ sourceLabels[s] }}</span>
          </label>
        </div>
        <div class="hint">Выберите 1–6 источников для комбинирования.</div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="bits">Объём энтропии (бит)</label>
          <input id="bits" v-model.number="form.bits" type="number" min="256" max="10000000" required class="input" />
          <small>Больше бит — стабильнее seed и тесты.</small>
        </div>
        <div class="form-group">
          <label for="numbers">Кол-во чисел</label>
          <input id="numbers" v-model.number="form.numbers" type="number" min="1" max="100" required class="input" />
        </div>
        <div class="form-group">
          <label for="max_number">Максимум (например, 49)</label>
          <input id="max_number" v-model.number="form.max_number" type="number" min="2" max="1000" required class="input" />
        </div>
      </div>

      <div v-if="formError" class="form-error">{{ formError }}</div>

      <button type="submit" class="btn primary full" :disabled="isLoading || form.sources.length === 0 || !!formError">
        {{ isLoading ? 'Запускаем…' : 'Запустить розыгрыш' }}
      </button>

      <div v-if="!isLoading && form.sources.length === 0" class="hint-inline">
        Выберите хотя бы один источник.
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { DrawConfig } from '@/types/draw'

interface Emits { (e: 'submit', config: DrawConfig): void }
const emit = defineEmits<Emits>()

const isLoading = ref(false)
const allSources = ['news', 'weather', 'solar', 'meteo_sat', 'os', 'time'] as const
const sourceLabels: Record<(typeof allSources)[number], string> = {
  news: 'Новости (RSS)',
  weather: 'Погода (Open‑Meteo)',
  solar: 'Солнечная активность',
  meteo_sat: 'Метеоснимки',
  os: 'Системный RNG',
  time: 'Микротайминги',
}

const form = reactive<DrawConfig>({
  sources: ['os', 'time'],
  bits: 4096,
  numbers: 6,
  max_number: 49,
})

const formError = computed<string | null>(() => {
  if (form.numbers < 1) return 'Количество чисел должно быть ≥ 1.'
  if (form.max_number < 2) return 'Максимум должен быть ≥ 2.'
  if (form.numbers > form.max_number) return 'Чисел больше, чем диапазон.'
  return null
})

const submitForm = async () => {
  if (isLoading.value || form.sources.length === 0 || formError.value) return
  isLoading.value = true
  try {
    await emit('submit', { ...form })
  } finally {
    isLoading.value = false
  }
}

const selectAll = () => { form.sources = [...allSources] as unknown as any }
const clearAll = () => { form.sources = [] }
</script>

<style scoped>
.draw-form { max-width: 800px; margin: 0 auto; }
.form-block { margin-bottom: 1rem; }
.block-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
.block-actions { display: flex; align-items: center; gap: 8px; }
.link { background: transparent; border: 0; color: #0d6efd; cursor: pointer; padding: 0; }
.sep { color: #9ca3af; }

.sources { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.chip { display: inline-flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 999px; border: 1px solid #e5e7eb; cursor: pointer; background: #fff; user-select: none; }
.chip.on { background: #0d6efd; color: #fff; border-color: #0d6efd; }
.chip input { display: none; }
.hint { color: #6b7280; font-size: 0.9rem; margin-top: 6px; }

.form-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 10px 0; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
label { font-weight: 600; }
.input { width: 100%; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 1rem; }
.input:focus { outline: none; border-color: #0d6efd; box-shadow: 0 0 0 3px rgba(13,110,253,0.15); }

.form-error { background: #fff3cd; color: #664d03; border: 1px solid #ffe69c; padding: 8px 10px; border-radius: 8px; margin: 4px 0 10px; }
.hint-inline { color: #6b7280; margin-top: 6px; }

.btn.primary { background: #0d6efd; color: #fff; border: 1px solid #0d6efd; }
.btn.full { width: 100%; }
.btn { padding: 12px 14px; border-radius: 10px; cursor: pointer; }
.btn:disabled { opacity: .6; cursor: not-allowed; }
</style>
