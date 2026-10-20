/**
 * Hospitality and Event Management System (HEMS)
 * Tasks Module - Task Service & CRUD Operations
 * Powered by Supabase PostgreSQL
 */

const TaskService = {
  /**
   * Retrieves tasks, optionally filtered by event
   */
  async getTasks(eventId = null) {
    return await DatabaseService.getTasks(eventId);
  },

  /**
   * Retrieves single task by ID
   */
  async getTaskById(id) {
    if (!id) return null;
    return await DatabaseService.getTaskById(id);
  },

  /**
   * Creates a new task
   */
  async createTask(data) {
    return await DatabaseService.createTask(data);
  },

  /**
   * Updates an existing task
   */
  async updateTask(id, updateData) {
    return await DatabaseService.updateTask(id, updateData);
  },

  /**
   * Updates only task status (Pending, In Progress, Completed)
   */
  async updateTaskStatus(id, newStatus) {
    return await DatabaseService.updateTask(id, { status: newStatus });
  },

  /**
   * Deletes a task
   */
  async deleteTask(id) {
    return await DatabaseService.deleteTask(id);
  },

  /**
   * Bulk saves AI generated tasks
   */
  async saveBulkTasks(eventId, taskList) {
    return await DatabaseService.saveBulkTasks(eventId, taskList);
  }
};
