import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.post('/api/judge', async (req, res) => {
  try {
    const { previous, current } = req.body;

    if (!previous || !current) {
      return res.status(400).json({ error: 'Missing previous or current item.' });
    }

    const prompt = `Devi fare il giudice del gioco "Cosa batte sasso?" (What beats rock).
L'utente sta cercando di battere "${previous}" usando "${current}".
Decidi se è logicamente sensato, esilarante o creativamente convincente che "${current}" batta "${previous}". Considera le regole della vita reale, della fisica, della cultura pop, e del senso dell'umorismo. Se "${current}" è chiaramente più forte o logicamente sconfigge/distrugge/invalida "${previous}", allora vince.
L'input "${current}" potrebbe essere una frase o una cosa specifica. Sii giusto, divertente, e coerente.

Rispondi in formato JSON con:
wins: true se vince, false altrimenti.
explanation: Spiegazione breve (max 2 frasi) e divertente in italiano sul perché ha vinto o ha perso.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            wins: { type: Type.BOOLEAN, description: "True se current batte previous." },
            explanation: { type: Type.STRING, description: "Spiegazione divertente in italiano." }
          },
          required: ["wins", "explanation"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    res.json(result);
  } catch (error) {
    console.error('Error evaluating battle:', error);
    res.status(500).json({ error: 'Errore interno. Il giudice è andato in pausa caffè.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
