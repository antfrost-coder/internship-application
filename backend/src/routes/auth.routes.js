import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { validateLogin, validateRegistration } from '../utils/validation.js'

export function createAuthRouter ({ authService, authenticate }) {
  const router = Router()

  // SCRUM-13
  router.post('/register', asyncHandler(async (req, res) => {
    const user = await authService.register(validateRegistration(req.body))
    res.status(201).json({ user })
  }))

  // SCRUM-14
  router.post('/login', asyncHandler(async (req, res) => {
    res.json(await authService.login(validateLogin(req.body)))
  }))

  router.get('/me', authenticate, (req, res) => {
    res.json({ user: req.user })
  })

  return router
}
