/** Dansk formatering. Komma som decimaltegn, minutter som "45 min". */

/** 1.5 -> "1,5". Afrunder til to decimaler og dropper efterfølgende nuller. */
export function num(n) {
  const rounded = Math.round(n * 100) / 100
  return String(rounded).replace('.', ',')
}

/** Mængde + enhed, uden dobbelt mellemrum når enheden er tom. */
export function amount(value, unit) {
  if (value == null) return 'efter smag'
  return `${num(value)} ${unit}`.trim()
}

/** Samlet tid som ét tal - det er det man vil vide når man vælger. */
export function totalMinutes(recipe) {
  return (recipe.prep || 0) + (recipe.cook || 0)
}

/** Sekunder -> "04:59". */
export function clock(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')
  return `${m}:${s}`
}

/** "01", "02", ... Trinnumre skal flugte i mono. */
export function ordinal(index) {
  return String(index + 1).padStart(2, '0')
}

/**
 * Undertekst på en opskrift i listen. Fortæller det man vælger ud fra:
 * hvor lang tid, og hvis den ikke er min, hvem den er fra.
 */
export function metaLine(recipe) {
  const time = `${totalMinutes(recipe)} min`
  if (!recipe.mine) return `${time} · ${recipe.ownerName}`
  return `${time} · ${recipe.visibility === 'public' ? 'delt med alle' : 'kun mig'}`
}

/** "Mandag aften" - hilsenen på biblioteket. */
export function greeting(date = new Date()) {
  const days = [
    'Søndag',
    'Mandag',
    'Tirsdag',
    'Onsdag',
    'Torsdag',
    'Fredag',
    'Lørdag',
  ]
  const h = date.getHours()
  const part = h < 10 ? 'morgen' : h < 14 ? 'middag' : h < 18 ? 'eftermiddag' : 'aften'
  return `${days[date.getDay()]} ${part}`
}

/** Dansk sortering - æ, ø og å skal ligge bagest. */
export function byTitle(a, b) {
  return a.title.localeCompare(b.title, 'da')
}
