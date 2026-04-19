import { prisma } from '../config/db';
import logger from '../config/logger';

interface AuditData {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  resource: string;
  resourceId?: string;
  description?: string;
  oldData?: any;
  newData?: any;
  ip?: string;
  userAgent?: string;
  status?: 'SUCCESS' | 'FAILED';
  metadata?: any;
}

export const createAuditLog = async (data: AuditData) => {
  try {
    const log = await prisma.auditLog.create({
      data: {
        ...data,
        // Aseguramos que los objetos Json sean válidos para Prisma
        oldData: data.oldData || undefined,
        newData: data.newData || undefined,
        metadata: data.metadata || undefined,
      }
    });
    
    // Logueamos en Winston también para tener respaldo en archivo
    logger.info(`Auditoría registrada: ${data.action} en ${data.resource} por ${data.userEmail || 'Sistema'}`);
    
    return log;
  } catch (error) {
    // Si falla la auditoría, es un error crítico de sistema
    logger.error('Error al crear registro de auditoría:', error);
  }
};