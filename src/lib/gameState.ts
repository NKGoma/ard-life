// ============================================================
// Game State v4 – Turn logic, questions from JSON, random events
// ============================================================
import {
  GameState, Player, AvatarConfig, BoardSpace, GameQuestion,
  RandomEvent, RandomEventChoice, LifeStage, HistoryEntry, ScoreMap,
  LIFE_STAGE_META, Token, TokenType, ScoreKey, ALL_SCORE_KEYS, SpaceType, SCORE_LABELS,
} from '@/types';
import { generateBoard } from './boardGenerator';
import { getBaseScores, applyScoring } from './scoring';
import questionsRaw from '@data/mc_questions_01.json';
import randomEventsData from '@data/randomEvents.json';

// --- JSON type casts ---
interface RawQuestion extends Omit<GameQuestion, 'points'> {
  points: { bildung?: number; gemeinschaft?: number; glueck?: number; lebensglueck?: number };
}
interface REFile { events: (RandomEvent & { choices: (RandomEventChoice & { grantsBeitragBonus?: boolean })[] })[] }

const STAGE_MAPPING: Record<string, string[]> = {
  kindheit: ['grundwissen'],
  jugend: ['grundwissen', 'sport', 'musik'],
  junges_erwachsenenalter: ['sport', 'musik', 'humor', 'geschichte'],
  erwachsenenalter: ['humor', 'geschichte', 'kultur'],
  alter: ['geschichte', 'kultur', 'grundwissen'],
};
const ALL_CATEGORIES = ['grundwissen', 'sport', 'musik', 'humor', 'geschichte', 'kultur'];

const questions: GameQuestion[] = (questionsRaw as unknown as RawQuestion[]).map(q => ({
  ...q,
  points: {
    bildung: q.points.bildung ?? 0,
    gemeinschaft: q.points.gemeinschaft ?? 0,
    glueck: q.points.lebensglueck ?? q.points.glueck ?? 0,
  },
}));
const reFile = randomEventsData as unknown as REFile;

const SAVE_KEY = 'ard_life_save_v4';

// --- Beitrags-Dividende bonus definitions ---
const BEITRAG_BONUSES = ['tatort_fan', 'tagesschau_leser', 'deutschlandfunk_hoerer', 'kulturprogramm_fan'];
const BEITRAG_BONUS_MAP: Record<string, { spaceType: SpaceType; scoring: ScoreMap; label: string }> = {
  tatort_fan:              { spaceType: 'event',     scoring: { gemeinschaft: 1 }, label: '📺 Tatort-Fan: +1 Gemeinschaft' },
  tagesschau_leser:        { spaceType: 'question',  scoring: { bildung: 1 },      label: '📰 Tagesschau-Leser: +1 Bildung' },
  deutschlandfunk_hoerer:  { spaceType: 'milestone', scoring: { bildung: 1 },      label: '🎙️ Deutschlandfunk: +1 Bildung' },
  kulturprogramm_fan:      { spaceType: 'boost',     scoring: { glueck: 1 },       label: '🎵 Kulturprogramm: +1 Glück' },
};
export const BEITRAG_BONUS_LABELS: Record<string, string> = {
  tatort_fan:             '📺 Tatort-Fan',
  tagesschau_leser:       '📰 Tagesschau-Leser',
  deutschlandfunk_hoerer: '🎙️ Deutschlandfunk-Hörer',
  kulturprogramm_fan:     '🎵 Kulturprogramm-Fan',
};

// --- Token definitions ---
const TOKEN_BY_STAGE: Partial<Record<LifeStage, { type: TokenType; label: string; emoji: string }>> = {
  kindheit:                { type: 'bildung_stern',      label: 'Bildungsstern',       emoji: '🌟' },
  jugend:                  { type: 'glueck_token',       label: 'Glückstoken',         emoji: '🍀' },
  junges_erwachsenenalter: { type: 'gemeinschaft_badge', label: 'Gemeinschafts-Badge', emoji: '🏅' },
  erwachsenenalter:        { type: 'bildung_stern',      label: 'Bildungsstern',       emoji: '🌟' },
};
const TOKEN_SPACE_MAP: Record<TokenType, SpaceType[]> = {
  bildung_stern:      ['question', 'chance'],
  glueck_token:       ['boost'],
  gemeinschaft_badge: ['event'],
};
const TOKEN_BONUS: Record<TokenType, ScoreMap> = {
  bildung_stern:      { bildung: 1 },
  glueck_token:       { glueck: 2 },
  gemeinschaft_badge: { gemeinschaft: 2 },
};

// --- Default avatar ---
export function defaultAvatar(name: string): AvatarConfig {
  return {
    name, skinColor: '#F1C27D', hairStyleId: 'short_side', hairColor: '#3B2F2F',
    topId: 'tshirt_blue', bottomId: 'jeans_blue', shoesId: 'sneakers_white', accessoryId: 'none',
  };
}

// --- Create player ---
export function createPlayer(id: number, avatar: AvatarConfig): Player {
  return {
    id, name: avatar.name, avatar, scores: getBaseScores(),
    position: 0, currentStage: 'kindheit',
    answeredQuestions: [], experiencedEvents: [],
    tokens: [], milestones: [], history: [],
    beitragBonus: null,
  };
}

// --- Init game ---
export function initGame(avatars: AvatarConfig[]): GameState {
  const board = generateBoard();
  return {
    players: avatars.map((a, i) => createPlayer(i, a)),
    currentPlayerIndex: 0, board, phase: 'playing',
    currentQuestion: null, currentEvent: null, currentMilestone: null,
    spinResult: null, turnCount: 0, animatingToPosition: null,
    activeDuel: null, pendingToast: null,
  };
}

// --- Stage for position ---
export function getStageForPosition(board: BoardSpace[], pos: number): LifeStage {
  const clamped = Math.max(0, Math.min(pos, board.length - 1));
  return board[clamped]?.stage ?? 'kindheit';
}

// --- Get question for current stage ---
export function getQuestionForStage(stage: LifeStage, answered: string[]): GameQuestion | null {
  const allowed = STAGE_MAPPING[stage] ?? ALL_CATEGORIES;
  let available = questions.filter(q => allowed.includes(q.category) && !answered.includes(q.id));
  if (available.length === 0) {
    available = questions.filter(q => !answered.includes(q.id));
    if (available.length === 0) return null;
  }
  return available[Math.floor(Math.random() * available.length)];
}

// --- Get random event for current stage ---
export function getRandomEvent(stage: LifeStage, experienced: string[]): RandomEvent | null {
  let available = reFile.events.filter(e => e.lifeStage.includes(stage) && !experienced.includes(e.id));
  if (available.length === 0) {
    available = reFile.events.filter(e => !experienced.includes(e.id));
    if (available.length === 0) return null;
  }
  return available[Math.floor(Math.random() * available.length)];
}

// --- Move player ---
export function movePlayer(state: GameState, steps: number): GameState {
  const player = state.players[state.currentPlayerIndex];
  const maxPos = state.board.length - 1;
  const newPosition = Math.min(player.position + steps, maxPos);
  const newStage = getStageForPosition(state.board, newPosition);
  const updatedPlayer = { ...player, position: newPosition, currentStage: newStage };
  const players = state.players.map((p, i) => i === state.currentPlayerIndex ? updatedPlayer : p);
  return { ...state, players };
}

// --- Process space arrival ---
export function processSpaceArrival(state: GameState): GameState {
  const player = state.players[state.currentPlayerIndex];
  const space = state.board[player.position];
  if (!space) return { ...state, phase: 'playing' };

  // --- 1. Token redemption ---
  let pendingToast: string | null = null;
  let updatedScores = player.scores;
  let updatedTokens = player.tokens;

  const unusedToken = player.tokens.find(t => !t.used && TOKEN_SPACE_MAP[t.type]?.includes(space.type));
  if (unusedToken) {
    updatedTokens = player.tokens.map(t => t === unusedToken ? { ...t, used: true } : t);
    updatedScores = applyScoring(updatedScores, TOKEN_BONUS[unusedToken.type]);
    pendingToast = `${unusedToken.emoji} ${unusedToken.label} eingelöst!`;
  }

  // --- 2. BeitragBonus passive application ---
  if (player.beitragBonus) {
    const bonusInfo = BEITRAG_BONUS_MAP[player.beitragBonus];
    if (bonusInfo && space.type === bonusInfo.spaceType) {
      updatedScores = applyScoring(updatedScores, bonusInfo.scoring);
      pendingToast = pendingToast ? `${pendingToast} · ${bonusInfo.label}` : bonusInfo.label;
    }
  }

  const p = { ...player, scores: updatedScores, tokens: updatedTokens };
  const baseState = {
    ...state,
    players: state.players.map((pl, i) => i === state.currentPlayerIndex ? p : pl),
    pendingToast,
  };

  // --- 3. Duel check (on interactive spaces, 2+ players only) ---
  const duelableTypes: SpaceType[] = ['question', 'event', 'chance', 'boost', 'setback'];
  if (state.players.length > 1 && duelableTypes.includes(space.type)) {
    const occupant = state.players.find((pl, i) => i !== state.currentPlayerIndex && pl.position === p.position);
    if (occupant) {
      const q = getQuestionForStage(p.currentStage, p.answeredQuestions);
      if (q) {
        return {
          ...baseState,
          currentQuestion: q,
          activeDuel: { attackerId: p.id, defenderId: occupant.id, attackerAnswerIndex: null },
          phase: 'duel',
        };
      }
    }
  }

  // --- 4. Normal space processing ---
  switch (space.type) {
    case 'question':
    case 'chance': {
      const q = getQuestionForStage(p.currentStage, p.answeredQuestions);
      if (q) return { ...baseState, currentQuestion: q, phase: 'question' };
      return { ...baseState, phase: 'playing' };
    }
    case 'event': {
      const e = getRandomEvent(p.currentStage, p.experiencedEvents);
      if (e) return { ...baseState, currentEvent: e, phase: 'event' };
      return { ...baseState, phase: 'playing' };
    }
    case 'milestone':
      return { ...baseState, currentMilestone: space, phase: 'milestone' };
    case 'boost': {
      if (space.scoring) {
        const newScores = applyScoring(p.scores, space.scoring);
        const newHistory: HistoryEntry = {
          turn: p.history.length + 1, spaceId: space.id ?? 0,
          stage: p.currentStage, type: 'Boost',
          title: space.boostText ?? 'Boost!', outcome: 'Boost', scoreChanges: space.scoring,
        };
        const updatedP = { ...p, scores: newScores, history: [...p.history, newHistory] };
        return {
          ...baseState,
          players: baseState.players.map((pl, i) => i === state.currentPlayerIndex ? updatedP : pl),
          phase: 'playing',
        };
      }
      return { ...baseState, phase: 'playing' };
    }
    case 'setback': {
      if (space.scoring) {
        const newScores = applyScoring(p.scores, space.scoring);
        const newHistory: HistoryEntry = {
          turn: p.history.length + 1, spaceId: space.id ?? 0,
          stage: p.currentStage, type: 'Rückschlag',
          title: space.setbackText ?? 'Rückschlag!', outcome: 'Rückschlag', scoreChanges: space.scoring,
        };
        const updatedP = { ...p, scores: newScores, history: [...p.history, newHistory] };
        return {
          ...baseState,
          players: baseState.players.map((pl, i) => i === state.currentPlayerIndex ? updatedP : pl),
          phase: 'playing',
        };
      }
      return { ...baseState, phase: 'playing' };
    }
    case 'finish':
      return { ...baseState, phase: 'finished' };
    default:
      return { ...baseState, phase: 'playing' };
  }
}

// --- Answer question (uses points from JSON) ---
export function answerQuestion(state: GameState, answerIndex: number): GameState {
  const player = state.players[state.currentPlayerIndex];
  const q = state.currentQuestion;
  if (!q) return { ...state, phase: 'playing' };

  const correct = answerIndex === q.correctIndex;
  const scoring: ScoreMap = correct ? { ...q.points } : { bildung: -1 };

  const newScores = applyScoring(player.scores, scoring);
  const newHistory: HistoryEntry = {
    turn: player.history.length + 1, spaceId: state.board[player.position]?.id ?? 0,
    stage: player.currentStage, type: correct ? 'Richtig' : 'Falsch',
    title: q.question, outcome: correct ? 'Richtig' : 'Falsch', scoreChanges: scoring,
  };
  const updatedPlayer = {
    ...player,
    scores: newScores,
    answeredQuestions: [...player.answeredQuestions, q.id],
    history: [...player.history, newHistory],
  };

  return {
    ...state,
    players: state.players.map((p, i) => i === state.currentPlayerIndex ? updatedPlayer : p),
    currentQuestion: null,
    phase: 'playing',
  };
}

// --- Answer duel (two-player sequential, resolves on second call) ---
export function answerDuel(state: GameState, answerIndex: number): GameState {
  const { activeDuel, currentQuestion, players } = state;
  if (!activeDuel || !currentQuestion) return { ...state, activeDuel: null, currentQuestion: null, phase: 'playing' };

  // Attacker's turn — store answer, wait for defender
  if (activeDuel.attackerAnswerIndex === null) {
    return { ...state, activeDuel: { ...activeDuel, attackerAnswerIndex: answerIndex } };
  }

  // Defender's turn — resolve
  const attackerCorrect = activeDuel.attackerAnswerIndex === currentQuestion.correctIndex;
  const defenderCorrect = answerIndex === currentQuestion.correctIndex;

  const attackerIdx = players.findIndex(p => p.id === activeDuel.attackerId);
  const defenderIdx = players.findIndex(p => p.id === activeDuel.defenderId);
  if (attackerIdx === -1 || defenderIdx === -1) {
    return { ...state, activeDuel: null, currentQuestion: null, phase: 'playing' };
  }

  let attacker = players[attackerIdx];
  let defender = players[defenderIdx];
  const STEAL = 3;
  let pendingToast: string;

  const highestKey = (scores: typeof attacker.scores): ScoreKey =>
    ALL_SCORE_KEYS.reduce((best, k) => scores[k] > scores[best] ? k : best, 'bildung' as ScoreKey);

  if (attackerCorrect && !defenderCorrect) {
    const key = highestKey(defender.scores);
    const amt = Math.min(STEAL, defender.scores[key]);
    defender = { ...defender, scores: applyScoring(defender.scores, { [key]: -amt }) };
    attacker = { ...attacker, scores: applyScoring(attacker.scores, { [key]: amt }) };
    pendingToast = `⚔️ ${attacker.name} gewinnt das Duell! +${amt} ${SCORE_LABELS[key]}`;
  } else if (!attackerCorrect && defenderCorrect) {
    const key = highestKey(attacker.scores);
    const amt = Math.min(STEAL, attacker.scores[key]);
    attacker = { ...attacker, scores: applyScoring(attacker.scores, { [key]: -amt }) };
    defender = { ...defender, scores: applyScoring(defender.scores, { [key]: amt }) };
    pendingToast = `⚔️ ${defender.name} verteidigt! +${amt} ${SCORE_LABELS[key]}`;
  } else {
    pendingToast = attackerCorrect
      ? '⚔️ Beide richtig – Unentschieden! Kein Punktraub.'
      : '⚔️ Beide falsch – Unentschieden!';
  }

  const updatedPlayers = players.map((p, i) => {
    if (i === attackerIdx) return attacker;
    if (i === defenderIdx) return defender;
    return p;
  });

  return {
    ...state,
    players: updatedPlayers,
    activeDuel: null,
    currentQuestion: null,
    pendingToast,
    phase: 'playing',
  };
}

// --- Choose event option (uses points from random events) ---
export function chooseEventOption(state: GameState, choiceIdx: number): GameState {
  const player = state.players[state.currentPlayerIndex];
  const e = state.currentEvent;
  if (!e) return { ...state, phase: 'playing' };

  const choice = e.choices[choiceIdx];
  if (!choice) return { ...state, currentEvent: null, phase: 'playing' };

  const newScores = applyScoring(player.scores, choice.points);
  const newHistory: HistoryEntry = {
    turn: player.history.length + 1, spaceId: state.board[player.position]?.id ?? 0,
    stage: player.currentStage, type: 'Ereignis',
    title: `${e.title}: ${choice.text}`, outcome: 'Ereignis', scoreChanges: choice.points,
  };

  let newPosition = player.position;
  let newStage = player.currentStage;
  if (choice.moveSpaces) {
    const maxPos = state.board.length - 1;
    newPosition = Math.max(0, Math.min(player.position + choice.moveSpaces, maxPos));
    newStage = getStageForPosition(state.board, newPosition);
  }

  // Beitrags-Dividende: assign random bonus if this choice grants one
  let beitragBonus = player.beitragBonus;
  let pendingToast: string | null = null;
  const grantBonus = (choice as RandomEventChoice & { grantsBeitragBonus?: boolean }).grantsBeitragBonus;
  if (grantBonus && !beitragBonus) {
    beitragBonus = BEITRAG_BONUSES[Math.floor(Math.random() * BEITRAG_BONUSES.length)];
    const label = BEITRAG_BONUS_LABELS[beitragBonus] ?? beitragBonus;
    pendingToast = `🎉 Treuer Beitragszahler! Dein Bonus: ${label}`;
  }

  const updatedPlayer = {
    ...player,
    scores: newScores,
    experiencedEvents: [...player.experiencedEvents, e.id],
    history: [...player.history, newHistory],
    position: newPosition,
    currentStage: newStage,
    beitragBonus,
  };

  return {
    ...state,
    players: state.players.map((p, i) => i === state.currentPlayerIndex ? updatedPlayer : p),
    currentEvent: null,
    pendingToast,
    phase: 'playing',
  };
}

// --- Acknowledge milestone ---
export function acknowledgeMilestone(state: GameState): GameState {
  const player = state.players[state.currentPlayerIndex];
  const ms = state.currentMilestone;
  let updatedPlayer = player;
  if (ms?.milestoneTitle) {
    // Award token for this life stage
    const tokenData = TOKEN_BY_STAGE[player.currentStage];
    const newTokens = tokenData
      ? [...player.tokens, { type: tokenData.type, label: tokenData.label, emoji: tokenData.emoji, earnedAt: player.position, used: false } as Token]
      : player.tokens;

    updatedPlayer = {
      ...player,
      tokens: newTokens,
      milestones: [...player.milestones, ms.milestoneTitle],
      history: [...player.history, {
        turn: player.history.length + 1, spaceId: ms.id ?? 0,
        stage: player.currentStage, type: 'Meilenstein', title: ms.milestoneTitle,
        outcome: 'Meilenstein', scoreChanges: {},
      } as HistoryEntry],
    };
  }

  const pendingToast = ms && TOKEN_BY_STAGE[player.currentStage]
    ? `${TOKEN_BY_STAGE[player.currentStage]!.emoji} ${TOKEN_BY_STAGE[player.currentStage]!.label} erhalten!`
    : null;

  return {
    ...state,
    players: state.players.map((p, i) => i === state.currentPlayerIndex ? updatedPlayer : p),
    currentMilestone: null,
    pendingToast,
    phase: 'playing',
  };
}

// --- End turn (auto-advance to next player) ---
export function endTurn(state: GameState): GameState {
  return {
    ...state,
    currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
    spinResult: null,
    turnCount: state.turnCount + 1,
    phase: 'playing',
  };
}

// --- Check if all finished ---
export function checkAllFinished(state: GameState): boolean {
  const maxPos = state.board.length - 1;
  return state.players.every(p => p.position >= maxPos);
}

// --- Save / Load ---
export function saveGame(state: GameState) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch { /* quota */ }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as GameState;
    if (!state.players || !state.board || !Array.isArray(state.players)) return null;
    for (const p of state.players) {
      if (!(p.currentStage in LIFE_STAGE_META)) {
        p.currentStage = getStageForPosition(state.board, p.position);
      }
      p.beitragBonus = p.beitragBonus ?? null;
      p.tokens = (p.tokens ?? []).map(t => ({ ...t, used: t.used ?? false }));
    }
    state.activeDuel = state.activeDuel ?? null;
    state.pendingToast = state.pendingToast ?? null;
    return state;
  } catch { return null; }
}

export function clearSave() { localStorage.removeItem(SAVE_KEY); }
