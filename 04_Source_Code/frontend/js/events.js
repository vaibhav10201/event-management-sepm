/**
 * Hospitality and Event Management System (HEMS)
 * Events Module - Event Service & CRUD Operations
 * Powered by Supabase PostgreSQL with User-scoped RLS
 */

const EventService = {
  /**
   * Retrieves list of all events for authenticated user
   */
  async getEvents() {
    return await DatabaseService.getEvents();
  },

  /**
   * Retrieves single event by ID
   */
  async getEventById(id) {
    if (!id) return null;
    return await DatabaseService.getEventById(id);
  },

  /**
   * Creates a new event record belonging to the authenticated user
   */
  async createEvent(eventData) {
    return await DatabaseService.createEvent(eventData);
  },

  /**
   * Updates an existing event
   */
  async updateEvent(id, updateData) {
    return await DatabaseService.updateEvent(id, updateData);
  },

  /**
   * Deletes an event (cascades to requirements, tasks, expenses via Postgres foreign keys)
   */
  async deleteEvent(id) {
    return await DatabaseService.deleteEvent(id);
  }
};
