# UML Activity Diagram: Event Lifecycle & Requirement Formulation

```
       ( Start )
           |
           v
    [ User Login ]
           |
           v
   < Valid Account? >
      /          \
   (No)          (Yes)
    /              \
[ Show Error ]    [ Open System Dashboard ]
                         |
                         v
                [ Click "Create Event" ]
                         |
                         v
              [ Enter Event Details: ]
          - Name, Type, Date, Guests, Budget
                         |
                         v
                 < Form Valid? >
                    /        \
                 (No)        (Yes)
                  /            \
          [ Show Inline ]   [ Save Event to DB ]
          [ Field Error ]        |
                                 v
                     < Choose Next Step? >
                        /             \
             (Save Only)             (Generate Requirements)
                  /                             \
     [ View Event Details ]           [ Call AI Generator ]
                                                 |
                                                 v
                                    [ Analyze Type, Scale & Budget ]
                                                 |
                                                 v
                                    [ Render Requirements Roster ]
                                                 |
                                                 v
                                       [ Review & Edit Items ]
                                    (Quantity, Price, Priority)
                                                 |
                                                 v
                                        [ Open Event Dashboard ]
                                                 |
                                                 v
                                         [ Manage Execution ]
                                      - Assign Tasks & Mark Done
                                      - Contract Suppliers
                                      - Record Actual Invoices
                                                 |
                                                 v
                                               ( End )
```
