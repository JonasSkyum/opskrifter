import { createContext, useContext } from 'react'

/** Delt af <RecipeStore> og useStore. Egen fil, så fast refresh virker. */
export const StoreContext = createContext(null)

export function useStore() {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore skal bruges inde i <RecipeStore>')
  return store
}
