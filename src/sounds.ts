/**
 * Piccoli effetti sonori generati al volo con la Web Audio API.
 * Nessun file da scaricare, nessuna dipendenza esterna: tutto sintetizzato
 * in tempo reale con semplici oscillatori.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') {
      // Va "risvegliato" da un gesto dell'utente: qui i suoni partono
      // sempre in risposta a un click/submit, quindi va bene.
      ctx.resume();
    }
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  freq: number,
  duration: number,
  startTime: number,
  type: OscillatorType = 'sine',
  gainPeak = 0.12
) {
  const audioCtx = getCtx();
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = audioCtx.currentTime + startTime;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(gainPeak, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.03);
}

export function playClick() {
  tone(620, 0.05, 0, 'square', 0.07);
}

export function playStart() {
  tone(440, 0.1, 0, 'sine', 0.12);
  tone(660, 0.15, 0.1, 'sine', 0.12);
}

export function playWin() {
  tone(523.25, 0.12, 0, 'triangle', 0.14); // Do
  tone(659.25, 0.12, 0.1, 'triangle', 0.14); // Mi
  tone(783.99, 0.22, 0.2, 'triangle', 0.14); // Sol
}

export function playLose() {
  tone(300, 0.18, 0, 'sawtooth', 0.1);
  tone(220, 0.28, 0.15, 'sawtooth', 0.1);
}
