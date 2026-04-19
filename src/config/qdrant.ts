import { QdrantClient } from '@qdrant/js-client-rest';
import config from './config';

export const qdrant = new QdrantClient({ 
    url: config.QDRANT_URL, 
    apiKey: config.QDRANT_API_KEY
});

/**
 * Función para asegurar que la colección exista al iniciar el servidor.
 * En Qdrant, necesitamos definir la dimensión del vector (depende del modelo de LM Studio).
 */
export const initQdrantCollection = async () => {
    const collectionName = config.QDRANT_COLLECTION_NAME;
    const collections = await qdrant.getCollections();
    
    const exists = collections.collections.some(c => c.name === collectionName);

    if (!exists) {
        await qdrant.createCollection(collectionName, {
            vectors: {
                size: 768, // AJUSTA ESTO: 768 para Nomic, 1536 para OpenAI, etc.
                distance: "Cosine"
            }
        });
        console.log(`✅ Qdrant: Colección '${collectionName}' creada exitosamente.`);
    }
};