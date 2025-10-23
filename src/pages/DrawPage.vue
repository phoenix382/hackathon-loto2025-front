<!-- pages/DrawPage.vue -->
<template>
  <div class="draw-page">
    <header class="page-header">
      <h1>Розыгрыш случайных чисел</h1>
      <p>Генерируем числа из нескольких независимых источников. Всё прозрачно: этапы, seed, биты и тесты.</p>
    </header>

    <div v-if="state.error" class="error-message">
      {{ state.error }}
      <button @click="clearError" class="close-error" aria-label="Закрыть">×</button>
    </div>

    <DrawForm v-if="!state.jobId && !state.result" @submit="startDraw" class="form-section" />

    <div v-if="state.jobId" class="processing-section">
      <ProgressDisplay
        :stages="state.stages"
        :stream-events="streamEvents"
        :status="state.result?.status || 'running'"
      />

      <LiveDrawInfo
        v-if="!state.result"
        :numbers="live.draw"
        :fingerprint="live.fingerprint"
        :tests-summary="live.tests_summary || undefined"
      />

      <button v-if="state.result?.status === 'running'" @click="cancelDraw" class="cancel-button">
        Остановить
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
import type { DrawConfig, DrawState, DrawResult, StreamEvent, BitsResult, DrawLive } from '@/types/draw'
import { buildWsUrl } from '@/utils/net'
import LiveDrawInfo from '@/components/LiveDrawInfo.vue'

defineOptions({
  components: {
    DrawForm,
    ProgressDisplay,
    ResultsDisplay,
    LiveDrawInfo,
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
let ws: WebSocket | null = null
let finalCheck: number | null = null
const live = reactive<DrawLive>({ tests_summary: null })

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
      throw new Error(`Ошибка запуска розыгрыша: ${response.status}`)
    }

    const data = await response.json()
    state.jobId = data.job_id

    startProgressTracking(data.job_id)
  } catch (err) {
    state.error = err instanceof Error ? err.message : 'Не удалось запустить розыгрыш'
  } finally {
    state.isLoading = false
  }
}

const knownStages = ['entropy', 'whitening', 'seed', 'draw', 'tests', 'final'] as const

const startProgressTracking = (jobId: string) => {
  const url = buildWsUrl(`/draw/ws/${jobId}`)
  ws = new WebSocket(url)
  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data)
      if (msg && msg.event) {
        const e: StreamEvent = { event: msg.event, data: msg.data }
        streamEvents.value.push(e)
        updateStagesFromEvent(e)
        updateLiveFromEvent(e)
        if (msg.event === 'final') {
          // fetch final result once (retry until ready)
          if (!finalCheck) finalCheck = window.setInterval(() => fetchResult(jobId), 1500)
        }
      }
    } catch {
      // ignore non-JSON ws messages
    }
  }
  ws.onerror = () => {
    // optional: surface to UI via state.error
  }
}

const updateStagesFromEvent = (event: StreamEvent) => {
  // infer stage name from event name: 'entropy', 'whitening', etc.,
  // and also from colon-prefixed names like 'entropy:start'
  const name = event.event
  const stage = (name.split(':')[0] || '') as string
  if (knownStages.includes(stage as any) && !state.stages.includes(stage as string)) {
    state.stages.push(stage as string)
  }
}

const updateLiveFromEvent = (event: StreamEvent) => {
  const d: any = event.data || {}
  // Numbers appear on 'draw' stage
  if (event.event.startsWith('draw')) {
    const nums: unknown = d.draw ?? d.numbers
    if (Array.isArray(nums) && nums.every((x) => Number.isFinite(x))) {
      live.draw = nums as number[]
    }
    if (typeof d.fingerprint === 'string') {
      live.fingerprint = d.fingerprint
    }
  }
  // Fingerprint sometimes comes with seed stage
  if (event.event.startsWith('seed') && typeof d.fingerprint === 'string') {
    live.fingerprint = d.fingerprint
  }
  // Tests summary (partial)
  if (event.event.startsWith('tests')) {
    const s = (d && (d.summary || (d.tests && d.tests.summary))) || null
    if (s && typeof s === 'object') {
      const { eligible, total, passed, ratio } = s as any
      if ([eligible, total, passed, ratio].every((v) => v !== undefined)) {
        live.tests_summary = { eligible, total, passed, ratio }
      }
    }
  }
}

const fetchResult = async (jobId: string) => {
  try {
    const response = await fetch(`/api/draw/result/${jobId}`)

    if (!response.ok) {
      throw new Error(`Ошибка получения результата: ${response.status}`)
    }

    const result: DrawResult = await response.json()
    state.result = result

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

    state.bits = (await response.json()) as BitsResult
    state.showBits = true
  } catch (err) {
    state.error = err instanceof Error ? err.message : 'Не удалось получить биты'
  }
}

const cancelDraw = () => {
  stopProgressTracking()
  state.jobId = null
  state.result = null
  state.stages = []
  streamEvents.value = []
  Object.assign(live, { draw: undefined, fingerprint: undefined, tests_summary: null })
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
  Object.assign(live, { draw: undefined, fingerprint: undefined, tests_summary: null })
}

const clearError = () => {
  state.error = null
}

const stopProgressTracking = () => {
  if (ws) { try { ws.close() } catch {} ws = null }
  if (finalCheck) { window.clearInterval(finalCheck); finalCheck = null }
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
