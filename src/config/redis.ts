import { createClient, RedisClientType } from 'redis'
import config from './config'

export const redisClient = createClient({
  url: config.REDIS_URL,
  password: config.REDIS_PASSWORD || undefined,
}) as RedisClientType

redisClient.on('error', (err) => console.error('❌ Redis error:', err))

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect()
    console.log('✅ Redis conectado')
  }
}

export default redisClient