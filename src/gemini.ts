/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';
import { BattleResult } from './types';

// NOTA SULLA SICUREZZA:
// Questa app è statica (GitHub Pages) e non ha un backend, quindi la
// chiamata a Gemini viene fatta direttamente dal browser. La API key viene
// "iniettata" in fase di build da Vite (vedi vite.config.ts / .env) e
// finisce nel bundle JS pubblico. Per un progetto hobby va bene, ma vai su
// Google AI Studio / Google Cloud Console e RESTRINGI la key per referrer
// HTTP (es. solo "https://tuoutente.github.io/*") per evitare abusi.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

let aiClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!API_KEY) {
    throw new Error(
      'GEMINI_API_KEY non configurata. Crea un file .env con VITE_GEMINI_API_KEY="la-tua-key".'
    );
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: API_KEY });
  }
  return aiClient;
}

export async function judgeBattle(previous: string, current: string): Promise<BattleResult> {
  const ai = getClient();

  const prompt = `Devi fare il giudice del gioco "Cosa batte sasso?" (What beats rock).
L'utente sta cercando di battere "${previous}" usando "${current}".
Decidi se è logicamente sensato, esilarante o creativamente convincente che "${current}" batta "${previous}". Considera le regole della vita reale, della fisica, della cultura pop, e del senso dell'umorismo. Se "${current}" è chiaramente più forte o logicamente sconfigge/distrugge/invalida "${previous}", allora vince.
L'input "${current}" potrebbe essere una frase o una cosa specifica. Sii giusto, divertente, e coerente.

Rispondi in formato JSON con:
wins: true se vince, false altrimenti.
explanation: Spiegazione breve (max 2 frasi) e divertente in italiano sul perché ha vinto o ha perso.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          wins: { type: Type.BOOLEAN, description: 'True se current batte previous.' },
          explanation: { type: Type.STRING, description: 'Spiegazione divertente in italiano.' },
        },
        required: ['wins', 'explanation'],
      },
    },
  });

  return JSON.parse(response.text || '{}') as BattleResult;
}
