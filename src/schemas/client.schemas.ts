import { z } from 'zod'

const phoneRegex = /^(\+57|57)?[0-9]{10}$/
const dniRegex   = /^[0-9]{6,12}$/

export const createClientSchema = z.object({
  name: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede superar 100 caracteres'),

  type: z
    .string()
    .max(10, 'El tipo no puede superar 10 caracteres')
    .default('NATURAL'),

  companyName: z
    .string()
    .min(3, 'El nombre de la empresa debe tener al menos 3 caracteres')
    .max(150, 'El nombre de la empresa no puede superar 150 caracteres')
    .optional(),

  dni: z
    .string()
    .regex(dniRegex, 'La cédula debe contener entre 6 y 12 dígitos'),

  email: z
    .string()
    .email('El correo electrónico no es válido')
    .toLowerCase(),

  phone: z
    .string()
    .regex(phoneRegex, 'El teléfono debe ser un número colombiano válido de 10 dígitos'),

  address: z
    .string()
    .min(5, 'La dirección debe tener al menos 5 caracteres')
    .max(200, 'La dirección no puede superar 200 caracteres'),

  city: z
    .string()
    .min(2, 'La ciudad debe tener al menos 2 caracteres')
    .default('Cartagena'),

  state: z
    .string()
    .min(2, 'El departamento debe tener al menos 2 caracteres')
    .default('Bolivar'),

  country: z
    .string()
    .default('Colombia'),

  userId: z
    .string()
    .uuid('ID de abogado no válido'),

}).refine(
  (data) => {
    // Si es persona jurídica, companyName es obligatorio
    if (data.type === 'JURIDICA' && !data.companyName) return false
    return true
  },
  {
    message: 'El nombre de la empresa es obligatorio para personas jurídicas',
    path: ['companyName'],
  }
)

export const updateClientSchema = createClientSchema
  .partial()
  .omit({ dni: true })
  .extend({
    dni: z
      .string()
      .regex(dniRegex, 'La cédula debe contener entre 6 y 12 dígitos')
      .optional(),
  })

export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>