/**
 * Hospitality and Event Management System (HEMS)
 * API & Database Integration Layer
 * 
 * - Seamless integration with Supabase client (configured via public URL and anon key)
 * - User-scoped operations strictly preserving data ownership and privacy
 * - Secure server-side endpoint communication for intelligent event planning
 * - Zero developer jargon exposed in user messages
 */

const ApiConfig = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  hasGeminiKey: false,
  isConfigured: false,
  isInitialized: false,

  async init() {
    if (this.isInitialized) return;

    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        this.supabaseUrl = data.supabaseUrl || '';
        this.supabaseAnonKey = data.supabaseAnonKey || '';
        this.hasGeminiKey = Boolean(data.hasGeminiKey);
        this.isConfigured = Boolean(this.supabaseUrl && this.supabaseAnonKey);
      }
    } catch (e) {
      console.warn('Config load:', e);
    }

    const localUrl = localStorage.getItem('hems_supabase_url');
    const localKey = localStorage.getItem('hems_supabase_anon_key');
    if (localUrl && localKey) {
      this.supabaseUrl = localUrl;
      this.supabaseAnonKey = localKey;
      this.isConfigured = true;
    }

    if (this.isConfigured && window.supabase && window.supabase.createClient) {
      try {
        window.supabaseClient = window.supabase.createClient(this.supabaseUrl, this.supabaseAnonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          }
        });
      } catch (err) {
        console.error('Client init error:', err);
      }
    }

    this.isInitialized = true;
  }
};

function getSupabase() {
  return window.supabaseClient || null;
}

// Local user-scoped storage helper when working before remote configuration
function getLocalKey(entity) {
  const user = typeof AuthService !== 'undefined' ? AuthService.getCurrentUser() : null;
  const uid = user ? user.id : 'guest';
  return `hems_usr_${uid}_${entity}`;
}

function getLocalStore(entity) {
  try {
    const raw = localStorage.getItem(getLocalKey(entity));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalStore(entity, items) {
  try {
    localStorage.setItem(getLocalKey(entity), JSON.stringify(items));
  } catch (err) {
    console.error('Store error:', err);
  }
}

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Event Planning Service Caller
 */
const AIService = {
  async analyzeEvent(eventData) {
    try {
      const response = await fetch('/api/ai/analyze-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Unable to generate event recommendations right now.');
      }

      return result;
    } catch (err) {
      console.error('Service error:', err);
      throw err;
    }
  }
};

/**
 * Database Service
 */
const DatabaseService = {
  /**
   * Internal helper to verify Supabase authentication state
   */
  async _getVerifiedAuth() {
    const supabase = getSupabase();
    if (!supabase) return { user: null, isSupabase: false };
    
    try {
      // Check for active cloud session
      const { data: { session } } = await supabase.auth.getSession();
      
      // If no session, we aren't in "active cloud mode" for this user
      if (!session) {
        return { user: null, isSupabase: true, error: { message: 'No active cloud session.' } };
      }

      // If we have a session, verify it's still valid
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        return { user: null, isSupabase: true, error: error || { message: 'Session verification failed.' } };
      }
      
      return { user, isSupabase: true };
    } catch (err) {
      console.warn('HEMS Auth Check Exception:', err);
      return { user: null, isSupabase: true, error: err };
    }
  },

  /**
   * Returns current connection status
   */
  async getCloudStatus() {
    await ApiConfig.init();
    const supabase = getSupabase();
    if (!supabase) return { connected: false, message: 'Cloud connection not configured.' };
    
    const auth = await this._getVerifiedAuth();
    if (auth.user) {
      return { connected: true, message: `Connected with ${auth.user.email}`, user: auth.user };
    }
    return { connected: false, message: 'Cloud configured but not signed in.', isConfigured: true };
  },

  // ================= EVENTS =================
  async getEvents() {
    const auth = await this._getVerifiedAuth();
    const supabase = getSupabase();

    if (auth.isSupabase && auth.user && supabase) {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('event_date', { ascending: true });

        if (!error && data) return data;
        if (error) console.error('Cloud events fetch error:', error);
      } catch (e) {
        console.error('Events query error:', e);
      }
    }

    // Isolated user-scoped store
    const list = getLocalStore('events') || [];
    return [...list].sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
  },

  async getEventById(id) {
    if (!id) return null;
    const auth = await this._getVerifiedAuth();
    const supabase = getSupabase();

    if (auth.isSupabase && auth.user && supabase && !id.startsWith('evt_')) {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) return data;
      } catch (e) {
        console.error('Event query error:', e);
      }
    }

    const list = getLocalStore('events');
    return list.find(e => e.id === id) || null;
  },

  async createEvent(eventData) {
    const auth = await this._getVerifiedAuth();
    const currentUser = typeof AuthService !== 'undefined' ? AuthService.getCurrentUser() : null;

    if (!auth.user && !currentUser) {
      return { success: false, message: 'Please sign in to save your event.' };
    }

    const isCloudMode = auth.isSupabase && auth.user;
    const finalUserId = auth.user ? auth.user.id : (currentUser ? currentUser.id : 'guest');
    
    // Diagnostic logging for development (safe)
    if (isCloudMode) {
      console.log('HEMS Cloud Trace:', {
        sessionActive: true,
        authUserId: auth.user.id,
        payloadUserId: finalUserId,
        idMatch: auth.user.id === finalUserId
      });
    } else if (auth.isSupabase) {
      console.warn('HEMS Cloud Trace: Cloud configured but NO valid session found.', {
        error: auth.error ? (auth.error.message || auth.error) : 'Unknown'
      });
    }

    const payload = {
      id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      user_id: finalUserId,
      name: (eventData.name || '').trim(),
      event_type: eventData.event_type || 'Other',
      event_date: (eventData.event_date || new Date().toISOString()).split('T')[0],
      guest_count: parseInt(eventData.guest_count, 10) || 0,
      budget: parseFloat(eventData.budget) || 0,
      location: (eventData.location || '').trim(),
      duration: (eventData.duration || '').trim() || 'Full Day',
      description: (eventData.description || '').trim(),
      special_requirements: (eventData.special_requirements || '').trim(),
      status: eventData.status || 'Planning',
      created_at: new Date().toISOString()
    };

    const supabase = getSupabase();
    if (isCloudMode && supabase) {
      try {
        const { data, error } = await supabase
          .from('events')
          .insert({
            user_id: payload.user_id,
            name: payload.name,
            event_type: payload.event_type,
            event_date: payload.event_date,
            guest_count: payload.guest_count,
            budget: payload.budget,
            location: payload.location,
            duration: payload.duration,
            description: payload.description,
            special_requirements: payload.special_requirements,
            status: payload.status
          })
          .select()
          .single();

        if (error) {
          console.error('HEMS Cloud Save Error:', error.message, error.details);
          if (error.code === '42501') return { success: false, message: 'Permission denied. Ensure your email is confirmed and you are signed in.' };
          if (error.code === 'PGRST204') return { success: false, message: `Database schema mismatch. Please run migration.` };
          return { success: false, message: `Cloud database error: ${error.message}` };
        }
        if (data) {
          console.log('HEMS Cloud Save Success:', data.id);
          return { success: true, event: data };
        }
      } catch (err) {
        console.error('HEMS Cloud save exception:', err);
        return { success: false, message: 'Unable to connect to the cloud database.' };
      }
    }

    // Local Storage Fallback (Only if NOT in cloud mode)
    if (auth.isSupabase && ApiConfig.supabaseUrl) {
      return { success: false, message: 'Cloud session is required to save events. Please sign in again.' };
    }

    console.log('HEMS: Saving event to local storage (No cloud active).');
    const events = getLocalStore('events');
    events.unshift(payload);
    setLocalStore('events', events);
    return { success: true, event: payload };
  },

  async updateEvent(id, updateData) {
    if (!id) return { success: false, message: 'Invalid event identifier.' };

    const auth = await this._getVerifiedAuth();
    const supabase = getSupabase();
    // Only attempt cloud update if it's not a local-only ID
    if (auth.isSupabase && auth.user && supabase && !id.toString().startsWith('evt_')) {
      try {
        const allowedKeys = ['name', 'event_type', 'event_date', 'guest_count', 'budget', 'location', 'duration', 'description', 'special_requirements', 'status'];
        const payload = {};
        allowedKeys.forEach(key => {
          if (updateData[key] !== undefined) payload[key] = updateData[key];
        });
        
        if (payload.guest_count !== undefined) payload.guest_count = parseInt(payload.guest_count, 10);
        if (payload.budget !== undefined) payload.budget = parseFloat(payload.budget);
        if (payload.event_date !== undefined) payload.event_date = payload.event_date.split('T')[0];

        const { data, error } = await supabase
          .from('events')
          .update(payload)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          if (error.code === 'PGRST204') throw new Error(`Schema mismatch: Column "${error.message.split("'")[1]}" is missing in "events". Please run the SQL migration.`);
          // If row not found in cloud, we might still have it locally
          if (error.code !== 'PGRST116') throw error;
        }
        if (data) return { success: true, event: data };
      } catch (err) {
        console.error('Update event error:', err);
        return { 
          success: false, 
          message: err.message || 'Unable to update event.',
          details: err 
        };
      }
    }

    const events = getLocalStore('events');
    const idx = events.findIndex(e => e.id.toString() === id.toString());
    if (idx !== -1) {
      events[idx] = { ...events[idx], ...updateData };
      setLocalStore('events', events);
      return { success: true, event: events[idx] };
    }
    return { success: false, message: 'Event not found.' };
  },

  async deleteEvent(id) {
    if (!id) return false;
    const auth = await this._getVerifiedAuth();
    const supabase = getSupabase();

    const idStr = id.toString();
    let cloudSuccess = true;

    if (auth.isSupabase && auth.user && supabase && !idStr.startsWith('evt_')) {
      try {
        const { error } = await supabase.from('events').delete().eq('id', id);
        if (error) {
          console.error('HEMS Cloud Delete Error:', error);
          cloudSuccess = false;
        }
      } catch (err) {
        console.error('HEMS Delete Exception:', err);
        cloudSuccess = false;
      }
    }

    // Always clean up local storage regardless of cloud success (if cloud failed, it's out of sync but local is "deleted")
    const events = getLocalStore('events').filter(e => e.id.toString() !== idStr);
    setLocalStore('events', events);

    const reqs = getLocalStore('requirements').filter(r => r.event_id.toString() !== idStr);
    setLocalStore('requirements', reqs);

    const tasks = getLocalStore('tasks').filter(t => t.event_id.toString() !== idStr);
    setLocalStore('tasks', tasks);

    const exp = getLocalStore('expenses').filter(x => x.event_id.toString() !== idStr);
    setLocalStore('expenses', exp);

    return cloudSuccess;
  },

  // ================= REQUIREMENTS =================
  async getRequirements(eventId) {
    if (!eventId) return [];
    
    let cloudData = [];
    let localData = [];

    // 1. Try to get from LocalStorage first (for speed and immediate feedback)
    const allLocal = getLocalStore('requirements') || [];
    localData = allLocal.filter(r => r.event_id === eventId);

    // 2. Try to get from Supabase
    const auth = await this._getVerifiedAuth();
    const supabase = getSupabase();

    if (auth.isSupabase && auth.user && supabase && !eventId.toString().startsWith('evt_')) {
      try {
        const { data, error } = await supabase
          .from('event_requirements')
          .select('*')
          .eq('event_id', eventId);

        if (!error && data) {
          cloudData = data;
        }
      } catch (err) {
        console.error('HEMS Requirements query crash:', err);
      }
    }

    // 3. Merge data, preferring cloud data but keeping local-only items
    const mergedMap = new Map();
    localData.forEach(item => mergedMap.set(item.id, item));
    cloudData.forEach(item => mergedMap.set(item.id, item));

    return Array.from(mergedMap.values()).sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  },

  async clearRequirements(eventId) {
    if (!eventId) return;
    const auth = await this._getVerifiedAuth();
    const supabase = getSupabase();
    if (auth.isSupabase && auth.user && supabase && !eventId.toString().startsWith('evt_')) {
      try {
        await supabase.from('event_requirements').delete().eq('event_id', eventId);
      } catch (err) {
        console.error('Clear cloud reqs error:', err);
      }
    }
    const all = getLocalStore('requirements').filter(r => r.event_id !== eventId);
    setLocalStore('requirements', all);
    return true;
  },

  async getRequirementById(id) {
    if (!id) return null;
    const auth = await this._getVerifiedAuth();
    const supabase = getSupabase();

    if (auth.isSupabase && auth.user && supabase && !id.toString().startsWith('req_')) {
      try {
        const { data, error } = await supabase
          .from('event_requirements')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) return data;
      } catch (err) {
        console.error('Req query error:', err);
      }
    }

    const all = getLocalStore('requirements');
    return all.find(r => r.id === id) || null;
  },

  async createRequirement(eventId, data) {
    const item = {
      id: generateUUID(),
      event_id: eventId,
      category: data.category || 'General',
      item: data.item || 'Required Item',
      quantity: parseInt(data.quantity, 10) || 1,
      estimated_cost: parseFloat(data.estimated_cost) || 0,
      priority: data.priority || 'Medium',
      status: data.status || 'Pending',
      notes: data.notes || '',
      created_at: new Date().toISOString()
    };

    const auth = await this._getVerifiedAuth();
    const supabase = getSupabase();
    if (auth.isSupabase && auth.user && supabase && !eventId.toString().startsWith('evt_')) {
      try {
        const { data: res, error } = await supabase
          .from('event_requirements')
          .insert({
            event_id: eventId,
            category: item.category,
            item: item.item,
            quantity: item.quantity,
            estimated_cost: item.estimated_cost,
            priority: item.priority,
            status: item.status,
            notes: item.notes
          })
          .select()
          .single();

        if (!error && res) return { success: true, requirement: res };
      } catch (err) {
        console.error('Create req error:', err);
      }
    }

    const all = getLocalStore('requirements');
    all.push(item);
    setLocalStore('requirements', all);
    return { success: true, requirement: item };
  },

  async updateRequirement(id, updateData) {
    const auth = await this._getVerifiedAuth();
    const supabase = getSupabase();
    if (auth.isSupabase && auth.user && supabase && !id.toString().startsWith('req_')) {
      try {
        const allowedKeys = ['category', 'item', 'quantity', 'estimated_cost', 'priority', 'status', 'notes'];
        const payload = {};
        allowedKeys.forEach(k => { if (updateData[k] !== undefined) payload[k] = updateData[k]; });

        const { data, error } = await supabase
          .from('event_requirements')
          .update(payload)
          .eq('id', id)
          .select()
          .single();

        if (!error && data) return { success: true, requirement: data };
      } catch (err) {
        console.error('Update req error:', err);
      }
    }

    const all = getLocalStore('requirements');
    const idx = all.findIndex(r => r.id === id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...updateData };
      setLocalStore('requirements', all);
      return { success: true, requirement: all[idx] };
    }
    return { success: false };
  },

  async deleteRequirement(id) {
    const auth = await this._getVerifiedAuth();
    const supabase = getSupabase();
    if (auth.isSupabase && auth.user && supabase && !id.toString().startsWith('req_')) {
      try {
        await supabase.from('event_requirements').delete().eq('id', id);
      } catch (err) {
        console.error('Delete req error:', err);
      }
    }

    const all = getLocalStore('requirements').filter(r => r.id !== id);
    setLocalStore('requirements', all);
    return true;
  },

  async saveBulkRequirements(eventId, requirementsList, clearExisting = false) {
    if (!Array.isArray(requirementsList) || requirementsList.length === 0) return true;

    if (clearExisting) {
      await this.clearRequirements(eventId);
    }

    const formattedList = requirementsList.map((r) => {
      let noteParts = [r.notes || ''];
      if (r.estimate_source) noteParts.push(`Source: ${r.estimate_source}`);
      if (r.dependencies) noteParts.push(`Depends on: ${r.dependencies}`);
      
      const qty = parseInt(r.quantity, 10) || 1;
      const uCost = parseFloat(r.estimated_unit_cost || r.unit_cost) || 0;

      return {
        id: (r.id && r.id.length > 20) ? r.id : generateUUID(),
        event_id: eventId,
        category: r.category || 'General',
        item: r.item || r.item_name || 'Required Item',
        quantity: qty,
        unit: r.unit || 'units',
        estimated_unit_cost: uCost,
        estimated_cost: parseFloat(r.estimated_cost) || (qty * uCost),
        priority: ['High', 'Medium', 'Low'].includes(r.priority) ? r.priority : 'Medium',
        status: r.status || 'Pending',
        notes: noteParts.filter(Boolean).join(' | '),
        created_at: r.created_at || new Date().toISOString()
      };
    });

    // 1. Always save to LocalStorage for safety and offline access
    const all = getLocalStore('requirements') || [];
    // Ensure we don't duplicate items if we already have them in 'all' (dedupe by ID)
    const existingIds = new Set(all.map(item => item.id));
    const newItems = formattedList.filter(item => !existingIds.has(item.id));
    
    setLocalStore('requirements', [...all, ...newItems]);
    console.log(`HEMS: Bulk saved ${newItems.length} new items to Local Storage.`);

    // 2. Try to save to Supabase
    const auth = await this._getVerifiedAuth();
    const supabase = getSupabase();
    if (auth.isSupabase && auth.user && supabase && !eventId.toString().startsWith('evt_')) {
      try {
        const { error } = await supabase.from('event_requirements').insert(formattedList);
        
        if (!error) {
          console.log(`HEMS: Bulk saved ${formattedList.length} items to Supabase.`);
          return formattedList.length;
        }

        console.warn('HEMS: Supabase bulk save failed, attempting safe fallback...', error);
        
        const safePayload = formattedList.map(r => ({
          id: r.id,
          event_id: r.event_id,
          category: r.category,
          item: r.item,
          quantity: r.quantity,
          estimated_cost: r.estimated_cost,
          priority: r.priority,
          status: r.status
        }));
        
        const { error: retryError } = await supabase.from('event_requirements').insert(safePayload);
        if (!retryError) {
          console.log('HEMS: Bulk save successful with safe fallback.');
        } else {
          console.error('HEMS: Safe fallback failed:', retryError);
        }
      } catch (err) {
        console.error('HEMS: Bulk save crash:', err);
      }
    }

    return formattedList.length;
  },

  // ================= TASKS =================
  async getTasks(eventId = null) {
    const auth = await this._getVerifiedAuth();
    const supabase = getSupabase();

    if (auth.isSupabase && auth.user && supabase && (!eventId || !eventId.toString().startsWith('evt_'))) {
      try {
        let query = supabase.from('tasks').select('*').order('due_date', { ascending: true });
        if (eventId) query = query.eq('event_id', eventId);
        const { data, error } = await query;
        if (!error && data) return data;
      } catch (err) {
        console.error('Tasks query error:', err);
      }
    }

    const all = getLocalStore('tasks') || [];
    if (eventId) return all.filter(t => t.event_id === eventId);
    return [...all].sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  },

  async getTaskById(id) {
    if (!id) return null;
    const auth = await this._getVerifiedAuth();
    const supabase = getSupabase();

    if (auth.isSupabase && auth.user && supabase && !id.toString().startsWith('tsk_')) {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) return data;
      } catch (e) {
        console.error('Task query error:', e);
      }
    }

    const all = getLocalStore('tasks');
    return all.find(t => t.id === id) || null;
  },

  async createTask(data) {
    const auth = await this._getVerifiedAuth();
    const item = {
      id: 'tsk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      event_id: data.event_id,
      title: data.title || 'Untitled Task',
      description: data.description || '',
      category: data.category || 'General',
      priority: data.priority || 'Medium',
      due_date: (data.due_date || new Date().toISOString()).split('T')[0],
      assigned_to: data.assigned_to || '',
      status: data.status || 'Pending',
      created_at: new Date().toISOString()
    };

    const supabase = getSupabase();
    if (auth.isSupabase && auth.user && supabase && !data.event_id.toString().startsWith('evt_')) {
      try {
        const { data: res, error } = await supabase.from('tasks').insert({
          event_id: item.event_id,
          title: item.title,
          due_date: item.due_date,
          status: item.status
        }).select().single();

        if (!error && res) return { success: true, task: res };
      } catch (err) {
        console.error('Create task error:', err);
      }
    }

    const all = getLocalStore('tasks');
    all.push(item);
    setLocalStore('tasks', all);
    return { success: true, task: item };
  },

  async updateTask(id, updateData) {
    const auth = await this._getVerifiedAuth();
    const supabase = getSupabase();
    if (auth.isSupabase && auth.user && supabase && !id.toString().startsWith('tsk_')) {
      try {
        const allowedKeys = ['title', 'due_date', 'status'];
        const payload = {};
        allowedKeys.forEach(k => { if (updateData[k] !== undefined) payload[k] = updateData[k]; });
        if (payload.due_date) payload.due_date = payload.due_date.split('T')[0];

        const { data, error } = await supabase.from('tasks').update(payload).eq('id', id).select().single();
        if (!error && data) return { success: true, task: data };
      } catch (err) {
        console.error('Update task error:', err);
      }
    }

    const all = getLocalStore('tasks');
    const idx = all.findIndex(t => t.id === id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...updateData };
      setLocalStore('tasks', all);
      return { success: true, task: all[idx] };
    }
    return { success: false };
  },

  async deleteTask(id) {
    const auth = await this._getVerifiedAuth();
    const supabase = getSupabase();
    if (auth.isSupabase && auth.user && supabase && !id.toString().startsWith('tsk_')) {
      try {
        await supabase.from('tasks').delete().eq('id', id);
      } catch (err) {
        console.error('Delete task error:', err);
      }
    }

    const all = getLocalStore('tasks').filter(t => t.id !== id);
    setLocalStore('tasks', all);
    return true;
  },

  async saveBulkTasks(eventId, tasksList) {
    if (!Array.isArray(tasksList) || tasksList.length === 0) return true;

    const auth = await this._getVerifiedAuth();
    const supabase = getSupabase();
    if (auth.isSupabase && auth.user && supabase && !eventId.toString().startsWith('evt_')) {
      try {
        const payload = tasksList.map(t => ({
          event_id: eventId,
          title: t.title || 'Untitled Task',
          due_date: (t.suggested_end_date || t.due_date || new Date().toISOString()).split('T')[0],
          status: 'Pending'
        }));

        const { error } = await supabase.from('tasks').insert(payload);
        if (!error) return true;
        console.error('Bulk tasks cloud save failed:', error);
      } catch (err) {
        console.error('Bulk tasks error:', err);
      }
    }

    const all = getLocalStore('tasks');
    tasksList.forEach(t => {
      all.push({
        id: 'tsk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        event_id: eventId,
        title: t.title || 'Untitled Task',
        description: t.description || '',
        category: t.category || 'General',
        priority: t.priority || 'Medium',
        due_date: (t.suggested_end_date || t.due_date || new Date().toISOString()).split('T')[0],
        assigned_to: t.assigned_role || t.assigned_to || '',
        status: 'Pending',
        created_at: new Date().toISOString()
      });
    });
    setLocalStore('tasks', all);
    return true;
  },

  // ================= EXPENSES & BUDGET =================
  async getExpenses(eventId = null) {
    const auth = await this._getVerifiedAuth();
    const supabase = getSupabase();

    if (auth.isSupabase && auth.user && supabase && (!eventId || !eventId.toString().startsWith('evt_'))) {
      try {
        let query = supabase.from('expenses').select('*').order('date_incurred', { ascending: false });
        if (eventId) query = query.eq('event_id', eventId);
        const { data, error } = await query;
        if (!error && data) return data;
        if (error) console.warn('Cloud fetch error (expenses):', error);
      } catch (err) {
        console.warn('Expenses cloud query failed.', err);
      }
    }

    const all = getLocalStore('expenses');
    if (eventId) return all.filter(e => e.event_id === eventId);
    return all;
  },

  async createExpense(data) {
    const item = {
      id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      event_id: data.event_id,
      category: data.category || 'General',
      item: data.item || 'Expense Item',
      amount: parseFloat(data.amount) || 0,
      payment_status: data.payment_status || 'Paid',
      date_incurred: (data.date_incurred || new Date().toISOString()).split('T')[0],
      notes: data.notes || '',
      created_at: new Date().toISOString()
    };

    const auth = await this._getVerifiedAuth();
    const supabase = getSupabase();
    if (auth.isSupabase && auth.user && supabase && !data.event_id.toString().startsWith('evt_')) {
      try {
        const { data: res, error } = await supabase.from('expenses').insert({
          event_id: item.event_id,
          category: item.category,
          item: item.item,
          amount: item.amount,
          payment_status: item.payment_status,
          date_incurred: item.date_incurred,
          notes: item.notes
        }).select().single();

        if (!error && res) return { success: true, expense: res };
        if (error) console.error('Cloud Save Error (expense):', error);
      } catch (err) {
        console.error('Create expense error:', err);
      }
    }

    const all = getLocalStore('expenses');
    all.push(item);
    setLocalStore('expenses', all);
    return { success: true, expense: item };
  },

  async deleteExpense(id) {
    const auth = await this._getVerifiedAuth();
    const supabase = getSupabase();
    if (auth.isSupabase && auth.user && supabase && !id.toString().startsWith('exp_')) {
      try {
        await supabase.from('expenses').delete().eq('id', id);
      } catch (err) {
        console.error('Delete expense error:', err);
      }
    }

    const all = getLocalStore('expenses').filter(e => e.id !== id);
    setLocalStore('expenses', all);
    return true;
  },

  // ================= SUPPLIERS =================
  async getSuppliers() {
    const auth = await this._getVerifiedAuth();
    const supabase = getSupabase();

    if (auth.isSupabase && auth.user && supabase) {
      try {
        const { data, error } = await supabase.from('suppliers').select('*');
        if (!error && data) return data;
      } catch (err) {
        console.error('Suppliers error:', err);
      }
    }

    const all = getLocalStore('suppliers');
    if (all.length > 0) return all;

    // Standard supplier starter categories
    const initialSuppliers = [
      { id: 'sup_1', name: 'Grand Horizon Banquets', category: 'Venue', contact_person: 'Ramesh Gupta', phone: '+91 98110 23456', email: 'bookings@grandhorizon.com', rating: 4.8 },
      { id: 'sup_2', name: 'Royal Taste Caterers', category: 'Food & Catering', contact_person: 'Sunita Mehra', phone: '+91 98220 34567', email: 'catering@royaltaste.in', rating: 4.9 },
      { id: 'sup_3', name: 'SoundWave Acoustic Solutions', category: 'AV & Sound', contact_person: 'Vikram Joshi', phone: '+91 98330 45678', email: 'support@soundwave.com', rating: 4.7 },
      { id: 'sup_4', name: 'Elegance Floral & Themes', category: 'Decor', contact_person: 'Neha Saxena', phone: '+91 98440 56789', email: 'decor@eleganceevents.in', rating: 4.6 },
      { id: 'sup_5', name: 'LensCraft Visual Media', category: 'Photography', contact_person: 'Arjun Das', phone: '+91 98550 67890', email: 'shoots@lenscraft.com', rating: 4.9 }
    ];
    setLocalStore('suppliers', initialSuppliers);
    return initialSuppliers;
  },

  async getSupplierById(id) {
    if (!id) return null;
    const auth = await this._getVerifiedAuth();
    const supabase = getSupabase();

    if (auth.isSupabase && auth.user && supabase && !id.toString().startsWith('sup_')) {
      try {
        const { data, error } = await supabase.from('suppliers').select('*').eq('id', id).maybeSingle();
        if (!error && data) return data;
      } catch (err) {
        console.error('Supplier query error:', err);
      }
    }
    const all = getLocalStore('suppliers');
    return all.find(s => s.id === id) || null;
  },

  async createSupplier(data) {
    const item = {
      id: 'sup_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: data.name,
      category: data.category,
      contact_person: data.contact_person || '',
      phone: data.phone || '',
      email: data.email || '',
      rating: parseFloat(data.rating) || 5.0,
      created_at: new Date().toISOString()
    };

    const auth = await this._getVerifiedAuth();
    const supabase = getSupabase();
    if (auth.isSupabase && auth.user && supabase) {
      try {
        const { data: res, error } = await supabase.from('suppliers').insert({
          name: item.name,
          category: item.category,
          contact_person: item.contact_person,
          phone: item.phone,
          email: item.email,
          rating: item.rating
        }).select().single();

        if (!error && res) return { success: true, supplier: res };
      } catch (err) {
        console.error('Create supplier error:', err);
      }
    }

    const all = getLocalStore('suppliers');
    all.push(item);
    setLocalStore('suppliers', all);
    return { success: true, supplier: item };
  },

  async updateSupplier(id, updateData) {
    const auth = await this._getVerifiedAuth();
    const supabase = getSupabase();
    if (auth.isSupabase && auth.user && supabase && !id.toString().startsWith('sup_')) {
      try {
        const { data, error } = await supabase.from('suppliers').update(updateData).eq('id', id).select().single();
        if (!error && data) return { success: true, supplier: data };
      } catch (err) {
        console.error('Update supplier error:', err);
      }
    }

    const all = getLocalStore('suppliers');
    const idx = all.findIndex(s => s.id === id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...updateData };
      setLocalStore('suppliers', all);
      return { success: true, supplier: all[idx] };
    }
    return { success: false };
  },

  async deleteSupplier(id) {
    const auth = await this._getVerifiedAuth();
    const supabase = getSupabase();
    if (auth.isSupabase && auth.user && supabase && !id.toString().startsWith('sup_')) {
      try {
        await supabase.from('suppliers').delete().eq('id', id);
      } catch (err) {
        console.error('Delete supplier error:', err);
      }
    }

    const all = getLocalStore('suppliers').filter(s => s.id !== id);
    setLocalStore('suppliers', all);
    return true;
  },

  // ================= EVENT SUPPLIERS (Bridge) =================
  async getEventSuppliers(eventId) {
    if (!eventId) return [];
    const auth = await this._getVerifiedAuth();
    const supabase = getSupabase();

    if (auth.isSupabase && auth.user && supabase && !eventId.toString().startsWith('evt_')) {
      try {
        const { data, error } = await supabase
          .from('event_suppliers')
          .select('*, suppliers(*), supplier_services(*)')
          .eq('event_id', eventId);
        if (!error && data) return data;
      } catch (err) {
        console.error('Event suppliers query error:', err);
      }
    }
    const all = getLocalStore('event_suppliers');
    return all.filter(s => s.event_id === eventId);
  },

  async assignSupplierToEvent(data) {
    const item = {
      id: 'evsup_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      event_id: data.event_id,
      supplier_id: data.supplier_id,
      service_id: data.service_id || null,
      agreed_price: parseFloat(data.agreed_price) || 0,
      status: data.status || 'Confirmed',
      notes: data.notes || '',
      created_at: new Date().toISOString()
    };

    const auth = await this._getVerifiedAuth();
    const supabase = getSupabase();
    if (auth.isSupabase && auth.user && supabase && !data.event_id.toString().startsWith('evt_')) {
      try {
        const { data: res, error } = await supabase.from('event_suppliers').insert({
          event_id: item.event_id,
          supplier_id: item.supplier_id,
          service_id: item.service_id,
          agreed_price: item.agreed_price,
          status: item.status,
          notes: item.notes
        }).select('*, suppliers(*), supplier_services(*)').single();

        if (!error && res) return { success: true, association: res };
      } catch (err) {
        console.error('Assign supplier error:', err);
      }
    }

    const all = getLocalStore('event_suppliers');
    all.push(item);
    setLocalStore('event_suppliers', all);
    return { success: true, association: item };
  },

  async removeSupplierFromEvent(id) {
    const auth = await this._getVerifiedAuth();
    const supabase = getSupabase();
    if (auth.isSupabase && auth.user && supabase && !id.toString().startsWith('evsup_')) {
      try {
        await supabase.from('event_suppliers').delete().eq('id', id);
      } catch (err) {
        console.error('Remove event supplier error:', err);
      }
    }

    const all = getLocalStore('event_suppliers').filter(s => s.id !== id);
    setLocalStore('event_suppliers', all);
    return true;
  }
};
