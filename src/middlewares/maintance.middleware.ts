import { Request, Response, NextFunction } from 'express'
import redisClient from '../config/redis'

export const maintenanceMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Rutas que nunca se bloquean
  const whitelist = [
    '/api/auth/login',
    '/api/maintenance/status',
    '/api/maintenance/disable',
    '/api/docs',
    '/api/docs-json',
  ]

  if (whitelist.some((path) => req.path.startsWith(path))) {
    return next()
  }

  const maintenance = await redisClient.get('system:maintenance')

  if (maintenance) {
    const data = JSON.parse(maintenance)
    return res.status(503).json({
      statusCode: 503,
      error: 'Service Unavailable',
      maintenance: true,
      message: data.message || 'Plataforma en mantenimiento. Intenta más tarde.',
      estimatedEnd: data.estimatedEnd || null,
      startedAt: data.startedAt,
      startedBy: data.startedBy,
    })
  }

  next()
}