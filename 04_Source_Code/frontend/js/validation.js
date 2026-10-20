/**
 * Hospitality and Event Management System (HEMS)
 * Validation Module - Client-side Rules & Error Messaging
 */

const Validation = {
  /**
   * Validates Event Creation & Updates
   */
  validateEvent(data) {
    const errors = {};

    if (!data.name || data.name.trim().length === 0) {
      errors.name = 'Event name is required.';
    } else if (data.name.trim().length < 3) {
      errors.name = 'Event name must be at least 3 characters.';
    }

    if (!data.event_type || data.event_type.trim().length === 0) {
      errors.event_type = 'Please select an event type.';
    }

    if (!data.event_date) {
      errors.event_date = 'Event date is required.';
    }

    const guests = Number(data.guest_count);
    if (isNaN(guests) || guests <= 0 || !Number.isInteger(guests)) {
      errors.guest_count = 'Guest count must be a positive whole number greater than 0.';
    }

    const budget = Number(data.budget);
    if (isNaN(budget) || budget <= 0) {
      errors.budget = 'Event budget must be a positive amount greater than 0.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  /**
   * Validates Event Requirement Fields
   */
  validateRequirement(data) {
    const errors = {};

    if (!data.category || data.category.trim().length === 0) {
      errors.category = 'Category is required.';
    }

    if (!data.item || data.item.trim().length === 0) {
      errors.item = 'Requirement item name is required.';
    }

    const qty = Number(data.quantity);
    if (isNaN(qty) || qty <= 0) {
      errors.quantity = 'Quantity must be a positive number.';
    }

    const cost = Number(data.estimated_cost);
    if (isNaN(cost) || cost < 0) {
      errors.estimated_cost = 'Estimated cost must be 0 or greater.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  /**
   * Validates Task Fields
   */
  validateTask(data) {
    const errors = {};

    if (!data.title || data.title.trim().length === 0) {
      errors.title = 'Task title is required.';
    }

    if (!data.due_date) {
      errors.due_date = 'Due date is required.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  /**
   * Validates Expense Fields
   */
  validateExpense(data) {
    const errors = {};

    if (!data.category || data.category.trim().length === 0) {
      errors.category = 'Expense category is required.';
    }

    if (!data.description || data.description.trim().length === 0) {
      errors.description = 'Expense description is required.';
    }

    const amt = Number(data.amount);
    if (isNaN(amt) || amt <= 0) {
      errors.amount = 'Expense amount must be a positive number greater than 0.';
    }

    if (!data.date) {
      errors.date = 'Expense date is required.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  /**
   * Validates Supplier Fields
   */
  validateSupplier(data) {
    const errors = {};

    if (!data.name || data.name.trim().length === 0) {
      errors.name = 'Supplier name is required.';
    }

    if (!data.category || data.category.trim().length === 0) {
      errors.category = 'Supplier category is required.';
    }

    if (!data.contact || data.contact.trim().length === 0) {
      errors.contact = 'Contact information is required.';
    }

    if (!data.location || data.location.trim().length === 0) {
      errors.location = 'Location is required.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  /**
   * DOM helper to display form errors inline
   */
  showErrors(formElement, errors) {
    this.clearErrors(formElement);
    for (const [fieldName, message] of Object.entries(errors)) {
      const field = formElement.querySelector(`[name="${fieldName}"]`);
      if (field) {
        field.classList.add('is-invalid');
        const errorContainer = formElement.querySelector(`#error-${fieldName}`) ||
                               formElement.querySelector(`.error-${fieldName}`);
        if (errorContainer) {
          errorContainer.textContent = message;
          errorContainer.classList.add('visible');
        }
      }
    }
  },

  /**
   * DOM helper to clear errors
   */
  clearErrors(formElement) {
    if (!formElement) return;
    formElement.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    formElement.querySelectorAll('.form-error').forEach(el => {
      el.textContent = '';
      el.classList.remove('visible');
    });
  }
};
