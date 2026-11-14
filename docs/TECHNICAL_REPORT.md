# Pharmacy Management System — Technical Report

**Candidate:** Chandra Prakash  
**Registration number:** 12300630  
**Role:** Full-Stack Web Development  
**Organization:** ALGIONS AI LABS PRIVATE LIMITED

## 1. Introduction
The Pharmacy Management System is a browser-based application for managing a small pharmacy's catalogue, suppliers, batch-level stock, sales and operational reports. The project focuses on traceable inventory operations rather than medical or clinical workflows. All seeded products and supplier information are fictional.

## 2. Problem statement
A pharmacy needs to know not only how many units it owns, but which batch each unit belongs to and when that batch expires. A single aggregate stock number can hide expired stock and lead to incorrect sales. The system therefore stores stock by batch and uses FEFO allocation during sales.

## 3. Architecture
The application uses a modular monolith:
- React/Vite client for screens and user interaction.
- Express API for authentication, validation and business rules.
- Mongoose models for persistence in MongoDB.
- JWT middleware for authentication and server-side role checks.

The browser never decides which batch is safe to sell. The API performs FEFO allocation and writes the sale, batch deductions and stock movement records within a MongoDB transaction.

## 4. Data model
- User: identity, password hash and role.
- Medicine: SKU, name, category and reorder threshold.
- Supplier: supplier contact information.
- Batch: medicine, supplier, batch number, quantity, purchase/sale prices and expiry.
- Sale: invoice, itemized batch allocations, tax, total and creator.
- StockMovement: medicine, batch, movement type, quantity delta, reason, reference and actor.

The batch collection has a compound unique index on medicine and batch number. Medicine SKU and invoice number are unique.

## 5. Important business rules
1. Requested quantities must be positive whole numbers.
2. Expired batches are excluded from sale allocation.
3. Eligible batches are ordered by earliest expiry date.
4. Sale creation is rejected if eligible stock is insufficient.
5. Conditional quantity updates protect against stale stock.
6. Returns and manual adjustments require a reason and create audit records.
7. Stock valuation uses remaining quantity multiplied by purchase price.

## 6. Security
Passwords are hashed with bcrypt. JWTs expire after eight hours. Protected API routes verify tokens and load the user from the database. Role middleware is applied on sensitive operations. Helmet, JSON body size limits and rate limiting provide baseline API protections. Secrets are supplied through environment variables.

## 7. Testing
The automated unit tests exercise the FEFO allocation function, including earliest-expiry selection, split allocation, expired stock rejection, insufficient stock and invalid quantities. Before a production claim, API integration tests should also be run against a replica-set-enabled test database.

## 8. Limitations and future work
The MVP does not include payment gateway integration, barcode scanning, GST filing, multi-branch support or prescription handling. The return workflow is a simplified assessment implementation and should be extended with per-sale-line return tracking before production use. MongoDB transactions require a replica set. Further work should add integration tests, pagination for large batch/movement reports, audit export, stronger input schemas, deployment monitoring and automated backups.

## 9. Conclusion
The project demonstrates a full-stack business workflow with batch-aware inventory, FEFO sales allocation, server-side authorization, audit records and operational reporting. The implementation is intended to be explainable and reproducible using the setup instructions in the README.
