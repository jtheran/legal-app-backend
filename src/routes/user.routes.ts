import { Router } from 'express';
import { getUsers, getUserById, createUser, updateUser, deactivateUser } from '../controllers/user.controller';
import { isAuth, isAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas de gestión de usuarios requieren autenticación de administrador
router.use(isAuth, isAdmin);

router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .get(getUserById)
  .put(updateUser);

// Endpoint explícito para cambiar el estado a inactivo
router.patch('/:id/deactivate', deactivateUser);

export default router;