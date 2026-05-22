import { Router } from 'express';
import { getCourts, getCourtById, createCourt, updateCourt, deactivateCourt } from '../controllers/court.controller';
import { isAuth, isAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Todos los endpoints requieren token válido de sesión
router.use(isAuth);

router.route('/')
  .get(getCourts)                  // Cualquier rol autenticado puede listar
  .post(isAdmin, createCourt);     // Restringido a administradores

router.route('/:id')
  .get(getCourtById)               // Cualquier rol autenticado puede consultar detalles
  .put(isAdmin, updateCourt);      // Restringido a administradores

// Endpoint para el control de disponibilidad
router.patch('/:id/deactivate', isAdmin, deactivateCourt);

export default router;