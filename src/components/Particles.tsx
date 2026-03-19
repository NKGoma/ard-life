'use client';
import { useEffect, useRef } from 'react';

export default function Particles() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    for (let i = 0; i < 22; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const sz = 2 + Math.random() * 4;
      const blue = Math.random() > 0.4;
      p.style.cssText = `
        width:${sz}px;height:${sz}px;
        left:${(Math.random() * 100).toFixed(1)}%;
        bottom:${(Math.random() * 40).toFixed(1)}%;
        background:${blue
          ? `rgba(0,100,255,${(0.3 + Math.random() * 0.5).toFixed(2)})`
          : `rgba(255,255,255,${(0.2 + Math.random() * 0.4).toFixed(2)})`};
        animation-delay:${(Math.random() * 12).toFixed(2)}s;
        animation-duration:${(8 + Math.random() * 9).toFixed(2)}s;
      `;
      c.appendChild(p);
    }
    return () => { if (c) c.innerHTML = ''; };
  }, []);

  return <div ref={ref} className="particles" />;
}
