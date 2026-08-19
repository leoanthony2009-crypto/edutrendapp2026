import { storage } from './storage'
import { isoNow } from './time'

/* Offline mutation queue. Every write that a backend will eventually own is also
   appended here, so when a sync endpoint exists the queue can be flushed in order.
   Until then the queue is the audit trail of local-first writes. */

export interface QueuedMutation {
  id: string
  kind: string
  payload: unknown
  queuedAt: string
}

const KEY = 'queue'
const MAX = 500

export function enqueue(kind: string, payload: unknown): void {
  const queue = storage.get<QueuedMutation[]>(KEY) ?? []
  queue.push({ id: crypto.randomUUID(), kind, payload, queuedAt: isoNow() })
  storage.set(KEY, queue.slice(-MAX))
}

export function pendingCount(): number {
  return (storage.get<QueuedMutation[]>(KEY) ?? []).length
}

/** Flush hook for the future backend — resolves without network today. */
export async function flush(): Promise<number> {
  const queue = storage.get<QueuedMutation[]>(KEY) ?? []
  return queue.length
}
