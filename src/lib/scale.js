import { amount } from './format.js'

/**
 * Skalerer en ingrediens fra opskriftens portionsantal til det valgte.
 *
 * Mængder uden tal ("salt og peber") skaleres ikke - de er "efter smag",
 * og 2,5 gange "efter smag" giver ingen mening.
 */
export function scaleIngredient(ingredient, fromServings, toServings) {
  if (ingredient.amount == null) return amount(null, '')
  const factor = toServings / fromServings
  return amount(ingredient.amount * factor, ingredient.unit)
}

/** Alle ingredienser skaleret på én gang, med det oprindelige objekt bevaret. */
export function scaleAll(ingredients, fromServings, toServings) {
  return ingredients.map((ingredient) => ({
    ...ingredient,
    display: scaleIngredient(ingredient, fromServings, toServings),
  }))
}

export const MIN_SERVINGS = 1
export const MAX_SERVINGS = 24

export function clampServings(n) {
  return Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, n))
}
