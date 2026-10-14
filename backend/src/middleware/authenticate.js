import { asyncHandler } from '../utils/asyncHandler.js'
import { unauthorized } from '../utils/httpError.js'

/** Requires `Authorization: Bearer <token>` and sets `req.user`. */
export function createAuthenticate ({ authService }) {
  return asyncHandler(async (req, _res, next) => {
    const [scheme, token] = (req.headers.authorization ?? '').split(' ')
    if (scheme !== 'Bearer' || !token) {
      throw unauthorized('Missing or malformed Authorization header')
    }
    req.user = await authService.authenticate(token)
    next()
  })
}
