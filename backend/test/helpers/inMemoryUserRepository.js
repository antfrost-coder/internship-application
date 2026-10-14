import { randomUUID } from 'node:crypto'
import { conflict } from '../../src/utils/httpError.js'

/** Same contract as src/repositories/userRepository.js, backed by a Map. Test-only. */
export function createInMemoryUserRepository () {
  const users = new Map()
  const clone = (user) => (user ? { ...user } : null)

  return {
    async findByEmail (email) {
      return clone([...users.values()].find((u) => u.email === email))
    },
    async findById (id) {
      return clone(users.get(id))
    },
    async create ({ email, passwordHash, firstName, lastName, role }) {
      if ([...users.values()].some((u) => u.email === email)) {
        throw conflict('EMAIL_TAKEN', 'An account with this email already exists')
      }
      const user = { id: randomUUID(), email, passwordHash, firstName, lastName, role, createdAt: new Date() }
      users.set(user.id, user)
      return clone(user)
    },
    async list () {
      return [...users.values()].map(clone)
    },
    async updateRole (id, role) {
      const user = users.get(id)
      if (!user) return null
      user.role = role
      return clone(user)
    },
    async remove (id) {
      users.delete(id)
    }
  }
}
