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
  detail: Array<{
    loc: (string | number)[]
    msg: string
    type: string
  }>
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
