# 🪨 Cosa Batte Sasso?

Una versione italiana del gioco *What Beats Rock*, basata su AI (Gemini). Il giudice è un'IA che decide se la cosa che proponi batte quella precedente.

Sito statico React + Vite, pensato per essere ospitato su **GitHub Pages**. Le chiamate a Gemini partono direttamente dal browser (vedi `src/gemini.ts`).

## ⚠️ Nota sulla sicurezza della API key

Essendo un sito statico, non c'è un server che nasconda la API key: finisce nel bundle JS pubblico. Per limitare gli abusi:

1. Vai su [Google AI Studio](https://aistudio.google.com/apikey) o nella Google Cloud Console.
2. Apri le impostazioni della tua API key e **restringila per referrer HTTP**, indicando il dominio del tuo sito GitHub Pages, es. `https://tuoutente.github.io/*`.

## 🚀 Setup in locale

**Prerequisiti:** Node.js 20+

```bash
npm install
cp .env.example .env
# inserisci la tua key in .env -> VITE_GEMINI_API_KEY="..."
npm run dev
```

## 🌐 Deploy su GitHub Pages

Il repo include un workflow (`.github/workflows/deploy.yml`) che builda e pubblica il sito automaticamente ad ogni push su `main`.

1. Crea un repository su GitHub e carica questi file.
2. Vai su **Settings → Secrets and variables → Actions** e crea un secret chiamato `VITE_GEMINI_API_KEY` con la tua API key.
3. Vai su **Settings → Pages** e in "Build and deployment" seleziona come Source: **GitHub Actions**.
4. Fai push su `main`: il workflow builda con Vite e pubblica automaticamente.

Il sito sarà disponibile su `https://tuoutente.github.io/nome-repo/`.

## 🛠️ Stack

- React 19 + Vite 6 + TypeScript
- Tailwind CSS 4
- Motion (animazioni)
- Lucide React (icone)
- Gemini API (`@google/genai`) chiamata client-side
