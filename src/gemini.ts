/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';
import { BattleResult } from './types';
import { judgeBattle as judgeBattleLocal } from './judge';

// NOTA SULLA SICUREZZA:
// Sito statico (GitHub Pages), nessun backend: la API key viene iniettata
// in fase di build e finisce nel bundle JS pubblico. RESTRINGI la key per
// referrer HTTP su Google AI Studio / Cloud Console (es. solo
// "https://tuoutente.github.io/*") per evitare abusi da parte di terzi.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

// Modello più economico e con la quota gratuita più generosa (RPD) al momento.
const MODEL = 'gemini-2.5-flash-lite';

// Numero massimo di chiamate API che UN SINGOLO browser può fare al giorno.
// Protegge la quota condivisa (tutti i visitatori usano la stessa key):
// superato il tetto, si passa in automatico al giudice locale senza che
// il gioco si interrompa.
const MAX_CALLS_PER_DAY = 40;

let aiClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  if (!API_KEY) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: API_KEY });
  }
  return aiClient;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function getCallsToday(): number {
  try {
    const raw = localStorage.getItem('cbs_calls');
    if (!raw) return 0;
    const { date, count } = JSON.parse(raw);
    return date === todayKey() ? count : 0;
  } catch {
    return 0;
  }
}

function incrementCallsToday(): void {
  try {
    localStorage.setItem('cbs_calls', JSON.stringify({ date: todayKey(), count: getCallsToday() + 1 }));
  } catch {
    // localStorage non disponibile: va bene, semplicemente non limitiamo.
  }
}

function cacheKey(previous: string, current: string): string {
  return `cbs_cache:${previous.trim().toLowerCase()}|${current.trim().toLowerCase()}`;
}

function getCached(previous: string, current: string): BattleResult | null {
  try {
    const raw = localStorage.getItem(cacheKey(previous, current));
    return raw ? (JSON.parse(raw) as BattleResult) : null;
  } catch {
    return null;
  }
}

function setCached(previous: string, current: string, result: BattleResult): void {
  try {
    localStorage.setItem(cacheKey(previous, current), JSON.stringify(result));
  } catch {
    // Storage piena o non disponibile: non è un problema critico, si ignora.
  }
}

async function callGemini(previous: string, current: string): Promise<BattleResult> {
  const ai = getClient();
  if (!ai) throw new Error('API key non configurata');

  // Prompt volutamente breve per minimizzare i token di input.
  const prompt = `Gioco "Cosa batte sasso". "${previous}" vs "${current}". "${current}" batte "${previous}"? Rispondi JSON breve, in italiano, divertente.`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      // Disabilita il "thinking" (ragionamento interno): sui modelli 2.5+
      // consuma token nascosti anche se non li vedi nella risposta.
      thinkingConfig: { thinkingBudget: 0 },
      maxOutputTokens: 100,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          wins: { type: Type.BOOLEAN },
          explanation: { type: Type.STRING },
        },
        required: ['wins', 'explanation'],
      },
    },
  });

  return JSON.parse(response.text || '{}') as BattleResult;
}

export async function judgeBattle(previous: string, current: string, streak: number = 0): Promise<BattleResult> {
  // 1. Cache: se questa coppia è già stata giudicata su questo browser, riusala.
  const cached = getCached(previous, current);
  if (cached) return cached;

  // 2. Tetto giornaliero raggiunto, o nessuna key configurata: giudice locale.
  if (!API_KEY || getCallsToday() >= MAX_CALLS_PER_DAY) {
    return judgeBattleLocal(previous, current, streak);
  }

  // 3. Altrimenti, prova Gemini; in caso di errore (quota esaurita, rete, ecc.)
  //    ricadi sempre sul giudice locale così il gioco non si rompe mai.
  try {
    incrementCallsToday();
    const result = await callGemini(previous, current);
    setCached(previous, current, result);
    return result;
  } catch (err) {
    console.warn('Gemini non disponibile, uso il giudice locale:', err);
    return judgeBattleLocal(previous, current, streak);
  }
}
