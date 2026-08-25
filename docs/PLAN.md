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

### Fase 3 — Supabase-backend ⏳ *næste*

Skemaet ligger klar i `supabase/schema.sql`. Mangler at blive kørt.

1. Kør `schema.sql` i SQL-editoren på projektet.
2. Slå e-mail-signup til, slå e-mail-bekræftelse fra (lukket kreds, koden er
   gatekeeperen).
3. Opret første invitationskode manuelt:
   ```sql
   insert into invite_codes (code, created_by, max_uses)
   values ('KØKKEN-2026', null, 10);
   ```
4. Sæt `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` som repo-secrets
   (deploy-workflowet læser dem allerede).
5. Opret `ping`-tabellen som `keepalive.yml` kalder:
   ```sql
   create table ping (id int primary key default 1);
   insert into ping (id) values (1);
   ```

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

### Fase 5 — PWA ⏳

Dette er det der reelt afgør om appen bliver brugt. En browser-fane er ikke et
køkkenredskab.

- Manifest + ikoner, `display: standalone`.
- Service worker: app-shell precache, `stale-while-revalidate` på opskrifter.
- Kogetilstand skal virke fuldstændig offline når opskriften først er åbnet.
- Wake lock er allerede implementeret (`useWakeLock`), men falder stille
  tilbage på Safari iOS < 16.4.

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

- `demoState` og `imagery` fra mockup'en findes som URL-parametre
  (`?demo=error`, `?imagery=none`) til test. De skal væk før rigtig brug — eller
  blive, de er harmløse.
- `local`-adapteren deler ikke på tværs af enheder. Den er en demo, ikke en
  backend.
- Invitationskoder har ingen udløbsdato endnu, kun `max_uses`.
