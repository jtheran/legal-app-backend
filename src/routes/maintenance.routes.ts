import { Router } from 'express'
import {
  enableMaintenance,
  disableMaintenance,
  getMaintenanceStatus,
  getStats,
} from '../controllers/maintenance.controller'
import { isAuth, isAdmin } from '../middlewares/auth.middleware'

const router = Router()

// Status es público — el frontend puede consultarlo siempre
router.get('/status', getMaintenanceStatus)

// El resto solo admins
router.post('/enable',  isAuth, isAdmin, enableMaintenance)
router.post('/disable', isAuth, isAdmin, disableMaintenance)
router.get('/stats',    isAuth, isAdmin, getStats)

export default router