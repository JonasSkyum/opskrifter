import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'

import { Frame, TopBar } from '../components/Chrome.jsx'
import { data } from '../data/index.js'
import { useStore } from '../data/storeContext.js'

const VISIBILITY = [
  {
    key: 'private',
    label: 'Kun mig',
    hint: 'Ligger i din egen samling. Du kan stadig dele den med enkelte herunder.',
  },
  {
    key: 'public',
    label: 'Alle i appen',
    hint: 'Synlig for alle med en invitationskode — altså os.',
  },
]

export default function ShareScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const store = useStore()

  const recipe = store.get(id)

  const [people, setPeople] = useState([])
  const [shares, setShares] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let live = true
    Promise.all([data.people(), data.sharesFor(id)])
      .then(([list, current]) => {
        if (!live) return
        setPeople(list)
        setShares(current)
        setLoaded(true)
      })
      .catch(() => live && setLoaded(true))
    return () => {
      live = false
    }
  }, [id])

  if (store.status === 'loading') return <Frame />
  if (!recipe) return <Navigate to="/" replace />

  // Kun ejeren bestemmer hvem der må se. Andre kan kigge, ikke røre.
  const editable = recipe.mine

  function setVisibility(value) {
    if (!editable) return
    store.update(recipe.id, { ...recipe, visibility: value })
  }

  function togglePerson(personId) {
    if (!editable) return
    const next = shares.includes(personId)
      ? shares.filter((p) => p !== personId)
      : [...shares, personId]
    setShares(next)
    data.setShares(recipe.id, next)
  }

  return (
    <Frame>
      <div className="screen">
        <TopBar onBack={() => navigate(`/opskrift/${recipe.id}`)} title="Deling" />

        <div
          className="screen__body"
          style={{ background: 'var(--paper)', padding: '22px var(--gutter) 40px' }}
        >
          <h1 className="display" style={{ fontSize: 26, lineHeight: 1.15 }}>
            {recipe.title}
          </h1>

          {!editable && (
            <p className="hint" style={{ marginTop: 12 }}>
              Opskriften er {recipe.ownerName}s. Det er kun {recipe.ownerName} der
              kan ændre hvem den deles med.
            </p>
          )}

          <section style={{ marginTop: 24 }}>
            <p className="eyebrow">Synlighed</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              {VISIBILITY.map((option) => {
                const on = recipe.visibility === option.key
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setVisibility(option.key)}
                    disabled={!editable}
                    aria-pressed={on}
                    style={{
                      display: 'flex',
                      gap: 14,
                      alignItems: 'flex-start',
                      width: '100%',
                      padding: 16,
                      background: on ? 'var(--surface-3)' : 'transparent',
                      border: `1px solid ${on ? 'var(--accent)' : 'var(--line)'}`,
                      cursor: editable ? 'pointer' : 'default',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        flex: 'none',
                        width: 22,
                        height: 22,
                        marginTop: 2,
                        borderRadius: '50%',
                        border: `2px solid ${on ? 'var(--accent)' : 'var(--line-strong)'}`,
                        background: on
                          ? 'radial-gradient(circle, var(--accent) 0 5px, transparent 6px)'
                          : 'transparent',
                      }}
                    />
                    <span style={{ flex: 1, textAlign: 'left' }}>
                      <span style={{ display: 'block', fontSize: 17, fontWeight: 600 }}>
                        {option.label}
                      </span>
                      <span
                        style={{
                          display: 'block',
                          fontSize: 14,
                          lineHeight: 1.5,
                          color: 'var(--ink-3)',
                          marginTop: 3,
                        }}
                      >
                        {option.hint}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <section style={{ marginTop: 30 }}>
            <p className="eyebrow">Delt med</p>

            {!loaded && <p className="hint" style={{ marginTop: 10 }}>Henter…</p>}

            {loaded && people.length === 0 && (
              <p className="hint" style={{ marginTop: 10 }}>
                Der er ikke andre brugere endnu. Send en invitationskode.
              </p>
            )}

            {loaded && people.length > 0 && (
              <div style={{ marginTop: 10, borderTop: '1px solid var(--line-soft)' }}>
                {people.map((person) => {
                  const on = shares.includes(person.id)
                  return (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => togglePerson(person.id)}
                      disabled={!editable}
                      aria-pressed={on}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        width: '100%',
                        minHeight: 64,
                        padding: '10px 4px',
                        borderBottom: '1px solid var(--line-soft)',
                        cursor: editable ? 'pointer' : 'default',
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          flex: 'none',
                          display: 'grid',
                          placeItems: 'center',
                          width: 30,
                          height: 30,
                          fontSize: 17,
                          fontWeight: 700,
                          border: `1px solid ${on ? 'var(--accent)' : 'var(--line-strong)'}`,
                          background: on ? 'var(--accent)' : 'var(--paper)',
                          color: 'var(--surface)',
                        }}
                      >
                        {on ? '✓' : ''}
                      </span>
                      <span style={{ flex: 1, textAlign: 'left', fontSize: 18 }}>
                        {person.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            <p className="hint" style={{ marginTop: 12 }}>
              {shares.length
                ? `Delt med ${shares.length}. De kan læse opskriften, men ikke rette i den.`
                : 'Ikke delt med nogen endnu.'}
            </p>
          </section>
        </div>
      </div>
    </Frame>
  )
}
