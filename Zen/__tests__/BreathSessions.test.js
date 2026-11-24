import {describe, it, expect, beforeEach} from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {loadSessions, saveSession, weeklyStats} from '../src/breath/sessions';

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date(2026, 10, 24, 20, 0).getTime(); // Tue 24 Nov 2026, 8pm
const s = (daysAgo, start, end, lit) => ({
  at: NOW - daysAgo * DAY,
  start,
  end,
  lit,
});

describe('weeklyStats', () => {
  it('splits sessions into this week and last week', () => {
    const sessions = [
      s(0, 40, 90, 8),
      s(2, 20, 70, 5),
      s(6, 30, 80, 6), // still this week (today + 6 days back)
      s(7, 10, 50, 2), // last week
      s(13, 20, 60, 3), // last week
      s(14, 0, 0, 0), // too old
    ];
    const {thisWeek, lastWeek} = weeklyStats(sessions, NOW);
    expect(thisWeek).toEqual({count: 3, start: 30, end: 80, lit: 19});
    expect(lastWeek).toEqual({count: 2, start: 15, end: 55, lit: 5});
  });

  it('gives 7 days oldest-first with empty days as nulls', () => {
    const {days} = weeklyStats([s(0, 40, 90, 8), s(0, 20, 70, 4)], NOW);
    expect(days).toHaveLength(7);
    expect(days[6]).toMatchObject({count: 2, end: 80, lit: 12});
    expect(days[0]).toMatchObject({count: 0, end: null});
  });

  it('handles no sessions', () => {
    const {thisWeek, lastWeek} = weeklyStats([], NOW);
    expect(thisWeek).toEqual({count: 0, start: null, end: null, lit: 0});
    expect(lastWeek.count).toBe(0);
  });
});

describe('session storage', () => {
  beforeEach(() => AsyncStorage.clear());

  it('saves a summarized session and loads it back', async () => {
    await saveSession([0.3, 0.4, 0.5, 0.8, 0.9, 1], NOW);
    expect(await loadSessions()).toEqual([
      {
        at: NOW,
        scores: [0.3, 0.4, 0.5, 0.8, 0.9, 1],
        start: 40,
        end: 90,
        lit: 3,
      },
    ]);
  });

  it('survives corrupt storage', async () => {
    await AsyncStorage.setItem('zen.breathSessions', '{not json');
    expect(await loadSessions()).toEqual([]);
  });
});
