import { storage } from './storage'

/**
 * Offline write queue. Today all persistence is local (localStorage), so
 * nothing needs replaying — but every future network write should be
 * enqueued here and flushed on 'online', keeping the app usable offline.
 */
export interface QueuedWrite {
  id: string
  endpoint: string
  payload: unknown
  queuedAt: string
}

const KEY = 'offlineQueue'

export function enqueue(endpoint: string, payload: unknown): void {
  const queue = storage.get<QueuedWrite[]>(KEY, [])
  queue.push({ id: `q-${Date.now()}-${queue.length}`, endpoint, payload, queuedAt: new Date().toISOString() })
  storage.set(KEY, queue)
}

export function pending(): QueuedWrite[] {
  return storage.get<QueuedWrite[]>(KEY, [])
}

export async function flush(send: (w: QueuedWrite) => Promise<void>): Promise<void> {
  const queue = pending()
  const remaining: QueuedWrite[] = []
  for (const write of queue) {
    try {
      await send(write)
    } catch {
      remaining.push(write)
    }
  }
  storage.set(KEY, remaining)
}
