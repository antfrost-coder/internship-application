import { describe, expect, it, vi } from 'vitest'
import { createUserRepository } from '../../src/repositories/userRepository.js'
import { HttpError } from '../../src/utils/httpError.js'

const row = {
  id: '3f2b8c1e-9d4a-4b6e-8a1c-0e5d7f9a2b3c',
  email: 'a@example.com',
  password_hash: 'hash',
  first_name: 'Ada',
  last_name: 'Lovelace',
  role: 'student',
  created_at: new Date('2026-10-14T20:00:00Z')
}
const user = {
  id: row.id, email: row.email, passwordHash: 'hash', firstName: 'Ada', lastName: 'Lovelace', role: 'student', createdAt: row.created_at
}
const poolReturning = (rows) => ({ query: vi.fn().mockResolvedValue({ rows }) })

describe('PostgreSQL user repository', () => {
  it('maps snake_case rows to camelCase users', async () => {
    const pool = poolReturning([row])
    const repo = createUserRepository(pool)

    expect(await repo.findByEmail('a@example.com')).toEqual(user)
    expect(await repo.findById(row.id)).toEqual(user)
    expect(await repo.list()).toEqual([user])
  })

  it('returns null when nothing matches', async () => {
    const repo = createUserRepository(poolReturning([]))
    expect(await repo.findByEmail('x@example.com')).toBeNull()
    expect(await repo.findById(row.id)).toBeNull()
    expect(await repo.updateRole(row.id, 'admin')).toBeNull()
  })

  it('uses parameterized queries', async () => {
    const pool = poolReturning([row])
    const repo = createUserRepository(pool)
    await repo.findByEmail("x'; DROP TABLE users; --")

    const [sql, params] = pool.query.mock.calls[0]
    expect(sql).not.toContain('DROP TABLE')
    expect(params).toEqual(["x'; DROP TABLE users; --"])
  })

  it('inserts and updates with the right parameters', async () => {
    const pool = poolReturning([row])
    const repo = createUserRepository(pool)

    expect(await repo.create({ email: row.email, passwordHash: 'hash', firstName: 'Ada', lastName: 'Lovelace', role: 'student' })).toEqual(user)
    expect(pool.query.mock.calls[0][1]).toEqual([row.email, 'hash', 'Ada', 'Lovelace', 'student'])

    await repo.updateRole(row.id, 'admin')
    expect(pool.query.mock.calls[1][1]).toEqual([row.id, 'admin'])
  })

  it('turns a unique-violation into a 409 EMAIL_TAKEN', async () => {
    const pool = { query: vi.fn().mockRejectedValue(Object.assign(new Error('duplicate key'), { code: '23505' })) }
    const repo = createUserRepository(pool)

    const error = await repo.create({ email: row.email, passwordHash: 'h', firstName: 'A', lastName: 'B', role: 'student' }).catch((e) => e)
    expect(error).toBeInstanceOf(HttpError)
    expect(error).toMatchObject({ status: 409, code: 'EMAIL_TAKEN' })
  })

  it('rethrows other database errors untouched', async () => {
    const boom = new Error('connection lost')
    const repo = createUserRepository({ query: vi.fn().mockRejectedValue(boom) })

    await expect(repo.create({ email: 'a@b.co', passwordHash: 'h', firstName: 'A', lastName: 'B', role: 'student' })).rejects.toBe(boom)
  })
})
