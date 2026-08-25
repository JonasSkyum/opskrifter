import { createContext, useContext } from 'react'

/** Delt af <AuthProvider> og useAuth. Egen fil, så fast refresh virker. */
export const AuthContext = createContext(null)

export function useAuth() {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('useAuth skal bruges inde i <AuthProvider>')
  return auth
}
