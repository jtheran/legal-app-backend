import xss from 'xss'
import { Request, Response, NextFunction } from 'express'

// ── Sanitiza recursivamente un objeto ────────────────────
const sanitizeValue = (value: any): any => {
  if (typeof value === 'string') {
    return xss(value)
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue)
  }
  if (typeof value === 'object' && value !== null) {
    return sanitizeObject(value)
  }
  return value
}

const sanitizeObject = (obj: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {}
  for (const key of Object.keys(obj)) {
    // Bloquear claves peligrosas de MongoDB y prototype pollution
    const dangerousKeys = [
      '$where', '$regex', '$gt', '$lt', '$gte', '$lte',
      '$in', '$nin', '$ne', '$exists', '$type', '$expr',
      '__proto__', 'constructor', 'prototype',
    ]
    if (dangerousKeys.includes(key)) continue
    result[key] = sanitizeValue(obj[key])
  }
  return result
}

// ── XSS — sanitiza body y params ─────────────────────────
export const xssProtection = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body)
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params) as Record<string, string>
  }
  next()
}

// ── NoSQL injection — elimina operadores de Mongo ────────
export const mongoSanitization = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body)
  }
  next()
}

// ── HPP — evita parámetros duplicados en query string ────
// Ejemplo: ?role=user&role=admin → queda solo el último
export const hppProtection = (req: Request, _res: Response, next: NextFunction) => {
  if (req.query && typeof req.query === 'object') {
    for (const key of Object.keys(req.query)) {
      const value = req.query[key]
      // Si hay duplicados (array), quedarse solo con el último
      if (Array.isArray(value)) {
        (req.query as any)[key] = value[value.length - 1]
      }
    }
  }
  next()
}

// ── Campos peligrosos y tamaño máximo de strings ─────────
export const sanitizeBody = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.body || typeof req.body !== 'object') return next()

  const dangerous = ['$where', '$regex', '__proto__', 'constructor', 'prototype']
  dangerous.forEach((key) => delete req.body[key])

  Object.keys(req.body).forEach((key) => {
    if (typeof req.body[key] === 'string' && req.body[key].length > 5000) {
      req.body[key] = req.body[key].substring(0, 5000)
    }
  })

  next()
}