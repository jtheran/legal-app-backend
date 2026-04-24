// src/queues/monitoring.queue.ts
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import config from '../config/config';

const connection = new IORedis(
    config.REDIS_URL_COMPLETED, {
    maxRetriesPerRequest: null,
    }
);

export const monitoringQueue = new Queue('judicial-monitoring', { connection });

// Ejecutar de lunes a viernes a las 6:30 AM
monitoringQueue.add('daily-scrape', {}, {
    repeat: {
        pattern: '30 6 * * 1-5',
    }
});