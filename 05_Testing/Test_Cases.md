# Formal Test Cases & Verification Matrix
## Hospitality and Event Management System (HEMS)

| Test ID | Module | Scenario / Test Input | Expected Result | Status |
|---------|--------|-----------------------|-----------------|--------|
| TC-01 | Authentication | Valid Login (`manager@hems.ac.in` / `manager123`) | Stores session, displays welcome toast, redirects to `dashboard.html`. | PASS |
| TC-02 | Authentication | Invalid Password | Shows "Incorrect password" inline alert; denies access. | PASS |
| TC-03 | Event Creation | Empty Event Name or Zero Guest Count | Displays client-side field validation error; prevents form submission. | PASS |
| TC-04 | Event Creation | Valid Inputs ("College Cultural Fest", 300 guests, ₹150,000 budget) | Creates event, generates ID, triggers auto-redirect to requirements. | PASS |
| TC-05 | Requirement Gen | Trigger AI on 300 guests, ₹150,000 budget | Generates categorized requirements (Catering, Stage/AV, Seating, Water) summing to ~85-95% of ₹150,000. | PASS |
| TC-06 | Requirement Edit | Edit "Main Stage Sound System" estimated cost | Recalculates total estimated requirement cost and updates budget variance immediately. | PASS |
| TC-07 | Requirement Add | Add custom item "Memento Plaques" (qty: 15, cost: ₹7,500) | Successfully appends item to table and recalculates aggregate cost. | PASS |
| TC-08 | Requirement Del | Delete requirement item | Confirms deletion with dialog, removes row, and recalculates totals. | PASS |
| TC-09 | Task Execution | Add task "Confirm Auditorium Booking" | Injects task into event task list with 'Pending' state. | PASS |
| TC-10 | Task Status | Toggle task status dropdown from 'Pending' to 'Completed' | Immediately updates task state, strikes through title, updates progress bar. | PASS |
| TC-11 | Budget Ledger | Add expense ₹10,000 for Sound System | Recalculates actual expenses, remaining budget buffer, and updates progress bar. | PASS |
| TC-12 | Budget Overrun | Add expenses exceeding ₹150,000 budget ceiling | Renders high-visibility red overrun warning banner with exact deficit amount. | PASS |
| TC-13 | Suppliers | Associate "Royal Feast Caterers" with event | Links supplier entity to event via `EventSupplier` bridge entity. | PASS |
| TC-14 | Cascading Delete | Delete event from Event Details view | Cascades deletion to all linked requirements, tasks, expenses, and associations. | PASS |
| TC-15 | Seed Reset | Click "Reset to Initial Demo Data" in Settings | Wipes modified state and restores canonical 3 events and seed users. | PASS |
