import { useEffect, useState } from 'react'

/**
 * Holder skærmen tændt mens kogetilstand er aktiv.
 *
 * Wake Lock findes ikke i ældre Safari, og låsen slippes automatisk når fanen
 * skjules - derfor gentages anmodningen når man kommer tilbage. Fejler det,
 * fejler det stille: en skærm der slukker er en irritation, ikke en fejl.
 */
export function useWakeLock(active) {
  const [held, setHeld] = useState(false)

  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return

    let sentinel = null
    let cancelled = false

    const acquire = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        sentinel = await navigator.wakeLock.request('screen')
        if (cancelled) {
          sentinel.release()
          return
        }
        setHeld(true)
        sentinel.addEventListener('release', () => setHeld(false))
      } catch {
        setHeld(false)
      }
    }

    acquire()
    document.addEventListener('visibilitychange', acquire)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', acquire)
      sentinel?.release().catch(() => {})
      setHeld(false)
    }
  }, [active])

  return held
}
