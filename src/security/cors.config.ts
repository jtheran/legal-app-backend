import cors from 'cors'
import config from '../config/config'

const allowedOrigins = config.NODE_ENV === 'production'
  ? [
      'https://tuapp.com',
      'https://app.tuapp.com',
    ]
  : [
      'http://localhost:4589',
      'http://localhost:4568',
    ]

export const corsConfig = cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (Postman, mobile apps)
    if (!origin) return callback(null, true)

    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS: Origen no permitido → ${origin}`))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Total-Count', 'X-Request-ID'],
  maxAge: 86400, // cachear preflight 24 horas
})