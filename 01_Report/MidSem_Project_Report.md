# B.Tech Software Engineering Mid-Semester Project Report

**Project Title:** Hospitality and Event Management System (HEMS)  
**Academic Course:** B.Tech Software Engineering (CS/IT)  
**Development Lifecycle Model:** Prototype Software Development Model  
**Implementation Phase:** Working Prototype v1.0  

---

## 1. Executive Summary
The Hospitality and Event Management System (HEMS) is an integrated digital platform designed to automate and streamline event lifecycle operations for organizers, committee managers, and vendors. Traditional event management suffers from fragmented communication, manual budget tracking, and ad-hoc requirement planning. HEMS addresses these challenges by introducing an end-to-end web system featuring automated requirement formulation, task workflow tracking, real-time budget ledger calculations, and supplier catalog management.

---

## 2. Problem Statement
Organizers of academic, corporate, and social events routinely face operational difficulties:
1. **Underestimating Requirements:** Failing to project correct quantities for food, furniture, sound systems, and staffing based on guest counts.
2. **Budget Discrepancies:** Absence of real-time variance detection between estimated allocations and actual payments, leading to severe deficit overruns.
3. **Vendor Coordination Delays:** Unstructured engagement records without agreed rate cards or signed service scopes.
4. **Task Siloing:** Lack of centralized visibility into operational milestone completions across sub-committees.

---

## 3. Project Objectives
- Enable event managers to initialize events with concrete parameters (name, type, date, guest count, budget ceiling, location).
- Automate event requirement formulation using an algorithmic estimation engine.
- Provide a flexible editing interface for custom adjustments to quantities, costs, and priority weights.
- Maintain an accurate financial ledger comparing total budgets, estimated requirement costs, and actual disbursements with automated overrun alerts.
- Facilitate vendor cataloging and formal association between suppliers and specific events.

---

## 4. Software Development Methodology: Prototype Model
The project adopts the **Prototype Software Development Model**. In this model:
- **Phase 1: Requirements Gathering:** Identifying user goals from use cases and ER specifications.
- **Phase 2: Quick Design & Data Modeling:** Establishing the 8 core entities and relational links.
- **Phase 3: Prototype Construction:** Implementing a clean, modular HTML5/CSS3/Vanilla JS frontend with LocalStorage persistence.
- **Phase 4: Customer/Faculty Evaluation:** Demonstrating the end-to-end flow to identify usability enhancements.
- **Phase 5: Refinement & Backend Transition:** Preparing API service stubs for future backend REST and relational database binding.

---

## 5. Architectural Overview & System Modules
1. **Authentication & Session Module:** Manages role-based sessions for Event Managers and System Administrators.
2. **Event Portfolio Module:** CRUD operations on event entities with lifecycle status management (Draft, Planning, Confirmed, Completed).
3. **AI Requirement Formulation Module:** Deterministic mathematical modeling scaling resources based on attendee volume and budget.
4. **Task Management Module:** Operational milestone tracking with tri-state workflow transitions (Pending, In Progress, Completed).
5. **Financial & Expense Ledger Module:** Real-time arithmetic computations tracking budget utilization and variance warnings.
6. **Supplier & Engagement Module:** Vendor directory and N:M bridge contracts linking suppliers and services to events.

---

## 6. Conclusion & Next Steps
The working prototype successfully validates the core end-to-end workflow: Login &rarr; Dashboard &rarr; Create Event &rarr; Generate Requirements &rarr; Edit/Save Requirements &rarr; Manage Tasks &rarr; Track Budget &rarr; Contract Suppliers. Subsequent project phases will integrate the Node.js/PostgreSQL backend and Gemini API reasoning models.
