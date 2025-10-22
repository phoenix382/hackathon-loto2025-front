<!-- pages/DrawPage.vue -->
<template>
  <div class="draw-page">
    <header class="page-header">
      <h1>Генератор лотерейных чисел</h1>
      <p>Генерация случайных чисел с использованием криптографически безопасного ГСЧ</p>
    </header>

    <div v-if="error" class="error-message">
      {{ error }}
      <button @click="clearError" class="close-error">×</button>
    </div>

    <DrawForm v-if="!state.jobId && !state.result" @submit="startDraw" class="form-section" />

    <div v-if="state.jobId" class="processing-section">
      <ProgressDisplay
        :stages="state.stages"
        :stream-events="streamEvents"
        :status="state.result?.status || 'running'"
      />

      <button v-if="state.result?.status === 'running'" @click="cancelDraw" class="cancel-button">
        Отменить генерацию
      </button>
    </div>

    <ResultsDisplay
      v-if="state.result"
      :result="state.result"
      :bits="state.bits"
      :show-bits="state.showBits"
      @show-bits="loadBits"
      @new-draw="resetState"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onUnmounted } from 'vue'
import DrawForm from '@/components/DrawForm.vue'
import ProgressDisplay from '@/components/ProgressDisplay.vue'
import ResultsDisplay from '@/components/ResultsDisplay.vue'
import type { DrawConfig, DrawState, DrawResult, StreamEvent, BitsResult } from '@/types/draw'

defineOptions({
  components: {
    DrawForm,
    ProgressDisplay,
    ResultsDisplay,
  },
})

const state = reactive<DrawState>({
  jobId: null,
  result: null,
  stages: [],
  isLoading: false,
  error: null,
  showBits: false,
  bits: null,
})

const streamEvents = ref<StreamEvent[]>([])
let eventSource: EventSource | null = null
let pollInterval: number | null = null

const startDraw = async (config: DrawConfig) => {
  try {
    state.isLoading = true
    state.error = null

    const response = await fetch('/api/draw/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    })

    if (!response.ok) {
      throw new Error(`Ошибка сервера: ${response.status}`)
    }

    const data = await response.json()
    state.jobId = data.job_id

    // Запускаем отслеживание прогресса
    startProgressTracking(data.job_id)
  } catch (err) {
    state.error = err instanceof Error ? err.message : 'Произошла неизвестная ошибка'
  } finally {
    state.isLoading = false
  }
}

const startProgressTracking = (jobId: string) => {
  // SSE для получения событий в реальном времени
  eventSource = new EventSource(`/api/draw/stream/${jobId}`)

  eventSource.onmessage = (event) => {
    const streamEvent: StreamEvent = JSON.parse(event.data)
    streamEvents.value.push(streamEvent)

    // Обновляем этапы на основе событий
    updateStagesFromEvents(streamEvent)
  }

  eventSource.onerror = (error) => {
    console.error('SSE error:', error)
  }

  // Опрос для получения результатов
  pollInterval = window.setInterval(() => {
    fetchResult(jobId)
  }, 2000)
}

const updateStagesFromEvents = (event: StreamEvent) => {
  const stageTypes = ['entropy', 'whitening', 'seed', 'draw', 'tests', 'final']

  event.detail.forEach((detail) => {
    const stage = detail.loc[0] as string
    if (stageTypes.includes(stage) && !state.stages.includes(stage)) {
      state.stages.push(stage)
    }
  })
}

const fetchResult = async (jobId: string) => {
  try {
    const response = await fetch(`/api/draw/result/${jobId}`)

    if (!response.ok) {
      throw new Error(`Ошибка получения результата: ${response.status}`)
    }

    const result: DrawResult = await response.json()
    state.result = result

    // Если процесс завершен, останавливаем отслеживание
    if (result.status === 'completed' || result.status === 'failed') {
      stopProgressTracking()
    }
  } catch (err) {
    console.error('Error fetching result:', err)
  }
}

const loadBits = async () => {
  if (!state.jobId) return

  try {
    const response = await fetch(`/api/draw/bits/${state.jobId}`)

    if (!response.ok) {
      throw new Error(`Ошибка получения битов: ${response.status}`)
    }

    state.bits = await response.json()
    state.showBits = true
  } catch (err) {
    state.error = err instanceof Error ? err.message : 'Ошибка загрузки битов'
  }
}

const cancelDraw = () => {
  stopProgressTracking()
  state.jobId = null
  state.result = null
  state.stages = []
  streamEvents.value = []
}

const resetState = () => {
  stopProgressTracking()
  Object.assign(state, {
    jobId: null,
    result: null,
    stages: [],
    isLoading: false,
    error: null,
    showBits: false,
    bits: null,
  })
  streamEvents.value = []
}

const clearError = () => {
  state.error = null
}

const stopProgressTracking = () => {
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }

  if (pollInterval) {
    window.clearInterval(pollInterval)
    pollInterval = null
  }
}

onUnmounted(() => {
  stopProgressTracking()
})
</script>

<style scoped>
.draw-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.page-header h1 {
  color: #333;
  margin-bottom: 0.5rem;
}

.page-header p {
  color: #666;
  font-size: 1.1rem;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 2rem;
  position: relative;
}

.close-error {
  position: absolute;
  right: 0.5rem;
  top: 0.5rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #721c24;
}

.form-section {
  margin-bottom: 2rem;
}

.processing-section {
  text-align: center;
}

.cancel-button {
  padding: 0.75rem 1.5rem;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.cancel-button:hover {
  background-color: #c82333;
}
</style>
