import { Request, Response } from 'express';
import { processDocumentFromS3 } from '../services/ingestion.services';
import { createAuditLog } from '../services/audit.services';

export const uploadDocument = async (req: Request, res: Response) => {
    try {
        const file = req.file as any;
        // Forzamos a que caseId sea tratado como string
        const { radicado } = req.body as { radicado: string }; 
        const user = req.user as any;

        if (!file) return res.status(400).json({ message: 'No se subió archivo' });

        // file.key y file.originalname también podrían dar problemas si TS no está seguro
        const document = await processDocumentFromS3(
            file.key as string, 
            file.originalname as string, 
            radicado, 
            user.id as string
        );
        await createAuditLog({
            userId: user.id,
            description: `Subió el documento ${document.name} al caso ${radicado}`,
            action: 'UPLOAD',
            resource: 'Document',
            userAgent: 'Minio',
            status: 'SUCCESS',
        });
        res.status(201).json(document);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al subir a MinIO" });
    }
};