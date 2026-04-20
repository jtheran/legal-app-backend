import { Request, Response } from 'express'
import { calendarService } from '../services/calendar.services'

export const createEvent = async (req: Request, res: Response) => {
  try {
    const user = req.user as any
    const event = await calendarService.create(
      user.id,
      user.email,
      {
        ...req.body,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
      }
    )
    res.status(201).json({ message: 'Evento creado', data: event })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

export const getEvents = async (req: Request, res: Response) => {
  try {
    const user = req.user as any
    const { from, to } = req.query
    const events = await calendarService.getByUser(
      user.id,
      from ? new Date(from as string) : undefined,
      to   ? new Date(to as string)   : undefined
    )
    res.json({ data: events })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

export const getEvent = async (req: Request, res: Response) => {
  try {
    const user = req.user as any
    const event = await calendarService.getById(req.params.id as string, user.id)
    res.json({ data: event })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const user = req.user as any
    const event = await calendarService.update(
      req.params.id as string,
      user.id,
      user.email,
      {
        ...req.body,
        ...(req.body.startDate && { startDate: new Date(req.body.startDate) }),
        ...(req.body.endDate   && { endDate:   new Date(req.body.endDate)   }),
      }
    )
    res.json({ message: 'Evento actualizado', data: event })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const user = req.user as any
    const result = await calendarService.delete(req.params.id as string, user.id)
    res.json(result)
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}

export const cancelEvent = async (req: Request, res: Response) => {
  try {
    const user = req.user as any
    const event = await calendarService.cancel(req.params.id as string, user.id)
    res.json({ message: 'Evento cancelado', data: event })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ message: error.message })
  }
}