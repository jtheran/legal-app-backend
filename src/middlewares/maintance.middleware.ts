import { Request, Response, NextFunction } from 'express'
import redisClient from '../config/redis'
import config from '../config/config'

export const maintenanceMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 1. Limpiar las URLs quitando los query params (?token=... etc.) para evitar fallas de coincidencia
  const clientPath = req.path.toLowerCase();
  const clientOriginalUrl = req.originalUrl.toLowerCase();
  const prefix = (config.API_PREFIX || '').toLowerCase();

  // 2. Rutas críticas que JAMÁS se bloquean
  const whitelist = [
    `${prefix}/auth/login`,
    `${prefix}/auth/logout`,
    `${prefix}/maintenance/status`,
    `${prefix}/maintenance/disable`,
    `${prefix}/docs`,
    `${prefix}/docs-json`,
    '/auth/login',
    '/auth/logout',
    '/maintenance/status',
    '/maintenance/disable',
  ].map(p => p.toLowerCase());

  // Validación exacta de la whitelist
  const isWhitelisted = whitelist.some(
    (path) => clientOriginalUrl.startsWith(path) || clientPath.startsWith(path)
  )

  if (isWhitelisted) {
    return next()
  }

  try {
    // 3. Consultar Redis de manera ágil
    const maintenance = await redisClient.get('system:maintenance')

    if (maintenance) {
      const data = JSON.parse(maintenance)

      // 4. INYECTAR CABECERAS ANTI-CACHÉ FLUSH
      // Esto destruye la caché del navegador y de Next.js, forzando a validar la API en cada click
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      res.setHeader('Pragma', 'no-cache')
      res.setHeader('Expires', '0')
      res.setHeader('Surrogate-Control', 'no-store')

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
  } catch (error) {
    console.error('Error crítico en bypass de mantenimiento:', error)
  }

  next()
}