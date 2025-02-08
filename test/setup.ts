import { beforeAll } from 'vitest'
import { config } from 'dotenv'

beforeAll(() => {
  config()
  process.env.DEEPSEEK_API_KEY = 'test-key'
})
