# API reference

Base URL: `http://localhost:5000/api`

Except `POST /auth/login`, all endpoints require:
`Authorization: Bearer <JWT>`

## Authentication
### POST `/auth/login`
```json
{ "email": "admin@demo.pharmacy", "password": "Admin123!" }
```
Returns `{ "token": "...", "user": { "id": "...", "name": "...", "role": "admin" } }`.

### GET `/auth/me`
Returns the authenticated user.

## Catalogue
- `GET /medicines?q=para&page=1&limit=20` — search and paginate.
- `POST /medicines` — admin only; requires `name`, `sku`, `category`.
- `GET /suppliers`
- `POST /suppliers` — admin only; requires `name`.

## Inventory
- `GET /batches?medicine=<medicineId>`
- `POST /batches` — admin only; fields: `medicine`, `supplier` (optional), `batchNumber`, `quantity`, `purchasePrice`, `salePrice`, `expiryDate`.
- `GET /inventory/movements` — latest 200 movements.
- `POST /inventory/adjustments` — admin only:
```json
{ "batchId": "<batchId>", "quantityChange": -2, "reason": "Damaged units" }
```

## Sales
### POST `/sales`
Admin/staff:
```json
{ "items": [{ "medicine": "<medicineId>", "quantity": 3 }], "taxRate": 5 }
```
The server chooses eligible batches using FEFO and returns an invoice with the batch allocation lines. Expired stock is not eligible.

### POST `/sales/:id/return`
Admin/staff:
```json
{ "medicine": "<medicineId>", "quantity": 1, "reason": "Customer returned unopened item" }
```

## Reports
- `GET /reports/dashboard`
- `GET /reports/stock`
- `GET /reports/sales?from=2026-11-01&to=2026-11-30`

## Error format
Errors return JSON `{ "message": "Human-readable explanation" }`.
- `400`: invalid input or business rule failure
- `401`: missing/invalid authentication
- `403`: role not authorized
- `409`: duplicate unique record

## Authorization matrix
| Operation | Admin | Staff |
|---|---:|---:|
| View catalogue/inventory/reports | Yes | Yes |
| Create medicine/supplier/batch | Yes | No |
| Create sale/return | Yes | Yes |
| Stock adjustment | Yes | No |
