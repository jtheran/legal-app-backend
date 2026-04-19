import express, { Application, RequestHandler } from 'express'
import config from './config/config';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './config/swagger'
import { helmetConfig } from './security/helmet.config'
import { corsConfig } from './security/cors.config'
import { xssProtection, hppProtection, mongoSanitization, sanitizeBody } from './security/sanitization'
import { ipBlocker, attachIP } from './security/ipProtection'
import documentRoutes from './routes/document.routes';
import auditRoutes from './routes/audit.routes';


interface AppLimiters {
  globalLimiter: RequestHandler
  authLimiter: RequestHandler
}

export function createApp({ globalLimiter, authLimiter }: AppLimiters): Application {

  const app = express()

  app.use(corsConfig)
  app.use(helmetConfig)
  app.use(ipBlocker)
  app.use(attachIP)
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(xssProtection)
  app.use(hppProtection)
  app.use(mongoSanitization)
  app.use(sanitizeBody)
  app.use(morgan('dev'))

  app.use('/api/documents', documentRoutes);
  app.use('/uploads', express.static('uploads'));
  app.use('/api/audit', auditRoutes);

  if (config.NODE_ENV !== 'production') {
    app.use(
      '/api/docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        customSiteTitle: 'Legal App API Docs',
        customCss: `
          .topbar { display: none }
          .swagger-ui .info { margin: 20px 0 }
        `,
        swaggerOptions: {
          persistAuthorization: true,   // mantiene el token al recargar
          displayRequestDuration: true, // muestra tiempo de respuesta
          filter: true,                 // habilita búsqueda de endpoints
          tryItOutEnabled: true,        // habilita "Try it out" por defecto
        },
      })
    )

    app.get('/api/docs-json', (req, res) => {
      res.setHeader('Content-Type', 'application/json')
      res.send(swaggerSpec)
    })
    console.log(`📚 Swagger docs en http://localhost:${config.PORT}/api/docs`)
  }

return app

}