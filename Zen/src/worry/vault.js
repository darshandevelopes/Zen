import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'zen.worries';

export async function loadWorries() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Could not read worry vault', e);
    return [];
  }
}

const write = all => AsyncStorage.setItem(KEY, JSON.stringify(all));

export async function saveWorry(
  {worry, answers, thought, cleared},
  at = Date.now(),
) {
  const entry = {
    id: `${at}`,
    at,
    worry,
    answers,
    thought,
    cleared,
    outcome: null,
  };
  await write([...(await loadWorries()), entry]);
  return entry;
}

// outcome: 'happened' | 'didnt'
export async function setOutcome(id, outcome) {
  const all = (await loadWorries()).map(w =>
    w.id === id ? {...w, outcome, checkedAt: Date.now()} : w,
  );
  await write(all);
  return all;
}

export function vaultStats(worries) {
  const checked = worries.filter(w => w.outcome);
  const didnt = checked.filter(w => w.outcome === 'didnt').length;
  return {
    total: worries.length,
    checked: checked.length,
    didnt,
    pctDidnt: checked.length
      ? Math.round((didnt / checked.length) * 100)
      : null,
  };
}
