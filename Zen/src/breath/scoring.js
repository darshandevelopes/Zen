// Target pace: 4s in, 6s out = 6 breaths/min (resonance breathing).
export const INHALE_MS = 4000;
export const EXHALE_MS = 6000;
export const LIT_THRESHOLD = 0.7;

const err = (actual, target) => Math.abs(actual - target) / target;

// 1 = exactly on pace, 0 = off by 50% or more (half-pace must not lift the lantern).
export function scoreBreath(inhaleMs, exhaleMs) {
  const avgErr = (err(inhaleMs, INHALE_MS) + err(exhaleMs, EXHALE_MS)) / 2;
  return Math.max(0, Math.min(1, 1 - 2 * avgErr));
}

export function hint(inhaleMs, exhaleMs) {
  const ratio = (inhaleMs + exhaleMs) / (INHALE_MS + EXHALE_MS);
  if (ratio < 0.85) {
    return 'A little slower';
  }
  if (ratio > 1.15) {
    return 'A little quicker';
  }
  return 'Steady';
}

const avg = xs => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

// Recent average drives how high the lantern floats.
export const altitude = scores => avg(scores.slice(-3));

export function summarize(scores) {
  return {
    start: Math.round(avg(scores.slice(0, 3)) * 100),
    end: Math.round(avg(scores.slice(-3)) * 100),
    lit: scores.filter(s => s >= LIT_THRESHOLD).length,
  };
}
