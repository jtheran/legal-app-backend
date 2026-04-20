import { Router } from 'express';
import { sendIndividualEmail, sendMassiveEmail } from '../controllers/mail.controller';
import { isAuth, isAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Endpoint para envíos manuales (requiere estar logueado)
router.post('/send', isAuth, sendIndividualEmail);

// Endpoint masivo (SOLO ADMIN)
router.post('/send-massive', isAuth, isAdmin, sendMassiveEmail);

export default router;