import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      // Process entry points and DB bootstrap scripts need a real server/database;
      // they are exercised by the CI "migrate" job instead of unit tests.
      exclude: ['src/index.js', 'src/db/migrate.js', 'src/db/seedAdmin.js', 'src/db/pool.js'],
      reporter: ['text', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 70
      }
    }
  }
})
