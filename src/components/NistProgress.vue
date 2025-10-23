<!-- components/NistProgress.vue -->
<template>
  <div v-if="jobId" class="nist-progress">
    <h3>Проверки NIST SP 800-22</h3>
    <div class="log" ref="logEl" aria-live="polite">
      <div v-for="(e, i) in events" :key="i" class="log-line">
        <span class="evt">{{ e.event }}</span>
        <span class="msg">{{ toMsg(e.data) }}</span>
      </div>
    </div>

    <div v-if="report" class="report">
      <div class="report-header">
        <div><strong>Пройдено тестов:</strong> {{ report.summary.passed }}/{{ report.summary.eligible }}</div>
        <div><strong>Длина:</strong> {{ report.length }} бит</div>
        <div><strong>Статус:</strong> {{ statusRu(report.status) }}</div>
      </div>
      <div class="tests">
        <div v-for="t in report.tests" :key="t.name" class="test">
          <div class="name">
            {{ t.name }}
            <span class="badge" :class="t.passed ? 'ok' : 'fail'">{{ t.passed ? 'ПРОЙДЕН' : 'НЕ ПРОЙДЕН' }}</span>
          </div>
          <div class="pv">p = {{ toFixed4(t.p_value) }}<span v-if="t.note"> • {{ t.note }}</span></div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="nist-empty">
    <p>Тест NIST ещё не запущен. Запустите его на вкладке «Аудит».</p>
  </div>
  
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { NistReport, StreamEvent } from '@/types/audit'
import { buildWsUrl } from '@/utils/net'

const props = defineProps<{ jobId: string | null }>()

const events = ref<StreamEvent[]>([])
const report = ref<NistReport | null>(null)
const logEl = ref<HTMLDivElement | null>(null)
let ws: WebSocket | null = null
let poll: number | null = null

const toMsg = (d: any) => {
  if (!d) return ''
  if (typeof d === 'string') return d
  return d.message || d.msg || d.note || JSON.stringify(d)
}

const toFixed4 = (n: number | null | undefined) => {
  if (typeof n !== 'number' || !isFinite(n)) return '-'
  return n.toFixed(4)
}

const statusRu = (s: string) => ({
  pending: 'ожидает',
  running: 'выполняется',
  completed: 'завершён',
  failed: 'ошибка',
} as Record<string, string>)[s] || s

const start = (id: string) => {
  stop()
  const url = buildWsUrl(`/audit/nist/ws/${id}`)
  ws = new WebSocket(url)
  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data)
      if (msg && msg.event) {
        events.value.push({ event: msg.event, data: msg.data })
        if (msg.event === 'final' || msg.event === 'nist:done') {
          // fetch final report a few times until ready
          if (!poll) poll = window.setInterval(() => fetchReport(id), 1500)
        }
      }
    } catch {
      // ignore non-JSON WS messages
    }
  }
  ws.onerror = () => {
    // optional: surface error to UI
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

watch(
  () => events.value.length,
  async () => {
    await nextTick()
    const el = logEl.value
    if (el) el.scrollTop = el.scrollHeight
  }
)

onUnmounted(() => stop())
onMounted(() => { if (props.jobId) start(props.jobId) })
</script>

<style scoped>
.nist-progress { margin-top: 1.25rem; }
.log { border: 1px solid #eee; border-radius: 8px; padding: 0.5rem; max-height: 180px; overflow: auto; background: #fafafa; }
.log-line { font-size: 0.9rem; color: #444; display: flex; gap: 0.5rem; padding: 0.1rem 0; }
.evt { color: #0d6efd; min-width: 120px; font-weight: 600; }
.report { margin-top: 1rem; }
.report-header { display: flex; gap: 1rem; margin-bottom: 0.5rem; color: #333; }
.tests { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.5rem; }
.test { border: 1px solid #eee; border-radius: 8px; padding: 0.75rem; background: #fff; }
.name { display: flex; justify-content: space-between; align-items: center; font-weight: 600; margin-bottom: 0.25rem; }
.badge { padding: 0.1rem 0.5rem; border-radius: 999px; font-size: 0.75rem; }
.badge.ok { background: #d1e7dd; color: #0f5132; }
.badge.fail { background: #f8d7da; color: #842029; }
.pv { color: #555; }
.nist-empty { margin-top: 1rem; color: #555; }
</style>

