import { Router } from 'express'
import { getSettings, updateSettings } from '../controllers/settings.controller'
import { isAuth, isAdmin } from '@/middlewares/auth.middleware'

const router = Router()

// Aplicar protección global al módulo de variables críticas
router.use(isAuth, isAdmin)

router.get('/', getSettings)
router.post('/', updateSettings)

export default router