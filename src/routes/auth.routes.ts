import { Router } from 'express';
import { login, getProfile, logout, register } from '../controllers/auth.controller';
import { isAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/profile', isAuth, getProfile);
router.get('/logout', isAuth, logout);

export default router;