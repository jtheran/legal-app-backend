import { Router } from 'express';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../controllers/notification.controller';
import { isAuth } from '../middlewares/auth.middleware';

const router = Router();

router.use(isAuth);

router.route('/')
  .get(getNotifications);

// Ruta masiva antes de la ruta parametrizada para evitar colisiones en Express
router.patch('/mark-all-read', markAllAsRead);

router.route('/:id')
  .patch(markAsRead)
  .delete(deleteNotification);

export default router;