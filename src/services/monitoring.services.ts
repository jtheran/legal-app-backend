import { Worker } from 'bullmq';
import { prisma } from '../config/db';
import { checkJudicialStates } from '../services/juditial.services';
import { emailQueue } from '../queues/mail.queue';
import { notificationService } from '../services/notification.services';
import { createAuditLog } from '../services/audit.services';
import config from '../config/config';
import IOredis from 'ioredis';
import logger from '../config/logger';

export const monitoringWorker = new Worker('judicial-monitoring', async (job) => {
    logger.info('Ejecutando vigilancia judicial diaria...');

    // 1. Obtener todos los radicados de casos activos
    const cases = await prisma.case.findMany({
        where: { status: 'OPEN' },
        include: { lawyer: true }
    });

    const radicadosList = cases.map(c => c.folderNumber);
    if (radicadosList.length === 0) return;

    // 2. Correr el Scraper
    const result = await checkJudicialStates(radicadosList);
    if (!result) return;
    const { matches, pdfUrl } = result;

    for (const radicado of matches) {
        const affectedCase = cases.find(c => c.folderNumber === radicado);
        if (!affectedCase) continue;

        // 3. Actualizar el caso en la DB
        await prisma.case.update({
            where: { id: affectedCase.id },
            data: { 
                status: radicado.includes('FALLADO') ? 'CLOSED' : 'IN_PROGRESS',
            }
        });

        // 4. Registrar en Audit Log
        await createAuditLog({
                userId: affectedCase.userId,
                action: 'JUDICIAL_UPDATE_DETECTED',
                description: `Cambio detectado vía Scraping para el radicado ${radicado}`,
                resource: 'Case',
                status: 'SUCCESS',
                userAgent: 'MonitoringWorker'
        });

        // 5. Notificar por Correo (BullMQ)
        await emailQueue.add('alert-email', {
            to: affectedCase.lawyer.email,
            subject: `🚨 ¡ALERTA! Movimiento en Radicado: ${affectedCase.folderNumber}`,
            content: `Se ha detectado tu radicado en el estado publicado hoy. Puedes verlo aquí: ${pdfUrl}`
        });

        // 6. Notificar por WebSockets
        await notificationService.create({
            userId: affectedCase.userId,
            title: `Actualización de Caso ${affectedCase.folderNumber}`,
            message: `Nuevo estado para el proceso ${radicado}`,
            type: 'EVENT_TODAY',
            resourceId: affectedCase.id
        });
    }

    logger.info(`Vigilancia terminada. Coincidencias encontradas: ${matches.length}`);
}, { connection:  new IOredis(
    config.REDIS_URL_COMPLETED, {
    maxRetriesPerRequest: null,
    })
});   