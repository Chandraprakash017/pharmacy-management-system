# 3–5 minute walkthrough script

**Important:** Record only after running the project and verifying each action. Do not claim a feature works if it has not been tested.

1. **Introduction (20 sec):** "This is my Pharmacy Management System, built with React, Express, Node.js and MongoDB. It manages medicine catalogue data and batch-level inventory."
2. **Login and roles (30 sec):** Sign in with the seeded admin account. Explain JWT authentication and server-side role checks.
3. **Catalogue and supplier (35 sec):** Show medicine and supplier lists. Add a fictional medicine and supplier if testing in a disposable demo database.
4. **Batch inventory (45 sec):** Show two batches of the same medicine with different expiry dates. Explain why stock is tracked by batch.
5. **FEFO sale (50 sec):** Create a sale for that medicine. Open the invoice response/list and show that the earlier-expiring eligible batch was deducted first. Show the corresponding movement.
6. **Safety checks (35 sec):** Attempt to sell more units than available and, if seeded with an expired batch, demonstrate that it cannot be allocated.
7. **Reports (35 sec):** Show low-stock/near-expiry dashboard alerts, stock valuation and movement audit.
8. **Close (15 sec):** Summarize the business rules, tests and current limitations.

Suggested duration: approximately 4 minutes.
