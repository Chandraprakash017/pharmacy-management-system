# Pharmacy Management System

A web-based Pharmacy Management System built using the MERN stack.

## Technologies Used
- React.js
- Node.js
- Express.js
- MongoDB
- JWT Authentication

## Main Features
- User login and role-based access
- Medicine inventory management
- Batch-wise stock tracking
- FEFO-based medicine sales
- Low-stock and expiry alerts
- Sales and stock movement records
- Medicine return management

## Project Structure

- client: React frontend
- server: Node.js and Express backend
- docs: Project documentation

## How to Run

### Backend
cd server
npm install
cp .env.example .env
npm run seed
npm run dev

### Frontend
cd client
npm install
npm run dev

Configure your MongoDB connection string and JWT secret in the server `.env` file before starting the backend.

## Author
Chandra Prakash
B.Tech Computer Science and Engineering
Lovely Professional University