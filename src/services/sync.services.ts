import { prisma } from '../config/db';
import config from '../config/config';
import { generateEmbedding } from './ai.services';
import { qdrant } from '../config/qdrant';
import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger';

export const syncDatabaseToVectorStore = async () => {
    try {
        // 1. Obtener datos de múltiples modelos
        const clients = await prisma.client.findMany({ include: { cases: true } });
        const cases = await prisma.case.findMany();

        const allPoints = [];
        logger.info('Iniciando sincronización de modelos de base de datos a Qdrant...');
        // --- PROCESAR CLIENTES ---
        for (const client of clients) {
            const clientText = `Registro de Cliente: ${client.name}. 
                               DNI: ${client.dni}. 
                               Contacto: ${client.email || 'N/A'}, Tel: ${client.phone || 'N/A'}. 
                               Casos asociados: ${client.cases.length}.`;
            
            const vector = await generateEmbedding(clientText);
            allPoints.push({
                id: uuidv4(),
                vector,
                payload: {
                    type: 'database_record',
                    model: 'Client',
                    recordId: client.id,
                    text: clientText,
                    lawyerId: client.userId, // Filtro de seguridad
                    metadata: { dni: client.dni, email: client.email }
                }
            });
            logger.info(`Cliente ${client.name} sincronizado`);
        }

        // --- PROCESAR CASOS ---
        for (const c of cases) {
            const caseText = `Expediente Judicial: ${c.title}. 
                             Descripción: ${c.description}. 
                             Estado actual: ${c.status}.`;
            
            const vector = await generateEmbedding(caseText);
            allPoints.push({
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
            });
            logger.info(`Caso ${c.title} sincronizado`);
        }

        // 2. Subida masiva a Qdrant (en lotes si son muchos)
        if (allPoints.length > 0) {
            await qdrant.upsert(config.QDRANT_COLLECTION_NAME, {
                wait: true,
                points: allPoints
            });
            logger.info(`Sincronización completada: ${allPoints.length} registros indexados.`);
        }

    } catch (error) {
        logger.error('Error en sincronización:', error);
    }
};