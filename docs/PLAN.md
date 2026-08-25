# Opskrifter — projektplan

En privat opskriftsapp for en lille lukket kreds. Ingen offentlig tilmelding:
man kommer ind med en invitationskode fra en man kender.

Designet ligger i `docs/DESIGN.md`. Denne fil beskriver hvad der bygges, i
hvilken rækkefølge, og hvad der bevidst er valgt fra.

---

## 1. Hvad appen er

Seks skærme, alle på dansk, alle bygget til at blive brugt med fedtede fingre
i et køkken:

| Skærm            | Rute                     | Formål |
| ---------------- | ------------------------ | ------ |
| Login            | `/login`                 | Log ind, eller opret bruger med invitationskode |
| Bibliotek        | `/`                      | Søg, filtrér, "overrask mig", dagens forslag |
| Opskrift         | `/opskrift/:id`          | Læs, skalér portioner, kryds ingredienser af |
| Kogetilstand     | `/opskrift/:id/kog`      | Mørk fuldskærm, ét trin ad gangen, timer, wake lock |
| Opret / ret      | `/ny`, `/opskrift/:id/ret` | Formular med ingrediens- og trinrækker |
| Deling           | `/opskrift/:id/deling`   | Synlighed + del med enkeltpersoner |

### Bærende principper

- **Store trykflader.** Intet interaktivt element under 44 px højt. Knapper i
  kogetilstand er 68 px.
- **Skarpe kanter.** 1 px streger, `border-radius` 0–2 px. Ingen skygger.
- **Læsbarhed frem for tæthed.** Trin sættes 17–34 px, ikke 14 px.
- **Ingen spinner-teater.** Tom liste og fejl er to forskellige tilstande, og
  fejlen siger eksplicit at samlingen *ikke* er tom.
- **Offline-tolerant.** Kogetilstand må ikke dø fordi wifi'et gør.

---

## 2. Arkitektur

```
React 19 + Vite 8  →  statisk build  →  GitHub Pages (/opskrifter/)
        │
        └── src/data/*  (repository-lag)
                 ├── local.js     localStorage, seedet med demodata
                 └── supabase.js  Postgres + RLS + Storage
```

**Repository-laget er det centrale valg.** `src/data/index.js` vælger adapter
ud fra om `VITE_SUPABASE_URL` er sat. Uden nøgler kører appen fuldt
funktionelt på localStorage — det gør den demobar, gør frontend-arbejdet
uafhængigt af backend, og gør det trivielt at teste uden at røre produktion.

Begge adaptere opfylder samme kontrakt (`docs/DESIGN.md` → Datakontrakt), så
skærmene kender ikke forskel.

### Hvorfor ikke TypeScript

Projektet er sat op i JSX. At skifte nu ville koste en migration uden at løse
et problem vi har. Datakontrakten er dokumenteret i stedet, og `oxlint` fanger
resten. Revurderes hvis datamodellen vokser.

---

## 3. Faser

### Fase 0 — Fundament ✅

- Ryd Vite-skabelonen ud.
- Designtokens som CSS custom properties (`src/styles/tokens.css`).
- Skrifter: Newsreader (display), Archivo (brød), DM Mono (labels).
- Router, app-shell, bundlinje.

### Fase 1 — Datalag ✅

- Repository-kontrakt + `local`-adapter med seed fra mockup'en.
- `supabase`-adapter skrevet mod skemaet i `supabase/schema.sql`.
- Skalering af ingredienser, dansk talformatering.

### Fase 2 — Skærme ✅

Alle seks skærme, inkl. tilstande: tom, fejl, ingen billeder.

### Fase 3 — Supabase-backend ✅

Skemaet i `supabase/schema.sql` er kørt. Det der manglede bagefter var ikke
tabellerne, men tre ting omkring dem:

1. **Rettigheder.** `anon` og `authenticated` havde ikke `grant` på de fem
   tabeller. RLS og GRANT er to lag: uden GRANT svarer PostgREST `42501
   permission denied` i stedet for at RLS filtrerer, og appen ser brudt ud
   selvom hver eneste politik er rigtig. Filen sætter dem nu eksplicit.
2. **E-mail-bekræftelse** var slået til. Slået fra i dashboardet — kredsen er
   lukket, og invitationskoden er gatekeeperen. En bekræftelsesmail tilføjer
   ingen sikkerhed, kun en gratis-SMTP-kø der kan fejle.
3. **Den første invitationskode** skulle indsættes i hånden.

Til fejlsøgning senere: **`42501` betyder at tabellen findes, men rollen mangler
GRANT. `PGRST205` betyder at tabellen ikke findes.** Det er den skelnen der
afgør om skemaet mangler at blive kørt, eller om det bare er lukket af. Man kan
måle det udefra med anon-nøglen alene:

```bash
curl "$VITE_SUPABASE_URL/rest/v1/recipes?select=id&limit=1" -H "apikey: $KEY"
```

`schema.sql` kan køres igen oven på en database der allerede har den: hver
politik droppes før den oprettes.

**Sikkerhedsmodellen** ligger i RLS, ikke i klienten:

- En opskrift kan læses hvis du ejer den, hvis den er `public`, eller hvis den
  er delt med dig via `recipe_shares`.
- Kun ejeren kan rette og slette.
- Invitationskoder valideres i en `security definer`-funktion, så en anon-bruger
  kan tjekke en kode uden at kunne læse tabellen.

### Fase 4 — Billeder ⏳

- Supabase Storage-bucket `recipe-images`, privat, med signed URLs.
- Klientside-nedskalering til max 1600 px før upload — telefonfotos er 4 MB+
  og bucket'en er på gratis-planen.
- `imagery: none` er allerede understøttet i UI'et, så tekst-først virker mens
  det bygges.

### Fase 5 — PWA ✅

Dette er det der reelt afgør om appen bliver brugt. En browser-fane er ikke et
køkkenredskab.

- Manifest og ikoner i `public/`, `display: standalone`. Ikonerne er rasteret
  fra `favicon.svg` med et engangsscript — der ligger ikke et billedbibliotek i
  `package.json` for fire firkanter.
- `public/sw.js` registreres kun i buildet (`import.meta.env.PROD`), ellers
  ville den cache sig selv i vejen for HMR.
- **Ingen precache-liste bygget ved build-tid.** Vite giver assets
  indholds-hashede navne, så cache-first opnår det samme uden et plugin der
  skal injicere filnavne i workeren.

| Hvad | Strategi |
| ---- | -------- |
| Navigationer | Netværk først, fald tilbage på den cachede skal. Det er også det der lader en ny deploy slå igennem |
| `assets/*` | Cache først — hashede navne bliver aldrig forældede |
| Google Fonts | Stale-while-revalidate. Uden det skifter appen til fallback-skrifter offline |
| `rest/v1/recipes`, `rest/v1/favorites` (kun GET) | Stale-while-revalidate. **Det er det der bærer kogetilstand offline:** en kold start resolver `data.list()` fra cachen |
| `auth/v1/*`, alt andet end GET | Cachès aldrig |

Wake lock var allerede implementeret (`useWakeLock`), men falder stille tilbage
på Safari iOS < 16.4.

### Fase 6 — Finpudsning ⏳

- Indkøbsliste genereret fra flere opskrifter (den mest oplagte næste feature).
- Tastaturnavigation + skærmlæser-gennemgang.
- `prefers-reduced-motion`.
- Rigtige fejlbeskeder fra Supabase i stedet for generisk tekst.

---

## 4. Bevidst valgt fra

| Ikke med | Hvorfor |
| -------- | ------- |
| Kommentarer / ratings | Fem brugere. Man siger det bare. |
| Opskrift-import fra URL | Stor parsing-opgave, lille gevinst i en lukket kreds. |
| Versionshistorik | Rettelser er sjældne og ukontroversielle her. |
| Offline-skrivning med sync | Konfliktløsning koster mere end det smager. Læsning offline er nok. |
| Næringsberegning | `kcal`/`protein` tastes manuelt. Automatik kræver en fødevaredatabase. |

---

## 5. Kendte huller

- **`remote`-adapteren er ikke kørt igennem med en rigtig bruger endnu.** Alt
  omkring den er på plads, men selve gennemløbet — opret bruger, gem opskrift,
  del den — mangler at blive gjort én gang med to konti.
- Data-cachen i service workeren tilhører den der var logget ind. Den ryddes i
  `signOut`. Lukker man browseren uden at logge ud, ligger den til næste gang —
  hvilket er meningen, det er sådan appen virker offline.
- Gamle asset-caches ryddes først når `VERSION` i `sw.js` bumpes. Bumper man
  den ikke, hober bundles fra tidligere deploys sig op. De er små, men de
  forsvinder ikke af sig selv.
- `demo` og `imagery` findes som URL-parametre (`?demo=error`,
  `?imagery=none`) til at fremkalde tilstande under udvikling. Harmløse, men
  de er udviklerværktøj, ikke funktioner.
- `local`-adapteren deler ikke på tværs af enheder. Den er en demo, ikke en
  backend.
- Invitationskoder har ingen udløbsdato endnu, kun `max_uses`.
- Trinnenes kobling til ingredienser (`ing`) kan ikke redigeres i formularen
  endnu — den bevares ved rettelser, men nye trin får ingen. Kogetilstand
  viser så bare ingen mængder ved det trin.
- Ingen tests i repoet. Datalaget og `scale.js` er det der først bør have nogle.

## 6. Sådan er det afprøvet

Alle seks skærme er kørt igennem mod `local`-adapteren i browseren:

- Bibliotek: søgning, alle seks filtre, tom-tilstand, fejltilstand,
  `?imagery=none`, dagens forslag.
- Opskrift: skalering 4 → 5 portioner regner rigtigt (800 g → 1000 g,
  1,2 kg → 1,5 kg) og lader "efter smag" stå.
- Kogetilstand: bærer portionsantallet med fra opskriften, trinvis
  navigation, timer, wake lock.
- Opret/ret: kladde, validering af manglende titel, gem, og "1,5" og "1.5"
  bliver begge til halvanden.
- Deling: synlighed og personer.

PWA'en er afprøvet i Chrome mod et rigtigt build, drevet over
DevTools-protokollen — ni tjek, alle bestået:

- Service workeren aktiverer, får scope `/opskrifter/`, og overtager siden.
- Skal-, asset- og fontcache oprettes.
- Data-cachen forsvinder når `signOut` sender sin besked.
- **Kogetilstand efter en kold start i flytilstand:** navigér til
  `/opskrift/r1/kog` uden net, efter at fanen har været lukket. Trin og
  mængder er der. Det er den test der afgør om resten var besværet værd.
- Biblioteket virker offline.

Ikke afprøvet endnu: `remote`-adapteren mod en rigtig konto, og dermed heller
ikke data-cachen med ægte Supabase-svar. Det kræver at fase 3's tre punkter er
gjort på projektet.
