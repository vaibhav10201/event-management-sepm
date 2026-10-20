# Backend Architecture & Future REST API Specification

## 1. Overview
In accordance with the **Prototype Software Development Model**, the initial frontend prototype functions autonomously in the browser utilizing `localStorage` to validate operational feasibility, user workflows, and requirement generation.

This document serves as the implementation contract for **Member 3 (Backend Engineer)** to swap the client-side `localStorage` data service with a real RESTful API.

---

## 2. Recommended Tech Stack
- **Runtime:** Node.js (v20+ LTS) or Python (3.11+)
- **Framework:** Express.js / Fastify / FastAPI
- **Database:** PostgreSQL (using schema defined in `03_Design/Database/schema.sql`)
- **ORM / Query Builder:** Prisma / Drizzle / SQLAlchemy
- **Authentication:** JWT Bearer tokens with bcrypt password hashing

---

## 3. REST API Contract & Route Mappings

| Service Function (Frontend) | REST HTTP Method & Endpoint | Description |
|-----------------------------|-----------------------------|-------------|
| `AuthService.login()` | `POST /api/auth/login` | Authenticate user, issue JWT token |
| `AuthService.register()` | `POST /api/auth/register` | Register new user account |
| `EventService.getEvents()` | `GET /api/events` | List all events (user-filtered) |
| `EventService.getEventById()` | `GET /api/events/:id` | Retrieve single event by ID |
| `EventService.createEvent()` | `POST /api/events` | Create new event entity |
| `EventService.updateEvent()` | `PUT /api/events/:id` | Update event parameters |
| `EventService.deleteEvent()` | `DELETE /api/events/:id` | Delete event with cascading cleanup |
| `RequirementService.getRequirements()` | `GET /api/events/:id/requirements` | List requirements for event |
| `RequirementService.createRequirement()` | `POST /api/events/:id/requirements` | Add individual requirement |
| `RequirementService.updateRequirement()` | `PUT /api/requirements/:id` | Update requirement quantity/cost |
| `RequirementService.deleteRequirement()` | `DELETE /api/requirements/:id` | Remove requirement item |
| `TaskService.getTasks()` | `GET /api/tasks` | List tasks (supports `?event_id=`) |
| `TaskService.createTask()` | `POST /api/tasks` | Create operational task milestone |
| `TaskService.updateTask()` | `PUT /api/tasks/:id` | Update task status & assignment |
| `TaskService.deleteTask()` | `DELETE /api/tasks/:id` | Remove task record |
| `BudgetService.getExpenses()` | `GET /api/events/:id/expenses` | Retrieve event expense ledger |
| `BudgetService.createExpense()` | `POST /api/events/:id/expenses` | Record invoice or payment |
| `SupplierService.getSuppliers()` | `GET /api/suppliers` | List registered suppliers |
| `SupplierService.associateSupplierWithEvent()` | `POST /api/event-suppliers` | Link vendor to event contract |

---

## 4. Frontend Migration Strategy
Each frontend module (`events.js`, `requirements.js`, `tasks.js`, `budget.js`, `suppliers.js`) has been designed using the **Service Object Pattern**. To connect to the backend, Member 3 only needs to replace the internal `StorageService.get(...)` / `StorageService.set(...)` statements with `fetch('/api/...')` asynchronous calls. The HTML and UI presentation code require 0% structural changes.
