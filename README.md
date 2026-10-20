# Hospitality and Event Management System (HEMS)

**Academic Project:** B.Tech Software Engineering (CS/IT)  
**Development Lifecycle Model:** Prototype Software Development Model  
**Implementation Phase:** Working Prototype v1.0  
**Stack:** HTML5 · CSS3 · Vanilla JavaScript (ES6+) · LocalStorage Persistence  

---

## 1. Problem Statement
Organizers of academic, corporate, and social events routinely struggle with fragmented logistics, manual budget spreadsheets, uncoordinated vendor agreements, and inaccurate requirement estimates. Without an integrated system:
- Essential requirements (seating, stage audio, high-tea catering, water supplies) are often miscalculated.
- Committee task assignments become lost across scattered communication channels.
- Real-time expenses frequently exceed sanctioned budgets without early warning.
- Vendor contracts lack standardized rate cards and formal association records.

---

## 2. Objectives
The Hospitality and Event Management System provides an end-to-end command center enabling event managers to:
1. Authenticate with role-based privileges.
2. Initialize events with validated parameters (Name, Type, Date, Guest Count, Budget, Location).
3. Automatically formulate categorized requirements with suggested quantities and cost allocations.
4. Review, customize, add, and delete operational requirements.
5. Coordinate task assignments and track workflow progress.
6. Maintain a real-time financial ledger comparing budgets, estimated requirement costs, and actual expenses with automatic overrun alerts.
7. Browse qualified supplier directories and associate vendors with specific event contracts.

---

## 3. Prototype Software Development Model
This software was engineered following the **Prototype Model** of Software Engineering:
```
[ Requirements Gathering ] ──> [ Quick Design & ER Modeling ] ──> [ Prototype Construction ]
                                                                             │
[ Final System Production ] <── [ Customer/Faculty Evaluation ] <────────────┘
```
- **Iteration 1:** Authentication + Executive Dashboard + Event Creation
- **Iteration 2:** Requirement Formulation Engine + Review & Editing Controls
- **Iteration 3:** Committee Tasks + Real-Time Financial Ledger
- **Iteration 4:** Supplier Catalog + Event-Vendor Associations
- **Iteration 5 (Future):** REST API Backend & Relational PostgreSQL Database

---

## 4. Technology Stack (Strict Non-Framework Implementation)
- **Markup:** Semantic HTML5 (Cards, Tables, Accessible Modals, Semantic Forms).
- **Styling:** Custom CSS3 with CSS Custom Properties, Flexbox, Grid, Tabular Numerals, and Mobile Responsive Drawers. (No Bootstrap, No Tailwind, No external CSS framework dependencies).
- **Client Logic:** Modular Vanilla JavaScript (ES6+), clean separation of concerns, Service Object Architecture. (No React, No Next.js, No TypeScript runtime overhead).
- **Data Persistence:** Client-side `localStorage` with automated realistic demo seed initialization.

---

## 5. Project Folder Structure

```
Hospitality-Event-Management/
├── README.md                               <-- Comprehensive project manual
├── .gitignore
├── .env.example
│
├── 01_Report/
│   └── MidSem_Project_Report.md            <-- Academic mid-sem progress report
│
├── 02_Requirements/
│   ├── SRS.md                              <-- Software Requirements Specification
│   ├── Use_Cases.md                        <-- Detailed use cases matrix
│   └── User_Stories.md                     <-- Agile user stories & acceptance criteria
│
├── 03_Design/
│   ├── Architecture/
│   │   └── Architecture_Diagram.md         <-- Multi-tier architecture specification
│   ├── Database/
│   │   ├── Database_Design.md              <-- Relational entity data dictionary
│   │   ├── ER_Diagram.md                   <-- Entity-Relationship ASCII specification
│   │   └── schema.sql                      <-- ANSI SQL DDL for PostgreSQL / MySQL
│   ├── UML/
│   │   ├── Activity_Diagram.md             <-- Operational workflow diagram
│   │   ├── Sequence_Diagram.md             <-- End-to-end requirement sequence
│   │   └── Class_Diagram.md                <-- Service and entity class models
│   └── UI/
│       └── UI_Flow.md                      <-- User navigation state map
│
├── 04_Source_Code/
│   ├── frontend/
│   │   ├── index.html                      <-- HEMS Project Portal & router
│   │   ├── login.html                      <-- Authentication & quick demo sign-in
│   │   ├── register.html                   <-- User onboarding
│   │   ├── dashboard.html                  <-- Executive dashboard & portfolio cards
│   │   ├── create-event.html               <-- Event form with validation
│   │   ├── event-details.html              <-- Single event command center (3 pillars)
│   │   ├── requirements.html               <-- AI Requirement Generator & editing
│   │   ├── tasks.html                      <-- Task milestones & workflow states
│   │   ├── budget.html                     <-- Financial ledger & overrun warnings
│   │   ├── suppliers.html                  <-- Vendor directory & event links
│   │   ├── settings.html                   <-- User profile & seed data control
│   │   ├── css/
│   │   │   ├── style.css                   <-- Reset, variables, typography
│   │   │   ├── layout.css                  <-- App shell, sidebar, topbar contract
│   │   │   ├── components.css              <-- Buttons, tables, cards, modals, toasts
│   │   │   └── responsive.css              <-- Mobile drawers & breakpoints
│   │   └── js/
│   │       ├── storage.js                  <-- LocalStorage layer & demo seed
│   │       ├── utils.js                    <-- Formatter, toasts, modals, params
│   │       ├── validation.js               <-- Client-side form validators
│   │       ├── auth.js                     <-- Session management & auth guards
│   │       ├── events.js                   <-- Event CRUD operations
│   │       ├── ai-generator.js             <-- Deterministic requirement engine
│   │       ├── requirements.js             <-- Requirement CRUD operations
│   │       ├── tasks.js                    <-- Task CRUD operations
│   │       ├── budget.js                   <-- Expense calculations & budget alerts
│   │       ├── suppliers.js                <-- Vendor directory & association
│   │       └── app.js                      <-- App coordinator & lifecycle
│   │
│   ├── backend/
│   │   └── README.md                       <-- REST API specification for Member 3
│   ├── ai-module/
│   │   └── README.md                       <-- Gemini API upgrade roadmap
│   ├── database/
│   │   └── README.md                       <-- Database mappings & migration guide
│   └── sample_data/
│       └── initial_seed.json               <-- Canonical initial demo database JSON
│
├── 05_Testing/
│   ├── Test_Cases.md                       <-- 15 Formal test cases & verification
│   └── Integration_Test_Report.md          <-- End-to-end execution log
│
├── 06_Project_Management/
│   ├── Project_Plan.md                     <-- Phased Gantt milestone schedule
│   ├── Task_Allocation.md                  <-- Team roles & responsibility matrix
│   ├── Weekly_Progress.md                  <-- Weekly development milestones
│   └── Contribution_Record.md              <-- Member contribution audit
│
└── 07_Demo/
    └── DEMO_VIDEO_LINK.txt                 <-- Video walkthrough link & chapters
```

---

## 6. How to Run the Application

### Option A: Direct Web Browser (Zero Setup Required)
Open `04_Source_Code/frontend/index.html` (or `login.html`) directly in any web browser (Chrome, Firefox, Edge, Safari). No web server, Node.js, or database installation is needed!

### Option B: Local Development Server
```bash
# Run using the configured Vite development server
npm run dev
# The application starts on http://localhost:3000/ and automatically redirects to the frontend portal
```

---

## 7. Demo Login Credentials

| Role | Name | Email | Password |
|------|------|-------|----------|
| **Event Manager (Default)** | Priya Sharma | `manager@hems.ac.in` | `manager123` |
| **Student Organizer** | Rahul Verma | `student@mnnit.ac.in` | `student123` |
| **System Administrator** | Dr. A. K. Verma | `admin@hems.ac.in` | `admin123` |

*Note:* The login screen (`login.html`) includes **One-Click Demo Login** buttons for instant faculty evaluation without manual typing.

---

## 8. Main End-to-End Demonstration Steps

Follow these steps to demonstrate the complete working prototype:

1. **Sign In:** Open `login.html` and click **"Event Manager: Priya Sharma"**.
2. **Dashboard Overview:** Notice the 6 summary metric cards, active event cards, and status filter.
3. **Create Event:** Click **"+ Create Event"** from the top bar.
4. **Enter Details (Auto-Fill or Manual):**
   - Event Name: `College Cultural Fest`
   - Event Type: `College Event`
   - Guest Count: `300`
   - Budget: `150000`
   - Location: `MNNIT Campus, Central Auditorium`
   - Description: `Annual college cultural event featuring music competitions and stage plays.`
5. **Save & Generate Requirements:** Click **"Save & Generate Requirements"**.
6. **Review Generated Requirements:** The system redirects to `requirements.html` and automatically synthesizes 8 categorized items (Stage & AV, Catering, Decor, Seating, Photography, Logistics, Cleaning) with estimated costs scaled to the budget.
7. **Edit a Requirement:** Click **"Edit"** on the Sound System row. Change the cost to `₹22,000`. Notice the Total Estimated Cost and Budget Variance recalculate instantly.
8. **Add a Requirement:** Click **"+ Add Requirement"**. Add `"Memento Brass Plaques"` under Category *Hospitality & Logistics*, Quantity `15`, Cost `₹6,000`, Priority `High`.
9. **Delete a Requirement:** Click **"Delete"** on any item. Confirm the prompt and watch the table and financial counters update.
10. **Open Event Dashboard:** Click **"Proceed to Event Dashboard"**. Observe the metadata cards, requirement preview, task progress bar, and budget burn rate.
11. **Manage Tasks:** Click **"Manage Tasks"**. Add task `"Confirm Auditorium Booking"`. Change its status from *Pending* to *Completed* using the inline dropdown. Notice the progress bar immediately updates.
12. **Record Expense & Watch Budget:** Click **"Budget & Expenses"**. Click **"+ Add Expense"**. Enter Amount `₹15,000` for sound advance. Watch Total Expenses increment and Remaining Budget decrease automatically!
13. **Test Over-Budget Warning:** Add an expense of `₹150,000`. Notice the system immediately displays a prominent red **"CRITICAL BUDGET OVERRUN"** warning banner.
14. **Contract a Supplier:** Navigate to `suppliers.html` and click **"Associate with Event"**. Link *Royal Feast Caterers* to your event.

---

## 9. Database & Entity-Relationship (ER) Model

The prototype implements the 8 canonical entities:
1. **User:** `id`, `name`, `email`, `password`, `role`, `created_at`
2. **Event:** `id`, `user_id`, `name`, `event_type`, `event_date`, `guest_count`, `budget`, `location`, `description`, `status`, `created_at`
3. **EventRequirement:** `id`, `event_id`, `category`, `item`, `quantity`, `estimated_cost`, `priority`, `status`, `notes`
4. **Task:** `id`, `event_id`, `title`, `category`, `due_date`, `assigned_to`, `status`, `notes`
5. **Supplier:** `id`, `name`, `category`, `contact`, `location`, `rating`, `status`
6. **SupplierService:** `id`, `supplier_id`, `service_name`, `description`, `price`, `availability`
7. **EventSupplier:** `id`, `event_id`, `supplier_id`, `service_id`, `agreed_price`, `status`, `notes`
8. **Expense:** `id`, `event_id`, `category`, `description`, `amount`, `date`, `supplier_id`, `notes`

---

## 10. Future Backend Integration Plan
The frontend JavaScript architecture is structured using the **Service Object Pattern** (`EventService`, `RequirementService`, `TaskService`, `BudgetService`, `SupplierService`). When Member 3 implements the Node.js/PostgreSQL backend:
1. Replace `StorageService.get(...)` / `StorageService.set(...)` with asynchronous `fetch('/api/...')` REST calls.
2. The HTML views, validation logic, and CSS styling remain 100% intact.
3. The SQL schema in `03_Design/Database/schema.sql` can be applied directly to PostgreSQL.

---

## 11. Team Responsibilities
- **Member 1:** Frontend Architecture, Semantic HTML5, Modular CSS3, Vanilla JS Controllers.
- **Member 2:** Requirements Analysis, SRS, UML Diagrams, Test Cases & Verification Matrices.
- **Member 3:** Relational ER Modeling, Database SQL Schema, REST API Specification.
- **Member 4:** Requirement Formulation Logic, Budget Arithmetic, Vendor Cataloging.

---

## 12. AI Usage Disclosure
The requirement generation engine in this prototype (`ai-generator.js`) uses a deterministic algorithmic simulation scaling resources to attendee headcounts and budget constraints. This provides a reliable, reproducible baseline for academic evaluation while maintaining an identical async interface for future Google Gemini API integration.
