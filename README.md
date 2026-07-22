# GatherFlow | Event Management Platform

A full-stack web application for creating, discovering, and managing events. Built using Next.js (App Router) on the frontend, Node.js/Express on the backend, and PostgreSQL for the database. 

This project uses raw SQL queries only (no ORM like Prisma or Sequelize).

## Tech Stack

* **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, TypeScript, Zod, Lucide Icons
* **Backend**: Node.js, Express.js (ES modules), JSON Web Tokens (JWT), BcryptJS, pg (node-postgres), Zod
* **Database**: PostgreSQL

## Key Features

* **Event Catalog**: Search, filter by location or date range, and sort events by date, name, or location.
* **Authentication**: JWT-based register and login. PERSISTED via Context Provider.
* **Create & Edit Events**: Form validation using Zod. Custom image support with preset themes or direct image URLs (hides URL input for default presets to keep UI clean).
* **Organizer Dashboard**: Host panel to view your events, expand to see registered participants list, and cancel registrations with custom reasons.
* **Details Page**: Interactive details page showing event information, registered count, and registration status.

## Getting Started

### Prerequisites
* Node.js (v18+)
* PostgreSQL running locally on port `5432`

### Database Setup
Create a PostgreSQL database named `event_manager_db`.

Using psql CLI:
```bash
psql -U postgres -c "CREATE DATABASE event_manager_db;"
```

### Running the Backend
1. Go to the backend folder:
   ```bash
   cd backend
   ```
2. Configure variables in `backend/.env`:
   ```env
   PORT=5000
   PGUSER=postgres
   PGHOST=127.0.0.1
   PGDATABASE=event_manager_db
   PGPORT=5432
   JWT_SECRET=some_jwt_secret_key_here
   ```
3. Install packages and start the server:
   ```bash
   npm install
   npm run dev
   ```
   *The database schema tables will automatically be created/migrated on startup.*

### Running Integration Tests
To run integration tests for the backend APIs:
```bash
cd backend
npm run test
```

### Running the Frontend
1. Go to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install packages and start dev server:
   ```bash
   npm install
   npm run dev
   ```
3. Open `http://localhost:3000` in your browser.
