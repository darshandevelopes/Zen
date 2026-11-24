import {GoogleGenerativeAI} from '@google/generative-ai';
import {GEMINI_API_KEY} from '../config/env';

export const CHALLENGES = [
  "What's the actual evidence this will happen?",
  'What would you tell a friend who had this worry?',
  "What's one small thing you can control about it?",
];
export const MAX_HP = CHALLENGES.length * 2; // each answer deals 0–2 damage

// Phrases that should stop the game and show a helpline instead.
const CRISIS_PHRASES = [
  'suicide',
  'suicidal',
  'kill myself',
  'end my life',
  'end it all',
  'want to die',
  'wanna die',
  'self harm',
  'self-harm',
  'hurt myself',
  'cut myself',
  'no reason to live',
  'better off dead',
  'aatmahatya',
  'marna chahta',
  'marna chahti',
  'jeena nahi',
];

export const isCrisis = text => {
  const t = (text || '').toLowerCase();
  return CRISIS_PHRASES.some(p => t.includes(p));
};

export const judgePrompt = (
  worry,
  question,
  answer,
) => `You are Sakha, a warm CBT coach running a "worry battle" game.
The user's worry: """${worry}"""
Challenge question: """${question}"""
The user's answer: """${answer}"""

Score the answer:
2 = a genuine, specific reframe or concrete step that engages with the worry
1 = engages with the worry but is vague or general
0 = dismissive, off-topic, or empty (e.g. "it's fine", "idk", "whatever")
Set "crisis" to true only if the user's text suggests risk of self-harm or suicide.

Reply with JSON only, no markdown:
{"score": 0, "feedback": "one short, kind sentence (max 20 words) naming what was good or what to try", "crisis": false}`;

export const thoughtPrompt = (
  worry,
  answers,
) => `The user battled this worry: """${worry}"""
Their own answers to three CBT questions:
${answers.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Write ONE balanced, realistic thought in first person (max 30 words) that they could tell themselves, built only from their own answers. Plain text, no quotes.`;

// Pull the verdict out of a model reply; null if it can't be trusted.
export function parseVerdict(text) {
  const match = (text || '').match(/\{[\s\S]*\}/);
  if (!match) {
    return null;
  }
  try {
    const v = JSON.parse(match[0]);
    const score = Math.round(Number(v.score));
    if (!Number.isFinite(score)) {
      return null;
    }
    return {
      score: Math.max(0, Math.min(2, score)),
      feedback: typeof v.feedback === 'string' ? v.feedback.trim() : '',
      crisis: v.crisis === true,
    };
  } catch (e) {
    return null;
  }
}

// shortcut: Gemini key ships in the app (owner's call, not public yet); move behind a server proxy before release.
const model = () =>
  new GoogleGenerativeAI(GEMINI_API_KEY).getGenerativeModel({
    model: 'gemini-2.5-flash',
  });

const ask = async prompt => {
  if (!GEMINI_API_KEY) {
    throw new Error('No Gemini API key configured');
  }
  const result = await model().generateContent(prompt);
  return result.response.text();
};

export async function judgeAnswer(worry, question, answer) {
  if (isCrisis(answer)) {
    return {score: 0, feedback: '', crisis: true};
  }
  try {
    const verdict = parseVerdict(
      await ask(judgePrompt(worry, question, answer)),
    );
    if (verdict) {
      return verdict;
    }
  } catch (e) {
    console.warn('Worry judge failed', e);
  }
  // Offline or garbled reply: don't punish the player for our failure.
  return {
    score: 1,
    feedback: "Sakha couldn't be reached, so this one counts as a hit.",
    crisis: false,
    offline: true,
  };
}

export async function balancedThought(worry, answers) {
  try {
    const text = (await ask(thoughtPrompt(worry, answers))).trim();
    if (text) {
      return text.replace(/^["“]|["”]$/g, '');
    }
  } catch (e) {
    console.warn('Balanced thought failed', e);
  }
  return answers[answers.length - 1];
}
