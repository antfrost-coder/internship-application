import jwt from 'jsonwebtoken'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createTestApp, createUserWithToken, testConfig } from './helpers/testApp.js'

describe('GET /api/auth/me (authentication middleware)', () => {
  it('returns the current user for a valid token', async () => {
    const ctx = createTestApp()
    const { user, token } = await createUserWithToken(ctx)

    const res = await request(ctx.app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.user).toEqual(JSON.parse(JSON.stringify(user)))
  })

  it.each([
    ['no header', undefined],
    ['wrong scheme', 'Basic abc'],
    ['no token', 'Bearer'],
    ['garbage token', 'Bearer not.a.jwt']
  ])('rejects %s with 401', async (_label, header) => {
    const { app } = createTestApp()
    const req = request(app).get('/api/auth/me')
    const res = await (header ? req.set('Authorization', header) : req)

    expect(res.status).toBe(401)
    expect(res.body.error.code).toMatch(/UNAUTHORIZED|INVALID_TOKEN/)
  })

  it('rejects an expired token', async () => {
    const ctx = createTestApp()
    const { user } = await createUserWithToken(ctx)
    const expired = jwt.sign({ role: user.role }, testConfig.jwtSecret, { subject: user.id, expiresIn: -10 })

    const res = await request(ctx.app).get('/api/auth/me').set('Authorization', `Bearer ${expired}`)
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('INVALID_TOKEN')
  })

  it('rejects a token signed with another secret', async () => {
    const ctx = createTestApp()
    const { user } = await createUserWithToken(ctx)
    const forged = jwt.sign({ role: 'admin' }, 'some-other-secret', { subject: user.id })

    const res = await request(ctx.app).get('/api/auth/me').set('Authorization', `Bearer ${forged}`)
    expect(res.status).toBe(401)
  })

  it('rejects an unsigned (alg=none) token', async () => {
    const ctx = createTestApp()
    const { user } = await createUserWithToken(ctx)
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
    const unsigned = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: user.id, role: 'admin' })}.`

    const res = await request(ctx.app).get('/api/auth/me').set('Authorization', `Bearer ${unsigned}`)
    expect(res.status).toBe(401)
  })

  it('rejects a valid token whose user no longer exists', async () => {
    const ctx = createTestApp()
    const { user, token } = await createUserWithToken(ctx)
    await ctx.userRepository.remove(user.id)

    const res = await request(ctx.app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(401)
  })
})
