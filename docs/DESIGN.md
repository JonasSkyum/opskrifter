# Designsystem

Udtrukket fra mockup'en (`Opskrifter.html`, Claude Design-canvas). Tokens bor i
`src/styles/tokens.css` — denne fil forklarer *hvorfor*, ikke *hvad*.

## Farver

To paletter: dagslys til alt, og en mørk til kogetilstand alene.

| Rolle | Token | Hex |
| ----- | ----- | --- |
| Papir (opskriftens flade) | `--paper` | `#FDFDFB` |
| Overflade (chrome, header) | `--surface` | `#F2F3EE` |
| Fyld (tags, noter) | `--surface-2` | `#E9EBE4` |
| Lærred (uden for telefonen) | `--canvas` | `#DCE0D6` |
| Streg, standard | `--line` | `#C9CFC4` |
| Streg, blød / blødere | `--line-soft` / `--line-softer` | `#DDE1D8` / `#E4E7DF` |
| Streg, felter | `--line-strong` | `#A9B3A6` |
| Blæk 1–5 | `--ink` … `--ink-5` | `#1E2420` → `#6C7A6D` |
| Accent | `--accent` | `#2E6250` |
| Accent, tryk | `--accent-dark` | `#24503F` |

Kogetilstand: `--night` `#16201B`, streger `#3C4E42`, accent `#8FC0A9`.
Fejl: baggrund `#F7E9E2`, streg `#C08A6E`, tekst `#6B2E12`.

Grøn er den eneste accentfarve. Den bruges til handling og til favoritter —
ingenting andet er farvet.

## Skrift

| Familie | Rolle | Hvor |
| ------- | ----- | ---- |
| **Newsreader** (serif) | Display | Titler, trin i kogetilstand |
| **Archivo** (sans) | Brød | Al løbende tekst, knapper, felter |
| **DM Mono** (mono) | Etiket | Versaler med sperring: metadata, mængder, sektionslabels |

Mono i versaler med `letter-spacing: 0.12em` er systemets signatur. Den
bærer alt strukturelt (»FORSLAG I DAG«, »MIN SAMLING«, mængdekolonnen), så
serif og sans kan holdes til indhold.

Mængder sættes altid mono og altid venstrejusteret i en 84 px kolonne, så
tallene flugter ned gennem en ingrediensliste.

## Rum og form

- `border-radius`: 0 overalt, 2 px på knapper og felter. Ingen skygger, ingen
  gradienter (undtagen skravering som billed-placeholder).
- Trykflader: 44 px minimum, 48–58 px normalt, 64–68 px for primære handlinger.
- Indhold får 20 px sidemargin, header 12–24 px afhængigt af tæthed.

## Datakontrakt

Begge dataadaptere returnerer dette. Skærmene kender kun denne form.

```js
Recipe {
  id: string
  title: string
  description: string
  notes: string
  tags: string[]
  servings: number          // portioner opskriften er skrevet til
  prep: number              // minutter
  cook: number              // minutter
  kcal: number | null
  protein: number | null
  visibility: 'private' | 'public'
  ownerId: string
  ownerName: string
  mine: boolean
  imagePath: string | null
  imageLabel: string        // alt-tekst / placeholder-etiket
  ingredients: Ingredient[]
  steps: Step[]
}

Ingredient { amount: number | null, unit: string, item: string }
// amount === null betyder "efter smag" og skaleres ikke.

Step { text: string, ing: number[] }
// ing = indeks ind i ingredients, vist i kogetilstand ved det trin.
```

### Repository-metoder

```js
list()                    → Recipe[]
get(id)                   → Recipe | null
create(draft)             → Recipe
update(id, patch)         → Recipe
remove(id)                → void
toggleFavorite(id)        → string[]   // alle favorit-id'er
favorites()               → string[]
people()                  → { id, name }[]
sharesFor(id)             → string[]   // person-id'er
setShares(id, personIds)  → void
```
