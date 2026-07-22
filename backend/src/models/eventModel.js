import pool from '../config/db.js';

export const EventModel = {
  async create({ name, description, date, location, ownerId, imageUrl }) {
    const query = `
      INSERT INTO events (name, description, date, location, owner_id, image_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, description, date, location, owner_id, image_url, created_at
    `;
    const values = [name.trim(), description?.trim(), date, location?.trim(), ownerId, imageUrl?.trim() || null];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  async findAll({ search, location, startDate, endDate, sortBy = 'date', sortOrder = 'ASC' } = {}) {
    let query = `
      SELECT e.id, e.name, e.description, e.date, e.location, e.owner_id, e.image_url, e.created_at,
             u.name as owner_name, u.email as owner_email,
             COALESCE((
               SELECT COUNT(*)::int 
               FROM registrations r 
               WHERE r.event_id = e.id AND r.status = 'registered'
             ), 0) as participant_count
      FROM events e
      JOIN users u ON e.owner_id = u.id
      WHERE 1=1
    `;
    const values = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND e.name ILIKE $${paramIndex}`;
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (location) {
      query += ` AND e.location ILIKE $${paramIndex}`;
      values.push(`%${location}%`);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND e.date >= $${paramIndex}`;
      values.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND e.date <= $${paramIndex}`;
      values.push(endDate);
      paramIndex++;
    }

    // Sort order sanitation
    const allowedSortFields = ['date', 'name', 'location', 'created_at'];
    const sortField = allowedSortFields.includes(sortBy) ? `e.${sortBy}` : 'e.date';
    const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    query += ` ORDER BY ${sortField} ${order}`;

    const { rows } = await pool.query(query, values);
    return rows;
  },

  async findById(id) {
    const query = `
      SELECT e.id, e.name, e.description, e.date, e.location, e.owner_id, e.image_url, e.created_at,
             u.name as owner_name, u.email as owner_email,
             COALESCE((
               SELECT COUNT(*)::int 
               FROM registrations r 
               WHERE r.event_id = e.id AND r.status = 'registered'
             ), 0) as participant_count
      FROM events e
      JOIN users u ON e.owner_id = u.id
      WHERE e.id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  },

  async update(id, { name, description, date, location, imageUrl }) {
    const query = `
      UPDATE events
      SET name = $1, description = $2, date = $3, location = $4, image_url = $5
      WHERE id = $6
      RETURNING id, name, description, date, location, owner_id, image_url, created_at
    `;
    const values = [name.trim(), description?.trim(), date, location?.trim(), imageUrl?.trim() || null, id];
    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  },

  async delete(id) {
    const query = 'DELETE FROM events WHERE id = $1 RETURNING id';
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }
};
