import { beforeAll, vi } from 'vitest'
import { config } from 'dotenv'

// Mock environment variables before any imports
process.env.DEEPSEEK_API_KEY = 'test-key'

beforeAll(() => {
  config()
})
