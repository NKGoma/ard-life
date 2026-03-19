// ============================================================
// ARD Life – Types v4 – 3-category scoring (bildung/gemeinschaft/glueck)
// Real 2D board game with avatars standing on tiles
// ============================================================

// --- Scores: exactly 3 categories ---
export type ScoreKey = 'bildung' | 'gemeinschaft' | 'glueck';
export type ScoreMap = Partial<Record<ScoreKey, number>>;

export interface PlayerScores {
  bildung: number;
  gemeinschaft: number;
  glueck: number;
}

export const SCORE_LABELS: Record<ScoreKey, string> = {
  bildung: 'Bildung',
  gemeinschaft: 'Gemeinschaft',
  glueck: 'Glück',
};

export const SCORE_COLORS: Record<ScoreKey, string> = {
  bildung: '#4D96FF',
  gemeinschaft: '#6BCB77',
  glueck: '#FFD93D',
};

export const SCORE_EMOJIS: Record<ScoreKey, string> = {
  bildung: '📚',
  gemeinschaft: '🤝',
  glueck: '✨',
};

export const ALL_SCORE_KEYS: ScoreKey[] = ['bildung', 'gemeinschaft', 'glueck'];

// --- Life Stages ---
export type LifeStage = 'kindheit' | 'jugend' | 'junges_erwachsenenalter' | 'erwachsenenalter' | 'alter';

export const LIFE_STAGE_ORDER: LifeStage[] = [
  'kindheit', 'jugend', 'junges_erwachsenenalter', 'erwachsenenalter', 'alter',
];

export interface StageMeta {
  name: string; ages: string; color: string; emoji: string; description: string;
}

export const LIFE_STAGE_META: Record<LifeStage, StageMeta> = {
  kindheit: { name: 'Kindheit', ages: '3–10', color: '#FFD93D', emoji: '🧒', description: 'Erste Begegnungen mit Medien' },
  jugend: { name: 'Jugend', ages: '11–17', color: '#6BCB77', emoji: '🎒', description: 'Social Media, Trends und Peer-Pressure' },
  junges_erwachsenenalter: { name: 'Junges Erwachsenenalter', ages: '18–29', color: '#4D96FF', emoji: '🎓', description: 'Wahlen, Identität, eigene Meinungen' },
  erwachsenenalter: { name: 'Erwachsenenalter', ages: '30–55', color: '#FF6B6B', emoji: '💼', description: 'Beruf, Familie und Verantwortung' },
  alter: { name: 'Lebensabend', ages: '55+', color: '#9B59B6', emoji: '🌿', description: 'Rückblick, Routine und Weitergabe' },
};

// --- Space Types ---
export type SpaceType = 'start' | 'question' | 'event' | 'milestone' | 'boost' | 'setback' | 'chance' | 'neutral' | 'finish';

export interface SpaceVisual { icon: string; color: string; label: string; }

export const SPACE_VISUALS: Record<SpaceType, SpaceVisual> = {
  start:     { icon: '🏁', color: '#4CAF50', label: 'Start' },
  question:  { icon: '❓', color: '#2196F3', label: 'Frage' },
  event:     { icon: '📰', color: '#FF9800', label: 'Ereignis' },
  milestone: { icon: '⭐', color: '#FFD700', label: 'Meilenstein' },
  boost:     { icon: '🚀', color: '#00BCD4', label: 'Boost' },
  setback:   { icon: '⚠️', color: '#F44336', label: 'Rückschlag' },
  chance:    { icon: '🎲', color: '#FF5722', label: 'Zufall' },
  neutral:   { icon: '·',  color: '#90A4AE', label: '' },
  finish:    { icon: '🏆', color: '#FFD700', label: 'Ziel' },
};

// --- Board Space (2D grid with col/row) ---
export interface BoardSpace {
  id: number;
  type: SpaceType;
  stage: LifeStage;
  col: number;
  row: number;
  label?: string;
  milestoneTitle?: string;
  milestoneDescription?: string;
  scoring?: ScoreMap;
  boostText?: string;
  setbackText?: string;
}

// --- Questions (exact JSON format from user) ---
export interface GameQuestion {
  id: string;
  category: string;
  title: string;
  url: string;
  question: string;
  options: string[];
  correctIndex: number;
  points: ScoreMap;
  insight: string;
}

// --- Random Events (separate system) ---
export interface RandomEventChoice {
  text: string;
  points: ScoreMap;
  moveSpaces?: number;
}
export interface RandomEvent {
  id: string;
  title: string;
  description: string;
  lifeStage: LifeStage[];
  category: string;
  choices: RandomEventChoice[];
}

// --- Avatar ---
export interface AvatarConfig {
  name: string;
  skinColor: string;
  hairStyleId: string;
  hairColor: string;
  topId: string;
  bottomId: string;
  shoesId: string;
  accessoryId: string;
}

export interface HairStyleOption {
  id: string; name: string; category: 'kurz' | 'mittel' | 'lang' | 'locken' | 'sonstige';
  preview: string;
}

export const SKIN_COLORS = [
  { id: 'fair', hex: '#FDDBB4' }, { id: 'light', hex: '#F1C27D' },
  { id: 'medium', hex: '#E8B384' }, { id: 'tan', hex: '#C68642' },
  { id: 'brown', hex: '#8D5524' }, { id: 'dark', hex: '#6B3A19' },
];

export const HAIR_COLORS = [
  { id: 'black', hex: '#1a1a2e' }, { id: 'dark_brown', hex: '#3B2F2F' },
  { id: 'brown', hex: '#5A3825' }, { id: 'light_brown', hex: '#8B6914' },
  { id: 'blonde', hex: '#D4A76A' }, { id: 'platinum', hex: '#E8D5B7' },
  { id: 'red', hex: '#B7472A' }, { id: 'auburn', hex: '#922724' },
  { id: 'grey', hex: '#95A5A6' }, { id: 'white', hex: '#D5D5D5' },
];

export const HAIR_STYLES: HairStyleOption[] = [
  { id: 'buzz', name: 'Buzz Cut', category: 'kurz', preview: '◻' },
  { id: 'crew', name: 'Crew Cut', category: 'kurz', preview: '▬' },
  { id: 'short_side', name: 'Kurz mit Scheitel', category: 'kurz', preview: '◧' },
  { id: 'textured', name: 'Texturiert', category: 'kurz', preview: '▤' },
  { id: 'undercut', name: 'Undercut', category: 'kurz', preview: '◨' },
  { id: 'bob', name: 'Bob', category: 'mittel', preview: '◆' },
  { id: 'shag', name: 'Shag', category: 'mittel', preview: '◇' },
  { id: 'layered', name: 'Stufenschnitt', category: 'mittel', preview: '▽' },
  { id: 'shoulder', name: 'Schulterlang', category: 'mittel', preview: '▿' },
  { id: 'long_straight', name: 'Lang & Glatt', category: 'lang', preview: '║' },
  { id: 'long_wavy', name: 'Lang & Wellig', category: 'lang', preview: '∿' },
  { id: 'braids', name: 'Zöpfe', category: 'lang', preview: '⌇' },
  { id: 'ponytail', name: 'Pferdeschwanz', category: 'lang', preview: '⌒' },
  { id: 'curly_short', name: 'Kurze Locken', category: 'locken', preview: '◉' },
  { id: 'curly_medium', name: 'Mittlere Locken', category: 'locken', preview: '◎' },
  { id: 'afro', name: 'Afro', category: 'locken', preview: '◕' },
  { id: 'coils', name: 'Coils', category: 'locken', preview: '◍' },
  { id: 'bald', name: 'Glatze', category: 'sonstige', preview: '○' },
  { id: 'mohawk', name: 'Irokese', category: 'sonstige', preview: '▲' },
  { id: 'bun', name: 'Dutt', category: 'sonstige', preview: '●' },
];

export interface ClothingOption { id: string; name: string; color: string; emoji: string; }

export const TOPS: ClothingOption[] = [
  { id: 'tshirt_white', name: 'T-Shirt Weiß', color: '#FFFFFF', emoji: '👕' },
  { id: 'tshirt_blue', name: 'T-Shirt Blau', color: '#4D96FF', emoji: '👕' },
  { id: 'tshirt_red', name: 'T-Shirt Rot', color: '#FF6B6B', emoji: '👕' },
  { id: 'tshirt_green', name: 'T-Shirt Grün', color: '#6BCB77', emoji: '👕' },
  { id: 'hoodie_grey', name: 'Hoodie Grau', color: '#95A5A6', emoji: '🧥' },
  { id: 'hoodie_black', name: 'Hoodie Schwarz', color: '#2C3E50', emoji: '🧥' },
  { id: 'jacket_denim', name: 'Jeansjacke', color: '#5DADE2', emoji: '🧥' },
  { id: 'blouse_white', name: 'Bluse Weiß', color: '#F8F9FA', emoji: '👔' },
  { id: 'blazer_navy', name: 'Blazer Navy', color: '#2C3E50', emoji: '🤵' },
  { id: 'sweater_yellow', name: 'Pulli Gelb', color: '#FFD93D', emoji: '🧶' },
];

export const BOTTOMS: ClothingOption[] = [
  { id: 'jeans_blue', name: 'Jeans Blau', color: '#3B5998', emoji: '👖' },
  { id: 'jeans_black', name: 'Jeans Schwarz', color: '#2C3E50', emoji: '👖' },
  { id: 'chinos_beige', name: 'Chinos Beige', color: '#D2B48C', emoji: '👖' },
  { id: 'shorts_green', name: 'Shorts Grün', color: '#6BCB77', emoji: '🩳' },
  { id: 'skirt_navy', name: 'Rock Navy', color: '#2C3E50', emoji: '👗' },
  { id: 'sweatpants_grey', name: 'Jogginghose', color: '#95A5A6', emoji: '👖' },
];

export const SHOES: ClothingOption[] = [
  { id: 'sneakers_white', name: 'Sneaker Weiß', color: '#FFFFFF', emoji: '👟' },
  { id: 'sneakers_red', name: 'Sneaker Rot', color: '#E74C3C', emoji: '👟' },
  { id: 'boots_brown', name: 'Boots Braun', color: '#8B4513', emoji: '🥾' },
  { id: 'sandals', name: 'Sandalen', color: '#D2B48C', emoji: '🩴' },
  { id: 'formal_black', name: 'Elegant Schwarz', color: '#1a1a2e', emoji: '👞' },
];

export const ACCESSORIES: ClothingOption[] = [
  { id: 'none', name: 'Keine', color: 'transparent', emoji: '—' },
  { id: 'glasses', name: 'Brille', color: '#2C3E50', emoji: '👓' },
  { id: 'sunglasses', name: 'Sonnenbrille', color: '#1a1a2e', emoji: '🕶️' },
  { id: 'hat_cap', name: 'Kappe', color: '#E74C3C', emoji: '🧢' },
  { id: 'hat_beanie', name: 'Mütze', color: '#2C3E50', emoji: '🧶' },
  { id: 'headphones', name: 'Kopfhörer', color: '#2C3E50', emoji: '🎧' },
  { id: 'watch', name: 'Armbanduhr', color: '#FFD700', emoji: '⌚' },
  { id: 'scarf', name: 'Schal', color: '#E74C3C', emoji: '🧣' },
];

// --- History ---
export interface HistoryEntry {
  turn: number; spaceId: number; stage: LifeStage;
  type: string; title: string; outcome: string; scoreChanges: ScoreMap;
}

// --- Player ---
export interface Player {
  id: number; name: string; avatar: AvatarConfig; scores: PlayerScores;
  position: number; currentStage: LifeStage;
  answeredQuestions: string[]; experiencedEvents: string[];
  tokens: Token[]; milestones: string[]; history: HistoryEntry[];
}

// --- Token ---
export type TokenType = 'bildung_stern' | 'gemeinschaft_badge' | 'glueck_token';
export interface Token { type: TokenType; label: string; emoji: string; earnedAt: number; }

// --- Game State ---
export type GamePhase =
  'landing' | 'setup' | 'playing' | 'spinning' | 'moving' |
  'space_arrival' | 'question' | 'event' | 'milestone' |
  'result' | 'finished';

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  board: BoardSpace[];
  phase: GamePhase;
  currentQuestion: GameQuestion | null;
  currentEvent: RandomEvent | null;
  currentMilestone: BoardSpace | null;
  spinResult: number | null;
  turnCount: number;
  animatingToPosition: number | null;
  usedQuestions: string[];
}

// --- End Profiles ---
export interface ProfileCondition { min?: number; max?: number; }
export interface EndProfile {
  id: string; name: string; emoji: string; description: string;
  conditions: Partial<Record<ScoreKey, ProfileCondition>>; tips: string[];
}

// --- Safe helpers ---
const FALLBACK_STAGE: StageMeta = { name: 'Unbekannt', ages: '?', color: '#64748B', emoji: '🧑', description: '' };
const FALLBACK_VISUAL: SpaceVisual = { icon: '·', color: '#90A4AE', label: '' };

export function getStageMeta(stage: string | undefined | null): StageMeta {
  if (stage && stage in LIFE_STAGE_META) return LIFE_STAGE_META[stage as LifeStage];
  return FALLBACK_STAGE;
}
export function getSpaceVisual(type: string | undefined | null): SpaceVisual {
  if (type && type in SPACE_VISUALS) return SPACE_VISUALS[type as SpaceType];
  return FALLBACK_VISUAL;
}

export const PLAYER_COLORS = ['#FF6B6B', '#4D96FF', '#6BCB77', '#FFD93D'];
