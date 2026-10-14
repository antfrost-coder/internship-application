/**
 * Reads and validates runtime configuration from environment variables.
 * Fails fast when a required secret is missing so the API never starts insecurely.
 */
export function loadConfig (env = process.env) {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required')
  }

  const bcryptRounds = Number(env.BCRYPT_ROUNDS ?? 10)
  if (!Number.isInteger(bcryptRounds) || bcryptRounds < 4 || bcryptRounds > 15) {
    throw new Error('BCRYPT_ROUNDS must be an integer between 4 and 15')
  }

  return {
    port: Number(env.PORT ?? 3000),
    databaseUrl: env.DATABASE_URL,
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN ?? '1h',
    bcryptRounds,
    corsOrigin: env.CORS_ORIGIN ?? 'http://localhost:5173'
  }
}
