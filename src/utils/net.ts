// utils/net.ts
export const wsBase = (): string => {
  const env = (import.meta as any).env || {}
  const fromEnv = env.VITE_API_WS_BASE as string | undefined
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  // Local dev: default to backend on 8000
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    return `${proto}://localhost:8000`
  }
  // Same host in production
  return `${proto}://${location.host}`
}

export const buildWsUrl = (path: string): string => {
  const base = wsBase()
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

