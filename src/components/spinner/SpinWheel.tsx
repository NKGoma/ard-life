'use client';
import { useRef, useCallback, useState, useEffect, memo, useMemo } from 'react';

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

    const result = Math.floor(Math.random() * 6) + 1;
    const totalRotation = 1440 + (result - 1) * 60 + Math.random() * 30;
    const duration = 2500;
    const start = performance.now();
    const startAngle = currentAngle;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const angle = startAngle + totalRotation * eased;
      setCurrentAngle(angle);

      if (progress < 1) {
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
  const segColors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#9B59B6', '#E67E22'];

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
  }), []);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Spinner */}
      <div className="relative w-56 h-56 md:w-72 md:h-72">
        {/* Arrow pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10
          w-0 h-0 border-l-[14px] border-r-[14px] border-t-[24px]
          border-l-transparent border-r-transparent border-t-white drop-shadow-lg" />

        {/* Wheel */}
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-2xl"
          style={{ transform: `rotate(${currentAngle}deg)`, transition: spinning ? 'none' : undefined }}
        >
          {svgSegments.map(({ num, x1, y1, x2, y2, tx, ty, color }) => (
              <g key={num}>
                <path
                  d={`M100,100 L${x1},${y1} A90,90 0 0,1 ${x2},${y2} Z`}
                  fill={color}
                  stroke="#fff"
                  strokeWidth="2"
                />
                <text
                  x={tx} y={ty}
                  textAnchor="middle" dominantBaseline="central"
                  fill="white" fontWeight="bold" fontSize="24"
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.4)' }}
                >
                  {num}
                </text>
              </g>
            ))}
          {/* Center circle */}
          <circle cx="100" cy="100" r="18" fill="#1e293b" stroke="#fff" strokeWidth="3" />
          <text x="100" y="100" textAnchor="middle" dominantBaseline="central"
            fill="white" fontSize="10" fontWeight="bold">
            DREH
          </text>
        </svg>
      </div>

      {/* Result display */}
      {displayValue && (
        <div className="text-3xl font-bold text-white animate-bounce">
          🎯 {displayValue}
        </div>
      )}

      {/* Spin button */}
      <button
        onClick={spin}
        disabled={spinning || disabled}
        className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-orange-500
          text-slate-900 font-bold rounded-xl text-lg
          hover:from-yellow-300 hover:to-orange-400
          disabled:opacity-50 disabled:cursor-not-allowed
          transform hover:scale-105 active:scale-95 transition-all
          shadow-lg hover:shadow-xl"
      >
        {spinning ? '🌀 Dreht...' : '🎰 Drehen!'}
      </button>
    </div>
  );
});
