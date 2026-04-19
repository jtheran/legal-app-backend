import path from 'path'
import fs from 'fs'
import yaml from 'js-yaml'
import config from '../config/config'

// Carga todos los archivos YAML de una carpeta
const loadYamlFiles = (dir: string): Record<string, any> => {
  const result: Record<string, any> = {}
  const fullPath = path.join(__dirname, dir)

  if (!fs.existsSync(fullPath)) return result

  fs.readdirSync(fullPath)
    .filter((file) => file.endsWith('.yaml') || file.endsWith('.yml'))
    .forEach((file) => {
      const content = yaml.load(
        fs.readFileSync(path.join(fullPath, file), 'utf8')
      ) as Record<string, any>
      Object.assign(result, content)
    })

  return result
}

export const buildSwaggerDocument = () => ({
  openapi: '3.0.0',
  info: {
    title: 'Legal App API',
    version: '1.0.0',
    description: 'Documentación de la API de Legal App',
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
    termsOfService: `http://${config.HOST}:${config.PORT}/terms`,
    contact: {
      name: 'Soporte',
      email: config.ADMIN_EMAIL,
    },
  },
  servers: [
    {
      url: `http://${config.HOST}:${config.PORT}/api`,
      description: 'Servidor de desarrollo',
      schemes: ['http'],
    },
    {
      url: `https://${config.HOST}:${config.PORT}/api`,
      description: 'Servidor de producción',
      schemes: ['https'],
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: loadYamlFiles('./schemas'),
    responses: {
      Unauthorized: {
        description: 'Token inválido o expirado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { message: 'No autorizado' },
          },
        },
      },
      NotFound: {
        description: 'Recurso no encontrado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { message: 'Recurso no encontrado' },
          },
        },
      },
      BadRequest: {
        description: 'Datos inválidos',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { message: 'Datos inválidos' },
          },
        },
      },
      InternalError: {
        description: 'Error interno del servidor',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { message: 'Error interno del servidor' },
          },
        },
      },
    },
  },

  security: [{ bearerAuth: [] }],
  paths: loadYamlFiles('./routes'),

})