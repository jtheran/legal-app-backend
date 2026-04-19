import { z } from 'zod';

export const createCaseSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres"),
  description: z.string().optional(),
  folderNumber: z.string().min(1, "El número de expediente es obligatorio"),
  clientId: z.string().uuid("ID de cliente no válido"),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'CLOSED', 'ARCHIVED']).optional()
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;