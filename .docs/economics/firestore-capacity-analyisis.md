# Firestore Capacity Analysis
Date: 2026-03-07  
Status: Reference — Database Scaling

---

# 1. Objective

Determine:

- Firestore operational limits in the free tier
- database operations per endpoint
- estimated number of active users before leaving the free tier

This analysis is based on **actual backend code inspection**.

---

# 2. Firestore Free Tier Limits

Spark plan limits:

Reads:
50,000 / day

Writes:
20,000 / day

Deletes:
20,000 / day

Storage:
10 GB

Only **operations** affect scaling calculations.

---

# 3. Endpoint-Level Database Operations

Operations were measured directly from backend code paths.

| Endpoint | Reads | Writes | Deletes |
|--------|--------|--------|--------|
GET /health | 0 | 0 | 0
GET / | 0 | 0 | 0
POST /api/auth/login | 1 | 1 | 0
POST /api/auth/register | 0 | 1 | 0
POST /api/habits/series | 2 | 2 | 0
GET /api/habits/series | N | 0 | 0
GET /api/habits/series/:seriesId | 1 | 0 | 0
DELETE /api/habits/series/:seriesId | 2 | 1 | 1
POST /api/habits/series/:seriesId/actions | 4 | 2 | 0
POST /api/billing/create-checkout-session | 1–2 | 0–1 | 0
POST /api/webhooks/stripe | 1–2 | 2 | 0

Where:

N = number of habit series returned in the query.

---

# 4. Typical User Daily Flow

Typical active user behaviour:

1. Login
2. List habit series
3. Open a series
4. Create an action

---

# 5. Operations Per Active User

Assuming:

10 habit series per user.

Reads:

login = 1  
list series = 10  
get series = 1  
create action = 4  

Total reads:

16 reads / user / day

Writes:

login update = 1  
create action = 2  

Total writes:

3 writes / user / day

---

# 6. Firestore Capacity

Reads limit:

50,000 / day

50,000 / 16 ≈ 3,125 active users

Writes limit:

20,000 / day

20,000 / 3 ≈ 6,666 active users

---

# 7. Limiting Factor

The limiting factor is **reads**, not writes.

Estimated free-tier capacity:

≈ 3,000 daily active users

---

# 8. Registered User Capacity

Typical SaaS relationship:

DAU ≈ 15–30% of registered users

Therefore:

3,000 DAU corresponds approximately to:

10,000–20,000 registered users.

---

# 9. Cost Beyond Free Tier

Firestore pricing (approximate):

Reads:
$0.06 / 100,000

Writes:
$0.18 / 100,000

At 5,000 DAU estimated cost remains extremely low:

≈ $2–4 / month

---

# 10. Architectural Observations

A key efficiency decision in the backend architecture:

Actions are stored as **arrays inside the series document**, not as subcollection documents.

This avoids:

- additional document reads
- multiplicative database operations

The result is significantly higher database efficiency.

---

# 11. Conclusion

Firestore free tier capacity for the current Arvi architecture:

≈ 3,000 daily active users.

Beyond this threshold the database begins charging per operation, but the cost remains extremely low.

Therefore Firestore is **not a significant economic constraint** for the system.