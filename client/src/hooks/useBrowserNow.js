import { useEffect, useState } from 'react'

/**
 * Tracks the current browser time, refreshed on an interval so due-date
 * comparisons stay aligned with the user's local clock.
 */
export function useBrowserNow(intervalMs = 60_000) {
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const tick = () => setNowMs(Date.now())
    tick()
    const id = setInterval(tick, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return nowMs
}
