// ============================================================
// Game State v4 – Turn logic, questions from JSON, random events
// ============================================================
import {
  GameState, Player, AvatarConfig, BoardSpace, GameQuestion,
  RandomEvent, LifeStage, HistoryEntry, ScoreMap, LIFE_STAGE_META,
} from '@/types';
import { generateBoard } from './boardGenerator';
import { getBaseScores, applyScoring } from './scoring';
import questionsData from '@/data/questions.json';
import randomEventsData from '@/data/randomEvents.json';

// --- JSON type casts ---
interface QFile {
  categories: { id: string; label: string; emoji: string; color: string }[];
  stageMapping: Record<string, string[]>;
  questions: GameQuestion[];
}
interface REFile { events: RandomEvent[]; }
const qFile = questionsData as unknown as QFile;
const reFile = randomEventsData as unknown as REFile;

const SAVE_KEY = 'ard_life_save_v4';

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
  };
}

// --- Stage for position ---
export function getStageForPosition(board: BoardSpace[], pos: number): LifeStage {
  const clamped = Math.max(0, Math.min(pos, board.length - 1));
  return board[clamped]?.stage ?? 'kindheit';
}

// --- Get question for current stage ---
export function getQuestionForStage(stage: LifeStage, answered: string[]): GameQuestion | null {
  const mapping = qFile.stageMapping;
  const allowed = mapping[stage] ?? qFile.categories.map(c => c.id);
  let available = qFile.questions.filter(q => allowed.includes(q.category) && !answered.includes(q.id));
  if (available.length === 0) {
    available = qFile.questions.filter(q => !answered.includes(q.id));
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

  switch (space.type) {
    case 'question':
    case 'chance': {
      const q = getQuestionForStage(player.currentStage, player.answeredQuestions);
      if (q) return { ...state, currentQuestion: q, phase: 'question' };
      return { ...state, phase: 'playing' };
    }
    case 'event': {
      const e = getRandomEvent(player.currentStage, player.experiencedEvents);
      if (e) return { ...state, currentEvent: e, phase: 'event' };
      return { ...state, phase: 'playing' };
    }
    case 'milestone':
      return { ...state, currentMilestone: space, phase: 'milestone' };
    case 'boost': {
      if (space.scoring) {
        const newScores = applyScoring(player.scores, space.scoring);
        const newHistory: HistoryEntry = {
          turn: player.history.length + 1, spaceId: space.id ?? 0,
          stage: player.currentStage, type: 'Boost',
          title: space.boostText ?? 'Boost!', outcome: 'Boost', scoreChanges: space.scoring,
        };
        const updatedPlayer = {
          ...player, scores: newScores, history: [...player.history, newHistory],
        };
        return {
          ...state,
          players: state.players.map((p, i) => i === state.currentPlayerIndex ? updatedPlayer : p),
          phase: 'playing',
        };
      }
      return { ...state, phase: 'playing' };
    }
    case 'setback': {
      if (space.scoring) {
        const newScores = applyScoring(player.scores, space.scoring);
        const newHistory: HistoryEntry = {
          turn: player.history.length + 1, spaceId: space.id ?? 0,
          stage: player.currentStage, type: 'Rückschlag',
          title: space.setbackText ?? 'Rückschlag!', outcome: 'Rückschlag', scoreChanges: space.scoring,
        };
        const updatedPlayer = {
          ...player, scores: newScores, history: [...player.history, newHistory],
        };
        return {
          ...state,
          players: state.players.map((p, i) => i === state.currentPlayerIndex ? updatedPlayer : p),
          phase: 'playing',
        };
      }
      return { ...state, phase: 'playing' };
    }
    case 'finish':
      return { ...state, phase: 'finished' };
    default:
      return { ...state, phase: 'playing' };
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

  const updatedPlayer = {
    ...player,
    scores: newScores,
    experiencedEvents: [...player.experiencedEvents, e.id],
    history: [...player.history, newHistory],
    position: newPosition,
    currentStage: newStage,
  };

  return {
    ...state,
    players: state.players.map((p, i) => i === state.currentPlayerIndex ? updatedPlayer : p),
    currentEvent: null,
    phase: 'playing',
  };
}

// --- Acknowledge milestone ---
export function acknowledgeMilestone(state: GameState): GameState {
  const player = state.players[state.currentPlayerIndex];
  const ms = state.currentMilestone;
  let updatedPlayer = player;
  if (ms?.milestoneTitle) {
    updatedPlayer = {
      ...player,
      milestones: [...player.milestones, ms.milestoneTitle],
      history: [...player.history, {
        turn: player.history.length + 1, spaceId: ms.id ?? 0,
        stage: player.currentStage, type: 'Meilenstein', title: ms.milestoneTitle,
        outcome: 'Meilenstein', scoreChanges: {},
      } as HistoryEntry],
    };
  }
  return {
    ...state,
    players: state.players.map((p, i) => i === state.currentPlayerIndex ? updatedPlayer : p),
    currentMilestone: null,
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

// --- History helper ---
function addHistory(player: Player, space: BoardSpace | undefined, type: string, title: string, scoring: ScoreMap) {
  player.history.push({
    turn: player.history.length + 1, spaceId: space?.id ?? 0,
    stage: player.currentStage, type, title, outcome: type, scoreChanges: scoring,
  } as HistoryEntry);
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
    }
    return state;
  } catch { return null; }
}

export function clearSave() { localStorage.removeItem(SAVE_KEY); }
