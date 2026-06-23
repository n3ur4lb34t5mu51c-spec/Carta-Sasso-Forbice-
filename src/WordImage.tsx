import React, { useEffect, useState } from 'react';
import { getWordImage } from './wikiImage';
import { getEmoji } from './emoji';

/**
 * Mostra una vera immagine presa da Wikipedia per la parola data (gratis,
 * nessuna chiave API). Se Wikipedia non ha nulla (parola inventata,
 * astratta, o senza voce), mostra automaticamente una grande emoji a tema
 * come fallback: l'interfaccia non resta mai vuota o rotta.
 */
export default function WordImage({ word, size = 56 }: { word: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'found' | 'none'>('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setSrc(null);
    getWordImage(word).then(url => {
      if (cancelled) return;
      if (url) {
        setSrc(url);
        setStatus('found');
      } else {
        setStatus('none');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [word]);

  const boxStyle = { width: size, height: size };

  if (status === 'found' && src) {
    return (
      <img
        src={src}
        alt={word}
        loading="lazy"
        onError={() => setStatus('none')}
        style={boxStyle}
        className="rounded-xl object-cover shrink-0 border border-neutral-200 bg-white"
      />
    );
  }

  return (
    <div
      style={{ ...boxStyle, fontSize: size * 0.55 }}
      className="rounded-xl shrink-0 border border-neutral-200 bg-neutral-50 flex items-center justify-center leading-none"
    >
      {getEmoji(word)}
    </div>
  );
}
