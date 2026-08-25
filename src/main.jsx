import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './styles/tokens.css'
import './styles/base.css'
import './styles/app.css'

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Kun i buildet. Under npm run dev ville en service worker cache sig selv i
// vejen for HMR, og fejlsøgning bliver til gætteri.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, {
        scope: import.meta.env.BASE_URL,
      })
      .catch(() => {
        // En app der ikke kan installeres er stadig en app der virker.
      })
  })
}
