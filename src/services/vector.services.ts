import { generateEmbedding } from './ai.services';
import { qdrant } from '../config/qdrant';
import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger';
import config from '../config/config';

export const upsertRecordToVector = async (modelName: string, data: any) => {
  try {
    // Generamos el texto descriptivo (usando la lógica de mapeo anterior)
    const text = mapModelToText(modelName, data);
    const embedding = await generateEmbedding(text);

    await qdrant.upsert(config.QDRANT_COLLECTION_NAME, {
      wait: true,
      points: [{
        id: uuidv4(), // O usar un hash del modelName + data.id para evitar duplicados
        vector: embedding,
        payload: {
          type: 'database_record',
          model: modelName,
          recordId: data.id,
          text: text,
          lawyerId: data.userId || data.lawyerId, // Asegurar el filtro de seguridad
          updatedAt: new Date().toISOString()
        }
      }]
    });
    
    logger.info(`Sincronización vectorial inmediata: ${modelName} ID: ${data.id}`);
  } catch (error) {
    logger.error(`Fallo en sync vectorial inmediata para ${modelName}:`, error);
  }
};

// Función auxiliar para construir el texto según el modelo
const mapModelToText = (model: string, d: any): string => {
  if (model === 'Client') return `Cliente: ${d.name}. DNI: ${d.dni}. Contacto: ${d.email || 'N/A'}.`;
  if (model === 'Case') return `Caso: ${d.title}. Descripción: ${d.description}. Estado: ${d.status}.`;
  return JSON.stringify(d);
};