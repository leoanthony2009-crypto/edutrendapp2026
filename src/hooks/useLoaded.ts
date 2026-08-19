import { useEffect, useState } from 'react'

/**
 * Brief simulated load so every data surface exercises its skeleton state
 * (AUDIT_BRIEF acceptance gate). When the real API lands, replace the timer
 * with the fetch lifecycle; the skeleton/error components already exist.
 */
export function useLoaded(delay = 350): boolean {
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setLoaded(true), delay)
    return () => window.clearTimeout(t)
  }, [delay])
  return loaded
}
