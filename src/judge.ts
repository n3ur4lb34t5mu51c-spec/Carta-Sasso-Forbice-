/**
 * Giudice locale di "Cosa Batte Sasso?" — nessuna API, nessuna chiave,
 * funziona offline al 100%. Usa un sistema di "tier di potenza": ogni
 * parola viene associata (per parole chiave conosciute, o altrimenti per
 * hash deterministico) a un livello da 0 a 4. Chi ha il tier più alto ha
 * più probabilità di vincere, con un po' di fortuna/sfortuna per non
 * essere troppo prevedibile, e con difficoltà crescente man mano che la
 * serie si allunga (altrimenti diventerebbe impossibile perdere).
 */

import { BattleResult } from './types';

type Tier = { keywords: string[]; level: number };

// Più alto il livello, più "forte" è la categoria.
const TIERS: Tier[] = [
  {
    level: 0,
    keywords: [
      'sasso', 'pietra', 'roccia', 'carta', 'foglio', 'forbice', 'forbici',
      'bastone', 'ramo', 'legno', 'foglia', 'sabbia', 'corda', 'spago',
      'penna', 'matita', 'gomma', 'pallone', 'palla', 'mattone',
    ],
  },
  {
    level: 1,
    keywords: [
      'fuoco', 'fiamma', 'acqua', 'mare', 'oceano', 'fiume', 'vento',
      'aria', 'terra', 'terremoto', 'ghiaccio', 'neve', 'fulmine',
      'tuono', 'tempesta', 'uragano', 'metallo', 'acciaio', 'ferro',
      'martello', 'spada', 'coltello', 'arma', 'pistola', 'bomba',
      'esplosione', 'veleno', 'acido', 'elettricita', 'elettricità',
    ],
  },
  {
    level: 2,
    keywords: [
      'tempo', 'morte', 'vecchiaia', 'malattia', 'virus', 'batterio',
      'batteri', 'gravita', 'gravità', 'entropia', 'caos', 'guerra',
      'esercito', 'robot', 'macchina',
      'intelligenza artificiale', 'computer', 'internet', 'denaro',
      'soldi', 'politica', 'burocrazia', 'tasse', 'noia', 'tristezza',
      'rabbia', 'paura',
    ],
  },
  {
    level: 3,
    keywords: [
      'sole', 'stella', 'pianeta', 'asteroide', 'cometa', 'galassia',
      'buco nero', 'supernova', 'vulcano', 'tsunami', 'apocalisse',
      'estinzione', 'dinosauro', 'zombie', 'alieno', 'mostro', 'demone',
      'inferno', 'paradiso', 'destino', 'karma', 'sfortuna',
    ],
  },
  {
    level: 4,
    keywords: [
      'universo', 'multiverso', 'big bang', 'infinito', 'nulla', 'vuoto',
      'dio', 'divinita', 'divinità', 'logica', 'matematica', 'filosofia',
      'amore', 'odio', 'speranza', 'fede', 'sogno', 'immaginazione',
      'fantasia', 'paradosso', 'realta', 'realtà', 'coscienza', 'anima',
      'verita', 'verità', 'mamma', 'nonna', 'suocera', 'tasse', 'lunedi',
      'lunedì',
    ],
  },
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // rimuove accenti
    .trim();
}

// Hash semplice e deterministico, usato come fallback per parole non in elenco.
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

function getTier(word: string): number {
  const norm = normalize(word);
  let bestMatch = -1;
  for (const tier of TIERS) {
    for (const kw of tier.keywords) {
      if (norm.includes(normalize(kw))) {
        if (tier.level > bestMatch) bestMatch = tier.level;
      }
    }
  }
  if (bestMatch >= 0) return bestMatch;
  // Parola non riconosciuta: livello "medio" pseudo-casuale ma deterministico,
  // così la stessa parola dà sempre lo stesso risultato nella stessa partita.
  return hashString(norm) % 5;
}

// Frasi di spiegazione, scelte a caso in base al risultato.
const WIN_TEMPLATES = [
  (a: string, b: string) => `"${b}" stritola "${a}" senza nemmeno sforzarsi.`,
  (a: string, b: string) => `Ovvio: "${b}" ha la meglio su "${a}" in ogni universo possibile.`,
  (a: string, b: string) => `"${a}" non ha scampo contro "${b}". Game, set, match.`,
  (a: string, b: string) => `Con grande sorpresa di tutti, "${b}" demolisce "${a}".`,
  (a: string, b: string) => `"${b}" batte "${a}" e se ne va fischiettando.`,
  (a: string, b: string) => `La logica dell'universo dice che "${b}" supera "${a}", e chi siamo noi per discutere.`,
];

const LOSS_TEMPLATES = [
  (a: string, b: string) => `Bel tentativo, ma "${a}" resiste benissimo a "${b}".`,
  (a: string, b: string) => `"${b}" ci ha provato, ma "${a}" è ancora in piedi.`,
  (a: string, b: string) => `Eh no: "${a}" è troppo forte per "${b}".`,
  (a: string, b: string) => `"${b}" si ritira sconfitto davanti a "${a}".`,
  (a: string, b: string) => `Coraggioso, "${b}", ma "${a}" non si scompone.`,
  (a: string, b: string) => `Il giudice scuote la testa: "${b}" non basta contro "${a}".`,
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Decide se "current" batte "previous". `streak` è il numero di vittorie
 * consecutive già ottenute: più lunga è la serie, più difficile diventa
 * vincere ancora, per evitare partite infinite.
 */
export function judgeBattle(previous: string, current: string, streak: number = 0): Promise<BattleResult> {
  const prevTier = getTier(previous);
  const currTier = getTier(current);
  const diff = currTier - prevTier;

  // Probabilità di base in funzione della differenza di "potenza".
  let winChance = 0.5 + diff * 0.16;
  winChance = Math.min(0.92, Math.max(0.08, winChance));

  // Difficoltà crescente con la serie di vittorie (scende lentamente).
  const difficulty = Math.max(0.35, 1 - streak * 0.045);
  winChance *= difficulty;

  const wins = Math.random() < winChance;
  const explanation = wins
    ? pick(WIN_TEMPLATES)(previous, current)
    : pick(LOSS_TEMPLATES)(previous, current);

  // Manteniamo l'interfaccia "Promise" per compatibilità con il resto del codice
  // (in futuro si potrebbe tornare a un giudice via API senza toccare App.tsx).
  return Promise.resolve({ wins, explanation });
}
