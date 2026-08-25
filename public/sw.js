/**
 * Service worker for Opskrifter.
 *
 * Formålet er ét: kogetilstand må ikke dø fordi wifi'et gør. Man står med
 * fedtede fingre midt i en ret, og en tom skærm er ikke en mulighed.
 *
 * Der er ingen precache-liste bygget ved build-tid. Vite giver assets
 * indholds-hashede navne, så de er uforanderlige - cache-first opnår det
 * samme som en precache-manifest, uden et plugin der skal injicere filnavne.
 */

/**
 * Bumpes i hånden når logikken herunder ændres. Ved activate slettes alle
 * caches der ikke bærer den aktuelle version, så gamle assets ikke hober sig
 * op deploy efter deploy.
 */
const VERSION = 'v1'

const SHELL = `opskrifter-shell-${VERSION}` // index.html, ikoner, manifest
const ASSETS = `opskrifter-assets-${VERSION}` // hashede js/css-bundles
const FONTS = `opskrifter-fonts-${VERSION}` // Google Fonts
const DATA = `opskrifter-data-${VERSION}` // opskrifter og favoritter

const CURRENT = [SHELL, ASSETS, FONTS, DATA]

/** '/opskrifter/' - læst fra registreringen, så basen kun står ét sted. */
const BASE = new URL(self.registration.scope).pathname

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) =>
        cache.addAll([
          BASE,
          `${BASE}manifest.webmanifest`,
          `${BASE}favicon.svg`,
          `${BASE}icon-192.png`,
          `${BASE}icon-512.png`,
          `${BASE}apple-touch-icon.png`,
        ]),
      )
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((n) => n.startsWith('opskrifter-') && !CURRENT.includes(n))
            .map((n) => caches.delete(n)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

/**
 * Data-cachen er den indloggede brugers. Uden det her ville den næste der
 * logger ind på samme enhed kunne se den forriges samling offline.
 */
self.addEventListener('message', (event) => {
  if (event.data?.type === 'ryd-data') {
    event.waitUntil(caches.delete(DATA))
  }
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Login, tokenfornyelse, udlogning. Må aldrig ligge i en cache.
  if (url.pathname.startsWith('/auth/v1/')) return

  if (request.mode === 'navigate') {
    event.respondWith(navigation(request))
    return
  }

  if (url.origin === self.location.origin && url.pathname.startsWith(`${BASE}assets/`)) {
    event.respondWith(cacheFirst(request, ASSETS))
    return
  }

  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request, FONTS))
    return
  }

  if (url.hostname.endsWith('.supabase.co') && isCollection(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, DATA))
  }
})

/** De to kald RecipeStore laver ved opstart - og dermed dem der bærer offline. */
function isCollection(pathname) {
  return (
    pathname.startsWith('/rest/v1/recipes') ||
    pathname.startsWith('/rest/v1/favorites')
  )
}

/**
 * Netværket først, så en ny deploy slår igennem så snart man er online.
 * Falder tilbage på skallen - GitHub Pages serverer alligevel index.html på
 * alle dybe stier via 404.html, så det er samme dokument.
 */
async function navigation(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(SHELL)
      cache.put(BASE, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(BASE)
    if (cached) return cached
    throw new Error('Ingen forbindelse, og skallen er ikke cachet endnu.')
  }
}

/** Til indholds-hashede filnavne. De ændrer sig aldrig, kun deres navn gør. */
async function cacheFirst(request, name) {
  const cache = await caches.open(name)
  const cached = await cache.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (usable(response)) cache.put(request, response.clone())
  return response
}

/**
 * Svar med det vi har, hent en frisk version i baggrunden.
 *
 * Nøglen er URL'en som streng, ikke Request-objektet: Supabase-kaldene bærer
 * en Authorization-header, og med et Request som nøgle kan et Vary-svar gøre
 * opslaget til en miss præcis når vi har mest brug for et hit.
 */
async function staleWhileRevalidate(request, name) {
  const cache = await caches.open(name)
  const key = request.url
  const cached = await cache.match(key, { ignoreVary: true })

  const fresh = fetch(request)
    .then((response) => {
      if (usable(response)) cache.put(key, response.clone())
      return response
    })
    .catch(() => null)

  if (cached) return cached

  const response = await fresh
  if (response) return response
  throw new Error('Ingen forbindelse, og intet cachet svar.')
}

/** status 0 = opaque svar fra fonts.gstatic.com. Kan ikke læses, men kan gemmes. */
function usable(response) {
  return response && (response.ok || response.type === 'opaque')
}
