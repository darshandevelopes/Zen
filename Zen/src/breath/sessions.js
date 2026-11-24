import AsyncStorage from '@react-native-async-storage/async-storage';
import {summarize} from './scoring';

const KEY = 'zen.breathSessions';
const MAX_SESSIONS = 1000; // a few years of daily use; keeps the JSON small
const DAY = 24 * 60 * 60 * 1000;

export async function loadSessions() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Could not read breath sessions', e);
    return [];
  }
}

export async function saveSession(scores, at = Date.now()) {
  const session = {at, scores, ...summarize(scores)};
  const all = [...(await loadSessions()), session].slice(-MAX_SESSIONS);
  await AsyncStorage.setItem(KEY, JSON.stringify(all));
  return session;
}

const avg = xs =>
  xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null;

const statsFor = sessions => ({
  count: sessions.length,
  start: avg(sessions.map(s => s.start)),
  end: avg(sessions.map(s => s.end)),
  lit: sessions.reduce((n, s) => n + s.lit, 0),
});

const startOfDay = t => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

// "This week" = today and the 6 days before it; "last week" = the 7 days before that.
export function weeklyStats(sessions, now = Date.now()) {
  const today = startOfDay(now);
  const weekStart = today - 6 * DAY;
  const prevStart = weekStart - 7 * DAY;
  const thisWeek = sessions.filter(s => s.at >= weekStart);
  const lastWeek = sessions.filter(s => s.at >= prevStart && s.at < weekStart);
  const days = Array.from({length: 7}, (_, i) => {
    const from = weekStart + i * DAY;
    const daySessions = thisWeek.filter(s => s.at >= from && s.at < from + DAY);
    return {date: from, ...statsFor(daySessions)};
  });
  return {thisWeek: statsFor(thisWeek), lastWeek: statsFor(lastWeek), days};
}
