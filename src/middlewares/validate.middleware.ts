import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: 'Datos inválidos',
          errors: error.issues.map((e) => ({
            field:   e.path.join('.'),
            message: e.message,
          })),
        })
      }
      next(error)
    }
  }