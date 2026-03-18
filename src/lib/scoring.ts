// ============================================================
// Scoring v4 – 3 categories: bildung, gemeinschaft, glueck
// ============================================================
import { PlayerScores, ScoreMap, ScoreKey, ALL_SCORE_KEYS, EndProfile, ProfileCondition } from '@/types';
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

function checkCondition(value: number, cond: ProfileCondition): boolean {
  if (cond.min !== undefined && value < cond.min) return false;
  if (cond.max !== undefined && value > cond.max) return false;
  return true;
}

export function calculateProfile(scores: PlayerScores): EndProfile {
  const profiles = (profilesData as ProfilesFile).profiles;
  let bestMatch: EndProfile = profiles[profiles.length - 1];
  let bestScore = -1;

  for (const p of profiles) {
    const entries = Object.entries(p.conditions);
    if (entries.length === 0) continue; // skip catch-all unless no better match
    let matched = 0;
    for (const [k, cond] of entries) {
      const value = scores[k as ScoreKey] ?? 0;
      if (checkCondition(value, cond as ProfileCondition)) matched++;
    }
    const ratio = matched / entries.length;
    if (ratio > bestScore) { bestScore = ratio; bestMatch = p; }
  }
  return bestMatch;
}

export function getScoreTotal(scores: PlayerScores): number {
  return ALL_SCORE_KEYS.reduce((sum, k) => sum + scores[k], 0);
}
