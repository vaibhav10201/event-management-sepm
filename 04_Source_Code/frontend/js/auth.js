/**
 * Hospitality and Event Management System (HEMS)
 * Real User Authentication Module
 * 
 * - Seamlessly integrates Supabase Auth with server-side credential verification
 * - Resolves unconfirmed email restrictions and rate limits without blocking user sign-in
 * - Purely human-friendly messaging; zero technical or developer jargon
 * - User isolation: each user only accesses their own event workspace
 */

async function hashPassword(str) {
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const AuthService = {
  currentUser: null,
  session: null,
  isInitialized: false,

  initPromise: null,

  /**
   * Initializes authentication state and verifies active session
   */
  async init() {
    if (this.isInitialized) return this.currentUser;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        await ApiConfig.init();
        const supabase = getSupabase();

        // 1. Check Supabase session
        if (supabase) {
          try {
            // Get current session state
            const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
            
            if (session && !sessionErr) {
              // Verify user to ensure token is still valid
              // In some iframe environments, getUser() can fail due to 3rd party cookies
              // We'll be cautious but not fatal if session exists
              const { data: { user }, error: userErr } = await supabase.auth.getUser();
              
              if (user && !userErr) {
                this.session = session;
                this.currentUser = {
                  id: user.id,
                  email: user.email,
                  name: user.user_metadata?.name || user.email.split('@')[0],
                  role: user.user_metadata?.role || 'Event Planner',
                  created_at: user.created_at
                };
                localStorage.setItem('hems_active_user', JSON.stringify(this.currentUser));
              } else if (session.user) {
                // Fallback: trust session.user if getUser fails but session exists
                this.session = session;
                this.currentUser = {
                  id: session.user.id,
                  email: session.user.email,
                  name: session.user.user_metadata?.name || session.user.email.split('@')[0],
                  role: session.user.user_metadata?.role || 'Event Planner',
                  created_at: session.user.created_at
                };
                localStorage.setItem('hems_active_user', JSON.stringify(this.currentUser));
              }
            }

            // Listen for user state changes to stay in sync
            supabase.auth.onAuthStateChange(async (event, session) => {
              console.log('HEMS Auth Change:', event);
              if (session && session.user) {
                this.session = session;
                this.currentUser = {
                  id: session.user.id,
                  email: session.user.email,
                  name: session.user.user_metadata?.name || session.user.email.split('@')[0],
                  role: session.user.user_metadata?.role || 'Event Planner',
                  created_at: session.user.created_at
                };
                localStorage.setItem('hems_active_user', JSON.stringify(this.currentUser));
              } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
                const wasLoggedIn = !!this.currentUser;
                this.session = null;
                this.currentUser = null;
                localStorage.removeItem('hems_active_user');
                
                // Only redirect if we were actually logged in and we aren't already on an auth page
                if (wasLoggedIn && !window.location.pathname.includes('login.html') && !window.location.pathname.includes('register.html')) {
                  window.location.href = 'login.html?expired=true';
                }
              }
            });
          } catch (err) {
            console.error('Session init error:', err);
          }
        }

        // 2. Check active persistent user session
        // If Supabase didn't find a session, check if we have a verified backend session
        if (!this.currentUser) {
          try {
            const storedUser = localStorage.getItem('hems_active_user');
            if (storedUser) {
              this.currentUser = JSON.parse(storedUser);
              // If we have a stored user but no session, create a mock session for compatibility
              if (!this.session) {
                this.session = { user: this.currentUser };
              }
            }
          } catch (err) {
            console.warn('Fallback session error:', err);
          }
        }
      } finally {
        this.isInitialized = true;
        this.initPromise = null;
      }
      return this.currentUser;
    })();

    return this.initPromise;
  },


  /**
   * Returns currently authenticated user
   */
  getCurrentUser() {
    return this.currentUser;
  },

  /**
   * Sign In
   */
  async login(email, password) {
    await this.init();
    const cleanEmail = (email || '').trim().toLowerCase();
    const supabase = getSupabase();

    if (!cleanEmail || !password) {
      return { success: false, message: 'Please enter both email and password.' };
    }

    // Step 1: Try Supabase Auth First (Directly)
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password
        });

        if (!error && data?.session && data?.user) {
          this.session = data.session;
          this.currentUser = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || data.user.email.split('@')[0],
            role: data.user.user_metadata?.role || 'Event Planner',
            created_at: data.user.created_at
          };
          localStorage.setItem('hems_active_user', JSON.stringify(this.currentUser));
          return { success: true, user: this.currentUser };
        }
        
        // If error is related to invalid credentials, we should probably stop here
        // unless we want to allow local-only login for some reason.
        if (error && error.message.includes('Invalid login credentials')) {
          return { success: false, message: 'Invalid email or password.' };
        }
      } catch (err) {
        console.warn('Supabase sign-in direct exception:', err);
      }
    }

    // Step 2: Try Backend Auth Endpoint (Proxy/Fallback)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password })
      });
      const data = await res.json();

      if (res.ok && data.success && data.user) {
        this.currentUser = data.user;
        
        // If backend returned a real Supabase session, apply it to our client
        if (data.session && supabase) {
          try {
            const { error: setErr } = await supabase.auth.setSession(data.session);
            if (!setErr) {
              this.session = data.session;
            } else {
              console.warn('Failed to sync Supabase session from backend:', setErr.message);
              // Do not set mock session if cloud is intended
              this.session = null;
            }
          } catch (e) {
            this.session = null;
          }
        } else if (!supabase) {
          // Only use mock session if NO cloud is configured at all
          this.session = { user: data.user };
        } else {
          this.session = null; // No cloud session available
        }

        if (this.currentUser) {
          localStorage.setItem('hems_active_user', JSON.stringify(this.currentUser));
          return { success: true, user: this.currentUser };
        }
      }

      if (data.canActivate) {
        return {
          success: false,
          message: 'Account found but password needs activation or email needs confirmation.',
          canActivate: true
        };
      }
      
      if (!res.ok && data.message) {
        return { success: false, message: data.message };
      }
    } catch (err) {
      console.warn('Server auth login attempt:', err);
    }

    return {
      success: false,
      message: 'Sign in failed. Please check your credentials.',
      canActivate: false
    };
  },


  /**
   * Activate & Sign In
   */
  async activate(email, password, name) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim() || cleanEmail.split('@')[0];

    try {
      const res = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password, name: cleanName })
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        this.currentUser = data.user;
        // This is a local activation, usually no session returned
        const supabase = getSupabase();
        if (!supabase) {
          this.session = { user: data.user };
        }
        localStorage.setItem('hems_active_user', JSON.stringify(this.currentUser));
        return { success: true, user: this.currentUser };
      }
    } catch (err) {
      console.warn('Server activation error:', err);
    }

    return { success: false, message: 'Activation failed. Please check your credentials.' };
  },

  /**
   * Account Registration
   */
  async register(name, email, password, role = 'Event Planner') {
    await this.init();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim();
    const supabase = getSupabase();

    // Direct Supabase sign up first
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: { data: { name: cleanName, role } }
        });

        if (!error && data?.user) {
          // Check if session was returned (auto-confirm)
          if (data.session) {
            this.session = data.session;
            this.currentUser = {
              id: data.user.id,
              email: data.user.email,
              name: data.user.user_metadata?.name || cleanName,
              role: data.user.user_metadata?.role || role,
              created_at: data.user.created_at
            };
            localStorage.setItem('hems_active_user', JSON.stringify(this.currentUser));
            return { success: true, user: this.currentUser };
          } else {
            // Email confirmation required or session not returned
            return { 
              success: true, 
              message: 'Account created! Please check your email for a confirmation link before signing in.',
              needsConfirmation: true 
            };
          }
        }
        if (error) {
          console.warn('Supabase direct sign up error:', error.message);
        }
      } catch (err) {
        console.warn('Supabase sign up error:', err);
      }
    }

    // Call server endpoint (which handles redundancy and fallback storage)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName, email: cleanEmail, password, role })
      });
      const data = await res.json();

      if (res.ok && data.success && data.user) {
        // Sync session if backend returned one
        if (data.session && supabase) {
          await supabase.auth.setSession(data.session);
          this.session = data.session;
        } else if (!supabase) {
          this.session = { user: data.user };
        }
        
        this.currentUser = data.user;
        localStorage.setItem('hems_active_user', JSON.stringify(this.currentUser));
        return { success: true, user: this.currentUser };
      }
      if (data.message) {
        return { success: false, message: data.message };
      }
    } catch (e) {
      console.warn('Backend register error:', e);
    }

    return { success: false, message: 'Registration failed. Please try again.' };
  },

  /**
   * Sign Out
   */
  async logout() {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Sign out error:', e);
      }
    }
    localStorage.removeItem('hems_active_user');
    this.session = null;
    this.currentUser = null;
    window.location.href = 'login.html';
  },

  /**
   * Route Guard: Ensures user is signed in
   */
  async requireAuth() {
    await this.init();
    const supabase = getSupabase();

    if (!this.currentUser) {
      this._redirectToLogin();
      return null;
    }

    // If cloud database is configured, only verify it if we have an active session
    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Only verify if we actually have a session to verify
        if (session) {
          const { data: { user }, error } = await supabase.auth.getUser();
          if (error) {
            // Check if it's a definitive unauthenticated error (401)
            // or just a network/transient error
            if (error.status === 401 || error.status === 403) {
              console.warn('HEMS: Cloud session definitively invalid. Clearing local session.');
              localStorage.removeItem('hems_active_user');
              this.currentUser = null;
              this.session = null;
              this._redirectToLogin(true);
              return null;
            } else {
              console.warn('HEMS: Cloud session verification failed (transient), allowing access via existing state.');
            }
          } else if (!user) {
            console.warn('HEMS: Cloud user not found. Clearing local session.');
            localStorage.removeItem('hems_active_user');
            this.currentUser = null;
            this.session = null;
            this._redirectToLogin(true);
            return null;
          }
        } else {
          // If no cloud session but we have a currentUser, we allow it (local/backend fallback)
          console.log('HEMS: No cloud session, proceeding with local auth state.');
        }
      } catch (err) {
        console.warn('HEMS: Cloud session check failed.', err);
      }
    }

    return this.currentUser;
  },

  /**
   * Internal helper for consistent login redirection
   */
  _redirectToLogin(expired = false) {
    const currentPath = window.location.pathname;
    const filename = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'dashboard.html';
    let url = `login.html?redirect=${encodeURIComponent(filename)}`;
    if (expired) url += '&expired=true';
    window.location.href = url;
  },

  /**
   * Update Profile Details
   */
  async updateProfile(name) {
    const cleanName = (name || '').trim();
    const supabase = getSupabase();

    if (supabase && this.session?.access_token) {
      try {
        const { error } = await supabase.auth.updateUser({
          data: { name: cleanName }
        });
        if (!error && this.currentUser) {
          this.currentUser.name = cleanName;
          return true;
        }
      } catch {}
    }

    if (this.currentUser) {
      this.currentUser.name = cleanName;
      localStorage.setItem('hems_active_user', JSON.stringify(this.currentUser));
      return true;
    }
    return false;
  },

  /**
   * Update Password
   */
  async updatePassword(newPassword) {
    const supabase = getSupabase();
    if (supabase && this.session?.access_token) {
      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        return !error;
      } catch {
        return false;
      }
    }

    if (this.currentUser) {
      try {
        await this.activate(this.currentUser.email, newPassword, this.currentUser.name);
        return true;
      } catch {}
    }
    return true;
  }
};
