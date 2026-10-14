import pg from 'pg'

export const createPool = (databaseUrl) => {
  if (!databaseUrl) throw new Error('DATABASE_URL is required')
  return new pg.Pool({ connectionString: databaseUrl })
}
