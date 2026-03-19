'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  onClose: () => void;
}

const slides = [
  {
    type: 'intro' as const,
    title: 'Willkommen bei ard.life',
    lines: [
      'Täglich konsumieren wir Nachrichten, Meinungen und Inhalte — selten fragen wir: Wer zeigt mir das, und warum?',
      'In ard.life durchlebst du fünf Lebensphasen von der Kindheit bis ins hohe Alter. Du beantwortest Wissensfragen, triffst Entscheidungen bei unerwarteten Ereignissen und erlebst, wie Medien dein Denken, dein Vertrauen und deine Werte formen.',
      'Am Ende wartet dein persönliches Medienprofil — und die Antwort auf die Frage: Wie informiert bist du wirklich?',
    ],
  },
  {
    type: 'feature' as const,
    step: 'Schritt 1',
    icon: '🎲',
    title: 'Drehe das Rad',
    body: 'Das Rad bestimmt, wie weit du ziehst — 1 bis 6 Felder. Du durchläufst fünf Lebensphasen auf dem Spielfeld: von der Kindheit 🧒 bis zum Lebensabend 🌿. Jede Phase bringt neue Herausforderungen.',
    tags: [
      { label: '5 Lebensphasen', color: '#4A9EFF' },
      { label: '1–6 Felder pro Zug', color: 'rgba(255,255,255,0.3)' },
      { label: '2–4 Spieler', color: 'rgba(255,255,255,0.3)' },
    ],
    accent: '#2B7CC4',
  },
  {
    type: 'feature' as const,
    step: 'Schritt 2',
    icon: '❓',
    title: 'Beantworte Wissensfragen',
    body: 'Fragefelder testen dein Medienwissen — direkt, spezifisch, manchmal unbequem. Richtige Antworten bringen Punkte in deinen Lebenswerten. Falsche kosten. Schnell tippen lohnt sich nicht.',
    tags: [
      { label: '📚 Bildung', color: '#4D96FF' },
      { label: '🤝 Gemeinschaft', color: '#6BCB77' },
      { label: '✨ Glück', color: '#FFD93D' },
    ],
    accent: '#3D9E5F',
  },
  {
    type: 'feature' as const,
    step: 'Schritt 3',
    icon: '📰',
    title: 'Reagiere auf Ereignisse',
    body: 'Ereignisfelder werfen dir unerwartete Situationen vor die Füße — Fake News, Algorithmen, Filterblasen, Meinungsblasen. Du entscheidest, wie du reagierst. Jede Wahl hat Konsequenzen für deine Werte und deine nächsten Felder.',
    tags: [
      { label: '⚠️ Rückschläge', color: '#E05252' },
      { label: '🚀 Boosts', color: '#00BCD4' },
      { label: '🎲 Zufall', color: '#FF5722' },
    ],
    accent: '#D4A017',
  },
  {
    type: 'feature' as const,
    step: 'Schritt 4',
    icon: '⚔️',
    title: 'Duell — Punkte stehlen',
    body: 'Landest du auf einem Feld, das ein anderer Spieler besetzt, beginnt ein Duell. Beide beantworten dieselbe Frage — wer gewinnt, stiehlt Punkte. Wer verliert, geht leer aus. High Risk, High Reward.',
    tags: [
      { label: 'Punkte stehlen', color: '#E05252' },
      { label: 'Direkte Konfrontation', color: 'rgba(255,255,255,0.3)' },
      { label: 'High Risk', color: '#D4A017' },
    ],
    accent: '#E05252',
  },
  {
    type: 'feature' as const,
    step: 'Schritt 5',
    icon: '⭐',
    title: 'Meilensteine & Tokens',
    body: 'Besondere Felder schalten Tokens und Badges frei. Bildungsstern, Gemeinschafts-Badge, Glückstoken — sie bringen einmalige Boni und können im richtigen Moment das Blatt wenden. Erreiche Meilensteine für Sonderrechte.',
    tags: [
      { label: '🌟 Bildungsstern', color: '#4D96FF' },
      { label: '🏅 Gemeinschafts-Badge', color: '#6BCB77' },
      { label: '🍀 Glückstoken', color: '#FFD93D' },
    ],
    accent: '#7B4FA6',
  },
  {
    type: 'final' as const,
    icon: '📊',
    title: 'Dein Medienprofil',
    body: 'Nach fünf Lebensphasen werden alle deine Entscheidungen ausgewertet. Du erhältst ein persönliches Medienprofil, das zeigt — wie informiert, wie vernetzt, wie resilient du als Medienkonsument wirklich bist.',
    cta: 'Spiel starten',
    accent: '#4A9EFF',
  },
];

export default function IntroCarousel({ onClose }: Props) {
  const [current, setCurrent] = useState(0);
  const router = useRouter();
  const total = slides.length;

  const next = useCallback(() => setCurrent(c => Math.min(c + 1, total - 1)), [total]);
  const prev = useCallback(() => setCurrent(c => Math.max(c - 1, 0)), []);

  const slide = slides[current];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: '#0A0D12',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--font-inter), "Helvetica Neue", Arial, sans-serif',
    }}>
      {/* Top bar: dots + close */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 24px 0',
        flexShrink: 0,
      }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 6 }}>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                width: i === current ? 24 : 6,
                height: 6,
                borderRadius: 3,
                border: 'none',
                cursor: 'pointer',
                background: i === current ? '#4A9EFF' : 'rgba(255,255,255,0.2)',
                transition: 'width 0.3s ease, background 0.3s ease',
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* Close / Skip — jump straight to player-count selection */}
        <button
          onClick={() => router.push('/game')}
          style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)',
            fontSize: 13, cursor: 'pointer', padding: '4px 8px',
            letterSpacing: '0.5px', fontFamily: 'inherit',
          }}
        >
          Überspringen ✕
        </button>
      </div>

      {/* Slide track */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          display: 'flex',
          height: '100%',
          transform: `translateX(-${current * 100}%)`,
          transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'transform',
        }}>
          {slides.map((s, i) => (
            <div key={i} style={{
              minWidth: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '24px',
            }}>
              {s.type === 'intro' && (
                <div style={{ maxWidth: 560, textAlign: 'center' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: '#005A9F', color: '#fff',
                    fontWeight: 900, fontSize: 11, letterSpacing: 2,
                    padding: '4px 9px', borderRadius: 4, marginBottom: 28,
                  }}>ARD</div>

                  <h2 style={{
                    fontSize: 'clamp(26px, 6vw, 40px)', fontWeight: 900,
                    color: '#fff', letterSpacing: '-1px', lineHeight: 1.1,
                    marginBottom: 32,
                  }}>
                    Willkommen bei{' '}
                    <span style={{ color: '#fff' }}>ard</span>
                    <span style={{ color: '#4A9EFF' }}>.</span>
                    <span style={{ color: '#fff' }}>life</span>
                  </h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
                    {(s as typeof slides[0] & { lines: string[] }).lines.map((line, li) => (
                      <p key={li} style={{
                        fontSize: 'clamp(14px, 2.5vw, 16px)',
                        color: li === 0 ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.55)',
                        lineHeight: 1.65, margin: 0,
                        fontWeight: li === 0 ? 500 : 400,
                      }}>{line}</p>
                    ))}
                  </div>
                </div>
              )}

              {(s.type === 'feature') && (
                <div style={{ maxWidth: 520, width: '100%' }}>
                  {/* Step label */}
                  <p style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: 2,
                    textTransform: 'uppercase',
                    color: (s as { accent?: string }).accent ?? '#4A9EFF',
                    marginBottom: 16, margin: '0 0 16px',
                  }}>
                    {(s as { step?: string }).step}
                  </p>

                  {/* Icon */}
                  <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 20 }}>
                    {s.icon}
                  </div>

                  {/* Title */}
                  <h2 style={{
                    fontSize: 'clamp(22px, 5vw, 34px)', fontWeight: 900,
                    color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.15,
                    margin: '0 0 16px',
                  }}>
                    {s.title}
                  </h2>

                  {/* Body */}
                  <p style={{
                    fontSize: 'clamp(14px, 2.5vw, 16px)',
                    color: 'rgba(255,255,255,0.6)',
                    lineHeight: 1.65, margin: '0 0 28px',
                  }}>
                    {(s as { body?: string }).body}
                  </p>

                  {/* Tags */}
                  {(s as { tags?: { label: string; color: string }[] }).tags && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {(s as { tags: { label: string; color: string }[] }).tags.map(tag => (
                        <span key={tag.label} style={{
                          padding: '5px 12px', borderRadius: 20,
                          fontSize: 12, fontWeight: 600,
                          border: `1px solid ${tag.color}`,
                          color: tag.color,
                          background: `${tag.color}15`,
                        }}>{tag.label}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {s.type === 'final' && (
                <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
                  <div style={{ fontSize: 64, lineHeight: 1, marginBottom: 24 }}>{s.icon}</div>

                  <h2 style={{
                    fontSize: 'clamp(24px, 5.5vw, 38px)', fontWeight: 900,
                    color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.15,
                    margin: '0 0 20px',
                  }}>{s.title}</h2>

                  <p style={{
                    fontSize: 'clamp(14px, 2.5vw, 16px)',
                    color: 'rgba(255,255,255,0.6)',
                    lineHeight: 1.65, margin: '0 0 36px',
                  }}>{(s as { body?: string }).body}</p>

                  {/* Value pillars */}
                  <div style={{
                    display: 'flex', justifyContent: 'center', gap: 12,
                    flexWrap: 'wrap', marginBottom: 40,
                  }}>
                    {[
                      { emoji: '📚', label: 'Bildung', color: '#4D96FF' },
                      { emoji: '🤝', label: 'Gemeinschaft', color: '#6BCB77' },
                      { emoji: '✨', label: 'Glück', color: '#FFD93D' },
                    ].map(v => (
                      <div key={v.label} style={{
                        padding: '10px 18px', borderRadius: 12,
                        border: `1px solid ${v.color}44`,
                        background: `${v.color}11`,
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: 22, marginBottom: 4 }}>{v.emoji}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: v.color }}>{v.label}</div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => router.push('/game')}
                    style={{
                      padding: '14px 40px',
                      background: '#005A9F',
                      color: '#fff', border: 'none',
                      borderRadius: 8, fontSize: 17, fontWeight: 800,
                      cursor: 'pointer', letterSpacing: '0.3px',
                      boxShadow: '0 4px 20px rgba(0,90,159,0.5)',
                      fontFamily: 'inherit',
                      transition: 'background 200ms ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#0A6ED1')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#005A9F')}
                  >
                    Spiel starten →
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom navigation */}
      <div style={{
        padding: '16px 24px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        {/* Prev */}
        <button
          onClick={prev}
          disabled={current === 0}
          style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.15)',
            color: current === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.7)',
            borderRadius: 8, padding: '10px 20px',
            fontSize: 14, fontWeight: 600, cursor: current === 0 ? 'default' : 'pointer',
            fontFamily: 'inherit',
            transition: 'color 200ms, border-color 200ms',
          }}
        >
          ← Zurück
        </button>

        {/* Slide count */}
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', letterSpacing: 1 }}>
          {current + 1} / {total}
        </span>

        {/* Next (hidden on last slide — CTA is inside slide) */}
        {current < total - 1 ? (
          <button
            onClick={next}
            style={{
              background: '#005A9F', border: 'none',
              color: '#fff', borderRadius: 8,
              padding: '10px 24px', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 2px 10px rgba(0,90,159,0.4)',
              transition: 'background 200ms ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#0A6ED1')}
            onMouseLeave={e => (e.currentTarget.style.background = '#005A9F')}
          >
            Weiter →
          </button>
        ) : (
          <div style={{ width: 90 }} /> /* spacer to keep layout balanced */
        )}
      </div>
    </div>
  );
}
