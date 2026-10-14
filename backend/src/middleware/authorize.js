import { forbidden, unauthorized } from '../utils/httpError.js'

/** Role-based access control. Use after `authenticate`: `authorize(ROLES.ADMIN)`. */
export const authorize = (...allowedRoles) => (req, _res, next) => {
  if (!req.user) return next(unauthorized())
  if (!allowedRoles.includes(req.user.role)) return next(forbidden())
  next()
}
