import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createTestApp, createUserWithToken } from './helpers/testApp.js'

const bearer = (token) => ({ Authorization: `Bearer ${token}` })

describe('user and role management (SCRUM-15)', () => {
  describe('GET /api/users', () => {
    it('lists accounts for an administrator, without password hashes', async () => {
      const ctx = createTestApp()
      const admin = await createUserWithToken(ctx, { role: 'admin' })
      await createUserWithToken(ctx, { role: 'student' })

      const res = await request(ctx.app).get('/api/users').set(bearer(admin.token))
      expect(res.status).toBe(200)
      expect(res.body.users).toHaveLength(2)
      expect(JSON.stringify(res.body)).not.toMatch(/password|hash/i)
    })

    it.each(['student', 'recruiter', 'school_staff'])('forbids the %s role', async (role) => {
      const ctx = createTestApp()
      const { token } = await createUserWithToken(ctx, { role })

      const res = await request(ctx.app).get('/api/users').set(bearer(token))
      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('requires authentication', async () => {
      const { app } = createTestApp()
      const res = await request(app).get('/api/users')
      expect(res.status).toBe(401)
    })
  })

  describe('PATCH /api/users/:id/role', () => {
    it('lets an administrator change another user\'s role', async () => {
      const ctx = createTestApp()
      const admin = await createUserWithToken(ctx, { role: 'admin' })
      const student = await createUserWithToken(ctx, { role: 'student' })

      const res = await request(ctx.app).patch(`/api/users/${student.user.id}/role`)
        .set(bearer(admin.token)).send({ role: 'school_staff' })

      expect(res.status).toBe(200)
      expect(res.body.user).toMatchObject({ id: student.user.id, role: 'school_staff' })
    })

    it('applies the new role immediately, even to tokens issued before', async () => {
      const ctx = createTestApp()
      const admin = await createUserWithToken(ctx, { role: 'admin' })
      const student = await createUserWithToken(ctx, { role: 'student' })

      const before = await request(ctx.app).get('/api/users').set(bearer(student.token))
      expect(before.status).toBe(403)

      await request(ctx.app).patch(`/api/users/${student.user.id}/role`)
        .set(bearer(admin.token)).send({ role: 'admin' })

      const after = await request(ctx.app).get('/api/users').set(bearer(student.token))
      expect(after.status).toBe(200)
    })

    it('forbids non-administrators from changing roles', async () => {
      const ctx = createTestApp()
      const student = await createUserWithToken(ctx, { role: 'student', email: 'a@example.com' })
      const other = await createUserWithToken(ctx, { role: 'student', email: 'b@example.com' })

      const res = await request(ctx.app).patch(`/api/users/${other.user.id}/role`)
        .set(bearer(student.token)).send({ role: 'admin' })
      expect(res.status).toBe(403)
    })

    it('does not let an administrator change their own role', async () => {
      const ctx = createTestApp()
      const admin = await createUserWithToken(ctx, { role: 'admin' })

      const res = await request(ctx.app).patch(`/api/users/${admin.user.id}/role`)
        .set(bearer(admin.token)).send({ role: 'student' })
      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('CANNOT_CHANGE_OWN_ROLE')
    })

    it('rejects an unknown role', async () => {
      const ctx = createTestApp()
      const admin = await createUserWithToken(ctx, { role: 'admin' })
      const student = await createUserWithToken(ctx, { role: 'student' })

      const res = await request(ctx.app).patch(`/api/users/${student.user.id}/role`)
        .set(bearer(admin.token)).send({ role: 'root' })
      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('rejects an id that is not a UUID', async () => {
      const ctx = createTestApp()
      const admin = await createUserWithToken(ctx, { role: 'admin' })

      const res = await request(ctx.app).patch('/api/users/123/role')
        .set(bearer(admin.token)).send({ role: 'student' })
      expect(res.status).toBe(400)
    })

    it('returns 404 for an unknown user', async () => {
      const ctx = createTestApp()
      const admin = await createUserWithToken(ctx, { role: 'admin' })

      const res = await request(ctx.app).patch(`/api/users/${randomUUID()}/role`)
        .set(bearer(admin.token)).send({ role: 'student' })
      expect(res.status).toBe(404)
    })
  })
})
