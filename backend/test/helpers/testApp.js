import request from 'supertest'
import { createApp } from '../../src/app.js'
import { ROLES } from '../../src/domain/roles.js'
import { createInMemoryUserRepository } from './inMemoryUserRepository.js'

export const testConfig = {
  port: 0,
  databaseUrl: undefined,
  jwtSecret: 'test-secret-that-is-long-enough',
  jwtExpiresIn: '1h',
  bcryptRounds: 4, // fast hashing for tests
  corsOrigin: 'http://localhost:5173'
}

export const validRegistration = (overrides = {}) => ({
  email: 'student@example.com',
  password: 'correct horse battery',
  firstName: 'Ada',
  lastName: 'Lovelace',
  role: ROLES.STUDENT,
  ...overrides
})

export function createTestApp () {
  const userRepository = createInMemoryUserRepository()
  const errors = []
  const logger = { error: (err) => errors.push(err) }
  const app = createApp({ config: testConfig, userRepository, logger })
  return { app, userRepository, errors }
}

/** Registers a user (any role, by writing through the repository) and returns a bearer token. */
export async function createUserWithToken (ctx, { role = ROLES.STUDENT, email = `${role}@example.com`, password = 'correct horse battery' } = {}) {
  const registered = await request(ctx.app).post('/api/auth/register').send(validRegistration({ email, password }))
  if (role !== ROLES.STUDENT) {
    await ctx.userRepository.updateRole(registered.body.user.id, role)
  }
  const login = await request(ctx.app).post('/api/auth/login').send({ email, password })
  return { user: login.body.user, token: login.body.token, password }
}
