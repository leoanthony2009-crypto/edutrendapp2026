/**
 * Local-first storage layer. Every piece of app persistence goes through this
 * adapter so the backing store can be swapped for a real API later without
 * touching screens or services (see PASTORAL_PULSE_SPEC § stack assumptions).
 */
export interface StorageAdapter {
  get<T>(key: string, fallback: T): T
  set<T>(key: string, value: T): void
  remove(key: string): void
  clear(): void
}

const PREFIX = 'bloom:v1:'

function memoryStore(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => void map.delete(k),
    setItem: (k, v) => void map.set(k, String(v)),
  }
}

function resolveBackend(): Storage {
  try {
    const probe = `${PREFIX}__probe__`
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return window.localStorage
  } catch {
    // Private mode / storage disabled — degrade to in-memory for the session.
    return memoryStore()
  }
}

export function createLocalStorageAdapter(backend: Storage = resolveBackend()): StorageAdapter {
  return {
    get<T>(key: string, fallback: T): T {
      try {
        const raw = backend.getItem(PREFIX + key)
        if (raw === null) return fallback
        return JSON.parse(raw) as T
      } catch {
        return fallback
      }
    },
    set<T>(key: string, value: T): void {
      try {
        backend.setItem(PREFIX + key, JSON.stringify(value))
      } catch {
        // Quota exceeded or disabled — the app keeps working from memory/state.
      }
    },
    remove(key: string): void {
      try {
        backend.removeItem(PREFIX + key)
      } catch {
        /* ignore */
      }
    },
    clear(): void {
      try {
        for (let i = backend.length - 1; i >= 0; i--) {
          const k = backend.key(i)
          if (k?.startsWith(PREFIX)) backend.removeItem(k)
        }
      } catch {
        /* ignore */
      }
    },
  }
}

export const storage: StorageAdapter = createLocalStorageAdapter()
