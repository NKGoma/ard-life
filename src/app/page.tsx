import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative board path bg */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <svg viewBox="0 0 800 600" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          {Array.from({ length: 20 }).map((_, i) => (
            <circle key={i} cx={100 + (i % 8) * 90} cy={80 + Math.floor(i / 8) * 200 + (i % 2) * 40} r="20" fill="#4D96FF" />
          ))}
          <path d="M120 100 Q200 80 280 100 Q360 120 440 100 Q520 80 600 100 Q680 120 680 200 Q680 280 600 300 Q520 320 440 300 Q360 280 280 300 Q200 320 120 300 Q40 280 40 200 Z"
            fill="none" stroke="#FFD93D" strokeWidth="3" strokeDasharray="10,6" />
        </svg>
      </div>

      <div className="max-w-2xl w-full text-center relative z-10">
        {/* Logo */}
        <div className="mb-10">
          <div className="text-7xl mb-4">🎲</div>
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 mb-3 leading-tight">
            ARD Life
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 font-light">
            Das Spiel des Lebens – Medienedition
          </p>
        </div>

        {/* Game board info card */}
        <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-8 border border-slate-700/50 mb-8 shadow-2xl">
          <p className="text-lg text-slate-200 leading-relaxed mb-6">
            <strong className="text-white">Drehe die Scheibe, durchlebe fünf Lebensphasen und entdecke, wie Medien dein Denken, Vertrauen und deine Entscheidungen prägen.</strong>
          </p>
          <p className="text-slate-400 leading-relaxed mb-6 text-sm">
            Von der Kindheit bis ins hohe Alter: Beantworte Wissensfragen, triff Entscheidungen an Weggabelungen,
            erlebe Zufallsereignisse, sammle Tokens und erreiche Meilensteine. Am Ende wartet dein persönliches Medienprofil.
          </p>

          {/* Feature tags – Game of Life style */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {[
              { emoji: '🧒', label: '5 Lebensphasen', color: '#FFD93D' },
              { emoji: '🎲', label: 'Dreh-Scheibe', color: '#FF6B6B' },
              { emoji: '🔱', label: 'Weggabelungen', color: '#9B59B6' },
              { emoji: '⭐', label: 'Meilensteine', color: '#FFD700' },
              { emoji: '📊', label: '3 Lebenswerte', color: '#4D96FF' },
              { emoji: '🏅', label: 'Tokens & Badges', color: '#6BCB77' },
            ].map(({ emoji, label, color }) => (
              <span
                key={label}
                className="px-3 py-1.5 rounded-full text-sm font-medium border"
                style={{ borderColor: color + '44', backgroundColor: color + '11', color }}
              >
                {emoji} {label}
              </span>
            ))}
          </div>

          <p className="text-sm text-orange-300 font-bold tracking-wider uppercase">
            New Risk. New Fun. New Perspective.
          </p>
        </div>

        {/* CTA */}
        <Link href="/game">
          <button className="px-14 py-5 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white font-black
                             rounded-2xl text-xl shadow-2xl hover:shadow-orange-500/30
                             transform hover:scale-105 transition-all duration-300
                             focus:outline-none focus:ring-4 focus:ring-orange-400
                             border-2 border-white/20">
            🎲 Spiel starten
          </button>
        </Link>

        <div className="mt-6 flex justify-center gap-4 text-sm text-slate-500">
          <span>👤 1–4 Spieler</span>
          <span>·</span>
          <span>⏱️ 10–20 Min.</span>
          <span>·</span>
          <span>📱 PWA</span>
          <span>·</span>
          <span>♿ Barrierefrei</span>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-sm text-slate-600">
          <p>Ein Projekt für Medienkompetenz</p>
          <p className="mt-1">Mit Inhalten aus der ARD Mediathek</p>
        </footer>
      </div>
    </div>
  );
}
