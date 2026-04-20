import { Request, Response } from 'express'
import redisClient from '../config/redis'
import { prisma } from '../config/db'
import si from 'systeminformation'
import os from 'os'

// ── MANTENIMIENTO ─────────────────────────────────────────

export const enableMaintenance = async (req: Request, res: Response) => {
  try {
    const user = req.user as any
    const {
      message = 'La plataforma está en mantenimiento. Volveremos pronto.',
      estimatedEnd,        // ISO string opcional
    } = req.body

    const data = {
      active: true,
      message,
      estimatedEnd: estimatedEnd || null,
      startedAt: new Date().toISOString(),
      startedBy: user?.email || 'system',
    }

    // Guardar en Redis sin expiración (dura hasta que se desactive)
    await redisClient.set('system:maintenance', JSON.stringify(data))

    console.warn(`🚧 Mantenimiento activado por ${data.startedBy}`)

    res.json({
      message: 'Modo mantenimiento activado',
      data,
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

export const disableMaintenance = async (req: Request, res: Response) => {
  try {
    const user = req.user as any
    await redisClient.del('system:maintenance')

    console.info(`✅ Mantenimiento desactivado por ${user?.email || 'system'}`)

    res.json({ message: 'Modo mantenimiento desactivado. Plataforma disponible.' })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

export const getMaintenanceStatus = async (_req: Request, res: Response) => {
  try {
    const data = await redisClient.get('system:maintenance')
    if (!data) {
      return res.json({ active: false, message: 'Plataforma operativa' })
    }
    res.json({ active: true, ...JSON.parse(data) })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// ── ESTADÍSTICAS ──────────────────────────────────────────

export const getStats = async (_req: Request, res: Response) => {
  try {
    const [
      platformStats,
      systemStats,
    ] = await Promise.all([
      getPlatformStats(),
      getSystemStats(),
    ])

    res.json({
      timestamp: new Date().toISOString(),
      platform: platformStats,
      system: systemStats,
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// ── Stats de negocio desde la BD ─────────────────────────
const getPlatformStats = async () => {
  const now = new Date()
  const startOfDay   = new Date(now.setHours(0, 0, 0, 0))
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfWeek  = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())

  const [
    totalUsers,
    activeUsers,
    newUsersToday,
    newUsersMonth,

    totalEvents,
    eventsToday,
    eventsThisWeek,
    upcomingEvents,
    cancelledEvents,

    totalNotifications,
    unreadNotifications,
    notificationsToday,

    totalDocuments,
    documentsToday,
    documentsMonth,

    // Emails desde la cola de BullMQ en Redis
    emailsQueued,
    emailsSentToday,

  ] = await Promise.all([
    // Usuarios
    prisma.user.count(),
    prisma.user.count({ where: { } }),
    prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),

    // Eventos
    prisma.calendarEvent.count(),
    prisma.calendarEvent.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.calendarEvent.count({ where: { startDate: { gte: startOfWeek } } }),
    prisma.calendarEvent.count({ where: { startDate: { gte: new Date() }, status: 'ACTIVE' } }),
    prisma.calendarEvent.count({ where: { status: 'CANCELLED' } }),

    // Notificaciones
    prisma.notification.count(),
    prisma.notification.count({ where: { read: false } }),
    prisma.notification.count({ where: { createdAt: { gte: startOfDay } } }),

    // Documentos (si tienes el modelo)
    prisma.document.count().catch(() => 0),
    prisma.document.count({ where: { createdAt: { gte: startOfDay } } }).catch(() => 0),
    prisma.document.count({ where: { createdAt: { gte: startOfMonth } } }).catch(() => 0),

    // Emails en cola Redis
    redisClient.lLen('bull:email-queue:wait').catch(() => 0),
    redisClient.get('stats:emails:sent:today').then(v => parseInt(v || '0')).catch(() => 0),
  ])

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      newToday: newUsersToday,
      newThisMonth: newUsersMonth,
    },
    events: {
      total: totalEvents,
      createdToday: eventsToday,
      thisWeek: eventsThisWeek,
      upcoming: upcomingEvents,
      cancelled: cancelledEvents,
    },
    notifications: {
      total: totalNotifications,
      unread: unreadNotifications,
      sentToday: notificationsToday,
    },
    documents: {
      total: totalDocuments,
      uploadedToday: documentsToday,
      uploadedThisMonth: documentsMonth,
    },
    emails: {
      queued: emailsQueued,
      sentToday: emailsSentToday,
    },
  }
}

// ── Stats del sistema operativo ───────────────────────────
const getSystemStats = async () => {
  const [
    cpu,
    cpuTemp,
    mem,
    disk,
    network,
    processes,
    uptime,
  ] = await Promise.all([
    si.currentLoad(),
    si.cpuTemperature().catch(() => ({ main: null })),
    si.mem(),
    si.fsSize(),
    si.networkStats(),
    si.processes(),
    Promise.resolve(os.uptime()),
  ])

  // CPU
  const cpuStats = {
    usage:       parseFloat(cpu.currentLoad.toFixed(2)),
    userLoad:    parseFloat(cpu.currentLoadUser.toFixed(2)),
    systemLoad:  parseFloat(cpu.currentLoadSystem.toFixed(2)),
    cores:       os.cpus().length,
    model:       os.cpus()[0]?.model || 'Unknown',
    temperature: cpuTemp.main ? parseFloat(cpuTemp.main.toFixed(1)) : null,
  }

  // Memoria RAM
  const memStats = {
    total:       formatBytes(mem.total),
    used:        formatBytes(mem.used),
    free:        formatBytes(mem.free),
    usagePercent: parseFloat(((mem.used / mem.total) * 100).toFixed(2)),
    swap: {
      total: formatBytes(mem.swaptotal),
      used:  formatBytes(mem.swapused),
    },
  }

  // Disco
  const diskStats = disk.map((d) => ({
    mount:       d.mount,
    type:        d.type,
    total:       formatBytes(d.size),
    used:        formatBytes(d.used),
    free:        formatBytes(d.size - d.used),
    usagePercent: parseFloat(d.use.toFixed(2)),
  }))

  // Red
  const netStats = network
    .filter((n) => n.iface !== 'lo')
    .map((n) => ({
      interface:   n.iface,
      rxSec:       formatBytes(n.rx_sec || 0) + '/s',
      txSec:       formatBytes(n.tx_sec || 0) + '/s',
      rxTotal:     formatBytes(n.rx_bytes),
      txTotal:     formatBytes(n.tx_bytes),
    }))

  // Procesos
  const processStats = {
    total:   processes.all,
    running: processes.running,
    blocked: processes.blocked,
    sleeping: processes.sleeping,
  }

  // Uptime
  const uptimeStats = {
    seconds: uptime,
    formatted: formatUptime(uptime),
    nodeVersion: process.version,
    platform: os.platform(),
    arch: os.arch(),
    hostname: os.hostname(),
  }

  return {
    cpu: cpuStats,
    memory: memStats,
    disk: diskStats,
    network: netStats,
    processes: processStats,
    uptime: uptimeStats,
  }
}

// ── Helpers ───────────────────────────────────────────────
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

const formatUptime = (seconds: number): string => {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return `${d}d ${h}h ${m}m ${s}s`
}