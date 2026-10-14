import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { badRequest, conflict, notFound, unauthorized } from '../utils/httpError.js'

/** Never expose the password hash outside the service layer. */
export const toPublicUser = ({ id, email, firstName, lastName, role, createdAt }) => ({
  id, email, firstName, lastName, role, createdAt
})

export function createAuthService ({ userRepository, config }) {
  // Used to spend the same time on unknown emails as on wrong passwords,
  // so response timing does not reveal which emails have an account.
  const dummyHash = bcrypt.hash('not-a-real-password', config.bcryptRounds)

  return {
    /** SCRUM-13: create an account. */
    async register ({ email, password, firstName, lastName, role }) {
      if (await userRepository.findByEmail(email)) {
        throw conflict('EMAIL_TAKEN', 'An account with this email already exists')
      }
      const passwordHash = await bcrypt.hash(password, config.bcryptRounds)
      const user = await userRepository.create({ email, passwordHash, firstName, lastName, role })
      return toPublicUser(user)
    },

    /** SCRUM-14: authenticate and issue a token. */
    async login ({ email, password }) {
      const user = await userRepository.findByEmail(email)
      const valid = await bcrypt.compare(password, user ? user.passwordHash : await dummyHash)
      if (!user || !valid) {
        throw unauthorized('Invalid email or password', 'INVALID_CREDENTIALS')
      }
      const token = jwt.sign({ role: user.role }, config.jwtSecret, {
        algorithm: 'HS256',
        subject: user.id,
        expiresIn: config.jwtExpiresIn
      })
      return { token, user: toPublicUser(user) }
    },

    /** Resolves a bearer token to the current user. Roles are read from the database, not the token. */
    async authenticate (token) {
      let payload
      try {
        payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] })
      } catch {
        throw unauthorized('Invalid or expired token', 'INVALID_TOKEN')
      }
      const user = await userRepository.findById(payload.sub)
      if (!user) throw unauthorized('Invalid or expired token', 'INVALID_TOKEN')
      return toPublicUser(user)
    },

    /** SCRUM-15 (admin): list accounts. */
    async listUsers () {
      return (await userRepository.list()).map(toPublicUser)
    },

    /** SCRUM-15 (admin): change another user's role. */
    async changeRole ({ actorId, targetId, role }) {
      if (actorId === targetId) {
        throw badRequest('CANNOT_CHANGE_OWN_ROLE', 'Administrators cannot change their own role')
      }
      const user = await userRepository.updateRole(targetId, role)
      if (!user) throw notFound('User not found')
      return toPublicUser(user)
    }
  }
}
