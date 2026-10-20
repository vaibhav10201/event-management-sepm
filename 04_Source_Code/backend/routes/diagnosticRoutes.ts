import { Router, Request, Response } from 'express';
import { GeminiService } from '../services/geminiService.ts';
import { ai } from '../config/gemini.ts';

export const diagnosticRouter = Router();

/**
 * Middleware to restrict diagnostics to development environment or authorized admins
 */
const restrictToDev = (req: Request, res: Response, next: Function) => {
  const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  // In a real app, we might also check for an admin session/header
  if (!isDev && req.headers['x-hems-diagnostic-key'] !== process.env.DIAGNOSTIC_KEY) {
    return res.status(403).json({ error: 'Access denied. Diagnostics are restricted.' });
  }
  next();
};

diagnosticRouter.use(restrictToDev);

/**
 * GET /api/diagnostics/health
 */
diagnosticRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

/**
 * GET /api/diagnostics/gemini-check
 */
diagnosticRouter.get('/gemini-check', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const modelName = GeminiService.getActiveModel();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return res.status(500).json({
        status: 'failed',
        error: 'GEMINI_API_KEY is not configured on the server.',
        model: modelName
      });
    }

    // Small connectivity test with sanitized model
    const response = await ai.models.generateContent({
      model: modelName,
      contents: "Return a JSON object with status='ok' and message='HEMS Gemini test successful'.",
      config: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });

    if (!response.text) {
      throw new Error('Gemini returned an empty response text.');
    }

    const duration = Date.now() - startTime;
    return res.json({
      status: 'passed',
      model: modelName,
      duration_ms: duration,
      response: JSON.parse(response.text)
    });
  } catch (error: any) {
    console.error('Gemini Diagnostic Failure:', error);
    
    // Extract meaningful error info from SDK error if possible
    const errorMessage = error?.message || 'Unknown Gemini error';
    const status = error?.status || 'failed';
    
    return res.status(error?.code && typeof error.code === 'number' ? error.code : 500).json({
      status: 'failed',
      error: errorMessage,
      details: error?.details || error
    });
  }
});

/**
 * GET /api/diagnostics/supabase-config
 */
diagnosticRouter.get('/supabase-config', (req: Request, res: Response) => {
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_ANON_KEY || '';
  
  res.json({
    has_url: Boolean(url && url.startsWith('https://')),
    has_key: Boolean(key && key.length > 20),
    url_preview: url ? `${url.substring(0, 15)}...` : 'None',
    status: (url && key) ? 'passed' : 'failed'
  });
});
