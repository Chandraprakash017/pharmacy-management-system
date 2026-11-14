# Pharmacy Management System

A MERN-stack pharmacy operations MVP built for the ALGIONS AI LABS assessment.

## Features
- JWT authentication with `admin` and `staff` roles; protected routes and server-side authorization.
- Medicine and supplier catalogue.
- Batch-level inventory with expiry dates, purchase price and selling price.
- FEFO sales allocation (earliest expiry first), expired-batch blocking and stock validation.
- Sales invoices, returns, stock adjustments and immutable stock movement records.
- Dashboard metrics, low-stock and near-expiry alerts, stock valuation and sales report.
- Search/filter endpoints, seed data and automated business-rule tests.

> Demo data is fictional. This application is for inventory/business operations only and does not provide medical advice.

## Stack
- Frontend: React, Vite, React Router, plain CSS
- Backend: Node.js, Express, Mongoose, JWT, bcrypt
- Database: MongoDB
- Tests: Node's built-in test runner

## Requirements
Node.js 20+, npm, MongoDB local instance or MongoDB Atlas connection string.

## Setup

### 1. Backend
```bash
cd server
cp .env.example .env
npm install
npm run seed
npm run dev
```
Backend runs at `http://localhost:5000`.

### 2. Frontend
Open another terminal:
```bash
cd client
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

### Environment variables
See `server/.env.example`. Never commit `.env`.

### Demo accounts
After seeding:
- Admin: `admin@demo.pharmacy` / `Admin123!`
- Staff: `staff@demo.pharmacy` / `Staff123!`

Change demo passwords before any public deployment.

## Tests
```bash
cd server
npm test
```
The included tests cover FEFO allocation, expired batches, insufficient stock and return quantity rules. API integration tests require a configured test database and can be added to the deployment pipeline.

## Main API routes
All routes are prefixed with `/api`.
- `POST /auth/login`
- `GET /auth/me`
- `GET|POST /medicines`
- `GET|POST /suppliers`
- `GET|POST /batches`
- `GET|POST /sales`
- `POST /sales/:id/return`
- `POST /inventory/adjustments`
- `GET /inventory/movements`
- `GET /reports/dashboard`
- `GET /reports/stock`
- `GET /reports/sales`

See `docs/API.md` for request examples and authorization notes.

## Business rules
1. Stock is stored per batch; never as one aggregate-only number.
2. A sale uses non-expired batches ordered by earliest expiry date (FEFO).
3. Sale creation runs inside a MongoDB transaction. Use a replica-set-enabled MongoDB deployment (Atlas supports this).
4. Expired batches and insufficient stock are rejected.
5. Returns and adjustments require a reason and create stock movement records.
6. Stock movements record the change, reference, actor and timestamp.
7. Stock report quantity is calculated from current batch quantities; valuation uses batch purchase price.

## Known limitations / honest scope
- This is an assessment MVP, not a production-certified pharmacy or accounting system.
- No payment gateway, barcode scanner, GST filing, multi-branch synchronization or medical prescription workflow.
- MongoDB transactions require a replica set.
- API integration tests against a live MongoDB instance should be run before claiming deployment readiness.
- Configure HTTPS, rate limiting, backups, secure secrets and production monitoring before public use.

## Submission checklist
- [ ] Push source to GitHub and verify repository access.
- [ ] Set production environment variables without committing secrets.
- [ ] Run tests and capture genuine test output.
- [ ] Deploy frontend/backend if feasible on free tiers.
- [ ] Record a 3–5 minute walkthrough showing login, batch stock, FEFO sale, alerts, return and reports.
- [ ] Replace the candidate email placeholder in the submission form.
