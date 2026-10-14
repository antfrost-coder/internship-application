import { describe, expect, it } from 'vitest'
import { HttpError } from '../../src/utils/httpError.js'
import { validateLogin, validateRegistration, validateRoleChange, validateUuid } from '../../src/utils/validation.js'

describe('validation helpers', () => {
  it('treats non-object bodies as empty', () => {
    for (const body of [undefined, null, 'text', [], 42]) {
      expect(() => validateRegistration(body)).toThrow(HttpError)
      expect(() => validateLogin(body)).toThrow(HttpError)
      expect(() => validateRoleChange(body)).toThrow(HttpError)
    }
  })

  it('counts password length in bytes, as bcrypt does', () => {
    const base = { email: 'a@b.co', firstName: 'A', lastName: 'B', role: 'student' }
    // 40 two-byte characters = 80 bytes > 72, although only 40 characters long
    expect(() => validateRegistration({ ...base, password: 'é'.repeat(40) })).toThrow(HttpError)
    expect(validateRegistration({ ...base, password: 'é'.repeat(36) }).password).toHaveLength(36)
  })

  it('accepts valid UUIDs and rejects anything else', () => {
    expect(validateUuid('3f2b8c1e-9d4a-4b6e-8a1c-0e5d7f9a2b3c')).toBe('3f2b8c1e-9d4a-4b6e-8a1c-0e5d7f9a2b3c')
    expect(() => validateUuid('42')).toThrow(HttpError)
    expect(() => validateUuid(undefined)).toThrow(HttpError)
  })
})
