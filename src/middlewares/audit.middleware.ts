import { Request, Response, NextFunction } from 'express';
import { createAuditLog } from '../services/audit.services';
import logger from '../config/logger';

/**
 * @param action - El tipo de acción (CREATE, UPDATE, DELETE, etc.)
 * @param resource - El recurso afectado (document, user, case)
 */
export const auditAction = (action: string, resource: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const start = Date.now();
        
        const originalSend = res.send;

        res.send = function (body): Response {
            const duration = Date.now() - start;
            const user = (req as any).user;

            // Ejecutamos la creación del log de forma asíncrona para no retrasar al usuario
            createAuditLog({
                userId: user?.id || null,
                userEmail: user?.email || 'anonymous',
                userRole: user?.role || 'GUEST',
                action: action,
                resource: resource,
                resourceId: req.params.id || req.body.id || null,
                description: `${action} realizado en ${resource} vía ${req.method}`,
                newData: req.method !== 'GET' ? req.body : null,
                ip: req.ip || req.socket.remoteAddress,
                userAgent: req.get('user-agent'),
                status: res.statusCode >= 200 && res.statusCode < 300 ? 'SUCCESS' : 'FAILED',
                metadata: {
                    path: req.originalUrl,
                    method: req.method,
                    duration: `${duration}ms`,
                    statusCode: res.statusCode
                }
            }).catch(err => logger.error('Error silencioso en middleware de auditoría:', err));

            return originalSend.call(this, body);
        };

        next();
    };
};