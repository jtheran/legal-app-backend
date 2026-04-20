import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { emailQueue } from '../queues/mail.queue';
import logger from '../config/logger';

// 1. Enviar correo individual
export const sendIndividualEmail = async (req: Request, res: Response) => {
    try {
        const { to, subject, content } = req.body;

        await emailQueue.add('individual-email', {
            to,
            subject,
            template: content, // Aquí enviamos el HTML directamente
        });

        logger.info(`Correo individual encolado para ${to}`);
        res.json({ message: `Correo encolado para ${to}` });
    } catch (error) {
        logger.error('Error al encolar correo individual:', error);
        res.status(500).json({ message: 'Error al procesar el envío' });
    }
};

// 2. Enviar correo masivo a todos los abogados
export const sendMassiveEmail = async (req: Request, res: Response) => {
    try {
        const { subject, content } = req.body;

        // Buscamos solo los correos de los abogados
        const lawyers = await prisma.user.findMany({
            where: { role: 'LAWYER' },
            select: { email: true }
        });

        if (lawyers.length === 0) {
            return res.status(404).json({ message: 'No se encontraron abogados en la plataforma' });
        }

        // Añadimos cada correo a la cola de forma individual
        // BullMQ se encargará de procesarlos uno por uno sin saturar el SMTP
        const jobs = lawyers.map(lawyer => ({
            name: 'massive-announcement',
            data: {
                to: lawyer.email,
                subject: subject,
                template: content
            },
            opts: {
                attempts: 2,
                backoff: 5000 // Si falla, espera 5s antes de reintentar
            }
        }));

        await emailQueue.addBulk(jobs);

        logger.info(`Envío masivo iniciado por admin: ${lawyers.length} correos en cola.`);
        res.json({
            message: `Envío masivo iniciado`,
            totalRecipients: lawyers.length
        });

    } catch (error) {
        logger.error('Error en envío masivo:', error);
        res.status(500).json({ message: 'Error al procesar el envío masivo' });
    }
};