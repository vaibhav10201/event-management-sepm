# Relational Database Design & Entity Dictionary

Reference: Entity-Relationship Diagram (`Gemini_Generated_Image_6wb8326wb8326wb8.png`)

---

## 1. Entities & Attributes

### 1.1 `User`
| Field | Type | Constraint | Description |
|-------|------|------------|-------------|
| `id` | VARCHAR(64) | PK | Unique user identifier |
| `name` | VARCHAR(120) | NOT NULL | Full name of user |
| `email` | VARCHAR(180) | UNIQUE, NOT NULL | Account login email |
| `password` | VARCHAR(255) | NOT NULL | Authentication password hash |
| `role` | VARCHAR(40) | NOT NULL | 'Event Manager' or 'Administrator' |
| `created_at` | TIMESTAMP | DEFAULT NOW | Account registration timestamp |

### 1.2 `Event`
| Field | Type | Constraint | Description |
|-------|------|------------|-------------|
| `id` | VARCHAR(64) | PK | Unique event identifier |
| `user_id` | VARCHAR(64) | FK (User.id) | Creator/owner of event |
| `name` | VARCHAR(180) | NOT NULL | Official event title |
| `event_type` | VARCHAR(80) | NOT NULL | Wedding, College Event, Conference, etc. |
| `event_date` | DATE | NOT NULL | Scheduled event execution date |
| `guest_count` | INTEGER | CHECK (> 0) | Expected attendee volume |
| `budget` | NUMERIC(12,2) | CHECK (> 0) | Approved total budget ceiling (INR) |
| `location` | VARCHAR(255) | NULLABLE | Campus venue or facility location |
| `description`| TEXT | NULLABLE | Thematic description and scope |
| `status` | VARCHAR(40) | DEFAULT 'Planning' | Draft, Planning, Confirmed, Completed, Cancelled |
| `created_at` | TIMESTAMP | DEFAULT NOW | Creation timestamp |

### 1.3 `EventRequirement`
| Field | Type | Constraint | Description |
|-------|------|------------|-------------|
| `id` | VARCHAR(64) | PK | Unique requirement identifier |
| `event_id` | VARCHAR(64) | FK (Event.id) | Parent event reference |
| `category` | VARCHAR(80) | NOT NULL | Catering, Sound, Decor, Seating, etc. |
| `item` | VARCHAR(180) | NOT NULL | Requirement description |
| `quantity` | INTEGER | CHECK (> 0) | Required item quantity |
| `estimated_cost` | NUMERIC(10,2) | CHECK (>= 0) | AI suggested or edited price allocation |
| `priority` | VARCHAR(30) | NOT NULL | 'High', 'Medium', 'Low' |
| `status` | VARCHAR(40) | NOT NULL | 'Pending', 'Approved', 'Sourced', 'Fulfilled' |
| `notes` | TEXT | NULLABLE | Operational specifications and riders |

### 1.4 `Task`
| Field | Type | Constraint | Description |
|-------|------|------------|-------------|
| `id` | VARCHAR(64) | PK | Unique task milestone identifier |
| `event_id` | VARCHAR(64) | FK (Event.id) | Parent event reference |
| `title` | VARCHAR(200) | NOT NULL | Deliverable title |
| `category` | VARCHAR(80) | NULLABLE | Committee domain |
| `due_date` | DATE | NOT NULL | Target completion date |
| `assigned_to` | VARCHAR(120) | NULLABLE | Assignee name or team |
| `status` | VARCHAR(40) | DEFAULT 'Pending' | 'Pending', 'In Progress', 'Completed' |
| `notes` | TEXT | NULLABLE | Milestone guidelines |

### 1.5 `Supplier`
| Field | Type | Constraint | Description |
|-------|------|------------|-------------|
| `id` | VARCHAR(64) | PK | Unique supplier identifier |
| `name` | VARCHAR(180) | NOT NULL | Agency / vendor business name |
| `category` | VARCHAR(80) | NOT NULL | Catering, Sound, Decor, Transport, etc. |
| `contact` | VARCHAR(255) | NOT NULL | Phone number and dispatch email |
| `location` | VARCHAR(180) | NOT NULL | Operational hub / city |
| `rating` | NUMERIC(2,1) | CHECK (1.0 - 5.0) | Vendor quality rating |
| `status` | VARCHAR(40) | DEFAULT 'Active' | 'Preferred', 'Active', 'Inactive' |

### 1.6 `SupplierService`
| Field | Type | Constraint | Description |
|-------|------|------------|-------------|
| `id` | VARCHAR(64) | PK | Unique service item identifier |
| `supplier_id` | VARCHAR(64) | FK (Supplier.id) | Owning supplier |
| `service_name` | VARCHAR(180) | NOT NULL | Package title |
| `description` | TEXT | NULLABLE | Detailed inclusions |
| `price` | NUMERIC(10,2) | CHECK (>= 0) | Standard catalog rate |
| `availability`| VARCHAR(40) | DEFAULT 'Available' | Current booking state |

### 1.7 `EventSupplier` (Associative Bridge Entity)
| Field | Type | Constraint | Description |
|-------|------|------------|-------------|
| `id` | VARCHAR(64) | PK | Unique contract link identifier |
| `event_id` | VARCHAR(64) | FK (Event.id) | Associated event |
| `supplier_id` | VARCHAR(64) | FK (Supplier.id) | Contracted supplier |
| `service_id` | VARCHAR(64) | FK (SupplierService.id) | Optional specific service |
| `agreed_price` | NUMERIC(10,2) | CHECK (>= 0) | Final negotiated contract price |
| `status` | VARCHAR(40) | DEFAULT 'Confirmed' | Proposed, Negotiating, Confirmed, Completed |
| `notes` | TEXT | NULLABLE | Contract riders & terms |

### 1.8 `Expense`
| Field | Type | Constraint | Description |
|-------|------|------------|-------------|
| `id` | VARCHAR(64) | PK | Unique expense disbursement identifier |
| `event_id` | VARCHAR(64) | FK (Event.id) | Charged event |
| `category` | VARCHAR(80) | NOT NULL | Expense category |
| `description` | VARCHAR(255) | NOT NULL | Invoice purpose |
| `amount` | NUMERIC(10,2) | CHECK (> 0) | Paid amount (INR) |
| `date` | DATE | NOT NULL | Transaction date |
| `supplier_id` | VARCHAR(64) | FK (Supplier.id), NULLABLE | Payee vendor if applicable |
| `notes` | TEXT | NULLABLE | Voucher / receipt reference |

---

## 2. Cardinalities & Integrity Rules
- `User` 1:N `Event` (One user organizes multiple events; deleting user cascades to events).
- `Event` 1:N `EventRequirement` (One event has multiple requirements; cascading delete).
- `Event` 1:N `Task` (One event has multiple milestones; cascading delete).
- `Event` 1:N `Expense` (One event logs multiple expenditures; cascading delete).
- `Supplier` 1:N `SupplierService` (One supplier offers multiple rate packages).
- `Event` N:M `Supplier` via `EventSupplier` associative bridge.
- `SupplierService` 1:N `EventSupplier` (A package is contracted into multiple events).
- `Supplier` 1:N `Expense` (Nullable: vendor receives multiple payments).
