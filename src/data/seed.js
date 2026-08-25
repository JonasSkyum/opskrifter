/**
 * Demodata. Bruges af den lokale adapter, og som fixtures når man vil se
 * skærmene uden backend. Opskrifterne kommer fra mockup'en.
 *
 * `ing` på et trin er indeks ind i `ingredients` - det er dem der vises i
 * kogetilstand netop dér, så man ikke skal rulle tilbage efter mængder.
 */

export const PEOPLE = [
  { id: 'p-mig', name: 'Mig' },
  { id: 'p-mor', name: 'Mor' },
  { id: 'p-sofie', name: 'Sofie' },
  { id: 'p-jonas', name: 'Jonas' },
  { id: 'p-anders', name: 'Anders og Line' },
  { id: 'p-kollegiet', name: 'Kollegiet' },
]

export const SEED_RECIPES = [
  {
    id: 'r1',
    title: 'Stegt flæsk med persillesovs',
    ownerId: 'p-mig',
    ownerName: 'Mig',
    mine: true,
    visibility: 'public',
    description:
      'Søndagsmaden der ikke kan gøres om. Sprød flæsk, blank persillesovs, kartofler nok til alle.',
    tags: ['klassisk', 'svinekød', 'søndag'],
    servings: 4,
    prep: 15,
    cook: 45,
    kcal: 780,
    protein: 38,
    notes:
      'Flæsken bliver sprødest hvis du dupper den helt tør og salter den en halv time før.',
    imagePath: null,
    imageLabel: 'foto: flæsk på fad',
    ingredients: [
      { amount: 800, unit: 'g', item: 'stribet flæsk i skiver' },
      { amount: 1.2, unit: 'kg', item: 'kartofler' },
      { amount: 4, unit: 'dl', item: 'sødmælk' },
      { amount: 30, unit: 'g', item: 'smør' },
      { amount: 30, unit: 'g', item: 'hvedemel' },
      { amount: 1, unit: 'bdt', item: 'persille, hakket' },
      { amount: null, unit: '', item: 'salt og friskkværnet peber' },
    ],
    steps: [
      {
        text: 'Dup flæsken tør og salt den godt på begge sider. Lad den ligge og trække i 20 minutter.',
        ing: [0, 6],
      },
      {
        text: 'Skræl kartoflerne og sæt dem over i koldt, saltet vand. De skal koge cirka 20 minutter.',
        ing: [1],
      },
      {
        text: 'Steg flæsken på en tør, varm pande — cirka 6 minutter på hver side, til fedtkanten er gylden og sprød.',
        ing: [0],
      },
      {
        text: 'Smelt smørret i en gryde, rør melet i og lad det boble et minut uden at tage farve.',
        ing: [3, 4],
      },
      {
        text: 'Tilsæt mælken lidt ad gangen under kraftig piskning. Lad sovsen koge igennem i 5 minutter.',
        ing: [2],
      },
      {
        text: 'Rør persillen i til sidst og smag til med salt og peber. Server straks med flæsk og kartofler.',
        ing: [5, 6],
      },
    ],
  },
  {
    id: 'r2',
    title: 'Boller i karry',
    ownerId: 'p-mig',
    ownerName: 'Mig',
    mine: true,
    visibility: 'private',
    description:
      'Hverdagsret der bliver bedre af at stå en dag. Lav dobbelt portion.',
    tags: ['hverdag', 'gryderet', 'under 45 min'],
    servings: 4,
    prep: 20,
    cook: 25,
    kcal: 610,
    protein: 34,
    notes: 'Karryen skal ristes i smørret, ellers smager den af pulver.',
    imagePath: null,
    imageLabel: 'foto: gryderet i støbejern',
    ingredients: [
      { amount: 500, unit: 'g', item: 'hakket svinekød' },
      { amount: 1, unit: 'stk', item: 'løg, finthakket' },
      { amount: 1, unit: 'spsk', item: 'karry' },
      { amount: 4, unit: 'dl', item: 'kokosmælk' },
      { amount: 2, unit: 'dl', item: 'hønsebouillon' },
      { amount: 3, unit: 'dl', item: 'ris' },
      { amount: null, unit: '', item: 'salt' },
    ],
    steps: [
      {
        text: 'Rør farsen med løg, salt og lidt vand. Form små boller med to teskeer.',
        ing: [0, 1, 6],
      },
      {
        text: 'Kog bollerne i bouillonen ved svag varme i 8 minutter. Tag dem op med en hulske.',
        ing: [4],
      },
      {
        text: 'Rist karryen i smør i en gryde til den dufter — cirka 30 sekunder.',
        ing: [2],
      },
      {
        text: 'Tilsæt kokosmælk og bouillon, og lad sovsen koge ind i 10 minutter.',
        ing: [3, 4],
      },
      {
        text: 'Læg bollerne tilbage i sovsen og varm dem igennem. Server med ris.',
        ing: [5],
      },
    ],
  },
  {
    id: 'r3',
    title: 'Rødbedebøffer med skyrdressing',
    ownerId: 'p-sofie',
    ownerName: 'Sofie',
    mine: false,
    visibility: 'public',
    description: 'Vegetarisk, billig og holder til madpakken dagen efter.',
    tags: ['vegetarisk', 'under 30 min'],
    servings: 2,
    prep: 15,
    cook: 15,
    kcal: 430,
    protein: 19,
    notes:
      'Rist rødbederne af på panden inden du blander dem i — ellers bliver bøfferne våde.',
    imagePath: null,
    imageLabel: 'foto: bøffer på bagepapir',
    ingredients: [
      { amount: 300, unit: 'g', item: 'rødbeder, groft revet' },
      { amount: 1, unit: 'dl', item: 'havregryn' },
      { amount: 2, unit: 'stk', item: 'æg' },
      { amount: 60, unit: 'g', item: 'feta' },
      { amount: 2, unit: 'dl', item: 'skyr' },
      { amount: 1, unit: 'fed', item: 'hvidløg, revet' },
      { amount: null, unit: '', item: 'salt, peber, olie' },
    ],
    steps: [
      {
        text: 'Rist de revne rødbeder tørt af på en pande i 3 minutter, så de slipper væden.',
        ing: [0],
      },
      {
        text: 'Bland rødbeder, havregryn, æg og feta. Lad massen hvile 5 minutter.',
        ing: [0, 1, 2, 3],
      },
      {
        text: 'Form 6 bøffer og steg dem 4 minutter på hver side i olie.',
        ing: [6],
      },
      {
        text: 'Rør skyr med hvidløg, salt og peber. Server dressingen ved siden af.',
        ing: [4, 5, 6],
      },
    ],
  },
  {
    id: 'r4',
    title: 'Grovboller til fryseren',
    ownerId: 'p-mor',
    ownerName: 'Mor',
    mine: false,
    visibility: 'public',
    description:
      'Koldhævede natten over. Ti minutters arbejde, morgenmad i to uger.',
    tags: ['bagværk', 'koldhævet'],
    servings: 12,
    prep: 20,
    cook: 20,
    kcal: 210,
    protein: 8,
    notes: 'Dejen skal være klistret. Tilsæt ikke mere mel.',
    imagePath: null,
    imageLabel: 'foto: boller på plade',
    ingredients: [
      { amount: 5, unit: 'dl', item: 'koldt vand' },
      { amount: 10, unit: 'g', item: 'gær' },
      { amount: 400, unit: 'g', item: 'hvedemel' },
      { amount: 300, unit: 'g', item: 'grahamsmel' },
      { amount: 1, unit: 'spsk', item: 'salt' },
      { amount: 1, unit: 'spsk', item: 'honning' },
    ],
    steps: [
      {
        text: 'Rør gæren ud i det kolde vand sammen med honning og salt.',
        ing: [0, 1, 4, 5],
      },
      {
        text: 'Tilsæt melet og rør dejen sammen med en grydeske. Den skal være klistret.',
        ing: [2, 3],
      },
      {
        text: 'Dæk skålen og sæt den i køleskabet natten over — mindst 12 timer.',
        ing: [],
      },
      {
        text: 'Sæt boller på pladen med to spiseskeer. Bag ved 250° i 18-20 minutter.',
        ing: [],
      },
    ],
  },
  {
    id: 'r5',
    title: 'Tomatsuppe med brændt hvidløg',
    ownerId: 'p-sofie',
    ownerName: 'Sofie',
    mine: false,
    visibility: 'public',
    description:
      'Femten minutter fra dåse til aftensmad. Godt med et stykke ristet brød.',
    tags: ['vegetarisk', 'under 30 min', 'suppe'],
    servings: 3,
    prep: 5,
    cook: 20,
    kcal: 320,
    protein: 9,
    notes: '',
    imagePath: null,
    imageLabel: 'foto: suppe i dyb tallerken',
    ingredients: [
      { amount: 2, unit: 'ds', item: 'flåede tomater' },
      { amount: 6, unit: 'fed', item: 'hvidløg' },
      { amount: 1, unit: 'stk', item: 'løg' },
      { amount: 2, unit: 'dl', item: 'fløde' },
      { amount: 1, unit: 'tsk', item: 'sukker' },
      { amount: null, unit: '', item: 'olivenolie, salt' },
    ],
    steps: [
      {
        text: 'Svits hvidløgsfeddene hele i olie til de får mørke pletter. Tag halvdelen op.',
        ing: [1, 5],
      },
      {
        text: 'Tilsæt hakket løg og lad det blive blødt uden at brune.',
        ing: [2],
      },
      {
        text: 'Hæld tomaterne i, tilsæt sukker og lad suppen koge 15 minutter.',
        ing: [0, 4],
      },
      {
        text: 'Blend suppen glat, rør fløden i og smag til. Top med de reserverede hvidløg.',
        ing: [3, 5],
      },
    ],
  },
  {
    id: 'r6',
    title: 'Æbleskiver af rester',
    ownerId: 'p-mig',
    ownerName: 'Mig',
    mine: true,
    visibility: 'private',
    description: 'Til de sidste æbler i skålen. Ikke helt december, men tæt på.',
    tags: ['dessert', 'bagværk'],
    servings: 4,
    prep: 20,
    cook: 15,
    kcal: 390,
    protein: 11,
    notes: 'Vend dem med en strikkepind. Gaffel river dem itu.',
    imagePath: null,
    imageLabel: 'foto: æbleskiver med sukker',
    ingredients: [
      { amount: 250, unit: 'g', item: 'hvedemel' },
      { amount: 3, unit: 'dl', item: 'kærnemælk' },
      { amount: 2, unit: 'stk', item: 'æg' },
      { amount: 1, unit: 'tsk', item: 'natron' },
      { amount: 2, unit: 'stk', item: 'æbler, revet' },
      { amount: null, unit: '', item: 'smør til stegning' },
    ],
    steps: [
      {
        text: 'Pisk æggeblommer, kærnemælk, mel og natron sammen til en glat dej.',
        ing: [0, 1, 2, 3],
      },
      {
        text: 'Rør de revne æbler i og pisk til sidst hviderne stive og fold dem i.',
        ing: [4, 2],
      },
      { text: 'Varm smør i pandens huller og fyld dem trekvart op.', ing: [5] },
      {
        text: 'Vend æbleskiverne når kanten er sat — cirka 2 minutter pr. side.',
        ing: [],
      },
    ],
  },
]

export const SEED_FAVORITES = ['r1', 'r5']

export const SEED_SHARES = { r1: ['p-mor'] }

/** Tom opskrift til "Ny opskrift". Tallene er de mest almindelige gæt. */
export function blankRecipe() {
  return {
    title: '',
    description: '',
    tags: [],
    servings: 4,
    prep: 15,
    cook: 30,
    kcal: null,
    protein: null,
    notes: '',
    visibility: 'private',
    imagePath: null,
    imageLabel: '',
    ingredients: [{ amount: null, unit: '', item: '' }],
    steps: [{ text: '', ing: [] }],
  }
}
