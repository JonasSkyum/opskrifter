import { useCallback, useEffect, useMemo, useState } from 'react'

import { useAuth } from '../auth/authContext.js'
import { data } from './index.js'
import { StoreContext } from './storeContext.js'

/**
 * Én indlæsning af samlingen, delt af alle skærme.
 *
 * Fem brugere og under hundrede opskrifter: hele listen hentes én gang og
 * holdes i hukommelsen. Det gør navigation mellem bibliotek og opskrift
 * øjeblikkelig, og gør kogetilstand robust hvis forbindelsen falder ud
 * midt i madlavningen.
 *
 * Hentningen følger sessionen, ikke mount. Providerne ligger uden om routeren,
 * så uden det ville samlingen blive hentet som anon på login-skærmen, fejle på
 * RLS, og stå i fejltilstand bagefter - også når man var kommet ind.
 */

export function RecipeStore({ children }) {
  const { ready: authReady, session } = useAuth()

  // Nøglen er brugeren, ikke sessionsobjektet. Demotilstand har intet id, kun
  // en e-mail; begge dur til at se om det er en ny person foran skærmen.
  const identity = session ? (session.user.id ?? session.user.email) : null

  const [recipes, setRecipes] = useState([])
  const [favorites, setFavorites] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error

  const reload = useCallback(async () => {
    setStatus('loading')
    try {
      const [list, favs] = await Promise.all([data.list(), data.favorites()])
      setRecipes(list)
      setFavorites(favs)
      setStatus('ready')
    } catch {
      // Hvad der gik galt hjælper ikke brugeren i et køkken. At det ikke
      // betyder "samlingen er tom" gør. Beskeden ligger i skærmen.
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    // Vent til sessionen er afgjort. Ellers henter vi som anon og fejler.
    if (!authReady) return

    if (identity === null) {
      // Logget ud. Ryd med det samme - ellers ser den næste der logger ind på
      // samme enhed den forriges samling indtil hentningen er færdig.
      setRecipes([])
      setFavorites([])
      setStatus('ready')
      return
    }

    reload()
  }, [authReady, identity, reload])

  const value = useMemo(() => {
    const replace = (recipe) =>
      setRecipes((all) => {
        const known = all.some((r) => r.id === recipe.id)
        return known
          ? all.map((r) => (r.id === recipe.id ? recipe : r))
          : [...all, recipe]
      })

    return {
      recipes,
      favorites,
      status,
      reload,

      get: (id) => recipes.find((r) => r.id === id) ?? null,
      isFavorite: (id) => favorites.includes(id),

      async toggleFavorite(id) {
        // Optimistisk: stjernen skal skifte i samme øjeblik man trykker.
        setFavorites((f) =>
          f.includes(id) ? f.filter((x) => x !== id) : [...f, id],
        )
        try {
          setFavorites(await data.toggleFavorite(id))
        } catch {
          setFavorites(await data.favorites())
        }
      },

      async create(draft) {
        const recipe = await data.create(draft)
        replace(recipe)
        return recipe
      },

      async update(id, patch) {
        const recipe = await data.update(id, patch)
        replace(recipe)
        return recipe
      },

      async remove(id) {
        await data.remove(id)
        setRecipes((all) => all.filter((r) => r.id !== id))
        setFavorites((f) => f.filter((x) => x !== id))
      },
    }
  }, [recipes, favorites, status, reload])

  return <StoreContext value={value}>{children}</StoreContext>
}
