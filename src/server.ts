import { initQdrantCollection } from './config/qdrant';
import { connectRedis, redisClient } from './config/redis';
import { runSeed } from './seed/seed';
import { initSocket } from './config/socket';
import { createServer } from 'http'
import { checkInfrastructure } from './utils/healthCheck';
import { runMigrations } from './utils/runMigrations';
import { createApp } from './app';
import { createLimiters } from './security/rateLimiter'
import config from './config/config';
import path from 'path';

async function startServer() {
  try {
    console.log('🔍 Verificando infraestructura...');
    await connectRedis();
    await runMigrations();
    await checkInfrastructure();
    await runSeed();
    await initQdrantCollection();

    const { globalLimiter, authLimiter } = createLimiters(redisClient)

    const app = createApp({ globalLimiter, authLimiter })
    const server = createServer(app)

    initSocket(server)

    server.listen(config.PORT, () => {
      console.log(`
        🚀 SERVIDOR LEGAL-AI LISTO
        --------------------------------
        📍 Puerto: ${config.PORT}
        📍 Host: ${config.HOST}
        📍 Api Prefix: ${config.API_PREFIX}
        📂 Archivos: MinIO activo
        🧠 IA: Compatible con LM Studio y modelo ${config.AI_MODEL}
        📚 Docs: Activa
        📧 Email: ${config.EMAIL_FROM}
        📅 Eventos: Activos
        🔌 WebSocket: Activo
        ⏰ Workers: Activos
        📊 Rate Limit: ${config.RATE_LIMIT_MAX} requests cada ${config.RATE_LIMIT_WINDOW_MS / 60000} minutos
        📁 Logs: ${path.join(__dirname, 'logs')}
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