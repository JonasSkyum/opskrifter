import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AuthProvider } from './auth/AuthProvider.jsx'
import { useAuth } from './auth/authContext.js'
import { RecipeStore } from './data/store.jsx'
import CookScreen from './screens/CookScreen.jsx'
import EditorScreen from './screens/EditorScreen.jsx'
import LibraryScreen from './screens/LibraryScreen.jsx'
import LoginScreen from './screens/LoginScreen.jsx'
import RecipeScreen from './screens/RecipeScreen.jsx'
import ShareScreen from './screens/ShareScreen.jsx'

/**
 * basename kommer fra Vites base ('/opskrifter/'), så ruterne peger rigtigt
 * på GitHub Pages. Dybe links overlever et genindlæs fordi buildet lægger en
 * kopi af index.html som 404.html - se vite.config.js.
 */
export default function App() {
  return (
    <AuthProvider>
      <RecipeStore>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route path="/login" element={<LoginScreen />} />
            <Route
              path="/"
              element={
                <Guard>
                  <LibraryScreen />
                </Guard>
              }
            />
            <Route
              path="/ny"
              element={
                <Guard>
                  <EditorScreen />
                </Guard>
              }
            />
            <Route
              path="/opskrift/:id"
              element={
                <Guard>
                  <RecipeScreen />
                </Guard>
              }
            />
            <Route
              path="/opskrift/:id/kog"
              element={
                <Guard>
                  <CookScreen />
                </Guard>
              }
            />
            <Route
              path="/opskrift/:id/ret"
              element={
                <Guard>
                  <EditorScreen />
                </Guard>
              }
            />
            <Route
              path="/opskrift/:id/deling"
              element={
                <Guard>
                  <ShareScreen />
                </Guard>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </RecipeStore>
    </AuthProvider>
  )
}

/**
 * Venter på at sessionen er afgjort før der omdirigeres. Uden det ville et
 * genindlæst vindue blinke forbi login inden sessionen er læst tilbage.
 */
function Guard({ children }) {
  const { ready, signedIn } = useAuth()
  if (!ready) return <div className="app" />
  if (!signedIn) return <Navigate to="/login" replace />
  return children
}
