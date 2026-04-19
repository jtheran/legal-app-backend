import { Request, Response, NextFunction } from 'express'
import redisClient from '../config/redis'

// IPs bloqueadas permanentemente (puedes cargar desde BD)
const BLOCKED_IPS = new Set(
  (process.env.BLOCKED_IPS || '').split(',').filter(Boolean)
)

const getClientIP = (req: Request): string => {
  return (
    req.headers['x-forwarded-for'] as string ||
    req.headers['x-real-ip'] as string ||
    req.socket.remoteAddress ||
    'unknown'
  ).split(',')[0].trim()
}

// Bloquear IPs conocidas maliciosas
export const ipBlocker = async (req: Request, res: Response, next: NextFunction) => {
  const ip = getClientIP(req)

  // Verificar lista estática
  if (BLOCKED_IPS.has(ip)) {
    return res.status(403).json({ message: 'Acceso denegado' })
  }

  // Verificar lista dinámica en Redis
  const isBlocked = await redisClient.get(`blocked:ip:${ip}`)
  if (isBlocked) {
    return res.status(403).json({ message: 'Acceso denegado' })
  }

  next()
}

// Bloquear IP dinámicamente desde el código
export const blockIP = async (ip: string, seconds = 24 * 60 * 60) => {
  await redisClient.setEx(`blocked:ip:${ip}`, seconds, '1')
}

// Agregar IP a req para usarla en los controllers
export const attachIP = (req: Request, _res: Response, next: NextFunction) => {
  (req as any).clientIP = getClientIP(req)
  next()
}