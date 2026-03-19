// ============================================================
// Scoring v4 – 3 categories: bildung, gemeinschaft, glueck
// ============================================================
import { PlayerScores, ScoreMap, ScoreKey, ALL_SCORE_KEYS, EndProfile } from '@/types';
import profilesData from '@data/profiles.json';

interface ProfilesFile {
  baseValues: Record<string, number>;
  profiles: EndProfile[];
}

export function getBaseScores(): PlayerScores {
  const data = profilesData as ProfilesFile;
  const b = data.baseValues;
  return {
    bildung: b.bildung ?? 10,
    gemeinschaft: b.gemeinschaft ?? 10,
    glueck: b.glueck ?? 10,
  };
}

export function applyScoring(scores: PlayerScores, changes: ScoreMap): PlayerScores {
  const next = { ...scores };
  for (const key of ALL_SCORE_KEYS) {
    const delta = changes[key];
    if (typeof delta === 'number') {
      next[key] = Math.max(0, next[key] + delta); // no upper cap, floor at 0
    }
  }
  return next;
}

export function calculateProfile(scores: PlayerScores): EndProfile {
  const profiles = (profilesData as ProfilesFile).profiles;

  // Find the score key with the highest value
  let topKey: ScoreKey = ALL_SCORE_KEYS[0];
  for (const key of ALL_SCORE_KEYS) {
    if (scores[key] > scores[topKey]) topKey = key;
  }

  // Find the profile whose condition matches that top key
  const match = profiles.find((p) => topKey in p.conditions);
  return match ?? profiles[profiles.length - 1];
}

export function getScoreTotal(scores: PlayerScores): number {
  return ALL_SCORE_KEYS.reduce((sum, k) => sum + scores[k], 0);
}
