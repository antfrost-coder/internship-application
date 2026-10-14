import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createErrorHandler } from '../src/middleware/errorHandler.js'
import { createTestApp } from './helpers/testApp.js'

describe('app basics', () => {
  it('GET /health returns 200', async () => {
    const { app } = createTestApp()
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })

  it('returns a JSON 404 for unknown routes', async () => {
    const { app } = createTestApp()
    const res = await request(app).get('/api/nope')
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  it('sets security headers and hides the framework', async () => {
    const { app } = createTestApp()
    const res = await request(app).get('/health')
    expect(res.headers['x-powered-by']).toBeUndefined()
    expect(res.headers['x-content-type-options']).toBe('nosniff')
  })

  it('rejects an oversized body with 413', async () => {
    const { app } = createTestApp()
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.co', password: 'x'.repeat(200_000) })
    expect(res.status).toBe(413)
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE')
  })

  it('hides unexpected errors from the client and logs them', async () => {
    const logged = []
    const app = express()
    app.get('/crash', () => { throw new Error('secret database detail') })
    app.use(createErrorHandler({ logger: { error: (e) => logged.push(e) } }))

    const res = await request(app).get('/crash')
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } })
    expect(JSON.stringify(res.body)).not.toContain('secret')
    expect(logged).toHaveLength(1)
  })
})
