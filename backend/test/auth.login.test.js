import jwt from 'jsonwebtoken'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createTestApp, testConfig, validRegistration } from './helpers/testApp.js'

async function appWithAccount () {
  const ctx = createTestApp()
  await request(ctx.app).post('/api/auth/register').send(validRegistration())
  return ctx
}

describe('POST /api/auth/login (SCRUM-14)', () => {
  it('returns a signed token and the user', async () => {
    const { app } = await appWithAccount()
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'student@example.com', password: 'correct horse battery' })

    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe('student@example.com')
    expect(JSON.stringify(res.body.user)).not.toMatch(/password|hash/i)

    const payload = jwt.verify(res.body.token, testConfig.jwtSecret)
    expect(payload.sub).toBe(res.body.user.id)
    expect(payload.role).toBe('student')
    expect(payload.exp).toBeGreaterThan(payload.iat)
  })

  it('accepts the email in any case', async () => {
    const { app } = await appWithAccount()
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'STUDENT@Example.com', password: 'correct horse battery' })
    expect(res.status).toBe(200)
  })

  it('answers a wrong password and an unknown email identically', async () => {
    const { app } = await appWithAccount()
    const wrongPassword = await request(app).post('/api/auth/login')
      .send({ email: 'student@example.com', password: 'wrong password!' })
    const unknownEmail = await request(app).post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'correct horse battery' })

    expect(wrongPassword.status).toBe(401)
    expect(unknownEmail.status).toBe(401)
    expect(wrongPassword.body).toEqual(unknownEmail.body)
    expect(wrongPassword.body.error.code).toBe('INVALID_CREDENTIALS')
  })

  it.each([
    ['missing password', { email: 'student@example.com' }],
    ['empty password', { email: 'student@example.com', password: '' }],
    ['missing email', { password: 'correct horse battery' }],
    ['invalid email', { email: 'nope', password: 'correct horse battery' }]
  ])('rejects %s with 400', async (_label, body) => {
    const { app } = await appWithAccount()
    const res = await request(app).post('/api/auth/login').send(body)

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('rejects an empty request body with 400', async () => {
    const { app } = await appWithAccount()
    const res = await request(app).post('/api/auth/login')
    expect(res.status).toBe(400)
  })
})
