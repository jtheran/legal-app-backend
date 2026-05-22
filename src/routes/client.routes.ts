import { Router } from 'express';
import { getClients, getClientById, createClient, updateClient, deleteClient } from '../controllers/client.controller';
import { isAuth } from '../middlewares/auth.middleware';

const router = Router();

// Todos los endpoints de clientes requieren inicio de sesión válido
router.use(isAuth);

router.route('/')
  .get(getClients)
  .post(createClient);

router.route('/:id')
  .get(getClientById)
  .put(updateClient)
  .delete(deleteClient);

export default router;