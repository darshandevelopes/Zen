import {GEMINI_API_KEY as ENV_GEMINI_API_KEY} from '@env';

export const GEMINI_API_KEY =
  ENV_GEMINI_API_KEY ||
  (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
  '';
