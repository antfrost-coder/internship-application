import { describe, expect, it } from 'vitest'
import { loadConfig } from '../../src/config.js'

describe('loadConfig', () => {
  it('requires JWT_SECRET', () => {
    expect(() => loadConfig({})).toThrow('JWT_SECRET')
  })

  it('applies defaults', () => {
    expect(loadConfig({ JWT_SECRET: 's' })).toMatchObject({
      port: 3000,
      jwtExpiresIn: '1h',
      bcryptRounds: 10,
      corsOrigin: 'http://localhost:5173'
    })
  })

  it('reads overrides from the environment', () => {
    const config = loadConfig({
      JWT_SECRET: 's', PORT: '4000', DATABASE_URL: 'postgres://x', JWT_EXPIRES_IN: '15m', BCRYPT_ROUNDS: '12', CORS_ORIGIN: 'https://iap.example'
    })
    expect(config).toEqual({
      port: 4000, databaseUrl: 'postgres://x', jwtSecret: 's', jwtExpiresIn: '15m', bcryptRounds: 12, corsOrigin: 'https://iap.example'
    })
  })

  it.each(['3', '16', 'abc', '10.5'])('rejects BCRYPT_ROUNDS=%s', (value) => {
    expect(() => loadConfig({ JWT_SECRET: 's', BCRYPT_ROUNDS: value })).toThrow('BCRYPT_ROUNDS')
  })
})
