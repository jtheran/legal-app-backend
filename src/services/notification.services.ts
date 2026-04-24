import { emailQueue } from '../queues/mail.queue';
import { prisma } from '../config/db';
import { getIO } from '../config/socket';

export const sendOTPVerification = async (email: string, code: string) => {
  await emailQueue.add('sendOTP', {
    to: email,
    subject: 'Tu código de verificación - Legal App',
    template: `<h1>Código: ${code}</h1><p>Válido por 5 minutos.</p>`,
  }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 }
  });
};

export const sendWelcomeEmail = async (email: string, name: string) => {
  await emailQueue.add('sendWelcome', {
    to: email,
    subject: `¡Bienvenido(a), ${name}!`,
    template: `<p>Hola ${name}, tu cuenta ha sido creada exitosamente en la plataforma legal.</p>`,
  });
};

export interface CreateNotificationDto {
  userId: string
  title: string
  message: string
  type: 'EVENT_REMINDER' | 'EVENT_TODAY' | 'SYSTEM' | 'DOCUMENT'
  resourceId?: string
}

export class NotificationService {

  // Crear notificación y emitir por WebSocket
  async create(data: CreateNotificationDto) {
    const notification = await prisma.notification.create({ data })

    // Emitir en tiempo real al panel del usuario
    try {
      const io = getIO()
      io.to(`user:${data.userId}`).emit('notification:new', notification)
    } catch {
      
      // Socket no disponible — la notificación igual queda en BD
    }

    return notification
  }

  // Obtener notificaciones del usuario
  async getByUser(userId: string, onlyUnread = false) {
    return prisma.notification.findMany({
      where: {
        userId,
        ...(onlyUnread && { read: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }

  // Marcar como leída
  async markAsRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true, readAt: new Date() },
    })
  }

  // Marcar todas como leídas
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    })
  }

  // Contar no leídas (para el badge del panel)
  async countUnread(userId: string) {
    return prisma.notification.count({
      where: { userId, read: false },
    })
  }
}



export const notificationService = new NotificationService()