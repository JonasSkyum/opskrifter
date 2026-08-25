import { NavLink } from 'react-router-dom'

/** Yderrammen. På desktop er den en 390px flade, på telefon hele skærmen. */
export function Frame({ children }) {
  return <div className="app">{children}</div>
}

/** Overskriftsrække med tilbage-knap og valgfrie handlinger til højre. */
export function TopBar({ onBack, backLabel = '← Tilbage', title, children }) {
  return (
    <div className="topbar">
      {onBack && (
        <button type="button" className="btn btn--bare" onClick={onBack}>
          {backLabel}
        </button>
      )}
      {title ? <span className="topbar__title">{title}</span> : <span className="spacer" />}
      {children}
    </div>
  )
}

/** Mono-versaletiket med en hårfin streg ud til kanten. */
export function SectionLabel({ children, trailing }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 10,
        padding: '22px var(--gutter) 8px',
      }}
    >
      <span className="eyebrow" style={{ color: 'var(--ink-2)' }}>
        {children}
      </span>
      <span className="rule" />
      {trailing && (
        <span className="eyebrow" style={{ color: 'var(--ink-5)' }}>
          {trailing}
        </span>
      )}
    </div>
  )
}

/**
 * Skravering hvor et foto hører hjemme.
 *
 * Returnerer null når opskriften hverken har billede eller etiket: en tom
 * skraveret blok på 190px lover noget der ikke findes.
 */
export function Photo({ label, height = 210, className = '' }) {
  if (!label) return null
  return (
    <div className={`thumb ${className}`} style={{ height }}>
      <span className="thumb__label">{label}</span>
    </div>
  )
}

const TABS = [
  { to: '/', label: 'Bibliotek', end: true },
  { to: '/ny', label: 'Ny opskrift' },
]

export function TabBar() {
  return (
    <nav className="tabbar">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className="tabbar__tab"
          style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}

/** Fejl der eksplicit skelner mellem "gik galt" og "der er ingenting". */
export function ErrorNotice({ onRetry }) {
  return (
    <div className="notice">
      <div className="notice__title">Kunne ikke hente opskrifter</div>
      <div className="notice__body">
        Der er ingen forbindelse til databasen lige nu. Det er ikke fordi
        samlingen er tom.
      </div>
      {onRetry && (
        <button type="button" className="btn" onClick={onRetry}>
          Prøv igen
        </button>
      )}
    </div>
  )
}
