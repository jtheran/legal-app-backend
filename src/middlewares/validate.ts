import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate = (schema: AnyZodObject) => 
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Error de validación",
          errors: error.errors.map(e => ({ path: e.path, message: e.message }))
        });
      }
      return res.status(500).json({ message: "Error interno" });
    }
  };