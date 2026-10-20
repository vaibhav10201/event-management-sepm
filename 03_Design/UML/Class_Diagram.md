# UML Class Diagram: Domain Services & Model Structure

```
+--------------------------+          +--------------------------+
|       User Model         |          |       Event Model        |
+--------------------------+          +--------------------------+
| - id: string             | 1      * | - id: string             |
| - name: string           +--------->| - user_id: string        |
| - email: string          |          | - name: string           |
| - password: string       |          | - event_type: string     |
| - role: string           |          | - event_date: string     |
| - created_at: string     |          | - guest_count: number    |
+--------------------------+          | - budget: number         |
                                      | - location: string       |
                                      | - description: string    |
                                      | - status: string         |
                                      +---+-----------+----------+
                                          |           |
                                        1 |         1 |
                                          | *         | *
                  +-----------------------v+         +v----------------------+
                  | EventRequirement Model |         |      Task Model       |
                  +------------------------+         +-----------------------+
                  | - id: string           |         | - id: string          |
                  | - event_id: string     |         | - event_id: string    |
                  | - category: string     |         | - title: string       |
                  | - item: string         |         | - category: string    |
                  | - quantity: number     |         | - due_date: string    |
                  | - estimated_cost: num  |         | - assigned_to: string |
                  | - priority: string     |         | - status: string      |
                  | - status: string       |         | - notes: string       |
                  | - notes: string        |         +-----------------------+
                  +------------------------+
                                          | 1
                                          |
                                          | *
                                     +----v--------------------+
                                     |      Expense Model      |
                                     +-------------------------+
                                     | - id: string            |
                                     | - event_id: string      |
                                     | - category: string      |
                                     | - description: string   |
                                     | - amount: number        |
                                     | - date: string          |
                                     | - supplier_id: string   |
                                     | - notes: string         |
                                     +-------------------------+
```
