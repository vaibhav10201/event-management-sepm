import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Shared Gemini client utility for server-side AI execution.
 * The API key is securely accessed via process.env.GEMINI_API_KEY
 * and NEVER exposed to browser client code.
 */
export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});
