import { initQdrantCollection } from './config/qdrant';
import { connectRedis, redisClient } from './config/redis';
import { runSeed } from './seed/seed';
import { checkInfrastructure } from './utils/healthCheck';
import { runMigrations } from './utils/runMigrations';
import { createApp } from './app';
import { createLimiters } from './security/rateLimiter'
import config from './config/config';

async function startServer() {
  try {
    console.log('🔍 Verificando infraestructura...');
    await connectRedis();
    await runMigrations();
    await checkInfrastructure();
    await runSeed();
    await initQdrantCollection();

    const { globalLimiter, authLimiter } = createLimiters(redisClient)

    const server = createApp({ globalLimiter, authLimiter })

    server.listen(config.PORT, () => {
      console.log(`
        🚀 SERVIDOR LEGAL-AI LISTO
        --------------------------------
        📍 Puerto: ${config.PORT}
        📍 Host: ${config.HOST}
        📂 Archivos: MinIO activo (Puerto 9000)
        🧠 IA: Compatible con LM Studio y modelo ${config.AI_MODEL}
        📚 Docs: http://${config.HOST}:${config.PORT}/api/docs
        📧 Email: ${config.EMAIL_USER}
        --------------------------------
      `);
    });

    console.log('✅ Qdrant: Colección verificada.')

  } catch (error) {
    console.error('❌ Error crítico al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();