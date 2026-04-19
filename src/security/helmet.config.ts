import helmet from 'helmet'

export const helmetConfig = helmet({
  // Evita clickjacking
  frameguard: { action: 'deny' },

  // Fuerza HTTPS en producción
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },

  // Evita sniffing de content-type
  noSniff: true,

  // Desactiva la cabecera X-Powered-By
  hidePoweredBy: true,

  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      scriptSrc:  ["'self'"],
      imgSrc:     ["'self'", 'data:', 'https:'],
    },
  },

  // Evita XSS en browsers antiguos
  xssFilter: true,
})