/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GameItem, BattleResult } from './types';
import { RefreshCcw, ArrowRight, Trophy, Sparkles, Share2, Medal, Activity, Check, Shuffle, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { judgeBattle } from './gemini';
import WordImage from './WordImage';
import { avatarUrl, randomAvatarSeed } from './avatar';
import { signResult, verifyResult } from './signature';

type SharedResult = { name: string; score: number; avatarSeed: string } | null;

// Legge i parametri dell'URL UNA SOLA VOLTA all'avvio: se qualcuno ha
// aperto un link condiviso da un amico, qui dentro trova nome/punti/avatar.
// Se la firma non corrisponde (link modificato a mano), il link viene
// ignorato e si comporta come se non ci fosse nessun parametro.
function readSharedResultFromUrl(): SharedResult {
  const params = new URLSearchParams(window.location.search);
  const scoreStr = params.get('punti');
  const name = params.get('nome');
  const avatarSeed = params.get('avatarSeed');
  const firma = params.get('firma');

  if (scoreStr !== null && name && avatarSeed && verifyResult(name, scoreStr, avatarSeed, firma)) {
    return {
      name: name.slice(0, 30),
      score: Math.max(0, parseInt(scoreStr, 10) || 0),
      avatarSeed,
    };
  }
  return null;
}

export default function App() {
  const [sharedResult, setSharedResult] = useState<SharedResult>(() => readSharedResultFromUrl());
  const [view, setView] = useState<'shared' | 'setup' | 'playing'>(() => (sharedResult ? 'shared' : 'setup'));

  const [playerName, setPlayerName] = useState('');
  const [avatarSeed, setAvatarSeed] = useState(() => randomAvatarSeed());

  const [history, setHistory] = useState<GameItem[]>([
    { id: 'initial', name: 'sasso' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [totalMoves, setTotalMoves] = useState(0);
  const [sessionRecord, setSessionRecord] = useState(0);
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  const currentItem = history[history.length - (gameOver ? 2 : 1)] || history[0];

  const score = useMemo(() => {
    return history.filter(item => item.id !== 'initial' && !item.isLoss).length;
  }, [history]);

  useEffect(() => {
    if (score > sessionRecord) {
      setSessionRecord(score);
    }
  }, [score, sessionRecord]);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (view === 'playing' && !isLoading && !gameOver) {
      inputRef.current?.focus();
    }
  }, [view, isLoading, gameOver]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentStr = inputValue.trim().toLowerCase();
    if (!currentStr || isLoading || gameOver) return;

    setIsLoading(true);
    try {
      const data: BattleResult = await judgeBattle(currentItem.name, currentStr, score);

      const newItem: GameItem = {
        id: Date.now().toString(),
        name: currentStr,
        explanation: data.explanation,
        isLoss: !data.wins
      };

      setHistory(prev => [...prev, newItem]);
      setTotalMoves(prev => prev + 1);

      if (!data.wins) {
        setGameOver(true);
      } else {
        setInputValue('');
      }

    } catch (err) {
      console.error(err);
      alert('Si è verificato un errore di connessione col giudice. Riprova!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBeginFromSetup = () => {
    setView('playing');
  };

  const handlePlayTooFromSharedCard = () => {
    // Puliamo l'URL (così non resta il punteggio dell'amico) e passiamo
    // alla schermata di setup per il nuovo giocatore.
    window.history.replaceState(null, '', window.location.pathname);
    setSharedResult(null);
    setView('setup');
  };

  const handleRestart = () => {
    setHistory([{ id: Date.now().toString(), name: 'sasso' }]);
    setInputValue('');
    setGameOver(false);
    // Una nuova icona casuale ad ogni nuova partita.
    setAvatarSeed(randomAvatarSeed());
  };

  const handleShare = async () => {
    const finalName = playerName.trim() || 'Un giocatore';
    const scoreStr = String(score);
    const firma = signResult(finalName, scoreStr, avatarSeed);

    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('nome', finalName);
    url.searchParams.set('punti', scoreStr);
    url.searchParams.set('avatarSeed', avatarSeed);
    url.searchParams.set('firma', firma);
    const shareUrl = url.toString();

    const text = `${finalName} ha appena raggiunto un punteggio di ${score} a "Cosa Batte Sasso?"! 🪨📄✂️\nRiesci a fare di meglio?`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Cosa Batte Sasso?', text, url: shareUrl });
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
        console.warn('Condivisione nativa non riuscita, copio negli appunti:', err);
      }
    }

    try {
      await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  // Cronologia delle mosse vincenti (escludiamo quella iniziale e la perdita eventuale per il rendering della history in cima)
  const winningHistory = history.filter(item => !item.isLoss);

  // --- SCHERMATA: risultato condiviso da un amico ---
  if (view === 'shared' && sharedResult) {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, type: 'spring' }}
          className="bg-white border-2 border-neutral-100 rounded-3xl p-8 md:p-12 max-w-md w-full text-center shadow-xl"
        >
          <img
            src={avatarUrl(sharedResult.avatarSeed)}
            alt="Avatar"
            className="w-20 h-20 md:w-24 md:h-24 rounded-full mx-auto mb-4 bg-neutral-100 border border-neutral-200"
          />
          <h1 className="text-xl md:text-2xl font-bold mb-1">
            <span className="capitalize">{sharedResult.name}</span> ha giocato a
          </h1>
          <p className="text-2xl md:text-3xl font-black mb-6 tracking-tight">Cosa Batte Sasso? 🪨</p>
          <div className="bg-neutral-50 rounded-2xl p-6 mb-8 border border-neutral-100">
            <div className="text-5xl md:text-6xl font-black text-neutral-900">{sharedResult.score}</div>
            <div className="text-neutral-500 font-medium mt-1">punti totalizzati</div>
          </div>
          <button
            onClick={handlePlayTooFromSharedCard}
            className="w-full inline-flex items-center justify-center gap-3 bg-black text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-neutral-800 hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
          >
            <Play className="w-5 h-5" /> Gioca anche tu!
          </button>
        </motion.div>
      </div>
    );
  }

  // --- SCHERMATA: setup nome + icona prima di iniziare ---
  if (view === 'setup') {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white border-2 border-neutral-100 rounded-3xl p-8 md:p-12 max-w-md w-full text-center shadow-xl"
        >
          <h1 className="text-2xl md:text-3xl font-black mb-2 tracking-tight inline-flex items-center gap-2 justify-center">
            <Sparkles className="w-6 h-6" /> Cosa Batte Sasso?
          </h1>
          <p className="text-neutral-500 mb-8">Scegli un nome e la tua icona, poi gioca!</p>

          <div className="flex flex-col items-center mb-6">
            <img
              src={avatarUrl(avatarSeed)}
              alt="Avatar"
              className="w-24 h-24 rounded-full mb-3 bg-neutral-100 border border-neutral-200"
            />
            <button
              type="button"
              onClick={() => setAvatarSeed(randomAvatarSeed())}
              className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <Shuffle className="w-4 h-4" /> Cambia icona
            </button>
          </div>

          <input
            type="text"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            placeholder="Il tuo nome (opzionale)"
            maxLength={30}
            className="w-full text-lg font-medium p-4 rounded-2xl outline-none placeholder-neutral-300 bg-neutral-50 border border-neutral-200 mb-6 text-center focus:border-neutral-400 transition-colors"
            autoComplete="off"
          />

          <button
            onClick={handleBeginFromSetup}
            className="w-full inline-flex items-center justify-center gap-3 bg-black text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-neutral-800 hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
          >
            <Play className="w-5 h-5" /> Inizia a giocare
          </button>
        </motion.div>
      </div>
    );
  }

  // --- SCHERMATA: gioco ---
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-black selection:text-white flex flex-col md:h-screen md:overflow-hidden relative">
      <header className="py-4 md:py-6 px-4 md:px-8 flex justify-between items-center border-b border-neutral-200 bg-white shadow-sm z-10 shrink-0">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight inline-flex items-center gap-2">
          <img src={avatarUrl(avatarSeed)} alt="Avatar" className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200" />
          <span className="hidden sm:inline capitalize">{playerName.trim() || 'Cosa Batte Sasso?'}</span>
        </h1>
        <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-neutral-100 rounded-full font-medium text-sm md:text-base border border-neutral-200">
          <Trophy className="w-4 h-4 text-yellow-500" />
          Punteggio: {score}
        </div>
      </header>

      <main className="flex-1 flex flex-col pt-6 md:pt-10 px-4 md:px-8 max-w-4xl mx-auto w-full overflow-y-auto md:overflow-hidden relative">
        <div className="flex-1 flex flex-col h-full md:pb-24">

          {/* History List */}
          <div className="w-full max-w-2xl mx-auto flex-1 overflow-y-auto min-h-[150px] md:min-h-0 mb-4 md:mb-8 md:pr-4 no-scrollbar flex flex-col justify-end">
            <AnimatePresence initial={false}>
              {winningHistory.length > 1 && (
                <div className="flex flex-col gap-3">
                  {winningHistory.slice(1).map((item, i) => (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.4, type: "spring", bounce: 0.4 }}
                      key={item.id}
                      className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-neutral-100 flex items-center gap-3 w-full text-left"
                    >
                      <WordImage word={item.name} size={56} />
                      <div className="flex flex-col gap-1 flex-1">
                        <div className="flex items-center gap-2 text-neutral-400 font-semibold mb-1">
                          <span className="text-xs uppercase tracking-wider">Mossa {i + 1}</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                        <p className="font-bold text-lg text-neutral-800 capitalize leading-tight">
                          {item.name}
                        </p>
                        <p className="text-sm text-green-700 font-medium bg-green-50 px-2.5 py-1 rounded-lg inline-block w-fit">
                          {item.explanation || `Ha battuto ${winningHistory[i].name}!`}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Current Turn Input Area */}
          {!gameOver ? (
            <div className="flex flex-col items-center flex-shrink-0 bg-neutral-50/90 backdrop-blur-sm pb-8 pt-4 sticky bottom-0 z-10 md:static border-t border-neutral-200/50 md:border-t-0 -mx-4 px-4 md:px-0 md:bg-transparent md:backdrop-blur-none rounded-t-3xl md:rounded-none mt-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentItem.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center"
                >
                  <div className="mb-2">
                    <WordImage word={currentItem.name} size={88} />
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black mb-4 uppercase tracking-tighter text-center">
                    Cosa batte <br className="md:hidden" />
                    <span className="text-blue-600 underline decoration-blue-300 underline-offset-4">{currentItem.name}</span>?
                  </h2>
                </motion.div>
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.form
                  key={`form-${currentItem.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  onSubmit={handleSubmit}
                  className="w-full max-w-2xl md:mt-4 relative flex rounded-2xl shadow-xl focus-within:shadow-2xl transition-shadow bg-white ring-1 ring-neutral-200"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    placeholder="Scrivi qualcosa..."
                    className="w-full text-xl md:text-3xl font-medium p-4 md:p-6 rounded-l-2xl outline-none placeholder-neutral-300 bg-transparent"
                    disabled={isLoading || gameOver}
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isLoading || gameOver}
                    className="bg-black text-white px-6 md:px-10 rounded-r-2xl font-bold text-lg md:text-xl flex items-center justify-center hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Invia"
                  >
                    {isLoading ? (
                      <div className="w-6 h-6 md:w-8 md:h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <ArrowRight className="w-6 h-6 md:w-8 md:h-8" />
                    )}
                  </button>
                </motion.form>
              </AnimatePresence>

              <div className="h-6 mt-4 w-full text-center">
                {isLoading && (
                  <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-neutral-500 text-sm md:text-base font-medium animate-pulse"
                  >
                    Il giudice sta pensando...
                  </motion.p>
                )}
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="flex flex-col items-center py-6 mt-auto pb-12 flex-shrink-0 z-10 sticky bottom-0 bg-neutral-50 backdrop-blur-sm md:static md:bg-transparent -mx-4 px-4 md:px-0 rounded-t-3xl md:rounded-none shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.1)] md:shadow-none"
            >
              <h2 className="text-4xl md:text-6xl font-black text-red-500 mb-4 md:mb-6 uppercase tracking-tighter text-center">
                Fine Partita!
              </h2>

              <div className="bg-red-50 border-2 border-red-100 rounded-3xl p-5 md:p-8 w-full max-w-2xl text-center shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-200"></div>
                <div className="flex items-center justify-center gap-4 mb-3">
                  <WordImage word={history[history.length - 2].name} size={72} />
                  <span className="text-2xl text-red-300 font-black">vs</span>
                  <WordImage word={history[history.length - 1].name} size={72} />
                </div>
                <p className="text-xl md:text-3xl font-bold text-neutral-900 mb-2 leading-tight">
                  <span className="capitalize">{history[history.length - 1].name}</span>{" "}
                  <span className="text-red-500">non batte</span>{" "}
                  <span className="capitalize">{history[history.length - 2].name}</span>
                </p>
                <p className="text-base md:text-xl text-red-800 font-medium bg-white px-4 md:px-6 py-3 rounded-xl shadow-sm border border-red-50/50 inline-block mt-4 text-balance">
                  {history[history.length - 1].explanation}
                </p>
              </div>

              <div className="mt-8 md:mt-10 text-center w-full max-w-2xl">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <img src={avatarUrl(avatarSeed)} alt="Avatar" className="w-10 h-10 rounded-full bg-neutral-100 border border-neutral-200" />
                  <div className="text-4xl md:text-5xl font-black text-neutral-900">{score} <span className="text-2xl md:text-3xl text-neutral-400">punti</span></div>
                </div>
                <p className="text-neutral-500 font-medium mb-8">Partita fantastica, ma non è bastato.</p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                  <button
                    onClick={handleRestart}
                    className="w-full sm:w-auto group relative inline-flex items-center justify-center gap-3 bg-black text-white px-8 md:px-10 py-4 rounded-full font-bold text-lg md:text-xl hover:bg-neutral-800 hover:scale-[1.02] active:scale-95 transition-all shadow-xl hover:shadow-2xl"
                  >
                    <RefreshCcw className="w-5 h-5 md:w-6 md:h-6 group-hover:-rotate-90 transition-transform duration-500" />
                    Gioca Ancora
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-full sm:w-auto overflow-hidden relative inline-flex items-center justify-center gap-3 bg-white border-2 border-neutral-200 text-neutral-900 px-8 py-4 rounded-full font-bold text-lg hover:border-black hover:bg-neutral-50 active:scale-95 transition-all shadow-sm focus:outline-none"
                  >
                    <AnimatePresence mode="wait">
                      {showCopiedToast ? (
                        <motion.div
                          key="copied"
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-2 text-green-600"
                        >
                          <Check className="w-5 h-5" /> Copiato!
                        </motion.div>
                      ) : (
                        <motion.div
                          key="share"
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-2"
                        >
                          <Share2 className="w-5 h-5" /> Condividi
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer Tracker */}
      <footer className="shrink-0 bg-neutral-900 text-neutral-400 py-3 md:py-4 px-4 w-full flex flex-row items-center justify-center md:justify-between flex-wrap gap-4 text-xs md:text-sm font-medium z-20">
        <div className="flex gap-4 md:gap-6 items-center flex-wrap justify-center">
          <div className="flex items-center gap-1.5 bg-neutral-800 px-3 py-1.5 rounded-md text-neutral-300">
            <Activity className="w-4 h-4 text-blue-400" />
            <span>Mosse Totali: <strong className="text-white ml-1">{totalMoves}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 bg-neutral-800 px-3 py-1.5 rounded-md text-neutral-300">
            <Medal className="w-4 h-4 text-yellow-400" />
            <span>Record Sessione: <strong className="text-white ml-1">{sessionRecord}</strong></span>
          </div>
        </div>
        <div className="text-neutral-500 hidden md:block">
          Creato con intelligenza artificiale. Nessun sasso è stato maltrattato.
        </div>
      </footer>
    </div>
  );
}
