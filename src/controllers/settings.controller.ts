import { Request, Response } from 'express'
import { prisma } from '../config/db'
import redisClient from '../config/redis'
import { createAuditLog } from '../services/audit.services'

// GET /api/v1/settings
export const getSettings = async (req: Request, res: Response) => {
  try {
    const dbSettings = await prisma.systemSetting.findMany({
      orderBy: { key: 'asc' }
    })
    
    return res.json({
      success: true,
      data: dbSettings
    })
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

// POST /api/v1/settings
export const updateSettings = async (req: Request, res: Response) => {
  try {
    const { settings } = req.body // Formato esperado: [ { key: "AI_MODEL", value: "phi-4" }, ... ]
    const user = req.user as any

    if (!settings || !Array.isArray(settings)) {
      return res.status(400).json({ 
        success: false, 
        message: 'El cuerpo de la petición debe contener un array "settings".' 
      })
    }

    // 1. Escritura atómica transaccional en Postgres
    await prisma.$transaction(
      settings.map((item: { key: string; value: any }) =>
        prisma.systemSetting.upsert({
          where: { key: item.key },
          update: { value: String(item.value) },
          create: { key: item.key, value: String(item.value) },
        })
      )
    )

    // 2. Invalidación estratégica en caché de Redis
    for (const item of settings) {
      await redisClient.del(`setting:${item.key}`)
    }

    // 3. Auditoría del cambio de infraestructura
    await createAuditLog({
      userEmail: user?.email || 'system-admin',
      action: 'UPDATE',
      resource: 'settings',
      status: 'SUCCESS',
      ip: req.ip,
      description: `Actualizadas variables de entorno dinámicas: ${settings.map(s => s.key).join(', ')}`
    })

    return res.json({
      success: true,
      message: 'Configuraciones actualizadas con éxito y memoria caché sincronizada.'
    })
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message })
  }
}