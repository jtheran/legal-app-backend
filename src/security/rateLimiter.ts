import rateLimit, { Options } from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import { RedisClientType } from 'redis'

// Recibe el cliente ya conectado como parámetro
export const createLimiters = (redisClient: RedisClientType) => {

  const createStore = (prefix: string) =>
    new RedisStore({
      prefix,
      sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    })

  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    store: createStore('rl:global:'),
    message: {
      message: 'Demasiadas solicitudes. Intenta en 15 minutos.',
      statusCode: 429,
    },
  })

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    store: createStore('rl:auth:'),
    message: {
      message: 'Demasiados intentos. Intenta en 15 minutos.',
      statusCode: 429,
    },
  })

  const strictLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    store: createStore('rl:strict:'),
    message: {
      message: 'Límite alcanzado. Intenta en 1 hora.',
      statusCode: 429,
    },
  })

  return { globalLimiter, authLimiter, strictLimiter }
}