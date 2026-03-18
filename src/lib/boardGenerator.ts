// ============================================================
// Board Generator v4 – Snake-like 2D board with col/row coords
// 7 columns wide, snaking back and forth
// ============================================================
import { BoardSpace, LifeStage, LIFE_STAGE_ORDER, SpaceType } from '@/types';

const STAGE_COUNTS: Record<LifeStage, number> = {
  kindheit: 8, jugend: 10, junges_erwachsenenalter: 12, erwachsenenalter: 12, alter: 8,
};

const COLS = 7;

const MILESTONES: Record<LifeStage, { title: string; description: string }> = {
  kindheit: { title: 'Einschulung', description: 'Du beginnst deine Reise in der Medienwelt!' },
  jugend: { title: 'Erstes Smartphone', description: 'Die Welt der sozialen Medien öffnet sich.' },
  junges_erwachsenenalter: { title: 'Erste Wahl', description: 'Du darfst zum ersten Mal wählen!' },
  erwachsenenalter: { title: 'Verantwortung', description: 'Du gibst dein Medienwissen weiter.' },
  alter: { title: 'Lebenswerk', description: 'Rückblick auf ein medienkundiges Leben.' },
};

function getSpaceTypes(count: number, stageIdx: number): SpaceType[] {
  const pattern: SpaceType[] = ['question', 'neutral', 'event', 'question', 'chance', 'question', 'event', 'neutral', 'question', 'event'];
  const types: SpaceType[] = [];
  for (let i = 0; i < count; i++) types.push(pattern[i % pattern.length]);
  if (stageIdx === 0) types[0] = 'start';
  types[types.length - 1] = 'milestone';
  if (stageIdx === LIFE_STAGE_ORDER.length - 1) types[types.length - 1] = 'finish';
  if (count >= 8) { types[2] = 'boost'; types[count - 3] = 'setback'; }
  return types;
}

// Memoized board: generates once, returns cached result
let _cachedBoard: BoardSpace[] | null = null;

export function generateBoard(): BoardSpace[] {
  if (_cachedBoard) return _cachedBoard;

  const spaces: BoardSpace[] = [];
  let id = 0;
  let col = 0;
  let row = 0;
  let dir = 1; // 1=right, -1=left

  for (const [stageIdx, stage] of LIFE_STAGE_ORDER.entries()) {
    const count = STAGE_COUNTS[stage];
    const types = getSpaceTypes(count, stageIdx);

    for (let i = 0; i < count; i++) {
      const space: BoardSpace = { id, type: types[i], stage, col, row };

      if (types[i] === 'milestone') {
        space.milestoneTitle = MILESTONES[stage].title;
        space.milestoneDescription = MILESTONES[stage].description;
      }
      if (types[i] === 'boost') {
        space.boostText = 'Ein toller Medienfund gibt dir Rückenwind!';
        space.scoring = { bildung: 1, glueck: 1 };
      }
      if (types[i] === 'setback') {
        space.setbackText = 'Du bist auf Falschinformationen hereingefallen.';
        space.scoring = { bildung: -1 };
      }

      spaces.push(space);
      id++;

      // Advance snake position
      col += dir;
      if (col >= COLS || col < 0) {
        col = Math.max(0, Math.min(col, COLS - 1));
        row++;
        dir *= -1;
      }
    }
  }
  _cachedBoard = spaces;
  return spaces;
}

export const BOARD_COLS = COLS;
