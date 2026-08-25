# Opskrifter

En privat opskriftsapp for en lille lukket kreds. Ingen offentlig tilmelding —
man kommer ind med en invitationskode.

Bygget som React + Vite, udgivet statisk på GitHub Pages, med Supabase som
backend.

## Kom i gang

```bash
npm install
npm run dev
```

Appen kører uden Supabase-nøgler. Mangler `.env.local`, bruger den en lokal
adapter med demodata i `localStorage` — fuldt funktionel, men kun på din egen
maskine.

Med backend:

```bash
# .env.local
VITE_SUPABASE_URL=https://<projekt>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

Skemaet ligger i [`supabase/schema.sql`](supabase/schema.sql) og skal køres én
gang i SQL-editoren. Fremgangsmåden står i [`docs/PLAN.md`](docs/PLAN.md).

## Kommandoer

| Kommando          | Gør |
| ----------------- | --- |
| `npm run dev`     | Udviklingsserver med HMR |
| `npm run build`   | Statisk build i `dist/` |
| `npm run preview` | Server buildet lokalt |
| `npm run lint`    | Oxlint |

## Dokumentation

- [`docs/PLAN.md`](docs/PLAN.md) — hvad der bygges, i hvilken rækkefølge
- [`docs/DESIGN.md`](docs/DESIGN.md) — designsystem og datakontrakt

## Udgivelse

Push til `main` udløser `.github/workflows/deploy.yml`, som bygger og udgiver
til GitHub Pages. `VITE_SUPABASE_URL` og `VITE_SUPABASE_ANON_KEY` skal ligge
som repository secrets.
