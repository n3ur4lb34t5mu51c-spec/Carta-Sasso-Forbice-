/**
 * Firma "anti-manomissione" per i link di condivisione.
 *
 * IMPORTANTE: su un sito statico senza server, nessuna protezione può
 * essere davvero inviolabile — questo codice (compreso il "sale" usato
 * come chiave) è leggibile da chiunque apra gli strumenti sviluppatore.
 * Lo scopo qui NON è una sicurezza crittografica vera, ma impedire il caso
 * reale più comune: qualcuno che modifica a mano "punti=10" in "punti=9999"
 * nella barra degli indirizzi. Se i valori non corrispondono più alla
 * firma calcolata, il link viene semplicemente ignorato.
 */

const SALT = 'cbs-firma-v1-9f3a21';

function hash32(str: string, seed: number): number {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h = (h ^ str.charCodeAt(i)) >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function buildPayload(name: string, score: string, avatarSeed: string): string {
  return `${SALT}|${name}|${score}|${avatarSeed}`;
}

export function signResult(name: string, score: string, avatarSeed: string): string {
  const payload = buildPayload(name, score, avatarSeed);
  const a = hash32(payload, 0x811c9dc5);
  const b = hash32(payload.split('').reverse().join(''), 0x01000193);
  return a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0');
}

export function verifyResult(name: string, score: string, avatarSeed: string, firma: string | null): boolean {
  if (!firma) return false;
  return signResult(name, score, avatarSeed) === firma;
}
