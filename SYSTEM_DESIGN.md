# System Design Document - Event Manager Dashboard

This document outlines the system architecture, database design, REST API specifications, security measures, and scalability strategies implemented for the Event Manager Dashboard.

---

## 1. Architectural Overview

The application follows a decoupled **Client-Server Architecture** designed for horizontal scalability:

```text
               +----------------------------------------+
               |           Client (Next.js)             |
               |       Port 3000 (App Router)           |
               +-------------------+--------------------+
                                   |
                                   | REST HTTP/JSON
                                   v
                       +-----------+------------+
                       |   Nginx Reverse Proxy  | (Production Router)
                       +-----------+------------+
                                   |
                                   v
               +-------------------+--------------------+
               |          API Server (Express)          |
               |               Port 5000                |
               +-------------------+--------------------+
                                   |
                                   | Pool Connection (Raw SQL)
                                   v
               +-------------------+--------------------+
               |          PostgreSQL Database           |
               |               Port 5432                |
               +----------------------------------------+
```

### Components
1. **Frontend (Client)**: A React-based Next.js application using App Router. The client fetches resources dynamically on the client side using a standard REST client. Local state stores auth details to bypass SSR latency.
2. **Backend (App Server)**: A lightweight Node.js Express server using native ES Modules. It coordinates routing, authentication middleware, request validation via Zod, and data processing.
3. **Database (Data Layer)**: PostgreSQL running locally on port 5432. All table queries are executed via raw parameterised SQL using the native `pg` client connection pool.

---

## 2. Database Design & Relational Schema

To support the requirement of event creation, participant registration, and owner moderation (cancellation with reason), we implement a relational database schema.

### Relational Schema (SQL)
```sql
-- Users Table: Stores identity credentials
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Events Table: Stores details of events hosted by users
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  location TEXT,
  owner_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Registrations Table: Maps participant signups to events
CREATE TABLE registrations (
  id SERIAL PRIMARY KEY,
  event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'registered', -- 'registered' or 'cancelled'
  cancellation_reason TEXT,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, user_id)
);
```

### Indexing Strategy for Performance
To optimize query search performance at scale:
1. **Foreign Keys**: Index `events(owner_id)`, `registrations(event_id)`, and `registrations(user_id)` to speed up joins.
2. **Search Queries**: Create a B-Tree index on `events(name)` and `events(date)` to accelerate text searching and sorting operations.
3. **Identity Lookups**: Implicit B-Tree index on `users(email)` via `UNIQUE` constraint.

```sql
CREATE INDEX IF NOT EXISTS idx_events_owner ON events(owner_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_events_name_trgm ON events USING gin (name gin_trgm_ops); -- for ILIKE queries
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
```

---

## 3. REST API Specifications

All communication between the Next.js client and the Express backend is structured around standard REST principles:

### Authentication Endpoints
- `POST /api/auth/register` - Creates a new user account. Returns a JWT and user meta.
- `POST /api/auth/login` - Authenticates user credentials. Returns a JWT and user meta.
- `GET /api/auth/me` - Authenticates token and returns current user profile details.

### Event Management Endpoints
- `GET /api/events` - Lists all events. Supports pagination, full-text searching, location filtering, date-range filtering, and sorting (date, name).
- `POST /api/events` - Creates a new event. (Requires Bearer Token; owner set to logged-in user).
- `GET /api/events/:id` - Fetches details for a single event. If an authentication header is passed, it resolves the requester's registration status.
- `PUT /api/events/:id` - Updates event details. (Requires Bearer Token; restricted to event owner).
- `DELETE /api/events/:id` - Deletes event by ID. (Requires Bearer Token; restricted to event owner).

### Event Registration & Moderation
- `POST /api/events/:id/register` - Registers the authenticated user for the specified event.
- `GET /api/events/:id/participants` - Returns the registration status and profile of all participants. (Requires Bearer Token; restricted to event owner).
- `PUT /api/events/:id/participants/:userId/cancel` - Cancels a registration, updating status to `cancelled` and writing a `cancellation_reason`. (Requires Bearer Token; restricted to event owner).

---

## 4. Security Framework

### 1. SQL Injection Prevention
ORMs are excluded. To ensure strict protection against SQL injections:
- All raw SQL queries use **parameterised queries** (`$1`, `$2`, `$3`).
- No raw string interpolation is used for input injection in sql commands.
- Sorting column inputs are checked against a whitelist (`['date', 'name', 'location', 'created_at']`) before appending to query strings.

### 2. Password Hashing
- Credentials are encrypted using **BcryptJS** with a work factor (salt rounds) of 10.
- Password hashes are stored, and raw text passwords never touch database disks.

### 3. JWT Authentication & Protected Routes
- Stateless sessions are enforced via JSON Web Tokens.
- Access is restricted using `authenticateToken` middleware which verifies token signatures.
- Ownership assertions are verified by comparing database records (`event.owner_id`) to the verified `req.user.id` payload.

---

## 5. Scalability Considerations

1. **Connection Pooling**:
   Instead of opening a new client connection for each HTTP call, the backend uses `pg.Pool`. This maintains a pool of warm, reusable database connections, minimizing connection handshake overhead.
2. **Text Search Efficiency**:
   The `events` name filtering queries utilize `ILIKE %search%`. For database sizes exceeding 100k events, standard indexes fail. Using PostgreSQL's `pg_trgm` (trigram) indexes allows efficient index scans for wildcard strings.
3. **Database Caching (Redis)**:
   For high-volume public reads (like listing upcoming events on the homepage), a caching layer using Redis can be implemented. Cache eviction would trigger on `POST /events`, `PUT /events/:id`, and `DELETE /events/:id`.
4. **App Server Clusters**:
   The Express backend is stateless (utilizing JWTs). This allows running multiple node processes using PM2 on a multi-core processor or scaling horizontally across container clusters (ECS/Kubernetes) behind a Round-Robin Nginx load balancer.
5. **Database Replication**:
   Write/Read segregation can be introduced. Write actions go to a PostgreSQL Master instance, while reading event lists scales by querying PostgreSQL Read Replicas.
