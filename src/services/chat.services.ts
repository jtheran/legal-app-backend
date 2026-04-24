import { qdrant } from '../config/qdrant';
import redisClient from '../config/redis';
import config from '../config/config';
import { generateEmbedding, askLegalChatbot } from './ai.services';

export const getChatResponse = async (query: string, userId: string, caseId?: string) => {
    // 1. COMPROBAR CACHE PRIMERO
    const cacheKey = `chat:${userId}:${query}:${caseId || 'all'}`;
    const cachedAnswer = await redisClient.get(cacheKey);

    if (cachedAnswer) {
        console.log("Servido desde Redis Cache");
        return JSON.parse(cachedAnswer);
    }

    // 2. PROCESO RAG (Si no está en cache)
    const queryVector = await generateEmbedding(query);

    const searchFilter: any = {
        must: [
            { key: 'userId', match: { value: userId } }
        ]
    };

    if (caseId) {
        searchFilter.must.push({ key: 'caseId', match: { value: caseId } });
    }

    const searchResults = await qdrant.search(config.QDRANT_COLLECTION_NAME, {
        vector: queryVector,
        filter: searchFilter,
        limit: 5,
        with_payload: true
    });

    const context = searchResults
        .map(result => (result.payload as any).text)
        .join("\n\n---\n\n");

    if (!context) {
        return { answer: "No encontré información relevante en los documentos.", sources: [] };
    }

    // 3. IA GENERATIVA
    const aiResponse = await askLegalChatbot(query, context);

    const result = {
        answer: aiResponse,
        sources: searchResults.map(r => ({
            text: (r.payload as any).text,
            fileName: (r.payload as any).fileName,
            score: r.score
        }))
    };

    // 4. GUARDAR EN CACHE AHORA QUE YA TENEMOS EL RESULTADO
    // Lo guardamos por 1 hora (3600 segundos)
    await redisClient.set(cacheKey, JSON.stringify(result), { EX: 3600 });

    return result;
};