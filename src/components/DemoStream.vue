<!-- components/DemoStream.vue -->
<template>
  <div class="demo-stream">
    <div class="controls">
      <button class="btn" @click="restart">Перезапустить</button>
    </div>

    <!-- Bricks grid with human-readable messages -->
    <transition-group name="brick" tag="div" class="bricks" aria-live="polite">
      <div v-for="c in cards" :key="c.id" class="brick" :class="c.kind">
        <div class="title">{{ c.title }}</div>
        <div class="text">{{ c.text }}</div>
        <div v-if="c.meta" class="meta">{{ c.meta }}</div>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { buildWsUrl } from '@/utils/net'

interface DemoEvent {
  event: string
  data: any
}

const scenario = ref('default')
const events = ref<DemoEvent[]>([])
let ws: WebSocket | null = null
let es: EventSource | null = null // fallback
type Card = {
  id: number
  event: string
  title: string
  text: string
  meta?: string
  kind: 'info' | 'ok' | 'err'
}
const cards = ref<Card[]>([])
let nextId = 1

const toMsg = (d: any) => {
  if (!d) return ''
  if (typeof d === 'string') return d
  return d.message || d.msg || d.note || JSON.stringify(d)
}

const start = () => {
  stop()
  events.value = []
  cards.value = []
  // Try WS first
  try {
    ws = new WebSocket(buildWsUrl(`/demo/ws?scenario=${encodeURIComponent(scenario.value)}`))
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data)
        if (msg?.event) events.value.push({ event: msg.event, data: msg.data })
      } catch {
        /* ignore */
      }
    }
    ws.onerror = () => {
      fallbackSSE()
    }
  } catch {
    fallbackSSE()
  }
}

const fallbackSSE = () => {
  if (ws) {
    try {
      ws.close()
    } catch {}
    ws = null
  }
  es = new EventSource(`/api/demo/stream?scenario=${encodeURIComponent(scenario.value)}`)
  const push = (event: string, data: any) => events.value.push({ event, data })
  es.onmessage = (ev) => {
    try {
      push('message', JSON.parse(ev.data))
    } catch {
      push('message', ev.data)
    }
  }
  es.addEventListener('final', (ev: MessageEvent) => {
    try {
      push('final', JSON.parse(ev.data))
    } catch {
      push('final', ev.data)
    }
  })
}

const stop = () => {
  if (ws) {
    try {
      ws.close()
    } catch {}
    ws = null
  }
  if (es) {
    es.close()
    es = null
  }
}
const restart = () => start()

watch(scenario, () => start())
onMounted(() => start())
onUnmounted(() => stop())

// Convert incoming events into readable bricks
watch(
  events,
  (arr) => {
    const last = arr[arr.length - 1]
    if (!last) return
    const id = nextId++
    const { title, text, kind, meta } = toReadable(last.event, last.data)
    cards.value.push({ id, event: last.event, title, text, kind, meta })
    // keep last 12 bricks
    if (cards.value.length > 20) cards.value.shift()
  },
  { deep: true },
)

const toReadable = (
  event: string,
  data: any,
): { title: string; text: string; kind: Card['kind']; meta?: string } => {
  const kind: Card['kind'] = /error|fail/.test(event)
    ? 'err'
    : /final|done|completed/.test(event)
      ? 'ok'
      : 'info'
  if (event === 'ready') {
    const scenario = typeof data?.scenario === 'string' ? data.scenario : ''
    return {
      title: 'Готово к старту',
      text: scenario ? `Сценарий: ${scenario}` : 'Демонстрационный режим',
      kind,
    }
  }
  if (event.startsWith('demo:')) {
    const stage = event.split(':')[1] || data?.stage?.split(':')[1] || 'stage'
    const map: Record<string, string> = {
      start: 'Старт демо',
      entropy: 'Сбор энтропии',
      whitening: 'Вайтинг',
      seed: 'Формирование seed',
      draw: 'Генерация',
      tests: 'Тесты NIST',
      finish: 'Завершение',
    }
    const title = map[stage] || `Этап: ${stage}`
    const text = data?.data?.info || data?.info || ''
    const meta = typeof data?.time === 'number' ? `t=${data.time}s` : undefined
    return { title, text, kind, meta }
  }
  if (event === 'final') {
    const ok = (data?.status || '').toString() === 'completed'
    return {
      title: 'Финал',
      text: ok ? 'Завершено успешно' : `Статус: ${data?.status ?? '—'}`,
      kind: ok ? 'ok' : 'err',
    }
  }
  // generic fallback
  const text = data?.info || data?.message || data?.msg || toMsg(data)
  return { title: `Событие: ${event}`, text, kind }
}
</script>

<style scoped>
.controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.75rem;
}
select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
}
.btn {
  padding: 0.5rem 0.75rem;
  background: #6c757d;
  color: #fff;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
}
.bricks {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.brick {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.brick.ok {
  border-color: #bcd0c7;
}
.brick.err {
  border-color: #f3b9bd;
}
.brick .title {
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}
.brick .text {
  color: #374151;
}
.brick .meta {
  color: #6b7280;
  font-size: 12px;
  margin-top: 6px;
}

/* Animations */
.brick-enter-active,
.brick-leave-active {
  transition: all 0.18s ease;
}
.brick-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.brick-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
