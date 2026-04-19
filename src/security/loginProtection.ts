import redisClient from '../config/redis'
import config from '../config/config'

// Configuración de bloqueo progresivo
const CONFIG = {
  MAX_ATTEMPTS: config.RATE_LIMIT_MAX_AUTH,              // intentos antes del primer bloqueo
  BLOCK_DURATIONS: [            // bloqueos progresivos en segundos
    1 * 60,                     // 1er bloqueo:  1 minuto
    5 * 60,                     // 2do bloqueo:  5 minutos
    15 * 60,                    // 3er bloqueo:  15 minutos
    60 * 60,                    // 4to bloqueo:  1 hora
    24 * 60 * 60,               // 5to bloqueo:  24 horas
  ],
}

const keys = {
  attempts: (email: string) => `login:attempts:${email}`,
  blocked:  (email: string) => `login:blocked:${email}`,
  level:    (email: string) => `login:block_level:${email}`,
}

// Verificar si el usuario está bloqueado
export const isUserBlocked = async (email: string): Promise<{
  blocked: boolean
  remainingSeconds?: number
  message?: string
}> => {
  const ttl = await redisClient.ttl(keys.blocked(email))

  if (ttl > 0) {
    const minutes = Math.ceil(ttl / 60)
    return {
      blocked: true,
      remainingSeconds: ttl,
      message: ttl < 60
        ? `Cuenta bloqueada. Intenta en ${ttl} segundos.`
        : `Cuenta bloqueada. Intenta en ${minutes} minutos.`,
    }
  }

  return { blocked: false }
}

// Registrar intento fallido
export const registerFailedAttempt = async (email: string): Promise<{
  attemptsLeft: number
  blocked: boolean
  message: string
}> => {
  const attemptsKey = keys.attempts(email)
  const levelKey    = keys.level(email)

  // Incrementar contador de intentos
  const attempts = await redisClient.incr(attemptsKey)

  // Expirar el contador en 24 horas si es el primer intento
  if (attempts === 1) {
    await redisClient.expire(attemptsKey, 24 * 60 * 60)
  }

  const attemptsLeft = CONFIG.MAX_ATTEMPTS - attempts

  // Si no llegó al límite aún
  if (attempts < CONFIG.MAX_ATTEMPTS) {
    return {
      attemptsLeft,
      blocked: false,
      message: `Credenciales inválidas. Te quedan ${attemptsLeft} intentos.`,
    }
  }

  // Calcular nivel de bloqueo
  const currentLevel = parseInt(await redisClient.get(levelKey) || '0')
  const blockIndex   = Math.min(currentLevel, CONFIG.BLOCK_DURATIONS.length - 1)
  const blockSeconds = CONFIG.BLOCK_DURATIONS[blockIndex]

  // Aplicar bloqueo
  await redisClient.setEx(keys.blocked(email), blockSeconds, '1')

  // Subir el nivel para el próximo bloqueo
  await redisClient.set(levelKey, String(currentLevel + 1))
  await redisClient.expire(levelKey, 7 * 24 * 60 * 60) // nivel persiste 7 días

  // Resetear contador de intentos
  await redisClient.del(attemptsKey)

  const minutes = Math.ceil(blockSeconds / 60)
  const timeMsg = blockSeconds < 60
    ? `${blockSeconds} segundos`
    : blockSeconds < 3600
      ? `${minutes} minutos`
      : `${Math.ceil(blockSeconds / 3600)} hora(s)`

  return {
    attemptsLeft: 0,
    blocked: true,
    message: `Demasiados intentos fallidos. Cuenta bloqueada por ${timeMsg}.`,
  }
}

// Limpiar intentos tras login exitoso
export const clearFailedAttempts = async (email: string): Promise<void> => {
  await redisClient.del(keys.attempts(email))
  await redisClient.del(keys.blocked(email))
  // No borramos el nivel — si vuelve a fallar el bloqueo será más largo
}

// Desbloqueo manual por admin
export const unblockUser = async (email: string): Promise<void> => {
  await redisClient.del(keys.attempts(email))
  await redisClient.del(keys.blocked(email))
  await redisClient.del(keys.level(email))
}