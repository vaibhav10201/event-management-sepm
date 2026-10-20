# Software Requirements Specification (SRS)
## Hospitality and Event Management System (HEMS)

### 1. Introduction
#### 1.1 Purpose
This document specifies the software requirements for the Hospitality and Event Management System (HEMS) prototype developed under the B.Tech Software Engineering curriculum.

#### 1.2 Scope
HEMS provides a web-based operational command center for event managers to create events, formulate required materials and services with AI assistance, track committee tasks, maintain an expense ledger, and coordinate vendor agreements.

---

### 2. Overall Description
#### 2.1 Product Perspective
HEMS operates as a self-contained responsive web application running on modern browser standards (HTML5, CSS3, ES6+ JavaScript) using client-side `localStorage` for high-portability prototype evaluation.

#### 2.2 User Classes and Characteristics
- **Event Manager:** Primary operator who creates events, generates and edits requirements, manages tasks, records expenses, and selects suppliers.
- **System Administrator:** Oversees registered user accounts, reviews supplier directories, and inspects global system diagnostics.
- **AI Requirement Generator:** Autonomous algorithmic actor that analyzes event parameters and suggests requirement items, quantities, costs, and priorities.

---

### 3. Specific Requirements
#### 3.1 Functional Requirements (FR)
- **FR-01 (Authentication):** The system shall allow event managers and administrators to sign in with validated credentials and maintain session persistence.
- **FR-02 (Event Creation):** The system shall allow creating events with mandatory validation for Name, Type, Date, Guest Count (>0), and Budget (>0).
- **FR-03 (Requirement Formulation):** The system shall automatically analyze event attributes and synthesize categorized requirement items with estimated costs summing to approximately 85-95% of the total budget.
- **FR-04 (Requirement Manipulation):** Users shall be able to edit quantities, modify costs, change priorities (High, Medium, Low), add custom items, or delete requirements.
- **FR-05 (Task Workflow):** The system shall allow creating, assigning, and toggling task statuses between Pending, In Progress, and Completed.
- **FR-06 (Budget & Expense Ledger):** The system shall compute total actual expenses, remaining budget buffer, and trigger prominent warning banners whenever actual disbursements exceed the allocated budget ceiling.
- **FR-07 (Supplier Management):** The system shall maintain vendor profiles and record contractual associations (`EventSupplier`) with agreed prices.

#### 3.2 Non-Functional Requirements (NFR)
- **NFR-01 (Portability):** Runs in standard web browsers without requiring external server installations for prototype evaluation.
- **NFR-02 (Usability):** Adheres to human-interface guidelines: unboxed metadata discipline, tabular numerals for currency, single-elevation card hierarchy, and mobile responsive drawers.
- **NFR-03 (Performance):** UI interactions, calculations, and modal rendering settle in under 200ms.
- **NFR-04 (Data Integrity):** Relational cascading rules ensure deletion of an event automatically purges associated child records (requirements, tasks, expenses, supplier links).
