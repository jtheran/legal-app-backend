import swaggerUi from 'swagger-ui-express'
import { buildSwaggerDocument } from '../docs/index'

export const swaggerSpec = buildSwaggerDocument()