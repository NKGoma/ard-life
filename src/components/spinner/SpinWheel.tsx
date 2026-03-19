'use client';
import { useRef, useCallback, useState, useEffect, memo, useMemo } from 'react';
import { synthSpin, synthRoll } from '@/lib/audio';

interface SpinWheelProps {
  onResult: (value: number) => void;
  disabled?: boolean;
}

const SEGMENTS = 6;
const SEGMENT_ANGLE = 360 / SEGMENTS;
// Rainbow ring colors for 6 segments
const SEG_COLORS = [
  '#E53935', '#FB8C00', '#FDD835', '#43A047', '#1E88E5', '#8E24AA',
];

export default memo(function SpinWheel({ onResult, disabled }: SpinWheelProps) {
  const [spinning, setSpinning] = useState(false);
  const [flickerAngle, setFlickerAngle] = useState(0);
  const [displayValue, setDisplayValue] = useState<number | null>(null);
  const animRef = useRef<number>(0);

  const spin = useCallback(() => {
    if (spinning || disabled) return;
    setSpinning(true);
    setDisplayValue(null);
    synthSpin();

    const result = Math.floor(Math.random() * 6) + 1;

    // The flicker (white petal pointer) rotates. The stopper is at top (segment 1 at top = -90°).
    // Segment i center is at i * 36° from top.
    const targetSegCenter = (result - 1) * SEGMENT_ANGLE;
    const jitter = (Math.random() - 0.5) * (SEGMENT_ANGLE * 0.5);
    const targetAngle = targetSegCenter + jitter;

    const currentMod = ((flickerAngle % 360) + 360) % 360;
    let delta = targetAngle - currentMod;
    if (delta <= 0) delta += 360;
    const totalRotation = 2160 + delta; // 6 full spins + landing

    const duration = 3200;
    const start = performance.now();
    const startAngle = flickerAngle;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3.5);
      const angle = startAngle + totalRotation * eased;
      setFlickerAngle(angle);

      if (progress < 1) {
        if (Math.floor(elapsed / 100) > Math.floor((elapsed - 16) / 100)) synthRoll();
        animRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        setDisplayValue(result);
        onResult(result);
      }
    };

    animRef.current = requestAnimationFrame(animate);
  }, [spinning, disabled, flickerAngle, onResult]);

  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  // Pre-compute color ring segments (annular wedges between inner and outer radius)
  const svgSegments = useMemo(() => {
    const cx = 120, cy = 120;
    const R_outer = 82; // outer edge of color ring
    const R_inner = 50; // inner edge of color ring
    return Array.from({ length: SEGMENTS }, (_, i) => {
      const a0 = (i * SEGMENT_ANGLE - 90) * Math.PI / 180;
      const a1 = ((i + 1) * SEGMENT_ANGLE - 90) * Math.PI / 180;
      // Outer arc points
      const ox1 = cx + R_outer * Math.cos(a0);
      const oy1 = cy + R_outer * Math.sin(a0);
      const ox2 = cx + R_outer * Math.cos(a1);
      const oy2 = cy + R_outer * Math.sin(a1);
      // Inner arc points
      const ix1 = cx + R_inner * Math.cos(a0);
      const iy1 = cy + R_inner * Math.sin(a0);
      const ix2 = cx + R_inner * Math.cos(a1);
      const iy2 = cy + R_inner * Math.sin(a1);
      // Number position on outer white ring
      const midA = ((i + 0.5) * SEGMENT_ANGLE - 90) * Math.PI / 180;
      const numR = 100; // number radius
      const nx = cx + numR * Math.cos(midA);
      const ny = cy + numR * Math.sin(midA);
      const textRot = (i + 0.5) * SEGMENT_ANGLE;
      return {
        num: i + 1,
        // Annular wedge path: outer arc CW, then inner arc CCW
        path: `M${ox1},${oy1} A${R_outer},${R_outer} 0 0,1 ${ox2},${oy2} L${ix2},${iy2} A${R_inner},${R_inner} 0 0,0 ${ix1},${iy1} Z`,
        nx, ny, textRot,
        color: SEG_COLORS[i],
      };
    });
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Classic Spiel des Lebens spinner */}
      <div
        className="relative cursor-pointer"
        style={{ width: 260, height: 280 }}
        onClick={spin}
      >
        <svg viewBox="0 0 240 260" className="w-full h-full" style={{ userSelect: 'none' }}>
          {/* Gray plastic base / housing */}
          <ellipse cx="120" cy="135" rx="118" ry="125" fill="#9e9e9e" />
          <ellipse cx="120" cy="132" rx="115" ry="122" fill="#b0b0b0" />
          <ellipse cx="120" cy="130" rx="112" ry="118"
            fill="url(#baseGradient)" stroke="#888" strokeWidth="1.5" />

          {/* Gradient for base */}
          <defs>
            <radialGradient id="baseGradient" cx="45%" cy="40%">
              <stop offset="0%" stopColor="#c8c8c8" />
              <stop offset="100%" stopColor="#8a8a8a" />
            </radialGradient>
          </defs>

          {/* White outer number ring */}
          <circle cx="120" cy="120" r="108" fill="#f5f0e8" stroke="#ccc" strokeWidth="1" />
          <circle cx="120" cy="120" r="84" fill="none" stroke="#ddd" strokeWidth="0.5" />

          {/* Color ring segments */}
          {svgSegments.map(({ num, path, nx, ny, textRot, color }) => (
            <g key={num}>
              <path d={path} fill={color} stroke="#f5f0e8" strokeWidth="1.5" />
              {/* Number on outer white ring */}
              <text
                x={nx} y={ny}
                textAnchor="middle" dominantBaseline="central"
                fill="#333" fontWeight="bold" fontSize="16"
                fontFamily="Georgia, serif"
                transform={`rotate(${textRot}, ${nx}, ${ny})`}
                style={{ userSelect: 'none' }}
              >
                {num}
              </text>
            </g>
          ))}

          {/* Inner white disc */}
          <circle cx="120" cy="120" r="48" fill="#f5f0e8" stroke="#ddd" strokeWidth="0.5" />

          {/* Spinning single arrow pointer */}
          <g style={{ transform: `rotate(${flickerAngle}deg)`, transformOrigin: '120px 120px' }}>
            {/* Arrow shaft */}
            <rect x="115" y="38" width="10" height="82" rx="4" fill="#d4d0c4" stroke="#b0a890" strokeWidth="1" />
            {/* Arrow head */}
            <polygon points="105,44 135,44 120,18" fill="#c0b898" stroke="#a09878" strokeWidth="1" />
            <polygon points="110,43 130,43 120,24" fill="#d4d0c4" />
          </g>

          {/* Center knob */}
          <circle cx="120" cy="120" r="14" fill="url(#knobGradient)" stroke="#bbb" strokeWidth="1" />
          <circle cx="120" cy="120" r="8" fill="#e8e0d0" />
          <circle cx="118" cy="118" r="3" fill="#f5f0e8" opacity="0.6" />

          <defs>
            <radialGradient id="knobGradient" cx="40%" cy="35%">
              <stop offset="0%" stopColor="#f5f2ec" />
              <stop offset="100%" stopColor="#c5bda8" />
            </radialGradient>
          </defs>

          {/* Stopper notch at top */}
          <polygon points="120,8 114,20 126,20" fill="#888" stroke="#777" strokeWidth="0.5" />
          <polygon points="120,10 116,19 124,19" fill="#aaa" />
        </svg>
      </div>

      {/* Result display */}
      {displayValue && (
        <div
          className="text-3xl font-bold text-white animate-[fadeIn_0.4s_ease-out]"
          style={{ textShadow: '0 0 20px rgba(74,158,255,0.8)' }}
        >
          {displayValue} {displayValue === 1 ? 'Feld' : 'Felder'}
        </div>
      )}

      {/* Spin button */}
      <button
        onClick={spin}
        disabled={spinning || disabled}
        className={`px-8 py-3 rounded-xl font-bold text-lg transition-all ${
          spinning || disabled
            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 cursor-pointer'
        }`}
      >
        {spinning ? 'Dreht...' : '🎰 Drehen!'}
      </button>
    </div>
  );
});
