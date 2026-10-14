import { ALL_ROLES, SELF_REGISTRATION_ROLES } from '../domain/roles.js'
import { badRequest } from './httpError.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// bcrypt only uses the first 72 bytes of a password.
const PASSWORD_MIN = 8
const PASSWORD_MAX_BYTES = 72

const asObject = (body) => (body && typeof body === 'object' && !Array.isArray(body) ? body : {})
const trimmed = (value) => (typeof value === 'string' ? value.trim() : '')

function fail (errors) {
  throw badRequest('VALIDATION_ERROR', 'Invalid request body', errors)
}

function checkEmail (value, errors) {
  const email = trimmed(value).toLowerCase()
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    errors.push({ field: 'email', message: 'must be a valid email address' })
  }
  return email
}

function checkName (value, field, errors) {
  const name = trimmed(value)
  if (!name || name.length > 100) {
    errors.push({ field, message: 'is required and must be at most 100 characters' })
  }
  return name
}

export function validateRegistration (body) {
  const input = asObject(body)
  const errors = []

  const email = checkEmail(input.email, errors)
  const firstName = checkName(input.firstName, 'firstName', errors)
  const lastName = checkName(input.lastName, 'lastName', errors)

  const { password, role } = input
  if (typeof password !== 'string' || password.length < PASSWORD_MIN || Buffer.byteLength(password) > PASSWORD_MAX_BYTES) {
    errors.push({ field: 'password', message: `must be between ${PASSWORD_MIN} and ${PASSWORD_MAX_BYTES} bytes long` })
  }
  if (!SELF_REGISTRATION_ROLES.includes(role)) {
    errors.push({ field: 'role', message: `must be one of: ${SELF_REGISTRATION_ROLES.join(', ')}` })
  }

  if (errors.length > 0) fail(errors)
  return { email, password, firstName, lastName, role }
}

export function validateLogin (body) {
  const input = asObject(body)
  const errors = []

  const email = checkEmail(input.email, errors)
  if (typeof input.password !== 'string' || input.password.length === 0) {
    errors.push({ field: 'password', message: 'is required' })
  }

  if (errors.length > 0) fail(errors)
  return { email, password: input.password }
}

export function validateRoleChange (body) {
  const input = asObject(body)
  if (!ALL_ROLES.includes(input.role)) {
    fail([{ field: 'role', message: `must be one of: ${ALL_ROLES.join(', ')}` }])
  }
  return { role: input.role }
}

export function validateUuid (value, field = 'id') {
  if (typeof value !== 'string' || !UUID_RE.test(value)) {
    throw badRequest('VALIDATION_ERROR', `${field} must be a valid UUID`)
  }
  return value
}
