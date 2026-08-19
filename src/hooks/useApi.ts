import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Minimal data-fetch lifecycle: real loading, error and retry states for
 * every API-backed surface (replaces the audit-flagged simulated delay).
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await fetcherRef.current())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'request_failed')
    } finally {
      setLoading(false)
    }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void load()
  }, [load])

  return { data, error, loading, reload: load, setData }
}
