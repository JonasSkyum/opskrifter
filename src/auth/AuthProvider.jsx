import { useEffect, useMemo, useState } from 'react'

import { hasSupabase, supabase } from '../lib/supabase.js'
import { AuthContext } from './authContext.js'

/**
 * Login. To virkeligheder bag samme grænseflade:
 *
 * - Med Supabase-nøgler: rigtig auth. Invitationskoden sendes med som user
 *   metadata og valideres af en trigger i databasen, ikke her.
 * - Uden: demotilstand. "Log ind" sætter et flag, så skærmen kan afprøves
 *   uden backend. Ingen adgangskontrol - der er heller ingen data at
 *   beskytte.
 */

const DEMO_KEY = 'opskrifter.demo-session'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!hasSupabase) {
      setSession(
        localStorage.getItem(DEMO_KEY) ? { user: { email: 'demo' } } : null,
      )
      setReady(true)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const value = useMemo(
    () => ({
      session,
      ready,
      signedIn: session !== null,

      async signIn(email, password) {
        if (!hasSupabase) {
          localStorage.setItem(DEMO_KEY, '1')
          setSession({ user: { email: email || 'demo' } })
          return
        }
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw new Error(translate(error.message))
      },

      async signUp(email, password, inviteCode) {
        if (!hasSupabase) {
          localStorage.setItem(DEMO_KEY, '1')
          setSession({ user: { email: email || 'demo' } })
          return
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { invite_code: inviteCode } },
        })
        if (error) throw new Error(translate(error.message))
      },

      async signOut() {
        if (!hasSupabase) {
          localStorage.removeItem(DEMO_KEY)
          setSession(null)
          clearCachedData()
          return
        }
        await supabase.auth.signOut()
        clearCachedData()
      },
    }),
    [session, ready],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}

/**
 * Service workeren cacher opskrifter og favoritter så kogetilstand virker
 * offline. De svar tilhører den der var logget ind, så de skal væk igen -
 * ellers ser den næste på samme enhed den forriges samling.
 *
 * Beskeden sendes til registreringens aktive worker, ikke til
 * navigator.serviceWorker.controller: controller er null i det dokument der
 * indlæste siden før workeren nåede at aktivere, og netop dér ville
 * oprydningen ellers stille blive sprunget over.
 */
function clearCachedData() {
  navigator.serviceWorker?.ready
    .then((registration) => registration.active?.postMessage({ type: 'ryd-data' }))
    .catch(() => {
      // Ingen service worker (dev, eller en browser uden). Intet at rydde.
    })
}

/**
 * Supabase svarer på engelsk. Beskederne fra vores egen trigger er allerede
 * danske og går uændret igennem.
 */
function translate(message) {
  const map = {
    'Invalid login credentials': 'Forkert e-mail eller adgangskode.',
    'Email not confirmed': 'E-mailen er ikke bekræftet endnu.',
    'User already registered': 'Der findes allerede en bruger med den e-mail.',
    'Password should be at least 6 characters':
      'Adgangskoden skal være mindst 6 tegn.',
  }
  if (map[message]) return map[message]
  if (message.includes('invitationskode') || message.includes('Invitationskoden')) {
    return message
  }
  return message
}
