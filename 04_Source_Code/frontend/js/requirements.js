/**
 * Hospitality and Event Management System (HEMS)
 * Requirements Module - Requirement CRUD & Service Operations
 * Powered by Supabase PostgreSQL
 */

const RequirementService = {
  /**
   * Retrieves requirements for an event
   */
  async getRequirements(eventId = null) {
    return await DatabaseService.getRequirements(eventId);
  },

  /**
   * Retrieves single requirement by ID
   */
  async getRequirementById(id) {
    if (!id) return null;
    return await DatabaseService.getRequirementById(id);
  },

  /**
   * Creates a new requirement item
   */
  async createRequirement(eventId, data) {
    return await DatabaseService.createRequirement(eventId, data);
  },

  /**
   * Updates an existing requirement
   */
  async updateRequirement(id, updateData) {
    return await DatabaseService.updateRequirement(id, updateData);
  },

  /**
   * Deletes a requirement
   */
  async deleteRequirement(id) {
    return await DatabaseService.deleteRequirement(id);
  },

  /**
   * Bulk saves AI generated requirements for an event
   */
  async saveBulkRequirements(eventId, generatedList, clearExisting = false) {
    return await DatabaseService.saveBulkRequirements(eventId, generatedList, clearExisting);
  },

  /**
   * Calculates total estimated cost for an event
   */
  async calculateTotalEstimatedCost(eventId) {
    const reqsData = await this.getRequirements(eventId);
    const reqs = Array.isArray(reqsData) ? reqsData : [];
    return reqs.reduce((sum, r) => sum + (parseFloat(r.estimated_cost) || 0), 0);
  }
};
