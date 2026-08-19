/** Local-first persistence boundary.
    Every service reads/writes through this adapter; swapping `storage` for a
    server-backed implementation is the single integration point for a future backend. */
export interface StorageAdapter {
  get<T>(key: string): T | null
  set<T>(key: string, value: T): void
  remove(key: string): void
}

class LocalStorageAdapter implements StorageAdapter {
  private prefix: string

  constructor(prefix: string) {
    this.prefix = prefix
  }

  get<T>(key: string): T | null {
    try {
      const raw = window.localStorage.getItem(this.prefix + key)
      return raw === null ? null : (JSON.parse(raw) as T)
    } catch {
      return null
    }
  }

  set<T>(key: string, value: T): void {
    try {
      window.localStorage.setItem(this.prefix + key, JSON.stringify(value))
    } catch {
      // Quota exceeded / private mode — the app keeps working in-memory for the session.
    }
  }

  remove(key: string): void {
    try {
      window.localStorage.removeItem(this.prefix + key)
    } catch {
      /* ignore */
    }
  }
}

class MemoryStorageAdapter implements StorageAdapter {
  private map = new Map<string, string>()
  get<T>(key: string): T | null {
    const raw = this.map.get(key)
    return raw === undefined ? null : (JSON.parse(raw) as T)
  }
  set<T>(key: string, value: T): void {
    this.map.set(key, JSON.stringify(value))
  }
  remove(key: string): void {
    this.map.delete(key)
  }
}

function hasLocalStorage(): boolean {
  try {
    const k = '__bloom_probe__'
    window.localStorage.setItem(k, '1')
    window.localStorage.removeItem(k)
    return true
  } catch {
    return false
  }
}

export const storage: StorageAdapter =
  typeof window !== 'undefined' && hasLocalStorage() ? new LocalStorageAdapter('bloom:') : new MemoryStorageAdapter()
