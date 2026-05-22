import { emailQueue } from '../queues/mail.queue';
import { prisma } from '../config/db';
import { getIO } from '../config/socket';
import logger from '../config/logger';

// Funciones de Auth/Bienvenida existentes que ya tenías
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

// DTO Extendido
export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type: 'EVENT_REMINDER' | 'EVENT_TODAY' | 'SYSTEM' | 'DOCUMENT' | 'CASE_UPDATE'; // Añadí CASE_UPDATE por si lo necesitas
  resourceId?: string;
}

// Opciones de canales para controlar la saturación
export interface NotificationChannels {
  socket?: boolean; // Por defecto true
  email?: boolean;  // Por defecto false (tú decides cuándo activarlo)
}

export class NotificationService {

  /**
   * Crea una notificación en la DB, la emite por WebSockets y opcionalmente la encola para envío por Email.
   */
  async create(data: CreateNotificationDto, channels: NotificationChannels = { socket: true, email: false }) {
    // 1. Persistencia obligatoria en Base de Datos
    const notification = await prisma.notification.create({ data });

    // 2. Emisión en tiempo real por WebSocket (Si está activo)
    if (channels.socket !== false) {
      try {
        const io = getIO();
        // Usamos el formato que ya tenías configurado en tu servidor de sockets
        io.to(`user:${data.userId}`).emit('notification:new', notification);
      } catch (error) {
        // Fallback silencioso: El socket no está disponible pero el flujo no se rompe
        logger.warn(`[Socket] No se pudo emitir en tiempo real a user:${data.userId}`);
      }
    }

    // 3. Envío por Correo Electrónico usando la cola existente (Asíncrono y seguro)
    if (channels.email) {
      // Ejecutamos en segundo plano para no ralentizar la petición HTTP actual
      prisma.user.findUnique({
        where: { id: data.userId },
        select: { email: true, name: true }
      }).then(async (user) => {
        if (user?.email) {
          await emailQueue.add('sendNotificationEmail', {
            to: user.email,
            subject: data.title,
            // Aquí puedes armar una plantilla HTML más corporativa reutilizando el name del abogado
            template: `
              <h3>Hola, ${user.name}</h3>
              <p>Tienes una nueva notificación en la plataforma:</p>
              <blockquote style="background: #f9f9f9; padding: 10px; border-left: 4px solid #007bff;">
                <strong>${data.title}</strong><br/>
                ${data.message}
              </blockquote>
              <p>Ingresa a la aplicación para gestionar tus procesos.</p>
            `,
          }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 10000 } // Reintentos inteligentes si falla el SMTP
          });
          logger.info(`[Queue] Notificación por email encolada para: ${user.email}`);
        }
      }).catch(err => logger.error('Error al recuperar datos del usuario para envío de correo:', err));
    }

    return notification;
  }

  // Obtener notificaciones del usuario (Mantiene tu lógica de paginado implícito a 50)
  async getByUser(userId: string, onlyUnread = false) {
    return prisma.notification.findMany({
      where: {
        userId,
        ...(onlyUnread && { read: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // Marcar como leída
  async markAsRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true, readAt: new Date() },
    });
  }

  // Marcar todas como leídas
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    });
  }

  // Contar no leídas (para el badge del panel)
  async countUnread(userId: string) {
    return prisma.notification.count({
      where: { userId, read: false },
    });
  }
}

// Exportación única de la instancia
export const notificationService = new NotificationService();