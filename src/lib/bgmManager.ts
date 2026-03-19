// Module-level singleton — lives outside React's lifecycle, survives page navigation.

const MUTE_KEY = 'ard_life_muted';
const THEME_VOL = 0.7;
const INSTRUMENTAL_VOL = 0.2;

let _theme: HTMLAudioElement | null = null;
let _instrumental: HTMLAudioElement | null = null;
let _savedThemePos = 0; // playback position handed off from theme → instrumental
let _videoWasPlayingTheme = false;
let _videoWasPlayingInstrumental = false;

function isMuted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(MUTE_KEY) === 'true';
}

function getTheme(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!_theme) {
    _theme = new Audio('/bgm/ard_life_theme.mp3');
    _theme.loop = true;
  }
  return _theme;
}

function getInstrumental(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!_instrumental) {
    _instrumental = new Audio('/bgm/ard_life_instrumental.mp3');
    _instrumental.loop = true;
  }
  return _instrumental;
}

function tryPlay(audio: HTMLAudioElement) {
  audio.play().catch(() => {
    const resume = () => {
      audio.play().catch(() => {});
      document.removeEventListener('click', resume);
      document.removeEventListener('keydown', resume);
    };
    document.addEventListener('click', resume, { once: true });
    document.addEventListener('keydown', resume, { once: true });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export function playTheme() {
  const t = getTheme();
  if (!t) return;
  t.volume = isMuted() ? 0 : THEME_VOL;
  tryPlay(t);
}

/** Pauses the theme and saves the playback position for handoff. */
export function stopTheme() {
  const t = getTheme();
  if (!t) return;
  _savedThemePos = t.currentTime;
  t.pause();
}

/**
 * Starts the instrumental at the position where the theme stopped,
 * so the beat feels continuous.
 */
export function playInstrumental() {
  const i = getInstrumental();
  if (!i) return;
  i.volume = isMuted() ? 0 : INSTRUMENTAL_VOL;

  const start = () => {
    // If the files are different lengths, wrap the position.
    if (isFinite(i.duration) && i.duration > 0) {
      i.currentTime = _savedThemePos % i.duration;
    } else {
      i.currentTime = _savedThemePos;
    }
    tryPlay(i);
  };

  if (i.readyState >= 1 /* HAVE_METADATA */) {
    start();
  } else {
    // Metadata not yet loaded — trigger load and wait.
    i.addEventListener('loadedmetadata', start, { once: true });
    i.load();
  }
}

export function stopInstrumental() {
  getInstrumental()?.pause();
}

export function getMuted(): boolean {
  return isMuted();
}

export function applyMute(muted: boolean) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MUTE_KEY, String(muted));
  }
  const t = getTheme();
  const i = getInstrumental();
  if (t) t.volume = muted ? 0 : THEME_VOL;
  if (i) i.volume = muted ? 0 : INSTRUMENTAL_VOL;
}

/** Temporarily pause BGM while a video plays. Does NOT change the stored mute preference. */
export function pauseForVideo() {
  const t = getTheme();
  const i = getInstrumental();
  _videoWasPlayingTheme = !!t && !t.paused;
  _videoWasPlayingInstrumental = !!i && !i.paused;
  t?.pause();
  i?.pause();
}

/** Resume whichever BGM tracks were playing before pauseForVideo() was called. */
export function resumeAfterVideo() {
  if (_videoWasPlayingTheme) { const t = getTheme(); if (t) tryPlay(t); }
  if (_videoWasPlayingInstrumental) { const i = getInstrumental(); if (i) tryPlay(i); }
  _videoWasPlayingTheme = false;
  _videoWasPlayingInstrumental = false;
}
