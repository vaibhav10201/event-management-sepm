/**
 * Hospitality and Event Management System (HEMS)
 * Storage Module - Client UI State Only
 * 
 * NOTE: Per Software Engineering architecture, all persistent business data
 * (users, events, requirements, tasks, expenses, suppliers) is stored in Supabase PostgreSQL.
 * LocalStorage is strictly reserved for harmless UI preferences (sidebar toggle, draft caching).
 */

const UIStorage = {
  getDraft(key) {
    try {
      const data = localStorage.getItem('hems_draft_' + key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setDraft(key, value) {
    try {
      localStorage.setItem('hems_draft_' + key, JSON.stringify(value));
    } catch {}
  },

  clearDraft(key) {
    localStorage.removeItem('hems_draft_' + key);
  },

  getPreference(key, defaultValue = null) {
    return localStorage.getItem('hems_pref_' + key) || defaultValue;
  },

  setPreference(key, value) {
    localStorage.setItem('hems_pref_' + key, value);
  }
};
