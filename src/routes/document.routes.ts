import { Router } from 'express';
import { upload } from '../config/multer';
import { isAuth } from '../middlewares/auth.middleware';
import { uploadDocument } from '../controllers/document.controller';
import { auditAction } from '../middlewares/audit.middleware';

const router = Router();

/**
 * @route POST /api/documents/upload/:caseId
 * @desc Sube un archivo legal, lo guarda localmente y lo indexa en Qdrant
 */
router.post(
    '/upload/:caseId', 
    isAuth,           // 1. Verifica que sea un abogado autenticado
    auditAction('UPLOAD', 'document'),
    upload.single('file'), // 2. Middleware de Multer para guardar en /uploads
    uploadDocument    // 3. Lógica para procesar y responder
);

export default router;