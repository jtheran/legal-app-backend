import { Router } from 'express'
import {
  createEvent, getEvents, getEvent,
  updateEvent, deleteEvent, cancelEvent,
} from '../controllers/calendar.controller'
import { isAuth } from '../middlewares/auth.middleware'

const router = Router()

router.use(isAuth) // todas las rutas requieren auth

router.post('/',              createEvent)
router.get('/',               getEvents)
router.get('/:id',            getEvent)
router.put('/:id',            updateEvent)
router.delete('/:id',         deleteEvent)
router.patch('/:id/cancel',   cancelEvent)

export default router