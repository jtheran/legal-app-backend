import express, { Application, RequestHandler } from 'express'
import config from './config/config';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express'
import passport from 'passport';
import './config/passport';
import { swaggerSpec } from './config/swagger'
import { helmetConfig } from './security/helmet.config'
import { corsConfig } from './security/cors.config'
import { xssProtection, hppProtection, mongoSanitization, sanitizeBody } from './security/sanitization'
import { ipBlocker, attachIP } from './security/ipProtection'
import { maintenanceMiddleware } from './middlewares/maintance.middleware'
import documentRoutes from './routes/document.routes';
import auditRoutes from './routes/audit.routes';
import mailRoutes from './routes/mail.routes';
import calendarRoutes from './routes/calendar.routes';
import maintenanceRoutes from './routes/maintenance.routes';
import authRoutes from './routes/auth.routes';
import chatRoutes from './routes/chat.routes';
import caseRoutes from './routes/case.routes';


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
  app.use('/uploads', express.static('uploads'));
  app.use(xssProtection)
  app.use(hppProtection)
  app.use(mongoSanitization)
  app.use(sanitizeBody)
  app.use(morgan('dev'))
  app.use(passport.initialize());
  app.use(maintenanceMiddleware)

  app.use(`${config.API_PREFIX}/auth`, authRoutes);
  app.use(`${config.API_PREFIX}/documents`, documentRoutes);
  app.use(`${config.API_PREFIX}/audit`, auditRoutes);
  app.use(`${config.API_PREFIX}/mail`, mailRoutes);
  app.use(`${config.API_PREFIX}/events`, calendarRoutes);
  app.use(`${config.API_PREFIX}/maintenance`, maintenanceRoutes);
  app.use(`${config.API_PREFIX}/chat`, chatRoutes);
  app.use(`${config.API_PREFIX}/cases`, caseRoutes);


  if (config.NODE_ENV !== 'production') {
    app.use(
      `${config.API_PREFIX}/docs`,
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

    app.get(`${config.API_PREFIX}/docs-json`, (req, res) => {
      res.setHeader('Content-Type', 'application/json')
      res.send(swaggerSpec)
    })
    console.log(`📚 Swagger docs en http://${config.HOST}:${config.PORT}${config.API_PREFIX}/docs`)
  }

return app

}