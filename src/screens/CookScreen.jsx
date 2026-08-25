import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'

import { useStore } from '../data/storeContext.js'
import { clock } from '../lib/format.js'
import { scaleIngredient } from '../lib/scale.js'
import { useWakeLock } from '../lib/useWakeLock.js'

const TIMER_SECONDS = 5 * 60

/**
 * Kogetilstand. Ét trin ad gangen, mørk baggrund, stor skrift — den skal
 * kunne læses fra den anden side af køkkenbordet.
 *
 * Skærmen ligger uden for <Frame>: den fylder hele visningen, også på
 * desktop, fordi den ikke er en side man kigger på men et redskab man bruger.
 */
export default function CookScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const store = useStore()

  const recipe = store.get(id)
  const servings = location.state?.servings ?? recipe?.servings ?? 1

  const [index, setIndex] = useState(0)
  const [left, setLeft] = useState(TIMER_SECONDS)
  const [running, setRunning] = useState(false)
  const tick = useRef(null)

  const held = useWakeLock(true)

  // Body er lys overalt ellers. Uden dette blinker lærredet frem når man
  // trækker for langt ned på en telefon - midt i en mørk skærm.
  useEffect(() => {
    const previous = document.body.style.background
    document.body.style.background = 'var(--night)'
    return () => {
      document.body.style.background = previous
    }
  }, [])

  useEffect(() => {
    if (!running) return
    tick.current = setInterval(() => {
      setLeft((seconds) => {
        if (seconds <= 1) {
          clearInterval(tick.current)
          setRunning(false)
          return 0
        }
        return seconds - 1
      })
    }, 1000)
    return () => clearInterval(tick.current)
  }, [running])

  if (store.status === 'loading') return null
  if (!recipe || recipe.steps.length === 0) {
    return <Navigate to={`/opskrift/${id}`} replace />
  }

  const step = recipe.steps[Math.min(index, recipe.steps.length - 1)]
  const last = index === recipe.steps.length - 1

  const stop = () => navigate(`/opskrift/${recipe.id}`)

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        background: 'var(--night)',
        color: 'var(--night-ink)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: 'calc(36px + env(safe-area-inset-top)) 16px 0',
        }}
      >
        <span
          className="mono"
          aria-live="polite"
          style={{ fontSize: 13, letterSpacing: '0.08em', color: 'var(--night-ink-3)' }}
        >
          Trin {index + 1} af {recipe.steps.length}
        </span>
        <span className="spacer" />
        {held && (
          <span
            className="mono"
            style={{ fontSize: 11, letterSpacing: '0.06em', color: 'var(--night-ink-4)' }}
          >
            Skærmen holdes tændt
          </span>
        )}
        <button
          type="button"
          onClick={stop}
          style={{
            height: 44,
            padding: '0 12px',
            border: '1px solid var(--night-line)',
            color: 'var(--night-ink)',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Luk
        </button>
      </div>

      <div style={{ display: 'flex', gap: 4, padding: '14px 16px 0' }} aria-hidden="true">
        {recipe.steps.map((_, i) => (
          <span
            key={i}
            style={{
              flex: 1,
              height: 4,
              background: i <= index ? 'var(--night-accent)' : 'var(--night-2)',
            }}
          />
        ))}
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '24px 22px',
          overflowY: 'auto',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 34,
            lineHeight: 1.22,
            letterSpacing: '-0.005em',
            textWrap: 'pretty',
          }}
        >
          {step.text}
        </p>

        {step.ing.length > 0 && (
          <div
            style={{
              marginTop: 28,
              paddingTop: 18,
              borderTop: '1px solid var(--night-line)',
            }}
          >
            <p
              className="eyebrow"
              style={{ color: 'var(--night-ink-3)' }}
            >
              Til dette trin
            </p>
            <ul
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                marginTop: 12,
                listStyle: 'none',
              }}
            >
              {step.ing.map((i) => {
                const ingredient = recipe.ingredients[i]
                if (!ingredient) return null
                return (
                  <li key={i} style={{ display: 'flex', gap: 12, fontSize: 19, lineHeight: 1.35 }}>
                    <span
                      className="mono"
                      style={{ flex: 'none', width: 84, fontSize: 17, color: 'var(--night-accent)' }}
                    >
                      {scaleIngredient(ingredient, recipe.servings, servings)}
                    </span>
                    <span style={{ flex: 1, color: 'var(--night-ink-2)' }}>
                      {ingredient.item}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 26 }}>
          <span className="mono" style={{ fontSize: 30 }} aria-live="off">
            {clock(left)}
          </span>
          <button
            type="button"
            onClick={() => setRunning((on) => !on)}
            style={{
              height: 50,
              padding: '0 18px',
              border: '1px solid var(--night-accent)',
              color: 'var(--night-accent)',
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            {running ? 'Pause' : 'Start 5 min'}
          </button>
          {(running || left < TIMER_SECONDS) && (
            <button
              type="button"
              onClick={() => {
                setRunning(false)
                setLeft(TIMER_SECONDS)
              }}
              style={{ height: 50, padding: '0 12px', color: 'var(--night-ink-4)', fontSize: 15 }}
            >
              Nulstil
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          padding: '0 16px calc(24px + env(safe-area-inset-bottom))',
        }}
      >
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          style={{
            flex: 1,
            height: 68,
            border: '1px solid var(--night-line)',
            color: index === 0 ? 'var(--ink-4)' : 'var(--night-ink)',
            fontSize: 17,
            fontWeight: 600,
          }}
        >
          Forrige
        </button>
        <button
          type="button"
          onClick={() => (last ? stop() : setIndex((i) => i + 1))}
          style={{
            flex: 2,
            height: 68,
            background: last ? 'var(--night-accent)' : 'var(--accent)',
            color: last ? 'var(--night)' : 'var(--surface)',
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          {last ? 'Færdig' : 'Næste trin'}
        </button>
      </div>
    </div>
  )
}
