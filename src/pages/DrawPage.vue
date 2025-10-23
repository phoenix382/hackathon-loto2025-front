<!-- pages/DrawPage.vue (redesigned) -->
<template>
  <div class="draw">
    <section class="hero">
      <h1>Розыгрыш тиража</h1>
      <p>Генерация комбинации с прозрачным онлайн‑процессом: энтропия → вайтинг → seed → числа → тесты.</p>
      <div class="badges">
        <span class="badge">Энтропия</span>
        <span class="badge">Вайтинг</span>
        <span class="badge">Seed</span>
        <span class="badge">Комбинация</span>
        <span class="badge">Тесты</span>
      </div>
    </section>

    <section class="grid">
      <div class="col">
        <div class="card">
          <div class="card-head"><h3>Параметры</h3></div>
          <DrawForm @submit="startDraw" />
          <div v-if="state.error" class="alert" role="alert">
            {{ state.error }}
            <button class="alert-close" @click="clearError" aria-label="Закрыть">×</button>
          </div>
        </div>
      </div>
      <div class="col">
        <!-- Progress -->
        <div v-if="state.jobId && !state.result" class="card">
          <div class="card-head"><h3>Онлайн‑прогресс</h3></div>
          <ProgressDisplay
            :stages="state.stages"
            :stream-events="streamEvents"
            :status="uiStatus"
          />
          <LiveDrawInfo
            :numbers="live.draw"
            :fingerprint="live.fingerprint"
            :tests-summary="live.tests_summary || undefined"
          />
          <div class="actions">
            <button class="btn danger" @click="cancelDraw">Отменить</button>
          </div>
        </div>

        <!-- Result -->
        <div v-if="state.result" class="card">
          <div class="card-head"><h3>Итог тиража</h3></div>

          <div class="numbers">
            <div v-for="(n,i) in state.result.draw" :key="i" class="ball">{{ n }}</div>
          </div>

          <div class="info">
            <div class="row"><span class="k">ID задачи:</span><span class="v mono">{{ state.result.job_id }}</span></div>
            <div class="row"><span class="k">Старт:</span><span class="v">{{ ts(state.result.started_at) }}</span></div>
            <div class="row" v-if="state.result.finished_at"><span class="k">Финиш:</span><span class="v">{{ ts(state.result.finished_at as number) }}</span></div>
            <div class="row"><span class="k">Слепок:</span><span class="v mono">{{ state.result.fingerprint }}</span></div>
          </div>

          <div class="actions">
            <button class="btn" @click="loadBits">Показать биты</button>
            <button class="btn ghost" @click="resetState">Новый розыгрыш</button>
          </div>

          <div v-if="state.showBits && state.bits" class="bits" ref="bitsEl">
            <div class="row"><span class="k">Длина:</span><span class="v">{{ state.bits.length }} бит</span></div>
            <pre class="bits-box">{{ state.bits.bits }}</pre>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onUnmounted, computed, nextTick } from 'vue'
import DrawForm from '@/components/DrawForm.vue'
import ProgressDisplay from '@/components/ProgressDisplay.vue'
import LiveDrawInfo from '@/components/LiveDrawInfo.vue'
import type { DrawConfig, DrawState, DrawResult, StreamEvent, BitsResult, DrawLive } from '@/types/draw'
import { buildWsUrl } from '@/utils/net'

defineOptions({
  components: { DrawForm, ProgressDisplay, LiveDrawInfo },
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
const bitsEl = ref<HTMLElement | null>(null)
const uiStatus = computed(() => state.result?.status ?? 'running')

const startDraw = async (config: DrawConfig) => {
  try {
    state.isLoading = true
    state.error = null

    const response = await fetch('/api/draw/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    if (!response.ok) throw new Error(`Ошибка запуска: ${response.status}`)

    const data = await response.json()
    state.jobId = data.job_id
    startProgressTracking(data.job_id)
  } catch (err) {
    state.error = err instanceof Error ? err.message : 'Не удалось запустить тираж'
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
          if (!finalCheck) finalCheck = window.setInterval(() => fetchResult(jobId), 1500)
        }
      }
    } catch {
      // ignore non-JSON ws messages
    }
  }
}

const updateStagesFromEvent = (event: StreamEvent) => {
  const stage = (event.event.split(':')[0] || '') as string
  if (knownStages.includes(stage as any) && !state.stages.includes(stage)) {
    state.stages.push(stage)
  }
}

const updateLiveFromEvent = (event: StreamEvent) => {
  const d: any = event.data || {}
  if (event.event.startsWith('draw')) {
    const nums: unknown = d.draw ?? d.numbers
    if (Array.isArray(nums) && nums.every((x) => Number.isFinite(x))) live.draw = nums as number[]
    if (typeof d.fingerprint === 'string') live.fingerprint = d.fingerprint
  }
  if (event.event.startsWith('seed') && typeof d.fingerprint === 'string') {
    live.fingerprint = d.fingerprint
  }
  if (event.event.startsWith('tests')) {
    const s = d.summary || d.tests?.summary || null
    if (s && typeof s === 'object') {
      const { eligible, total, passed, ratio } = s
      if ([eligible, total, passed, ratio].every((v) => v !== undefined)) {
        live.tests_summary = { eligible, total, passed, ratio }
      }
    }
  }
}

const fetchResult = async (jobId: string) => {
  try {
    const response = await fetch(`/api/draw/result/${jobId}`)
    if (!response.ok) throw new Error(`Ошибка получения результата: ${response.status}`)
    const result: DrawResult = await response.json()
    state.result = result
    if (result.status === 'completed' || result.status === 'failed') stopProgressTracking()
  } catch (err) {
    console.error('Error fetching result:', err)
  }
}

const loadBits = async () => {
  if (!state.jobId) return
  try {
    const response = await fetch(`/api/draw/bits/${state.jobId}`)
    if (!response.ok) throw new Error(`������ ��������� �����: ${response.status}`)
    state.bits = (await response.json()) as BitsResult
    state.showBits = true
    await nextTick()
    bitsEl.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  } catch (err) {
    state.error = err instanceof Error ? err.message : '�� ������� ��������� ����'
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
  Object.assign(state, { jobId: null, result: null, stages: [], isLoading: false, error: null, showBits: false, bits: null })
  streamEvents.value = []
  Object.assign(live, { draw: undefined, fingerprint: undefined, tests_summary: null })
}

const clearError = () => { state.error = null }

const stopProgressTracking = () => {
  if (ws) { try { ws.close() } catch {} ws = null }
  if (finalCheck) { window.clearInterval(finalCheck); finalCheck = null }
}

const ts = (sec: number) => new Date(sec * 1000).toLocaleString('ru-RU')

onUnmounted(() => { stopProgressTracking() })
</script>

<style scoped>
.draw { max-width: 1100px; margin: 0 auto; padding: 24px; }
.hero { text-align: center; margin-bottom: 20px; }
.hero h1 { color: #111827; margin-bottom: 6px; }
.hero p { color: #4b5563; }
.badges { display: flex; gap: 8px; justify-content: center; margin-top: 10px; flex-wrap: wrap; }
.badge { border: 1px solid #e5e7eb; padding: 4px 10px; border-radius: 999px; font-size: 12px; color: #374151; background: #f9fafb; }

.grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
@media (min-width: 960px) { .grid { grid-template-columns: 1fr 1fr; } }
.col { display: flex; flex-direction: column; gap: 16px; }
.card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.card-head { margin-bottom: 8px; }
.card-head h3 { margin: 0; color: #111827; }

.alert { position: relative; margin-top: 12px; background: #f8d7da; color: #842029; border: 1px solid #f1aeb5; padding: 10px 36px 10px 12px; border-radius: 8px; }
.alert-close { position: absolute; right: 8px; top: 6px; border: 0; background: transparent; font-size: 18px; color: #842029; cursor: pointer; }

.actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
.btn { padding: 10px 14px; border-radius: 8px; border: 1px solid #d1d5db; background: #0d6efd; color: #fff; cursor: pointer; }
.btn.ghost { background: #fff; color: #374151; }
.btn.danger { background: #dc3545; border-color: #dc3545; }
.btn:hover { filter: brightness(0.95); }

.numbers { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-start; margin: 10px 0 4px; }
.ball { width: 56px; height: 56px; border-radius: 50%; background: #0d6efd; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; box-shadow: 0 2px 8px rgba(0,0,0,0.12); }

.info { margin: 8px 0 6px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; }
.row { display: flex; gap: 8px; padding: 4px 0; }
.k { width: 120px; color: #6b7280; }
.v { color: #111827; }
.mono { font-family: ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace; word-break: break-all; }

.bits { margin-top: 10px; }
.bits-box { white-space: pre-wrap; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; max-height: 230px; overflow: auto; font-family: ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace; font-size: 12px; }
</style>



