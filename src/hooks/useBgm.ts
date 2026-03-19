'use client';
import { useEffect, useRef, useCallback, useState } from 'react';

const MUTE_KEY = 'ard_life_muted';

export function useBgm(src: string, volume = 0.6) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(MUTE_KEY) === 'true';
  });

  // Create audio element once on mount
  useEffect(() => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = muted ? 0 : volume;
    audioRef.current = audio;

    // Browsers require a user interaction before autoplay.
    // We attempt to play immediately; if it fails (autoplay policy),
    // the first user interaction will trigger play via the click listener.
    const tryPlay = () => {
      audio.play().catch(() => {
        // Autoplay blocked – wait for first interaction
        const resume = () => {
          audio.play().catch(() => {});
          document.removeEventListener('click', resume);
          document.removeEventListener('keydown', resume);
        };
        document.addEventListener('click', resume, { once: true });
        document.addEventListener('keydown', resume, { once: true });
      });
    };

    tryPlay();

    return () => {
      audio.pause();
      audio.src = '';
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // Sync volume/mute state to audio element
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = muted ? 0 : volume;
  }, [muted, volume]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      localStorage.setItem(MUTE_KEY, String(next));
      return next;
    });
  }, []);

  return { muted, toggleMute };
}
