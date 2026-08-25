import { supabase } from '../lib/supabase.js'

/**
 * Supabase-adapter. Skrevet mod skemaet i supabase/schema.sql.
 *
 * Adgangskontrollen ligger i RLS, ikke her. Denne fil oversætter mellem
 * databasens kolonnenavne og datakontrakten i docs/DESIGN.md - intet andet.
 */

const COLUMNS = `
  id, owner_id, title, description, notes, tags, servings,
  prep_minutes, cook_minutes, kcal, protein, visibility,
  image_path, image_label, ingredients, steps,
  profiles!recipes_owner_id_fkey ( display_name )
`

function currentUserId() {
  return supabase.auth.getSession().then(({ data }) => data.session?.user?.id ?? null)
}

function fromRow(row, myId) {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    notes: row.notes ?? '',
    tags: row.tags ?? [],
    servings: row.servings,
    prep: row.prep_minutes,
    cook: row.cook_minutes,
    kcal: row.kcal,
    protein: row.protein,
    visibility: row.visibility,
    ownerId: row.owner_id,
    ownerName: row.profiles?.display_name ?? 'Ukendt',
    mine: row.owner_id === myId,
    imagePath: row.image_path,
    imageLabel: row.image_label ?? '',
    ingredients: row.ingredients ?? [],
    steps: row.steps ?? [],
  }
}

/** Kun de felter databasen ejer. id, owner_id og navne sættes ikke herfra. */
function toRow(recipe) {
  return {
    title: recipe.title,
    description: recipe.description,
    notes: recipe.notes,
    tags: recipe.tags,
    servings: recipe.servings,
    prep_minutes: recipe.prep,
    cook_minutes: recipe.cook,
    kcal: recipe.kcal,
    protein: recipe.protein,
    visibility: recipe.visibility,
    image_path: recipe.imagePath,
    image_label: recipe.imageLabel,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
  }
}

function unwrap({ data, error }) {
  if (error) throw new Error(error.message)
  return data
}

export const remoteData = {
  async list() {
    const myId = await currentUserId()
    const rows = unwrap(
      await supabase.from('recipes').select(COLUMNS).order('title'),
    )
    return rows.map((row) => fromRow(row, myId))
  },

  async get(id) {
    const myId = await currentUserId()
    const { data, error } = await supabase
      .from('recipes')
      .select(COLUMNS)
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data ? fromRow(data, myId) : null
  },

  async create(draft) {
    const myId = await currentUserId()
    const row = unwrap(
      await supabase
        .from('recipes')
        .insert({ ...toRow(draft), owner_id: myId })
        .select(COLUMNS)
        .single(),
    )
    return fromRow(row, myId)
  },

  async update(id, patch) {
    const myId = await currentUserId()
    const row = unwrap(
      await supabase
        .from('recipes')
        .update(toRow(patch))
        .eq('id', id)
        .select(COLUMNS)
        .single(),
    )
    return fromRow(row, myId)
  },

  async remove(id) {
    unwrap(await supabase.from('recipes').delete().eq('id', id))
  },

  async favorites() {
    const rows = unwrap(await supabase.from('favorites').select('recipe_id'))
    return rows.map((r) => r.recipe_id)
  },

  async toggleFavorite(id) {
    const myId = await currentUserId()
    const current = await this.favorites()
    if (current.includes(id)) {
      unwrap(
        await supabase
          .from('favorites')
          .delete()
          .eq('recipe_id', id)
          .eq('user_id', myId),
      )
    } else {
      unwrap(
        await supabase.from('favorites').insert({ recipe_id: id, user_id: myId }),
      )
    }
    return this.favorites()
  },

  async people() {
    const myId = await currentUserId()
    const rows = unwrap(
      await supabase.from('profiles').select('id, display_name').order('display_name'),
    )
    return rows
      .filter((p) => p.id !== myId)
      .map((p) => ({ id: p.id, name: p.display_name }))
  },

  async sharesFor(id) {
    const rows = unwrap(
      await supabase.from('recipe_shares').select('person_id').eq('recipe_id', id),
    )
    return rows.map((r) => r.person_id)
  },

  async setShares(id, personIds) {
    const before = await this.sharesFor(id)
    const added = personIds.filter((p) => !before.includes(p))
    const removed = before.filter((p) => !personIds.includes(p))

    if (removed.length) {
      unwrap(
        await supabase
          .from('recipe_shares')
          .delete()
          .eq('recipe_id', id)
          .in('person_id', removed),
      )
    }
    if (added.length) {
      unwrap(
        await supabase
          .from('recipe_shares')
          .insert(added.map((person_id) => ({ recipe_id: id, person_id }))),
      )
    }
  },
}
