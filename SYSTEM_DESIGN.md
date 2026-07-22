# System Design - GatherFlow

## Architecture

The project uses a simple client-server architecture:
* **Frontend**: Next.js (port 3000) - handles client-side rendering, routing, and state management. Calls the backend API directly via fetch.
* **Backend**: Express API (port 5000) - stateless server handling routing, token validation, request parsing, and database transactions.
* **Database**: PostgreSQL (port 5432) - relational storage. All queries are parameterized SQL queries using the native `pg` pool driver.

## Database Schema

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  location TEXT,
  owner_id INT REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE registrations (
  id SERIAL PRIMARY KEY,
  event_id INT REFERENCES events(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'registered', -- 'registered' or 'cancelled'
  cancellation_reason TEXT,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, user_id)
);
```

### Performance & Indexing
To speed up queries and joins:
* Indexes on foreign keys: `events(owner_id)`, `registrations(event_id)`, and `registrations(user_id)`.
* Index on `events(date)` to make event list sorting faster.

## API Endpoints

### Auth
* `POST /api/auth/register` - Create a user, hash password, return JWT.
* `POST /api/auth/login` - Validate credentials, return JWT.
* `GET /api/auth/me` - Get profile details (authenticated).

### Events
* `GET /api/events` - Get events catalog. Supports query filters (`search`, `location`, `startDate`, `endDate`) and sorting.
* `GET /api/events/:id` - Get details of a single event.
* `POST /api/events` - Create event (authenticated).
* `PUT /api/events/:id` - Update event details (authenticated, owner only).
* `DELETE /api/events/:id` - Delete event (authenticated, owner only).

### Registrations
* `POST /api/events/:id/register` - Register logged-in user for an event (authenticated).
* `GET /api/events/:id/participants` - List participants for an event (authenticated, owner only).
* `PUT /api/events/:id/participants/:userId/cancel` - Cancel a participant's registration with a reason (authenticated, owner only).

## Security

1. **SQL Injection**: We do not use an ORM, so all queries use parameterized variables (`$1`, `$2`, etc.) to prevent injection. For dynamic sorting fields, inputs are checked against a hardcoded whitelist before execution.
2. **Authentication**: Stateless authentication using JSON Web Tokens (JWT) sent via authorization header.
3. **Password Security**: Passwords are encrypted using `bcryptjs` with 10 salt rounds before database storage.
4. **Authorization Checks**: For update, delete, and moderation actions, the controller verifies if the request's user ID matches the event's `owner_id`.
