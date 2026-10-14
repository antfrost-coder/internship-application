import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createTestApp, validRegistration } from './helpers/testApp.js'

describe('POST /api/auth/register (SCRUM-13)', () => {
  it('creates an account and never returns the password or its hash', async () => {
    const { app } = createTestApp()
    const res = await request(app).post('/api/auth/register').send(validRegistration())

    expect(res.status).toBe(201)
    expect(res.body.user).toMatchObject({
      email: 'student@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      role: 'student'
    })
    expect(res.body.user.id).toBeTypeOf('string')
    expect(JSON.stringify(res.body)).not.toMatch(/password|hash/i)
  })

  it('stores a bcrypt hash, not the password', async () => {
    const { app, userRepository } = createTestApp()
    await request(app).post('/api/auth/register').send(validRegistration())

    const stored = await userRepository.findByEmail('student@example.com')
    expect(stored.passwordHash).not.toBe('correct horse battery')
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$/)
  })

  it('lets a recruiter register', async () => {
    const { app } = createTestApp()
    const res = await request(app).post('/api/auth/register').send(validRegistration({ role: 'recruiter' }))
    expect(res.status).toBe(201)
    expect(res.body.user.role).toBe('recruiter')
  })

  it('normalizes the email to lower case and trims names', async () => {
    const { app } = createTestApp()
    const res = await request(app).post('/api/auth/register')
      .send(validRegistration({ email: '  Ada@Example.COM ', firstName: '  Ada ' }))

    expect(res.status).toBe(201)
    expect(res.body.user.email).toBe('ada@example.com')
    expect(res.body.user.firstName).toBe('Ada')
  })

  it('rejects a duplicate email, whatever its case', async () => {
    const { app } = createTestApp()
    await request(app).post('/api/auth/register').send(validRegistration())
    const res = await request(app).post('/api/auth/register').send(validRegistration({ email: 'STUDENT@example.com' }))

    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('EMAIL_TAKEN')
  })

  it.each([
    ['invalid email', { email: 'not-an-email' }, 'email'],
    ['missing email', { email: undefined }, 'email'],
    ['short password', { password: 'short' }, 'password'],
    ['password over 72 bytes', { password: 'x'.repeat(73) }, 'password'],
    ['non-string password', { password: 12345678 }, 'password'],
    ['missing first name', { firstName: '  ' }, 'firstName'],
    ['missing last name', { lastName: undefined }, 'lastName'],
    ['unknown role', { role: 'superuser' }, 'role'],
    ['missing role', { role: undefined }, 'role']
  ])('rejects %s with 400', async (_label, overrides, field) => {
    const { app } = createTestApp()
    const res = await request(app).post('/api/auth/register').send(validRegistration(overrides))

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    expect(res.body.error.details.map((d) => d.field)).toContain(field)
  })

  it.each(['admin', 'school_staff'])('does not let anyone self-register as %s', async (role) => {
    const { app, userRepository } = createTestApp()
    const res = await request(app).post('/api/auth/register').send(validRegistration({ role }))

    expect(res.status).toBe(400)
    expect(await userRepository.list()).toHaveLength(0)
  })

  it('reports every invalid field at once', async () => {
    const { app } = createTestApp()
    const res = await request(app).post('/api/auth/register').send({})

    expect(res.status).toBe(400)
    expect(res.body.error.details.map((d) => d.field).sort()).toEqual(
      ['email', 'firstName', 'lastName', 'password', 'role']
    )
  })

  it('rejects a malformed JSON body with 400', async () => {
    const { app } = createTestApp()
    const res = await request(app).post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{"email": ')

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_JSON')
  })
})
