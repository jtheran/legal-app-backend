import { Request, Response } from 'express';
import { prisma } from '../config/db';
import logger from '../config/logger';

// 1. Listar notificaciones del usuario autenticado
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    
    const userId = req.user?.id;
    const { unreadOnly } = req.query;

    // Construcción del filtro usando el índice compuesto [userId, read]
    const whereClause: any = { userId };
    if (unreadOnly === 'true') {
      whereClause.read = false;
    }

    const [notifications, total] = await prisma.$transaction([
      prisma.notification.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.notification.count({ where: whereClause })
    ]);

    res.status(200).json({
      success: true,
      data: notifications,
      meta: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    logger.error('Error al obtener notificaciones:', error);
    res.status(500).json({ success: false, message: 'Error al procesar las notificaciones.' });
  }
};

// 2. Marcar una notificación específica como leída
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const userId = req.user?.id;

    // Validamos primero que la notificación exista y pertenezca al usuario
    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notificación no encontrada.' });
      return;
    }

    if (notification.userId !== userId) {
      res.status(403).json({ success: false, message: 'No tienes autorización para modificar esta notificación.' });
      return;
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: {
        read: true,
        readAt: new Date()
      }
    });

    res.status(200).json({ success: true, data: updatedNotification });
  } catch (error) {
    logger.error(`Error al marcar como leída la notificación ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

// 3. Marcar TODAS las notificaciones del usuario como leídas (Acción masiva optimizada)
export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const result = await prisma.notification.updateMany({
      where: {
        userId,
        read: false
      },
      data: {
        read: true,
        readAt: new Date()
      }
    });

    res.status(200).json({
      success: true,
      message: `Se marcaron ${result.count} notificaciones como leídas.`
    });
  } catch (error) {
    logger.error('Error al marcar todas las notificaciones como leídas:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar las notificaciones.' });
  }
};

// 4. Eliminar una notificación
export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const userId = req.user?.id;

    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notificación no encontrada.' });
      return;
    }

    if (notification.userId !== userId) {
      res.status(403).json({ success: false, message: 'Acceso denegado.' });
      return;
    }

    await prisma.notification.delete({ where: { id } });

    res.status(200).json({ success: true, message: 'Notificación eliminada correctamente.' });
  } catch (error) {
    logger.error(`Error al eliminar la notificación ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'No se pudo eliminar la notificación.' });
  }
};