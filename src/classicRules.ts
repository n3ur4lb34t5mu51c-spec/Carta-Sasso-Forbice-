/**
 * Regole "classiche" di Sasso-Carta-Forbice, applicate in modo deterministico
 * PRIMA di chiedere a Gemini o al giudice locale. Su parole come queste,
 * note a memoria da chiunque, un'IA può essere sorprendentemente incoerente
 * (capire la logica ma sbagliare la conclusione finale) — qui evitiamo
 * del tutto il problema per le 3 mosse più ovvie del gioco.
 */

import { BattleResult } from './types';

// Ordine ciclico: ogni elemento batte quello "prima" di lui nell'array
// (sasso batte forbice, carta batte sasso, forbice batte carta).
const ORDER = ['sasso', 'carta', 'forbice'];

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

// true se "a" batte classicamente "b"; null se uno dei due non è
// esattamente sasso/carta/forbice (in quel caso non si applica nessuna regola).
function classicBeats(a: string, b: string): boolean | null {
  const ia = ORDER.indexOf(a);
  const ib = ORDER.indexOf(b);
  if (ia === -1 || ib === -1 || ia === ib) return null;
  return (ia - ib + 3) % 3 === 1;
}

const EXPLANATIONS: Record<string, string> = {
  'forbice>carta': 'Le forbici tagliano la carta in un attimo!',
  'carta>sasso': 'La carta avvolge il sasso e lo intrappola!',
  'sasso>forbice': 'Il sasso spunta le lame delle forbici!',
  'carta<forbice': 'Le forbici tagliano la carta: niente da fare.',
  'sasso<carta': 'La carta avvolge il sasso: game over.',
  'forbice<sasso': 'Il sasso spunta le forbici: che dolore.',
};

export function classicOverride(previous: string, current: string): BattleResult | null {
  const p = normalize(previous);
  const c = normalize(current);
  const result = classicBeats(c, p);
  if (result === null) return null;

  const key = `${c}${result ? '>' : '<'}${p}`;
  return {
    wins: result,
    explanation: EXPLANATIONS[key] ?? (result ? `${current} batte ${previous}!` : `${current} non batte ${previous}.`),
  };
}
