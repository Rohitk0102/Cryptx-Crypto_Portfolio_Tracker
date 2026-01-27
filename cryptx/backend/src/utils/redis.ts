import { createClient } from 'redis'

const redisClient = createClient({
  url: process.env.REDIS_URI || 'redis://localhost:6379'
})

redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err)
})

redisClient.on('connect', () => {
  console.log('✅ Redis connected successfully')
})

redisClient.on('ready', () => {
  console.log('🔄 Redis client ready')
})

redisClient.on('end', () => {
  console.warn('⚠️  Redis connection closed')
})

// Connect to Redis
export async function connectRedis() {
  try {
    await redisClient.connect()
  } catch (error) {
    console.error('❌ Redis connection failed:', error)
    console.warn('⚠️  Continuing without Redis cache')
  }
}

// Cache helper functions
export const cache = {
  async get(key: string): Promise<string | null> {
    try {
      return await redisClient.get(key)
    } catch (error) {
      console.error('Redis GET error:', error)
      return null
    }
  },

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await redisClient.setEx(key, ttl, value)
      } else {
        await redisClient.set(key, value)
      }
    } catch (error) {
      console.error('Redis SET error:', error)
    }
  },

  async del(key: string): Promise<void> {
    try {
      await redisClient.del(key)
    } catch (error) {
      console.error('Redis DEL error:', error)
    }
  },

  async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key)
      return result === 1
    } catch (error) {
      console.error('Redis EXISTS error:', error)
      return false
    }
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await redisClient.quit()
  console.log('Redis connection closed through app termination')
})

export default redisClient
