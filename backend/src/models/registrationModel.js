import pool from '../config/db.js';

export const RegistrationModel = {
  async register({ eventId, userId }) {
    // Upsert registration in case they register, cancel, and register again
    const query = `
      INSERT INTO registrations (event_id, user_id, status, cancellation_reason)
      VALUES ($1, $2, 'registered', NULL)
      ON CONFLICT (event_id, user_id) 
      DO UPDATE SET status = 'registered', cancellation_reason = NULL, registered_at = CURRENT_TIMESTAMP
      RETURNING id, event_id, user_id, status, registered_at
    `;
    const { rows } = await pool.query(query, [eventId, userId]);
    return rows[0];
  },

  async findByEventAndUser(eventId, userId) {
    const query = `
      SELECT id, event_id, user_id, status, cancellation_reason, registered_at
      FROM registrations
      WHERE event_id = $1 AND user_id = $2
    `;
    const { rows } = await pool.query(query, [eventId, userId]);
    return rows[0] || null;
  },

  async findParticipantsByEventId(eventId) {
    const query = `
      SELECT r.id as registration_id, r.status, r.cancellation_reason, r.registered_at,
             u.id as user_id, u.name as user_name, u.email as user_email
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      WHERE r.event_id = $1
      ORDER BY r.registered_at DESC
    `;
    const { rows } = await pool.query(query, [eventId]);
    return rows;
  },

  async cancelRegistration(eventId, userId, reason) {
    const query = `
      UPDATE registrations
      SET status = 'cancelled', cancellation_reason = $1
      WHERE event_id = $2 AND user_id = $3
      RETURNING id, event_id, user_id, status, cancellation_reason
    `;
    const { rows } = await pool.query(query, [reason.trim(), eventId, userId]);
    return rows[0] || null;
  }
};
