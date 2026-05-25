import dotenv from 'dotenv'
import { prisma } from './db'
import redisClient from './redis'

dotenv.config()

// Helper interno para parsear strings de la BD a tipos nativos de JS/TS
const parseValue = (val: string) => {
    if (val === 'true') return true
    if (val === 'false') return false
    if (!isNaN(Number(val)) && val.trim() !== '') return Number(val)
    return val
  }
  
  /**
   * Resuelve el valor de una variable en tiempo real.
   * Revisa Redis -> Revisa Postgres -> Cae en el .env (Fallback)
   */
  export const getDynamicConfig = async (key: string, staticDefault: any): Promise<any> => {
    try {
      // 1. Buscar en caché ágil de Redis
      const cachedValue = await redisClient.get(`setting:${key}`)
      if (cachedValue !== null) {
        return parseValue(cachedValue)
      }
  
      // 2. Si no está en Redis, buscar en PostgreSQL
      const dbSetting = await prisma.systemSetting.findUnique({ where: { key } })
      if (dbSetting) {
        await redisClient.set(`setting:${key}`, dbSetting.value)
        return parseValue(dbSetting.value)
      }
    } catch (error) {
      console.error(`[DynamicConfig] Error resolviendo llave "${key}", usando .env de respaldo.`)
    }
  
    // 3. Retorno del valor estático original
    return staticDefault
  }

const config = {
    // 🔒 TOTALMENTE ESTÁTICOS (Inmutables desde la Web por seguridad estructural)
    PORT: process.env.PORT || 4568,
    HOST: process.env.HOST || "localhost",
    NODE_ENV: process.env.NODE_ENV || "development",
    API_PREFIX: process.env.API_PREFIX || "/api/v1",
    RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX) || 100,
    RATE_LIMIT_MAX_AUTH: Number(process.env.RATE_LIMIT_MAX_AUTH) || 3,
    DATABASE_URL: process.env.DATABASE_URL || "postgresql://admin:password123@localhost:5432/legal_db?schema=public",
    LMSTUDIO_URL: process.env.LMSTUDIO_URL || "",
    LMSTUDIO_API_KEY: process.env.LMSTUDIO_API_KEY || "lm-studio",
    AI_MODEL: process.env.AI_MODEL || "",
    AI_MODEL_EMBEDDING: process.env.AI_MODEL_EMBEDDING || "",
    AI_TOKEN: process.env.AI_TOKEN || "",
    AI_BASE_URL: process.env.AI_BASE_URL || "",
    PROMT_SYSTEM: process.env.PROMT_SYSTEM || "",
    QDRANT_URL: process.env.QDRANT_URL || "",
    QDRANT_API_KEY: process.env.QDRANT_API_KEY || "",
    QDRANT_COLLECTION_NAME: process.env.QDRANT_COLLECTION_NAME || "",
    MINIO_ENDPOINT: process.env.MINIO_ENDPOINT || "",
    MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY || "",
    MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY || "",
    MINIO_REGION: process.env.MINIO_REGION || "",
    MINIO_BUCKET_NAME: process.env.MINIO_BUCKET_NAME || "",
    REDIS_URL: process.env.REDIS_URL || "",
    REDIS_PASSWORD: process.env.REDIS_PASSWORD || "",
    REDIS_URL_COMPLETED: process.env.REDIS_URL_COMPLETED || "",
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || "",
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "",
    JWT_SECRET: process.env.JWT_SECRET || "",
    JWT_EXPIRES_IN: Number(process.env.JWT_EXPIRES_IN) || 8 * 60 * 60,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "",
    JWT_REFRESH_EXPIRES_IN: Number(process.env.JWT_REFRESH_EXPIRES_IN) || 24 * 60 * 60,
    EMAIL_HOST: process.env.EMAIL_HOST || "",
    EMAIL_PORT: process.env.EMAIL_PORT || 465,
    EMAIL_USER: process.env.EMAIL_USER || "",
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || "",
    EMAIL_FROM: process.env.EMAIL_FROM || "",
    EMAIL_ENCRYPTION: Boolean(process.env.EMAIL_ENCRYPTION) || false,
    SCRAPPER_JUDITIAL_URL: process.env.SCRAPPER_JUDITIAL_URL || "",

    // 🔄 DINÁMICOS / MODIFICABLES DESDE LA WEB
    // Se consumen de forma asíncrona en tus servicios: await config.getAIModel()
    getRateLimitWindowMs: () => getDynamicConfig('RATE_LIMIT_WINDOW_MS', Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000),
    getRateLimitMax: () => getDynamicConfig('RATE_LIMIT_MAX', Number(process.env.RATE_LIMIT_MAX) || 100),
    getRateLimitMaxAuth: () => getDynamicConfig('RATE_LIMIT_MAX_AUTH', Number(process.env.RATE_LIMIT_MAX_AUTH) || 3),
    
    getLMStudioUrl: () => getDynamicConfig('LMSTUDIO_URL', process.env.LMSTUDIO_URL || ""),
    getLMStudioApiKey: () => getDynamicConfig('LMSTUDIO_API_KEY', process.env.LMSTUDIO_API_KEY || ""),
    getAIModel: () => getDynamicConfig('AI_MODEL', process.env.AI_MODEL || ""),
    getAIModelEmbedding: () => getDynamicConfig('AI_MODEL_EMBEDDING', process.env.AI_MODEL_EMBEDDING || ""),
    getAIToken: () => getDynamicConfig('AI_TOKEN', process.env.AI_TOKEN || ""),
    getAIBaseUrl: () => getDynamicConfig('AI_BASE_URL', process.env.AI_BASE_URL || ""),
    getPromptSystem: () => getDynamicConfig('PROMT_SYSTEM', process.env.PROMT_SYSTEM || ""),

    getEmailHost: () => getDynamicConfig('EMAIL_HOST', process.env.EMAIL_HOST || ""),
    getEmailPort: () => getDynamicConfig('EMAIL_PORT', Number(process.env.EMAIL_PORT) || 465),
    getEmailUser: () => getDynamicConfig('EMAIL_USER', process.env.EMAIL_USER || ""),
    getEmailPassword: () => getDynamicConfig('EMAIL_PASSWORD', process.env.EMAIL_PASSWORD || ""),
    getEmailFrom: () => getDynamicConfig('EMAIL_FROM', process.env.EMAIL_FROM || ""),
    getEmailEncryption: () => getDynamicConfig('EMAIL_ENCRYPTION', String(process.env.EMAIL_ENCRYPTION) === 'true'),
    
    getScrapperJudicialUrl: () => getDynamicConfig('SCRAPPER_JUDITIAL_URL', process.env.SCRAPPER_JUDITIAL_URL || ""),
}

export default config;