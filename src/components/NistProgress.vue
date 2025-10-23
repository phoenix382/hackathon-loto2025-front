<!-- components/NistProgress.vue -->
<template>
  <div v-if="jobId" class="nist-progress">
    <!-- Intro floating window: centered then hides -->
    <div v-if="floating" class="intro-panel" aria-live="polite">
      <div class="intro-card">
        <div class="title">Запуск NIST SP 800‑22</div>
        <div class="desc">Подготовка и проверка применимости…</div>
      </div>
    </div>
    <h3>Прогресс NIST SP 800-22</h3>

    <div class="progress">
      <div class="progress-bar">
        <div class="fill" :style="{ width: progress + '%' }"></div>
      </div>
      <div class="progress-info">
        <span class="label">{{ progressLabel }}</span>
        <span v-if="counts.total" class="counts">{{ counts.completed }} / {{ counts.total }}</span>
      </div>
    </div>

    <div v-if="report" class="report">
      <div class="report-header">
        <div><strong>Пройдено:</strong> {{ report.summary.passed }}/{{ report.summary.eligible }}</div>
        <div><strong>Длина:</strong> {{ report.length }} бит</div>
        <div><strong>Статус:</strong> {{ statusRu(report.status) }}</div>
      </div>
      <div class="tests">
        <div v-for="t in report.tests" :key="t.name" class="test">
          <div class="name">
            {{ t.name }}
            <span class="badge" :class="t.passed ? 'ok' : 'fail'">{{ t.passed ? 'PASS' : 'FAIL' }}</span>
          </div>
          <div class="pv">p = {{ toFixed4(t.p_value) }}<span v-if="t.note"> · {{ t.note }}</span></div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="nist-empty"><p>Запустите NIST, чтобы увидеть прогресс.</p></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import type { NistReport, StreamEvent } from '@/types/audit'
import { buildWsUrl } from '@/utils/net'

const props = defineProps<{ jobId: string | null }>()

const events = ref<StreamEvent[]>([])
const report = ref<NistReport | null>(null)
let ws: WebSocket | null = null
let poll: number | null = null
const floating = ref(true)

const progress = ref(0)
const progressLabel = ref('Подготовка')
const counts = ref<{ completed: number; total: number | null }>({ completed: 0, total: null })
const seenTests = new Set<string>()

const toFixed4 = (n: number | null | undefined) => {
  if (typeof n !== 'number' || !isFinite(n)) return '-'
  return n.toFixed(4)
}

const statusRu = (s: string) => ({
  pending: 'Ожидание',
  running: 'Выполняется',
  completed: 'Завершено',
  failed: 'Ошибка',
} as Record<string, string>)[s] || s

const start = (id: string) => {
  stop()
  const url = buildWsUrl(`/audit/nist/ws/${id}`)
  ws = new WebSocket(url)
  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data)
      if (msg && msg.event) {
        const evn: StreamEvent = { event: msg.event, data: msg.data }
        events.value.push(evn)
        updateProgressFromEvent(evn)
        if (floating.value) {
          // hide intro shortly after first meaningful event
          window.setTimeout(() => (floating.value = false), 600)
        }
        if (msg.event === 'final' || msg.event === 'nist:done') {
          if (!poll) poll = window.setInterval(() => fetchReport(id), 1500)
        }
      }
    } catch {
      // ignore non-JSON WS messages
    }
  }
}

const stop = () => {
  if (ws) { try { ws.close() } catch {} ws = null }
  if (poll) { window.clearInterval(poll); poll = null }
}

const fetchReport = async (id: string) => {
  try {
    const r = await fetch(`/api/audit/nist/result/${id}`)
    if (!r.ok) return
    const data = (await r.json()) as NistReport
    report.value = data
    if (data.status === 'completed' || data.status === 'failed') stop()
  } catch {}
}

watch(
  () => props.jobId,
  (id) => {
    if (id) start(id)
    else stop()
  },
  { immediate: true }
)

function updateProgressFromEvent(e: StreamEvent) {
  const name = e.event
  const d: any = e.data || {}
  const inner = d && typeof d === 'object' ? (d.data ?? d) : d
  // init
  if (name === 'nist:start' || name === 'ready') {
    progress.value = 1
    progressLabel.value = 'Подготовка'
    counts.value.completed = 0
    if (typeof d.total === 'number') counts.value.total = d.total
    seenTests.clear()
    return
  }
  // eligibility reports expected totals
  if (name === 'nist:eligibility') {
    const total = (inner?.eligible ?? inner?.total) as number | undefined
    if (typeof total === 'number' && total > 0) {
      counts.value.total = total
    }
    progressLabel.value = 'Проверка применимости'
    return
  }
  // run/collect are staging phases
  if (name === 'nist:run' || name === 'nist:collect') {
    progressLabel.value = name === 'nist:run' ? 'Запуск набора тестов' : 'Сбор результатов'
    return
  }
  // specific test started (label only)
  if (name === 'nist:run:test') {
    const testName = (inner?.name || '').toString()
    if (testName) progressLabel.value = `Тест: ${testName}`
    return
  }
  // test finished → advance
  if (name === 'nist:test') {
    const testName = (inner?.name || '').toString()
    if (testName && !seenTests.has(testName)) {
      seenTests.add(testName)
      counts.value.completed = seenTests.size
    }
    const total = counts.value.total || 15
    progress.value = Math.max(0, Math.min(100, Math.round((counts.value.completed / total) * 100)))
    if (!counts.value.total) counts.value.total = total
    progressLabel.value = testName ? `Тест: ${testName} — ${inner?.passed ? 'PASS' : 'FAIL'}` : 'Выполнение тестов'
    return
  }
  // optional generic progress shape
  if (name === 'nist:progress') {
    if (typeof d.completed === 'number' && typeof d.total === 'number' && d.total > 0) {
      counts.value.completed = Math.max(counts.value.completed, d.completed)
      counts.value.total = d.total
      progress.value = Math.max(0, Math.min(100, Math.round((counts.value.completed / d.total) * 100)))
      progressLabel.value = d.name ? `Тест: ${d.name}` : 'Выполнение тестов'
      return
    }
  }
  if (name === 'nist:summary') {
    counts.value.completed = counts.value.total ?? counts.value.completed
    progress.value = 100
    progressLabel.value = 'Сводка'
    return
  }
  if (name === 'final' || name === 'nist:done') {
    progress.value = 100
    progressLabel.value = 'Завершено'
    return
  }
}

onUnmounted(() => stop())
onMounted(() => { if (props.jobId) start(props.jobId) })
</script>

<style scoped>
.nist-progress { margin-top: 1.25rem; }
.intro-panel { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 999; pointer-events: none; }
.intro-card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 20px 48px rgba(0,0,0,0.15); padding: 16px 18px; min-width: 280px; text-align: center; animation: intro-move .7s ease forwards; }
.intro-card .title { font-weight: 700; color: #111827; }
.intro-card .desc { color: #4b5563; margin-top: 4px; }
@keyframes intro-move { 0% { transform: translateY(0) scale(0.98); opacity: .98 } 100% { transform: translateY(-40vh) scale(0.96); opacity: 0 } }
.progress { margin: 0.5rem 0 1rem; }
.progress-bar { width: 100%; height: 10px; background: #e9ecef; border-radius: 999px; overflow: hidden; }
.fill { height: 100%; background: #0d6efd; width: 0%; transition: width .25s ease; }
.progress-info { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; color: #444; }
.progress-info .label { font-weight: 600; }
.progress-info .counts { font-variant-numeric: tabular-nums; color: #666; }
.report { margin-top: 1rem; }
.report-header { display: flex; gap: 1rem; margin-bottom: 0.5rem; color: #333; flex-wrap: wrap; }
.tests { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.5rem; }
.test { border: 1px solid #eee; border-radius: 8px; padding: 0.75rem; background: #fff; }
.name { display: flex; justify-content: space-between; align-items: center; font-weight: 600; margin-bottom: 0.25rem; }
.badge { padding: 0.1rem 0.5rem; border-radius: 999px; font-size: 0.75rem; }
.badge.ok { background: #d1e7dd; color: #0f5132; }
.badge.fail { background: #f8d7da; color: #842029; }
.pv { color: #555; }
.nist-empty { margin-top: 1rem; color: #555; }
</style>
