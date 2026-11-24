import {describe, it, expect} from '@jest/globals';
import {scoreBreath, hint, altitude, summarize} from '../src/breath/scoring';

describe('breath scoring', () => {
  it('gives full marks for exact pace', () => {
    expect(scoreBreath(4000, 6000)).toBe(1);
  });

  it('drops with error and clamps at 0', () => {
    expect(scoreBreath(3000, 4500)).toBeCloseTo(0.5);
    expect(scoreBreath(2000, 3000)).toBe(0);
    expect(scoreBreath(20000, 30000)).toBe(0);
  });

  it('hints based on total breath length', () => {
    expect(hint(2000, 3000)).toBe('A little slower');
    expect(hint(6000, 8000)).toBe('A little quicker');
    expect(hint(4100, 5900)).toBe('Steady');
  });

  it('altitude averages the last 3 breaths', () => {
    expect(altitude([])).toBe(0);
    expect(altitude([0, 0, 0.5, 1, 0.9])).toBeCloseTo(0.8);
  });

  it('summarizes start vs end steadiness and lit lanterns', () => {
    expect(summarize([0.3, 0.4, 0.5, 0.8, 0.9, 1])).toEqual({
      start: 40,
      end: 90,
      lit: 3,
    });
  });
});
