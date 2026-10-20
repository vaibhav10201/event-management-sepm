import { Router, Request, Response } from 'express';
import { GeminiService } from '../services/geminiService.ts';

export const aiRouter = Router();

/**
 * POST /api/ai/analyze-event
 * Receives event parameters, queries Gemini server-side, validates JSON,
 * and responds with full event planning architecture.
 */
aiRouter.post('/analyze-event', async (req: Request, res: Response) => {
  try {
    const { name, event_type, guest_count, budget } = req.body;

    if (!name || !event_type || !guest_count || !budget) {
      return res.status(400).json({
        error: 'Missing required parameters: name, event_type, guest_count, budget are mandatory.'
      });
    }

    const plan = await GeminiService.analyzeEvent(req.body);
    return res.json(plan);
  } catch (error: any) {
    console.error('Error in /api/ai/analyze-event:', error);
    return res.status(500).json({
      error: 'Failed to analyze event with AI',
      message: error?.message || 'Internal server error'
    });
  }
});
