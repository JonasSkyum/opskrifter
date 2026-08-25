import {
  PEOPLE,
  SEED_FAVORITES,
  SEED_RECIPES,
  SEED_SHARES,
} from './seed.js'

/**
 * localStorage-adapter. Kører appen uden backend - til udvikling, til demo,
 * og som det appen falder tilbage på når Supabase-nøglerne mangler.
 *
 * Den deler ikke noget på tværs af enheder. Det er meningen.
 */

const KEY = 'opskrifter.v1'
const ME = 'p-mig'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // Ødelagt eller utilgængelig lagring: start forfra frem for at gå ned.
  }
  return {
    recipes: SEED_RECIPES,
    favorites: SEED_FAVORITES,
    shares: SEED_SHARES,
  }
}

function save(db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    // Privat browsing eller fuld kvote. Ændringen lever i hukommelsen.
  }
}

let db = load()

function nextId() {
  return `r${Date.now().toString(36)}`
}

/** Adapteren er async fordi Supabase-adapteren er det. Samme kontrakt. */
export const localData = {
  async list() {
    return db.recipes.slice()
  },

  async get(id) {
    return db.recipes.find((r) => r.id === id) ?? null
  },

  async create(draft) {
    const me = PEOPLE.find((p) => p.id === ME)
    const recipe = {
      ...draft,
      id: nextId(),
      ownerId: ME,
      ownerName: me.name,
      mine: true,
    }
    db = { ...db, recipes: [...db.recipes, recipe] }
    save(db)
    return recipe
  },

  async update(id, patch) {
    let updated = null
    db = {
      ...db,
      recipes: db.recipes.map((r) => {
        if (r.id !== id) return r
        updated = { ...r, ...patch, id: r.id }
        return updated
      }),
    }
    save(db)
    return updated
  },

  async remove(id) {
    const { [id]: _dropped, ...shares } = db.shares
    db = {
      ...db,
      recipes: db.recipes.filter((r) => r.id !== id),
      favorites: db.favorites.filter((f) => f !== id),
      shares,
    }
    save(db)
  },

  async favorites() {
    return db.favorites.slice()
  },

  async toggleFavorite(id) {
    const has = db.favorites.includes(id)
    db = {
      ...db,
      favorites: has
        ? db.favorites.filter((f) => f !== id)
        : [...db.favorites, id],
    }
    save(db)
    return db.favorites.slice()
  },

  async people() {
    return PEOPLE.filter((p) => p.id !== ME)
  },

  async sharesFor(id) {
    return (db.shares[id] ?? []).slice()
  },

  async setShares(id, personIds) {
    db = { ...db, shares: { ...db.shares, [id]: personIds.slice() } }
    save(db)
  },
}

/** Bruges af udviklingsværktøj og tests til at komme tilbage til demodata. */
export function resetLocal() {
  localStorage.removeItem(KEY)
  db = load()
}
