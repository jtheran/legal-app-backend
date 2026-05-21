import { Router } from 'express';
import { 
  createCase, 
  getCases, 
  getCaseById, 
  updateCase, 
  updateCaseStatus, 
  assignCourt 
} from '../controllers/case.controller';
import { isAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { 
  createCaseSchema
} from '../schemas/case.schemas';

const router = Router();

// Todas las operaciones sobre expedientes requieren autenticación previa
router.use(isAuth);

// Rutas de colección de casos
router.post('/', validate(createCaseSchema), createCase);
router.get('/', getCases);

// Rutas por identificador único
router.get('/:id', getCaseById);
router.put('/:id', updateCase);

// Rutas operacionales específicas (PATCH para actualizaciones parciales atómicas)
router.patch('/:id/status', updateCaseStatus);
router.patch('/:id/assign-court', assignCourt);

export default router;