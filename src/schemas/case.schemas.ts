import { z } from 'zod'

const CaseStatusEnum = z.enum(
  [
    'OPEN', 
    'IN_PROGRESS', 
    'CLOSED', 
    'ARCHIVED'
  ]).array().or(z.string()).superRefine((val, ctx) => {
    if (val.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El estado del caso no puede estar vacío',
      })
    }
});

export const createCaseSchema = z.object({
  title: z
    .string()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(200, 'El título no puede superar 200 caracteres'),

  description: z
    .string()
    .max(2000, 'La descripción no puede superar 2000 caracteres')
    .optional(),

  folderNumber: z
    .string()
    .min(1, 'El número de expediente es obligatorio')
    .max(50, 'El número de expediente no puede superar 50 caracteres')
    .regex(
      /^[a-zA-Z0-9\-_/]+$/,
      'El número de expediente solo puede contener letras, números, guiones y barras'
    ),

  clientId: z
    .string()
    .uuid('ID de cliente no válido'),

  courtId: z
    .string()
    .uuid('ID de juzgado no válido')
    .optional(),

  userId: z
    .string()
    .uuid('ID de abogado no válido'),

  status: CaseStatusEnum.default('OPEN'),
})

export const updateCaseSchema = createCaseSchema
  .partial()
  .omit({ folderNumber: true })  // El número de expediente no se puede cambiar
  .extend({
    folderNumber: z
      .string()
      .min(1, 'El número de expediente es obligatorio')
      .max(50, 'El número de expediente no puede superar 50 caracteres')
      .regex(
        /^[a-zA-Z0-9\-_/]+$/,
        'El número de expediente solo puede contener letras, números, guiones y barras'
      )
      .optional(),
  })

export const updateCaseStatusSchema = z.object({
  status: CaseStatusEnum,
})

export const assignCourtSchema = z.object({
  courtId: z
    .string()
    .uuid('ID de juzgado no válido'),
})

export type CreateCaseInput  = z.infer<typeof createCaseSchema>
export type UpdateCaseInput  = z.infer<typeof updateCaseSchema>
export type UpdateCaseStatus = z.infer<typeof updateCaseStatusSchema>
export type AssignCourt      = z.infer<typeof assignCourtSchema>