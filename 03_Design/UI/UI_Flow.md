# UI Navigation Flow & State Map

## 1. Primary Flow Path (End-to-End Prototype Validation)

```
[ index.html ] (Project Portal)
      |
      v
[ login.html ] (Quick Demo Logins / Custom Sign-in)
      |
      v
[ dashboard.html ] (Overview: Stats, Portfolio Cards, Filters)
      |
      v  Click "+ Create Event"
[ create-event.html ] (Validation Form)
      |
      v  Click "Save & Generate Requirements"
[ requirements.html?event_id=...&auto_generate=true ]
      |
      +---> [ Review & Edit Requirements Modal ]
      |
      v  Click "Proceed to Event Dashboard"
[ event-details.html?id=... ] (Command Center: Metas, Pillars)
      |
      +---> [ tasks.html?event_id=... ] (Add/Complete Milestones)
      |
      +---> [ budget.html?event_id=... ] (Add Expenses & Ledger)
      |
      +---> [ suppliers.html ] (Directory & Event Association)
```

---

## 2. Common Layout Navigation
- **Sidebar:** Fixed desktop navigation (250px) collapsible into a mobile drawer on screens &le; 768px.
- **Top Bar:** Strict 3-zone contract displaying Context Breadcrumbs (left), Quick Actions (center), and User Profile Initials with Logout (right).
- **Feedback:** Asynchronous animated toasts for affirmative feedback and red alert boxes for critical constraints (e.g. over-budget warnings).
