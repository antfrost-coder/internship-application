import { HttpError, notFound } from '../utils/httpError.js'

export const notFoundHandler = (_req, _res, next) => next(notFound('Route not found'))

/**
 * Global error middleware: every failure becomes `{ error: { code, message, details? } }`.
 * Unexpected errors are logged and never leak their message to the client.
 */
export const createErrorHandler = ({ logger = console } = {}) => (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    const error = { code: err.code, message: err.message }
    if (err.details) error.details = err.details
    return res.status(err.status).json({ error })
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' } })
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' } })
  }
  logger.error(err)
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } })
}
