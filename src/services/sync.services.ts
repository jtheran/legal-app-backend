import { prisma } from '../config/db';
import config from '../config/config';
import { generateEmbedding } from './ai.services';
import { qdrant } from '../config/qdrant';
import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger';

export const syncDatabaseToVectorStore = async () => {
    try {
        // 1. Obtener datos de Prisma
        const clients = await prisma.client.findMany({ include: { cases: true } });
        const cases = await prisma.case.findMany();
        const allPoints: any[] = [];

        // --- MAPEAR PROMESAS PARA CLIENTES (Paralelismo) ---
        const clientPromises = clients.map(async (client) => {
          const clientText = `Registro de Cliente: ${client.name}. DNI: ${client.dni}. Contacto: ${client.email || 'N/A'}, Tel: ${client.phone || 'N/A'}. Casos asociados: ${client.cases.length}.`;
          const vector = await generateEmbedding(clientText);
          return {
            id: uuidv4(),
            vector,
            payload: {
              type: 'database_record',
              model: 'Client',
              recordId: client.id,
              text: clientText,
              lawyerId: client.userId,
              metadata: { dni: client.dni, email: client.email }
            }
          };
        });

        // --- MAPEAR PROMESAS PARA CASOS ---
        const casePromises = cases.map(async (c) => {
          const caseText = `Expediente Judicial: ${c.title}. Descripción: ${c.description}. Estado actual: ${c.status}.`;
          const vector = await generateEmbedding(caseText);
          return {
            id: uuidv4(),
            vector,
            payload: {
              type: 'database_record',
              model: 'Case',
              recordId: c.id,
              text: caseText,
              lawyerId: c.userId,
              metadata: { status: c.status }
            }
          };
        });

        // Resolver todas las llamadas de embeddings concurrentemente
        const clientPoints = await Promise.all(clientPromises);
        const casePoints = await Promise.all(casePromises);
        
        allPoints.push(...clientPoints, ...casePoints);

        // 2. Subida masiva (Upsert) a Qdrant
        if (allPoints.length > 0) {
          await qdrant.upsert(config.QDRANT_COLLECTION_NAME, {
            wait: true,
            points: allPoints
          });
          logger.info(`[Worker] Sincronización exitosa: ${allPoints.length} puntos vectorizados.`);
        }

        return { success: true, processed: allPoints.length };

      } catch (error) {
        logger.error('[Worker] Error en la ejecución de sincronización vector:', error);
        throw error; // BullMQ marcará el job como fallido para reintentos
      }
};