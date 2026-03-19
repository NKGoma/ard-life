'use client';
import { useRef, useCallback, useState, useEffect, memo, useMemo } from 'react';
import { synthSpin, synthRoll } from '@/lib/audio';

interface SpinWheelProps {
  onResult: (value: number) => void;
  disabled?: boolean;
}

export default memo(function SpinWheel({ onResult, disabled }: SpinWheelProps) {
  const [spinning, setSpinning] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [displayValue, setDisplayValue] = useState<number | null>(null);
  const animRef = useRef<number>(0);

  const spin = useCallback(() => {
    if (spinning || disabled) return;
    setSpinning(true);
    setDisplayValue(null);
    synthSpin();

    const result = Math.floor(Math.random() * 6) + 1;

    // Fix: calculate the exact angle needed so the arrow points at the correct segment.
    // Segment i (0-indexed) has its center at (-60 + i*60)° in the unrotated wheel.
    // The arrow is fixed at the top (270° in standard coords).
    // For result r, we need: (currentAngle + totalRotation) mod 360 = target
    // where target = (390 - r * 60 + 3600) % 360
    const currentMod = ((currentAngle % 360) + 360) % 360;
    const target = (390 - result * 60 + 3600) % 360;
    let delta = target - currentMod;
    if (delta <= 0) delta += 360; // always spin forward
    const totalRotation = 1440 + delta + (Math.random() * 20 - 10);

    const duration = 2500;
    const start = performance.now();
    const startAngle = currentAngle;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const angle = startAngle + totalRotation * eased;
      setCurrentAngle(angle);

      if (progress < 1) {
        if (Math.floor(elapsed / 150) > Math.floor((elapsed - 16) / 150)) synthRoll();
        animRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        setDisplayValue(result);
        onResult(result);
      }
    };

    animRef.current = requestAnimationFrame(animate);
  }, [spinning, disabled, currentAngle, onResult]);

  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  const segments = [1, 2, 3, 4, 5, 6];
  // Richer, deeper colors to match the dark ARD theme
  const segColors = ['#E05252', '#D4A017', '#3D9E5F', '#2B7CC4', '#7B4FA6', '#C4682A'];

  const svgSegments = useMemo(() => segments.map((num, i) => {
    const startAngle = i * 60 - 90;
    const endAngle = startAngle + 60;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = 100 + 90 * Math.cos(startRad);
    const y1 = 100 + 90 * Math.sin(startRad);
    const x2 = 100 + 90 * Math.cos(endRad);
    const y2 = 100 + 90 * Math.sin(endRad);
    const midRad = ((startAngle + 30) * Math.PI) / 180;
    const tx = 100 + 60 * Math.cos(midRad);
    const ty = 100 + 60 * Math.sin(midRad);
    return { num, x1, y1, x2, y2, tx, ty, color: segColors[i] };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Spinner */}
      <div className="relative w-56 h-56 md:w-72 md:h-72">
        {/* Arrow pointer with blue glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10
            w-0 h-0 border-l-[14px] border-r-[14px] border-t-[24px]
            border-l-transparent border-r-transparent border-t-white"
          style={{ filter: 'drop-shadow(0 2px 6px #4A9EFF)' }}
        />

        {/* Wheel */}
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          style={{
            transform: `rotate(${currentAngle}deg)`,
            transition: spinning ? 'none' : undefined,
            filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.6))',
          }}
        >
          {svgSegments.map(({ num, x1, y1, x2, y2, tx, ty, color }) => (
            <g key={num}>
              <path
                d={`M100,100 L${x1},${y1} A90,90 0 0,1 ${x2},${y2} Z`}
                fill={color}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1.5"
              />
              <text
                x={tx} y={ty}
                textAnchor="middle" dominantBaseline="central"
                fill="white" fontWeight="bold" fontSize="26"
                style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))' }}
              >
                {num}
              </text>
            </g>
          ))}
          {/* Center circle */}
          <circle cx="100" cy="100" r="18" fill="#0F1115" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          <text x="100" y="100" textAnchor="middle" dominantBaseline="central"
            fill="rgba(255,255,255,0.6)" fontSize="9" fontWeight="700" letterSpacing="0.5">
            DREH
          </text>
        </svg>
      </div>

      {/* Result display */}
      {displayValue && (
        <div
          className="text-3xl font-bold text-white animate-[fadeIn_0.4s_ease-out]"
          style={{ textShadow: '0 0 20px rgba(74,158,255,0.8)' }}
        >
          {displayValue}
        </div>
      )}

      {/* Spin button — ARD blue */}
      <button
        onClick={spin}
        disabled={spinning || disabled}
        style={{
          padding: '10px 32px',
          background: spinning ? '#004880' : '#005A9F',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontSize: 16,
          fontWeight: 700,
          cursor: spinning || disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'background 200ms ease, transform 150ms ease, box-shadow 200ms ease',
          boxShadow: '0 4px 12px rgba(0,90,159,0.4)',
          letterSpacing: '0.3px',
        }}
        onMouseEnter={e => { if (!spinning && !disabled) (e.target as HTMLButtonElement).style.background = '#0A6ED1'; }}
        onMouseLeave={e => { if (!spinning && !disabled) (e.target as HTMLButtonElement).style.background = '#005A9F'; }}
      >
        {spinning ? 'Dreht...' : '🎰 Drehen!'}
      </button>
    </div>
  );
});
