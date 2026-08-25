import { hasSupabase } from '../lib/supabase.js'
import { localData } from './local.js'
import { remoteData } from './remote.js'

/**
 * Ét sted vælges adapter. Skærmene importerer `data` og ved ikke hvilken de
 * fik - de opfylder samme kontrakt (docs/DESIGN.md → Datakontrakt).
 */
export const data = hasSupabase ? remoteData : localData

/** Sand når appen kører på demodata i browseren frem for på en backend. */
export const isDemo = !hasSupabase

export { blankRecipe } from './seed.js'
