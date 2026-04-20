import { z } from 'zod'

const phoneRegex = /^(\+57|57)?[0-9]{10}$/

const CourtTypeEnum = z.enum([
  'CIVIL',
  'PENAL',
  'LABORAL',
  'FAMILIA',
  'ADMINISTRATIVO',
  'COMERCIAL',
  'CONSTITUCIONAL',
]).array().or(z.string()).superRefine((val, ctx) => {
    if (val.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El tipo de juzgado no puede estar vacío', 
      })
    }
});

export const createCourtSchema = z.object({
  name: z
    .string()
    .min(5, 'El nombre del juzgado debe tener al menos 5 caracteres')
    .max(150, 'El nombre no puede superar 150 caracteres'),

  type: CourtTypeEnum,

  judgeName: z
    .string()
    .min(3, 'El nombre del juez debe tener al menos 3 caracteres')
    .max(100, 'El nombre del juez no puede superar 100 caracteres')
    .optional(),

  judgePhone: z
    .string()
    .regex(phoneRegex, 'El teléfono del juez debe ser un número colombiano válido')
    .optional(),

  judgeEmail: z
    .string()
    .email('El correo del juez no es válido')
    .toLowerCase()
    .optional(),

  city: z
    .string()
    .min(2, 'La ciudad debe tener al menos 2 caracteres')
    .max(100, 'La ciudad no puede superar 100 caracteres'),

  state: z
    .string()
    .min(2, 'El departamento debe tener al menos 2 caracteres')
    .max(100, 'El departamento no puede superar 100 caracteres'),

  country: z
    .string()
    .default('Colombia'),

  address: z
    .string()
    .min(5, 'La dirección debe tener al menos 5 caracteres')
    .max(200, 'La dirección no puede superar 200 caracteres')
    .optional(),

  email: z
    .string()
    .email('El correo del juzgado no es válido')
    .toLowerCase()
    .optional(),

  isActive: z
    .boolean()
    .default(true),

 notes: z.record(
    z.string(), 
    z.unknown()
  ).optional(),
})

export const updateCourtSchema = createCourtSchema.partial()


export type CreateCourtInput = z.infer<typeof createCourtSchema>
export type UpdateCourtInput = z.infer<typeof updateCourtSchema>