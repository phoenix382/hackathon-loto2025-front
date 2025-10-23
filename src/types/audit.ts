/* eslint-disable @typescript-eslint/no-explicit-any */
// types/audit.ts

export interface AuditInput {
  sequence_bits?: string | null
  numbers?: number[] | null
}

export interface AuditResult {
  status: string
  length: number
  tests: Record<string, any>
}

export interface NistStartResponse {
  job_id: string
}

export interface NistSummary {
  eligible: number
  total: number
  passed: number
  ratio: number
}

export interface NistTestCase {
  name: string
  passed: boolean
  p_value: number
  note?: string | null
}

export interface NistReport {
  job_id: string
  status: string
  started_at: number
  finished_at?: number | null
  length: number
  tests: NistTestCase[]
  summary: NistSummary
}

export interface StreamEvent {
  event: string
  data: Record<string, any>
}

