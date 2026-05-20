import aiClient from '../config/ia';
import embeddingClient from '../config/embedding';
import config from '../config/config';

export const generateEmbedding = async (text: string) => {
    const response = await embeddingClient.embeddings.create({
        model: config.AI_MODEL_EMBEDDING, // Asegúrate de tener un modelo de embedding cargado
        input: text,
    });
    return response.data[0].embedding;
};

export const askLegalChatbot = async (prompt: string, context: string) => {
    const response = await aiClient.chat.completions.create({
        model: config.AI_MODEL,
        messages: [
            { 
                role: "system", 
                content: config.PROMT_SYSTEM 
            },
            { 
                role: "user", 
                content: `Contexto: ${context}\n\nPregunta: ${prompt}` 
            }
        ],
        temperature: 0.1, // Baja temperatura para mayor precisión legal
        max_tokens: 512,
        top_p: 0.70,
        stream: false,
    });

    return response.choices[0].message.content;
};