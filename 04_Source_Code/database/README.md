# Database Module & Migration Guide

## 1. Relational ER Entities
The schema strictly implements the 8 canonical entities defined in the software engineering specification:
1. `User` (id, name, email, password, role, created_at)
2. `Event` (id, user_id, name, event_type, event_date, guest_count, budget, location, description, status, created_at)
3. `EventRequirement` (id, event_id, category, item, quantity, estimated_cost, priority, status, notes)
4. `Task` (id, event_id, title, category, due_date, assigned_to, status, notes)
5. `Supplier` (id, name, category, contact, location, rating, status)
6. `SupplierService` (id, supplier_id, service_name, description, price, availability)
7. `EventSupplier` (id, event_id, supplier_id, service_id, agreed_price, status, notes)
8. `Expense` (id, event_id, category, description, amount, date, supplier_id, notes)

---

## 2. SQL DDL File
Refer to `03_Design/Database/schema.sql` for the complete ANSI SQL definition compatible with PostgreSQL and MySQL.

---

## 3. Storage Keys in LocalStorage Prototype
| Entity | Storage Key | Primary Key |
|--------|-------------|-------------|
| Users | `hems_users` | `id` |
| Events | `hems_events` | `id` |
| Requirements | `hems_requirements` | `id` |
| Tasks | `hems_tasks` | `id` |
| Suppliers | `hems_suppliers` | `id` |
| Supplier Services | `hems_supplier_services` | `id` |
| Event Suppliers | `hems_event_suppliers` | `id` |
| Expenses | `hems_expenses` | `id` |
| Current Session | `hems_current_user` | `id` |
