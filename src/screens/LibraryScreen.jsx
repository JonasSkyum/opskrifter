import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import {
  ErrorNotice,
  Frame,
  Photo,
  SectionLabel,
  TabBar,
} from '../components/Chrome.jsx'
import { useStore } from '../data/storeContext.js'
import { byTitle, greeting, metaLine, totalMinutes } from '../lib/format.js'
import { pickOfTheDay } from '../lib/pick.js'

const FILTERS = [
  { key: 'mine', label: 'Mine' },
  { key: 'delt', label: 'Delt med mig' },
  { key: 'fav', label: 'Favoritter' },
  { key: 'hurtig', label: 'Under 30 min' },
  { key: 'vegetarisk', label: 'Vegetarisk' },
  { key: 'bagværk', label: 'Bagværk' },
]

export default function LibraryScreen() {
  const store = useStore()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [query, setQuery] = useState('')
  const [active, setActive] = useState([])

  // ?imagery=none viser tekst-først-varianten. Bruges til at vurdere designet
  // inden billeder er implementeret - se docs/PLAN.md, fase 4.
  const withImages = params.get('imagery') !== 'none'
  const forcedError = params.get('demo') === 'error'

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return store.recipes
      .filter((recipe) => {
        if (active.includes('mine') && !recipe.mine) return false
        if (active.includes('delt') && recipe.mine) return false
        if (active.includes('fav') && !store.isFavorite(recipe.id)) return false
        if (active.includes('hurtig') && totalMinutes(recipe) > 30) return false
        if (active.includes('vegetarisk') && !recipe.tags.includes('vegetarisk'))
          return false
        if (active.includes('bagværk') && !recipe.tags.includes('bagværk'))
          return false
        if (!needle) return true

        const haystack = [
          recipe.title,
          recipe.description,
          recipe.tags.join(' '),
          recipe.ingredients.map((i) => i.item).join(' '),
        ]
          .join(' ')
          .toLowerCase()
        return haystack.includes(needle)
      })
      .sort(byTitle)
  }, [store, query, active])

  const failed = forcedError || store.status === 'error'
  const featured = pickOfTheDay(matches)
  const rest = matches.filter((r) => r.id !== featured?.id)
  const mine = rest.filter((r) => r.mine)
  const others = rest.filter((r) => !r.mine)

  function toggleFilter(key) {
    setActive((current) =>
      current.includes(key)
        ? current.filter((k) => k !== key)
        : [...current, key],
    )
  }

  function surprise() {
    if (!matches.length) return
    const pick = matches[Math.floor(Math.random() * matches.length)]
    navigate(`/opskrift/${pick.id}`)
  }

  return (
    <Frame>
      <div className="screen">
        <div
          style={{
            padding: 'calc(44px + env(safe-area-inset-top)) var(--gutter) 14px',
            background: 'var(--surface)',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <p className="eyebrow">{greeting()}</p>
              <h1 className="display" style={{ fontSize: 32, marginTop: 4 }}>
                Hvad skal vi lave?
              </h1>
            </div>
            <button
              type="button"
              onClick={surprise}
              disabled={!matches.length}
              style={{
                flex: 'none',
                width: 62,
                height: 62,
                border: '1px solid var(--accent)',
                borderRadius: '50%',
                color: 'var(--accent)',
                fontSize: 11,
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Over&shy;rask
            </button>
          </div>

          <label>
            <span className="sr-only">Søg i opskrifter</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Søg i titler, tags, ingredienser"
              style={{ width: '100%', height: 50, marginTop: 16, padding: '0 14px' }}
            />
          </label>

          <div className="chips">
            {FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                className="chip"
                aria-pressed={active.includes(filter.key)}
                onClick={() => toggleFilter(filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="screen__body">
          {failed && <ErrorNotice onRetry={store.reload} />}

          {!failed && store.status === 'ready' && matches.length === 0 && (
            <div className="empty">
              <p className="display" style={{ fontSize: 22 }}>
                Ingen opskrifter matcher
              </p>
              <p className="empty__body">
                Prøv et kortere søgeord, eller ryd filtrene.
              </p>
              <button
                type="button"
                className="btn btn--accent-outline"
                onClick={() => {
                  setActive([])
                  setQuery('')
                }}
              >
                Ryd filtre
              </button>
            </div>
          )}

          {!failed && featured && (
            <Featured
              recipe={featured}
              withImages={withImages}
              onOpen={() => navigate(`/opskrift/${featured.id}`)}
            />
          )}

          {!failed && mine.length > 0 && (
            <Group
              label="Min samling"
              items={mine}
              withImages={withImages}
              store={store}
              navigate={navigate}
            />
          )}

          {!failed && others.length > 0 && (
            <Group
              label="Fra de andre"
              items={others}
              withImages={withImages}
              store={store}
              navigate={navigate}
            />
          )}

          <div style={{ height: 24 }} />
        </div>

        <TabBar />
      </div>
    </Frame>
  )
}

/** Dagens forslag. Samme opskrift som resten, bare vist stort. */
function Featured({ recipe, withImages, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: 0,
        background: 'var(--paper)',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <p className="eyebrow" style={{ padding: '16px var(--gutter) 0', color: 'var(--accent)' }}>
        Forslag i dag
      </p>
      {withImages && (
        <div style={{ margin: '12px var(--gutter) 0' }}>
          <Photo label={recipe.imageLabel} height={190} />
        </div>
      )}
      <div style={{ padding: '14px var(--gutter) var(--gutter)' }}>
        <span className="display" style={{ display: 'block', fontSize: 29, lineHeight: 1.12 }}>
          {recipe.title}
        </span>
        <span
          style={{
            display: 'block',
            fontSize: 15,
            lineHeight: 1.55,
            color: 'var(--ink-3)',
            marginTop: 8,
            textWrap: 'pretty',
          }}
        >
          {recipe.description}
        </span>
        <span
          className="mono"
          style={{ display: 'block', fontSize: 12, color: 'var(--ink-4)', marginTop: 12 }}
        >
          {totalMinutes(recipe)} min · {recipe.servings} pers. · {recipe.ownerName}
        </span>
      </div>
    </button>
  )
}

function Group({ label, items, withImages, store, navigate }) {
  return (
    <section>
      <SectionLabel trailing={`${items.length} stk.`}>{label}</SectionLabel>
      {items.map((recipe) => (
        <button
          key={recipe.id}
          type="button"
          onClick={() => navigate(`/opskrift/${recipe.id}`)}
          style={{
            display: 'flex',
            gap: 14,
            alignItems: 'center',
            width: '100%',
            minHeight: 76,
            textAlign: 'left',
            padding: '12px var(--gutter)',
            borderTop: '1px solid var(--line-soft)',
          }}
        >
          {withImages && <span className="thumb thumb--sm" />}
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="display" style={{ display: 'block', fontSize: 20, lineHeight: 1.2 }}>
              {recipe.title}
            </span>
            <span
              className="mono"
              style={{ display: 'block', fontSize: 12, color: 'var(--ink-4)', marginTop: 4 }}
            >
              {metaLine(recipe)}
            </span>
          </span>
          <span
            aria-hidden="true"
            style={{
              flex: 'none',
              fontSize: 18,
              color: store.isFavorite(recipe.id) ? 'var(--accent)' : 'var(--line-mid)',
            }}
          >
            {store.isFavorite(recipe.id) ? '★' : '☆'}
          </span>
        </button>
      ))}
    </section>
  )
}
