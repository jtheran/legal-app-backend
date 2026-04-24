import { GetObjectCommand } from "@aws-sdk/client-s3";
import config from '../config/config';
import { s3Client } from '../config/s3Client';
import { prisma } from '../config/db';
import { generateEmbedding } from './ai.services';
import { qdrant } from '../config/qdrant';
import { v4 as uuidv4 } from 'uuid';
import mammoth from 'mammoth';
const pdf = require('pdf-parse');

export const processDocumentFromS3 = async (fileKey: string, fileName: string, caseId: string, userId: string) => {
    // 1. Obtener el objeto de MinIO
    const command = new GetObjectCommand({
        Bucket: config.MINIO_BUCKET_NAME,
        Key: fileKey,
    });

    const response = await s3Client.send(command);
    
    // Transformar el stream de S3 a un Buffer para que pdf-parse pueda leerlo
    const streamToBuffer = (stream: any): Promise<Buffer> =>
        new Promise((resolve, reject) => {
            const chunks: any[] = [];
            stream.on("data", (chunk: any) => chunks.push(chunk));
            stream.on("error", reject);
            stream.on("end", () => resolve(Buffer.concat(chunks)));
        });

    const fileBuffer = await streamToBuffer(response.Body);

    // 2. Extraer el texto legal
    const data = await pdf(fileBuffer);
    let fullText = '';
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    if (fileExtension === 'pdf') {
        const data = await pdf(fileBuffer);
        fullText = data.text;
    } else if (fileExtension === 'docx') {
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        fullText = result.value;
        fullText = fullText.replace(/\n\s*\n/g, '\n'); // Elimina espacios en blanco excesivos
    } else if (fileExtension === 'txt') {
        fullText = fileBuffer.toString('utf-8');
    } else {
        throw new Error(`Tipo de archivo no soportado: ${fileExtension}`);
    }

    // 3. Registrar en la base de datos (PostgreSQL)
    const docRecord = await prisma.document.create({
        data: {
            name: fileName,
            url: fileKey,
            caseId: caseId,
            userId,
            type: fileExtension,
            size: fileBuffer.length,
            
        }
    });

    // 4. Fragmentar texto (Chunking) y enviar a LM Studio + Qdrant
    const chunks = chunkText(fullText, 1000, 200);

    const points = await Promise.all(chunks.map(async (text, index) => {
        // Genera el vector usando tu modelo local en LM Studio
        const embedding = await generateEmbedding(text);
        
        return {
            id: uuidv4(),
            vector: embedding,
            payload: {
                text,
                documentId: docRecord.id,
                lawyerId: userId, // Filtro esencial de seguridad
                caseId: caseId,
                fileName: fileName
            }
        };
    }));

    // Subir los vectores a la base de datos vectorial
    await qdrant.upsert('legal_documents', {
        wait: true,
        points: points
    });

    return docRecord;
};

// Función de fragmentación (evita cortar palabras a la mitad)
const chunkText = (text: string, size: number, overlap: number) => {
    const chunks = [];
    for (let i = 0; i < text.length; i += size - overlap) {
        chunks.push(text.slice(i, i + size));
    }
    return chunks;
};