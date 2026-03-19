'use client';
import { useState } from 'react';
import Particles from '@/components/Particles';
import IntroCarousel from '@/components/IntroCarousel';

export default function Home() {
  const [showCarousel, setShowCarousel] = useState(false);

  return (
    <>
      <style>{`
        @keyframes badgeDrop {
          from { transform: scale(0.4) translateY(-20px); opacity: 0; }
          to   { transform: scale(1) translateY(0);       opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .btn-start:hover  { transform: scale(1.03); box-shadow: 0 6px 20px rgba(0,90,159,0.55) !important; }
        .btn-start:active { transform: scale(0.97); }
      `}</style>

      <div style={{
        position: 'relative',
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        overflow: 'hidden',
        background: [
          'radial-gradient(ellipse at 20% 70%, rgba(0,90,159,0.22) 0%, transparent 55%)',
          'radial-gradient(ellipse at 80% 30%, rgba(10,110,209,0.1) 0%, transparent 50%)',
          'radial-gradient(ellipse at 50% 50%, rgba(0,30,80,0.35) 0%, transparent 70%)',
          '#0F1115',
        ].join(', '),
        fontFamily: 'var(--font-inter), "Helvetica Neue", Arial, sans-serif',
      }}>
        <Particles />

        <div style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          {/* ARD Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#005A9F',
            color: '#fff',
            fontWeight: 900,
            fontSize: 13,
            letterSpacing: 2,
            padding: '5px 10px',
            borderRadius: 4,
            lineHeight: 1,
            boxShadow: '0 2px 10px rgba(0,52,120,0.5)',
            animation: 'badgeDrop 0.6s cubic-bezier(0.34,1.56,0.64,1) both',
          }}>ARD</div>

          {/* Title */}
          <h1 style={{
            fontSize: 'clamp(52px, 13vw, 82px)',
            fontWeight: 900,
            color: '#fff',
            letterSpacing: '-3px',
            lineHeight: 1,
            textShadow: '0 0 40px rgba(0,90,159,0.4), 0 0 80px rgba(0,52,120,0.2)',
            animation: 'fadeUp 0.8s 0.2s ease both',
            marginTop: 8,
            marginBottom: 0,
          }}>
            ard<span style={{ color: '#4A9EFF' }}>.</span>life
          </h1>

          {/* Tagline */}
          <p style={{
            fontSize: 15,
            color: 'rgba(255,255,255,0.52)',
            letterSpacing: '0.5px',
            animation: 'fadeUp 0.8s 0.35s ease both',
            marginTop: 6,
            marginBottom: 0,
          }}>Das Wissensduell</p>

          {/* Sub */}
          <p style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.25)',
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            animation: 'fadeUp 0.8s 0.45s ease both',
            marginTop: 10,
            marginBottom: 0,
          }}>2–4 Spieler · Stehle Punkte · Werde Champion</p>

          {/* Buttons */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 12, marginTop: 28,
            animation: 'fadeUp 0.8s 0.6s ease both',
          }}>
            <button
              className="btn-start"
              onClick={() => setShowCarousel(true)}
              style={{
                padding: '12px 32px',
                background: '#005A9F',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.3px',
                transition: 'transform 200ms ease-out, box-shadow 200ms ease-out',
                boxShadow: '0 4px 12px rgba(0,90,159,0.4)',
                fontFamily: 'inherit',
              }}
            >
              Neues Spiel ›
            </button>

            <button
              onClick={() => setShowCarousel(true)}
              style={{
                background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.3)',
                fontSize: 12, cursor: 'pointer',
                letterSpacing: '0.5px', fontFamily: 'inherit',
              }}
            >
              Wie spielt man?
            </button>
          </div>
        </div>
      </div>

      {showCarousel && <IntroCarousel onClose={() => setShowCarousel(false)} />}
    </>
  );
}
