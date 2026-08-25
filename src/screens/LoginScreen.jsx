import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/authContext.js'
import { Frame } from '../components/Chrome.jsx'
import { isDemo } from '../data/index.js'

export default function LoginScreen() {
  const { signIn, signUp, signedIn, ready } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState('login') // login | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const isSignup = mode === 'signup'

  if (ready && signedIn) return <Navigate to="/" replace />

  async function submit(event) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (isSignup) await signUp(email, password, code)
      else await signIn(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Frame>
      <form
        onSubmit={submit}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: 'calc(56px + env(safe-area-inset-top)) 24px 28px',
          overflowY: 'auto',
        }}
      >
        <h1 className="display" style={{ fontSize: 40, lineHeight: 1.05 }}>
          Opskrifter
        </h1>
        <p className="eyebrow" style={{ marginTop: 10 }}>
          Kun for os
        </p>

        <div className="stack" style={{ marginTop: 40 }}>
          <label className="field">
            <span className="field__label">E-mail</span>
            <input
              type="email"
              autoComplete="email"
              required
              placeholder="din@mail.dk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field__label">Adgangskode</span>
            <input
              type="password"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {isSignup && (
            <label className="field">
              <span className="field__label">Invitationskode</span>
              <input
                type="text"
                className="mono"
                required
                autoCapitalize="characters"
                placeholder="KØKKEN-2026"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <span className="hint">
                Du kan kun oprette en bruger med en kode fra en du kender.
              </span>
            </label>
          )}

          {error && (
            <p
              role="alert"
              style={{
                padding: '12px 14px',
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger-line)',
                color: 'var(--danger)',
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn--primary"
            style={{ marginTop: 8 }}
            disabled={busy}
          >
            {busy ? 'Et øjeblik…' : isSignup ? 'Opret bruger' : 'Log ind'}
          </button>

          <button
            type="button"
            className="btn btn--outline"
            style={{ minHeight: 50 }}
            onClick={() => {
              setMode(isSignup ? 'login' : 'signup')
              setError(null)
            }}
          >
            {isSignup ? 'Jeg har allerede en bruger' : 'Jeg har en invitationskode'}
          </button>
        </div>

        <div className="spacer" style={{ minHeight: 24 }} />

        {isDemo ? (
          <p className="hint">
            Der er ingen backend forbundet. Appen kører på demodata i din
            browser — log ind med hvad som helst.
          </p>
        ) : (
          <a href="#" style={{ fontSize: 14, alignSelf: 'flex-start' }}>
            Glemt adgangskode?
          </a>
        )}
      </form>
    </Frame>
  )
}
