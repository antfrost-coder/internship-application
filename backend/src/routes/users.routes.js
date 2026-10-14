import { Router } from 'express'
import { ROLES } from '../domain/roles.js'
import { authorize } from '../middleware/authorize.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { validateRoleChange, validateUuid } from '../utils/validation.js'

/** Administrator-only user management (SCRUM-15). */
export function createUsersRouter ({ authService, authenticate }) {
  const router = Router()
  router.use(authenticate, authorize(ROLES.ADMIN))

  router.get('/', asyncHandler(async (_req, res) => {
    res.json({ users: await authService.listUsers() })
  }))

  router.patch('/:id/role', asyncHandler(async (req, res) => {
    const targetId = validateUuid(req.params.id)
    const { role } = validateRoleChange(req.body)
    const user = await authService.changeRole({ actorId: req.user.id, targetId, role })
    res.json({ user })
  }))

  return router
}
