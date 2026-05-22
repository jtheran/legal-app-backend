import { Queue } from 'bullmq';
import Redis from 'ioredis';
import cron from 'node-cron';
import config from '../config/config';
import logger from '../config/logger';

const connection = new Redis(config.REDIS_URL_COMPLETED || 'redis://127.0.0.1:1489');

// Creamos la instancia de la cola
export const vectorSyncQueue = new Queue('vector-sync-queue', { connection });

export const startSyncScheduler = () => {
  logger.info('Scheduler de Sincronización Vectorial iniciado.');

  // Expresión Cron: Ejecutar todos los días a las 00:00 (Medianoche)
  // Si prefieres cada hora para desarrollo, usa: '0 * * * *'
  cron.schedule('0 0 * * *', async () => {
    logger.info('[Cron] Disparando tarea automática de sincronización hacia Qdrant...');
    
    try {
      await vectorSyncQueue.add(
        'daily-db-qdrant-sync', 
        { triggeredBy: 'cron_scheduler' },
        {
          attempts: 3, // Si el API de embeddings cae, reintenta 3 veces
          backoff: {
            type: 'exponential',
            delay: 5000 // Espera 5s antes del primer reintento
          },
          removeOnComplete: true // Limpia el historial de Redis al terminar
        }
      );
    } catch (error) {
      logger.error('[Cron] No se pudo añadir el job a la cola de Redis:', error);
    }
  });
};