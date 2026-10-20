/**
 * Hospitality and Event Management System (HEMS)
 * Suppliers Module - Supplier Directory & Event Association
 * Powered by Supabase PostgreSQL
 */

const SupplierService = {
  /**
   * Retrieves suppliers with their services
   */
  async getSuppliers() {
    return await DatabaseService.getSuppliers();
  },

  /**
   * Retrieves single supplier by ID
   */
  async getSupplierById(id) {
    if (!id) return null;
    return await DatabaseService.getSupplierById(id);
  },

  /**
   * Registers a new supplier in the system
   */
  async createSupplier(data) {
    return await DatabaseService.createSupplier(data);
  },

  /**
   * Updates an existing supplier
   */
  async updateSupplier(id, data) {
    return await DatabaseService.updateSupplier(id, data);
  },

  /**
   * Deletes a supplier
   */
  async deleteSupplier(id) {
    return await DatabaseService.deleteSupplier(id);
  },

  /**
   * Retrieves suppliers associated with an event
   */
  async getEventSuppliers(eventId) {
    return await DatabaseService.getEventSuppliers(eventId);
  },

  /**
   * Associates a supplier and service with an event (bridge entity)
   */
  async associateSupplierWithEvent(data) {
    return await DatabaseService.assignSupplierToEvent(data);
  },

  /**
   * Removes an event-supplier association
   */
  async removeEventSupplier(id) {
    return await DatabaseService.removeSupplierFromEvent(id);
  }
};
