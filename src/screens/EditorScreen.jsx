import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'

import { Frame, TopBar } from '../components/Chrome.jsx'
import { blankRecipe } from '../data/index.js'
import { useStore } from '../data/storeContext.js'
import { num, ordinal } from '../lib/format.js'

/**
 * Opret og ret i samme skærm. Forskellen er om der er et id i ruten.
 *
 * Formularen holder sin egen kladde og gemmer først når man trykker Gem.
 * Autosave ville være rart, men at rette en opskrift mens en anden læser den
 * midt i madlavningen er værre end at skulle trykke.
 */
export default function EditorScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const store = useStore()

  const existing = id ? store.get(id) : null
  const [draft, setDraft] = useState(() => toDraft(existing ?? blankRecipe()))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  if (id && store.status === 'loading') return <Frame />
  if (id && !existing) return <Navigate to="/" replace />

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))

  function setIngredient(index, patch) {
    setDraft((d) => ({
      ...d,
      ingredients: d.ingredients.map((row, i) =>
        i === index ? { ...row, ...patch } : row,
      ),
    }))
  }

  function setStep(index, text) {
    setDraft((d) => ({
      ...d,
      steps: d.steps.map((row, i) => (i === index ? { ...row, text } : row)),
    }))
  }

  /**
   * Sletning af en ingrediens flytter alle senere indeks. Trinnenes `ing`
   * peger på de indeks, så de skal skrives om — ellers viser kogetilstand
   * pludselig den forkerte mængde.
   */
  function removeIngredient(index) {
    setDraft((d) => ({
      ...d,
      ingredients: d.ingredients.filter((_, i) => i !== index),
      steps: d.steps.map((step) => ({
        ...step,
        ing: step.ing
          .filter((i) => i !== index)
          .map((i) => (i > index ? i - 1 : i)),
      })),
    }))
  }

  function removeStep(index) {
    setDraft((d) => ({ ...d, steps: d.steps.filter((_, i) => i !== index) }))
  }

  async function save() {
    const title = draft.title.trim()
    if (!title) {
      setError('Opskriften skal have en titel.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const payload = fromDraft({ ...draft, title })
      const saved = existing
        ? await store.update(existing.id, payload)
        : await store.create(payload)
      navigate(`/opskrift/${saved.id}`, { replace: true })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  async function remove() {
    if (!existing) return
    if (!confirm(`Slet "${existing.title}"? Det kan ikke fortrydes.`)) return
    setBusy(true)
    try {
      await store.remove(existing.id)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <Frame>
      <div className="screen">
        <TopBar
          onBack={() => navigate(-1)}
          backLabel="Annullér"
          title={existing ? 'Ret opskrift' : 'Ny opskrift'}
        >
          <button
            type="button"
            className="btn btn--bare"
            style={{ fontWeight: 700 }}
            onClick={save}
            disabled={busy}
          >
            Gem
          </button>
        </TopBar>

        <div
          className="screen__body"
          style={{
            background: 'var(--paper)',
            padding: 'var(--gutter) var(--gutter) 40px',
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
          }}
        >
          {error && (
            <p
              role="alert"
              style={{
                padding: '12px 14px',
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger-line)',
                color: 'var(--danger)',
                fontSize: 14,
              }}
            >
              {error}
            </p>
          )}

          <label className="field">
            <span className="field__label">Titel</span>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="Stegt flæsk med persillesovs"
              style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}
            />
          </label>

          <label className="field">
            <span className="field__label">Kort beskrivelse</span>
            <textarea
              rows={3}
              value={draft.description}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="Hvornår laver man den, og hvorfor?"
            />
          </label>

          <div className="field">
            <span className="field__label">Billede</span>
            <div
              className="thumb"
              style={{
                height: 120,
                border: '1px dashed var(--line-strong)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="thumb__label">Billeder kommer i næste omgang</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <NumberField
              label="Portioner"
              value={draft.servings}
              min={1}
              max={24}
              onChange={(v) => set({ servings: v })}
            />
            <NumberField
              label="Forb. min."
              value={draft.prep}
              min={0}
              onChange={(v) => set({ prep: v })}
            />
            <NumberField
              label="Tilb. min."
              value={draft.cook}
              min={0}
              onChange={(v) => set({ cook: v })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <NumberField
              label="Kcal pr. port."
              value={draft.kcal}
              min={0}
              onChange={(v) => set({ kcal: v })}
            />
            <NumberField
              label="Protein (g)"
              value={draft.protein}
              min={0}
              onChange={(v) => set({ protein: v })}
            />
          </div>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span className="field__label">Ingredienser</span>
            {draft.ingredients.map((row, index) => (
              <div
                key={index}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '68px 60px 1fr 46px',
                  gap: 6,
                  alignItems: 'center',
                }}
              >
                <input
                  type="text"
                  inputMode="decimal"
                  className="mono"
                  value={row.amount}
                  onChange={(e) => setIngredient(index, { amount: e.target.value })}
                  placeholder="400"
                  aria-label={`Mængde, ingrediens ${index + 1}`}
                  style={{ height: 50, padding: '0 8px', fontSize: 15 }}
                />
                <input
                  type="text"
                  className="mono"
                  value={row.unit}
                  onChange={(e) => setIngredient(index, { unit: e.target.value })}
                  placeholder="g"
                  aria-label={`Enhed, ingrediens ${index + 1}`}
                  style={{ height: 50, padding: '0 8px', fontSize: 15 }}
                />
                <input
                  type="text"
                  value={row.item}
                  onChange={(e) => setIngredient(index, { item: e.target.value })}
                  placeholder="hakket kylling"
                  aria-label={`Ingrediens ${index + 1}`}
                  style={{ height: 50, padding: '0 10px', fontSize: 16 }}
                />
                <button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  style={{
                    height: 50,
                    border: '1px solid var(--line)',
                    color: 'var(--danger)',
                    fontSize: 18,
                  }}
                >
                  <span aria-hidden="true">×</span>
                  <span className="sr-only">Fjern ingrediens {index + 1}</span>
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn--dashed"
              onClick={() =>
                set({ ingredients: [...draft.ingredients, { amount: '', unit: '', item: '' }] })
              }
            >
              + Tilføj ingrediens
            </button>
            <span className="hint">
              Lad mængden stå tom for “efter smag” — så skaleres den ikke med
              portionerne.
            </span>
          </section>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span className="field__label">Trin</span>
            {draft.steps.map((step, index) => (
              <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span
                  className="mono"
                  style={{ flex: 'none', width: 24, paddingTop: 14, fontSize: 15, color: 'var(--accent)' }}
                >
                  {ordinal(index)}
                </span>
                <textarea
                  rows={2}
                  value={step.text}
                  onChange={(e) => setStep(index, e.target.value)}
                  aria-label={`Trin ${index + 1}`}
                  placeholder="Hvad gør man?"
                  style={{ flex: 1, padding: '10px 12px', fontSize: 16, lineHeight: 1.5 }}
                />
                <button
                  type="button"
                  onClick={() => removeStep(index)}
                  style={{
                    flex: 'none',
                    height: 50,
                    width: 40,
                    border: '1px solid var(--line)',
                    color: 'var(--danger)',
                    fontSize: 18,
                  }}
                >
                  <span aria-hidden="true">×</span>
                  <span className="sr-only">Fjern trin {index + 1}</span>
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn--dashed"
              onClick={() => set({ steps: [...draft.steps, { text: '', ing: [] }] })}
            >
              + Tilføj trin
            </button>
          </section>

          <label className="field">
            <span className="field__label">Note</span>
            <textarea
              rows={2}
              value={draft.notes}
              onChange={(e) => set({ notes: e.target.value })}
              placeholder="Det man kun opdager anden gang man laver den."
            />
          </label>

          <label className="field">
            <span className="field__label">Tags</span>
            <input
              type="text"
              className="mono"
              value={draft.tagString}
              onChange={(e) => set({ tagString: e.target.value })}
              placeholder="hverdag, gryderet"
              style={{ fontSize: 15 }}
            />
            <span className="hint">Adskilt med komma.</span>
          </label>

          {existing && (
            <button
              type="button"
              className="btn btn--danger"
              style={{ minHeight: 54 }}
              onClick={remove}
              disabled={busy}
            >
              Slet opskrift
            </button>
          )}
        </div>
      </div>
    </Frame>
  )
}

function NumberField({ label, value, min, max, onChange }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value ?? ''}
        onChange={(e) => {
          const raw = e.target.value
          onChange(raw === '' ? null : Number(raw))
        }}
        className="mono"
        style={{ height: 54, padding: '0 12px', fontSize: 17 }}
      />
    </label>
  )
}

/**
 * Mængder redigeres som tekst, ikke som tal. Man skal kunne skrive "1,5" og
 * kunne lade feltet stå tomt undervejs uden at det bliver til 0.
 */
function toDraft(recipe) {
  return {
    ...recipe,
    ingredients: recipe.ingredients.map((i) => ({
      amount: i.amount == null ? '' : num(i.amount),
      unit: i.unit ?? '',
      item: i.item ?? '',
    })),
    steps: recipe.steps.map((s) => ({ text: s.text, ing: s.ing ?? [] })),
    tagString: (recipe.tags ?? []).join(', '),
  }
}

function fromDraft(draft) {
  const { tagString, ...rest } = draft
  return {
    ...rest,
    tags: tagString
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    ingredients: draft.ingredients
      .filter((i) => i.item.trim())
      .map((i) => ({
        amount: parseAmount(i.amount),
        unit: i.unit.trim(),
        item: i.item.trim(),
      })),
    steps: draft.steps
      .filter((s) => s.text.trim())
      .map((s) => ({ text: s.text.trim(), ing: s.ing })),
  }
}

/** "1,5" og "1.5" er begge et og et halvt. Tomt er "efter smag". */
function parseAmount(raw) {
  const cleaned = String(raw).trim().replace(',', '.')
  if (!cleaned) return null
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : null
}
