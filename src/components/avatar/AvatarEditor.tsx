'use client';
import { useState, useMemo } from 'react';
import {
  AvatarConfig, SKIN_COLORS, HAIR_COLORS, HAIR_STYLES,
  TOPS, BOTTOMS, SHOES, ACCESSORIES, HairStyleOption,
} from '@/types';

interface AvatarEditorProps {
  initial?: Partial<AvatarConfig>;
  onSave: (config: AvatarConfig) => void;
  playerIndex: number;
}

const HAIR_CATEGORIES = ['kurz', 'mittel', 'lang', 'locken', 'sonstige'] as const;
const HAIR_CAT_LABELS: Record<string, string> = {
  kurz: 'Kurz', mittel: 'Mittel', lang: 'Lang', locken: 'Locken', sonstige: 'Sonstige',
};

export default function AvatarEditor({ initial, onSave, playerIndex }: AvatarEditorProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [skinColor, setSkinColor] = useState(initial?.skinColor ?? SKIN_COLORS[1].hex);
  const [hairStyleId, setHairStyleId] = useState(initial?.hairStyleId ?? 'short_side');
  const [hairColor, setHairColor] = useState(initial?.hairColor ?? HAIR_COLORS[1].hex);
  const [topId, setTopId] = useState(initial?.topId ?? 'tshirt_blue');
  const [bottomId, setBottomId] = useState(initial?.bottomId ?? 'jeans_blue');
  const [shoesId, setShoesId] = useState(initial?.shoesId ?? 'sneakers_white');
  const [accessoryId, setAccessoryId] = useState(initial?.accessoryId ?? 'none');
  const [hairCat, setHairCat] = useState<string>('kurz');
  const [tab, setTab] = useState<'body' | 'hair' | 'clothes' | 'extras'>('body');

  const filteredHair = useMemo(
    () => HAIR_STYLES.filter((h) => h.category === hairCat),
    [hairCat]
  );

  const selectedHairStyle = HAIR_STYLES.find((h) => h.id === hairStyleId);
  const selectedTop = TOPS.find((t) => t.id === topId);
  const selectedBottom = BOTTOMS.find((b) => b.id === bottomId);
  const selectedShoes = SHOES.find((s) => s.id === shoesId);
  const selectedAcc = ACCESSORIES.find((a) => a.id === accessoryId);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), skinColor, hairStyleId, hairColor, topId, bottomId, shoesId, accessoryId });
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-6 max-w-lg w-full mx-auto border border-slate-700">
      <h2 className="text-xl font-bold text-white mb-4">
        Spieler {playerIndex + 1} erstellen
      </h2>

      {/* Name */}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name eingeben..."
        maxLength={20}
        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white
          placeholder-slate-400 mb-4 focus:ring-2 focus:ring-blue-400 focus:outline-none"
      />

      {/* Preview */}
      <div className="flex justify-center mb-4">
        <div className="w-28 h-36 rounded-xl bg-slate-900 border-2 border-slate-600
          flex flex-col items-center justify-center gap-1 p-2 relative overflow-hidden">
          {/* Hair */}
          <div className="text-2xl" style={{ color: hairColor }}>
            {selectedHairStyle?.preview ?? '◻'}
          </div>
          {/* Head */}
          <div className="w-10 h-10 rounded-full" style={{ backgroundColor: skinColor }} />
          {/* Top */}
          <div className="w-14 h-6 rounded-t-lg" style={{ backgroundColor: selectedTop?.color ?? '#4D96FF' }} />
          {/* Bottom */}
          <div className="w-12 h-5 rounded-b" style={{ backgroundColor: selectedBottom?.color ?? '#3B5998' }} />
          {/* Shoes */}
          <div className="flex gap-1">
            <div className="w-4 h-2 rounded" style={{ backgroundColor: selectedShoes?.color ?? '#fff' }} />
            <div className="w-4 h-2 rounded" style={{ backgroundColor: selectedShoes?.color ?? '#fff' }} />
          </div>
          {/* Accessory badge */}
          {selectedAcc && selectedAcc.id !== 'none' && (
            <div className="absolute top-1 right-1 text-sm">{selectedAcc.emoji}</div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-900 rounded-lg p-1">
        {([
          ['body', '🧑 Koerper'],
          ['hair', '💇 Haare'],
          ['clothes', '👕 Kleidung'],
          ['extras', '✨ Extras'],
        ] as [typeof tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-all
              ${tab === key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-[140px]">
        {tab === 'body' && (
          <div>
            <p className="text-slate-400 text-sm mb-2">Hautfarbe</p>
            <div className="flex gap-2 flex-wrap">
              {SKIN_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSkinColor(c.hex)}
                  className={`w-10 h-10 rounded-full border-2 transition-all
                    ${skinColor === c.hex ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c.hex }}
                  aria-label={c.id}
                />
              ))}
            </div>
          </div>
        )}

        {tab === 'hair' && (
          <div className="space-y-3">
            {/* Hair color */}
            <div>
              <p className="text-slate-400 text-sm mb-1">Haarfarbe</p>
              <div className="flex gap-1.5 flex-wrap">
                {HAIR_COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setHairColor(c.hex)}
                    className={`w-7 h-7 rounded-full border-2 transition-all
                      ${hairColor === c.hex ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c.hex }}
                    aria-label={c.id}
                  />
                ))}
              </div>
            </div>
            {/* Hair category */}
            <div className="flex gap-1">
              {HAIR_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setHairCat(cat)}
                  className={`px-2 py-1 rounded text-xs transition-all
                    ${hairCat === cat ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                >
                  {HAIR_CAT_LABELS[cat]}
                </button>
              ))}
            </div>
            {/* Hair styles */}
            <div className="grid grid-cols-4 gap-2">
              {filteredHair.map((h: HairStyleOption) => (
                <button
                  key={h.id}
                  onClick={() => setHairStyleId(h.id)}
                  className={`p-2 rounded-lg border-2 text-center transition-all
                    ${hairStyleId === h.id
                      ? 'border-blue-400 bg-blue-900/40'
                      : 'border-slate-600 bg-slate-800 hover:border-slate-500'}`}
                >
                  <div className="text-xl" style={{ color: hairColor }}>{h.preview}</div>
                  <div className="text-[10px] text-slate-300 mt-1 truncate">{h.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'clothes' && (
          <div className="space-y-3">
            {/* Tops */}
            <div>
              <p className="text-slate-400 text-sm mb-1">Oberteil</p>
              <div className="grid grid-cols-5 gap-1.5">
                {TOPS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTopId(t.id)}
                    className={`p-1.5 rounded border-2 text-center transition-all
                      ${topId === t.id ? 'border-blue-400 bg-blue-900/40' : 'border-slate-600 bg-slate-800'}`}
                  >
                    <div className="w-6 h-4 rounded mx-auto" style={{ backgroundColor: t.color }} />
                    <div className="text-[9px] text-slate-400 mt-0.5 truncate">{t.name}</div>
                  </button>
                ))}
              </div>
            </div>
            {/* Bottoms */}
            <div>
              <p className="text-slate-400 text-sm mb-1">Hose</p>
              <div className="grid grid-cols-6 gap-1.5">
                {BOTTOMS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBottomId(b.id)}
                    className={`p-1.5 rounded border-2 text-center transition-all
                      ${bottomId === b.id ? 'border-blue-400 bg-blue-900/40' : 'border-slate-600 bg-slate-800'}`}
                  >
                    <div className="w-5 h-4 rounded mx-auto" style={{ backgroundColor: b.color }} />
                  </button>
                ))}
              </div>
            </div>
            {/* Shoes */}
            <div>
              <p className="text-slate-400 text-sm mb-1">Schuhe</p>
              <div className="flex gap-1.5">
                {SHOES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setShoesId(s.id)}
                    className={`p-1.5 rounded border-2 text-center flex-1 transition-all
                      ${shoesId === s.id ? 'border-blue-400 bg-blue-900/40' : 'border-slate-600 bg-slate-800'}`}
                  >
                    <span className="text-sm">{s.emoji}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'extras' && (
          <div>
            <p className="text-slate-400 text-sm mb-2">Accessoire</p>
            <div className="grid grid-cols-4 gap-2">
              {ACCESSORIES.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAccessoryId(a.id)}
                  className={`p-2 rounded-lg border-2 text-center transition-all
                    ${accessoryId === a.id
                      ? 'border-blue-400 bg-blue-900/40'
                      : 'border-slate-600 bg-slate-800 hover:border-slate-500'}`}
                >
                  <div className="text-xl">{a.emoji}</div>
                  <div className="text-[10px] text-slate-300 mt-1">{a.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={!name.trim()}
        className="w-full mt-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600
          text-white font-bold rounded-xl text-lg
          hover:from-green-400 hover:to-emerald-500
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all shadow-lg"
      >
        ✅ Spieler speichern
      </button>
    </div>
  );
}
