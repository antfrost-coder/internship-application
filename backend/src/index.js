import 'dotenv/config'
import { createApp } from './app.js'
import { loadConfig } from './config.js'
import { createPool } from './db/pool.js'
import { createUserRepository } from './repositories/userRepository.js'

const config = loadConfig()
const pool = createPool(config.databaseUrl)
const app = createApp({ config, userRepository: createUserRepository(pool) })

app.listen(config.port, () => {
  console.log(`[server] listening on http://localhost:${config.port}`)
})
