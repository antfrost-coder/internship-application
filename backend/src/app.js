import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { createErrorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { createAuthenticate } from './middleware/authenticate.js'
import { createAuthRouter } from './routes/auth.routes.js'
import { createUsersRouter } from './routes/users.routes.js'
import { createAuthService } from './services/authService.js'

/**
 * Builds the Express app. Dependencies are injected so tests can run
 * without a database (see test/helpers/inMemoryUserRepository.js).
 */
export function createApp ({ config, userRepository, logger = console }) {
  const authService = createAuthService({ userRepository, config })
  const authenticate = createAuthenticate({ authService })

  const app = express()
  app.disable('x-powered-by')
  app.use(helmet())
  app.use(cors({ origin: config.corsOrigin }))
  app.use(express.json({ limit: '100kb' }))

  app.get('/health', (_req, res) => res.json({ status: 'ok' }))
  app.use('/api/auth', createAuthRouter({ authService, authenticate }))
  app.use('/api/users', createUsersRouter({ authService, authenticate }))

  app.use(notFoundHandler)
  app.use(createErrorHandler({ logger }))
  return app
}
