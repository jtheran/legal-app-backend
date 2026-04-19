import { Router } from 'express';
import { createCase } from '../controllers/case.controller';
import { isAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { createCaseSchema } from '../schemas/case.schema';

const router = Router();

router.post(
  '/', 
  isAuth, 
  validate(createCaseSchema), 
  createCase
);

export default router;