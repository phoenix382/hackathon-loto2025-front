<!-- components/DrawForm.vue -->
<template>
  <div class="draw-form">
    <h2>Создать новый розыгрыш</h2>
    <form @submit.prevent="submitForm">
      <div class="form-group">
        <label for="sources">Источники энтропии:</label>
        <input
          id="sources"
          v-model="form.sources[0]"
          type="text"
          placeholder="Введите источник энтропии"
          required
          class="form-input"
        />
        <small>Например: system_entropy, user_input, etc.</small>
      </div>

      <div class="form-group">
        <label for="bits">Количество бит:</label>
        <select id="bits" v-model="form.bits" class="form-select">
          <option value="1024">1024</option>
          <option value="2048">2048</option>
          <option value="4096" selected>4096</option>
          <option value="8192">8192</option>
        </select>
      </div>

      <div class="form-group">
        <label for="numbers">Количество чисел:</label>
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
        <label for="max_number">Максимальное значение:</label>
        <input
          id="max_number"
          v-model.number="form.max_number"
          type="number"
          min="1"
          max="1000"
          required
          class="form-input"
        />
      </div>

      <button type="submit" :disabled="isLoading" class="submit-button">
        {{ isLoading ? 'Генерация...' : 'Сгенерировать числа' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { DrawConfig } from '@/types/draw'

interface Emits {
  (e: 'submit', config: DrawConfig): void
}

const emit = defineEmits<Emits>()
const isLoading = ref(false)

const form = reactive<DrawConfig>({
  sources: ['system_entropy'],
  bits: 4096,
  numbers: 6,
  max_number: 49,
})

const submitForm = async () => {
  if (isLoading.value) return

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
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.form-input,
.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #007bff;
}

small {
  color: #666;
  font-size: 0.875rem;
}

.submit-button {
  width: 100%;
  padding: 0.75rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
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
