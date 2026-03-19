'use client';
import { useEffect, useCallback, useState } from 'react';
import {
  playTheme, stopTheme,
  playInstrumental, stopInstrumental,
  getMuted, applyMute,
} from '@/lib/bgmManager';

type Track = 'theme' | 'instrumental';

export function useBgm(track: Track) {
  const [muted, setMutedState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return getMuted();
  });

  useEffect(() => {
    if (track === 'theme') {
      playTheme();
      return () => stopTheme();
    } else {
      playInstrumental();
      return () => stopInstrumental();
    }
  }, [track]);

  const toggleMute = useCallback(() => {
    setMutedState((prev) => {
      const next = !prev;
      applyMute(next);
      return next;
    });
  }, []);

  return { muted, toggleMute };
}

