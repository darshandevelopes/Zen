import {describe, it, expect, beforeEach} from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {isCrisis, parseVerdict, judgePrompt} from '../src/worry/judge';
import {
  loadWorries,
  saveWorry,
  setOutcome,
  vaultStats,
} from '../src/worry/vault';

describe('parseVerdict', () => {
  it('reads plain JSON', () => {
    expect(
      parseVerdict('{"score": 2, "feedback": "Specific!", "crisis": false}'),
    ).toEqual({score: 2, feedback: 'Specific!', crisis: false});
  });

  it('reads JSON wrapped in markdown fences', () => {
    const v = parseVerdict('```json\n{"score":1,"feedback":"ok"}\n```');
    expect(v).toEqual({score: 1, feedback: 'ok', crisis: false});
  });

  it('clamps and rounds out-of-range scores', () => {
    expect(parseVerdict('{"score": 7}').score).toBe(2);
    expect(parseVerdict('{"score": -3}').score).toBe(0);
    expect(parseVerdict('{"score": "1.6"}').score).toBe(2);
  });

  it('rejects garbage', () => {
    expect(parseVerdict('no json here')).toBeNull();
    expect(parseVerdict('{broken')).toBeNull();
    expect(parseVerdict('{"score": "high"}')).toBeNull();
    expect(parseVerdict(undefined)).toBeNull();
  });

  it('only flags crisis on an explicit true', () => {
    expect(parseVerdict('{"score":0,"crisis":"yes"}').crisis).toBe(false);
    expect(parseVerdict('{"score":0,"crisis":true}').crisis).toBe(true);
  });
});

describe('isCrisis', () => {
  it('catches self-harm language, case-insensitively', () => {
    expect(isCrisis('Sometimes I want to DIE')).toBe(true);
    expect(isCrisis('thinking about self-harm')).toBe(true);
    expect(isCrisis('ab jeena nahi hai')).toBe(true);
  });

  it('ignores ordinary worries', () => {
    expect(isCrisis('I will fail my maths exam')).toBe(false);
    expect(isCrisis('')).toBe(false);
    expect(isCrisis(undefined)).toBe(false);
  });
});

it('judgePrompt includes the worry, question and answer', () => {
  const p = judgePrompt('exam', 'evidence?', 'I studied');
  expect(p).toContain('exam');
  expect(p).toContain('evidence?');
  expect(p).toContain('I studied');
});

describe('worry vault', () => {
  beforeEach(() => AsyncStorage.clear());

  it('saves worries and records outcomes', async () => {
    const a = await saveWorry(
      {worry: 'a', answers: [], thought: 't', cleared: 100},
      1,
    );
    await saveWorry({worry: 'b', answers: [], thought: 't', cleared: 50}, 2);
    await setOutcome(a.id, 'didnt');
    const all = await loadWorries();
    expect(all.map(w => [w.worry, w.outcome])).toEqual([
      ['a', 'didnt'],
      ['b', null],
    ]);
  });

  it('computes how many checked worries did not happen', () => {
    expect(
      vaultStats([
        {outcome: 'didnt'},
        {outcome: 'didnt'},
        {outcome: 'happened'},
        {outcome: null},
      ]),
    ).toEqual({total: 4, checked: 3, didnt: 2, pctDidnt: 67});
    expect(vaultStats([]).pctDidnt).toBeNull();
  });
});
