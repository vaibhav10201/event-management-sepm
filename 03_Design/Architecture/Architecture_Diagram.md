# System Architecture Specification

## 1. High-Level Multi-Tier Architecture

```
+------------------------------------------------------------------------+
|                      PRESENTATION TIER (HTML5 / CSS3)                  |
|  - Semantic Page Views (dashboard, create-event, requirements, etc.)   |
|  - Component Architecture (Cards, Modals, Stat Grids, Data Tables)    |
|  - Responsive Mobile Navigation & Toast Notification Engine            |
+------------------------------------------------------------------------+
                                    |
                                    v
+------------------------------------------------------------------------+
|                     APPLICATION & LOGIC TIER (Vanilla JS)              |
|  - Controller & Lifecycle Coordinator (app.js)                         |
|  - Client-Side Form Validation (validation.js)                         |
|  - Formatting & Utilities (utils.js)                                   |
|  - Deterministic AI Requirement Generator (ai-generator.js)            |
+------------------------------------------------------------------------+
                                    |
                                    v
+------------------------------------------------------------------------+
|                      SERVICE LAYER (Future API-Ready)                  |
|  - AuthService         (login, register, logout, requireAuth)          |
|  - EventService        (getEvents, createEvent, updateEvent, delete)   |
|  - RequirementService  (getRequirements, create, update, delete)       |
|  - TaskService         (getTasks, createTask, updateStatus)            |
|  - BudgetService       (getExpenses, createExpense, calcFinancials)    |
|  - SupplierService     (getSuppliers, associateSupplierWithEvent)      |
+------------------------------------------------------------------------+
                                    |
                                    v
+------------------------------------------------------------------------+
|                     DATA ACCESS LAYER (StorageService)                 |
|  - Key-Value Browser Persistence (localStorage abstraction)            |
|  - Structured Collections: users, events, requirements, tasks,         |
|    suppliers, supplier_services, event_suppliers, expenses             |
|  - Seed Data & JSON Export Engine                                      |
+------------------------------------------------------------------------+
```

---

## 2. Key Architectural Decisions
1. **Separation of Concerns:** Clear isolation between semantic DOM structure (HTML), visual styling (modular CSS), and procedural logic (modular JS).
2. **Service-Oriented Design:** Storage calls are strictly abstracted inside domain services (`EventService`, `RequirementService`, etc.), ensuring the UI remains unaffected when migrating from `localStorage` to REST API calls.
3. **Deterministic Simulation for AI:** Implemented using standard Promise-based asynchronous signatures (`async/await`), enabling drop-in replacement by Google Gemini SDK (`@google/genai`).
