import { Router } from 'express';
import { triggerManualSync } from '../controllers/sync.controller';
import { isAuth, isAdmin } from '../middlewares/auth.middleware'; 


const router = Router();

router.get('/vectors', isAuth, isAdmin, triggerManualSync);

export default router;