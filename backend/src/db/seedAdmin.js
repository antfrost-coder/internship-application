/**
 * Creates the first administrator from ADMIN_EMAIL / ADMIN_PASSWORD.
 * Administrators cannot self-register, so someone has to be seeded.
 * Safe to run twice: an existing account is left untouched.
 */
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { loadConfig } from '../config.js'
import { ROLES } from '../domain/roles.js'
import { createUserRepository } from '../repositories/userRepository.js'
import { validateRegistration } from '../utils/validation.js'
import { createPool } from './pool.js'

const config = loadConfig()
const pool = createPool(config.databaseUrl)

try {
  const { email, password } = validateRegistration({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    firstName: 'Admin',
    lastName: 'User',
    role: ROLES.STUDENT // placeholder: self-registration rules apply to the shared validator only
  })

  const repo = createUserRepository(pool)
  if (await repo.findByEmail(email)) {
    console.log(`admin ${email} already exists`)
  } else {
    const passwordHash = await bcrypt.hash(password, config.bcryptRounds)
    await repo.create({ email, passwordHash, firstName: 'Admin', lastName: 'User', role: ROLES.ADMIN })
    console.log(`admin ${email} created`)
  }
} finally {
  await pool.end()
}
