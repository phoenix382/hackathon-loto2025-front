<!-- components/DrawForm.vue -->
<template>
  <div class="draw-form">
    <h2>Настройка розыгрыша</h2>
    <form @submit.prevent="submitForm" novalidate>
      <div class="form-group">
        <label class="label">Источники случайности</label>
        <div class="sources">
          <label v-for="s in allSources" :key="s" class="source-item">
            <input type="checkbox" :value="s" v-model="form.sources" />
            <span>{{ sourceLabels[s] }}</span>
          </label>
        </div>
        <small>Можно выбрать несколько. Для прозрачности рекомендуем комбинировать независимые источники.</small>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="bits">Объём случайности (бит)</label>
          <input
            id="numbers"
            v-model.number="form.bits"
            type="number"
            min="1"
            max="10000000"
            required
            class="form-input"
          />
          <small>Больше бит — выше надёжность, но дольше обработка.</small>
        </div>

        <div class="form-group">
          <label for="numbers">Сколько чисел выбрать</label>
          <input
            id="numbers"
            v-model.number="form.numbers"
            type="number"
            min="1"
            max="100"
            required
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="max_number">Максимальное число (например, 49)</label>
          <input
            id="max_number"
            v-model.number="form.max_number"
            type="number"
            min="2"
            max="1000"
            required
            class="form-input"
          />
        </div>
      </div>

      <div v-if="formError" class="form-error">{{ formError }}</div>

      <button
        type="submit"
        :disabled="isLoading || form.sources.length === 0 || !!formError"
        class="submit-button"
      >
        {{ isLoading ? 'Запускаем…' : 'Запустить розыгрыш' }}
      </button>

      <div v-if="!isLoading && form.sources.length === 0" class="hint-inline">
        Пожалуйста, выберите хотя бы один источник.
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { DrawConfig } from '@/types/draw'

interface Emits {
  (e: 'submit', config: DrawConfig): void
}

const emit = defineEmits<Emits>()
const isLoading = ref(false)

const allSources = ['news', 'weather', 'solar', 'meteo_sat', 'os', 'time'] as const
const sourceLabels: Record<(typeof allSources)[number], string> = {
  news: 'Новости (RSS)',
  weather: 'Погода (Open‑Meteo)',
  solar: 'Солнечная активность',
  meteo_sat: 'Метеоспутники',
  os: 'Системный генератор (OS RNG)',
  time: 'Серверное время',
}

const form = reactive<DrawConfig>({
  sources: ['os', 'time'],
  bits: 4096,
  numbers: 6,
  max_number: 49,
})

const formError = computed<string | null>(() => {
  if (form.numbers < 1) return 'Количество чисел должно быть не меньше 1.'
  if (form.max_number < 2) return 'Максимальное число должно быть не меньше 2.'
  if (form.numbers > form.max_number) return 'Количество чисел не может превышать максимальное значение.'
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
</script>

<style scoped>
.draw-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.label,
label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.form-input,
select {
  width: 100%;
  padding: 0.65rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.form-input:focus,
select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15);
}

.sources {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem 1rem;
}

.source-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
}

small {
  color: #666;
  font-size: 0.875rem;
}

.hint-inline { color: #6c757d; margin-top: 0.5rem; }

.form-error {
  background: #fff3cd;
  color: #664d03;
  border: 1px solid #ffe69c;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  margin: 0.25rem 0 0.75rem;
}

.submit-button {
  width: 100%;
  padding: 0.75rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
}

.submit-button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.submit-button:hover:not(:disabled) {
  background-color: #0056b3;
}
</style>

