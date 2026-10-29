let envKey = '';
try {
  const env = require('@env');
  envKey = env.GEMINI_API_KEY || '';
} catch (e) {
  envKey =
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || '';
}

export const GEMINI_API_KEY = envKey;
