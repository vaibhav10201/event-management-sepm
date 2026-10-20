import express, { Request, Response } from 'express';
import { createServer as createViteServer, ViteDevServer } from 'vite';
import dotenv from 'dotenv';
import { aiRouter } from './04_Source_Code/backend/routes/aiRoutes.ts';
import { authRouter } from './04_Source_Code/backend/routes/authRoutes.ts';
import { diagnosticRouter } from './04_Source_Code/backend/routes/diagnosticRoutes.ts';

dotenv.config();

// In-memory runtime config fallback if not supplied via .env
let runtimeSupabaseUrl = process.env.SUPABASE_URL || '';
let runtimeSupabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

async function bootstrap() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.use('/api/ai', aiRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/diagnostics', diagnosticRouter);

  // Endpoint to provide public Supabase configuration to frontend
  app.get('/api/config', (_req: Request, res: Response) => {
    res.json({
      supabaseUrl: process.env.SUPABASE_URL || runtimeSupabaseUrl,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || runtimeSupabaseAnonKey,
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY')
    });
  });

  // Optional endpoint to dynamically update Supabase config from the UI
  app.post('/api/config', (req: Request, res: Response) => {
    const { supabaseUrl, supabaseAnonKey } = req.body;
    if (supabaseUrl) runtimeSupabaseUrl = supabaseUrl;
    if (supabaseAnonKey) runtimeSupabaseAnonKey = supabaseAnonKey;
    res.json({ success: true });
  });

  // Mount Vite development middlewares
  const isProd = process.env.NODE_ENV === 'production';
  let vite: ViteDevServer | undefined;

  if (!isProd) {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'mpa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  const PORT = Number(process.env.PORT) || 3000;
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`HEMS Full-Stack Server active on http://0.0.0.0:${PORT}`);
  });

  // Handle WebSocket upgrades for Vite HMR in middlewareMode
  if (!isProd && vite) {
    server.on('upgrade', (req, socket, head) => {
      if (!vite) return;
      // In newer Vite versions, handleUpgrade might be on vite.ws
      if ('handleUpgrade' in vite) {
        (vite as any).handleUpgrade(req, socket, head);
      } else if (vite.ws && typeof (vite.ws as any).handleUpgrade === 'function') {
        (vite.ws as any).handleUpgrade(req, socket, head);
      }
    });
  }
}

bootstrap();
