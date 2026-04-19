import dotenv from 'dotenv'

dotenv.config()

const config = {
    PORT: process.env.PORT || 3000,
    HOST: process.env.HOST || "localhost",
    NODE_ENV: process.env.NODE_ENV || "development",
    RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX) || 100,
    RATE_LIMIT_MAX_AUTH: Number(process.env.RATE_LIMIT_MAX_AUTH) || 3,
    DATABASE_URL: process.env.DATABASE_URL || "postgresql://admin:password123@localhost:5432/legal_db?schema=public",
    LMSTUDIO_URL: process.env.LMSTUDIO_URL || "",
    LMSTUDIO_API_KEY: process.env.LMSTUDIO_API_KEY || "",
    AI_MODEL: process.env.AI_MODEL || "",
    AI_MODEL_EMBEDDING: process.env.AI_MODEL_EMBEDDING || "",
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
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || "",
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "",
    JWT_SECRET: process.env.JWT_SECRET || "",
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "",
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "",
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "",
    EMAIL_HOST: process.env.EMAIL_HOST || "",
    EMAIL_PORT: process.env.EMAIL_PORT || "",
    EMAIL_USER: process.env.EMAIL_USER || "",
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || "",
    EMAIL_FROM: process.env.EMAIL_FROM || "",
    EMAIL_ENCRYPTION: Boolean(process.env.EMAIL_ENCRYPTION) || false,
}

export default config;