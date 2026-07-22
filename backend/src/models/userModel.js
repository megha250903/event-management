import pool from '../config/db.js';

export const UserModel = {
  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const values = [email.toLowerCase().trim()];
    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  },

  async create({ email, name, passwordHash }) {
    const query = `
      INSERT INTO users (email, name, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, email, name, created_at
    `;
    const values = [email.toLowerCase().trim(), name.trim(), passwordHash];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  async findById(id) {
    const query = 'SELECT id, email, name, created_at FROM users WHERE id = $1';
    const values = [id];
    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }
};
