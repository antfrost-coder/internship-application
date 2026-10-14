/** An error that maps directly to an HTTP response. */
export class HttpError extends Error {
  constructor (status, code, message, details) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export const badRequest = (code, message, details) => new HttpError(400, code, message, details)
export const unauthorized = (message = 'Authentication required', code = 'UNAUTHORIZED') => new HttpError(401, code, message)
export const forbidden = (message = 'You do not have access to this resource') => new HttpError(403, 'FORBIDDEN', message)
export const notFound = (message = 'Resource not found') => new HttpError(404, 'NOT_FOUND', message)
export const conflict = (code, message) => new HttpError(409, code, message)
