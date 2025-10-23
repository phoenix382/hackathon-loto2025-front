/* eslint-disable @typescript-eslint/no-explicit-any */
// types/draw.ts
export interface DrawConfig {
  sources: string[]
  bits: number
  numbers: number
  max_number: number
}

export interface DrawResult {
  job_id: string
  status: string
  started_at: number
  finished_at: number
  config: DrawConfig
  stages: Record<string, any>[]
  draw: number[]
  fingerprint: string
  tests: Record<string, any>
}

export interface StreamEvent {
  /**
   * SSE or WS event name (e.g., 'entropy', 'whitening', 'seed', 'draw', 'tests', 'final').
   * For default SSE messages without named event, will be 'message'.
   */
  event: string
  /** Parsed payload of the event (JSON). */
  data: Record<string, any>
}

export interface BitsResult {
  job_id: string
  bits: string
  length: number
}

export interface DrawState {
  jobId: string | null
  result: DrawResult | null
  stages: string[]
  isLoading: boolean
  error: string | null
  showBits: boolean
  bits: BitsResult | null
}

export interface DrawLive {
  draw?: number[]
  fingerprint?: string
  tests_summary?: {
    eligible: number
    total: number
    passed: number
    ratio: number
  } | null
  status?: string
}
