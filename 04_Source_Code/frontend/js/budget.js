/**
 * Hospitality and Event Management System (HEMS)
 * Budget and Expenses Module - Financial Calculations & Expense Tracking
 * Powered by Supabase PostgreSQL
 */

const BudgetService = {
  /**
   * Retrieves expenses, optionally filtered by event
   */
  async getExpenses(eventId = null) {
    return await DatabaseService.getExpenses(eventId);
  },

  /**
   * Records a new expense voucher
   */
  async createExpense(data) {
    return await DatabaseService.createExpense(data);
  },

  /**
   * Deletes an expense voucher
   */
  async deleteExpense(id) {
    return await DatabaseService.deleteExpense(id);
  },

  /**
   * Computes comprehensive financials for an event:
   * Approved Budget, Total Requirements Estimate, Total Actual Expenses, Remaining Balance
   */
  async calculateEventFinancials(eventId) {
    if (!eventId) return null;

    const event = await DatabaseService.getEventById(eventId);
    if (!event) return null;

    const budget = parseFloat(event.budget) || 0;
    const reqsData = await DatabaseService.getRequirements(eventId);
    const expensesData = await DatabaseService.getExpenses(eventId);

    const reqs = Array.isArray(reqsData) ? reqsData : [];
    const expenses = Array.isArray(expensesData) ? expensesData : [];

    const totalEstimated = reqs.reduce((sum, r) => sum + (parseFloat(r.estimated_cost) || 0), 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
    const remainingBudget = budget - totalExpenses;
    const isOverBudget = totalExpenses > budget;
    const overBudgetAmount = isOverBudget ? totalExpenses - budget : 0;

    return {
      budget,
      totalEstimated,
      totalExpenses,
      remainingBudget,
      isOverBudget,
      overBudgetAmount,
      variance: budget - totalEstimated,
      expensePercentage: budget > 0 ? Math.min(100, Math.round((totalExpenses / budget) * 100)) : 0
    };
  }
};
