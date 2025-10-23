<!-- components/ResultsDisplay.vue -->
<template>
  <div class="results-display">
    <h2>Результаты розыгрыша</h2>

    <div v-if="result" class="results-content">
      <div class="numbers-grid">
        <div v-for="(number, index) in result.draw" :key="index" class="number-ball">
          {{ number }}
        </div>
      </div>

      <div class="result-info">
        <div class="info-item"><strong>ID задания:</strong> {{ result.job_id }}</div>
        <div class="info-item">
          <strong>Начало:</strong> {{ formatTimestamp(result.started_at) }}
        </div>
        <div v-if="result.finished_at" class="info-item">
          <strong>Окончание:</strong> {{ formatTimestamp(result.finished_at) }}
        </div>
        <div class="info-item">
          <strong>Отпечаток:</strong>
          <code class="fingerprint">{{ result.fingerprint }}</code>
        </div>
      </div>

      <div class="actions">
        <button @click="$emit('showBits')" class="action-button">Показать биты</button>
        <button @click="saveBitsAsTxt" class="action-button secondary" :disabled="!bits">
          Сохранить биты как TXT
        </button>
        <button @click="$emit('newDraw')" class="action-button secondary">Новый розыгрыш</button>
      </div>
    </div>

    <div v-if="bits && showBits" class="bits-section">
      <h3>Промежуточные биты</h3>
      <div class="bits-info">
        <div><strong>Длина:</strong> {{ bits.length }} бит</div>
        <div><strong>Биты:</strong></div>
        <code class="bits-display">{{ bits.bits }}</code>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DrawResult, BitsResult } from '@/types/draw'

interface Props {
  result: DrawResult | null
  bits: BitsResult | null
  showBits: boolean
}

interface Emits {
  (e: 'showBits'): void
  (e: 'newDraw'): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString('ru-RU')
}

const saveBitsAsTxt = () => {
  // Use the props variable that's already defined above
  if (!props.bits) {
    console.warn('No bits data available to save')
    return
  }

  try {
    // Create file content
    const content = `Промежуточные биты розыгрыша
=======================

ID задания: ${props.result?.job_id || 'N/A'}
Время генерации: ${new Date().toLocaleString('ru-RU')}
Длина битовой последовательности: ${props.bits.length} бит

Битовая последовательность:
${props.bits.bits}

Отпечаток: ${props.result?.fingerprint || 'N/A'}`

    // Create blob and download link
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `bits_${props.result?.job_id || 'unknown'}_${timestamp}.txt`

    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error saving bits as TXT:', error)
    alert('Ошибка при сохранении файла')
  }
}
</script>

<style scoped>
.results-display {
  margin: 2rem 0;
}

.numbers-grid {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin: 2rem 0;
  flex-wrap: wrap;
}

.number-ball {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #007bff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.result-info {
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  margin: 1.5rem 0;
}

.info-item {
  margin-bottom: 0.5rem;
}

.fingerprint {
  font-family: monospace;
  background-color: #e9ecef;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  word-break: break-all;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin: 2rem 0;
  flex-wrap: wrap;
}

.action-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-button {
  background-color: #007bff;
  color: white;
}
.action-button.secondary {
  background-color: #6c757d;
  color: white;
}
.action-button:hover {
  opacity: 0.9;
}
.action-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.bits-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #ddd;
}

.bits-info {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
}

.bits-display {
  display: block;
  margin-top: 0.5rem;
  padding: 1rem;
  background-color: #e9ecef;
  border-radius: 4px;
  font-family: monospace;
  word-break: break-all;
  font-size: 0.875rem;
  max-height: 200px;
  overflow-y: auto;
}
</style>
