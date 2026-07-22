# Event Manager Dashboard

A simple, minimalist, and responsive Event Manager Dashboard built with a **TypeScript Next.js (App Router)** frontend and an **Express.js** backend using raw SQL queries to interact with a **PostgreSQL** database. 

The application utilizes a custom **Navy and Rust** theme with lightweight, handwritten Tailwind CSS styling that avoids generic AI-template boilerplate.

---

## Technical Stack

- **Frontend**: React 19, TypeScript, Next.js (App Router, v15+), Tailwind CSS (v4), Lucide React Icons, Zod (Form Validation).
- **Backend**: Node.js, Express.js (ES Modules), PostgreSQL (`pg` driver), JSON Web Tokens (JWT), BcryptJS, Zod (Request Payload validation).
- **Database**: PostgreSQL (Raw SQL queries only. No ORMs like Prisma or Sequelize are used).

---

## Features

### 📌 Frontend (Next.js)
1. **Explore Events (Homepage)**
   - Search events by name.
   - Filter by location, start date, and end date.
   - Sort by date, name, and location in ascending/descending order.
   - Dynamic attendee counters showing registered participants.
2. **Authentication**
   - Clean User Registration and User Login forms.
   - Global session context (`AuthContext`) persisted securely via JWT in local storage.
3. **Host Event Form**
   - Fields: Event Name, Description, Date, Location.
   - Client-side validation using **Zod** (ensuring date is today or in the future).
   - Owner-restricted PUT endpoint for editing events.
4. **Event Details View**
   - Displays event meta information, organizer contact details, and description.
   - Conditional actions:
     - **Anonymous visitors**: A button prompts them to log in to apply.
     - **Authenticated participants**: Register/apply button, which switches to a "Registered" badge upon confirmation.
     - **Owners/Hosts**: Edit and Delete actions, plus a direct link to the participant moderation dashboard.
     - **Cancelled participants**: Displays a red warning card showing the host's cancellation reason.
5. **Dashboard**
   - Organizers can view their hosted events.
   - Accordion expansion to fetch and show the participants list (name, email, registration date, status).
   - "Cancel Registration" button which opens a modal to input a reason. Updates the database and UI state instantly.

### 📌 Backend (Express + PostgreSQL)
- **REST Endpoints**:
  - `POST /api/auth/register` – Create user, hash password, return JWT.
  - `POST /api/auth/login` – Verify user password, return JWT.
  - `GET /api/auth/me` – Fetch logged-in user profile (token verified).
  - `POST /api/events` – Create a new event (Authenticated, owner-assigned).
  - `GET /api/events` – Fetch all events with query filters and sort order (Public).
  - `GET /api/events/:id` – Fetch event by ID (Optional auth decodes token to fetch user status).
  - `PUT /api/events/:id` – Edit event by ID (Authenticated, owner-validated).
  - `DELETE /api/events/:id` – Delete event by ID (Authenticated, owner-validated).
  - `POST /api/events/:id/register` – Register logged-in user for event (Authenticated).
  - `GET /api/events/:id/participants` – Fetch participant list (Authenticated, owner-validated).
  - `PUT /api/events/:id/participants/:userId/cancel` – Cancel registration with a custom reason (Authenticated, owner-validated).
- **Error Handling**: Graceful Express-wide error catcher reporting database integrity violations (e.g. duplicate emails) and validation errors.

---

## Directory Structure

```text
EventManager/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js            # PG client Pool and Table Migration
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── eventController.js
│   │   │   └── registrationController.js
│   │   ├── middleware/
│   │   │   └── authMiddleware.js # JWT verification
│   │   ├── models/
│   │   │   ├── userModel.js      # Raw SQL queries for Users
│   │   │   ├── eventModel.js     # Raw SQL queries for Events (Filtering & Sorting)
│   │   │   └── registrationModel.js # Raw SQL queries for Registrations
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   └── eventRoutes.js
│   │   ├── tests/
│   │   │   └── test.js           # Programmatic integration tests
│   │   ├── app.js
│   │   └── server.js             # Entrypoint
│   ├── .env                      # Environment Variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/page.tsx   # Participant moderation panel
│   │   │   ├── events/
│   │   │   │   ├── create/page.tsx # Create form (Zod validated)
│   │   │   │   └── [id]/
│   │   │   │       ├── edit/page.tsx # Edit form
│   │   │   │       └── page.tsx      # Details view
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx            # Explore events (Filters/Search/Sort)
│   │   │   └── globals.css         # Theme stylesheet (Navy & Rust config)
│   │   ├── components/
│   │   │   └── Navbar.tsx          # Responsive Header
│   │   ├── context/
│   │   │   └── AuthContext.tsx     # Authentication Provider
│   │   └── lib/
│   │       └── api.ts              # Fetch-based REST client
│   ├── package.json
│   └── tsconfig.json
│
├── README.md
└── SYSTEM_DESIGN.md
```

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- PostgreSQL (v14+) running on `localhost:5432`

---

### Step 1: Database Setup
Make sure PostgreSQL is running. Create a database named `event_manager_db`.

You can do this in your command line:
```bash
# Connect to postgres CLI
psql -U postgres

# Create the database
CREATE DATABASE event_manager_db;
\q
```

---

### Step 2: Backend Configuration & Start
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Check or modify `backend/.env` configuration:
   ```env
   PORT=5000
   PGUSER=postgres
   PGHOST=127.0.0.1
   PGDATABASE=event_manager_db
   PGPORT=5432
   JWT_SECRET=super_secret_event_manager_token_key_123!@#
   ```
3. Install backend dependencies:
   ```bash
   npm install
   ```
4. Start the server (this automatically performs table migration/initialization):
   ```bash
   npm run start
   ```
   The backend should start at `http://localhost:5000`.

---

### Step 3: Run Backend Integration Tests
To verify all REST API endpoints, model logic, and raw SQL queries are fully functional:
1. Open a new terminal in the `backend/` folder.
2. Execute the programmatic integration test script:
   ```bash
   npm run test
   ```
   It will clear test credentials, perform registration, login, event creation, registration, dashboard expansion, moderator cancellation, and detail views to verify the system end-to-end.

---

### Step 4: Frontend Configuration & Start
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to:
   ```text
   http://localhost:3000
   ```
