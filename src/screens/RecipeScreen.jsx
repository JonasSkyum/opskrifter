import { useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { Frame, Photo, TabBar, TopBar } from '../components/Chrome.jsx'
import { useStore } from '../data/storeContext.js'
import { ordinal } from '../lib/format.js'
import { clampServings, scaleIngredient } from '../lib/scale.js'

export default function RecipeScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const store = useStore()
  const [params] = useSearchParams()

  const recipe = store.get(id)

  // Portionsantal og afkrydsning hører til besøget, ikke til opskriften.
  // De nulstilles bevidst når man forlader skærmen.
  const [servings, setServings] = useState(null)
  const [checked, setChecked] = useState([])

  if (store.status === 'loading') return <Frame />
  if (!recipe) return <Navigate to="/" replace />

  const withImages = params.get('imagery') !== 'none'
  const current = servings ?? recipe.servings
  const favorite = store.isFavorite(recipe.id)

  function toggleChecked(index) {
    setChecked((all) =>
      all.includes(index) ? all.filter((i) => i !== index) : [...all, index],
    )
  }

  return (
    <Frame>
      <div className="screen">
        <TopBar onBack={() => navigate('/')}>
          <button
            type="button"
            onClick={() => store.toggleFavorite(recipe.id)}
            aria-pressed={favorite}
            style={{ width: 48, height: 48, fontSize: 20, color: 'var(--accent)' }}
          >
            <span aria-hidden="true">{favorite ? '★' : '☆'}</span>
            <span className="sr-only">
              {favorite ? 'Fjern fra favoritter' : 'Gem som favorit'}
            </span>
          </button>
          <button
            type="button"
            className="btn btn--bare"
            onClick={() => navigate(`/opskrift/${recipe.id}/deling`)}
          >
            Del
          </button>
          {recipe.mine && (
            <button
              type="button"
              className="btn btn--bare"
              onClick={() => navigate(`/opskrift/${recipe.id}/ret`)}
            >
              Ret
            </button>
          )}
        </TopBar>

        <div className="screen__body" style={{ background: 'var(--paper)' }}>
          {withImages && (
            <Photo label={recipe.imageLabel} height={210} />
          )}

          <header style={{ padding: '22px var(--gutter) 0' }}>
            <p className="eyebrow">
              {recipe.mine ? 'Min opskrift' : `Fra ${recipe.ownerName}`}
            </p>
            <h1 style={{ fontSize: 38, lineHeight: 1.08, margin: '8px 0 0' }}>
              {recipe.title}
            </h1>
            {recipe.description && (
              <p
                style={{
                  fontSize: 16,
                  lineHeight: 1.6,
                  color: 'var(--ink-2)',
                  margin: '12px 0 0',
                  textWrap: 'pretty',
                }}
              >
                {recipe.description}
              </p>
            )}

            {recipe.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
                {recipe.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div
              className="mono"
              style={{
                display: 'flex',
                gap: 18,
                marginTop: 18,
                padding: '14px 0',
                borderTop: '1px solid var(--line-soft)',
                borderBottom: '1px solid var(--line-soft)',
                fontSize: 13,
                color: 'var(--ink-2)',
              }}
            >
              <span>
                {recipe.prep} + {recipe.cook} min
              </span>
              {recipe.kcal != null && <span>{recipe.kcal} kcal</span>}
              {recipe.protein != null && <span>{recipe.protein} g protein</span>}
            </div>
          </header>

          <section style={{ padding: '24px var(--gutter) 0' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <h2 style={{ fontSize: 24 }}>Ingredienser</h2>
              <Stepper
                value={current}
                onChange={(next) => setServings(clampServings(next))}
              />
            </div>

            <ul style={{ marginTop: 12, listStyle: 'none' }}>
              {recipe.ingredients.map((ingredient, index) => {
                const done = checked.includes(index)
                return (
                  <li key={index}>
                    <button
                      type="button"
                      onClick={() => toggleChecked(index)}
                      aria-pressed={done}
                      style={{
                        display: 'flex',
                        gap: 12,
                        alignItems: 'baseline',
                        width: '100%',
                        minHeight: 52,
                        padding: '12px 0',
                        borderBottom: '1px solid var(--line-softer)',
                        opacity: done ? 0.42 : 1,
                        textDecoration: done ? 'line-through' : 'none',
                      }}
                    >
                      <span
                        className="mono"
                        style={{
                          flex: 'none',
                          width: 84,
                          fontSize: 15,
                          color: 'var(--accent)',
                          textAlign: 'left',
                        }}
                      >
                        {scaleIngredient(ingredient, recipe.servings, current)}
                      </span>
                      <span style={{ flex: 1, fontSize: 17, lineHeight: 1.4, textAlign: 'left' }}>
                        {ingredient.item}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>

          <section style={{ padding: '28px var(--gutter) 0' }}>
            <h2 style={{ fontSize: 24 }}>Sådan gør du</h2>
            <ol
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
                marginTop: 14,
                listStyle: 'none',
              }}
            >
              {recipe.steps.map((step, index) => (
                <li key={index} style={{ display: 'flex', gap: 14 }}>
                  <span
                    className="mono"
                    style={{
                      flex: 'none',
                      width: 28,
                      fontSize: 15,
                      color: 'var(--accent)',
                      paddingTop: 2,
                    }}
                  >
                    {ordinal(index)}
                  </span>
                  <span style={{ flex: 1, fontSize: 17, lineHeight: 1.6, textWrap: 'pretty' }}>
                    {step.text}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          {recipe.notes && (
            <aside
              style={{
                margin: '28px var(--gutter) 0',
                padding: 16,
                background: 'var(--surface-2)',
                borderLeft: '3px solid var(--accent)',
              }}
            >
              <p className="eyebrow" style={{ color: 'var(--accent)' }}>
                Note
              </p>
              <p style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--ink-2)', marginTop: 6 }}>
                {recipe.notes}
              </p>
            </aside>
          )}

          <div style={{ height: 40 }} />
        </div>

        <div className="screen__foot">
          <button
            type="button"
            className="btn btn--primary btn--tall"
            onClick={() =>
              navigate(`/opskrift/${recipe.id}/kog`, { state: { servings: current } })
            }
            disabled={recipe.steps.length === 0}
          >
            Start kogetilstand
          </button>
        </div>

        <TabBar />
      </div>
    </Frame>
  )
}

/** − / antal / +. Bevidst store flader; man trykker med en våd finger. */
function Stepper({ value, onChange }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        border: '1px solid var(--line-strong)',
        background: 'var(--surface)',
      }}
    >
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        style={{ width: 46, height: 46, fontSize: 22 }}
      >
        <span aria-hidden="true">−</span>
        <span className="sr-only">Færre portioner</span>
      </button>
      <span
        className="mono"
        aria-live="polite"
        style={{ minWidth: 76, textAlign: 'center', fontSize: 14 }}
      >
        {value} portioner
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        style={{ width: 46, height: 46, fontSize: 22 }}
      >
        <span aria-hidden="true">+</span>
        <span className="sr-only">Flere portioner</span>
      </button>
    </div>
  )
}
