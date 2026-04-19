import cron from 'node-cron';
import { syncDatabaseToVectorStore } from '../services/sync.services';
import logger from './logger';

export const initCronJobs = () => {
    // Ejemplo: Ejecutar todos los días a las 7:00 AM
    cron.schedule('0 7 * * *', async () => {
        logger.info('Ejecutando tarea programada: Sincronización Vectorial');
        await syncDatabaseToVectorStore();
    });
};