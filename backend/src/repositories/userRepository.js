import { conflict } from '../utils/httpError.js'

const COLUMNS = 'id, email, password_hash, first_name, last_name, role, created_at'
const UNIQUE_VIOLATION = '23505'

const toUser = (row) => row && {
  id: row.id,
  email: row.email,
  passwordHash: row.password_hash,
  firstName: row.first_name,
  lastName: row.last_name,
  role: row.role,
  createdAt: row.created_at
}

/** PostgreSQL-backed user storage. Emails are expected to be lower-cased by the caller. */
export function createUserRepository (pool) {
  return {
    async findByEmail (email) {
      const { rows } = await pool.query(`SELECT ${COLUMNS} FROM users WHERE email = $1`, [email])
      return toUser(rows[0]) ?? null
    },

    async findById (id) {
      const { rows } = await pool.query(`SELECT ${COLUMNS} FROM users WHERE id = $1`, [id])
      return toUser(rows[0]) ?? null
    },

    async create ({ email, passwordHash, firstName, lastName, role }) {
      try {
        const { rows } = await pool.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, role)
           VALUES ($1, $2, $3, $4, $5) RETURNING ${COLUMNS}`,
          [email, passwordHash, firstName, lastName, role]
        )
        return toUser(rows[0])
      } catch (err) {
        // Two simultaneous registrations with the same email: the UNIQUE constraint decides.
        if (err.code === UNIQUE_VIOLATION) {
          throw conflict('EMAIL_TAKEN', 'An account with this email already exists')
        }
        throw err
      }
    },

    async list () {
      const { rows } = await pool.query(`SELECT ${COLUMNS} FROM users ORDER BY created_at, id`)
      return rows.map(toUser)
    },

    async updateRole (id, role) {
      const { rows } = await pool.query(
        `UPDATE users SET role = $2 WHERE id = $1 RETURNING ${COLUMNS}`,
        [id, role]
      )
      return toUser(rows[0]) ?? null
    }
  }
}
