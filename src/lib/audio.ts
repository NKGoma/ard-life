// Web Audio API synthesized sound effects — no audio files needed
// Ported from ARD-Spiel (NKGoma/ARD-Spiel)

let _audioCtx: AudioContext | null = null;
let _muted = false;

export function setMuted(val: boolean) { _muted = val; }
export function isMuted() { return _muted; }

function getAudioCtx(): AudioContext | null {
  if (!_audioCtx) {
    try {
      _audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch (e) {}
  }
  return _audioCtx;
}

function playTone(freq: number, type: OscillatorType, duration: number, gain = 0.3, startDelay = 0) {
  if (_muted) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();
    osc.connect(vol);
    vol.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    const t = ctx.currentTime + startDelay;
    vol.gain.setValueAtTime(0, t);
    vol.gain.linearRampToValueAtTime(gain, t + 0.012);
    vol.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  } catch (e) {}
}

export function synthCorrect() { [523, 659, 784].forEach((f, i) => playTone(f, 'sine', 0.2, 0.22, i * 0.08)); }
export function synthWrong() { playTone(330, 'sawtooth', 0.25, 0.14, 0); playTone(247, 'sawtooth', 0.3, 0.12, 0.12); }
export function synthRoll() { [330, 415, 523].forEach((f, i) => playTone(f, 'sine', 0.15, 0.15, i * 0.06)); }
export function synthTick() { playTone(1400, 'square', 0.018, 0.035); }
export function synthEvent() { [261, 329, 392].forEach((f, i) => playTone(f, 'sine', 0.3, 0.2, i * 0.1)); }
export function synthSpin() { [220, 277, 330, 415, 523, 659, 784, 1047].forEach((f, i) => playTone(f, 'sine', 0.14, 0.16, i * 0.07)); }
export function synthWin() { [261, 329, 392, 523, 659, 784, 1047].forEach((f, i) => playTone(f, 'sine', 0.5, 0.2, i * 0.08)); }
