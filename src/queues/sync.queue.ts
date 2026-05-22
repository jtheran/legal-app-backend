import { Worker, Job, Queue } from 'bullmq';
import Redis from 'ioredis';
import config from '../config/config';
import { syncDatabaseToVectorStore } from '../services/sync.services';
import logger from '../config/logger';

const connection = new Redis(config.REDIS_URL_COMPLETED || 'redis://127.0.0.1:6379');

export const vectorSyncQueue = new Queue('vector-sync-queue', { connection });

/**
 * 2. El WORKER: El proceso en segundo plano que escucha la cola 
 * y ejecuta el servicio de sincronización.
 */
export const initSyncWorker = () => {
  const worker = new Worker(
    'vector-sync-queue',
    async (job: Job) => {
      logger.info(`[Worker] Iniciando Job #${job.id} (${job.name}) solicitado por: ${job.data.triggeredBy}`);
      
      // Ejecuta tu servicio original que mapea Prisma y sube a Qdrant
      await syncDatabaseToVectorStore(); 
    },
    { 
      connection,
      concurrency: 1 // Evita condiciones de carrera en Qdrant
    }
  );

  worker.on('completed', (job) => logger.info(`[Worker] Job ${job.id} completado con éxito.`));
  worker.on('failed', (job, err) => logger.error(`[Worker] Job ${job?.id} falló: ${err.message}`));
};