import { prisma } from '../config/db'
import {
  scheduleEventReminders,
  cancelEventReminders,
} from '../queues/calendar.queue'

export interface CreateEventDto {
  title: string
  description?: string
  startDate: Date
  endDate: Date
  allDay?: boolean
  location?: string
  color?: string
  type?: string
}

export interface UpdateEventDto extends Partial<CreateEventDto> {
  status?: string
}

export class CalendarService {

  async create(userId: string, userEmail: string, dto: CreateEventDto) {
    const event = await prisma.calendarEvent.create({
      data: {
        ...dto,
        userId,
        notifications: {
          create: [
            { type: 'TWO_HOURS' },
            { type: 'SAME_DAY'  },
          ],
        },
      },
      include: { notifications: true },
    })

    // Agendar recordatorios en BullMQ
    await scheduleEventReminders(
      event.id,
      userId,
      userEmail,
      event.title,
      event.startDate
    )

    return event
  }

  async update(id: string, userId: string, userEmail: string, dto: UpdateEventDto) {
    // Verificar que el evento pertenece al usuario
    const existing = await prisma.calendarEvent.findFirst({
      where: { id, userId },
    })
    if (!existing) throw { statusCode: 404, message: 'Evento no encontrado' }

    const event = await prisma.calendarEvent.update({
      where: { id },
      data: dto,
    })

    // Si cambió la fecha, reagendar recordatorios
    if (dto.startDate) {
      await cancelEventReminders(id)

      // Resetear notificaciones
      await prisma.eventNotification.updateMany({
        where: { eventId: id },
        data: { sent: false, sentAt: null },
      })

      await scheduleEventReminders(
        id,
        userId,
        userEmail,
        event.title,
        event.startDate
      )
    }

    return event
  }

  async delete(id: string, userId: string) {
    const existing = await prisma.calendarEvent.findFirst({
      where: { id, userId },
    })
    if (!existing) throw { statusCode: 404, message: 'Evento no encontrado' }

    // Cancelar jobs pendientes
    await cancelEventReminders(id)

    await prisma.calendarEvent.delete({ where: { id } })
    return { message: 'Evento eliminado correctamente' }
  }

  async getById(id: string, userId: string) {
    const event = await prisma.calendarEvent.findFirst({
      where: { id, userId },
      include: { notifications: true },
    })
    if (!event) throw { statusCode: 404, message: 'Evento no encontrado' }
    return event
  }

  async getByUser(userId: string, from?: Date, to?: Date) {
    return prisma.calendarEvent.findMany({
      where: {
        userId,
        status: { not: 'CANCELLED' },
        ...(from && to && {
          startDate: { gte: from, lte: to },
        }),
      },
      orderBy: { startDate: 'asc' },
      include: { notifications: true },
    })
  }

  async cancel(id: string, userId: string) {
    const existing = await prisma.calendarEvent.findFirst({
      where: { id, userId },
    })
    if (!existing) throw { statusCode: 404, message: 'Evento no encontrado' }

    await cancelEventReminders(id)

    return prisma.calendarEvent.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })
  }
}

export const calendarService = new CalendarService()