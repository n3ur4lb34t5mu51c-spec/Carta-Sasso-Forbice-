/**
 * Recupera un'immagine rappresentativa per una parola usando l'API REST
 * pubblica di Wikipedia (gratuita, nessuna chiave richiesta, CORS abilitato
 * per l'uso diretto dal browser). Se non viene trovata nessuna immagine
 * (parola inventata, astratta, o senza voce su Wikipedia) si ritorna null e
 * l'interfaccia semplicemente non mostra nulla, senza errori visibili.
 */

const cache = new Map<string, string | null>();
const inFlight = new Map<string, Promise<string | null>>();

export function getWordImage(word: string): Promise<string | null> {
  const key = word.trim().toLowerCase();
  if (!key) return Promise.resolve(null);

  if (cache.has(key)) return Promise.resolve(cache.get(key) ?? null);
  if (inFlight.has(key)) return inFlight.get(key)!;

  const promise = (async () => {
    try {
      const res = await fetch(
        `https://it.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(key)}`,
        { headers: { Accept: 'application/json' } }
      );
      if (!res.ok) {
        cache.set(key, null);
        return null;
      }
      const data = await res.json();
      // Evitiamo pagine di disambiguazione (raramente hanno un'immagine utile)
      if (data?.type === 'disambiguation') {
        cache.set(key, null);
        return null;
      }
      const url: string | null = data?.thumbnail?.source ?? null;
      cache.set(key, url);
      return url;
    } catch {
      cache.set(key, null);
      return null;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}
