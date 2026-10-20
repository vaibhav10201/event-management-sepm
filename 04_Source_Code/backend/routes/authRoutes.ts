import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, '../data/users.json');

const authRouter = Router();

// Ensure data folder exists
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  created_at: string;
}

function getStoredUsers(): StoredUser[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading users file:', err);
  }
  return [];
}

function saveStoredUsers(users: StoredUser[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving users file:', err);
  }
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (url && key) {
    return createClient(url, key);
  }
  return null;
}

// 1. REGISTER
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name || '').trim() || cleanEmail.split('@')[0];
    const userRole = role || 'Event Planner';
    const passwordHash = hashPassword(password);

    let supabaseUserId: string | null = null;
    let supabaseSession: any = null;
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        const { data: suData } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: { name: cleanName, role: userRole }
          }
        });
        if (suData?.user?.id) {
          supabaseUserId = suData.user.id;
          supabaseSession = suData.session;
        }
      } catch (err) {
        console.warn('Supabase signUp warning:', err);
      }
    }

    const users = getStoredUsers();
    const existingIndex = users.findIndex(u => u.email.toLowerCase() === cleanEmail);

    const userId = supabaseUserId || (existingIndex !== -1 ? users[existingIndex].id : 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));

    const userRecord: StoredUser = {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      passwordHash: passwordHash,
      role: userRole,
      created_at: new Date().toISOString()
    };

    if (existingIndex !== -1) {
      users[existingIndex] = userRecord;
    } else {
      users.push(userRecord);
    }
    saveStoredUsers(users);

    return res.json({
      success: true,
      user: {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        role: userRecord.role,
        created_at: userRecord.created_at
      },
      session: supabaseSession
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Unable to create account. Please try again.' });
  }
});

// 2. LOGIN
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const passwordHash = hashPassword(password);
    const supabase = getSupabaseClient();

    // Try Supabase Auth first
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password
        });

        if (!error && data?.session && data?.user) {
          // Sync to stored users
          const users = getStoredUsers();
          const idx = users.findIndex(u => u.email.toLowerCase() === cleanEmail);
          const rec: StoredUser = {
            id: data.user.id,
            name: data.user.user_metadata?.name || cleanEmail.split('@')[0],
            email: cleanEmail,
            passwordHash: passwordHash,
            role: data.user.user_metadata?.role || 'Event Planner',
            created_at: data.user.created_at || new Date().toISOString()
          };
          if (idx !== -1) users[idx] = rec;
          else users.push(rec);
          saveStoredUsers(users);

          return res.json({
            success: true,
            user: { id: rec.id, name: rec.name, email: rec.email, role: rec.role },
            session: data.session
          });
        }
      } catch (err) {
        console.warn('Supabase signInWithPassword failed:', err);
      }
    }

    // Check stored credentials (handles unconfirmed emails, rate limits, offline)
    const users = getStoredUsers();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (user) {
      if (user.passwordHash === passwordHash) {
        return res.json({
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            created_at: user.created_at
          }
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Email or password is incorrect. Please try again.',
          canActivate: false
        });
      }
    }

    // If user is not yet in stored users (e.g. created directly in Supabase or before server restart)
    return res.status(401).json({
      success: false,
      message: 'Email or password is incorrect. Please try again.',
      canActivate: true
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Sign in failed. Please try again.' });
  }
});

// 3. ACTIVATE & SIGN IN (For users created in DB whose email confirmation was delayed)
authRouter.post('/activate', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name || '').trim() || cleanEmail.split('@')[0];
    const passwordHash = hashPassword(password);
    const users = getStoredUsers();

    let existing = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!existing) {
      existing = {
        id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        name: cleanName,
        email: cleanEmail,
        passwordHash: passwordHash,
        role: 'Event Planner',
        created_at: new Date().toISOString()
      };
      users.push(existing);
    } else {
      existing.passwordHash = passwordHash;
      if (cleanName) existing.name = cleanName;
    }
    saveStoredUsers(users);

    return res.json({
      success: true,
      user: {
        id: existing.id,
        name: existing.name,
        email: existing.email,
        role: existing.role,
        created_at: existing.created_at
      }
    });
  } catch (err) {
    console.error('Activate error:', err);
    return res.status(500).json({ success: false, message: 'Unable to activate account. Please try again.' });
  }
});

export { authRouter };
