import { Queue, Worker, Job } from 'bullmq'
import { prisma } from '../config/db'
import { notificationService } from '../services/notification.services'
import { emailQueue } from './mail.queue'
import IORedis from 'ioredis';
import config from '../config/config'

const connection = new IORedis(
    config.REDIS_URL_COMPLETED, {
    maxRetriesPerRequest: null,
    }
);

// Cola de recordatorios de eventos
export const calendarQueue = new Queue('calendar-reminders', { connection })

interface ReminderJobData {
  eventId: string
  userId: string
  userEmail: string
  title: string
  startDate: string
  type: 'TWO_HOURS' | 'SAME_DAY'
}

// Worker que procesa los recordatorios
export const initCalendarWorker = () => {
  new Worker<ReminderJobData>(
    'calendar-reminders',
    async (job: Job<ReminderJobData>) => {
      const { eventId, userId, userEmail, title, startDate, type } = job.data

      // Verificar que el evento aún existe y no fue cancelado
      const event = await prisma.calendarEvent.findUnique({
        where: { id: eventId },
      })

      if (!event || event.status === 'CANCELLED') {
        console.log(`⏭️ Evento ${eventId} cancelado, omitiendo recordatorio`)
        return
      }

      const isToday = type === 'SAME_DAY'
      const notifTitle = isToday
        ? `📅 Hoy tienes: ${title}`
        : `⏰ En 2 horas: ${title}`

      const notifMessage = isToday
        ? `Tu evento "${title}" comienza hoy a las ${new Date(startDate).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`
        : `Tu evento "${title}" comienza en 2 horas (${new Date(startDate).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })})`

      // 1. Crear notificación en BD + emitir por WebSocket
      await notificationService.create({
        userId,
        title: notifTitle,
        message: notifMessage,
        type: isToday ? 'EVENT_TODAY' : 'EVENT_REMINDER',
        resourceId: eventId,
      })

      // 2. Enviar email (opcional)
      await emailQueue.add('sendEventReminder', {
        to: userEmail,
        subject: notifTitle,
        html: `
          <h2>${notifTitle}</h2>
          <p>${notifMessage}</p>
          <p><a href="${process.env.APP_URL}/calendar/${eventId}">Ver evento</a></p>
        `,
      })

      // 3. Marcar recordatorio como enviado
      await prisma.eventNotification.updateMany({
        where: { eventId, type },
        data: { sent: true, sentAt: new Date() },
      })

      console.log(`✅ Recordatorio ${type} enviado para evento ${eventId}`)
    },
    { connection }
  )

  console.log('✅ Worker de calendario iniciado')
}

// Agenda los jobs con delay calculado
export const scheduleEventReminders = async (
  eventId: string,
  userId: string,
  userEmail: string,
  title: string,
  startDate: Date
) => {
  const now = Date.now()
  const eventTime = startDate.getTime()

  // ── Recordatorio 2 horas antes ───────────────────────
  const twoHoursBefore = eventTime - 2 * 60 * 60 * 1000
  if (twoHoursBefore > now) {
    await calendarQueue.add(
      'reminder-two-hours',
      { eventId, userId, userEmail, title, startDate: startDate.toISOString(), type: 'TWO_HOURS' },
      {
        delay: twoHoursBefore - now,
        jobId: `two-hours:${eventId}`,  // jobId único para poder cancelarlo
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      }
    )
    console.log(`⏰ Recordatorio 2h agendado para evento ${eventId}`)
  }

  // ── Recordatorio el mismo día (8am del día del evento) ──
  const sameDayAt8am = new Date(startDate)
  sameDayAt8am.setHours(6, 0, 0, 0)
  const sameDayDelay = sameDayAt8am.getTime() - now

  if (sameDayDelay > 0) {
    await calendarQueue.add(
      'reminder-same-day',
      { eventId, userId, userEmail, title, startDate: startDate.toISOString(), type: 'SAME_DAY' },
      {
        delay: sameDayDelay,
        jobId: `same-day:${eventId}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      }
    )
    console.log(`📅 Recordatorio día-del-evento agendado para ${eventId}`)
  }
}

// Cancelar jobs cuando se elimina o cancela un evento
export const cancelEventReminders = async (eventId: string) => {
  await calendarQueue.remove(`two-hours:${eventId}`)
  await calendarQueue.remove(`same-day:${eventId}`)
  console.log(`🗑️ Recordatorios cancelados para evento ${eventId}`)
}