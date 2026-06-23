/**
 * Avatar generati con DiceBear (https://www.dicebear.com), servizio gratuito
 * e senza chiave API: basta costruire un URL con uno "seed" e si ottiene
 * sempre la stessa immagine per quel seed (perfetto per i link di
 * condivisione, che includono il seed nell'URL).
 */

const STYLE = 'fun-emoji';

export function randomAvatarSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function avatarUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/${STYLE}/svg?seed=${encodeURIComponent(seed)}`;
}
