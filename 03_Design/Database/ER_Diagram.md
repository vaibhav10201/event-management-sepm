# Entity-Relationship (ER) Diagram Specification

Reference: `Gemini_Generated_Image_6wb8326wb8326wb8.png`

```
  +------------------+
  |       User       |
  +------------------+
  | PK  id           |
  |     name         |
  |     email        |
  |     password     |
  |     role         |
  |     created_at   |
  +--------+---------+
           | 1
           |
           | N
  +--------v---------+          1        N +------------------+
  |      Event       +---------------------> EventRequirement |
  +------------------+                     +------------------+
  | PK  id           |                     | PK  id           |
  | FK  user_id      |                     | FK  event_id     |
  |     name         |                     |     category     |
  |     event_type   |                     |     item         |
  |     event_date   |                     |     quantity     |
  |     guest_count  |                     |     estimated_cost|
  |     budget       |                     |     priority     |
  |     location     |                     |     status       |
  |     description  |                     |     notes        |
  |     status       |                     +------------------+
  |     created_at   |
  +--------+----+----+
           |    |
         1 |    | 1
           |    +-----------------------------+
           | N                                | N
  +--------v---------+               +--------v---------+
  |       Task       |               |     Expense      |
  +------------------+               +------------------+
  | PK  id           |               | PK  id           |
  | FK  event_id     |               | FK  event_id     |
  |     title        |               |     category     |
  |     category     |               |     description  |
  |     due_date     |               |     amount       |
  |     assigned_to  |               |     date         |
  |     status       |               | FK  supplier_id  | (nullable)
  |     notes        |               |     notes        |
  +------------------+               +--------^---------+
                                              |
                                              | 0..1
                                              |
  +------------------+       1       N +------+---------+
  |     Supplier     +-----------------> EventSupplier  |
  +------------------+                 +----------------+
  | PK  id           |<----------------| PK  id         |
  |     name         | 1             N | FK  event_id   |
  |     category     |                 | FK  supplier_id|
  |     contact      |                 | FK  service_id |
  |     location     |                 |     agreed_price|
  |     rating       |                 |     status     |
  |     status       |                 |     notes      |
  +--------+---------+                 +----------------+
           | 1                                ^
           |                                  |
           | N                                | N
  +--------v---------+                        |
  | SupplierService  +------------------------+
  +------------------+ 1
  | PK  id           |
  | FK  supplier_id  |
  |     service_name |
  |     description  |
  |     price        |
  |     availability |
  +------------------+
```
