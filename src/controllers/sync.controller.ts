import { Request, Response } from 'express';
import { vectorSyncQueue } from '../queues/sync.queue'; // <-- Importamos la cola
import logger from '../config/logger';

export const triggerManualSync = async (req: Request, res: Response): Promise<void> => {
  try {

    // Añadimos el trabajo a la cola de Redis de inmediato
    const job = await vectorSyncQueue.add(
      'manual-sync-job', 
      {
        attempts: 2, // Reintentos si falla la API de embeddings o Qdrant
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: true // Limpia Redis al finalizar con éxito
      }
    );

    // Respondemos con 202 Accepted (estándar para procesos asíncronos pesados)
    logger.info('La sincronización con la base de datos vectorial ha sido encolada')
    res.status(202).json({
      success: true,
      message: 'La sincronización con la base de datos vectorial ha sido encolada.',
      jobId: job.id,
      status: 'queued'
    });

  } catch (error) {
    logger.error('Error al encolar la sincronización manual:', error);
    res.status(500).json({
      success: false,
      message: 'No se pudo procesar la solicitud de sincronización.'
    });
  }
};