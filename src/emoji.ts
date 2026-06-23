/**
 * Associa una parola a una emoji a tema, per dare un effetto "immagine/meme"
 * a ogni mossa senza bisogno di nessuna API esterna (niente chiavi, niente
 * quota, niente rischio di immagini inappropriate per input a caso).
 */

type EmojiTier = { keywords: string[]; emoji: string };

const EMOJI_MAP: EmojiTier[] = [
  { emoji: '🪨', keywords: ['sasso', 'pietra', 'roccia'] },
  { emoji: '📄', keywords: ['carta', 'foglio'] },
  { emoji: '✂️', keywords: ['forbice', 'forbici'] },
  { emoji: '🪵', keywords: ['bastone', 'ramo', 'legno'] },
  { emoji: '🍂', keywords: ['foglia'] },
  { emoji: '🏖️', keywords: ['sabbia'] },
  { emoji: '🧵', keywords: ['corda', 'spago'] },
  { emoji: '✏️', keywords: ['penna', 'matita'] },
  { emoji: '🧱', keywords: ['mattone'] },
  { emoji: '🔥', keywords: ['fuoco', 'fiamma', 'incendio'] },
  { emoji: '🌊', keywords: ['acqua', 'mare', 'oceano', 'fiume', 'onda'] },
  { emoji: '🌬️', keywords: ['vento', 'aria'] },
  { emoji: '🌍', keywords: ['terra', 'terremoto', 'pianeta'] },
  { emoji: '❄️', keywords: ['ghiaccio', 'neve', 'freddo'] },
  { emoji: '⚡', keywords: ['fulmine', 'tuono', 'elettricita', 'elettricità', 'tempesta', 'uragano'] },
  { emoji: '🔩', keywords: ['metallo', 'acciaio', 'ferro'] },
  { emoji: '🔨', keywords: ['martello'] },
  { emoji: '🗡️', keywords: ['spada', 'coltello', 'arma'] },
  { emoji: '🔫', keywords: ['pistola', 'fucile'] },
  { emoji: '💣', keywords: ['bomba', 'esplosione', 'esplosivo'] },
  { emoji: '☠️', keywords: ['veleno', 'acido', 'tossico'] },
  { emoji: '⏳', keywords: ['tempo'] },
  { emoji: '💀', keywords: ['morte', 'vecchiaia'] },
  { emoji: '🦠', keywords: ['virus', 'batterio', 'batteri', 'malattia'] },
  { emoji: '🌀', keywords: ['caos', 'entropia'] },
  { emoji: '⚔️', keywords: ['guerra', 'esercito', 'battaglia'] },
  { emoji: '🤖', keywords: ['robot', 'macchina', 'intelligenza artificiale', 'computer'] },
  { emoji: '📡', keywords: ['internet', 'rete', 'wifi'] },
  { emoji: '💰', keywords: ['denaro', 'soldi'] },
  { emoji: '🏛️', keywords: ['politica', 'burocrazia', 'tasse'] },
  { emoji: '😩', keywords: ['noia', 'tristezza'] },
  { emoji: '😡', keywords: ['rabbia'] },
  { emoji: '😱', keywords: ['paura'] },
  { emoji: '☀️', keywords: ['sole'] },
  { emoji: '⭐', keywords: ['stella'] },
  { emoji: '☄️', keywords: ['asteroide', 'cometa'] },
  { emoji: '🌌', keywords: ['galassia', 'universo', 'multiverso', 'cosmo'] },
  { emoji: '🕳️', keywords: ['buco nero'] },
  { emoji: '💥', keywords: ['big bang', 'supernova'] },
  { emoji: '🌋', keywords: ['vulcano'] },
  { emoji: '🌪️', keywords: ['tsunami', 'apocalisse'] },
  { emoji: '🦖', keywords: ['dinosauro', 'estinzione'] },
  { emoji: '🧟', keywords: ['zombie'] },
  { emoji: '👽', keywords: ['alieno'] },
  { emoji: '👹', keywords: ['mostro', 'demone'] },
  { emoji: '🔥', keywords: ['inferno'] },
  { emoji: '☁️', keywords: ['paradiso', 'cielo'] },
  { emoji: '🎯', keywords: ['destino', 'karma'] },
  { emoji: '🍀', keywords: ['fortuna', 'sfortuna'] },
  { emoji: '♾️', keywords: ['infinito'] },
  { emoji: '🕳️', keywords: ['nulla', 'vuoto'] },
  { emoji: '✨', keywords: ['dio', 'divinita', 'divinità', 'magia'] },
  { emoji: '➗', keywords: ['logica', 'matematica'] },
  { emoji: '🧠', keywords: ['filosofia', 'pensiero', 'coscienza', 'mente'] },
  { emoji: '❤️', keywords: ['amore'] },
  { emoji: '💔', keywords: ['odio'] },
  { emoji: '🌈', keywords: ['speranza', 'sogno', 'fede'] },
  { emoji: '🎨', keywords: ['immaginazione', 'fantasia', 'arte', 'creativita', 'creatività'] },
  { emoji: '🔮', keywords: ['paradosso', 'realta', 'realtà', 'verita', 'verità', 'mistero'] },
  { emoji: '👻', keywords: ['anima', 'fantasma', 'spirito'] },
  { emoji: '👵', keywords: ['nonna', 'suocera', 'mamma'] },
  { emoji: '😤', keywords: ['lunedi', 'lunedì'] },
];

// Fallback per parole non riconosciute: pool con scelta deterministica
// (la stessa parola dà sempre la stessa emoji, ma parole diverse variano).
const FALLBACK_EMOJI = ['🎲', '❓', '🌀', '✨', '🔮', '🃏', '🧩', '💭', '🌟', '🎭'];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function getEmoji(word: string): string {
  const norm = normalize(word);
  for (const entry of EMOJI_MAP) {
    for (const kw of entry.keywords) {
      if (norm.includes(normalize(kw))) {
        return entry.emoji;
      }
    }
  }
  return FALLBACK_EMOJI[hashString(norm) % FALLBACK_EMOJI.length];
}
