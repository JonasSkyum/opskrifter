import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * null når nøglerne mangler. Det er ikke en fejltilstand - appen falder
 * tilbage på den lokale adapter, så frontend kan køre uden backend.
 */
export const supabase = url && key ? createClient(url, key) : null

export const hasSupabase = supabase !== null
