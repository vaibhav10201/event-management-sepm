/**
 * Hospitality and Event Management System (HEMS)
 * Dashboard Module - Aggregate Metrics & Overview Analytics
 * Powered by Supabase PostgreSQL
 */

const DashboardService = {
  /**
   * Computes top-level dashboard metrics across the authenticated user's data
   */
  async getDashboardMetrics() {
    const eventsData = await EventService.getEvents();
    const tasksData = await TaskService.getTasks();
    const expensesData = await BudgetService.getExpenses();

    const events = Array.isArray(eventsData) ? eventsData : [];
    const tasks = Array.isArray(tasksData) ? tasksData : [];
    const expenses = Array.isArray(expensesData) ? expensesData : [];

    const totalEvents = events.length;
    
    // Upcoming events: event_date >= current date string
    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingEvents = events.filter(e => e.event_date >= todayStr && e.status !== 'Completed' && e.status !== 'Cancelled').length;

    // Total Budget
    const totalBudget = events.reduce((sum, e) => sum + (parseFloat(e.budget) || 0), 0);

    // Total Expenses
    const totalExpenses = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);

    // Remaining Budget
    const remainingBudget = totalBudget - totalExpenses;

    // Pending Tasks
    const pendingTasks = tasks.filter(t => t.status !== 'Completed').length;

    return {
      totalEvents,
      upcomingEvents,
      totalBudget,
      totalExpenses,
      remainingBudget,
      pendingTasks,
      isOverallOverBudget: totalBudget > 0 && totalExpenses > totalBudget
    };
  },

  /**
   * Retrieves recent events for the user
   */
  async getRecentEvents(limit = 10) {
    const events = await EventService.getEvents();
    return events.slice(0, limit);
  }
};
