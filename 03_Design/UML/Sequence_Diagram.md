# UML Sequence Diagram: End-to-End Requirement Formulation

```
Event Manager          Browser UI          EventService        AI Generator        StorageService
      |                     |                    |                   |                   |
      |-- 1. Create Event ->|                    |                   |                   |
      |   (Form Input)      |-- 2. validate() -->|                   |                   |
      |                     |<-- 3. valid: true -|                   |                   |
      |                     |-- 4. createEvent(data) --------------->|                   |
      |                     |                    |                   |-- 5. set(EVENTS)->|
      |                     |<-- 6. eventId -----|                   |                   |
      |                     |                                                            |
      |-- 7. Click Gen Req->|                                                            |
      |                     |-- 8. generateRequirements(event) ----->|                   |
      |                     |                    |                   |-- 9. calcRules -->|
      |                     |<-- 10. return synthesized list --------|                   |
      |                     |-- 11. saveBulkRequirements() --------->|                   |
      |                     |                    |                   |-- 12. set(REQS) ->|
      |                     |                    |<-- 13. success ---|                   |
      |                     |<-- 14. Render Requirements Table ------|                   |
      |                     |                                                            |
      |-- 15. Edit Item --->|                                                            |
      |   (Change Price)    |-- 16. updateRequirement(id, data) ---->|                   |
      |                     |                    |                   |-- 17. set(REQS) ->|
      |                     |<-- 18. Updated Row & Financial Buffer -|                   |
      |                     |                                                            |
```
