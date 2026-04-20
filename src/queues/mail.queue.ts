import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { mailTransporter } from '../config/mail';
import logger from '../config/logger';
import config from '../config/config';

const connection = new IORedis(
    config.REDIS_URL_COMPLETED, {
    maxRetriesPerRequest: null,
    }
);

// 1. Crear la cola
export const emailQueue = new Queue('emailQueue', { connection });

// 2. Definir el Procesador (Worker)
const emailWorker = new Worker('emailQueue', async (job: Job) => {
  const { to, subject, template, context } = job.data;

  try {
    await mailTransporter.sendMail({
      from: `"Legal App" <${config.EMAIL_FROM}>`,
      to,
      subject,
      html: template, // Aquí podrías integrar un motor de plantillas como EJS o Handlebars
    });

    logger.info(`Email enviado a ${to} - Job ID: ${job.id}`);
  } catch (error) {
    logger.error(`Error enviando email a ${to}:`, error);
    throw error; // BullMQ reintentará el trabajo automáticamente
  }
}, { connection });

emailWorker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} falló definitivamente: ${err.message}`);
});

emailWorker.on('ready', () => {
    logger.info('Email Worker listo');
});

emailWorker.on('error', (err) => {
    logger.error(`Error en Email Worker: ${err.message}`);
});