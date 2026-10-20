# Use Case Specifications
## Hospitality and Event Management System (HEMS)

Reference: Architectural Use Case Diagram (`Gemini_Generated_Image_175u58175u58175u.png`)

---

### Actors
1. **Event Manager:** Primary human user responsible for planning and executing events.
2. **AI Requirement Generator:** Automated system actor responsible for synthesizing categorized requirements.
3. **System Administrator:** Human administrative actor maintaining user accounts and system configuration.

---

### Detailed Use Case Matrix

| Use Case ID | Use Case Name | Primary Actor | Description | Preconditions |
|-------------|---------------|---------------|-------------|---------------|
| UC-01 | Login | Event Manager / Admin | Authenticates user against stored credentials and initializes session. | Valid registered account. |
| UC-02 | Register | Event Manager | Onboards new manager with name, email, password, and role. | New email address. |
| UC-03 | Create Event | Event Manager | Captures core specifications: Name, Type, Date, Guest Count, Budget, Location. | Logged in as Event Manager. |
| UC-04 | Generate Event Requirements | AI Requirement Generator | Evaluates event type, attendee volume, and budget to formulate categorized items, quantities, costs, and priorities. | Event created with valid parameters. |
| UC-05 | Review Requirements | Event Manager | Inspects synthesized requirements, checks allocations vs budget ceiling. | Requirements generated or added. |
| UC-06 | Edit Requirements | Event Manager | Modifies quantity, cost, priority, or status for any requirement item. | Requirement item exists. |
| UC-07 | Add Requirement Manually | Event Manager | Creates a custom operational requirement item. | Event exists. |
| UC-08 | Delete Requirement | Event Manager | Removes an unwanted requirement item from the event roster. | Requirement item exists. |
| UC-09 | Manage Tasks | Event Manager | Assigns deliverables, deadlines, and tracks progress. | Event exists. |
| UC-10 | Update Task Status | Event Manager | Toggles task state between Pending, In Progress, and Completed. | Task item exists. |
| UC-11 | View Budget & Ledger | Event Manager | Inspects total budget, estimated cost, actual expenses, and remaining buffer. | Event exists. |
| UC-12 | Add Expense | Event Manager | Records an actual payment or vendor invoice. | Event exists. |
| UC-13 | Manage Suppliers | Event Manager / Admin | Browses directory, creates new vendor profile, views ratings. | Logged in. |
| UC-14 | Associate Supplier with Event | Event Manager | Contracts a vendor and service package to an event with agreed pricing. | Event and Supplier exist. |
| UC-15 | View Event Dashboard | Event Manager | Observes single-event high-level command center with all 3 pillars. | Event exists. |
| UC-16 | Update Event | Event Manager | Edits event name, date, guest count, budget, or status. | Event exists. |
| UC-17 | Delete Event | Event Manager | Purges event with cascading cleanup of all related records. | Event exists. |
| UC-18 | Logout | Event Manager / Admin | Terminates user session. | User is authenticated. |
| UC-19 | Manage Users | System Administrator | Inspects all registered user accounts and roles. | Logged in as Administrator. |
| UC-20 | View System Data | System Administrator | Inspects storage statistics and exports full system JSON backup. | Logged in as Administrator. |
