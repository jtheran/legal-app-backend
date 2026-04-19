import { Router } from 'express';
import { handleChatQuery } from '../controllers/chat.controller';
import { isAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/query', isAuth, handleChatQuery);

export default router;